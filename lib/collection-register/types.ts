import { Timestamp } from 'firebase/firestore';

// ─── Collection Register Types ──────────────────────────────────────────────

export interface CRCategory {
    id: string;
    name: string;
    display_order: number;
    created_at?: Timestamp;
}

export interface CRItem {
    id: string;
    category_id: string;
    name: string;
    rate: number;
    display_order: number;
    is_active: boolean;
    created_at?: Timestamp;
}

export type CollectionStatus = 'COLLECTION' | 'LEAVE';

export interface CRDailyCollection {
    id: string;
    hotel_id: string;
    hotel_name: string;
    collection_date: string;      // ISO date "2026-06-03"
    status: CollectionStatus;
    items: Record<string, number>; // { [item_id]: quantity }
    created_by: string;
    created_at?: Timestamp;
    updated_at?: Timestamp;
}

export interface CRPayment {
    id: string;
    hotel_id: string;
    billing_month: number;        // 1–12
    billing_year: number;         // e.g. 2026
    amount: number;
    payment_date: string;         // ISO date
    remarks: string;
    created_by: string;
    created_at?: Timestamp;
}

// ─── Report Types ───────────────────────────────────────────────────────────

export interface MonthlyReportRow {
    item: CRItem;
    category: CRCategory;
    dailyQuantities: (number | null)[]; // index 0 = day 1, null = no entry
    isLeaveDay: boolean[];              // true if that day was LEAVE
    total: number;
    rate: number;
    amount: number;
}

export interface MonthlyReportData {
    hotelName: string;
    month: number;
    year: number;
    daysInMonth: number;
    rows: MonthlyReportRow[];
    categoryGroups: {
        category: CRCategory;
        rows: MonthlyReportRow[];
    }[];
    grandTotal: number;
    leaveDays: Set<number>;             // day numbers that were LEAVE
}

// ─── Form Types ─────────────────────────────────────────────────────────────

export interface DailyCollectionFormData {
    hotel_id: string;
    hotel_name: string;
    collection_date: string;
    status: CollectionStatus;
    items: Record<string, number>;
}

export interface PaymentFormData {
    amount: number;
    payment_date: string;
    remarks: string;
}
