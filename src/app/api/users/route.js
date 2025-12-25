import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, transaction } from '@/lib/db/index.js';
import { seedDatabase } from '@/lib/db/seed.js';

// GET /api/users - Get current user profile or list users
export async function GET(request) {
    try {
        // Ensure database is seeded for demo
        seedDatabase();

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        // List all users (for selecting split participants)
        if (action === 'list') {
            const users = query(`
        SELECT id, name, email, avatar_url 
        FROM users 
        ORDER BY name
      `);
            return NextResponse.json({ users });
        }

        // Get friends (users you have debts with)
        if (action === 'friends') {
            const userId = searchParams.get('userId') || 1;

            const friends = query(`
        SELECT DISTINCT 
          u.id, u.name, u.email, u.avatar_url,
          COALESCE(
            (SELECT SUM(
              CASE 
                WHEN d.payer_id = ? THEN -d.amount
                ELSE d.amount
              END
            ) FROM debts d WHERE (d.payer_id = ? AND d.payee_id = u.id) OR (d.payer_id = u.id AND d.payee_id = ?)),
            0
          ) as balance
        FROM users u
        WHERE u.id != ?
          AND (
            EXISTS (SELECT 1 FROM debts d WHERE (d.payer_id = ? AND d.payee_id = u.id) OR (d.payer_id = u.id AND d.payee_id = ?))
            OR EXISTS (SELECT 1 FROM group_members gm1 JOIN group_members gm2 ON gm1.group_id = gm2.group_id WHERE gm1.user_id = ? AND gm2.user_id = u.id)
          )
        ORDER BY u.name
      `, [userId, userId, userId, userId, userId, userId, userId]);

            return NextResponse.json({ friends });
        }

        // Get current user profile
        const user = getUserFromRequest(request);
        if (!user) {
            // For demo, return user 1
            const demoUser = queryOne('SELECT * FROM users WHERE id = 1');
            return NextResponse.json({
                user: {
                    id: demoUser.id,
                    name: demoUser.name,
                    email: demoUser.email,
                    default_currency: demoUser.default_currency,
                    timezone: demoUser.timezone,
                    subscription_status: demoUser.subscription_status,
                    avatar_url: demoUser.avatar_url
                }
            });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                default_currency: user.default_currency,
                timezone: user.timezone,
                subscription_status: user.subscription_status,
                avatar_url: user.avatar_url
            }
        });

    } catch (error) {
        console.error('Users GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/users - Update user profile
export async function PUT(request) {
    try {
        const body = await request.json();
        const userId = body.userId || 1; // Demo mode

        const { name, email, phone, default_currency, timezone } = body;

        const updates = [];
        const params = [];

        if (name) { updates.push('name = ?'); params.push(name); }
        if (email) { updates.push('email = ?'); params.push(email); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
        if (default_currency) { updates.push('default_currency = ?'); params.push(default_currency); }
        if (timezone) { updates.push('timezone = ?'); params.push(timezone); }

        if (updates.length > 0) {
            params.push(userId);
            run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                default_currency: user.default_currency,
                timezone: user.timezone,
                subscription_status: user.subscription_status
            }
        });

    } catch (error) {
        console.error('Users PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
