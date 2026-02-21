'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getCountFromServer, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Hotel, Load } from '@/lib/types';
import Link from 'next/link';
import {
    MapPin, ChevronRight, Package, Truck, Building2, AlertTriangle,
    ClipboardList, Timer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { CardSkeleton, HotelCardSkeleton } from '@/components/ui/page-loader';
import { format } from 'date-fns';

export default function DriverDashboard() {
    const { profile, user } = useAuth();
    const [assignedHotels, setAssignedHotels] = useState<Hotel[]>([]);
    const [activeLoads, setActiveLoads] = useState<(Load & { hotelName: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && profile) {
            Promise.all([
                profile.assignedHotels?.length ? fetchAssignedHotels(profile.assignedHotels) : Promise.resolve(),
                fetchActiveLoads(),
            ]).finally(() => setLoading(false));
        }
    }, [user, profile]);

    const fetchAssignedHotels = async (hotelIds: string[]) => {
        try {
            const q = query(collection(db, 'hotels'), where(documentId(), 'in', hotelIds));
            const snapshot = await getDocs(q);
            setAssignedHotels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hotel)));
        } catch (error) {
            console.error(error);
            toast.error('Failed to load hotels');
        }
    };

    const fetchActiveLoads = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'loads'),
                where('driverId', '==', user.uid),
                where('status', 'in', ['collected', 'processing', 'partially_dropped'])
            );
            const snapshot = await getDocs(q);
            const loads = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Load));

            if (loads.length === 0) { setActiveLoads([]); return; }

            // Fetch hotel names
            const hotelIds = [...new Set(loads.map(l => l.hotelId))];
            const hotelMap: Record<string, string> = {};
            for (let i = 0; i < hotelIds.length; i += 10) {
                const chunk = hotelIds.slice(i, i + 10);
                const snap = await getDocs(query(collection(db, 'hotels'), where(documentId(), 'in', chunk)));
                snap.forEach(d => { hotelMap[d.id] = d.data().name; });
            }

            setActiveLoads(loads.map(l => ({ ...l, hotelName: hotelMap[l.hotelId] ?? 'Unknown' })));
        } catch (err) {
            console.error(err);
        }
    };

    const totalPiecesInHand = activeLoads.reduce((sum, load) => {
        const items = (load.status === 'partially_dropped' && load.remainingItems?.length)
            ? load.remainingItems
            : load.items;
        return sum + items.reduce((s, i) => s + i.quantity, 0);
    }, 0);

    const isOverdue = (load: Load) => load.dueDate && load.dueDate.toDate() < new Date();

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-heading">
                    Hello, {profile?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-slate-500 text-sm">Ready for today's collections?</p>
            </div>

            {/* ── Loads In Hand (prominent) ──────────────────────────────── */}
            <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Loads In Hand
                </h2>

                {loading ? (
                    <div className="space-y-3">
                        <CardSkeleton hasIcon={false} lines={3} />
                        <CardSkeleton lines={2} />
                    </div>
                ) : activeLoads.length === 0 ? (
                    <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-5 text-white flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                            <Package className="h-6 w-6 text-slate-300" />
                        </div>
                        <div>
                            <p className="font-semibold">No loads in hand</p>
                            <p className="text-sm text-slate-400 mt-0.5">Collect from a hotel below to get started.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Summary hero card */}
                        <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-5 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Package className="w-28 h-28" />
                            </div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-brand-100 text-xs font-medium mb-1">Total Pieces In Hand</p>
                                    <h2 className="text-4xl font-bold font-heading">{totalPiecesInHand}</h2>
                                    <p className="text-brand-200 text-xs mt-1">{activeLoads.length} active load{activeLoads.length > 1 ? 's' : ''}</p>
                                </div>
                                <Link
                                    href="/driver/drop"
                                    className="bg-white text-brand-700 py-2.5 px-5 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-50 transition-colors flex items-center gap-2"
                                >
                                    <Truck className="w-4 h-4" />
                                    Drop Off
                                </Link>
                            </div>
                        </div>

                        {/* Per-load cards */}
                        {activeLoads.map(load => {
                            const isPartial = load.status === 'partially_dropped';
                            const overdue = isOverdue(load);
                            const displayItems = isPartial && load.remainingItems?.length
                                ? load.remainingItems
                                : load.items;
                            const totalPcs = displayItems.reduce((s, i) => s + i.quantity, 0);

                            return (
                                <Card key={load.id} noPadding className={`overflow-hidden ${overdue ? 'border-red-200' : isPartial ? 'border-amber-200' : ''}`}>
                                    {/* Card header */}
                                    <div className={`px-4 py-3 flex items-center justify-between border-b ${overdue ? 'bg-red-50 border-red-100' : isPartial ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className={`h-4 w-4 ${overdue ? 'text-red-500' : isPartial ? 'text-amber-500' : 'text-slate-400'}`} />
                                            <span className="font-bold text-slate-900 text-sm">{load.hotelName}</span>
                                            {isPartial && (
                                                <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">PARTIAL</span>
                                            )}
                                            {overdue && (
                                                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                    <Timer className="h-2.5 w-2.5" /> OVERDUE
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400">{totalPcs} pcs</span>
                                    </div>

                                    {/* Items grid */}
                                    <div className="px-4 py-3 flex flex-wrap gap-1.5">
                                        {displayItems.map((item, i) => (
                                            <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg flex items-center gap-1">
                                                <span className="font-medium">{item.type}</span>
                                                <span className="bg-white text-slate-900 font-bold px-1 rounded shadow-sm border border-slate-200">×{item.quantity}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Due date + pickup ack */}
                                    {load.dueDate && (
                                        <div className={`px-4 pb-3 flex items-center gap-1.5 text-xs ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                                            <Timer className="h-3 w-3" />
                                            {overdue ? '⏰ Overdue! ' : 'Due: '}
                                            {format(load.dueDate.toDate(), 'MMM d, yyyy')}
                                            {load.pickupRemark && (
                                                <span className="ml-2 text-slate-400">• "{load.pickupRemark}"</span>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Assigned Hotels ────────────────────────────────────────── */}
            <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Assigned Hotels
                </h2>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <HotelCardSkeleton key={i} />)}
                    </div>
                ) : assignedHotels.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 font-medium text-sm">No hotels assigned yet.</p>
                        <p className="text-xs text-gray-400 mt-0.5">Contact your admin to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {assignedHotels.map((hotel) => (
                            <Link key={hotel.id} href={`/driver/collection/${hotel.id}`} className="block group">
                                <Card className="flex items-center justify-between hover:border-brand-200 transition-all p-4" noPadding>
                                    <div className="flex items-center space-x-4">
                                        <div className="h-11 w-11 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{hotel.name}</h4>
                                            <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                                <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                                                {hotel.address}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-brand-500 transition-transform group-hover:translate-x-1" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* View History */}
            <Link
                href="/driver/activity"
                className="block text-center py-3 text-sm font-medium text-slate-400 hover:text-brand-600 transition-colors"
            >
                View Collection History →
            </Link>
        </div>
    );
}
