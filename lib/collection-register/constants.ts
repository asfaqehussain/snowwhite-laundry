// ─── Collection Register Constants ──────────────────────────────────────────

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const COLLECTION_STATUS = {
    COLLECTION: 'COLLECTION',
    LEAVE: 'LEAVE',
} as const;

// Firestore collection names (prefixed to avoid conflicts with existing data)
export const CR_COLLECTIONS = {
    CATEGORIES: 'cr_categories',
    ITEMS: 'cr_items',
    DAILY_COLLECTIONS: 'cr_daily_collections',
    PAYMENTS: 'cr_payments',
} as const;

// Currency
export const CURRENCY_SYMBOL = '₹';

// Default years for dropdowns (current year ± range)
export function getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
        years.push(y);
    }
    return years;
}

// Get days in a specific month/year
export function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

// Format date to ISO string "YYYY-MM-DD"
export function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Format currency
export function formatCurrency(amount: number): string {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
