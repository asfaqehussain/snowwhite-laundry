'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
    ClipboardList,
    BarChart3,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    Home,
    CalendarPlus,
    LayoutDashboard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function CollectionRegisterLayout({ children }: { children: React.ReactNode }) {
    const { profile, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const passAuth = sessionStorage.getItem('cr_passcode_auth');
        if (passAuth === 'true' || profile) {
            setIsAuthorized(true);
        } else {
            router.replace('/login');
        }
        setCheckingAuth(false);
    }, [profile, router]);

    const handleLock = () => {
        sessionStorage.removeItem('cr_passcode_auth');
        if (profile) signOut();
        router.replace('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/collection-register', icon: LayoutDashboard },
        { name: 'Daily Collection', href: '/collection-register/daily', icon: CalendarPlus },
        { name: 'Monthly Report', href: '/collection-register/report', icon: BarChart3 },
        { name: 'Payments', href: '/collection-register/payments', icon: Wallet },
        { name: 'Settings', href: '/collection-register/settings', icon: Settings },
    ];

    if (checkingAuth || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
                    <p className="text-xs font-semibold">Verifying access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-100 flex-shrink-0 fixed h-full z-20">
                {/* Header */}
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                        <Link href="/collection-register" className="flex items-center gap-3 group">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                                style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
                            >
                                <ClipboardList className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-sm text-slate-900 tracking-tight font-heading">
                                    Collection Register
                                </h2>
                                <p className="text-[11px] text-slate-400 mt-0.5">Snow White Washing</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Home Link (Replaces Back to Admin) */}
                <div className="px-4 pt-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all duration-200"
                    >
                        <Home className="w-4 h-4 text-brand-500" />
                        Main Home Page
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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

                {/* User Footer */}
                <div className="p-4 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center min-w-0">
                            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs ring-2 ring-white shadow-sm flex-shrink-0">
                                {profile?.name?.charAt(0) || 'S'}
                            </div>
                            <div className="ml-3 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{profile?.name || 'Staff User'}</p>
                                <p className="text-[10px] text-slate-400 capitalize truncate">{profile?.role || 'Guest'}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLock}
                        className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Lock / Exit Register
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 relative min-h-screen">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
                        >
                            <ClipboardList className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">Collection Register</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-500">
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-40 bg-white pt-20 px-4 space-y-2">
                        <Link
                            href="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-base font-medium rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                            <span className="flex items-center">
                                <Home className="mr-3 h-5 w-5 text-brand-500" />
                                Main Home Page
                            </span>
                        </Link>
                        <div className="border-t border-gray-100 my-2" />
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={clsx(
                                    "block px-4 py-3 text-base font-medium rounded-lg",
                                    pathname === item.href
                                        ? "bg-brand-50 text-brand-700"
                                        : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <span className="flex items-center">
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
