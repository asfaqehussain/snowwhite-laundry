import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MonthlyReportData } from './types';
import { MONTHS, formatCurrency } from './constants';

/**
 * Export Monthly Report data to an Excel (.xlsx) file matching the exact spreadsheet layout.
 */
export function exportToExcel(reportData: MonthlyReportData) {
    const monthName = MONTHS[reportData.month - 1].toUpperCase();
    const fileName = `Linen_Report_${reportData.hotelName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${reportData.year}.xlsx`;

    const daysCount = reportData.daysInMonth;

    // Header row
    const headers = ['Sr', 'Particular'];
    for (let day = 1; day <= daysCount; day++) {
        headers.push(String(day));
    }
    headers.push('Total', 'Rate', 'Amount');

    const rows: any[][] = [];

    // Title row
    rows.push([`MONTH OF ${monthName} ${reportData.year} LINEN COUNT (${reportData.hotelName.toUpperCase()})`]);
    rows.push([]); // blank line
    rows.push(headers);

    // Group rows by category
    reportData.categoryGroups.forEach(({ category, rows: categoryRows }) => {
        // Category Header Row
        const catRow = new Array(headers.length).fill('');
        catRow[0] = category.name.toUpperCase();
        rows.push(catRow);

        // Category Items
        categoryRows.forEach((row, idx) => {
            const itemRow: any[] = [idx + 1, row.item.name];

            row.dailyQuantities.forEach((qty, dayIdx) => {
                if (row.isLeaveDay[dayIdx]) {
                    itemRow.push('L');
                } else if (qty === null) {
                    itemRow.push('-');
                } else {
                    itemRow.push(qty);
                }
            });

            itemRow.push(row.total);
            itemRow.push(row.rate);
            itemRow.push(row.amount);

            rows.push(itemRow);
        });
    });

    // Grand Total Row
    const grandTotalRow = new Array(headers.length).fill('');
    grandTotalRow[1] = 'GRAND TOTAL';
    grandTotalRow[headers.length - 1] = reportData.grandTotal;
    rows.push([]);
    rows.push(grandTotalRow);

    // Create Worksheet & Workbook
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    const colWidths = [
        { wch: 6 },  // Sr
        { wch: 25 }, // Particular
    ];
    for (let i = 1; i <= daysCount; i++) {
        colWidths.push({ wch: 5 });
    }
    colWidths.push({ wch: 8 }, { wch: 8 }, { wch: 12 });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Linen Report');

    // Trigger download
    XLSX.writeFile(workbook, fileName);
}

/**
 * Export Monthly Report data to a vector PDF file.
 */
export function exportToPDF(reportData: MonthlyReportData) {
    const monthName = MONTHS[reportData.month - 1];
    const fileName = `Linen_Report_${reportData.hotelName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName}_${reportData.year}.pdf`;

    // Landscape orientation PDF
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Document Header
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('Snow White Washing Company', 14, 15);

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Monthly Linen Collection Report - ${reportData.hotelName}`, 14, 22);

    doc.setFontSize(9);
    doc.text(`Period: ${monthName} ${reportData.year} | Days: ${reportData.daysInMonth}`, 14, 27);

    // Build Table Headers
    const headers = ['Sr', 'Particular'];
    for (let d = 1; d <= reportData.daysInMonth; d++) {
        headers.push(String(d));
    }
    headers.push('Total', 'Rate', 'Amount');

    const body: any[] = [];

    reportData.categoryGroups.forEach(({ category, rows }) => {
        // Category Row
        body.push([
            {
                content: category.name.toUpperCase(),
                colSpan: headers.length,
                styles: { fillColor: [240, 249, 255], textColor: [3, 105, 161], fontStyle: 'bold' },
            },
        ]);

        rows.forEach((row, idx) => {
            const itemRow: any[] = [idx + 1, row.item.name];

            row.dailyQuantities.forEach((qty, dayIdx) => {
                if (row.isLeaveDay[dayIdx]) {
                    itemRow.push('L');
                } else if (qty === null) {
                    itemRow.push('-');
                } else {
                    itemRow.push(qty);
                }
            });

            itemRow.push(row.total);
            itemRow.push(row.rate);
            itemRow.push(formatCurrency(row.amount));

            body.push(itemRow);
        });
    });

    // Grand Total Row
    body.push([
        {
            content: 'GRAND TOTAL',
            colSpan: headers.length - 1,
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        },
        {
            content: formatCurrency(reportData.grandTotal),
            styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [52, 211, 153], halign: 'right' },
        },
    ]);

    // Render Table using autoTable
    autoTable(doc, {
        head: [headers],
        body: body,
        startY: 32,
        styles: {
            fontSize: 7,
            cellPadding: 1.5,
            halign: 'center',
            valign: 'middle',
        },
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 8 },  // Sr
            1: { halign: 'left', cellWidth: 35 },   // Particular
        },
        theme: 'grid',
    });

    doc.save(fileName);
}

/**
 * Trigger Native Browser Print Dialog.
 */
export function printReport() {
    window.print();
}
