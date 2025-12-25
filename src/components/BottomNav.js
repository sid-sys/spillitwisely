'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Groups', icon: '👥', path: '/' },
        { label: 'Friends', icon: '👤', path: '/friends' },
        { label: 'Activity', icon: '📊', path: '/activity' },
        { label: 'Account', icon: '⚙️', path: '/settings' }
    ];

    // Don't show on add-expense page
    if (pathname === '/add-expense') return null;

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0',
            zIndex: 50
        }}>
            {navItems.map(item => {
                const isActive = pathname === item.path || (item.path === '/' && pathname.startsWith('/groups'));

                return (
                    <Link
                        key={item.path}
                        href={item.path}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                            fontSize: '12px',
                            gap: '4px'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
