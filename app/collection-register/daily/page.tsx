'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
    getHotels,
    getCategories,
    getItems,
    getCollection,
    saveCollection,
} from '@/lib/collection-register/firestore-service';
import type { CRCategory, CRItem, CRDailyCollection, CollectionStatus } from '@/lib/collection-register/types';
import { toISODate, COLLECTION_STATUS } from '@/lib/collection-register/constants';
import { CalendarPlus, ChevronDown, ChevronUp, Save, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface HotelOption {
    id: string;
    name: string;
}

interface CategoryWithItems {
    category: CRCategory;
    items: CRItem[];
}

export default function DailyCollectionPage() {
    const { profile } = useAuth();

    // Selection state
    const [hotels, setHotels] = useState<HotelOption[]>([]);
    const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);
    const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

    // Form state
    const [status, setStatus] = useState<CollectionStatus>('COLLECTION');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [categoryItems, setCategoryItems] = useState<CategoryWithItems[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Loading/existing state
    const [loadingHotels, setLoadingHotels] = useState(true);
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [existingCollection, setExistingCollection] = useState<CRDailyCollection | null>(null);
    const [formReady, setFormReady] = useState(false);

    // Load hotels on mount
    useEffect(() => {
        loadHotels();
    }, []);

    async function loadHotels() {
        try {
            const h = await getHotels();
            setHotels(h);
        } catch (error) {
            console.error('Failed to load hotels:', error);
            toast.error('Failed to load hotels');
        } finally {
            setLoadingHotels(false);
        }
    }

    // Load form data when hotel + date are selected
    const loadFormData = useCallback(async () => {
        if (!selectedHotel || !selectedDate) return;

        setLoadingForm(true);
        setFormReady(false);

        try {
            // Fetch categories and items
            const [categories, items] = await Promise.all([
                getCategories(),
                getItems(true),
            ]);

            // Group items by category
            const grouped: CategoryWithItems[] = categories.map((cat) => ({
                category: cat,
                items: items
                    .filter((item) => item.category_id === cat.id)
                    .sort((a, b) => a.display_order - b.display_order),
            })).filter((g) => g.items.length > 0);

            setCategoryItems(grouped);

            // Expand all categories by default
            setExpandedCategories(new Set(grouped.map((g) => g.category.id)));

            // Check for existing collection
            const existing = await getCollection(selectedHotel.id, selectedDate);

            if (existing) {
                setExistingCollection(existing);
                setStatus(existing.status);
                // Pre-fill quantities
                const q: Record<string, number> = {};
                for (const item of items) {
                    q[item.id] = existing.items?.[item.id] ?? 0;
                }
                setQuantities(q);
            } else {
                setExistingCollection(null);
                setStatus('COLLECTION');
                // Initialize all quantities to 0
                const q: Record<string, number> = {};
                for (const item of items) {
                    q[item.id] = 0;
                }
                setQuantities(q);
            }

            setFormReady(true);
        } catch (error) {
            console.error('Failed to load form data:', error);
            toast.error('Failed to load form data');
        } finally {
            setLoadingForm(false);
        }
    }, [selectedHotel, selectedDate]);

    useEffect(() => {
        if (selectedHotel && selectedDate) {
            loadFormData();
        }
    }, [selectedHotel, selectedDate, loadFormData]);

    // Update quantity
    function handleQuantityChange(itemId: string, value: string) {
        const num = parseInt(value, 10);
        setQuantities((prev) => ({
            ...prev,
            [itemId]: isNaN(num) || num < 0 ? 0 : num,
        }));
    }

    // Toggle category expand/collapse
    function toggleCategory(categoryId: string) {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    }

    // Save collection
    async function handleSave() {
        if (!selectedHotel || !selectedDate || !profile) return;

        setSaving(true);
        try {
            await saveCollection(
                {
                    hotel_id: selectedHotel.id,
                    hotel_name: selectedHotel.name,
                    collection_date: selectedDate,
                    status,
                    items: quantities,
                    created_by: profile.uid,
                },
                existingCollection?.id
            );

            toast.success(
                existingCollection ? 'Collection updated successfully!' : 'Collection saved successfully!',
                { icon: '✅' }
            );

            // Reload to reflect saved state
            await loadFormData();
        } catch (error) {
            console.error('Failed to save collection:', error);
            toast.error('Failed to save collection');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="animate-fade-in-up">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    Daily Collection
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Enter daily laundry collection quantities for a hotel
                </p>
            </div>

            {/* Step 1 & 2: Hotel + Date Selection */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Hotel Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Select Hotel
                        </label>
                        <select
                            value={selectedHotel?.id || ''}
                            onChange={(e) => {
                                const hotel = hotels.find((h) => h.id === e.target.value);
                                setSelectedHotel(hotel || null);
                            }}
                            disabled={loadingHotels}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        >
                            <option value="">
                                {loadingHotels ? 'Loading hotels...' : '— Choose a hotel —'}
                            </option>
                            {hotels.map((hotel) => (
                                <option key={hotel.id} value={hotel.id}>
                                    {hotel.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        />
                    </div>
                </div>

                {/* Existing entry indicator */}
                {formReady && existingCollection && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                            An entry already exists for this hotel and date. Editing existing record.
                        </p>
                    </div>
                )}
            </Card>

            {/* Loading state */}
            {loadingForm && (
                <Card>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 skeleton rounded-lg" />
                        ))}
                    </div>
                </Card>
            )}

            {/* Form - only show when ready */}
            {formReady && !loadingForm && (
                <>
                    {/* Status Toggle */}
                    <Card className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Collection Status
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStatus('COLLECTION')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${status === 'COLLECTION'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                        : 'bg-white text-slate-500 border-gray-200 hover:bg-slate-50'
                                    }`}
                            >
                                {status === 'COLLECTION' && <Check className="w-4 h-4" />}
                                Collection
                            </button>
                            <button
                                onClick={() => setStatus('LEAVE')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${status === 'LEAVE'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                                        : 'bg-white text-slate-500 border-gray-200 hover:bg-slate-50'
                                    }`}
                            >
                                {status === 'LEAVE' && <Check className="w-4 h-4" />}
                                Leave
                            </button>
                        </div>
                        {status === 'LEAVE' && (
                            <p className="mt-3 text-xs text-amber-600 bg-amber-50/50 px-3 py-2 rounded-lg">
                                No quantities will be saved for this day. The entry will be marked as Leave.
                            </p>
                        )}
                    </Card>

                    {/* Item Entry - grouped by category */}
                    {status === 'COLLECTION' && (
                        <div className="space-y-4 mb-6">
                            {categoryItems.map(({ category, items }) => {
                                const isExpanded = expandedCategories.has(category.id);
                                return (
                                    <Card key={category.id} className="!p-0 overflow-hidden">
                                        {/* Category Header */}
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 rounded-full bg-brand-500" />
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                                    {category.name}
                                                </h3>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {items.length} items
                                                </span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>

                                        {/* Items */}
                                        {isExpanded && (
                                            <div className="px-5 pb-4 divide-y divide-gray-50">
                                                {items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between py-3 gap-4"
                                                    >
                                                        <label className="text-sm text-slate-700 font-medium flex-1">
                                                            {item.name}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={quantities[item.id] ?? 0}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className="w-24 text-center rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-sm px-3 py-2.5 font-medium"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="sticky bottom-4 z-10">
                        <Button
                            onClick={handleSave}
                            isLoading={saving}
                            size="lg"
                            className="w-full sm:w-auto shadow-lg shadow-brand-500/30"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {existingCollection ? 'Update Collection' : 'Save Collection'}
                        </Button>
                    </div>
                </>
            )}

            {/* Empty state - prompt to select hotel and date */}
            {!formReady && !loadingForm && (
                <Card>
                    <div className="text-center py-16 text-slate-400">
                        <CalendarPlus className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p className="text-sm font-medium">Select a hotel and date to begin</p>
                        <p className="text-xs mt-1">
                            Choose a hotel and date above to enter collection data
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
