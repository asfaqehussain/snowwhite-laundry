'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, writeBatch, documentId, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Load } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function DropPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeLoads, setActiveLoads] = useState<(Load & { hotelName?: string, selected?: boolean })[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) fetchActiveLoads();
    }, [user]);

    const fetchActiveLoads = async () => {
        try {
            const q = query(
                collection(db, 'loads'),
                where('driverId', '==', user!.uid),
                where('status', 'in', ['collected', 'processing'])
            );
            const snapshot = await getDocs(q);
            const loadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Load));

            if (loadsData.length === 0) {
                setActiveLoads([]);
                setLoading(false);
                return;
            }

            // Fetch Hotel Names
            const hotelIds = [...new Set(loadsData.map(l => l.hotelId))];
            const hotelMap: Record<string, string> = {};
            const hotelsQ = query(collection(db, 'hotels'), where(documentId(), 'in', hotelIds.slice(0, 10)));
            const hotelsSnap = await getDocs(hotelsQ);
            hotelsSnap.forEach(doc => hotelMap[doc.id] = doc.data().name);

            setActiveLoads(loadsData.map(l => ({
                ...l,
                hotelName: hotelMap[l.hotelId],
                selected: false
            })));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load active items");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setActiveLoads(prev => prev.map(l =>
            l.id === id ? { ...l, selected: !l.selected } : l
        ));
    };

    const handleDrop = async () => {
        const selected = activeLoads.filter(l => l.selected);
        if (selected.length === 0) return;

        if (!confirm(`Mark ${selected.length} loads as Dropped?`)) return;

        setSubmitting(true);
        try {
            const batch = writeBatch(db);
            selected.forEach(load => {
                const ref = doc(db, 'loads', load.id);
                batch.update(ref, {
                    status: 'dropped',
                    droppedAt: serverTimestamp()
                });
            });
            await batch.commit();
            toast.success("Items marked as Dropped!");
            router.push('/driver');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCount = activeLoads.filter(l => l.selected).length;

    return (
        <div>
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Drop Items</h1>
            </div>

            {loading ? (
                <div className="p-10 text-center">Loading...</div>
            ) : activeLoads.length === 0 ? (
                <div className="text-center text-gray-500">No items currently in hand to drop.</div>
            ) : (
                <div className="space-y-4 pb-24">
                    <p className="text-sm text-gray-500">Select items you are returning to the laundry/hotel.</p>
                    {activeLoads.map(load => (
                        <div
                            key={load.id}
                            onClick={() => toggleSelection(load.id)}
                            className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${load.selected ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50' : 'border-gray-100'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{load.hotelName}</h3>
                                    <p className="text-xs text-gray-500">{format(load.collectedAt.toDate(), 'PPP')}</p>
                                    <div className="mt-2 text-sm">
                                        {load.items.map((item, i) => (
                                            <span key={i} className="inline-block bg-gray-100 rounded px-2 py-0.5 text-xs mr-2 mb-1">
                                                {item.quantity} x {item.type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {load.selected ? (
                                    <CheckCircleIcon className="h-6 w-6 text-brand-600" />
                                ) : (
                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-20 md:relative md:bg-transparent md:border-0 md:p-0">
                    <Button onClick={handleDrop} isLoading={submitting} className="w-full text-lg py-3 shadow-lg">
                        Mark {selectedCount} Loads as Dropped
                    </Button>
                </div>
            )}
        </div>
    );
}
