'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageLoader() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setLoading(true);
        setProgress(20);
        const t1 = setTimeout(() => setProgress(60), 100);
        const t2 = setTimeout(() => setProgress(85), 300);
        const t3 = setTimeout(() => {
            setProgress(100);
            setTimeout(() => { setLoading(false); setProgress(0); }, 200);
        }, 500);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [pathname]);

    if (!loading && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 z-[9999] h-[3px] bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 shadow-[0_0_8px_rgba(14,165,233,0.6)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, opacity: loading ? 1 : 0 }}
        />
    );
}

/** Base shimmer block */
export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`skeleton rounded-xl ${className}`} />;
}

/** Card skeleton — mimics a full data card */
export function CardSkeleton({ lines = 2, hasIcon = true }: { lines?: number; hasIcon?: boolean }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
                {hasIcon && <div className="skeleton h-12 w-12 rounded-xl flex-shrink-0" />}
                <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="skeleton h-4 w-3/5 rounded-lg" />
                    {Array.from({ length: lines }).map((_, i) => (
                        <div key={i} className={`skeleton h-3 rounded-lg ${i === lines - 1 ? 'w-2/5' : 'w-4/5'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Stat card skeleton — for dashboard metric tiles */
export function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="skeleton h-10 w-10 rounded-xl" />
            </div>
            <div className="space-y-2">
                <div className="skeleton h-3 w-24 rounded-lg" />
                <div className="skeleton h-8 w-16 rounded-lg" />
                <div className="skeleton h-3 w-28 rounded-lg" />
            </div>
        </div>
    );
}

/** Hotel card skeleton — wide pill used in driver hotel list */
export function HotelCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
            <div className="skeleton h-11 w-11 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded-lg" />
                <div className="skeleton h-3 w-48 rounded-lg" />
            </div>
            <div className="skeleton h-5 w-5 rounded-full flex-shrink-0" />
        </div>
    );
}

/** User row skeleton — for the users list table */
export function UserRowSkeleton() {
    return (
        <li className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="skeleton h-12 w-12 rounded-full flex-shrink-0" />
                <div className="space-y-2">
                    <div className="skeleton h-4 w-32 rounded-lg" />
                    <div className="skeleton h-3 w-40 rounded-lg" />
                </div>
            </div>
            <div className="skeleton h-6 w-20 rounded-full" />
        </li>
    );
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
    return (
        <div className={`grid gap-4 px-4 py-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className={`skeleton h-4 rounded-lg ${i === 0 ? 'w-4/5' : 'w-3/5 mx-auto'}`} />
            ))}
        </div>
    );
}

/** Approval item row skeleton */
export function ApprovalRowSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="skeleton h-11 w-11 rounded-xl flex-shrink-0" />
                    <div className="space-y-2">
                        <div className="skeleton h-4 w-44 rounded-lg" />
                        <div className="skeleton h-3 w-32 rounded-lg" />
                    </div>
                </div>
                <div className="skeleton h-5 w-5 rounded-full" />
            </div>
        </div>
    );
}

/** Mini pill skeletons — for item chips row */
export function ItemChipsSkeleton({ count = 4 }: { count?: number }) {
    const widths = ['w-16', 'w-20', 'w-14', 'w-18', 'w-24'];
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`skeleton h-6 ${widths[i % widths.length]} rounded-lg`} />
            ))}
        </div>
    );
}
