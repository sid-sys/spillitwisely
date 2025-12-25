import { NextResponse } from 'next/server';
import { query, queryOne, run } from '@/lib/db/index.js';

// GET /api/activity - Get activity feed and notifications
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 1;
        const type = searchParams.get('type'); // 'activity' or 'notifications'
        const limit = parseInt(searchParams.get('limit') || '50');

        if (type === 'notifications') {
            const notifications = query(`
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `, [userId, limit]);

            const unreadCount = queryOne(`
        SELECT COUNT(*) as count FROM notifications
        WHERE user_id = ? AND is_read = 0
      `, [userId]);

            return NextResponse.json({
                notifications,
                unread_count: unreadCount?.count || 0
            });
        }

        // Activity feed - show all activities from user's groups and friends
        const activities = query(`
      SELECT 
        a.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM activity_log a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id IN (
        SELECT DISTINCT gm2.user_id 
        FROM group_members gm1 
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id 
        WHERE gm1.user_id = ?
      )
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [userId, limit]);

        return NextResponse.json({ activities });

    } catch (error) {
        console.error('Activity GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/activity - Mark notifications as read
export async function PUT(request) {
    try {
        const body = await request.json();
        const { notification_id, mark_all_read, user_id = 1 } = body;

        if (mark_all_read) {
            run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user_id]);
        } else if (notification_id) {
            run('UPDATE notifications SET is_read = 1 WHERE id = ?', [notification_id]);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Activity PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
