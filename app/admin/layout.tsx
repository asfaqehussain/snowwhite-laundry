'use client';

import { useRoleProtection } from '@/lib/hooks/useRoleProtection';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
    HomeIcon,
    UsersIcon,
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, loading } = useRoleProtection(['admin']);
    const { signOut, user } = useAuth();

    if (loading) return <div className="p-10 flex justify-center">Loading admin panel...</div>;
    if (!isAuthorized) return null; // Hook handles redirect

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        { name: 'Users', href: '/admin/users', icon: UsersIcon },
        { name: 'Hotels', href: '/admin/hotels', icon: BuildingOfficeIcon },
        { name: 'All Loads', href: '/admin/loads', icon: ClipboardDocumentListIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:block flex-shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-wider">Snow White</h1>
                    <p className="text-xs text-slate-400">Admin Console</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.name}
                        </Link>
                    ))}
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-red-900/50 hover:text-red-200 rounded-lg transition-colors mt-10"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                        Sign Out
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header (placeholder for now) */}
                <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
                    <span className="font-bold">Snow White Admin</span>
                    <button onClick={() => signOut()} className="text-sm">Sign Out</button>
                </div>

                <div className="flex-1 overflow-auto p-4 sm:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
