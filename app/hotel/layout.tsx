'use client';

import { useRoleProtection } from "@/lib/hooks/useRoleProtection";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Building2, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import NotificationBell from "@/components/ui/notification-bell";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HotelLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, loading } = useRoleProtection(['hotel_manager']);
    const { profile, signOut } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!profile?.assignedHotels?.length) return;
        const fetchPending = async () => {
            try {
                // Count dropped (needs approval) + unacknowledged pickups
                const [droppedSnap, unackedSnap] = await Promise.all([
                    getDocs(query(
                        collection(db, 'loads'),
                        where('hotelId', '==', profile.assignedHotels![0]),
                        where('status', '==', 'dropped')
                    )),
                    getDocs(query(
                        collection(db, 'loads'),
                        where('hotelId', '==', profile.assignedHotels![0]),
                        where('status', '==', 'collected'),
                        where('pickupAcknowledged', '==', false)
                    )),
                ]);
                setPendingCount(droppedSnap.size + unackedSnap.size);
            } catch { }
        };
        fetchPending();
    }, [profile]);

    if (loading || !isAuthorized) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <div className="h-8 w-8 relative">
                                    <img src="/logo.png" alt="Logo" className="object-contain" />
                                </div>
                                <span className="ml-2 font-bold text-slate-900 tracking-tight">Snow White</span>
                            </div>
                            <div className="ml-6 flex items-baseline space-x-3">
                                <Link href="/hotel" className="bg-brand-50 text-brand-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>
                                <Link href="/hotel/approve" className="relative text-slate-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    Approvals
                                    {pendingCount > 0 && (
                                        <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                                            {pendingCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <div className="flex flex-col items-end mr-2 hidden sm:flex">
                                <span className="text-sm font-medium text-slate-900">{profile?.name}</span>
                                <span className="text-xs text-slate-500">Hotel Manager</span>
                            </div>
                            <button
                                onClick={signOut}
                                className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
