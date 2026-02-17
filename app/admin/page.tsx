'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BuildingOfficeIcon, UserGroupIcon, ClipboardDocumentCheckIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        hotels: 0,
        drivers: 0,
        activeLoads: 0,
        totalCollectionsToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // 1. Counts
                const hotelsSnap = await getCountFromServer(collection(db, 'hotels'));
                const driversSnap = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'driver')));

                // 2. Active Loads (In Hand)
                const activeLoadsSnap = await getCountFromServer(query(collection(db, 'loads'), where('status', 'in', ['collected', 'processing'])));

                // 3. Today's Collections (Simple client-side filter for now or precise query)
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const todayQuery = query(
                    collection(db, 'loads'),
                    where('collectedAt', '>=', Timestamp.fromDate(startOfDay))
                );
                const todaySnap = await getDocs(todayQuery);

                setStats({
                    hotels: hotelsSnap.data().count,
                    drivers: driversSnap.data().count,
                    activeLoads: activeLoadsSnap.data().count,
                    totalCollectionsToday: todaySnap.size
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { name: 'Total Hotels', value: stats.hotels, icon: BuildingOfficeIcon, color: 'text-blue-600', bg: 'bg-blue-100', href: '/admin/hotels' },
        { name: 'Active Drivers', value: stats.drivers, icon: UserGroupIcon, color: 'text-green-600', bg: 'bg-green-100', href: '/admin/users' },
        { name: 'Active Loads (In Hand)', value: stats.activeLoads, icon: ClipboardDocumentCheckIcon, color: 'text-orange-600', bg: 'bg-orange-100', href: '/admin/loads' },
        { name: "Today's Collections", value: stats.totalCollectionsToday, icon: BanknotesIcon, color: 'text-purple-600', bg: 'bg-purple-100', href: '/admin/loads' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <Link href={stat.href} key={stat.name} className="block group">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {loading ? '-' : stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${stat.bg}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Activity Section (Placeholder) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="flex space-x-4">
                    <Link href="/admin/users" className="text-sm text-brand-600 hover:underline">Manage Users &rarr;</Link>
                    <Link href="/admin/hotels" className="text-sm text-brand-600 hover:underline">Manage Hotels &rarr;</Link>
                </div>
            </div>
        </div>
    );
}
