import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function BalanceCard() {
    // Using SWR to fetch real-time balance
    const { data, isLoading } = useSWR('/api/debts?userId=1', fetcher);

    if (isLoading) return <div className="card" style={{ height: '100px' }}>Loading...</div>;

    const { summary } = data || { summary: { total_owed: 0, total_owing: 0 } };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div className="label">you owe</div>
                    <div className="balance-negative" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {formatCurrency(summary.total_owed)}
                    </div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }}></div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div className="label">you are owed</div>
                    <div className="balance-positive" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {formatCurrency(summary.total_owing)}
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--surface-alt)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Balance</span>
                <span style={{
                    fontWeight: 'bold',
                    color: summary.net_balance >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                    {summary.net_balance >= 0 ? '+' : ''}{formatCurrency(summary.net_balance)}
                </span>
            </div>
        </div>
    );
}

import useSWR from 'swr';
const fetcher = (...args) => fetch(...args).then(res => res.json());
