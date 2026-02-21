'use client';

import { LoadItem } from '@/lib/types';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from './button';

interface DropRow {
    type: string;
    picked: number;
    dropping: number;
    remaining: number;
}

interface DropConfirmModalProps {
    isOpen: boolean;
    hotelName: string;
    rows: DropRow[];
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function buildDropRows(
    originalItems: LoadItem[],
    droppingItems: LoadItem[]
): DropRow[] {
    return originalItems.map(orig => {
        const dropping = droppingItems.find(d => d.type === orig.type)?.quantity ?? 0;
        return {
            type: orig.type,
            picked: orig.quantity,
            dropping,
            remaining: orig.quantity - dropping,
        };
    });
}

export default function DropConfirmModal({
    isOpen,
    hotelName,
    rows,
    onConfirm,
    onCancel,
    isLoading,
}: DropConfirmModalProps) {
    if (!isOpen) return null;

    const hasPartial = rows.some(r => r.remaining > 0);
    const totalPicked = rows.reduce((s, r) => s + r.picked, 0);
    const totalDropping = rows.reduce((s, r) => s + r.dropping, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className={`flex items-center justify-between p-5 border-b ${hasPartial ? 'border-amber-100 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
                    <div className="flex items-center gap-3">
                        {hasPartial
                            ? <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                            : <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                        }
                        <div>
                            <h3 className="font-bold text-slate-900">
                                {hasPartial ? 'Confirm Partial Drop' : 'Confirm Full Drop'}
                            </h3>
                            <p className="text-xs text-slate-500">{hotelName}</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-black/10 text-slate-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Summary bar */}
                <div className="px-5 pt-4 pb-3 flex gap-4 text-sm">
                    <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-center">
                        <p className="text-xs text-slate-400 mb-0.5">Picked</p>
                        <p className="font-bold text-slate-900">{totalPicked} pcs</p>
                    </div>
                    <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2 text-center">
                        <p className="text-xs text-emerald-600 mb-0.5">Dropping</p>
                        <p className="font-bold text-emerald-700">{totalDropping} pcs</p>
                    </div>
                    {hasPartial && (
                        <div className="flex-1 bg-red-50 rounded-xl px-3 py-2 text-center">
                            <p className="text-xs text-red-500 mb-0.5">Remaining</p>
                            <p className="font-bold text-red-600">{totalPicked - totalDropping} pcs</p>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="px-5 pb-2">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        {/* Header */}
                        <div className="grid grid-cols-4 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <span>Item</span>
                            <span className="text-center">Picked</span>
                            <span className="text-center">Drop</span>
                            <span className="text-center">Left</span>
                        </div>
                        {rows.map((row, i) => (
                            <div key={i} className={`grid grid-cols-4 items-center px-4 py-3 border-b border-slate-50 last:border-0 ${row.remaining > 0 ? 'bg-red-50/40' : ''}`}>
                                <span className="text-sm font-medium text-slate-800 truncate pr-2">{row.type}</span>
                                <span className="text-center text-sm text-slate-500">{row.picked}</span>
                                <span className="text-center text-sm font-semibold text-emerald-700">{row.dropping}</span>
                                <span className={`text-center text-sm font-bold ${row.remaining > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                    {row.remaining > 0 ? row.remaining : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Partial warning */}
                {hasPartial && (
                    <div className="mx-5 mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Load will be marked as Partially Dropped
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                            {rows.filter(r => r.remaining > 0).map(r => `${r.type}: ${r.remaining} remaining`).join(' · ')}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                            You can drop the remaining items later. Hotel manager & admin will be notified.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="p-5 pt-4 flex gap-3">
                    <Button variant="ghost" onClick={onCancel} className="flex-1">
                        Go Back
                    </Button>
                    <Button
                        onClick={onConfirm}
                        isLoading={isLoading}
                        variant={hasPartial ? 'danger' : 'primary'}
                        className="flex-1"
                    >
                        {hasPartial ? 'Submit Partial Drop' : 'Confirm Drop ✓'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
