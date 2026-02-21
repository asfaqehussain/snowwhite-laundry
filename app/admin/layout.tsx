'use client';

import { useRoleProtection } from "@/lib/hooks/useRoleProtection";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import {
    LayoutDashboard,
    Building2,
    Users,
    Package,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, loading } = useRoleProtection(['admin']);
    const { profile, signOut } = useAuth();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Hotels', href: '/admin/hotels', icon: Building2 },
        { name: 'Users / Drivers', href: '/admin/users', icon: Users },
        { name: 'Loads', href: '/admin/loads', icon: Package },
    ];

    if (loading || !isAuthorized) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-100 flex-shrink-0 fixed h-full z-20">
                <div className="p-6 border-b border-gray-50 flex items-center justify-center">
                    <div className="h-10 w-10 relative">
                        <img src="/logo.png" alt="Logo" className="object-contain" />
                    </div>
                    <span className="ml-3 font-bold text-lg text-slate-900 tracking-tight font-heading">Snow White</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out",
                                    isActive
                                        ? "bg-brand-50 text-brand-700 shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon
                                    className={clsx(
                                        "mr-3 flex-shrink-0 h-5 w-5 transition-colors",
                                        isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <div className="flex items-center mb-4 px-4">
                        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs ring-2 ring-white shadow-sm">
                            {profile?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900">{profile?.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                    <div className="flex items-center">
                        <div className="h-8 w-8 relative">
                            <img src="/logo.png" alt="Logo" className="object-contain" />
                        </div>
                        <span className="ml-2 font-bold text-slate-900">Snow White</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-500">
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-40 bg-white pt-20 px-4 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={clsx(
                                    "block px-4 py-3 text-base font-medium rounded-lg",
                                    pathname === item.href ? "bg-brand-50 text-brand-700" : "text-slate-600"
                                )}
                            >
                                <span className="flex items-center">
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </span>
                            </Link>
                        ))}
                        <button
                            onClick={() => { signOut(); setMobileMenuOpen(false); }}
                            className="w-full text-left flex items-center px-4 py-3 text-base font-medium text-red-600 rounded-lg hover:bg-red-50"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Sign Out
                        </button>
                    </div>
                )}

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
