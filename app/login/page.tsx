'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // Use the new login method from context
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Updated to query Firestore directly instead of Firebase Auth
            const q = query(
                collection(db, 'users'),
                where('email', '==', email),
                where('password', '==', password)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as UserProfile;

                await login(userDoc.id); // Call custom login to set session

                toast.success(`Welcome back, ${userData.name}!`);

                const role = userData.role;
                if (role === 'admin') router.push('/admin');
                else if (role === 'driver') router.push('/driver');
                else if (role === 'hotel_manager') router.push('/hotel');
                else router.push('/unauthorized');
            } else {
                toast.error('Invalid email or password');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
            style={{
                backgroundImage: "url('/login_bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-0 pointer-events-none" />

            <div className="max-w-[400px] w-full space-y-8 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 relative z-10 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="text-center">
                    {/* Logo */}
                    <div className="mx-auto h-24 w-24 relative mb-6 transition-transform hover:scale-105 duration-300">
                        <img
                            src="/logo.png"
                            alt="Snow White Washing Company"
                            className="object-contain w-full h-full drop-shadow-sm"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Sign in to access your dashboard
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                    <input type="hidden" name="remember" value="true" />

                    <div className="space-y-4">
                        <Input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            label="Email Address"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full text-base py-3 font-semibold shadow-brand-500/20"
                            size="lg"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>

                <div className="text-center pt-2">
                    <p className="text-xs text-slate-400">
                        Snow White Washing Company &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
