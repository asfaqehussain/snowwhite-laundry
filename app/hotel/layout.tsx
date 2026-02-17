'use client';

import { useRoleProtection } from "@/lib/hooks/useRoleProtection";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Building2 } from "lucide-react";
import Link from "next/link";

export default function HotelLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, loading } = useRoleProtection(['hotel_manager']);
    const { profile, signOut } = useAuth();

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
                            <div className="ml-6 flex items-baseline space-x-4">
                                <Link href="/hotel" className="bg-brand-50 text-brand-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div className="flex flex-col items-end mr-4 hidden sm:flex">
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
