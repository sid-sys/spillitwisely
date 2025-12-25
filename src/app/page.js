'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import BalanceCard from '@/components/BalanceCard';
import Avatar from '@/components/Avatar';
import { formatCurrency } from '@/lib/utils';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function Home() {
  const [filter, setFilter] = useState('outstanding'); // 'outstanding' or 'all'

  const { data: groupsData, isLoading: groupsLoading } = useSWR('/api/groups?userId=1', fetcher);
  const { data: friendsData, isLoading: friendsLoading } = useSWR('/api/users?action=friends&userId=1', fetcher);

  const groups = groupsData?.groups || [];
  const friends = friendsData?.friends || [];

  const filteredGroups = filter === 'outstanding'
    ? groups.filter(g => Math.abs(g.user_balance) > 0.01)
    : groups;

  return (
    <main className="container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        marginBottom: '16px'
      }}>
        <h1 style={{ fontSize: '24px' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-icon">🔍</button>
          <Link href="/add-expense">
            <button className="btn-icon" style={{ background: 'var(--primary)' }}>➕</button>
          </Link>
        </div>
      </div>

      <BalanceCard />

      <div style={{ margin: '24px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px' }}>Groups</h2>
        <div style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setFilter(filter === 'all' ? 'outstanding' : 'all')}>
          {filter === 'all' ? 'Show active only' : 'Show all'}
        </div>
      </div>

      {groupsLoading ? (
        <div>Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          No groups with outstanding balances.
          <br />
          <Link href="/groups/new" style={{ color: 'var(--primary)', marginTop: '8px', display: 'inline-block' }}>
            Create a group
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredGroups.map(group => (
            <Link href={`/groups/${group.id}`} key={group.id} className="card" style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              margin: 0
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: 'var(--surface-alt)',
                marginRight: '16px',
                overflow: 'hidden'
              }}>
                {group.cover_photo_url ? (
                  <img src={group.cover_photo_url} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    🏢
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{group.name}</div>
                {group.user_balance !== 0 ? (
                  <div style={{ fontSize: '14px', color: group.user_balance > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {group.user_balance > 0 ? 'owes you' : 'you owe'} {formatCurrency(Math.abs(group.user_balance))}
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>settled up</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ margin: '24px 0 16px' }}>
        <h2 style={{ fontSize: '18px' }}>Friends</h2>
      </div>

      {friendsLoading ? (
        <div>Loading friends...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {friends.map(friend => (
            <div key={friend.id} className="card" style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              margin: 0
            }}>
              <Avatar user={friend} size="md" className="mr-3" />
              <div style={{ flex: 1, marginLeft: '12px' }}>
                <div style={{ fontWeight: '500' }}>{friend.name}</div>
                {friend.balance !== 0 ? (
                  <div style={{ fontSize: '14px', color: friend.balance > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {friend.balance > 0 ? 'owes you' : 'you owe'} {formatCurrency(Math.abs(friend.balance))}
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>settled up</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href="/add-expense">
        <div className="fab">➕</div>
      </Link>
    </main>
  );
}
