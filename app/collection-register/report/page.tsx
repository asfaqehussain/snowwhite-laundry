'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    getHotels,
    getCategories,
    getItems,
    getMonthlyCollections,
} from '@/lib/collection-register/firestore-service';
import { buildMonthlyReport } from '@/lib/collection-register/report-utils';
import type { MonthlyReportData } from '@/lib/collection-register/types';
import {
    MONTHS,
    getYearOptions,
    formatCurrency,
    CURRENCY_SYMBOL,
} from '@/lib/collection-register/constants';
import { BarChart3, FileSpreadsheet, FileText, Printer, Search } from 'lucide-react';

interface HotelOption {
    id: string;
    name: string;
}

export default function MonthlyReportPage() {
    const [hotels, setHotels] = useState<HotelOption[]>([]);
    const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingHotels, setLoadingHotels] = useState(true);

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

    async function generateReport() {
        if (!selectedHotel) return;

        setLoading(true);
        setReportData(null);

        try {
            const [collections, items, categories] = await Promise.all([
                getMonthlyCollections(selectedHotel.id, selectedMonth, selectedYear),
                getItems(true),
                getCategories(),
            ]);

            const report = buildMonthlyReport(
                selectedHotel.name,
                selectedMonth,
                selectedYear,
                collections,
                items,
                categories
            );

            setReportData(report);
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="animate-fade-in-up">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">
                    Monthly Report
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Generate monthly collection reports in Excel-style format
                </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    {/* Hotel */}
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

                    {/* Month */}
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

                    {/* Year */}
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

                    {/* Generate Button */}
                    <div>
                        <Button
                            onClick={generateReport}
                            isLoading={loading}
                            disabled={!selectedHotel}
                            className="w-full"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Generate Report
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Report Table */}
            {loading && (
                <Card>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-10 skeleton rounded-lg" />
                        ))}
                    </div>
                </Card>
            )}

            {reportData && !loading && (
                <>
                    {/* Report Header */}
                    <Card className="mb-4 !p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {reportData.hotelName}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {MONTHS[reportData.month - 1]} {reportData.year} &middot; {reportData.daysInMonth} days
                                </p>
                            </div>

                            {/* Export Buttons (future-ready) */}
                            <div className="flex gap-2">
                                <button
                                    disabled
                                    title="Coming Soon"
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg border border-gray-100 cursor-not-allowed"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    Excel
                                </button>
                                <button
                                    disabled
                                    title="Coming Soon"
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg border border-gray-100 cursor-not-allowed"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    PDF
                                </button>
                                <button
                                    disabled
                                    title="Coming Soon"
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg border border-gray-100 cursor-not-allowed"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Scrollable Report Table */}
                    <Card className="!p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-900 text-white">
                                        <th className="sticky left-0 z-10 bg-slate-900 text-left px-4 py-3 font-semibold min-w-[180px]">
                                            Item
                                        </th>
                                        {Array.from({ length: reportData.daysInMonth }, (_, i) => (
                                            <th
                                                key={i + 1}
                                                className={`text-center px-2 py-3 font-medium min-w-[40px] ${reportData.leaveDays.has(i + 1) ? 'bg-amber-900/30' : ''
                                                    }`}
                                            >
                                                {i + 1}
                                            </th>
                                        ))}
                                        <th className="text-center px-3 py-3 font-semibold min-w-[60px] bg-slate-800">
                                            Total
                                        </th>
                                        <th className="text-center px-3 py-3 font-semibold min-w-[70px] bg-slate-800">
                                            Rate
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold min-w-[90px] bg-slate-800">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.categoryGroups.map(({ category, rows }) => (
                                        <>
                                            {/* Category Header Row */}
                                            <tr key={`cat-${category.id}`} className="bg-brand-50/60">
                                                <td
                                                    colSpan={reportData.daysInMonth + 4}
                                                    className="sticky left-0 z-10 bg-brand-50/60 px-4 py-2.5 font-bold text-brand-800 uppercase tracking-wide text-[11px]"
                                                >
                                                    {category.name}
                                                </td>
                                            </tr>

                                            {/* Item Rows */}
                                            {rows.map((row, rowIdx) => (
                                                <tr
                                                    key={row.item.id}
                                                    className={`border-b border-gray-50 hover:bg-slate-50/50 transition-colors ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                                        }`}
                                                >
                                                    <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                                                        {row.item.name}
                                                    </td>
                                                    {row.dailyQuantities.map((qty, dayIdx) => (
                                                        <td
                                                            key={dayIdx}
                                                            className={`text-center px-2 py-2.5 tabular-nums ${row.isLeaveDay[dayIdx]
                                                                    ? 'bg-amber-50 text-amber-500 font-medium'
                                                                    : qty === null
                                                                        ? 'text-slate-200'
                                                                        : qty === 0
                                                                            ? 'text-slate-300'
                                                                            : 'text-slate-700'
                                                                }`}
                                                        >
                                                            {row.isLeaveDay[dayIdx]
                                                                ? 'L'
                                                                : qty === null
                                                                    ? '-'
                                                                    : qty}
                                                        </td>
                                                    ))}
                                                    <td className="text-center px-3 py-2.5 font-semibold text-slate-900 bg-slate-50 tabular-nums">
                                                        {row.total}
                                                    </td>
                                                    <td className="text-center px-3 py-2.5 text-slate-500 tabular-nums">
                                                        {formatCurrency(row.rate)}
                                                    </td>
                                                    <td className="text-right px-4 py-2.5 font-semibold text-slate-900 bg-slate-50 tabular-nums">
                                                        {formatCurrency(row.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    ))}

                                    {/* Grand Total Row */}
                                    <tr className="bg-slate-900 text-white font-bold">
                                        <td
                                            colSpan={reportData.daysInMonth + 2}
                                            className="sticky left-0 z-10 bg-slate-900 px-4 py-3 text-right uppercase tracking-wide text-[11px]"
                                        >
                                            Grand Total
                                        </td>
                                        <td className="text-center px-3 py-3" />
                                        <td className="text-right px-4 py-3 text-sm tabular-nums">
                                            {formatCurrency(reportData.grandTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {/* Empty state */}
            {!reportData && !loading && (
                <Card>
                    <div className="text-center py-16 text-slate-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p className="text-sm font-medium">Select filters and generate a report</p>
                        <p className="text-xs mt-1">
                            Choose a hotel, month, and year, then click Generate Report
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
