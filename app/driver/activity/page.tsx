'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load, Hotel } from '@/lib/types';
import { format } from 'date-fns';
import clsx from 'clsx';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Package, AlertCircle } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/page-loader';

export default function ActivityPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [loads, setLoads] = useState<(Load & { hotelName?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Use profile.uid OR user.uid — both should be the same
        const uid = user?.uid || profile?.uid;
        if (uid) fetchLoads(uid);
        else if (!loading) setLoading(false);
    }, [user, profile]);

    const fetchLoads = async (uid: string) => {
        setError(null);
        try {
            // Removed orderBy to avoid composite index requirement — sort client-side
            const q = query(
                collection(db, 'loads'),
                where('driverId', '==', uid)
            );
            const snapshot = await getDocs(q);
            const loadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Load));

            if (loadsData.length === 0) {
                setLoads([]);
                setLoading(false);
                return;
            }

            // Sort client-side by collectedAt desc, guard against null serverTimestamp
            const sorted = loadsData.sort((a, b) => {
                const aTime = a.collectedAt?.toMillis?.() ?? 0;
                const bTime = b.collectedAt?.toMillis?.() ?? 0;
                return bTime - aTime;
            });

            // Fetch Hotel Names
            const hotelIds = [...new Set(sorted.map(l => l.hotelId))];
            const hotelMap: Record<string, string> = {};

            if (hotelIds.length > 0) {
                const hotelsQ = query(collection(db, 'hotels'), where(documentId(), 'in', hotelIds.slice(0, 10)));
                const hotelsSnap = await getDocs(hotelsQ);
                hotelsSnap.forEach(doc => {
                    hotelMap[doc.id] = doc.data().name;
                });
            }

            const enrichedLoads = sorted.map(l => ({
                ...l,
                hotelName: hotelMap[l.hotelId] || 'Unknown Hotel'
            }));

            setLoads(enrichedLoads);
        } catch (error) {
            console.error('fetchLoads error:', error);
            setError('Failed to load history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'collected') return 'bg-yellow-100 text-yellow-800';
        if (status === 'processing') return 'bg-blue-100 text-blue-800';
        if (status === 'dropped') return 'bg-purple-100 text-purple-800';
        if (status === 'approved') return 'bg-green-100 text-green-800';
        if (status === 'partial') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div>
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">My Activity</h1>
                    {!loading && <p className="text-xs text-gray-400">{loads.length} load{loads.length !== 1 ? 's' : ''} found</p>}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <CardSkeleton key={i} lines={2} />)}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="h-7 w-7 text-red-400" />
                    </div>
                    <p className="text-gray-700 font-medium">{error}</p>
                    <button
                        onClick={() => { setLoading(true); fetchLoads(user?.uid || profile?.uid || ''); }}
                        className="mt-4 text-sm text-brand-600 font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            ) : loads.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No activity yet</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs">
                        Your collection history will appear here after you complete loads.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 pb-20">
                    {loads.map(load => (
                        <div key={load.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{load.hotelName}</h3>
                                    <p className="text-xs text-gray-500">
                                        {load.collectedAt
                                            ? format(load.collectedAt.toDate(), 'PPP p')
                                            : 'Just collected...'}
                                    </p>
                                </div>
                                <span className={clsx(
                                    "px-2 py-1 text-xs rounded-full font-medium capitalize",
                                    getStatusColor(load.status)
                                )}>
                                    {load.status}
                                </span>
                            </div>

                            {load.droppedAt && (
                                <p className="text-xs text-purple-600 mb-2 flex items-center gap-1">
                                    📦 Dropped: {format(load.droppedAt.toDate(), 'PPP')}
                                </p>
                            )}
                            {load.approvedAt && (
                                <p className="text-xs text-emerald-600 mb-2 flex items-center gap-1">
                                    ✅ Approved: {format(load.approvedAt.toDate(), 'PPP')}
                                </p>
                            )}
                            {load.status === 'partial' && (load as any).remainingItems?.length > 0 && (
                                <div className="mb-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    <p className="text-xs font-semibold text-red-600 mb-1">⚠️ Missing Items (reported by hotel)</p>
                                    <div className="flex flex-wrap gap-1">
                                        {(load as any).remainingItems.map((item: any, i: number) => (
                                            <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium">
                                                {item.type} ×{item.quantity}
                                            </span>
                                        ))}
                                    </div>
                                    {(load as any).approvalNotes && (
                                        <p className="text-xs text-red-400 italic mt-1">"{(load as any).approvalNotes}"</p>
                                    )}
                                </div>
                            )}

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
