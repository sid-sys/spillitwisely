import { NextResponse } from 'next/server';
import { query, queryOne, insert, run, transaction } from '@/lib/db/index.js';
import { seedDatabase } from '@/lib/db/seed.js';

// GET /api/groups - List groups for a user
export async function GET(request) {
    try {
        seedDatabase();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 1;
        const groupId = searchParams.get('id');

        // Get single group with details
        if (groupId) {
            const group = queryOne(`
        SELECT g.*, u.name as creator_name
        FROM groups g
        JOIN users u ON g.created_by = u.id
        WHERE g.id = ?
      `, [groupId]);

            if (!group) {
                return NextResponse.json({ error: 'Group not found' }, { status: 404 });
            }

            // Get members with balances
            const members = query(`
        SELECT 
          u.id, u.name, u.email, u.avatar_url,
          gm.joined_at,
          COALESCE(
            (SELECT SUM(
              CASE 
                WHEN d.payer_id = ? AND d.payee_id = u.id THEN -d.amount
                WHEN d.payee_id = ? AND d.payer_id = u.id THEN d.amount
                ELSE 0
              END
            ) FROM debts d WHERE d.group_id = ? AND ((d.payer_id = ? AND d.payee_id = u.id) OR (d.payer_id = u.id AND d.payee_id = ?))),
            0
          ) as balance_with_user
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY u.name
      `, [userId, userId, groupId, userId, userId, groupId]);

            // Get expenses
            const expenses = query(`
        SELECT 
          e.*,
          u.name as payer_name,
          u.avatar_url as payer_avatar
        FROM expenses e
        JOIN users u ON e.payer_id = u.id
        WHERE e.group_id = ?
        ORDER BY e.date DESC, e.created_at DESC
      `, [groupId]);

            // Get splits for each expense
            for (const expense of expenses) {
                expense.splits = query(`
          SELECT es.*, u.name as user_name
          FROM expense_splits es
          JOIN users u ON es.user_id = u.id
          WHERE es.expense_id = ?
        `, [expense.id]);
            }

            // Calculate user's net balance in this group
            const balanceResult = queryOne(`
        SELECT COALESCE(SUM(
          CASE 
            WHEN d.payer_id = ? THEN -d.amount
            ELSE d.amount
          END
        ), 0) as balance
        FROM debts d
        WHERE d.group_id = ? AND (d.payer_id = ? OR d.payee_id = ?)
      `, [userId, groupId, userId, userId]);

            return NextResponse.json({
                group: {
                    ...group,
                    members,
                    expenses,
                    user_balance: balanceResult?.balance || 0
                }
            });
        }

        // List all groups for user with balances
        const groups = query(`
      SELECT 
        g.*,
        u.name as creator_name,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
        COALESCE(
          (SELECT SUM(
            CASE 
              WHEN d.payer_id = ? THEN -d.amount
              ELSE d.amount
            END
          ) FROM debts d WHERE d.group_id = g.id AND (d.payer_id = ? OR d.payee_id = ?)),
          0
        ) as user_balance
      FROM groups g
      JOIN users u ON g.created_by = u.id
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY g.created_at DESC
    `, [userId, userId, userId, userId]);

        return NextResponse.json({ groups });

    } catch (error) {
        console.error('Groups GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/groups - Create a new group
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, created_by = 1, member_ids = [] } = body;

        if (!name) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        const groupId = transaction(() => {
            const id = insert(
                'INSERT INTO groups (name, created_by) VALUES (?, ?)',
                [name, created_by]
            );

            // Add creator as member
            run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [id, created_by]);

            // Add other members
            for (const memberId of member_ids) {
                if (memberId !== created_by) {
                    run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [id, memberId]);

                    // Notify member
                    run(
                        'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
                        [memberId, `You were added to "${name}"`, 'added_to_group', id]
                    );
                }
            }

            // Log activity
            run(
                'INSERT INTO activity_log (user_id, action_type, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                [created_by, 'create', 'group', id, `created group "${name}"`]
            );

            return id;
        });

        const group = queryOne('SELECT * FROM groups WHERE id = ?', [groupId]);

        return NextResponse.json({ group }, { status: 201 });

    } catch (error) {
        console.error('Groups POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/groups - Update group or add member
export async function PUT(request) {
    try {
        const body = await request.json();
        const { group_id, action, name, user_id } = body;

        if (!group_id) {
            return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
        }

        if (action === 'add_member' && user_id) {
            // Check if already member
            const existing = queryOne(
                'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
                [group_id, user_id]
            );

            if (!existing) {
                run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [group_id, user_id]);

                const group = queryOne('SELECT name FROM groups WHERE id = ?', [group_id]);
                run(
                    'INSERT INTO notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
                    [user_id, `You were added to "${group.name}"`, 'added_to_group', group_id]
                );
            }
        } else if (name) {
            run('UPDATE groups SET name = ? WHERE id = ?', [name, group_id]);
        }

        const group = queryOne('SELECT * FROM groups WHERE id = ?', [group_id]);
        return NextResponse.json({ group });

    } catch (error) {
        console.error('Groups PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
