'use client';

import { useRoleProtection } from '@/lib/hooks/useRoleProtection';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { ArrowRightOnRectangleIcon, HomeIcon, PlusCircleIcon, ClipboardIcon } from '@heroicons/react/24/outline';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, loading } = useRoleProtection(['driver']);
    const { signOut, profile } = useAuth();

    if (loading) return <div className="p-10 text-center">Loading driver app...</div>;
    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
            {/* Header */}
            <header className="bg-brand-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
                <div>
                    <h1 className="font-bold text-lg">Snow White</h1>
                    <p className="text-xs text-brand-100">Driver: {profile?.name}</p>
                </div>
                <button onClick={() => signOut()} className="p-2 hover:bg-brand-700 rounded-full">
                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 p-4">
                {children}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-6 sm:pb-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <Link href="/driver" className="flex flex-col items-center text-gray-600 hover:text-brand-600">
                    <HomeIcon className="h-6 w-6" />
                    <span className="text-xs mt-1">Home</span>
                </Link>
                <Link href="/driver/collection" className="flex flex-col items-center text-brand-600">
                    <div className="bg-brand-100 p-2 rounded-full -mt-6 border-4 border-gray-50 shadow-sm">
                        <PlusCircleIcon className="h-8 w-8 text-brand-600" />
                    </div>
                    <span className="text-xs mt-1 font-bold">Collect</span>
                </Link>
                <Link href="/driver/activity" className="flex flex-col items-center text-gray-600 hover:text-brand-600">
                    <ClipboardIcon className="h-6 w-6" />
                    <span className="text-xs mt-1">History</span>
                </Link>
            </nav>
        </div>
    );
}
