'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import CurrencySelector from '@/components/CurrencySelector';
import { CURRENCIES, CATEGORIES } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function AddExpense() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedGroupId = searchParams.get('groupId');
    const { refreshData } = useApp();

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('GBP');
    const [groupId, setGroupId] = useState(preSelectedGroupId || '');
    const [category, setCategory] = useState('General');
    const [payerId, setPayerId] = useState(1); // Default to user (Sidharth)
    const [isLoading, setIsLoading] = useState(false);

    const { data: groupsData } = useSWR('/api/groups?userId=1', fetcher);
    const { data: userData } = useSWR('/api/users?action=list', fetcher);

    const groups = groupsData?.groups || [];
    const users = userData?.users || [];

    // Get members of selected group
    const selectedGroup = groups.find(g => g.id.toString() === groupId);
    const [groupMembers, setGroupMembers] = useState([]);

    useEffect(() => {
        if (groupId && selectedGroup) {
            // Ideally we'd fetch members for this group, but for now derive from assumed data or fetch if needed
            // For demo, let's just fetch the group details
            fetch(`/api/groups?id=${groupId}&userId=1`)
                .then(res => res.json())
                .then(data => {
                    if (data.group) {
                        setGroupMembers(data.group.members.map(m => m.id));
                    }
                });
        } else {
            setGroupMembers([]);
        }
    }, [groupId, selectedGroup]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description || !amount) return;

        setIsLoading(true);

        try {
            const payload = {
                description,
                amount: parseFloat(amount),
                currency,
                group_id: groupId || null,
                category,
                payer_id: payerId,
                date: new Date().toISOString(),
                split_equally: true,
                participant_ids: groupId ? groupMembers : [1, 2] // Default split
            };

            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                refreshData(); // Refresh global data
                router.back();
            } else {
                alert('Failed to add expense');
            }
        } catch (err) {
            console.error(err);
            alert('Error adding expense');
        } finally {
            setIsLoading(false);
        }
    };

    // Pro Feature: Receipt Scanning Mock
    const handleScanReceipt = () => {
        // Check feature flag here in real app
        const isPro = true; // Mock
        if (isPro) {
            // Simulate scanning
            setTimeout(() => {
                setDescription('Waitrose Shopping');
                setAmount('42.50');
                setCategory('Groceries');
            }, 1000);
        } else {
            alert('Keep your receipts organized! Upgrade to Pro to scan receipts.');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                <button onClick={() => router.back()} className="btn-icon">✖</button>
                <h1 style={{ fontSize: '18px' }}>Add Expense</h1>
                <button
                    onClick={handleSubmit}
                    disabled={!description || !amount || isLoading}
                    style={{
                        color: (!description || !amount) ? 'var(--text-secondary)' : 'var(--primary)',
                        background: 'none', border: 'none', fontSize: '16px', fontWeight: 'bold'
                    }}
                >
                    Save
                </button>
            </div>

            <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '1px dashed var(--text-secondary)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', cursor: 'pointer'
                    }} onClick={() => setCategory('General')}>
                        {CATEGORIES[category] || '📄'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Enter a description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                                padding: '12px 0', fontSize: '18px', color: 'var(--text)', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'flex-end' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', fontWeight: 'bold'
                    }}>
                        {CURRENCIES.find(c => c.code === currency)?.symbol}
                    </div>
                    <div style={{ flex: 1 }}>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                                padding: '12px 0', fontSize: '32px', fontWeight: 'bold', color: 'var(--text)', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="label">Category</label>
                    <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
                        {Object.keys(CATEGORIES).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: `1px solid ${category === cat ? 'var(--primary)' : 'var(--border)'}`,
                                    background: category === cat ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {CATEGORIES[cat]} {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="input-group">
                    <label className="label">Paid by</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={`btn ${payerId === 1 ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setPayerId(1)}
                            style={{ flex: 1 }}
                        >
                            you
                        </button>
                        <button
                            className={`btn ${payerId !== 1 ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setPayerId(2)} // Mock 'someone else'
                            style={{ flex: 1 }}
                        >
                            someone else
                        </button>
                    </div>
                </div>

                <div className="input-group">
                    <label className="label">Group</label>
                    <select
                        className="input"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                    >
                        <option value="">No Group</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <CurrencySelector
                    value={currency}
                    onChange={setCurrency}
                    label="Currency"
                />

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <button
                        onClick={handleScanReceipt}
                        style={{
                            background: 'transparent', border: '1px solid var(--primary)',
                            color: 'var(--primary)', padding: '12px 24px', borderRadius: '24px',
                            display: 'inline-flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        📷 Scan Receipt (Pro)
                    </button>
                </div>

            </div>
        </div>
    );
}
