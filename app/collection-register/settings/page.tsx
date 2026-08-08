'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
    getCategories,
    getItems,
    upsertCategory,
    upsertItem,
    deleteCategory,
    deleteItem,
} from '@/lib/collection-register/firestore-service';
import type { CRCategory, CRItem } from '@/lib/collection-register/types';
import {
    Settings,
    Plus,
    Edit3,
    Trash2,
    ChevronUp,
    ChevronDown,
    Layers,
    Package,
    Save,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [categories, setCategories] = useState<CRCategory[]>([]);
    const [items, setItems] = useState<CRItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Category modal
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CRCategory | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryOrder, setCategoryOrder] = useState(0);
    const [savingCategory, setSavingCategory] = useState(false);

    // Item modal
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<CRItem | null>(null);
    const [itemName, setItemName] = useState('');
    const [itemCategoryId, setItemCategoryId] = useState('');
    const [itemRate, setItemRate] = useState('');
    const [itemOrder, setItemOrder] = useState(0);
    const [itemActive, setItemActive] = useState(true);
    const [savingItem, setSavingItem] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [cats, itms] = await Promise.all([
                getCategories(),
                getItems(false), // include inactive
            ]);
            setCategories(cats);
            setItems(itms);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    }

    // ─── Category Handlers ──────────────────────────────────────────────────

    function openAddCategory() {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryOrder(categories.length + 1);
        setShowCategoryModal(true);
    }

    function openEditCategory(cat: CRCategory) {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setCategoryOrder(cat.display_order);
        setShowCategoryModal(true);
    }

    async function handleSaveCategory() {
        if (!categoryName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setSavingCategory(true);
        try {
            await upsertCategory({
                id: editingCategory?.id,
                name: categoryName.trim(),
                display_order: categoryOrder,
            });
            toast.success(editingCategory ? 'Category updated!' : 'Category added!');
            setShowCategoryModal(false);
            await loadData();
        } catch (error) {
            console.error('Failed to save category:', error);
            toast.error('Failed to save category');
        } finally {
            setSavingCategory(false);
        }
    }

    async function handleDeleteCategory(cat: CRCategory) {
        const catItems = items.filter((i) => i.category_id === cat.id);
        if (catItems.length > 0) {
            toast.error(`Cannot delete "${cat.name}" — it has ${catItems.length} items. Remove items first.`);
            return;
        }
        if (!confirm(`Delete category "${cat.name}"?`)) return;

        try {
            await deleteCategory(cat.id);
            toast.success('Category deleted');
            await loadData();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    }

    // ─── Item Handlers ──────────────────────────────────────────────────────

    function openAddItem(categoryId?: string) {
        setEditingItem(null);
        setItemName('');
        setItemCategoryId(categoryId || categories[0]?.id || '');
        setItemRate('');
        setItemOrder(items.length + 1);
        setItemActive(true);
        setShowItemModal(true);
    }

    function openEditItem(item: CRItem) {
        setEditingItem(item);
        setItemName(item.name);
        setItemCategoryId(item.category_id);
        setItemRate(String(item.rate));
        setItemOrder(item.display_order);
        setItemActive(item.is_active);
        setShowItemModal(true);
    }

    async function handleSaveItem() {
        if (!itemName.trim()) {
            toast.error('Item name is required');
            return;
        }
        if (!itemCategoryId) {
            toast.error('Category is required');
            return;
        }
        const rate = parseFloat(itemRate);
        if (isNaN(rate) || rate < 0) {
            toast.error('Please enter a valid rate');
            return;
        }

        setSavingItem(true);
        try {
            await upsertItem({
                id: editingItem?.id,
                category_id: itemCategoryId,
                name: itemName.trim(),
                rate,
                display_order: itemOrder,
                is_active: itemActive,
            });
            toast.success(editingItem ? 'Item updated!' : 'Item added!');
            setShowItemModal(false);
            await loadData();
        } catch (error) {
            console.error('Failed to save item:', error);
            toast.error('Failed to save item');
        } finally {
            setSavingItem(false);
        }
    }

    async function handleDeleteItem(item: CRItem) {
        if (!confirm(`Delete item "${item.name}"?`)) return;

        try {
            await deleteItem(item.id);
            toast.success('Item deleted');
            await loadData();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    }

    async function handleToggleItemActive(item: CRItem) {
        try {
            await upsertItem({
                id: item.id,
                category_id: item.category_id,
                name: item.name,
                rate: item.rate,
                display_order: item.display_order,
                is_active: !item.is_active,
            });
            await loadData();
            toast.success(item.is_active ? 'Item deactivated' : 'Item activated');
        } catch (error) {
            toast.error('Failed to update item');
        }
    }

    // Get category name by id
    function getCategoryName(categoryId: string): string {
        return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
    }

    return (
        <div className="animate-fade-in-up">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    Settings
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage categories, laundry items, and rates
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'categories'
                            ? 'bg-brand-50 text-brand-700 shadow-sm'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-gray-100'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    Categories
                </button>
                <button
                    onClick={() => setActiveTab('items')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'items'
                            ? 'bg-brand-50 text-brand-700 shadow-sm'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-gray-100'
                        }`}
                >
                    <Package className="w-4 h-4" />
                    Items
                </button>
            </div>

            {loading ? (
                <Card>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 skeleton rounded-lg" />
                        ))}
                    </div>
                </Card>
            ) : (
                <>
                    {/* ─── Categories Tab ─────────────────────────────────────────── */}
                    {activeTab === 'categories' && (
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Categories ({categories.length})
                                </h2>
                                <Button size="sm" onClick={openAddCategory}>
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add Category
                                </Button>
                            </div>

                            {categories.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">No categories yet</p>
                                    <p className="text-xs mt-1">Add categories like &quot;Bed Linen&quot;, &quot;Bath Linen&quot;, etc.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {categories.map((cat) => {
                                        const catItemCount = items.filter((i) => i.category_id === cat.id).length;
                                        return (
                                            <div
                                                key={cat.id}
                                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                                                        {cat.display_order}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                                                        <p className="text-xs text-slate-400">{catItemCount} items</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 transition-opacity">
                                                    <button
                                                        onClick={() => openEditCategory(cat)}
                                                        className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat)}
                                                        className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* ─── Items Tab ──────────────────────────────────────────────── */}
                    {activeTab === 'items' && (
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Items ({items.length})
                                </h2>
                                <Button size="sm" onClick={() => openAddItem()}>
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add Item
                                </Button>
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p className="text-sm">No items yet</p>
                                    <p className="text-xs mt-1">Add laundry items like &quot;Double Bed Sheet&quot;, &quot;Bath Towel&quot;, etc.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Group items by category for display */}
                                    {categories.map((cat) => {
                                        const catItems = items.filter((i) => i.category_id === cat.id);
                                        if (catItems.length === 0) return null;
                                        return (
                                            <div key={cat.id}>
                                                <div className="flex items-center gap-2 px-2 py-2 mt-2 first:mt-0">
                                                    <div className="w-1 h-4 rounded-full bg-brand-400" />
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                        {cat.name}
                                                    </span>
                                                </div>
                                                {catItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group ${item.is_active
                                                                ? 'bg-slate-50/50'
                                                                : 'bg-red-50/30 opacity-60'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-mono">
                                                                {item.display_order}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-sm font-medium truncate ${item.is_active ? 'text-slate-900' : 'text-slate-400 line-through'
                                                                    }`}>
                                                                    {item.name}
                                                                </p>
                                                                <p className="text-xs text-slate-400">
                                                                    Rate: ₹{item.rate.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
<div className="flex items-center gap-1 transition-opacity">
                                                            <button
                                                                onClick={() => handleToggleItemActive(item)}
                                                                className={`p-2 rounded-lg transition-all ${item.is_active
                                                                        ? 'text-emerald-500 hover:bg-emerald-50'
                                                                        : 'text-slate-300 hover:bg-slate-100'
                                                                    }`}
                                                                title={item.is_active ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {item.is_active ? (
                                                                    <ToggleRight className="w-5 h-5" />
                                                                ) : (
                                                                    <ToggleLeft className="w-5 h-5" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => openEditItem(item)}
                                                                className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-all"
                                                                title="Edit"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item)}
                                                                className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    )}
                </>
            )}

            {/* ─── Category Modal ─────────────────────────────────────────────── */}
            <Modal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                title={editingCategory ? 'Edit Category' : 'Add Category'}
            >
                <div className="space-y-4">
                    <Input
                        label="Category Name"
                        placeholder="e.g. Bed Linen"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                    />
                    <Input
                        label="Display Order"
                        type="number"
                        min="1"
                        value={String(categoryOrder)}
                        onChange={(e) => setCategoryOrder(Number(e.target.value))}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowCategoryModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCategory}
                            isLoading={savingCategory}
                            className="flex-1"
                        >
                            <Save className="w-4 h-4 mr-1.5" />
                            Save
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ─── Item Modal ────────────────────────────────────────────────── */}
            <Modal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                title={editingItem ? 'Edit Item' : 'Add Item'}
            >
                <div className="space-y-4">
                    <Input
                        label="Item Name"
                        placeholder="e.g. Double Bed Sheet"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                    />
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Category
                        </label>
                        <select
                            value={itemCategoryId}
                            onChange={(e) => setItemCategoryId(e.target.value)}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        >
                            <option value="">— Select Category —</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Rate (₹)"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 5.00"
                        value={itemRate}
                        onChange={(e) => setItemRate(e.target.value)}
                    />
                    <Input
                        label="Display Order"
                        type="number"
                        min="1"
                        value={String(itemOrder)}
                        onChange={(e) => setItemOrder(Number(e.target.value))}
                    />
                    <div className="flex items-center gap-3 px-1">
                        <button
                            onClick={() => setItemActive(!itemActive)}
                            className={`flex items-center gap-2 text-sm ${itemActive ? 'text-emerald-600' : 'text-slate-400'
                                }`}
                        >
                            {itemActive ? (
                                <ToggleRight className="w-6 h-6" />
                            ) : (
                                <ToggleLeft className="w-6 h-6" />
                            )}
                            {itemActive ? 'Active' : 'Inactive'}
                        </button>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowItemModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveItem}
                            isLoading={savingItem}
                            className="flex-1"
                        >
                            <Save className="w-4 h-4 mr-1.5" />
                            Save
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
