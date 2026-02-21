'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Load } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Package,
    Truck,
    Clock,
    CheckCircle2,
    Building2,
    User,
    RefreshCw,
    LayoutList,
    Layers
} from 'lucide-react';

type ViewTab = 'active' | 'collections';

interface EnrichedLoad extends Load {
    hotelName: string;
    driverName: string;
}

export default function AdminLoadsPage() {
    const [activeLoads, setActiveLoads] = useState<EnrichedLoad[]>([]);
    const [allCollections, setAllCollections] = useState<EnrichedLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<ViewTab>('active');
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            // Fetch all loads (no orderBy to avoid index requirement)
            const allLoadsSnap = await getDocs(collection(db, 'loads'));
            const allLoadsRaw = allLoadsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Load));

            // Sort client-side
            const sorted = allLoadsRaw.sort((a, b) => {
                const aTime = a.collectedAt?.toMillis?.() ?? 0;
                const bTime = b.collectedAt?.toMillis?.() ?? 0;
                return bTime - aTime;
            });

            // Collect unique hotelIds and driverIds
            const hotelIds = [...new Set(sorted.map(l => l.hotelId))];
            const driverIds = [...new Set(sorted.map(l => l.driverId))];

            const hotelMap: Record<string, string> = {};
            const driverMap: Record<string, string> = {};

            // Fetch hotels in batches of 10
            for (let i = 0; i < hotelIds.length; i += 10) {
                const chunk = hotelIds.slice(i, i + 10);
                if (chunk.length === 0) continue;
                const q = query(collection(db, 'hotels'), where(documentId(), 'in', chunk));
                const snap = await getDocs(q);
                snap.forEach(doc => { hotelMap[doc.id] = doc.data().name; });
            }

            // Fetch drivers in batches of 10
            for (let i = 0; i < driverIds.length; i += 10) {
                const chunk = driverIds.slice(i, i + 10);
                if (chunk.length === 0) continue;
                const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                const snap = await getDocs(q);
                snap.forEach(doc => { driverMap[doc.id] = doc.data().name; });
            }

            const enriched: EnrichedLoad[] = sorted.map(l => ({
                ...l,
                hotelName: hotelMap[l.hotelId] || 'Unknown Hotel',
                driverName: driverMap[l.driverId] || 'Unknown Driver',
            }));

            setActiveLoads(enriched.filter(l => l.status === 'collected' || l.status === 'processing'));
            setAllCollections(enriched);
        } catch (error) {
            console.error('AdminLoadsPage fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const displayedLoads = tab === 'active' ? activeLoads : allCollections;

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'collected') return <Truck className="h-5 w-5" />;
        if (status === 'processing') return <Clock className="h-5 w-5" />;
        return <CheckCircle2 className="h-5 w-5" />;
    };

    const statusBg: Record<string, string> = {
        collected: 'bg-amber-100 text-amber-600',
        processing: 'bg-blue-100 text-blue-600',
        dropped: 'bg-emerald-100 text-emerald-600',
    };

    const statusVariant: Record<string, 'warning' | 'info' | 'success'> = {
        collected: 'warning',
        processing: 'info',
        dropped: 'success',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">Loads Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">Monitor all active loads and collection history.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Loads', value: allCollections.filter(l => l.status === 'collected').length, color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Truck },
                        { label: 'Processing', value: allCollections.filter(l => l.status === 'processing').length, color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock },
                        { label: 'Returned', value: allCollections.filter(l => l.status === 'dropped').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
                        { label: 'Total Loads', value: allCollections.length, color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Package },
                    ].map(stat => (
                        <div key={stat.label} className={`rounded-2xl border p-4 ${stat.color}`}>
                            <stat.icon className="h-5 w-5 mb-2 opacity-70" />
                            <p className="text-2xl font-bold font-heading">{stat.value}</p>
                            <p className="text-xs font-medium opacity-70 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                    onClick={() => setTab('active')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${tab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Layers className="h-4 w-4" />
                    Active Loads
                    <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${tab === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                        {loading ? '–' : activeLoads.length}
                    </span>
                </button>
                <button
                    onClick={() => setTab('collections')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${tab === 'collections' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <LayoutList className="h-4 w-4" />
                    All Collections
                    <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${tab === 'collections' ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                        {loading ? '–' : allCollections.length}
                    </span>
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : displayedLoads.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">
                        {tab === 'active' ? 'No active loads right now' : 'No collections found'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mt-1 text-sm">
                        {tab === 'active'
                            ? 'All loads have been returned. Great work!'
                            : 'Collections will appear here as drivers log them.'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {displayedLoads.map(load => (
                        <Card key={load.id} className="group hover:border-brand-200 transition-colors duration-300">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Status Icon */}
                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${statusBg[load.status] || 'bg-gray-100 text-gray-500'}`}>
                                    <StatusIcon status={load.status} />
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <Badge variant={statusVariant[load.status] || 'default'} className="capitalize">
                                            {load.status}
                                        </Badge>
                                        <span className="text-xs text-slate-400">
                                            {load.collectedAt ? format(load.collectedAt.toDate(), 'MMM d, yyyy • h:mm a') : 'Just now'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                        <span className="flex items-center gap-1.5 text-slate-700">
                                            <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            <span className="font-semibold">{load.hotelName}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5 text-slate-500">
                                            <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                            {load.driverName}
                                        </span>
                                    </div>

                                    {load.droppedAt && (
                                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Returned: {format(load.droppedAt.toDate(), 'MMM d, yyyy • h:mm a')}
                                        </p>
                                    )}

                                    {/* Items */}
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {load.items.map((item, i) => (
                                            <span key={i} className="inline-flex items-center bg-slate-50 border border-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-lg font-medium">
                                                <span>{item.type}</span>
                                                <span className="ml-1.5 bg-white text-slate-900 font-bold px-1 rounded shadow-sm border border-slate-100">x{item.quantity}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {load.notes && (
                                        <p className="text-xs text-slate-400 mt-2 italic">"{load.notes}"</p>
                                    )}
                                </div>

                                {/* Total pieces */}
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-2xl font-bold text-slate-900 font-heading">
                                        {load.items.reduce((s, i) => s + i.quantity, 0)}
                                    </p>
                                    <p className="text-xs text-slate-400">pieces</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
