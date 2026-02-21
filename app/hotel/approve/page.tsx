'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    collection, query, where, getDocs, doc,
    updateDoc, serverTimestamp, documentId
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load, LoadItem } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createNotification, broadcastNotification } from '@/lib/notifications';
import toast from 'react-hot-toast';
import {
    CheckCircle2, AlertTriangle, Package, Truck,
    Building2, Clock, ChevronDown, ChevronUp, User
} from 'lucide-react';
import { ApprovalRowSkeleton } from '@/components/ui/page-loader';

interface ApprovalItem extends LoadItem {
    approvedQty: number;  // what the manager confirms received
}

interface PendingLoad extends Load {
    hotelName: string;
    driverName: string;
    driverId: string;
    expanded: boolean;
    approvalItems: ApprovalItem[];
    approvalNotes: string;
}

// Fetch admin uids helper
async function fetchAdminUids(): Promise<string[]> {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    return snap.docs.map(d => d.id);
}

export default function HotelApprovePage() {
    const { profile } = useAuth();
    const [pendingLoads, setPendingLoads] = useState<PendingLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null); // loadId being submitted

    const fetchPending = useCallback(async () => {
        if (!profile?.assignedHotels?.length) { setLoading(false); return; }
        const hotelId = profile.assignedHotels[0];
        try {
            // Get dropped loads for this hotel awaiting approval
            const q = query(
                collection(db, 'loads'),
                where('hotelId', '==', hotelId),
                where('status', '==', 'dropped')
            );
            const snap = await getDocs(q);
            const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Load));

            // Sort newest first (client-side)
            const sorted = raw.sort((a, b) =>
                (b.droppedAt?.toMillis?.() ?? 0) - (a.droppedAt?.toMillis?.() ?? 0)
            );

            if (sorted.length === 0) { setPendingLoads([]); setLoading(false); return; }

            // Fetch driver names
            const driverIds = [...new Set(sorted.map(l => l.driverId))];
            const driverMap: Record<string, string> = {};
            for (let i = 0; i < driverIds.length; i += 10) {
                const chunk = driverIds.slice(i, i + 10);
                const dSnap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
                dSnap.forEach(d => { driverMap[d.id] = d.data().name; });
            }

            setPendingLoads(sorted.map(load => ({
                ...load,
                hotelName: profile.name ?? 'Hotel',
                driverName: driverMap[load.driverId] ?? 'Unknown Driver',
                expanded: true,
                approvalItems: load.items.map(item => ({
                    ...item,
                    approvedQty: item.quantity, // default: all approved
                })),
                approvalNotes: '',
            })));
        } catch (err) {
            console.error('fetchPending error:', err);
            toast.error('Failed to load pending approvals');
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const toggleExpand = (loadId: string) => {
        setPendingLoads(prev => prev.map(l =>
            l.id === loadId ? { ...l, expanded: !l.expanded } : l
        ));
    };

    const updateApprovedQty = (loadId: string, itemIdx: number, qty: number) => {
        setPendingLoads(prev => prev.map(l => {
            if (l.id !== loadId) return l;
            const updated = [...l.approvalItems];
            updated[itemIdx] = { ...updated[itemIdx], approvedQty: Math.max(0, Math.min(qty, updated[itemIdx].quantity)) };
            return { ...l, approvalItems: updated };
        }));
    };

    const updateApprovalNotes = (loadId: string, notes: string) => {
        setPendingLoads(prev => prev.map(l =>
            l.id === loadId ? { ...l, approvalNotes: notes } : l
        ));
    };

    const handleApprove = async (load: PendingLoad) => {
        setSubmitting(load.id);
        try {
            const approvedItems = load.approvalItems.map(i => ({ type: i.type, quantity: i.approvedQty }));
            const remainingItems = load.approvalItems
                .filter(i => i.approvedQty < i.quantity)
                .map(i => ({ type: i.type, quantity: i.quantity - i.approvedQty }));

            const isPartial = remainingItems.length > 0;
            const newStatus = isPartial ? 'partial' : 'approved';

            await updateDoc(doc(db, 'loads', load.id), {
                status: newStatus,
                approvedAt: serverTimestamp(),
                approvedBy: profile!.uid,
                approvedItems,
                remainingItems: isPartial ? remainingItems : [],
                approvalNotes: load.approvalNotes || '',
            });

            // ── Notifications ────────────────────────────────────────────
            const adminUids = await fetchAdminUids();

            if (isPartial) {
                const remainingSummary = remainingItems.map(i => `${i.type} (${i.quantity} remaining)`).join(', ');

                // Notify driver
                await createNotification({
                    targetUid: load.driverId,
                    type: 'load_partial',
                    title: '⚠️ Load Partially Approved',
                    body: `${load.hotelName} found missing items: ${remainingSummary}`,
                    loadId: load.id,
                    hotelId: load.hotelId,
                });

                // Notify admins
                await broadcastNotification({
                    type: 'load_partial',
                    title: '⚠️ Partial Approval at ' + load.hotelName,
                    body: `Missing items: ${remainingSummary} — Driver: ${load.driverName}`,
                    loadId: load.id,
                    hotelId: load.hotelId,
                }, adminUids);

                toast.success('Load marked as Partial — driver & admin notified');
            } else {
                // Notify driver
                await createNotification({
                    targetUid: load.driverId,
                    type: 'load_approved',
                    title: '✅ Load Fully Approved',
                    body: `${load.hotelName} confirmed all items received. Great job!`,
                    loadId: load.id,
                    hotelId: load.hotelId,
                });

                // Notify admins
                await broadcastNotification({
                    type: 'load_approved',
                    title: '✅ Load Approved at ' + load.hotelName,
                    body: `All ${load.items.reduce((s, i) => s + i.quantity, 0)} items confirmed by hotel manager.`,
                    loadId: load.id,
                    hotelId: load.hotelId,
                }, adminUids);

                toast.success('Load fully approved! ✅');
            }

            // Remove from pending list
            setPendingLoads(prev => prev.filter(l => l.id !== load.id));
        } catch (err) {
            console.error('handleApprove error:', err);
            toast.error('Failed to submit approval');
        } finally {
            setSubmitting(null);
        }
    };

    const totalItems = (load: PendingLoad) => load.items.reduce((s, i) => s + i.quantity, 0);
    const approvedTotal = (load: PendingLoad) => load.approvalItems.reduce((s, i) => s + i.approvedQty, 0);
    const hasDiscrepancy = (load: PendingLoad) =>
        load.approvalItems.some(i => i.approvedQty < i.quantity);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">Pending Approvals</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Review and approve laundry loads dropped by the driver.
                    </p>
                </div>
                {!loading && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center">
                        <p className="text-2xl font-bold font-heading text-amber-700">{pendingLoads.length}</p>
                        <p className="text-xs text-amber-600 font-medium">Pending</p>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <ApprovalRowSkeleton key={i} />)}
                </div>
            ) : pendingLoads.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                    <p className="text-slate-500 mt-1 text-sm">No loads are waiting for your approval.</p>
                </Card>
            ) : (
                <div className="space-y-5">
                    {pendingLoads.map(load => (
                        <Card key={load.id} className="overflow-visible" noPadding>
                            {/* Load Header */}
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer select-none"
                                onClick={() => toggleExpand(load.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                        <Truck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-slate-900">
                                                {load.droppedAt
                                                    ? format(load.droppedAt.toDate(), 'MMM d, yyyy • h:mm a')
                                                    : 'Recently dropped'}
                                            </span>
                                            <Badge variant="warning" className="text-xs">Awaiting Approval</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3.5 w-3.5" />
                                                {load.driverName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package className="h-3.5 w-3.5" />
                                                {totalItems(load)} pieces
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {load.expanded
                                    ? <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                    : <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                }
                            </div>

                            {/* Expanded Approval Form */}
                            {load.expanded && (
                                <div className="px-5 pb-5 border-t border-slate-50 pt-4 space-y-5">
                                    {/* Progress Summary */}
                                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 text-sm">
                                        <span className="text-slate-500">Expected:</span>
                                        <span className="font-bold text-slate-800">{totalItems(load)} pcs</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500">Confirmed:</span>
                                        <span className={`font-bold ${approvedTotal(load) < totalItems(load) ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {approvedTotal(load)} pcs
                                        </span>
                                        {hasDiscrepancy(load) && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-red-500 font-semibold flex items-center gap-1">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    {totalItems(load) - approvedTotal(load)} missing
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Items Table */}
                                    <div className="overflow-hidden rounded-xl border border-slate-100">
                                        {/* Header */}
                                        <div className="grid grid-cols-3 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                                            <span>Item</span>
                                            <span className="text-center">Expected</span>
                                            <span className="text-center">Received ✓</span>
                                        </div>

                                        {/* Rows */}
                                        {load.approvalItems.map((item, idx) => {
                                            const isShort = item.approvedQty < item.quantity;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`grid grid-cols-3 items-center px-4 py-3 border-b border-slate-50 last:border-0 transition-colors ${isShort ? 'bg-red-50/50' : ''}`}
                                                >
                                                    <span className="text-sm font-medium text-slate-800">{item.type}</span>
                                                    <span className="text-center text-sm text-slate-500 font-semibold">{item.quantity}</span>
                                                    <div className="flex justify-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateApprovedQty(load.id, idx, item.approvedQty - 1)}
                                                                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors text-lg leading-none"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={item.quantity}
                                                                value={item.approvedQty}
                                                                onChange={e => updateApprovedQty(load.id, idx, parseInt(e.target.value) || 0)}
                                                                className={`w-12 text-center text-sm font-bold rounded-lg border py-1 outline-none focus:ring-2 transition-all ${isShort
                                                                    ? 'border-red-300 text-red-600 bg-red-50 focus:ring-red-200'
                                                                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 focus:ring-emerald-200'
                                                                    }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateApprovedQty(load.id, idx, item.approvedQty + 1)}
                                                                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors text-lg leading-none"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                                            Approval Notes (Optional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={load.approvalNotes}
                                            onChange={e => updateApprovalNotes(load.id, e.target.value)}
                                            placeholder="Any comments about missing items, damage, etc..."
                                            className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    {/* Discrepancy Warning */}
                                    {hasDiscrepancy(load) && (
                                        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-red-700">Incomplete Load Detected</p>
                                                <p className="text-xs text-red-500 mt-0.5">
                                                    {load.approvalItems
                                                        .filter(i => i.approvedQty < i.quantity)
                                                        .map(i => `${i.type}: ${i.quantity - i.approvedQty} missing`)
                                                        .join(' · ')}
                                                </p>
                                                <p className="text-xs text-red-400 mt-1">
                                                    Submitting will mark as <strong>Partial</strong>. Driver & Admin will be notified.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-1">
                                        <Button
                                            onClick={() => handleApprove(load)}
                                            isLoading={submitting === load.id}
                                            disabled={submitting !== null}
                                            variant={hasDiscrepancy(load) ? 'danger' : 'primary'}
                                            className="flex-1"
                                        >
                                            {hasDiscrepancy(load) ? (
                                                <>
                                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                                    Submit as Partial
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Approve All Items
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
