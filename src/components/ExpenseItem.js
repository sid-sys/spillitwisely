import { formatCurrency, formatDate, CATEGORIES } from '@/lib/utils';
import Avatar from './Avatar';

export default function ExpenseItem({ expense, userId = 1 }) {
    // Determine if user was payer or involved
    const isPayer = expense.payer_id === userId;
    const userSplit = expense.splits?.find(s => s.user_id === userId);

    let statusText = '';
    let amountClass = '';
    let amountText = '';

    if (expense.is_settlement) {
        if (isPayer) {
            statusText = `you paid ${expense.splits?.[0]?.user_name}`;
            amountClass = 'balance-positive';
            amountText = formatCurrency(expense.amount);
        } else {
            statusText = `${expense.payer_name} paid you`;
            amountClass = 'balance-positive';
            amountText = formatCurrency(expense.amount);
        }
    } else if (isPayer) {
        statusText = `you paid ${formatCurrency(expense.amount, expense.currency)}`;
        amountClass = 'balance-positive';
        amountText = `+${formatCurrency(expense.amount - (userSplit?.owed_share || 0), expense.currency)}`;
    } else {
        statusText = `${expense.payer_name} paid ${formatCurrency(expense.amount, expense.currency)}`;
        amountClass = 'balance-negative';
        amountText = `-${formatCurrency(userSplit?.owed_share || 0, expense.currency)}`;
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid var(--border)'
        }}>
            <div style={{
                marginRight: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '40px'
            }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {new Date(expense.date).toLocaleString('default', { month: 'short' })}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {new Date(expense.date).getDate()}
                </div>
            </div>

            <div style={{
                width: '40px',
                height: '40px',
                background: 'var(--surface-alt)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                fontSize: '20px'
            }}>
                {expense.is_settlement ? '💸' : (CATEGORIES[expense.category] || '📄')}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{expense.description}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{statusText}</div>
            </div>

            <div className={amountClass} style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {amountText}
            </div>
        </div>
    );
}
