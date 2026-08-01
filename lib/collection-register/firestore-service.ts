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
    const hotels = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name as string,
    }));

    if (hotels.length === 0) {
        const ref = await addDoc(collection(db, 'hotels'), {
            name: 'Amaratara, Maval',
            is_active: true,
            createdAt: serverTimestamp(),
        });
        return [{ id: ref.id, name: 'Amaratara, Maval' }];
    }

    return hotels;
}

export async function seedDefaultData(): Promise<{ categoriesAdded: number; itemsAdded: number }> {
    const existingCats = await getCategories();
    if (existingCats.length > 0) {
        return { categoriesAdded: 0, itemsAdded: 0 };
    }

    const defaultData = [
        {
            category: 'Bed Linen',
            order: 1,
            items: [
                { name: 'D. Double Bed Sheet', rate: 18, order: 1 },
                { name: 'S. Bed Sheet', rate: 13, order: 2 },
                { name: 'D. Dovet Cover', rate: 25, order: 3 },
                { name: 'S. Dovet Cover', rate: 18, order: 4 },
                { name: 'D- Mat- Proctor', rate: 35, order: 5 },
                { name: 'S. Mat Proctor', rate: 0, order: 6 },
                { name: 'Pillow Cover', rate: 7, order: 7 },
                { name: 'Sheer Curratin', rate: 0, order: 8 },
                { name: 'Runner', rate: 15, order: 9 },
                { name: 'Cussain Cover', rate: 7, order: 10 },
            ],
        },
        {
            category: 'Bath Linen',
            order: 2,
            items: [
                { name: 'Bath Towel', rate: 14, order: 1 },
                { name: 'Hand Towel', rate: 6, order: 2 },
                { name: 'Bath Mat', rate: 7, order: 3 },
                { name: 'Ice Towel', rate: 6, order: 4 },
                { name: 'Bath Robe', rate: 20, order: 5 },
                { name: 'Pool Towel', rate: 15, order: 6 },
            ],
        },
        {
            category: 'F&B Linen',
            order: 3,
            items: [
                { name: 'Table Cover', rate: 16, order: 1 },
                { name: 'Table Top', rate: 15, order: 2 },
                { name: 'Chair Cover', rate: 12, order: 3 },
                { name: 'Chair Cover Belt', rate: 0, order: 4 },
            ],
        },
    ];

    let categoriesAdded = 0;
    let itemsAdded = 0;

    for (const group of defaultData) {
        const catId = await upsertCategory({
            name: group.category,
            display_order: group.order,
        });
        categoriesAdded++;

        for (const item of group.items) {
            await upsertItem({
                category_id: catId,
                name: item.name,
                rate: item.rate,
                display_order: item.order,
                is_active: true,
            });
            itemsAdded++;
        }
    }

    return { categoriesAdded, itemsAdded };
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CRCategory[]> {
    const snapshot = await getDocs(collection(db, CR_COLLECTIONS.CATEGORIES));
    const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRCategory));
    return cats.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
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
    const snapshot = await getDocs(collection(db, CR_COLLECTIONS.ITEMS));
    let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRItem));
    if (activeOnly) {
        items = items.filter((item) => item.is_active !== false);
    }
    return items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

export async function getItemsByCategory(categoryId: string): Promise<CRItem[]> {
    const snapshot = await getDocs(collection(db, CR_COLLECTIONS.ITEMS));
    return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as CRItem))
        .filter((item) => item.category_id === categoryId && item.is_active !== false)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
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
    // Fetch all collections for this hotel, then filter by date range client-side
    const q = query(
        collection(db, CR_COLLECTIONS.DAILY_COLLECTIONS),
        where('hotel_id', '==', hotelId)
    );
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRDailyCollection));

    // Filter by date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    return all
        .filter((c) => c.collection_date >= startDate && c.collection_date <= endDate)
        .sort((a, b) => a.collection_date.localeCompare(b.collection_date));
}

// Get recent collections across all hotels (for dashboard)
export async function getRecentCollections(limit = 10): Promise<CRDailyCollection[]> {
    const snapshot = await getDocs(collection(db, CR_COLLECTIONS.DAILY_COLLECTIONS));
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRDailyCollection));
    // Sort by collection_date descending
    return all
        .sort((a, b) => b.collection_date.localeCompare(a.collection_date))
        .slice(0, limit);
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
        where('billing_year', '==', year)
    );
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CRPayment));
    return payments.sort((a, b) => (a.payment_date || '').localeCompare(b.payment_date || ''));
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
