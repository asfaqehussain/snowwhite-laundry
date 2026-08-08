import {
    collection,
    doc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategories, getItems } from './firestore-service';
import type { CRItem } from './types';

// ─── Hotel Price List ────────────────────────────────────────────────────────
//
// Each hotel can have its own curated set of items + rates, stored in the
// Firestore sub-collection `hotels/{hotelId}/prices`.
//   - If a hotel has NO entries yet, it falls back to the global/default
//     items & rates (cr_items). This is the "previous rate" shown as-is.
//   - Once the admin saves a price list for the hotel, those items/rates
//     are used everywhere for that hotel.

export interface HotelPriceItem {
    id: string;
    catalogItemId?: string;  // id of the cr_item this was copied from (if any)
    category_id: string;
    name: string;
    rate: number;
    display_order: number;
    is_active: boolean;
    created_at?: ReturnType<typeof serverTimestamp>;
}

const pricesCollection = (hotelId: string) => collection(db, 'hotels', hotelId, 'prices');

export async function getHotelPrices(hotelId: string): Promise<HotelPriceItem[]> {
    const snapshot = await getDocs(query(pricesCollection(hotelId), orderBy('display_order', 'asc')));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as HotelPriceItem));
}

/**
 * Items to be used for a hotel inside the Collection Register.
 * Falls back to the global/default rate list when the hotel has no
 * custom price list saved.
 */
export async function getItemsForHotel(hotelId: string, activeOnly = true): Promise<CRItem[]> {
    const prices = await getHotelPrices(hotelId);
    if (prices.length === 0) {
        return getItems(activeOnly);
    }

    let items = prices.map((p) => ({
        id: p.id,
        category_id: p.category_id,
        name: p.name,
        rate: p.rate,
        display_order: p.display_order,
        is_active: p.is_active !== false,
    }) as CRItem);

    if (activeOnly) {
        items = items.filter((item) => item.is_active !== false);
    }
    return items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

/**
 * Copy the global/default items + rates into this hotel's price list.
 * Existing custom entries for the hotel are replaced.
 */
export async function seedHotelDefaults(hotelId: string): Promise<number> {
    const [items, categories] = await Promise.all([
        getItems(false),
        getCategories(),
    ]);

    const categoryMap = new Map<string, number>();
    for (const cat of categories) {
        categoryMap.set(cat.id, cat.display_order || 0);
    }

    const data = items.map((item, idx) => ({
        catalogItemId: item.id,
        category_id: item.category_id,
        name: item.name,
        rate: item.rate,
        display_order: item.display_order || idx + 1,
        is_active: item.is_active !== false,
    }));

    await replaceHotelPrices(hotelId, data);
    return data.length;
}

/**
 * Replace the full price list of a hotel with the provided items.
 * Existing entries are removed first, then the new list is written.
 */
export async function replaceHotelPrices(
    hotelId: string,
    items: Array<Omit<HotelPriceItem, 'id' | 'created_at'>>
): Promise<void> {
    const existing = await getHotelPrices(hotelId);
    const batch = writeBatch(db);
    for (const item of existing) {
        batch.delete(doc(pricesCollection(hotelId), item.id));
    }
    for (const item of items) {
        // Items copied from the global list keep the global item id as their
        // doc id, so previously saved collection entries keep matching.
        const ref = item.catalogItemId
            ? doc(pricesCollection(hotelId), item.catalogItemId)
            : doc(pricesCollection(hotelId));
        batch.set(ref, {
            ...item,
            created_at: serverTimestamp(),
        });
    }
    await batch.commit();
}