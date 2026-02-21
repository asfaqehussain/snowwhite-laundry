'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    collection, getDocs, query, where, documentId
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Load } from '@/lib/types';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, startOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar, ChevronDown, X, Building2, User, Package, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ─── Types ─────────────────────────────────────────────────────────────────
type DatePreset = '7d' | '30d' | 'month' | 'custom';

interface ChartPoint {
    date: string; // 'Feb 18'
    rawDate: Date;
    picked: number;
    dropped: number;
    loads: EnrichedLoad[];
}

interface EnrichedLoad extends Load {
    hotelName: string;
    driverName: string;
}

interface Hotel { id: string; name: string; }
interface Driver { id: string; name: string; }

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, onDayClick }: any) {
    if (!active || !payload?.length) return null;
    const picked = payload.find((p: any) => p.dataKey === 'picked')?.value ?? 0;
    const dropped = payload.find((p: any) => p.dataKey === 'dropped')?.value ?? 0;
    const loads: EnrichedLoad[] = payload[0]?.payload?.loads ?? [];

    return (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-4 min-w-[180px] animate-fade-in-up">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-brand-500 inline-block" />
                        Picked Up
                    </span>
                    <span className="font-bold text-slate-900">{picked}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        Dropped
                    </span>
                    <span className="font-bold text-slate-900">{dropped}</span>
                </div>
            </div>
            {loads.length > 0 && (
                <button
                    onClick={() => onDayClick && onDayClick(payload[0]?.payload)}
                    className="w-full text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 py-1.5 px-3 rounded-lg transition-colors"
                >
                    View {loads.length} load{loads.length !== 1 ? 's' : ''} →
                </button>
            )}
        </div>
    );
}

