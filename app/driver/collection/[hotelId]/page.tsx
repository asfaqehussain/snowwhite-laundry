'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Default items based on user provided list
const ITEM_TYPES = [
    "Shirt", "Pant/Trouser", "T-shirt", "Jeans", "Shorts", "Jacket", "Suit (2pc)", "Suit (4pc)",
    "Bedsheet", "Pillow Cover", "Towel", "Blanket", "Curtain", "Saree", "Blouse"
];

export default function CollectionPage() {
    const { hotelId } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [hotelName, setHotelName] = useState('Loading...');
    const [items, setItems] = useState([{ type: 'Bedsheet', quantity: 0 }]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (hotelId) fetchHotel();
    }, [hotelId]);

    const fetchHotel = async () => {
        try {
            const docSnap = await getDoc(doc(db, 'hotels', hotelId as string));
            if (docSnap.exists()) {
                setHotelName(docSnap.data().name);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch hotel details");
        }
    };

    const addItem = () => {
        setItems([...items, { type: ITEM_TYPES[0], quantity: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: 'type' | 'quantity', value: any) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validate
        const validItems = items.filter(i => i.quantity > 0);
        if (validItems.length === 0) {
            toast.error("Please add at least one item with quantity");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'loads'), {
                hotelId,
                driverId: user.uid,
                status: 'collected',
                collectedAt: serverTimestamp(),
                items: validItems,
                notes
            });
            toast.success("Collection Saved!");
            router.push('/driver');
        } catch (error) {
            console.error(error);
            toast.error("Failed to save collection");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-900">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{hotelName}</h1>
                    <p className="text-sm text-gray-500">New Collection</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-end space-x-2 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Item Type</label>
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2 px-3 border"
                                    value={item.type}
                                    onChange={(e) => updateItem(index, 'type', e.target.value)}
                                >
                                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2 px-3 border"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    onFocus={e => e.target.select()}
                                />
                            </div>
                            {items.length > 1 && (
                                <button type="button" onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-500">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full flex justify-center items-center py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-500 hover:text-brand-500 transition-colors font-medium text-sm"
                    >
                        <PlusIcon className="h-5 w-5 mr-1" />
                        Add Another Item
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-3"
                        rows={3}
                        placeholder="Any specific comments..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-20 md:relative md:bg-transparent md:border-0 md:p-0">
                    <Button type="submit" isLoading={submitting} className="w-full text-lg py-3 shadow-lg shadow-brand-500/20">
                        Save Collection
                    </Button>
                </div>
            </form>
        </div>
    );
}
