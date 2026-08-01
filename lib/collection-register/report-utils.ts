import type {
    CRCategory,
    CRItem,
    CRDailyCollection,
    MonthlyReportRow,
    MonthlyReportData,
} from './types';
import { getDaysInMonth } from './constants';

/**
 * Build the monthly report data structure from raw Firestore data.
 * Transforms daily collections into an Excel-like grid layout.
 */
export function buildMonthlyReport(
    hotelName: string,
    month: number,
    year: number,
    collections: CRDailyCollection[],
    items: CRItem[],
    categories: CRCategory[]
): MonthlyReportData {
    const daysInMonth = getDaysInMonth(month, year);

    // Build a lookup: collection_date -> CRDailyCollection
    const collectionByDate = new Map<string, CRDailyCollection>();
    const leaveDays = new Set<number>();

    for (const c of collections) {
        collectionByDate.set(c.collection_date, c);
        if (c.status === 'LEAVE') {
            const day = parseInt(c.collection_date.split('-')[2], 10);
            leaveDays.add(day);
        }
    }

    // Build category lookup
    const categoryMap = new Map<string, CRCategory>();
    for (const cat of categories) {
        categoryMap.set(cat.id, cat);
    }

    // Build report rows
    const rows: MonthlyReportRow[] = items.map((item) => {
        const dailyQuantities: (number | null)[] = [];
        const isLeaveDay: boolean[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const col = collectionByDate.get(dateStr);

            if (col) {
                if (col.status === 'LEAVE') {
                    dailyQuantities.push(null);
                    isLeaveDay.push(true);
                } else {
                    const qty = col.items?.[item.id] ?? 0;
                    dailyQuantities.push(qty);
                    isLeaveDay.push(false);
                }
            } else {
                dailyQuantities.push(null);
                isLeaveDay.push(false);
            }
        }

        const total: number = dailyQuantities.reduce<number>((sum, qty) => sum + (qty ?? 0), 0);
        const amount = total * item.rate;

        return {
            item,
            category: categoryMap.get(item.category_id) || { id: '', name: 'Unknown', display_order: 999 },
            dailyQuantities,
            isLeaveDay,
            total,
            rate: item.rate,
            amount,
        };
    });

    // Group rows by category
    const categoryGroupMap = new Map<string, MonthlyReportRow[]>();
    for (const row of rows) {
        const catId = row.category.id;
        if (!categoryGroupMap.has(catId)) {
            categoryGroupMap.set(catId, []);
        }
        categoryGroupMap.get(catId)!.push(row);
    }

    // Sort category groups by display_order
    const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
    const categoryGroups = sortedCategories
        .filter((cat) => categoryGroupMap.has(cat.id))
        .map((cat) => ({
            category: cat,
            rows: categoryGroupMap.get(cat.id)!.sort((a, b) => a.item.display_order - b.item.display_order),
        }));

    const grandTotal = rows.reduce((sum, row) => sum + row.amount, 0);

    return {
        hotelName,
        month,
        year,
        daysInMonth,
        rows,
        categoryGroups,
        grandTotal,
        leaveDays,
    };
}

/**
 * Calculate the total bill amount for a hotel's monthly collections.
 * Used by the Payments page to show the monthly bill.
 */
export function calculateMonthlyBill(
    collections: CRDailyCollection[],
    items: CRItem[]
): number {
    const itemRateMap = new Map<string, number>();
    for (const item of items) {
        itemRateMap.set(item.id, item.rate);
    }

    let totalBill = 0;

    for (const col of collections) {
        if (col.status === 'LEAVE') continue;
        for (const [itemId, quantity] of Object.entries(col.items || {})) {
            const rate = itemRateMap.get(itemId) || 0;
            totalBill += quantity * rate;
        }
    }

    return totalBill;
}
