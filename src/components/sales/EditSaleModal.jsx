import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircle, DollarSign, UserCheck, ShoppingBag } from 'lucide-react';

export const EditSaleModal = ({ isOpen, onClose, sale }) => {
  const { products, customers, updateSale } = useData();

  const [quantitySold, setQuantitySold] = useState(1);
  const [unitSellingPrice, setUnitSellingPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const product = sale ? products.find(p => p.id === sale.productId) : null;
  const originalQty = sale ? sale.quantitySold : 0;
  const costPriceAtSale = sale ? (sale.costPriceAtSale || 0) : 0;
  
  // Maximum quantity allowed is current stock + what was already sold in this sale
  const maxStockAllowed = product ? (product.stockQuantity + originalQty) : originalQty;

  useEffect(() => {
    if (sale) {
      setQuantitySold(sale.quantitySold || 1);
      setUnitSellingPrice(sale.unitSellingPrice || '');
      setPaymentStatus(sale.paymentStatus || 'cash');
      setCustomerName(sale.customerName || '');
      setNotes(sale.notes || '');
      setError('');
    }
  }, [sale, isOpen]);

  const handleCustomerSelect = (e) => {
    setCustomerName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!sale) return;

    const qty = parseInt(quantitySold, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    if (qty > maxStockAllowed) {
      setError(`Stock limit exceeded! Only ${maxStockAllowed} total units available (Stock: ${product ? product.stockQuantity : 0} + Current Sale Qty: ${originalQty}).`);
      return;
    }

    const price = parseFloat(unitSellingPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid selling price.');
      return;
    }

    if (paymentStatus === 'loan' && !customerName.trim()) {
      setError('Customer name is required for Loan (Dayn) sales.');
      return;
    }

    setSubmitting(true);
    try {
      await updateSale(sale.id, {
        quantitySold: qty,
        unitSellingPrice: price,
        paymentStatus,
        customerName: paymentStatus === 'loan' ? customerName : '',
        notes
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = (parseInt(quantitySold, 10) || 0) * (parseFloat(unitSellingPrice) || 0);
  const estimatedProfit = (parseFloat(unitSellingPrice) || 0 - costPriceAtSale) * (parseInt(quantitySold, 10) || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Sale Transaction" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center gap-2 text-xs font-semibold text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Information Display (Read-Only) */}
        {product && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-blue-400" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Editing Sale for</span>
                <strong className="text-slate-100 text-sm">{product.name}</strong>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 block">Available Pool</span>
              <strong className="text-slate-200">{maxStockAllowed} units</strong>
            </div>
          </div>
        )}

        {/* Quantity and Selling Price grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Quantity Sold *
            </label>
            <input
              type="number"
              min="1"
              max={maxStockAllowed}
              value={quantitySold}
              onChange={(e) => setQuantitySold(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
              Unit Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitSellingPrice}
              onChange={(e) => setUnitSellingPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold text-emerald-700 dark:text-emerald-400"
              required
            />
          </div>
        </div>

        {/* Dynamic Calculation Live Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold block">Total Sale Amount:</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold block">Estimated Profit:</span>
            <span className={`text-base font-extrabold ${estimatedProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(estimatedProfit)}
            </span>
          </div>
        </div>

        {/* Payment Status Selection: CASH vs LOAN */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-2">
            Payment Status *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentStatus('cash')}
              className={`p-3 rounded-xl border text-center font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                paymentStatus === 'cash'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>CASH (Paid)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentStatus('loan')}
              className={`p-3 rounded-xl border text-center font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                paymentStatus === 'loan'
                  ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-400 shadow-md ring-1 ring-rose-500'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>LOAN / DAYN</span>
            </button>
          </div>
        </div>

        {/* Loan Details */}
        {paymentStatus === 'loan' && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Credit / Dayn Transaction Details</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                list="edit-customer-list"
                value={customerName}
                onChange={handleCustomerSelect}
                placeholder="e.g. Abdi Hassan"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-semibold"
                required={paymentStatus === 'loan'}
              />
              <datalist id="edit-customer-list">
                {customers.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} (Debt: ${c.totalDebt?.toFixed(2) || '0.00'})
                  </option>
                ))}
              </datalist>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Notes / Reference (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Promised settlement date..."
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all ${
              paymentStatus === 'loan'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/60'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60'
            } disabled:opacity-50`}
          >
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
