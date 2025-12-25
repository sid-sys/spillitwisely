'use client';
import useSWR from 'swr';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { formatCurrency } from '@/lib/utils';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function Friends() {
    const { data, isLoading } = useSWR('/api/users?action=friends&userId=1', fetcher);
    const friends = data?.friends || [];

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 24px' }}>
                <h1 style={{ fontSize: '24px' }}>Friends</h1>
                <button className="btn-icon">➕</button>
            </div>

            {isLoading ? (
                <div>Loading friends...</div>
            ) : friends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No friends added yet.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {friends.map(friend => (
                        <Link href={`/friends/${friend.id}`} key={friend.id} className="card" style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px',
                            margin: 0
                        }}>
                            <Avatar user={friend} size="md" className="mr-3" />
                            <div style={{ flex: 1, marginLeft: '12px' }}>
                                <div style={{ fontWeight: '500' }}>{friend.name}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {friend.balance !== 0 ? (
                                    <>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {friend.balance > 0 ? 'owes you' : 'you owe'}
                                        </div>
                                        <div style={{
                                            fontSize: '16px', fontWeight: 'bold',
                                            color: friend.balance > 0 ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {formatCurrency(Math.abs(friend.balance))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>settled</div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
