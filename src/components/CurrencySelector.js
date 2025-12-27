'use client';
import { useState } from 'react';
import { CURRENCIES } from '@/lib/utils';

export default function CurrencySelector({ value, onChange, label = "Preferred Currency" }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedCurrency = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

    return (
        <div className="input-group">
            <label className="label">{label}</label>
            <div style={{ position: 'relative' }}>
                <button
                    type="button"
                    className="input"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '24px',
                            width: '32px',
                            textAlign: 'center'
                        }}>
                            {selectedCurrency.symbol}
                        </span>
                        <div>
                            <div style={{ fontWeight: '600' }}>{selectedCurrency.code}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {selectedCurrency.name}
                            </div>
                        </div>
                    </div>
                    <span style={{
                        transition: 'transform var(--transition-base)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                        ▼
                    </span>
                </button>

                {isOpen && (
                    <>
                        <div
                            className="overlay"
                            onClick={() => setIsOpen(false)}
                            style={{ zIndex: 999 }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            background: 'var(--surface-elevated)',
                            backdropFilter: 'var(--glass-blur)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            animation: 'slideUp 0.2s ease-out'
                        }}>
                            {CURRENCIES.map(currency => (
                                <button
                                    key={currency.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(currency.code);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        background: currency.code === value ? 'rgba(0, 217, 163, 0.1)' : 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid var(--border-light)',
                                        color: 'var(--text)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        textAlign: 'left',
                                        fontFamily: 'var(--font-sans)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currency.code !== value) {
                                            e.currentTarget.style.background = 'var(--surface-alt)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currency.code !== value) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <span style={{
                                        fontSize: '20px',
                                        width: '28px',
                                        textAlign: 'center'
                                    }}>
                                        {currency.symbol}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: currency.code === value ? '600' : '500',
                                            color: currency.code === value ? 'var(--primary)' : 'var(--text)'
                                        }}>
                                            {currency.code}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'var(--text-secondary)',
                                            marginTop: '2px'
                                        }}>
                                            {currency.name}
                                        </div>
                                    </div>
                                    {currency.code === value && (
                                        <span style={{ color: 'var(--primary)', fontSize: '18px' }}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
