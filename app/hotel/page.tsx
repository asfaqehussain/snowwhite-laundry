'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load } from '@/lib/types';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle2, Truck, Calendar } from 'lucide-react';

export default function HotelDashboard() {
    const { profile } = useAuth();
    const [loads, setLoads] = useState<Load[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.assignedHotels && profile.assignedHotels.length > 0) {
            // Managers are assigned exactly 1 hotel usually
            fetchHotelLoads(profile.assignedHotels[0]);
        } else {
            setLoading(false); // No hotel assigned
        }
    }, [profile]);

    const fetchHotelLoads = async (hotelId: string) => {
        try {
            const q = query(
                collection(db, 'loads'),
                where('hotelId', '==', hotelId),
                orderBy('collectedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            setLoads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Load)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Collection History</h1>
                <p className="text-slate-500 text-sm">Track your laundry collections and returns.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />)}
                </div>
            ) : loads.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-gray-200">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No collections yet</h3>
                    <p className="text-slate-500 max-w-sm mt-1">Your laundry collection history will appear here once a driver picks up a load.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {loads.map((load) => (
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
                                                {format(load.collectedAt.toDate(), 'MMMM d, yyyy')}
                                            </span>
                                            <span className="text-slate-400 text-xs flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {format(load.collectedAt.toDate(), 'h:mm a')}
                                            </span>
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

                            {/* Item Details (Collapsible or visible) - Let's keep it visible but subtle */}
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
