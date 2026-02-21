'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, Hotel, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Truck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserRowSkeleton } from '@/components/ui/page-loader';

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

    useEffect(() => { fetchData(); }, []);

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
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const newUserRef = doc(collection(db, 'users'));
            const uid = newUserRef.id;
            await setDoc(newUserRef, {
                uid, name, email,
                password, // custom auth — plain text as designed
                role,
                assignedHotels: selectedHotels,
                createdAt: serverTimestamp()
            });
            toast.success('User created successfully');
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPassword('');
        setRole('driver'); setSelectedHotels([]);
    };

    const toggleHotel = (hotelId: string) => {
        if (role === 'hotel_manager') {
            setSelectedHotels([hotelId]);
        } else {
            setSelectedHotels(prev =>
                prev.includes(hotelId) ? prev.filter(id => id !== hotelId) : [...prev, hotelId]
            );
        }
    };

    const roleIcon = (r: string) => {
        if (r === 'driver') return <Truck className="h-6 w-6" />;
        if (r === 'hotel_manager') return <Building2 className="h-6 w-6" />;
        return <User className="h-6 w-6" />;
    };

    const roleBg = (r: string) => {
        if (r === 'driver') return 'bg-brand-50 text-brand-600';
        if (r === 'hotel_manager') return 'bg-amber-50 text-amber-600';
        return 'bg-purple-50 text-purple-600';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">User Management</h1>
                    <p className="text-slate-500 text-sm">Manage drivers, hotel managers, and admins.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="shadow-brand-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <ul className="divide-y divide-slate-50">
                        {[1, 2, 3, 4, 5].map(i => <UserRowSkeleton key={i} />)}
                    </ul>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {users.map((user) => (
                            <li key={user.uid} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center">
                                    <div className={`h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center border border-gray-100 ${roleBg(user.role)}`}>
                                        {roleIcon(user.role)}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-base font-bold text-slate-900">{user.name}</div>
                                        <div className="text-sm text-slate-500">{user.email}</div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 flex items-center space-x-6">
                                    <Badge variant={
                                        user.role === 'admin' ? 'default' :
                                            user.role === 'driver' ? 'success' : 'warning'
                                    } className="capitalize px-3 py-1">
                                        {user.role.replace('_', ' ')}
                                    </Badge>
                                    <div className="text-sm text-slate-500 text-right min-w-[120px]">
                                        {user.assignedHotels && user.assignedHotels.length > 0 ? (
                                            <span className="font-medium">{user.assignedHotels.length} Hotels Assigned</span>
                                        ) : (
                                            <span className="text-slate-300">No Assignments</span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                        {users.length === 0 && (
                            <li className="px-6 py-12 text-center text-slate-400">No users found.</li>
                        )}
                    </ul>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" />
                    <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" />
                    <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />

                    <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign Role</label>
                        <select
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm py-3 px-4 transition-all"
                            value={role}
                            onChange={e => { setRole(e.target.value as UserRole); setSelectedHotels([]); }}
                        >
                            <option value="driver">Driver</option>
                            <option value="hotel_manager">Hotel Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {role !== 'admin' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Assign Hotels {role === 'hotel_manager' ? '(Select One)' : '(Select Multiple)'}
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                                {hotels.map(hotel => (
                                    <label key={hotel.id} className="flex items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                        <input
                                            type={role === 'hotel_manager' ? 'radio' : 'checkbox'}
                                            checked={selectedHotels.includes(hotel.id)}
                                            onChange={() => toggleHotel(hotel.id)}
                                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 block text-sm font-medium text-slate-700">{hotel.name}</span>
                                    </label>
                                ))}
                                {hotels.length === 0 && <p className="text-sm text-slate-400 px-2">No hotels created yet.</p>}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={submitting} className="shadow-brand-500/20">Create User</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
