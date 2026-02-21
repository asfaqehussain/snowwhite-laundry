'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function PageLoader() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Start animation on route change
        setLoading(true);
        setProgress(20);

        const t1 = setTimeout(() => setProgress(60), 100);
        const t2 = setTimeout(() => setProgress(85), 300);
        const t3 = setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 200);
        }, 500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [pathname]);

    if (!loading && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 z-[9999] h-[3px] bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 shadow-[0_0_8px_rgba(14,165,233,0.6)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, opacity: loading ? 1 : 0 }}
        />
    );
}

/** Skeleton shimmer block — reusable across all pages */
export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%] rounded-xl ${className}`}
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
        />
    );
}
