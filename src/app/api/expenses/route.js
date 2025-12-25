import { NextResponse } from 'next/server';
import { query, queryOne, insert, run, transaction, getDb } from '@/lib/db/index.js';

// GET /api/expenses - List expenses
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');
        const userId = searchParams.get('userId') || 1;
        const limit = parseInt(searchParams.get('limit') || '50');

        let expenses;

        if (groupId) {
            expenses = query(`
        SELECT 
          e.*,
          u.name as payer_name,
          u.avatar_url as payer_avatar,
          g.name as group_name
        FROM expenses e
        JOIN users u ON e.payer_id = u.id
        LEFT JOIN groups g ON e.group_id = g.id
        WHERE e.group_id = ?
        ORDER BY e.date DESC, e.created_at DESC
        LIMIT ?
      `, [groupId, limit]);
        } else {
            // Get all expenses the user is involved in
            expenses = query(`
        SELECT DISTINCT
          e.*,
          u.name as payer_name,
          u.avatar_url as payer_avatar,
          g.name as group_name
        FROM expenses e
        JOIN users u ON e.payer_id = u.id
        LEFT JOIN groups g ON e.group_id = g.id
        LEFT JOIN expense_splits es ON e.id = es.expense_id
        WHERE e.payer_id = ? OR es.user_id = ?
        ORDER BY e.date DESC, e.created_at DESC
        LIMIT ?
      `, [userId, userId, limit]);
        }

        // Get splits for each expense
        for (const expense of expenses) {
            expense.splits = query(`
        SELECT es.*, u.name as user_name, u.avatar_url
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        WHERE es.expense_id = ?
      `, [expense.id]);
        }

        return NextResponse.json({ expenses });

    } catch (error) {
        console.error('Expenses GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/expenses - Create new expense with splits
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            group_id,
            payer_id = 1,
            amount,
            currency = 'GBP',
            description,
            date,
            category = 'General',
            splits = [],  // Array of { user_id, owed_share }
            split_equally = true,
            participant_ids = []
        } = body;

        if (!amount || !description) {
            return NextResponse.json(
                { error: 'Amount and description are required' },
                { status: 400 }
            );
        }

        const expenseDate = date || new Date().toISOString().split('T')[0];

        const result = transaction(() => {
            const db = getDb();

            // Insert expense
            const expenseId = insert(
                `INSERT INTO expenses (group_id, payer_id, amount, currency, description, date, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [group_id || null, payer_id, amount, currency, description, expenseDate, category]
            );

            // Calculate splits
            let calculatedSplits = splits;

            if (split_equally && participant_ids.length > 0) {
                const shareAmount = amount / participant_ids.length;
                calculatedSplits = participant_ids.map(uid => ({
                    user_id: uid,
                    owed_share: shareAmount
                }));
            }

            if (calculatedSplits.length === 0) {
                throw new Error('At least one split participant is required');
            }

            // Insert splits and update debts
            const insertSplit = db.prepare(
                'INSERT INTO expense_splits (expense_id, user_id, owed_share) VALUES (?, ?, ?)'
            );

            const upsertDebt = db.prepare(`
        INSERT INTO debts (payer_id, payee_id, amount, group_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(payer_id, payee_id, group_id) 
        DO UPDATE SET amount = amount + excluded.amount
      `);

            const insertNotification = db.prepare(
                'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)'
            );

            for (const split of calculatedSplits) {
                // Insert split record
                insertSplit.run(expenseId, split.user_id, split.owed_share);

                // Update debt ledger if not the payer
                if (split.user_id !== payer_id) {
                    // Normalize: always store with lower ID first
                    const [id1, id2] = payer_id < split.user_id
                        ? [payer_id, split.user_id]
                        : [split.user_id, payer_id];

                    // If payer is id1, split.user_id owes payer, so positive
                    // If payer is id2, payer paid for id1, so id1 owes payer (id2), store as negative
                    const adjustment = payer_id < split.user_id
                        ? split.owed_share
                        : -split.owed_share;

                    upsertDebt.run(id1, id2, adjustment, group_id || null);

                    // Notify the borrower
                    insertNotification.run(
                        split.user_id,
                        `${body.payer_name || 'Someone'} added "${description}" - you owe ${currency} ${split.owed_share.toFixed(2)}`,
                        'expense_added',
                        expenseId
                    );
                }
            }

            // Log activity
            const groupName = group_id
                ? db.prepare('SELECT name FROM groups WHERE id = ?').get(group_id)?.name
                : 'personal';

            run(
                'INSERT INTO activity_log (user_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                [payer_id, 'create', 'expense', expenseId, `added "${description}" in ${groupName}`]
            );

            return expenseId;
        });

        // Return the created expense
        const expense = queryOne('SELECT * FROM expenses WHERE id = ?', [result]);
        expense.splits = query(
            'SELECT es.*, u.name as user_name FROM expense_splits es JOIN users u ON es.user_id = u.id WHERE es.expense_id = ?',
            [result]
        );

        return NextResponse.json({ expense }, { status: 201 });

    } catch (error) {
        console.error('Expenses POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/expenses - Delete an expense
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const expenseId = searchParams.get('id');
        const userId = searchParams.get('userId') || 1;

        if (!expenseId) {
            return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
        }

        // Get expense details before deleting
        const expense = queryOne('SELECT * FROM expenses WHERE id = ?', [expenseId]);
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        transaction(() => {
            const db = getDb();

            // Get splits to reverse debt calculations
            const splits = query('SELECT * FROM expense_splits WHERE expense_id = ?', [expenseId]);

            const upsertDebt = db.prepare(`
        INSERT INTO debts (payer_id, payee_id, amount, group_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(payer_id, payee_id, group_id) 
        DO UPDATE SET amount = amount + excluded.amount
      `);

            // Reverse each debt
            for (const split of splits) {
                if (split.user_id !== expense.payer_id) {
                    const [id1, id2] = expense.payer_id < split.user_id
                        ? [expense.payer_id, split.user_id]
                        : [split.user_id, expense.payer_id];

                    // Reverse the original adjustment
                    const reversal = expense.payer_id < split.user_id
                        ? -split.owed_share
                        : split.owed_share;

                    upsertDebt.run(id1, id2, reversal, expense.group_id);
                }
            }

            // Delete expense (cascades to splits)
            run('DELETE FROM expenses WHERE id = ?', [expenseId]);

            // Log activity
            run(
                'INSERT INTO activity_log (user_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                [userId, 'delete', 'expense', expenseId, `deleted "${expense.description}"`]
            );
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Expenses DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
