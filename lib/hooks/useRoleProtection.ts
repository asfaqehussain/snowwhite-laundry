'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-context';
import { UserRole } from '../types';

export function useRoleProtection(allowedRoles: UserRole[]) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (profile && !allowedRoles.includes(profile.role)) {
                router.push('/unauthorized');
            }
        }
    }, [user, profile, loading, router, allowedRoles]);

    return { isAuthorized: user && profile && allowedRoles.includes(profile.role), loading };
}
