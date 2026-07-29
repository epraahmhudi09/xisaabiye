import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

export const exportToExcel = (salesData, reportTitle = 'Sales_Report') => {
  const formattedData = salesData.map(sale => ({
    'Date': formatDate(sale.date),
    'Product': sale.productName,
    'Qty Sold': sale.quantitySold,
    'Cost Price ($)': sale.costPriceAtSale || 0,
    'Unit Selling Price ($)': sale.unitSellingPrice || 0,
    'Total Amount ($)': sale.totalPrice || 0,
    'Gross Profit ($)': sale.profit || 0,
    'Payment Status': (sale.paymentStatus || 'cash').toUpperCase(),
    'Customer / Debt Owner': sale.customerName || '-',
    'Logged By': sale.createdBy || 'Partner'
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales & Profits');
  
  // Auto-width adjustment
  const maxCols = Object.keys(formattedData[0] || {}).map(key => ({
    wch: Math.max(key.length + 4, 15)
  }));
  worksheet['!cols'] = maxCols;

  const fileName = `${reportTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportToPDF = (salesData, reportTitle = 'Sales & Profitability Report', summaryMetrics = {}) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Company Header Accent
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 25, 'F');
  
  doc.setTextColor(37, 99, 235); // sapphire-600
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('XISAABIYE', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(reportTitle, 14, 18);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 220, 15);

  // Summary Metrics Banner
  let startY = 32;
  if (summaryMetrics.totalRevenue !== undefined) {
    doc.setFillColor(30, 41, 59);
    doc.rect(14, 28, 269, 14, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    
    const revText = `Revenue: ${formatCurrency(summaryMetrics.totalRevenue)}`;
    const profitText = `Profit: ${formatCurrency(summaryMetrics.totalProfit)}`;
    const loansText = `Outstanding Loans (Dayn): ${formatCurrency(summaryMetrics.totalLoans)}`;
    const cashText = `Cash Recd: ${formatCurrency(summaryMetrics.totalCash)}`;

    doc.text(revText, 20, 37);
    doc.setTextColor(16, 185, 129);
    doc.text(profitText, 85, 37);
    doc.setTextColor(244, 63, 94);
    doc.text(loansText, 150, 37);
    doc.setTextColor(255, 255, 255);
    doc.text(cashText, 230, 37);

    startY = 48;
  }

  // Sales Table
  const tableHeaders = [
    ['Date', 'Product Name', 'Qty', 'Cost Price', 'Selling Price', 'Total Sale', 'Profit', 'Status', 'Customer']
  ];

  const tableBody = salesData.map(sale => [
    formatDate(sale.date),
    sale.productName,
    sale.quantitySold,
    formatCurrency(sale.costPriceAtSale || 0),
    formatCurrency(sale.unitSellingPrice || 0),
    formatCurrency(sale.totalPrice || 0),
    formatCurrency(sale.profit || 0),
    sale.paymentStatus === 'loan' ? 'LOAN (DAYN)' : 'CASH',
    sale.customerName || '-'
  ]);

  autoTable(doc, {
    startY: startY,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249]
    },
    columnStyles: {
      6: { fontStyle: 'bold', textColor: [16, 185, 129] }, // Profit green
      7: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'LOAN (DAYN)') {
          data.cell.styles.textColor = [225, 29, 72]; // Rose red badge
        } else {
          data.cell.styles.textColor = [22, 163, 74]; // Cash green badge
        }
      }
    }
  });

  const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
