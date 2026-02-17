'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
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
        <div className="pb-safe">
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-slate-400 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 font-heading">{hotelName}</h1>
                    <p className="text-sm text-slate-500">New Collection</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-24">
                <Card className="space-y-4" noPadding>
                    <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Items List</h3>
                        <span className="text-xs font-medium text-slate-400">{items.length} items</span>
                    </div>

                    <div className="p-4 space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-end space-x-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Type</label>
                                    <div className="relative">
                                        <select
                                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm py-3 px-4 transition-all appearance-none"
                                            value={item.type}
                                            onChange={(e) => updateItem(index, 'type', e.target.value)}
                                        >
                                            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-24">
                                    <Input
                                        label="Qty"
                                        type="number"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                        onFocus={e => e.target.select()}
                                        className="text-center font-bold text-brand-600"
                                    />
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="p-3 mb-[2px] text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 pt-0">
                        <button
                            type="button"
                            onClick={addItem}
                            className="w-full flex justify-center items-center py-4 border-2 border-dashed border-gray-200 rounded-xl text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-all font-semibold text-sm group"
                        >
                            <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                            Add Another Item
                        </button>
                    </div>
                </Card>

                <Card noPadding>
                    <div className="p-4">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Notes (Optional)</label>
                        <textarea
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm p-4 transition-all"
                            rows={3}
                            placeholder="Any specific comments..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-20 md:relative md:bg-transparent md:border-0 md:p-0">
                    <Button type="submit" isLoading={submitting} className="w-full text-lg py-4 font-bold shadow-xl shadow-brand-500/20" size="lg">
                        Save Collection
                    </Button>
                </div>
            </form>
        </div>
    );
}
