'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { CalendarPlus, BarChart3, Wallet, ClipboardList, ArrowRight } from 'lucide-react';
import { getRecentCollections, getHotels } from '@/lib/collection-register/firestore-service';
import type { CRDailyCollection } from '@/lib/collection-register/types';
import { COLLECTION_STATUS } from '@/lib/collection-register/constants';

export default function CollectionRegisterDashboard() {
    const [recentCollections, setRecentCollections] = useState<CRDailyCollection[]>([]);
    const [hotelCount, setHotelCount] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const [collections, hotels] = await Promise.all([
                getRecentCollections(10),
                getHotels(),
            ]);
            setRecentCollections(collections);
            setHotelCount(hotels.length);

            // Count today's collections
            const today = new Date().toISOString().split('T')[0];
            const todayEntries = collections.filter((c) => c.collection_date === today);
            setTodayCount(todayEntries.length);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    const quickActions = [
        {
            title: 'Daily Collection',
            description: 'Enter today\'s laundry quantities',
            href: '/collection-register/daily',
            icon: CalendarPlus,
            gradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
        },
        {
            title: 'Monthly Report',
            description: 'View & generate monthly reports',
            href: '/collection-register/report',
            icon: BarChart3,
            gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        },
        {
            title: 'Payments',
            description: 'Track hotel payments & billing',
            href: '/collection-register/payments',
            icon: Wallet,
            gradient: 'linear-gradient(135deg, #10b981, #059669)',
        },
    ];

    return (
        <div className="animate-fade-in-up">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    Collection Register
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage daily laundry collections, reports, and payments
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="!p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-50">
                            <CalendarPlus className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {loading ? '—' : todayCount}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">Today&apos;s Entries</p>
                        </div>
                    </div>
                </Card>
                <Card className="!p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-50">
                            <ClipboardList className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {loading ? '—' : hotelCount}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">Active Hotels</p>
                        </div>
                    </div>
                </Card>
                <Card className="!p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                            <BarChart3 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {loading ? '—' : recentCollections.length}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">Recent Entries</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link key={action.href} href={action.href}>
                            <Card className="!p-0 group cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                                <div className="p-5">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                                        style={{ background: action.gradient }}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 text-sm">{action.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                                    <div className="flex items-center gap-1 mt-3 text-brand-600 text-xs font-medium group-hover:gap-2 transition-all duration-200">
                                        Open <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <Card>
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h2>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 skeleton rounded-lg" />
                        ))}
                    </div>
                ) : recentCollections.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">No collections yet</p>
                        <p className="text-xs mt-1">Start by entering a daily collection</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentCollections.map((col) => (
                            <div
                                key={col.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${col.status === 'LEAVE' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{col.hotel_name}</p>
                                        <p className="text-xs text-slate-500">{col.collection_date}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${col.status === 'LEAVE'
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                    {col.status === 'LEAVE' ? 'Leave' : 'Collection'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
