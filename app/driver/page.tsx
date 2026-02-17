'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getCountFromServer, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Hotel } from '@/lib/types';
import Link from 'next/link';
import { MapPinIcon, ChevronRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function BuildingIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
    )
}

export default function DriverDashboard() {
    const { profile, user } = useAuth();
    const [assignedHotels, setAssignedHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLoadCount, setActiveLoadCount] = useState(0);

    useEffect(() => {
        if (user && profile) {
            if (profile.assignedHotels && profile.assignedHotels.length > 0) {
                fetchAssignedHotels(profile.assignedHotels);
            } else {
                setLoading(false);
            }
            fetchActiveLoads();
        }
    }, [user, profile]);

    const fetchAssignedHotels = async (hotelIds: string[]) => {
        try {
            // Create chunks if > 10, for now assume < 10
            const q = query(collection(db, 'hotels'), where(documentId(), 'in', hotelIds));
            const snapshot = await getDocs(q);
            const hotels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hotel));
            setAssignedHotels(hotels);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load hotels');
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveLoads = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'loads'),
                where('driverId', '==', user.uid),
                where('status', 'in', ['collected', 'processing'])
            );
            const snapshot = await getCountFromServer(q);
            setActiveLoadCount(snapshot.data().count);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            {/* Status Card */}
            <div className="bg-brand-600 rounded-xl p-6 text-white text-center mb-6 shadow-lg shadow-brand-500/30">
                <h2 className="text-3xl font-bold">{activeLoadCount}</h2>
                <p className="text-brand-100 text-sm font-medium">Items In Hand (Loads)</p>
                <div className="mt-4 flex justify-center space-x-3">
                    <Link href="/driver/activity" className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">
                        View History
                    </Link>
                    {activeLoadCount > 0 && (
                        <Link href="/driver/drop" className="px-4 py-2 bg-white text-brand-600 font-bold rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            Drop Items
                        </Link>
                    )}
                </div>
            </div>

            <h3 className="font-bold text-gray-800 mb-4 px-1">Select Hotel to Collect</h3>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : assignedHotels.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
                    No hotels assigned. Contact Admin.
                </div>
            ) : (
                <div className="space-y-3">
                    {assignedHotels.map((hotel) => (
                        <Link key={hotel.id} href={`/driver/collection/${hotel.id}`} className="block group">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-brand-300 transition-colors hover:shadow-md">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                        <BuildingIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{hotel.name}</h4>
                                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                            <MapPinIcon className="h-3 w-3 mr-1" />
                                            {hotel.address}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-brand-500" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
