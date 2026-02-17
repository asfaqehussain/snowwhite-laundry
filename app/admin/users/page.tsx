'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { UserProfile, Hotel, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PlusIcon, UserIcon, TruckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('driver');
    const [selectedHotels, setSelectedHotels] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersSnap, hotelsSnap] = await Promise.all([
                getDocs(query(collection(db, 'users'), orderBy('name'))),
                getDocs(query(collection(db, 'hotels'), orderBy('name')))
            ]);

            setUsers(usersSnap.docs.map(d => d.data() as UserProfile));
            setHotels(hotelsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Hotel)));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        let secondaryApp;
        try {
            // 1. Initialize secondary app to create user without logging out admin
            const config = {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            };
            // Use a unique name for the secondary app to avoid conflicts
            const appName = `secondary-auth-${Date.now()}`;
            secondaryApp = initializeApp(config, appName);
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const uid = userCredential.user.uid;

            // 2. Create Firestore Profile (using primary app's db)
            await setDoc(doc(db, 'users', uid), {
                uid,
                name,
                email,
                role,
                assignedHotels: selectedHotels,
                createdAt: serverTimestamp()
            });

            toast.success("User created successfully");
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create user");
        } finally {
            if (secondaryApp) await deleteApp(secondaryApp); // Cleanup
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('driver');
        setSelectedHotels([]);
    };

    const toggleHotel = (hotelId: string) => {
        if (role === 'hotel_manager') {
            // Single select for managers
            setSelectedHotels([hotelId]);
        } else {
            // Multi select for drivers
            setSelectedHotels(prev =>
                prev.includes(hotelId) ? prev.filter(id => id !== hotelId) : [...prev, hotelId]
            );
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {users.map((user) => (
                        <li key={user.uid} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                                    {user.role === 'admin' && <UserIcon className="h-6 w-6 text-gray-500" />}
                                    {user.role === 'driver' && <TruckIcon className="h-6 w-6 text-brand-500" />}
                                    {user.role === 'hotel_manager' && <BuildingOfficeIcon className="h-6 w-6 text-indigo-500" />}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                    <div className="text-xs text-gray-400 uppercase mt-0.5">{user.role}</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs text-right">
                                {user.assignedHotels && user.assignedHotels.length > 0 ? (
                                    <span>Assigned: {user.assignedHotels.length} Hotels</span>
                                ) : (
                                    <span className="text-gray-300">No Assignments</span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                            value={role}
                            onChange={e => {
                                setRole(e.target.value as UserRole);
                                setSelectedHotels([]);
                            }}
                        >
                            <option value="driver">Driver</option>
                            <option value="hotel_manager">Hotel Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {role !== 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign Hotels {role === 'hotel_manager' ? '(Select One)' : '(Select Multiple)'}
                            </label>
                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                                {hotels.map(hotel => (
                                    <div key={hotel.id} className="flex items-center">
                                        <input
                                            type={role === 'hotel_manager' ? 'radio' : 'checkbox'}
                                            id={`hotel-${hotel.id}`}
                                            checked={selectedHotels.includes(hotel.id)}
                                            onChange={() => toggleHotel(hotel.id)}
                                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`hotel-${hotel.id}`} className="ml-2 block text-sm text-gray-900 cursor-pointer">
                                            {hotel.name}
                                        </label>
                                    </div>
                                ))}
                                {hotels.length === 0 && <p className="text-sm text-gray-500">No hotels available.</p>}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={submitting}>Create User</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
