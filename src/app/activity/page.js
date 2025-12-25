'use client';
import useSWR from 'swr';
import Avatar from '@/components/Avatar';
import { formatRelativeTime } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function Activity() {
    const { data, isLoading } = useSWR('/api/activity?userId=1&limit=50', fetcher);

    const activities = data?.activities || [];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1 style={{ fontSize: '24px', margin: '16px 0 24px' }}>Activity</h1>

            {isLoading ? (
                <div>Loading activity...</div>
            ) : activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No recent activity.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activities.map(activity => (
                        <div key={activity.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{ marginRight: '16px' }}>
                                <Avatar
                                    user={{ name: activity.user_name, avatar_url: activity.user_avatar }}
                                    size="md"
                                />
                            </div>
                            <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ lineHeight: '1.4' }}>
                                    <span style={{ fontWeight: 'bold' }}>{activity.user_name}</span> {activity.description}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {formatRelativeTime(activity.created_at)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
