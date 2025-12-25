'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Avatar from '@/components/Avatar';
import { useApp } from '@/context/AppContext';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function Settings() {
    const { currentUser } = useApp();

    // Feature flagging for upsell
    const isPro = currentUser?.subscription_status === 'Pro';

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h1 style={{ fontSize: '24px', margin: '16px 0 24px' }}>Account</h1>

            {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                    <Avatar user={currentUser} size="lg" className="mr-4" />
                    <div style={{ marginLeft: '16px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentUser.name}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{currentUser.email}</div>
                        {isPro && (
                            <span style={{
                                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                color: 'black', padding: '2px 8px', borderRadius: '4px',
                                fontSize: '12px', fontWeight: 'bold', marginTop: '4px', display: 'inline-block'
                            }}>
                                PRO MEMBER
                            </span>
                        )}
                    </div>
                </div>
            )}

            {!isPro && (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--surface) 100%)',
                    border: '1px solid var(--primary)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ marginBottom: '8px' }}>Upgrade to Pro</h3>
                    <p style={{ fontSize: '14px', marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>
                        Get receipt scanning, currency conversion, and charts!
                    </p>
                    <button className="btn" style={{ background: 'white', color: 'black' }}>
                        View Plans
                    </button>
                </div>
            )}

            <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Preferences
                </h3>

                <div className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Default currency</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{currentUser?.default_currency || 'GBP'}</span>
                    </div>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Notifications</span>
                        <span style={{ color: 'var(--text-secondary)' }}>On</span>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Dark Mode</span>
                        <span style={{ color: 'var(--text-secondary)' }}>On (System)</span>
                    </div>
                </div>

                <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '12px', marginTop: '24px', textTransform: 'uppercase' }}>
                    Security
                </h3>

                <div className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                        Change Password
                    </div>
                    <div style={{ padding: '16px', color: 'var(--danger)' }}>
                        Log Out
                    </div>
                </div>

            </div>
        </div>
    );
}
