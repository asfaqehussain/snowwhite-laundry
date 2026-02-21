'use client';

import { useRoleProtection } from "@/lib/hooks/useRoleProtection";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import {
    Home,
    History,
    LogOut
} from "lucide-react";
import NotificationBell from "@/components/ui/notification-bell";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, loading } = useRoleProtection(['driver']);
    const { signOut } = useAuth();
    const pathname = usePathname();

    const navigation = [
        { name: 'Home', href: '/driver', icon: Home },
        { name: 'History', href: '/driver/activity', icon: History },
    ];

    if (loading || !isAuthorized) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center">
                    <div className="h-8 w-8 relative">
                        <img src="/logo.png" alt="Logo" className="object-contain" />
                    </div>
                    <span className="ml-2 font-bold text-slate-900 tracking-tight">Snow White</span>
                </div>
                <div className="flex items-center gap-1">
                    <NotificationBell />
                    <button onClick={signOut} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe pb-4 pt-2 px-6 flex justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/driver' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex flex-col items-center justify-center py-2"
                        >
                            <div className={clsx(
                                "p-1.5 rounded-xl transition-all duration-300",
                                isActive ? "bg-brand-50 text-brand-600" : "text-slate-400"
                            )}>
                                <item.icon className={clsx("h-6 w-6", isActive && "stroke-[2.5px]")} />
                            </div>
                            <span className={clsx(
                                "text-[10px] font-medium mt-1 transition-colors",
                                isActive ? "text-brand-600" : "text-slate-400"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    );
}
