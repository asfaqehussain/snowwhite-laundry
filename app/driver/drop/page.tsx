'use client';

import { useEffect, useState } from 'react';
import {
    collection, query, where, getDocs, writeBatch,
    documentId, doc, serverTimestamp, addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load, LoadItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { createNotification, broadcastNotification } from '@/lib/notifications';
import DropConfirmModal, { buildDropRows } from '@/components/ui/drop-confirm-modal';
import { ApprovalRowSkeleton } from '@/components/ui/page-loader';

// A load augmented with per-item dropping quantities
interface ActiveLoad extends Load {
    hotelName: string;
    droppingQtys: Record<string, number>; // key = item type
}

export default function DropPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [activeLoads, setActiveLoads] = useState<ActiveLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Confirmation modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingLoad, setPendingLoad] = useState<ActiveLoad | null>(null);

    useEffect(() => {
        if (user) fetchActiveLoads();
    }, [user]);

    const fetchActiveLoads = async () => {
        try {
            const q = query(
                collection(db, 'loads'),
                where('driverId', '==', user!.uid),
                where('status', 'in', ['collected', 'processing', 'partially_dropped'])
            );
            const snapshot = await getDocs(q);
            const loadsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Load));

            if (loadsData.length === 0) { setActiveLoads([]); setLoading(false); return; }

            // Fetch hotel names
            const hotelIds = [...new Set(loadsData.map(l => l.hotelId))];
            const hotelMap: Record<string, string> = {};
            for (let i = 0; i < hotelIds.length; i += 10) {
                const chunk = hotelIds.slice(i, i + 10);
                const hotelsQ = query(collection(db, 'hotels'), where(documentId(), 'in', chunk));
                const hotelsSnap = await getDocs(hotelsQ);
                hotelsSnap.forEach(d => { hotelMap[d.id] = d.data().name; });
            }

            setActiveLoads(loadsData.map(l => {
                // For partially_dropped loads, the "items" to drop are the remainingItems
                const itemsToDrop = (l.status === 'partially_dropped' && l.remainingItems && l.remainingItems.length > 0)
                    ? l.remainingItems
                    : l.items;

                return {
                    ...l,
                    hotelName: hotelMap[l.hotelId] ?? 'Unknown Hotel',
                    droppingQtys: Object.fromEntries(itemsToDrop.map(i => [i.type, i.quantity])),
                };
            }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to load active items');
        } finally {
            setLoading(false);
        }
    };

    // Returns the effective items list (remaining for partial_dropped, original otherwise)
    const effectiveItems = (load: ActiveLoad): LoadItem[] => {
        if (load.status === 'partially_dropped' && load.remainingItems?.length) {
            return load.remainingItems;
        }
        return load.items;
    };

    const updateDroppingQty = (loadId: string, itemType: string, qty: number) => {
        setActiveLoads(prev => prev.map(l => {
            if (l.id !== loadId) return l;
            const maxQty = effectiveItems(l).find(i => i.type === itemType)?.quantity ?? 0;
            return {
                ...l,
                droppingQtys: {
                    ...l.droppingQtys,
                    [itemType]: Math.max(0, Math.min(qty, maxQty))
                }
            };
        }));
    };

    const openConfirm = (load: ActiveLoad) => {
        const items = effectiveItems(load);
        const dropping = Object.entries(load.droppingQtys).map(([type, quantity]) => ({ type, quantity }));
        const rows = buildDropRows(items, dropping);
        if (rows.every(r => r.dropping === 0)) {
            toast.error('Please enter at least 1 item to drop');
            return;
        }
        setPendingLoad(load);
        setModalOpen(true);
    };

    const handleDrop = async () => {
        if (!pendingLoad) return;
        setSubmitting(true);
        try {
            const load = pendingLoad;
            const items = effectiveItems(load);
            const dropping: LoadItem[] = items.map(i => ({
                type: i.type,
                quantity: load.droppingQtys[i.type] ?? 0,
            }));
            const remaining: LoadItem[] = items
                .map(i => ({ type: i.type, quantity: i.quantity - (load.droppingQtys[i.type] ?? 0) }))
                .filter(i => i.quantity > 0);

            const isPartial = remaining.length > 0;
            const newStatus = isPartial ? 'partially_dropped' : 'dropped';

            // Merge droppedItems if this is a follow-up partial drop
            const previousDropped = load.droppedItems ?? [];
            const mergedDropped: LoadItem[] = [...previousDropped];
            dropping.forEach(d => {
                const existing = mergedDropped.find(m => m.type === d.type);
                if (existing) existing.quantity += d.quantity;
                else mergedDropped.push({ ...d });
            });

            const batch = writeBatch(db);
            const loadRef = doc(db, 'loads', load.id);
            batch.update(loadRef, {
                status: newStatus,
                droppedAt: serverTimestamp(),
                droppedItems: mergedDropped,
                remainingItems: isPartial ? remaining : [],
            });
            await batch.commit();

            // Notifications
            const adminUids = (await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')))).docs.map(d => d.id);
            const hotelManagerSnap = await getDocs(query(
                collection(db, 'users'),
                where('assignedHotels', 'array-contains', load.hotelId),
                where('role', '==', 'hotel_manager')
            ));
            const managerUids = hotelManagerSnap.docs.map(d => d.id);

            if (isPartial) {
                const remSummary = remaining.map(r => `${r.type} ×${r.quantity}`).join(', ');
                const partialMsg = `⚠️ Partial drop by ${profile?.name ?? 'Driver'} at ${load.hotelName}. Remaining: ${remSummary}`;

                await broadcastNotification({
                    type: 'load_partial',
                    title: '⚠️ Partial Drop',
                    body: partialMsg,
                    loadId: load.id,
                    hotelId: load.hotelId,
                }, [...managerUids, ...adminUids]);

                toast.success('Partial drop recorded! Hotel manager notified.');
            } else {
                const totalPcs = dropping.reduce((s, d) => s + d.quantity, 0);
                await broadcastNotification({
                    type: 'load_dropped',
                    title: '📦 Load Dropped for Approval',
                    body: `${profile?.name ?? 'Driver'} dropped all ${totalPcs} pieces at ${load.hotelName}. Please approve.`,
                    loadId: load.id,
                    hotelId: load.hotelId,
                }, managerUids);

                await broadcastNotification({
                    type: 'load_dropped',
                    title: `📦 Load Dropped at ${load.hotelName}`,
                    body: `${profile?.name ?? 'Driver'} dropped all ${totalPcs} pieces. Awaiting hotel approval.`,
                    loadId: load.id,
                    hotelId: load.hotelId,
                }, adminUids);

                toast.success('Load dropped! Hotel manager notified for approval.');
            }

            setModalOpen(false);
            router.push('/driver');
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit drop');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-slate-400 hover:text-slate-800 transition-colors p-2 -ml-2 rounded-xl hover:bg-slate-100">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-heading">Drop Items</h1>
                    <p className="text-sm text-slate-500">Enter quantity you are dropping per item</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <ApprovalRowSkeleton key={i} />)}
                </div>
            ) : activeLoads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <Package className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">No active loads to drop</p>
                    <p className="text-sm text-slate-400 mt-1">Collect items from a hotel first.</p>
                </div>
            ) : (
                <div className="space-y-6 pb-8">
                    {activeLoads.map(load => {
                        const items = effectiveItems(load);
                        const isFollowUp = load.status === 'partially_dropped';

                        return (
                            <div key={load.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Load Header */}
                                <div className={`px-5 py-4 flex items-center justify-between border-b ${isFollowUp ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900">{load.hotelName}</h3>
                                            {isFollowUp && (
                                                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">REMAINING</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {isFollowUp
                                                ? `Previously dropped some items — dropping remainder`
                                                : `Collected: ${format(load.collectedAt.toDate(), 'MMM d, yyyy')}`
                                            }
                                        </p>
                                    </div>
                                    {isFollowUp
                                        ? <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        : <CheckCircle2 className="h-5 w-5 text-slate-400" />
                                    }
                                </div>

                                {/* Items */}
                                <div className="p-5 space-y-4">
                                    {/* Column headers */}
                                    <div className="grid grid-cols-3 text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
                                        <span>Item</span>
                                        <span className="text-center">{isFollowUp ? 'Remaining' : 'Picked'}</span>
                                        <span className="text-center">Dropping</span>
                                    </div>

                                    {items.map((item, idx) => {
                                        const droppingQty = load.droppingQtys[item.type] ?? item.quantity;
                                        const remaining = item.quantity - droppingQty;
                                        return (
                                            <div key={idx} className={`grid grid-cols-3 items-center gap-3 p-3 rounded-xl border transition-colors ${remaining > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{item.type}</p>
                                                    {remaining > 0 && (
                                                        <p className="text-xs text-amber-600 mt-0.5">{remaining} remaining</p>
                                                    )}
                                                </div>
                                                <p className="text-center text-sm font-bold text-slate-600">{item.quantity}</p>
                                                <div className="flex items-center gap-1.5 justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateDroppingQty(load.id, item.type, droppingQty - 1)}
                                                        className="h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold transition-colors text-lg leading-none"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={item.quantity}
                                                        value={droppingQty}
                                                        onChange={e => updateDroppingQty(load.id, item.type, parseInt(e.target.value) || 0)}
                                                        className={`w-12 text-center text-sm font-bold rounded-lg border py-1.5 outline-none focus:ring-2 transition-all ${droppingQty < item.quantity
                                                            ? 'border-amber-300 text-amber-700 bg-amber-50 focus:ring-amber-200'
                                                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 focus:ring-emerald-200'
                                                            }`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateDroppingQty(load.id, item.type, droppingQty + 1)}
                                                        className="h-8 w-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold transition-colors text-lg leading-none"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Drop button */}
                                <div className="px-5 pb-5">
                                    <Button
                                        onClick={() => openConfirm(load)}
                                        className="w-full"
                                        variant={items.some(i => (load.droppingQtys[i.type] ?? i.quantity) < i.quantity) ? 'danger' : 'primary'}
                                    >
                                        {items.some(i => (load.droppingQtys[i.type] ?? i.quantity) < i.quantity)
                                            ? '⚠️ Drop Partial Items'
                                            : '✓ Drop All Items'
                                        }
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirmation Modal */}
            {pendingLoad && (
                <DropConfirmModal
                    isOpen={modalOpen}
                    hotelName={pendingLoad.hotelName}
                    rows={buildDropRows(
                        effectiveItems(pendingLoad),
                        Object.entries(pendingLoad.droppingQtys).map(([type, quantity]) => ({ type, quantity }))
                    )}
                    onConfirm={handleDrop}
                    onCancel={() => { setModalOpen(false); setPendingLoad(null); }}
                    isLoading={submitting}
                />
            )}
        </div>
    );
}
