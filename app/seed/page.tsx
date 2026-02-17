'use client';

import { useState } from 'react';

import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserRole } from '@/lib/types';
import toast from 'react-hot-toast';

export default function SeedPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>('admin');
    const [loading, setLoading] = useState(false);

    const handleSeed = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Generate ID for new user
            const newUserRef = doc(collection(db, 'users'));
            const newUserId = newUserRef.id;

            // 2. Create Firestore Profile (Custom Auth: Storing password directly as requested)
            await setDoc(newUserRef, {
                uid: newUserId,
                email: email,
                password: password, // Storing password for custom auth
                name: name,
                role: role,
                createdAt: serverTimestamp(),
                assignedHotels: [] // Initialize empty
            });

            toast.success(`Created ${role} user: ${email}`);
            setEmail('');
            setPassword('');
            setName('');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Database Seeder</h1>
            <form onSubmit={handleSeed} className="space-y-4 bg-white p-6 rounded shadow">
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                        type="text"
                        className="border p-2 w-full rounded"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        className="border p-2 w-full rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Password</label>
                    <input
                        type="password"
                        className="border p-2 w-full rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Role</label>
                    <select
                        className="border p-2 w-full rounded"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                        <option value="admin">Admin</option>
                        <option value="driver">Driver</option>
                        <option value="hotel_manager">Hotel Manager</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 w-full"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </div>
    );
}
