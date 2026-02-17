'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserRole } from './types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    role: UserRole | null;
    signOut: () => Promise<void>;
    login: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    role: null,
    signOut: async () => { },
    login: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null); // Mocking Firebase User object if needed, or just rely on profile
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check localStorage for persisted session
        const storedUid = localStorage.getItem('snow_white_uid');
        if (storedUid) {
            checkSession(storedUid);
        } else {
            setLoading(false);
        }
    }, []);

    const checkSession = async (uid: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile;
                setProfile(userData);
                // Create a mock user object to satisfy interfaces expecting it
                setUser({ uid: userData.uid, email: userData.email } as User);
            } else {
                localStorage.removeItem('snow_white_uid');
                setProfile(null);
                setUser(null);
            }
        } catch (error) {
            console.error("Session check failed", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (uid: string) => {
        setLoading(true);
        await checkSession(uid);
        localStorage.setItem('snow_white_uid', uid);
        setLoading(false);
    }

    const signOut = async () => {
        localStorage.removeItem('snow_white_uid');
        setProfile(null);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                role: profile?.role || null,
                signOut,
                login // Exposing this new method
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
