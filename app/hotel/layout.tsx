'use client';

import { useRoleProtection } from '@/lib/hooks/useRoleProtection';
import { useAuth } from '@/lib/auth-context';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function HotelLayout({ children }: { children: React.ReactNode }) {
    const { isAuthorized, loading } = useRoleProtection(['hotel_manager']);
    const { signOut, profile } = useAuth();

    if (loading) return <div className="p-10">Loading...</div>;
    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <div>
                    <h1 className="font-bold text-gray-800">Hotel Dashboard</h1>
                    <p className="text-sm text-gray-500">{profile?.name}</p>
                </div>
                <button
                    onClick={() => signOut()}
                    className="text-gray-500 hover:text-red-500 flex items-center gap-2"
                >
                    <span>Sign Out</span>
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
            </header>
            <main className="p-6">
                {children}
            </main>
        </div>
    );
}
