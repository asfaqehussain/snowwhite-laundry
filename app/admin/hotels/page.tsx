'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Hotel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, MapPin, Search, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '@/components/ui/page-loader';

export default function HotelsPage() {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHotelName, setNewHotelName] = useState('');
    const [newHotelAddress, setNewHotelAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHotels();
    }, []);

    useEffect(() => {
        // Simple search filter
        if (!searchTerm) {
            setFilteredHotels(hotels);
        } else {
            const lowerTime = searchTerm.toLowerCase();
            setFilteredHotels(hotels.filter(h =>
                h.name.toLowerCase().includes(lowerTime) ||
                h.address.toLowerCase().includes(lowerTime)
            ));
        }
    }, [searchTerm, hotels]);

    const fetchHotels = async () => {
        try {
            const q = query(collection(db, 'hotels'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const hotelsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Hotel[];
            setHotels(hotelsList);
            setFilteredHotels(hotelsList);
        } catch (error) {
            console.error("Error fetching hotels:", error);
            toast.error("Failed to load hotels");
        } finally {
            setLoading(false);
        }
    };

    const handleAddHotel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHotelName || !newHotelAddress) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'hotels'), {
                name: newHotelName,
                address: newHotelAddress,
                createdAt: serverTimestamp()
            });
            toast.success("Hotel added successfully");
            setIsModalOpen(false);
            setNewHotelName('');
            setNewHotelAddress('');
            fetchHotels(); // Refresh list
        } catch (error) {
            console.error("Error adding hotel:", error);
            toast.error("Failed to add hotel");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            await deleteDoc(doc(db, 'hotels', id));
            toast.success("Hotel deleted");
            fetchHotels();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete hotel");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">Hotels Management</h1>
                    <p className="text-slate-500 text-sm">Manage your partner hotels and locations.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="shadow-brand-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Hotel
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-sm"
                    placeholder="Search hotels by name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="skeleton h-10 w-10 rounded-full" />
                                <div className="skeleton h-8 w-8 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <div className="skeleton h-5 w-2/3 rounded-lg" />
                                <div className="skeleton h-4 w-4/5 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHotels.map((hotel) => (
                        <Card key={hotel.id} className="group hover:border-brand-200 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-10 w-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <button
                                    onClick={() => handleDelete(hotel.id, hotel.name)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Hotel"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{hotel.name}</h3>
                            <div className="flex items-center text-sm text-slate-500">
                                <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                                <span className="truncate">{hotel.address}</span>
                            </div>
                        </Card>
                    ))}
                    {filteredHotels.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-gray-200">
                            <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No hotels found.</p>
                            <p className="text-sm">Try adjusting your search or add a new hotel.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Hotel"
            >
                <form onSubmit={handleAddHotel} className="space-y-5">
                    <Input
                        label="Hotel Name"
                        value={newHotelName}
                        onChange={(e) => setNewHotelName(e.target.value)}
                        placeholder="e.g. Taj Hotel"
                        required
                        autoFocus
                        className="bg-white"
                    />
                    <Input
                        label="Address"
                        value={newHotelAddress}
                        onChange={(e) => setNewHotelAddress(e.target.value)}
                        placeholder="e.g. 123 Main St, Abu"
                        required
                        className="bg-white"
                    />
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={submitting}>
                            Add Hotel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