// ─── Day Detail Modal ────────────────────────────────────────────────────────
function DayModal({ point, onClose }: { point: ChartPoint; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 font-heading">
                            {format(point.rawDate, 'MMMM d, yyyy')}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {point.picked} picked · {point.dropped} dropped
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Loads List */}
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                    {point.loads.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">No loads on this day.</div>
                    ) : (
                        point.loads.map(load => (
                            <div key={load.id} className="border border-slate-100 rounded-2xl p-4 hover:border-brand-200 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        <span className="font-semibold text-slate-800 text-sm">{load.hotelName}</span>
                                    </div>
                                    <Badge variant={
                                        load.status === 'collected' ? 'warning' :
                                            load.status === 'processing' ? 'info' : 'success'
                                    } className="capitalize text-xs">
                                        {load.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                    <User className="h-3 w-3" />
                                    {load.driverName}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {load.items.map((item, i) => (
                                        <span key={i} className="bg-slate-50 border border-slate-100 text-xs text-slate-600 px-2 py-0.5 rounded-lg">
                                            {item.type} <span className="font-bold">×{item.quantity}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Chart Component ───────────────────────────────────────────────────
export default function ActivityChart() {
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [preset, setPreset] = useState<DatePreset>('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [selectedDriver, setSelectedDriver] = useState('all');

    // Modal
    const [selectedDay, setSelectedDay] = useState<ChartPoint | null>(null);

    // Date range computation
    const getDateRange = useCallback((): { from: Date; to: Date } => {
        const to = new Date();
        to.setHours(23, 59, 59, 999);
        let from: Date;
        if (preset === '7d') {
            from = subDays(new Date(), 6);
        } else if (preset === '30d') {
            from = subDays(new Date(), 29);
        } else if (preset === 'month') {
            from = startOfMonth(new Date());
        } else {
            from = customFrom ? new Date(customFrom) : subDays(new Date(), 29);
            return { from, to: customTo ? new Date(customTo + 'T23:59:59') : to };
        }
        from.setHours(0, 0, 0, 0);
        return { from, to };
    }, [preset, customFrom, customTo]);

    // Fetch hotel & driver lists once
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [hotelsSnap, driversSnap] = await Promise.all([
                    getDocs(collection(db, 'hotels')),
                    getDocs(query(collection(db, 'users'), where('role', 'in', ['driver'])))
                ]);
                setHotels(hotelsSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
                setDrivers(driversSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
            } catch (err) {
                console.error('fetchMeta error:', err);
            }
        };
        fetchMeta();
    }, []);

    // Fetch loads & build chart data
    const fetchChartData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const { from, to } = getDateRange();

            // Fetch all loads (no orderBy to avoid index issue)
            const allSnap = await getDocs(collection(db, 'loads'));
            let allLoads = allSnap.docs.map(d => ({ id: d.id, ...d.data() } as Load));

            // Client-side date filter
            allLoads = allLoads.filter(l => {
                const t = l.collectedAt?.toDate?.();
                if (!t) return false;
                return t >= from && t <= to;
            });

            // Hotel filter
            if (selectedHotel !== 'all') {
                allLoads = allLoads.filter(l => l.hotelId === selectedHotel);
            }

            // Driver filter
            if (selectedDriver !== 'all') {
                allLoads = allLoads.filter(l => l.driverId === selectedDriver);
            }

            // Build hotel & driver maps from current lists
            const hotelMap = Object.fromEntries(hotels.map(h => [h.id, h.name]));
            const driverMap = Object.fromEntries(drivers.map(d => [d.id, d.name]));

            const enriched: EnrichedLoad[] = allLoads.map(l => ({
                ...l,
                hotelName: hotelMap[l.hotelId] || 'Unknown Hotel',
                driverName: driverMap[l.driverId] || 'Unknown Driver',
            }));

            // Build per-day chart points
            const { from: f, to: t2 } = getDateRange();
            const days = eachDayOfInterval({ start: f, end: t2 });
            const points: ChartPoint[] = days.map(day => {
                const dayLoads = enriched.filter(l =>
                    l.collectedAt?.toDate && isSameDay(l.collectedAt.toDate(), day)
                );
                const droppedLoads = enriched.filter(l =>
                    l.droppedAt?.toDate && isSameDay(l.droppedAt.toDate(), day)
                );
                return {
                    date: format(day, 'MMM d'),
                    rawDate: day,
                    picked: dayLoads.length,
                    dropped: droppedLoads.length,
                    loads: dayLoads,
                };
            });

            setChartData(points);
        } catch (err) {
            console.error('fetchChartData error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getDateRange, selectedHotel, selectedDriver, hotels, drivers]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    const totalPicked = chartData.reduce((s, p) => s + p.picked, 0);
    const totalDropped = chartData.reduce((s, p) => s + p.dropped, 0);

    const presets: { id: DatePreset; label: string }[] = [
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
        { id: 'month', label: 'This Month' },
        { id: 'custom', label: 'Custom' },
    ];

    return (
        <>
            <Card className="space-y-5" noPadding={false}>
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 font-heading">
                            Loads Picked vs Dropped
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {totalPicked} picked · {totalDropped} dropped in period
                        </p>
                    </div>
                    <button
                        onClick={() => fetchChartData(true)}
                        disabled={refreshing || loading}
                        className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 bg-slate-50 border border-slate-200 hover:border-brand-200 rounded-xl px-3 py-2 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-2 items-end">
                    {/* Date Preset Buttons */}
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
                        {presets.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPreset(p.id)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${preset === p.id
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Range Inputs */}
                    {preset === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
                            />
                        </div>
                    )}

                    {/* Hotel Filter */}
                    <div className="relative">
                        <select
                            value={selectedHotel}
                            onChange={e => setSelectedHotel(e.target.value)}
                            className="text-xs border border-slate-200 rounded-xl pl-3 pr-7 py-2 bg-white text-slate-700 appearance-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none cursor-pointer"
                        >
                            <option value="all">All Hotels</option>
                            {hotels.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Driver Filter */}
                    <div className="relative">
                        <select
                            value={selectedDriver}
                            onChange={e => setSelectedDriver(e.target.value)}
                            className="text-xs border border-slate-200 rounded-xl pl-3 pr-7 py-2 bg-white text-slate-700 appearance-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none cursor-pointer"
                        >
                            <option value="all">All Drivers</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Chart Area */}
                {loading ? (
                    <div className="h-64 flex flex-col gap-3 justify-end pb-6">
                        {[40, 70, 50, 85, 60, 90, 45].map((h, i) => (
                            <div key={i} className="flex items-end gap-1 h-full">
                                <div className="skeleton rounded-t-md flex-1" style={{ height: `${h}%` }} />
                                <div className="skeleton rounded-t-md flex-1" style={{ height: `${h * 0.7}%` }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-64 animate-fade-in-up">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                                onClick={(data: any) => {
                                    if (data?.activePayload?.[0]) {
                                        setSelectedDay(data.activePayload[0].payload as ChartPoint);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <defs>
                                    <linearGradient id="gradPicked" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradDropped" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={<CustomTooltip onDayClick={setSelectedDay} />}
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                                    formatter={(val) => val === 'picked' ? 'Picked Up' : 'Dropped'}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="picked"
                                    stroke="#0ea5e9"
                                    strokeWidth={2.5}
                                    fill="url(#gradPicked)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="dropped"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fill="url(#gradDropped)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Click hint */}
                {!loading && chartData.some(p => p.picked > 0 || p.dropped > 0) && (
                    <p className="text-center text-xs text-slate-400">
                        💡 Click on any data point or hover tooltip to see that day's loads
                    </p>
                )}
            </Card>

            {/* Day Detail Modal */}
            {selectedDay && (
                <DayModal point={selectedDay} onClose={() => setSelectedDay(null)} />
            )}
        </>
    );
}
