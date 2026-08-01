'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import {
    getHotels,
    getItems,
    getMonthlyCollections,
    getPayments,
    addPayment,
    deletePayment,
} from '@/lib/collection-register/firestore-service';
import { calculateMonthlyBill } from '@/lib/collection-register/report-utils';
import {
    MONTHS,
    getYearOptions,
    formatCurrency,
    toISODate,
} from '@/lib/collection-register/constants';
import {
    Wallet,
    Plus,
    Search,
    Calendar,
    IndianRupee,
    TrendingDown,
    TrendingUp,
    Trash2,
    MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HotelOption {
    id: string;
    name: string;
}

export default function PaymentsPage() {
    const { profile } = useAuth();
    const [hotels, setHotels] = useState<HotelOption[]>([]);
    const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [monthlyBill, setMonthlyBill] = useState(0);
    const [payments, setPayments] = useState<any[]>([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [pending, setPending] = useState(0);

    const [loading, setLoading] = useState(false);
    const [loadingHotels, setLoadingHotels] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(toISODate(new Date()));
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [addingPayment, setAddingPayment] = useState(false);

    useEffect(() => {
        loadHotels();
    }, []);

    async function loadHotels() {
        try {
            const h = await getHotels();
            setHotels(h);
        } catch (error) {
            console.error('Failed to load hotels:', error);
        } finally {
            setLoadingHotels(false);
        }
    }

    async function loadPaymentData() {
        if (!selectedHotel) return;

        setLoading(true);
        setDataLoaded(false);

        try {
            const [collections, items, paymentsList] = await Promise.all([
                getMonthlyCollections(selectedHotel.id, selectedMonth, selectedYear),
                getItems(true),
                getPayments(selectedHotel.id, selectedMonth, selectedYear),
            ]);

            const bill = calculateMonthlyBill(collections, items);
            const paid = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);

            setMonthlyBill(bill);
            setPayments(paymentsList);
            setTotalPaid(paid);
            setPending(bill - paid);
            setDataLoaded(true);
        } catch (error) {
            console.error('Failed to load payment data:', error);
            toast.error('Failed to load payment data');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddPayment() {
        if (!selectedHotel || !profile) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setAddingPayment(true);
        try {
            await addPayment({
                hotel_id: selectedHotel.id,
                billing_month: selectedMonth,
                billing_year: selectedYear,
                amount,
                payment_date: paymentDate,
                remarks: paymentRemarks,
                created_by: profile.uid,
            });

            toast.success('Payment added successfully!');
            setShowAddModal(false);
            setPaymentAmount('');
            setPaymentRemarks('');
            setPaymentDate(toISODate(new Date()));

            // Reload data
            await loadPaymentData();
        } catch (error) {
            console.error('Failed to add payment:', error);
            toast.error('Failed to add payment');
        } finally {
            setAddingPayment(false);
        }
    }

    async function handleDeletePayment(paymentId: string) {
        if (!confirm('Are you sure you want to delete this payment?')) return;

        try {
            await deletePayment(paymentId);
            toast.success('Payment deleted');
            await loadPaymentData();
        } catch (error) {
            console.error('Failed to delete payment:', error);
            toast.error('Failed to delete payment');
        }
    }

    return (
        <div className="animate-fade-in-up">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    Payments
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Track monthly payments and billing for hotels
                </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Hotel
                        </label>
                        <select
                            value={selectedHotel?.id || ''}
                            onChange={(e) => {
                                const hotel = hotels.find((h) => h.id === e.target.value);
                                setSelectedHotel(hotel || null);
                            }}
                            disabled={loadingHotels}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        >
                            <option value="">
                                {loadingHotels ? 'Loading...' : '— Select Hotel —'}
                            </option>
                            {hotels.map((h) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        >
                            {getYearOptions().map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Button
                            onClick={loadPaymentData}
                            isLoading={loading}
                            disabled={!selectedHotel}
                            className="w-full"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Load
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-28 skeleton rounded-2xl" />
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Summary */}
            {dataLoaded && !loading && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {/* Monthly Bill */}
                        <Card className="!p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-50">
                                    <IndianRupee className="w-6 h-6 text-brand-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">Monthly Bill</p>
                                    <p className="text-xl font-bold text-slate-900 tabular-nums">
                                        {formatCurrency(monthlyBill)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Total Paid */}
                        <Card className="!p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50">
                                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">Total Paid</p>
                                    <p className="text-xl font-bold text-emerald-600 tabular-nums">
                                        {formatCurrency(totalPaid)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Pending */}
                        <Card className="!p-5">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pending <= 0 ? 'bg-emerald-50' : 'bg-red-50'
                                    }`}>
                                    <TrendingDown className={`w-6 h-6 ${pending <= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">Pending</p>
                                    <p className={`text-xl font-bold tabular-nums ${pending <= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {formatCurrency(Math.max(0, pending))}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Payments List */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-900">
                                Payment History
                            </h2>
                            <Button size="sm" onClick={() => setShowAddModal(true)}>
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Payment
                            </Button>
                        </div>

                        {payments.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">No payments recorded yet</p>
                                <p className="text-xs mt-1">Click &quot;Add Payment&quot; to record a payment</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                <IndianRupee className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                                    {formatCurrency(payment.amount)}
                                                </p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {payment.payment_date}
                                                    </span>
                                                    {payment.remarks && (
                                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                                            <MessageSquare className="w-3 h-3" />
                                                            {payment.remarks}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePayment(payment.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete payment"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </>
            )}

            {/* Empty state */}
            {!dataLoaded && !loading && (
                <Card>
                    <div className="text-center py-16 text-slate-400">
                        <Wallet className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p className="text-sm font-medium">Select a hotel and billing period</p>
                        <p className="text-xs mt-1">
                            Choose a hotel, month, and year, then click Load
                        </p>
                    </div>
                </Card>
            )}

            {/* Add Payment Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Payment"
            >
                <div className="space-y-4">
                    <Input
                        label="Amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter payment amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Payment Date
                        </label>
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                            Remarks
                        </label>
                        <textarea
                            value={paymentRemarks}
                            onChange={(e) => setPaymentRemarks(e.target.value)}
                            placeholder="Optional notes..."
                            rows={2}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:text-sm px-4 py-3 resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPayment}
                            isLoading={addingPayment}
                            className="flex-1"
                        >
                            Add Payment
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
