'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
    getHotelPrices,
    seedHotelDefaults,
    replaceHotelPrices,
} from '@/lib/collection-register/hotel-service';
import type { HotelPriceItem } from '@/lib/collection-register/hotel-service';
import {
    getCategories,
    getItems,
} from '@/lib/collection-register/firestore-service';
import type { CRCategory } from '@/lib/collection-register/types';
import {
    ArrowLeft,
    Building2,
    Plus,
    Trash2,
    Save,
    RefreshCw,
    Package,
    ToggleLeft,
    ToggleRight,
    Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PriceRow {
    id: string;
    catalogItemId?: string;
    category_id: string;
    name: string;
    rate: string;
    is_active: boolean;
}

export default function HotelPriceListPage() {
    const { hotelId } = useParams();
    const router = useRouter();

    const [hotelName, setHotelName] = useState('Loading...');
    const [categories, setCategories] = useState<CRCategory[]>([]);
    const [rows, setRows] = useState<PriceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // Add item modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategoryId, setNewCategoryId] = useState('');
    const [newRate, setNewRate] = useState('');
    const [addingItem, setAddingItem] = useState(false);

    const id = hotelId as string;

    // Hot-reload hotel name so it stays in sync with edits
    useEffect(() => {
        if (!id) return;
        const unsub = onSnapshot(doc(db, 'hotels', id), (snap) => {
            if (snap.exists()) setHotelName(snap.data().name ?? 'Hotel');
        });
        return () => unsub();
    }, [id]);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [cats, prices, globalItems] = await Promise.all([
                getCategories(),
                getHotelPrices(id),
                getItems(false),
            ]);
            setCategories(cats);

            const source = prices.length > 0 ? prices : globalItems;
            setRows(source.map((p) => ({
                id: p.id,
                catalogItemId: 'catalogItemId' in p ? (p as HotelPriceItem).catalogItemId : p.id,
                category_id: p.category_id,
                name: p.name,
                rate: String(p.rate),
                is_active: p.is_active !== false,
            })));
        } catch (error) {
            console.error('Failed to load price list:', error);
            toast.error('Failed to load price list');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const updateRow = (idx: number, patch: Partial<PriceRow>) => {
        setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    };

    const removeRow = (idx: number) => {
        setRows(prev => prev.filter((_, i) => i !== idx));
    };

    const toggleActive = (idx: number) => {
        updateRow(idx, { is_active: !rows[idx].is_active });
    };

    const handleSeedDefaults = async () => {
        if (!id) return;
        if (!confirm('Replace this hotel\'s item list with the default/global rate list?')) return;
        setSeeding(true);
        try {
            await seedHotelDefaults(id);
            toast.success('Loaded default rate list — edit as needed, then Save');
            await load();
        } catch (error) {
            console.error(error);
            toast.error('Failed to load default rate list');
        } finally {
            setSeeding(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;
        const invalid = rows.find(r => !r.name.trim() || isNaN(parseFloat(r.rate)) || parseFloat(r.rate) < 0);
        if (invalid) {
            toast.error('Please make sure every item has a name and a valid rate');
            return;
        }
        if (rows.length === 0) {
            toast.error('Add at least one item before saving');
            return;
        }
        setSaving(true);
        try {
            await replaceHotelPrices(id, rows.map((r, idx) => ({
                catalogItemId: r.catalogItemId,
                category_id: r.category_id,
                name: r.name.trim(),
                rate: parseFloat(r.rate),
                display_order: idx + 1,
                is_active: r.is_active,
            })));
            toast.success('Price list saved');
            await load();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save price list');
        } finally {
            setSaving(false);
        }
    };

    const handleAddItem = async () => {
        if (!newName.trim()) {
            toast.error('Item name is required');
            return;
        }
        if (!newCategoryId) {
            toast.error('Please choose a category');
            return;
        }
        const rate = parseFloat(newRate);
        if (isNaN(rate) || rate < 0) {
            toast.error('Please enter a valid rate');
            return;
        }
        setAddingItem(true);
        try {
            setRows(prev => [...prev, {
                id: `draft-${Date.now()}`,
                category_id: newCategoryId,
                name: newName.trim(),
                rate: newRate,
                is_active: true,
            }]);
            setShowAddModal(false);
            setNewName('');
            setNewCategoryId('');
            setNewRate('');
            toast.success('Item added — click Save to persist');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add item');
        } finally {
            setAddingItem(false);
        }
    };

    const grouped = categories
        .map(cat => ({ cat, items: rows.filter(r => r.category_id === cat.id) }))
        .filter(g => g.items.length > 0);

    const totalItems = rows.length;
    const avgRate = rows.length ? rows.reduce((s, r) => s + (parseFloat(r.rate) || 0), 0) / rows.length : 0;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/hotels')}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 font-heading">{hotelName}</h1>
                        <p className="text-slate-500 text-sm">Items &amp; rates for this hotel</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSeedDefaults} isLoading={seeding}>
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Load Default Rates
                    </Button>
                    <Button size="sm" onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="!p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Total Items</p>
                            <p className="text-xl font-bold text-slate-900">{totalItems}</p>
                        </div>
                    </div>
                </Card>
                <Card className="!p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Categories</p>
                            <p className="text-xl font-bold text-slate-900">{grouped.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="!p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Avg Rate</p>
                            <p className="text-xl font-bold text-slate-900">₹{avgRate.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {loading ? (
                <Card>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-12 skeleton rounded-lg" />
                        ))}
                    </div>
                </Card>
            ) : rows.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No items yet</h3>
                    <p className="text-slate-500 max-w-sm mt-1 text-sm">
                        Load the default rate list to start from the standard items &amp; rates,
                        or add your own items.
                    </p>
                    <div className="flex gap-3 mt-5">
                        <Button variant="outline" onClick={handleSeedDefaults} isLoading={seeding}>
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            Load Default Rates
                        </Button>
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Item
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card noPadding>
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Price List ({totalItems} items)
                        </h2>
                        <span className="text-xs text-slate-400">
                            Rates shown apply to <strong className="text-slate-600">{hotelName}</strong> only
                        </span>
                    </div>

                    <div className="p-5 space-y-5">
                        {grouped.map(({ cat, items }) => (
                            <div key={cat.id}>
                                <div className="flex items-center gap-2 px-2 py-2">
                                    <div className="w-1 h-4 rounded-full bg-brand-400" />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        {cat.name}
                                    </span>
                                    <span className="text-xs text-slate-400">{items.length}</span>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-100">
                                    {/* Header */}
                                    <div className="grid grid-cols-12 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                        <span className="col-span-5">Item</span>
                                        <span className="col-span-3 text-center">Rate (₹)</span>
                                        <span className="col-span-2 text-center">Active</span>
                                        <span className="col-span-2 text-right">Actions</span>
                                    </div>

                                    {items.map((item) => {
                                        const globalIdx = rows.findIndex(r => r.id === item.id);
                                        const isActive = rows[globalIdx]?.is_active;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`grid grid-cols-12 items-center px-4 py-2.5 border-b border-slate-50 last:border-0 transition-colors ${isActive ? '' : 'bg-red-50/40 opacity-70'}`}
                                            >
                                                <span className="col-span-5 text-sm font-medium text-slate-800 truncate pr-2">
                                                    {item.name}
                                                </span>
                                                <div className="col-span-3 flex justify-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={rows[globalIdx]?.rate ?? ''}
                                                        onChange={e => updateRow(globalIdx, { rate: e.target.value })}
                                                        className="w-24 text-center text-sm font-bold rounded-lg border border-slate-200 py-1.5 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 transition-all bg-gray-50 focus:bg-white"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <button
                                                        onClick={() => toggleActive(globalIdx)}
                                                        className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-300'}`}
                                                        title={isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                                    </button>
                                                </div>
                                                <div className="col-span-2 flex justify-end">
                                                    <button
                                                        onClick={() => removeRow(globalIdx)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sticky save bar */}
                    <div className="px-5 py-4 border-t border-slate-50 bg-slate-50/60 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            Changes apply only after you click Save
                        </span>
                        <Button onClick={handleSave} isLoading={saving}>
                            <Save className="h-4 w-4 mr-1.5" />
                            Save Price List
                        </Button>
                    </div>
                </Card>
            )}

            {/* Add Item Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Item"
            >
                <div className="space-y-4">
                    <Input
                        label="Item Name"
                        placeholder="e.g. Double Bed Sheet"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Category
                        </label>
                        <select
                            value={newCategoryId}
                            onChange={e => setNewCategoryId(e.target.value)}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        >
                            <option value="">— Select Category —</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Rate (₹)"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 15.00"
                        value={newRate}
                        onChange={e => setNewRate(e.target.value)}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleAddItem} isLoading={addingItem} className="flex-1">
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Item
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}