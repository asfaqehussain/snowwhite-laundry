'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load } from '@/lib/types';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle2, Truck, Calendar, LayoutList } from 'lucide-react';

type ActiveTab = 'active' | 'dropped' | 'all';

export default function HotelDashboard() {
    const { profile } = useAuth();
    const [loads, setLoads] = useState<Load[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('active');

    useEffect(() => {
        if (profile?.assignedHotels && profile.assignedHotels.length > 0) {
            fetchHotelLoads(profile.assignedHotels[0]);
        } else {
            setLoading(false);
        }
    }, [profile]);

    const fetchHotelLoads = async (hotelId: string) => {
        try {
            // Removed orderBy to avoid composite index requirement
            const q = query(
                collection(db, 'loads'),
                where('hotelId', '==', hotelId)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Load));
            // Sort client-side — guard against null serverTimestamp
            const sorted = data.sort((a, b) => {
                const aTime = a.collectedAt?.toMillis?.() ?? 0;
                const bTime = b.collectedAt?.toMillis?.() ?? 0;
                return bTime - aTime;
            });
            setLoads(sorted);
        } catch (error) {
            console.error('fetchHotelLoads error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLoads = loads.filter(load => {
        if (activeTab === 'active') return load.status === 'collected' || load.status === 'processing';
        if (activeTab === 'dropped') return load.status === 'dropped';
        return true;
    });

    const activeCount = loads.filter(l => l.status === 'collected' || l.status === 'processing').length;
    const droppedCount = loads.filter(l => l.status === 'dropped').length;

    const tabs: { id: ActiveTab; label: string; count: number }[] = [
        { id: 'active', label: 'Active Loads', count: activeCount },
        { id: 'dropped', label: 'Dropped / Returned', count: droppedCount },
        { id: 'all', label: 'All', count: loads.length },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Collection History</h1>
                <p className="text-slate-500 text-sm">Track your laundry collections and returns.</p>
            </div>

            {/* Summary Pills */}
            {!loading && (
                <div className="flex gap-3 flex-wrap">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{activeCount} Active</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">{droppedCount} Returned</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />)}
                </div>
            ) : filteredLoads.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">
                        {activeTab === 'active' ? 'No active loads' : activeTab === 'dropped' ? 'No returned loads' : 'No collections yet'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mt-1">
                        {activeTab === 'active'
                            ? 'Active loads will appear here when a driver collects laundry.'
                            : activeTab === 'dropped'
                                ? 'Loads marked as returned will appear here.'
                                : 'Your laundry collection history will appear here once a driver picks up a load.'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredLoads.map((load) => (
                        <Card key={load.id} className="group hover:border-brand-200 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start md:items-center gap-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${load.status === 'collected' ? 'bg-amber-100 text-amber-600' :
                                            load.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                                                'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {load.status === 'collected' && <Truck className="h-6 w-6" />}
                                        {load.status === 'processing' && <Clock className="h-6 w-6" />}
                                        {load.status === 'dropped' && <CheckCircle2 className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900">
                                                {load.collectedAt
                                                    ? format(load.collectedAt.toDate(), 'MMMM d, yyyy')
                                                    : 'Processing...'}
                                            </span>
                                            {load.collectedAt && (
                                                <span className="text-slate-400 text-xs flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {format(load.collectedAt.toDate(), 'h:mm a')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {load.items.length} Item Types • {load.items.reduce((sum, i) => sum + i.quantity, 0)} Total Pieces
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                                    <div className="flex flex-col items-end">
                                        <Badge variant={
                                            load.status === 'collected' ? 'warning' :
                                                load.status === 'processing' ? 'info' : 'success'
                                        } className="capitalize">
                                            {load.status}
                                        </Badge>
                                        {load.droppedAt && (
                                            <p className="text-xs text-emerald-600 mt-1 flex items-center">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Returned: {format(load.droppedAt.toDate(), 'MMM d')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {load.items.map((item, i) => (
                                    <div key={i} className="text-xs text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 flex justify-between items-center group-hover:bg-white transition-colors">
                                        <span className="font-medium truncate mr-2">{item.type}</span>
                                        <span className="bg-white px-1.5 py-0.5 rounded-md text-slate-900 font-bold shadow-sm border border-gray-100 group-hover:border-slate-200">x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
