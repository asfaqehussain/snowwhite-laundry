'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load } from '@/lib/types';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createNotification } from '@/lib/notifications';
import toast from 'react-hot-toast';
import { CardSkeleton } from '@/components/ui/page-loader';
import {
    Package, Clock, CheckCircle2, Truck, Timer, AlertTriangle,
    ClipboardCheck, X, CalendarDays
} from 'lucide-react';

type ActiveTab = 'active' | 'dropped' | 'all';

// Pickup Acknowledgment Modal
function AckModal({ load, onClose, onSuccess }: {
    load: Load & { id: string };
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { profile } = useAuth();
    const [dueDate, setDueDate] = useState('');
    const [remark, setRemark] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dueDate) { toast.error('Please set a due date'); return; }
        setSubmitting(true);
        try {
            const dueDateTs = Timestamp.fromDate(new Date(dueDate));
            await updateDoc(doc(db, 'loads', load.id), {
                pickupAcknowledged: true,
                dueDate: dueDateTs,
                pickupRemark: remark || '',
            });

            // Notify driver
            await createNotification({
                targetUid: load.driverId,
                type: 'load_collected',
                title: '✅ Pickup Acknowledged',
                body: `Hotel confirmed your pickup. Due: ${format(new Date(dueDate), 'MMM d, yyyy')}${remark ? `. Note: "${remark}"` : ''}`,
                loadId: load.id,
                hotelId: load.hotelId,
            });

            toast.success('Pickup acknowledged! Driver notified.');
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error('Failed to acknowledge pickup');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-brand-50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <ClipboardCheck className="h-6 w-6 text-brand-600" />
                        <div>
                            <h3 className="font-bold text-slate-900">Acknowledge Pickup</h3>
                            <p className="text-xs text-slate-500">Set due date & add a remark</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/10 text-slate-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleAck} className="p-5 space-y-4">
                    {/* Items summary */}
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Collected Items</p>
                        <div className="flex flex-wrap gap-1.5">
                            {load.items.map((item, i) => (
                                <span key={i} className="text-xs bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg">
                                    {item.type} <span className="font-bold">×{item.quantity}</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Expected Return Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="date"
                                required
                                value={dueDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setDueDate(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Remark */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Remark (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={remark}
                            onChange={e => setRemark(e.target.value)}
                            placeholder="e.g. Handle delicates with care..."
                            className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" isLoading={submitting} className="flex-1">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Acknowledge
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function HotelDashboard() {
    const { profile } = useAuth();
    const [loads, setLoads] = useState<Load[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('active');
    const [ackLoad, setAckLoad] = useState<Load | null>(null);

    const fetchHotelLoads = useCallback(async (hotelId: string) => {
        try {
            const q = query(collection(db, 'loads'), where('hotelId', '==', hotelId));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Load));
            const sorted = data.sort((a, b) => (b.collectedAt?.toMillis?.() ?? 0) - (a.collectedAt?.toMillis?.() ?? 0));
            setLoads(sorted);
        } catch (error) {
            console.error('fetchHotelLoads error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (profile?.assignedHotels?.length) {
            fetchHotelLoads(profile.assignedHotels[0]);
        } else {
            setLoading(false);
        }
    }, [profile, fetchHotelLoads]);

    const activeLoads = loads.filter(l => ['collected', 'processing', 'partially_dropped'].includes(l.status));
    const droppedLoads = loads.filter(l => l.status === 'dropped');

    const filteredLoads = activeTab === 'active' ? activeLoads
        : activeTab === 'dropped' ? droppedLoads
            : loads;

    const isOverdue = (load: Load) =>
        load.dueDate && load.dueDate.toDate() < new Date() && !['approved', 'partial'].includes(load.status);

    const tabs = [
        { id: 'active' as ActiveTab, label: 'Active Loads', count: activeLoads.length },
        { id: 'dropped' as ActiveTab, label: 'Ready for Approval', count: droppedLoads.length },
        { id: 'all' as ActiveTab, label: 'All', count: loads.length },
    ];

    const statusIcon = (status: string) => {
        if (status === 'collected') return <Truck className="h-6 w-6" />;
        if (status === 'partially_dropped') return <AlertTriangle className="h-6 w-6" />;
        if (status === 'processing') return <Clock className="h-6 w-6" />;
        return <CheckCircle2 className="h-6 w-6" />;
    };

    const statusBg = (status: string) => {
        if (status === 'collected') return 'bg-amber-100 text-amber-600';
        if (status === 'partially_dropped') return 'bg-orange-100 text-orange-600';
        if (status === 'processing') return 'bg-blue-100 text-blue-600';
        if (status === 'dropped') return 'bg-purple-100 text-purple-600';
        return 'bg-emerald-100 text-emerald-600';
    };

    const badgeVariant = (status: string): 'warning' | 'info' | 'success' | 'error' | 'default' => {
        if (status === 'collected') return 'warning';
        if (status === 'partially_dropped') return 'error';
        if (status === 'processing') return 'info';
        if (status === 'dropped') return 'default';
        return 'success';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Collection Overview</h1>
                <p className="text-slate-500 text-sm">Track laundry loads and acknowledge pickups.</p>
            </div>

            {/* Summary pills */}
            {!loading && (
                <div className="flex gap-3 flex-wrap">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{activeLoads.length} Active</span>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2 flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-700">{droppedLoads.length} Awaiting Approval</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <CardSkeleton key={i} lines={3} />)}
                </div>
            ) : filteredLoads.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">
                        {activeTab === 'active' ? 'No active loads' : activeTab === 'dropped' ? 'No loads awaiting approval' : 'No loads yet'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mt-1">
                        {activeTab === 'active' ? 'Loads will appear here when a driver collects laundry from your hotel.'
                            : activeTab === 'dropped' ? 'Loads will appear here when a driver drops them off.'
                                : 'Your laundry collection history will appear here.'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredLoads.map(load => {
                        const overdue = isOverdue(load);
                        const isPartial = load.status === 'partially_dropped';
                        const needsAck = load.status === 'collected' && !load.pickupAcknowledged;

                        return (
                            <Card key={load.id} className={`group transition-colors duration-300 ${overdue ? 'border-red-200' : isPartial ? 'border-orange-200' : needsAck ? 'border-brand-200' : 'hover:border-brand-200'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start md:items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusBg(load.status)}`}>
                                            {statusIcon(load.status)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-bold text-slate-900">
                                                    {load.collectedAt ? format(load.collectedAt.toDate(), 'MMMM d, yyyy') : 'Processing...'}
                                                </span>
                                                <Badge variant={badgeVariant(load.status)} className="capitalize">
                                                    {load.status.replace('_', ' ')}
                                                </Badge>
                                                {overdue && (
                                                    <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                        <Timer className="h-2.5 w-2.5" /> OVERDUE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {load.items.length} Item Types • {load.items.reduce((s, i) => s + i.quantity, 0)} Total Pieces
                                            </p>
                                            {load.dueDate && (
                                                <p className={`text-xs mt-1 flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                                                    <Timer className="h-3 w-3" />
                                                    Due: {format(load.dueDate.toDate(), 'MMM d, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {/* Pickup Acknowledgment button */}
                                        {needsAck && (
                                            <Button
                                                size="sm"
                                                onClick={() => setAckLoad(load)}
                                                className="whitespace-nowrap"
                                            >
                                                <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                                                Acknowledge Pickup
                                            </Button>
                                        )}
                                        {load.pickupAcknowledged && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                                                <CheckCircle2 className="h-3 w-3" /> Pickup Acknowledged
                                            </span>
                                        )}
                                        {/* Approval link for dropped loads */}
                                        {load.status === 'dropped' && (
                                            <a
                                                href="/hotel/approve"
                                                className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2"
                                            >
                                                Go to Approvals →
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Pickup remark */}
                                {load.pickupRemark && (
                                    <div className="mt-3 pt-3 border-t border-gray-50">
                                        <p className="text-xs text-slate-500 italic">
                                            <span className="font-semibold not-italic text-slate-700">Hotel Note:</span> "{load.pickupRemark}"
                                        </p>
                                    </div>
                                )}

                                {/* Remaining items for partial drop */}
                                {isPartial && load.remainingItems && load.remainingItems.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-orange-100">
                                        <p className="text-xs font-semibold text-orange-600 flex items-center gap-1 mb-1.5">
                                            <AlertTriangle className="h-3 w-3" />
                                            Items Still In Transit (Partial Drop)
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {load.remainingItems.map((item, i) => (
                                                <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                                                    {item.type} ×{item.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Items grid */}
                                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {load.items.map((item, i) => (
                                        <div key={i} className="text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                                            <span className="font-medium truncate mr-2">{item.type}</span>
                                            <span className="bg-white px-1.5 py-0.5 rounded-md text-slate-900 font-bold shadow-sm border border-gray-100">×{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Acknowledgment Modal */}
            {ackLoad && (
                <AckModal
                    load={ackLoad}
                    onClose={() => setAckLoad(null)}
                    onSuccess={() => {
                        setAckLoad(null);
                        if (profile?.assignedHotels?.length) {
                            fetchHotelLoads(profile.assignedHotels[0]);
                        }
                    }}
                />
            )}
        </div>
    );
}
