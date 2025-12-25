'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import ExpenseItem from '@/components/ExpenseItem';
import { formatCurrency, groupByMonth } from '@/lib/utils';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function GroupDetail() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const { data, isLoading } = useSWR(`/api/groups?id=${id}&userId=1`, fetcher);

    if (isLoading) return <div className="container">Loading group...</div>;
    if (data?.error) return <div className="container">Group not found</div>;

    const { group } = data;
    const groupedExpenses = groupByMonth(group.expenses);

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <div style={{
                position: 'sticky',
                top: 0,
                background: 'rgba(18, 18, 18, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
                padding: '16px 0',
                borderBottom: '1px solid var(--border)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <Link href="/" style={{ marginRight: '16px', fontSize: '24px' }}>←</Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '20px' }}>{group.name}</h1>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {group.members.length} members
                    </div>
                </div>
                <button className="btn-icon">⚙️</button>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)' }}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Your Balance
                    </div>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: group.user_balance >= 0 ? 'var(--success)' : 'var(--danger)'
                    }}>
                        {group.user_balance >= 0 ? '+' : ''}{formatCurrency(group.user_balance)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {group.user_balance >= 0 ? 'You are owed' : 'You owe'}
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <button className="btn btn-primary" style={{ flex: 1 }}>Settle Up</button>
                    <button className="btn btn-secondary" style={{ flex: 1 }}>Balances</button>
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
                {groupedExpenses.map(group => (
                    <div key={group.date}>
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            fontWeight: 'bold',
                            margin: '24px 0 8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            {group.label}
                        </div>
                        {group.expenses.map(expense => (
                            <ExpenseItem key={expense.id} expense={expense} userId={1} />
                        ))}
                    </div>
                ))}

                {group.expenses.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No expenses yet.
                    </div>
                )}
            </div>

            <Link href={`/add-expense?groupId=${id}`}>
                <div className="fab">➕</div>
            </Link>
        </div>
    );
}
