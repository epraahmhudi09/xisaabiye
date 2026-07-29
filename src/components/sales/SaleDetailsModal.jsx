import React from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Printer, Calendar, User, ShoppingBag, Receipt, DollarSign, ArrowRight } from 'lucide-react';

export const SaleDetailsModal = ({ isOpen, onClose, sale }) => {
  if (!sale) return null;

  const isLoan = sale.paymentStatus === 'loan';
  const profit = sale.profit || 0;

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert("Please allow popups to print the receipt.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Receipt - Xisaabiye</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              color: #000;
              background: #fff;
              font-size: 14px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: 20px;
              margin: 0;
              letter-spacing: 2px;
            }
            .header p {
              margin: 4px 0;
              font-size: 12px;
            }
            .info-table, .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .info-table td {
              padding: 3px 0;
              font-size: 12px;
            }
            .items-table th, .items-table td {
              padding: 5px 0;
              text-align: left;
            }
            .items-table th {
              border-bottom: 1px dashed #000;
              font-size: 12px;
            }
            .items-table td {
              font-size: 13px;
            }
            .text-right {
              text-align: right;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .totals {
              font-size: 15px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 11px;
              border-top: 2px dashed #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h1>XISAABIYE</h1>
            <p>Stock & Dayn System</p>
            <p>Mogadishu, Somalia</p>
          </div>
          
          <table class="info-table">
            <tr>
              <td><strong>Tx ID:</strong> ${sale.id}</td>
              <td class="text-right"><strong>Date:</strong> ${new Date(sale.date || Date.now()).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Logged By:</strong> ${sale.createdBy || 'System'}</td>
              <td class="text-right"><strong>Status:</strong> ${(sale.paymentStatus || 'cash').toUpperCase()}</td>
            </tr>
            ${sale.customerName ? `
            <tr>
              <td colspan="2"><strong>Customer:</strong> ${sale.customerName}</td>
            </tr>
            ` : ''}
          </table>
          
          <div class="divider"></div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${sale.productName}</td>
                <td class="text-right">${sale.quantitySold}</td>
                <td class="text-right">$${parseFloat(sale.unitSellingPrice).toFixed(2)}</td>
                <td class="text-right">$${parseFloat(sale.totalPrice).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <table class="info-table totals">
            <tr>
              <td>GRAND TOTAL:</td>
              <td class="text-right">$${parseFloat(sale.totalPrice).toFixed(2)}</td>
            </tr>
            ${sale.paymentStatus === 'loan' ? `
            <tr>
              <td>PAYMENT DUE (DAYN):</td>
              <td class="text-right">$${parseFloat(sale.totalPrice).toFixed(2)}</td>
            </tr>
            ` : `
            <tr>
              <td>CASH RECEIVED:</td>
              <td class="text-right">$${parseFloat(sale.totalPrice).toFixed(2)}</td>
            </tr>
            `}
          </table>

          ${sale.notes ? `
          <div style="font-size: 11px; margin-top: 10px;">
            <strong>Notes:</strong> ${sale.notes}
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Mahadsanid / Thank you for your business!</p>
            <p>Powered by Xisaabiye System</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sale Transaction Receipt" maxWidth="max-w-md">
      <div className="space-y-5 text-xs font-semibold text-slate-800 dark:text-slate-200">
        
        {/* Receipt Header Accent */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Transaction Details</h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Receipt Invoice</span>
          </div>
        </div>

        {/* Transaction Meta info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Transaction ID</span>
            <p className="text-slate-900 dark:text-white font-mono font-bold text-xs truncate" title={sale.id}>
              {sale.id}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Timestamp</span>
            <p className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(sale.date)}
            </p>
          </div>
        </div>

        {/* Product details card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-500" />
            <strong className="text-slate-900 dark:text-white text-sm">{sale.productName}</strong>
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
            <div>
              <span>Cost Price</span>
              <p className="text-slate-900 dark:text-white text-xs font-bold mt-0.5">{formatCurrency(sale.costPriceAtSale || 0)}</p>
            </div>
            <div>
              <span>Unit Selling Price</span>
              <p className="text-emerald-500 text-xs font-bold mt-0.5">{formatCurrency(sale.unitSellingPrice)}</p>
            </div>
            <div className="text-right">
              <span>Qty Sold</span>
              <p className="text-slate-900 dark:text-white text-xs font-black mt-0.5">x{sale.quantitySold}</p>
            </div>
          </div>
        </div>

        {/* Financial calculations */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[9px] uppercase text-slate-600 dark:text-slate-400 font-bold block">Total Sale Revenue</span>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(sale.totalPrice)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[9px] uppercase text-slate-600 dark:text-slate-400 font-bold block">Estimated Net Profit</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">+{formatCurrency(profit)}</p>
          </div>
        </div>

        {/* Payment and Customer Info */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-1">Payment Status</span>
              {isLoan ? (
                <Badge variant="loan" className="w-fit text-[10px] py-1 font-bold">LOAN (DAYN)</Badge>
              ) : (
                <Badge variant="cash" className="w-fit text-[10px] py-1 font-bold">CASH SETTLED</Badge>
              )}
            </div>
            {isLoan && (
              <div>
                <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Debtor/Customer</span>
                <p className="text-rose-400 font-extrabold text-xs">{sale.customerName}</p>
              </div>
            )}
          </div>

          {sale.notes && (
            <div>
              <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-1">Notes / Description</span>
              <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-350 italic font-medium leading-relaxed">
                {sale.notes}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Logged By: <strong>{sale.createdBy || 'System'}</strong></span>
            </div>
            <div className="text-right">
              <span>Record ID: {sale.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors"
          >
            Close
          </button>
          
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all transform hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
