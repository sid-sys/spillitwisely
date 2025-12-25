import { NextResponse } from 'next/server';
import { query, queryOne, insert, run, transaction, getDb } from '@/lib/db/index.js';

// GET /api/debts - Get debts/balances for a user
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = parseInt(searchParams.get('userId') || '1');
        const groupId = searchParams.get('groupId');

        let debts;

        if (groupId) {
            // Get debts within a specific group
            debts = query(`
        SELECT 
          d.*,
          u1.name as payer_name,
          u1.avatar_url as payer_avatar,
          u2.name as payee_name,
          u2.avatar_url as payee_avatar
        FROM debts d
        JOIN users u1 ON d.payer_id = u1.id
        JOIN users u2 ON d.payee_id = u2.id
        WHERE d.group_id = ? AND (d.payer_id = ? OR d.payee_id = ?)
          AND d.amount != 0
      `, [groupId, userId, userId]);
        } else {
            // Get all debts for user
            debts = query(`
        SELECT 
          d.*,
          u1.name as payer_name,
          u1.avatar_url as payer_avatar,
          u2.name as payee_name,
          u2.avatar_url as payee_avatar,
          g.name as group_name
        FROM debts d
        JOIN users u1 ON d.payer_id = u1.id
        JOIN users u2 ON d.payee_id = u2.id
        LEFT JOIN groups g ON d.group_id = g.id
        WHERE (d.payer_id = ? OR d.payee_id = ?)
          AND d.amount != 0
      `, [userId, userId]);
        }

        // Calculate totals
        let totalOwed = 0;  // What user owes others
        let totalOwing = 0; // What others owe user

        const processed = debts.map(debt => {
            // Interpret the debt from user's perspective
            // If user is payer_id and amount is positive, payee owes user
            // If user is payee_id and amount is positive, user owes payer
            let direction, amount, other_user_id, other_user_name, other_user_avatar;

            if (debt.payer_id === userId) {
                // User is stored as payer
                if (debt.amount > 0) {
                    // Positive: payee owes user
                    direction = 'owed';
                    amount = debt.amount;
                    totalOwing += debt.amount;
                } else {
                    // Negative: user owes payee
                    direction = 'owe';
                    amount = Math.abs(debt.amount);
                    totalOwed += Math.abs(debt.amount);
                }
                other_user_id = debt.payee_id;
                other_user_name = debt.payee_name;
                other_user_avatar = debt.payee_avatar;
            } else {
                // User is stored as payee
                if (debt.amount > 0) {
                    // Positive: user owes payer
                    direction = 'owe';
                    amount = debt.amount;
                    totalOwed += debt.amount;
                } else {
                    // Negative: payer owes user
                    direction = 'owed';
                    amount = Math.abs(debt.amount);
                    totalOwing += Math.abs(debt.amount);
                }
                other_user_id = debt.payer_id;
                other_user_name = debt.payer_name;
                other_user_avatar = debt.payer_avatar;
            }

            return {
                ...debt,
                direction,
                display_amount: amount,
                other_user_id,
                other_user_name,
                other_user_avatar
            };
        });

        // Net balance: positive = user is owed, negative = user owes
        const netBalance = totalOwing - totalOwed;

        return NextResponse.json({
            debts: processed,
            summary: {
                total_owed: totalOwed,
                total_owing: totalOwing,
                net_balance: netBalance
            }
        });

    } catch (error) {
        console.error('Debts GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/debts - Settle up (record a payment)
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            payer_id = 1,  // Person making the payment
            payee_id,      // Person receiving the payment
            amount,
            currency = 'GBP',
            group_id = null
        } = body;

        if (!payee_id || !amount) {
            return NextResponse.json(
                { error: 'Payee and amount are required' },
                { status: 400 }
            );
        }

        transaction(() => {
            const db = getDb();

            // Record settlement as a special expense
            const expenseId = insert(
                `INSERT INTO expenses (group_id, payer_id, amount, currency, description, date, category, is_settlement)
         VALUES (?, ?, ?, ?, ?, date('now'), 'Settlement', 1)`,
                [group_id, payer_id, amount, currency, 'Payment']
            );

            // Update debt ledger - reduce the debt
            const [id1, id2] = payer_id < payee_id
                ? [payer_id, payee_id]
                : [payee_id, payer_id];

            // If payer < payee, and payer is paying payee, then payer was owed, so reduce positive amount
            // If payer > payee, and payer is paying payee, then payee was owed negative amount, so make it more positive
            const adjustment = payer_id < payee_id
                ? -amount  // Payer was owed, now less owed
                : amount;  // Payee was owed (negative), now less owed

            const upsertDebt = db.prepare(`
        INSERT INTO debts (payer_id, payee_id, amount, group_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(payer_id, payee_id, group_id) 
        DO UPDATE SET amount = amount + excluded.amount
      `);

            upsertDebt.run(id1, id2, adjustment, group_id);

            // Get names for activity log
            const payerName = queryOne('SELECT name FROM users WHERE id = ?', [payer_id])?.name;
            const payeeName = queryOne('SELECT name FROM users WHERE id = ?', [payee_id])?.name;

            // Log activity
            run(
                'INSERT INTO activity_log (user_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                [payer_id, 'settle', 'expense', expenseId, `paid ${payeeName} ${currency}${amount.toFixed(2)}`]
            );

            // Notify payee
            run(
                'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
                [payee_id, `${payerName} paid you ${currency}${amount.toFixed(2)}`, 'settlement', expenseId]
            );
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error('Debts POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
