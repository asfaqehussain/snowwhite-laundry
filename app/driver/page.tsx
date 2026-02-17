'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getCountFromServer, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Hotel } from '@/lib/types';
import Link from 'next/link';
import { MapPin, ChevronRight, Package, Truck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';

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
        <div className="space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Hello, {profile?.name?.split(' ')[0]} 👋</h1>
                <p className="text-slate-500 text-sm">Ready for today's collections?</p>
            </div>

            {/* Status Card */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Package className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <p className="text-brand-100 text-sm font-medium mb-1">Items In Hand</p>
                    <h2 className="text-4xl font-bold font-heading mb-4">{activeLoadCount}</h2>
                    <div className="flex space-x-3">
                        {activeLoadCount > 0 && (
                            <Link
                                href="/driver/drop"
                                className="flex-1 bg-white text-brand-700 py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-50 transition-colors flex items-center justify-center"
                            >
                                <Truck className="w-4 h-4 mr-2" />
                                Drop Off
                            </Link>
                        )}
                        <Link
                            href="/driver/activity"
                            className="flex-1 bg-brand-800/40 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-brand-800/60 transition-colors backdrop-blur-sm flex items-center justify-center"
                        >
                            View History
                        </Link>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-slate-800 mb-4 px-1 flex items-center text-sm uppercase tracking-wide">
                    Assigned Hotels
                </h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />)}
                    </div>
                ) : assignedHotels.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No hotels assigned yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Contact your admin to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {assignedHotels.map((hotel) => (
                            <Link key={hotel.id} href={`/driver/collection/${hotel.id}`} className="block group">
                                <Card className="flex items-center justify-between hover:border-brand-200 transition-all p-5" noPadding>
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-brand-500/30">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{hotel.name}</h4>
                                            <p className="text-xs text-slate-500 flex items-center mt-1">
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
            </div>
        </div>
    );
}
