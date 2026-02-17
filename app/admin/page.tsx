'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Building2,
    Users,
    Package,
    Wallet,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

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
        {
            name: 'Total Hotels',
            value: stats.hotels,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            href: '/admin/hotels',
            trend: '+2 this month'
        },
        {
            name: 'Active Drivers',
            value: stats.drivers,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            href: '/admin/users',
            trend: 'Active now'
        },
        {
            name: 'Active Loads',
            value: stats.activeLoads,
            icon: Package,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            href: '/admin/loads',
            trend: 'In processing'
        },
        {
            name: "Today's Collections",
            value: stats.totalCollectionsToday,
            icon: Wallet,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            href: '/admin/loads',
            trend: 'Updated just now'
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Link href={stat.href} key={stat.name} className="block group">
                        <Card className="hover:shadow-md transition-all duration-300 border-slate-100 group-hover:border-brand-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                {stat.name === 'Total Hotels' && <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1" /> +12%</span>}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-1 font-heading">
                                    {loading ? '-' : stat.value}
                                </h3>
                                <p className="text-xs text-slate-400 mt-2 flex items-center">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {stat.trend}
                                </p>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions & Recent Activity area could go here */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="h-full min-h-[300px] flex items-center justify-center border-dashed bg-slate-50/50">
                        <div className="text-center text-slate-400">
                            <p>Activity Chart Placeholder</p>
                            <p className="text-xs">Coming in next update</p>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 font-heading">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link href="/admin/users" className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Add New User</p>
                                    <p className="text-xs text-slate-500">Driver or Manager</p>
                                </div>
                                <ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-brand-500" />
                            </Link>
                            <Link href="/admin/hotels" className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                                <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Add New Hotel</p>
                                    <p className="text-xs text-slate-500">Manage properties</p>
                                </div>
                                <ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-purple-500" />
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
