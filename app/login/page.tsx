'use client';

import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { Delete, Lock, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const STATIC_PASSCODE = '4050';

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAuth();

    // Mode check: 'system' for old email/password login, default for Collection PIN Numpad
    const mode = searchParams.get('mode');

    // PIN Numpad state
    const [pin, setPin] = useState('');
    const [errorShake, setErrorShake] = useState(false);

    // Old Email/Password state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Listen to keyboard for Numpad input
    useEffect(() => {
        if (mode === 'system') return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key >= '0' && e.key <= '9') {
                handlePinPress(e.key);
            } else if (e.key === 'Backspace') {
                handleBackspace();
            } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
                handleClear();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pin, mode]);

    // Handle PIN input
    function handlePinPress(digit: string) {
        if (pin.length < 4) {
            const nextPin = pin + digit;
            setPin(nextPin);

            // Auto-verify when 4 digits are entered
            if (nextPin.length === 4) {
                verifyPin(nextPin);
            }
        }
    }

    function handleBackspace() {
        setPin((prev) => prev.slice(0, -1));
    }

    function handleClear() {
        setPin('');
    }

    function verifyPin(passcode: string) {
        if (passcode === STATIC_PASSCODE) {
            sessionStorage.setItem('cr_passcode_auth', 'true');
            toast.success('Access Granted! Welcome to Collection Register', { icon: '🔑' });
            router.replace('/collection-register');
        } else {
            setErrorShake(true);
            toast.error('Incorrect Passcode. Try again.');
            setTimeout(() => {
                setErrorShake(false);
                setPin('');
            }, 500);
        }
    }

    // Handle Old Email/Password Login
    const handleSystemLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const q = query(
                collection(db, 'users'),
                where('email', '==', email),
                where('password', '==', password)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as UserProfile;

                await login(userDoc.id);

                toast.success(`Welcome back, ${userData.name}!`);

                const role = userData.role;
                if (role === 'admin') router.replace('/admin');
                else if (role === 'driver') router.replace('/driver');
                else if (role === 'hotel_manager') router.replace('/hotel');
                else router.replace('/unauthorized');
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
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans"
            style={{
                backgroundImage: "url('/login_bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] z-0 pointer-events-none" />

            {/* ─── COLLECTION PIN NUMPAD LOGIN (DEFAULT) ─── */}
            {mode !== 'system' ? (
                <div className={`max-w-[380px] w-full space-y-6 bg-white/90 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/40 relative z-10 transition-all ${errorShake ? 'animate-bounce' : ''}`}>
                    {/* Header */}
                    <div className="text-center">
                        <div className="mx-auto h-20 w-20 relative mb-4 transition-transform hover:scale-105 duration-300">
                            <img
                                src="/logo.png"
                                alt="Snow White Washing Company"
                                className="object-contain w-full h-full drop-shadow-md"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                            Collection Register
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                            Enter 4-Digit Passcode
                        </p>
                    </div>

                    {/* 4-Digit PIN Indicator Dots */}
                    <div className="flex justify-center items-center gap-4 py-2">
                        {[0, 1, 2, 3].map((index) => {
                            const isFilled = pin.length > index;
                            return (
                                <div
                                    key={index}
                                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${isFilled
                                            ? 'bg-brand-600 border-brand-600 scale-110 shadow-md shadow-brand-500/30'
                                            : 'border-slate-300 bg-slate-100'
                                        }`}
                                />
                            );
                        })}
                    </div>

                    {/* Numpad Keypad (3x4 Grid) */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handlePinPress(num)}
                                className="h-14 rounded-2xl bg-slate-100/90 hover:bg-brand-50 active:bg-brand-100 text-slate-800 hover:text-brand-700 font-bold text-xl transition-all duration-150 active:scale-95 shadow-sm border border-slate-200/60 flex items-center justify-center select-none"
                            >
                                {num}
                            </button>
                        ))}

                        {/* Bottom Row: Clear, 0, Backspace */}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider select-none"
                        >
                            Clear
                        </button>

                        <button
                            type="button"
                            onClick={() => handlePinPress('0')}
                            className="h-14 rounded-2xl bg-slate-100/90 hover:bg-brand-50 active:bg-brand-100 text-slate-800 hover:text-brand-700 font-bold text-xl transition-all duration-150 active:scale-95 shadow-sm border border-slate-200/60 flex items-center justify-center select-none"
                        >
                            0
                        </button>

                        <button
                            type="button"
                            onClick={handleBackspace}
                            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all active:scale-95 flex items-center justify-center select-none"
                            title="Delete"
                        >
                            <Delete className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            ) : (
                /* ─── OLD EMAIL/PASSWORD SYSTEM LOGIN (ACCESSED VIA MORE FEATURES) ─── */
                <div className="max-w-[400px] w-full space-y-8 bg-white/90 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/40 relative z-10">
                    <div className="text-center">
                        <div className="mx-auto h-20 w-20 relative mb-4 transition-transform hover:scale-105 duration-300">
                            <img
                                src="/logo.png"
                                alt="Snow White Washing Company"
                                className="object-contain w-full h-full drop-shadow-sm"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                            System Login
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Sign in with your email &amp; password
                        </p>
                    </div>

                    <form className="mt-6 space-y-5" onSubmit={handleSystemLogin}>
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
                        <Link href="/login" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                            ← Back to Passcode Login
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
