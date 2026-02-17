'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load } from '@/lib/types';
import { format } from 'date-fns';
import clsx from 'clsx';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function HotelDashboard() {
    const { profile } = useAuth();
    const [loads, setLoads] = useState<Load[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.assignedHotels && profile.assignedHotels.length > 0) {
            // Managers are assigned exactly 1 hotel usually
            fetchHotelLoads(profile.assignedHotels[0]);
        } else {
            setLoading(false);
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
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Collection History</h2>
                <p className="text-sm text-gray-500">Track all laundry Items collected and returned.</p>
            </div>

            {loading ? (
                <div className="p-10 text-center">Loading records...</div>
            ) : loads.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                    No history found.
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {loads.map((load) => (
                            <li key={load.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={clsx(
                                            "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                                            load.status === 'collected' ? "bg-yellow-100 text-yellow-600" :
                                                load.status === 'processing' ? "bg-blue-100 text-blue-600" :
                                                    "bg-green-100 text-green-600"
                                        )}>
                                            <ClipboardDocumentCheckIcon className="h-6 w-6" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                {format(load.collectedAt.toDate(), 'PPP p')}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {load.items.length} Unique Items • Total Qty: {load.items.reduce((sum, i) => sum + i.quantity, 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={clsx(
                                            "px-2 py-1 text-xs rounded-full font-medium capitalize",
                                            load.status === 'collected' ? "bg-yellow-100 text-yellow-800" :
                                                load.status === 'processing' ? "bg-blue-100 text-blue-800" :
                                                    "bg-green-100 text-green-800"
                                        )}>
                                            {load.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 ml-14">
                                    <div className="flex flex-wrap gap-2">
                                        {load.items.map((item, i) => (
                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                {item.quantity} {item.type}
                                            </span>
                                        ))}
                                    </div>
                                    {load.droppedAt && (
                                        <p className="text-xs text-green-600 mt-2">
                                            Dropped back on {format(load.droppedAt.toDate(), 'PPP p')}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
