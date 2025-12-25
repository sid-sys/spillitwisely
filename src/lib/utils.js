// Currency formatting
export function formatCurrency(amount, currency = 'GBP') {
    const symbols = {
        GBP: '£',
        USD: '$',
        EUR: '€',
        INR: '₹'
    };

    const symbol = symbols[currency] || currency + ' ';
    const formatted = Math.abs(amount).toFixed(2);

    return `${symbol}${formatted}`;
}

// Format relative time
export function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } else if (diffDays > 0) {
        return `${diffDays}d ago`;
    } else if (diffHours > 0) {
        return `${diffHours}h ago`;
    } else if (diffMins > 0) {
        return `${diffMins}m ago`;
    } else {
        return 'Just now';
    }
}

// Format date for display
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Group expenses by month
export function groupByMonth(expenses) {
    const grouped = {};

    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

        if (!grouped[key]) {
            grouped[key] = { label, expenses: [] };
        }
        grouped[key].expenses.push(expense);
    });

    return Object.values(grouped).sort((a, b) => b.label.localeCompare(a.label));
}

// Get initials from name
export function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Category icons mapping
export const CATEGORIES = {
    'General': '📦',
    'Food': '🍽️',
    'Groceries': '🛒',
    'Transport': '🚗',
    'Utilities': '💡',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Accommodation': '🏨',
    'Health': '💊',
    'Travel': '✈️'
};

// Currencies list
export const CURRENCIES = [
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
];
