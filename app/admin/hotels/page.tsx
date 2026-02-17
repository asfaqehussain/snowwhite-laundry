'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Hotel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PlusIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function HotelsPage() {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHotelName, setNewHotelName] = useState('');
    const [newHotelAddress, setNewHotelAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            const q = query(collection(db, 'hotels'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const hotelsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Hotel[];
            setHotels(hotelsList);
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Hotels Management</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Hotel
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading hotels...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hotels.map((hotel) => (
                        <div key={hotel.id} className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                                    <div className="flex items-center text-sm text-gray-500 mt-2">
                                        <MapPinIcon className="h-4 w-4 mr-1" />
                                        {hotel.address}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(hotel.id, hotel.name)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {hotels.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed">
                            No hotels found. Add one to get started.
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Hotel"
            >
                <form onSubmit={handleAddHotel} className="space-y-4">
                    <Input
                        label="Hotel Name"
                        value={newHotelName}
                        onChange={(e) => setNewHotelName(e.target.value)}
                        placeholder="e.g. Taj Hotel"
                        required
                        autoFocus
                    />
                    <Input
                        label="Address"
                        value={newHotelAddress}
                        onChange={(e) => setNewHotelAddress(e.target.value)}
                        placeholder="e.g. 123 Main St, Abu"
                        required
                    />
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
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
