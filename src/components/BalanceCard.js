'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function BalanceCard() {
    const [showDetails, setShowDetails] = useState(false);
    const { data, isLoading } = useSWR('/api/debts?userId=1', fetcher);

    if (isLoading) {
        return (
            <div className="card" style={{
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)'
            }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading balance...</div>
            </div>
        );
    }

    const { summary } = data || { summary: { total_owed: 0, total_owing: 0, net_balance: 0 } };

    return (
        <div className="card card-glow" style={{
            background: 'linear-gradient(135deg, var(--glass-bg) 0%, rgba(50, 55, 90, 0.6) 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative gradient overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'var(--primary-gradient)',
                opacity: 0.8
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div className="label" style={{ marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        You Owe
                    </div>
                    <div className="balance-negative" style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-display)',
                        textShadow: summary.total_owed > 0 ? 'var(--shadow-glow-danger)' : 'none'
                    }}>
                        {formatCurrency(summary.total_owed)}
                    </div>
                </div>

                <div style={{
                    width: '2px',
                    background: 'linear-gradient(180deg, transparent, var(--divider), transparent)',
                    alignSelf: 'stretch'
                }} />

                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div className="label" style={{ marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        You Are Owed
                    </div>
                    <div className="balance-positive" style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-display)',
                        textShadow: summary.total_owing > 0 ? 'var(--shadow-glow)' : 'none'
                    }}>
                        {formatCurrency(summary.total_owing)}
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--surface-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--glass-border)',
                transition: 'all var(--transition-base)',
                cursor: 'pointer'
            }}
                onClick={() => setShowDetails(!showDetails)}
            >
                <div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        Total Balance
                    </span>
                    <div style={{
                        fontWeight: '700',
                        fontSize: '18px',
                        marginTop: '4px',
                        color: summary.net_balance >= 0 ? 'var(--success)' : 'var(--danger)',
                        fontFamily: 'var(--font-display)'
                    }}>
                        {summary.net_balance >= 0 ? '+' : ''}{formatCurrency(summary.net_balance)}
                    </div>
                </div>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: summary.net_balance >= 0 ? 'rgba(0, 217, 163, 0.15)' : 'rgba(255, 107, 107, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'transform var(--transition-base)',
                    transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                    {summary.net_balance >= 0 ? '📈' : '📉'}
                </div>
            </div>
        </div>
    );
}
