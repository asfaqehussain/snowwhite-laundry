import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    deleteDoc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CR_COLLECTIONS } from './constants';
import type {
    CRCategory,
    CRItem,
    CRDailyCollection,
    CRPayment,
    CollectionStatus,
} from './types';

// ─── Hotels (Read from existing Firestore collection) ───────────────────────

export async function getHotels(): Promise<{ id: string; name: string }[]> {
    const snapshot = await getDocs(collection(db, 'hotels'));
    return snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name as string,
    }));
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CRCategory[]> {
    const q = query(
        collection(db, CR_COLLECTIONS.CATEGORIES),
        orderBy('display_order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRCategory));
}

export async function upsertCategory(
    data: Omit<CRCategory, 'id' | 'created_at'> & { id?: string }
): Promise<string> {
    if (data.id) {
        const ref = doc(db, CR_COLLECTIONS.CATEGORIES, data.id);
        await updateDoc(ref, {
            name: data.name,
            display_order: data.display_order,
        });
        return data.id;
    } else {
        const ref = await addDoc(collection(db, CR_COLLECTIONS.CATEGORIES), {
            name: data.name,
            display_order: data.display_order,
            created_at: serverTimestamp(),
        });
        return ref.id;
    }
}

export async function deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, CR_COLLECTIONS.CATEGORIES, id));
}

// ─── Items ──────────────────────────────────────────────────────────────────

export async function getItems(activeOnly = true): Promise<CRItem[]> {
    let q;
    if (activeOnly) {
        q = query(
            collection(db, CR_COLLECTIONS.ITEMS),
            where('is_active', '==', true),
            orderBy('display_order', 'asc')
        );
    } else {
        q = query(
            collection(db, CR_COLLECTIONS.ITEMS),
            orderBy('display_order', 'asc')
        );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRItem));
}

export async function getItemsByCategory(categoryId: string): Promise<CRItem[]> {
    const q = query(
        collection(db, CR_COLLECTIONS.ITEMS),
        where('category_id', '==', categoryId),
        where('is_active', '==', true),
        orderBy('display_order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRItem));
}

export async function upsertItem(
    data: Omit<CRItem, 'id' | 'created_at'> & { id?: string }
): Promise<string> {
    if (data.id) {
        const ref = doc(db, CR_COLLECTIONS.ITEMS, data.id);
        await updateDoc(ref, {
            category_id: data.category_id,
            name: data.name,
            rate: data.rate,
            display_order: data.display_order,
            is_active: data.is_active,
        });
        return data.id;
    } else {
        const ref = await addDoc(collection(db, CR_COLLECTIONS.ITEMS), {
            category_id: data.category_id,
            name: data.name,
            rate: data.rate,
            display_order: data.display_order,
            is_active: data.is_active,
            created_at: serverTimestamp(),
        });
        return ref.id;
    }
}

export async function deleteItem(id: string): Promise<void> {
    await deleteDoc(doc(db, CR_COLLECTIONS.ITEMS, id));
}

// ─── Daily Collections ──────────────────────────────────────────────────────

export async function getCollection(
    hotelId: string,
    date: string
): Promise<CRDailyCollection | null> {
    const q = query(
        collection(db, CR_COLLECTIONS.DAILY_COLLECTIONS),
        where('hotel_id', '==', hotelId),
        where('collection_date', '==', date)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as CRDailyCollection;
}

export async function saveCollection(
    data: {
        hotel_id: string;
        hotel_name: string;
        collection_date: string;
        status: CollectionStatus;
        items: Record<string, number>;
        created_by: string;
    },
    existingId?: string
): Promise<string> {
    if (existingId) {
        // Update existing
        const ref = doc(db, CR_COLLECTIONS.DAILY_COLLECTIONS, existingId);
        await updateDoc(ref, {
            status: data.status,
            items: data.status === 'LEAVE' ? {} : data.items,
            updated_at: serverTimestamp(),
        });
        return existingId;
    } else {
        // Create new
        const ref = await addDoc(collection(db, CR_COLLECTIONS.DAILY_COLLECTIONS), {
            hotel_id: data.hotel_id,
            hotel_name: data.hotel_name,
            collection_date: data.collection_date,
            status: data.status,
            items: data.status === 'LEAVE' ? {} : data.items,
            created_by: data.created_by,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
        return ref.id;
    }
}

export async function getMonthlyCollections(
    hotelId: string,
    month: number,
    year: number
): Promise<CRDailyCollection[]> {
    // Build date range: "2026-06-01" to "2026-06-30"
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const q = query(
        collection(db, CR_COLLECTIONS.DAILY_COLLECTIONS),
        where('hotel_id', '==', hotelId),
        where('collection_date', '>=', startDate),
        where('collection_date', '<=', endDate),
        orderBy('collection_date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRDailyCollection));
}

// Get recent collections across all hotels (for dashboard)
export async function getRecentCollections(limit = 10): Promise<CRDailyCollection[]> {
    const q = query(
        collection(db, CR_COLLECTIONS.DAILY_COLLECTIONS),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((d) => ({ id: d.id, ...d.data() } as CRDailyCollection));
}

// ─── Payments ───────────────────────────────────────────────────────────────

export async function getPayments(
    hotelId: string,
    month: number,
    year: number
): Promise<CRPayment[]> {
    const q = query(
        collection(db, CR_COLLECTIONS.PAYMENTS),
        where('hotel_id', '==', hotelId),
        where('billing_month', '==', month),
        where('billing_year', '==', year),
        orderBy('payment_date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRPayment));
}

export async function addPayment(data: {
    hotel_id: string;
    billing_month: number;
    billing_year: number;
    amount: number;
    payment_date: string;
    remarks: string;
    created_by: string;
}): Promise<string> {
    const ref = await addDoc(collection(db, CR_COLLECTIONS.PAYMENTS), {
        ...data,
        created_at: serverTimestamp(),
    });
    return ref.id;
}

export async function deletePayment(id: string): Promise<void> {
    await deleteDoc(doc(db, CR_COLLECTIONS.PAYMENTS, id));
}
