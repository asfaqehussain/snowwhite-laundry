'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load, Hotel } from '@/lib/types';
import { format } from 'date-fns';
import clsx from 'clsx';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function ActivityPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loads, setLoads] = useState<(Load & { hotelName?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchLoads();
    }, [user]);

    const fetchLoads = async () => {
        try {
            // 1. Get Loads
            const q = query(
                collection(db, 'loads'),
                where('driverId', '==', user!.uid),
                orderBy('collectedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const loadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Load));

            // 2. Get Hotel Names (Optimization: could store hotelName in load to avoid this)
            const hotelIds = [...new Set(loadsData.map(l => l.hotelId))];
            const hotelMap: Record<string, string> = {};

            if (hotelIds.length > 0) {
                // Batch fetch hotels (chunking needed if > 10, skipping for demo)
                const hotelsQ = query(collection(db, 'hotels'), where(documentId(), 'in', hotelIds.slice(0, 10)));
                const hotelsSnap = await getDocs(hotelsQ);
                hotelsSnap.forEach(doc => {
                    hotelMap[doc.id] = doc.data().name;
                });
            }

            const enrichedLoads = loadsData.map(l => ({
                ...l,
                hotelName: hotelMap[l.hotelId] || 'Unknown Hotel'
            }));

            setLoads(enrichedLoads);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">My Activity</h1>
            </div>

            {loading ? (
                <div className="p-10 text-center">Loading...</div>
            ) : loads.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">No collections found.</div>
            ) : (
                <div className="space-y-4 pb-20">
                    {loads.map(load => (
                        <div key={load.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{load.hotelName}</h3>
                                    <p className="text-xs text-gray-500">
                                        {format(load.collectedAt.toDate(), 'PPP p')}
                                    </p>
                                </div>
                                <span className={clsx(
                                    "px-2 py-1 text-xs rounded-full font-medium capitalize",
                                    load.status === 'collected' ? "bg-yellow-100 text-yellow-800" :
                                        load.status === 'processing' ? "bg-blue-100 text-blue-800" :
                                            "bg-green-100 text-green-800"
                                )}>
                                    {load.status}
                                </span>
                            </div>

                            <div className="border-t border-gray-50 pt-2 mt-2">
                                <p className="text-xs text-brand-600 font-medium mb-1">Items Collected:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {load.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between">
                                            <span>{item.type}</span>
                                            <span className="font-medium">{item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
