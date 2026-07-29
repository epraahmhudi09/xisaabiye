import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircle, ShoppingBag, UserCheck, DollarSign } from 'lucide-react';

export const NewSaleModal = ({ isOpen, onClose }) => {
  const { products, customers, addSale } = useData();
  const { isManager } = useAuth();

  if (isManager) return null;

  const [productId, setProductId] = useState('');
  const [quantitySold, setQuantitySold] = useState(1);
  const [unitSellingPrice, setUnitSellingPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('cash'); // 'cash' or 'loan'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);

  useEffect(() => {
    if (products.length > 0 && !productId) {
      const firstInStock = products.find(p => p.stockQuantity > 0) || products[0];
      if (firstInStock) {
        setProductId(firstInStock.id);
        setUnitSellingPrice(firstInStock.unitSellingPrice || firstInStock.costPrice * 1.25);
      }
    }
  }, [products, productId]);

  const handleProductChange = (e) => {
    const pId = e.target.value;
    setProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setUnitSellingPrice(prod.unitSellingPrice || prod.costPrice * 1.25);
      setQuantitySold(1);
    }
    setError('');
  };

  const handleCustomerSelect = (e) => {
    const name = e.target.value;
    setCustomerName(name);
    const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing && existing.phone) {
      setCustomerPhone(existing.phone);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Please select a product.');
      return;
    }

    const qty = parseInt(quantitySold, 10);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    if (qty > selectedProduct.stockQuantity) {
      setError(`Stock limit exceeded! Only ${selectedProduct.stockQuantity} units available.`);
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
      await addSale({
        productId,
        quantitySold: qty,
        unitSellingPrice: price,
        paymentStatus,
        customerName,
        customerPhone,
        notes
      });

      // Reset form
      setQuantitySold(1);
      setNotes('');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = (parseInt(quantitySold, 10) || 0) * (parseFloat(unitSellingPrice) || 0);
  const costPrice = selectedProduct ? selectedProduct.costPrice : 0;
  const estimatedProfit = selectedProduct ? (parseFloat(unitSellingPrice) || 0 - costPrice) * (parseInt(quantitySold, 10) || 0) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record New Sale (POS)" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center gap-2 text-xs font-semibold text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Select Product *
          </label>
          <select
            value={productId}
            onChange={handleProductChange}
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-emerald-500"
          >
            {products.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name} — (In Stock: {p.stockQuantity}) — Base Cost: ${p.costPrice.toFixed(2)}
              </option>
            ))}
          </select>
          {selectedProduct && (
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5 px-1">
              <span>Category: <strong className="text-slate-200">{selectedProduct.category}</strong></span>
              <span className={selectedProduct.stockQuantity < 10 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                Stock Available: {selectedProduct.stockQuantity}
              </span>
            </div>
          )}
        </div>

        {/* Quantity and Selling Price grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Quantity Sold *
            </label>
            <input
              type="number"
              min="1"
              max={selectedProduct?.stockQuantity || 1}
              value={quantitySold}
              onChange={(e) => setQuantitySold(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Unit Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitSellingPrice}
              onChange={(e) => setUnitSellingPrice(e.target.value)}
              placeholder="e.g. 15.00"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold text-emerald-400"
              required
            />
          </div>
        </div>

        {/* Dynamic Calculation Live Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Sale Amount:</span>
            <span className="text-xl font-black text-white">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Estimated Profit:</span>
            <span className={`text-base font-extrabold ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(estimatedProfit)}
            </span>
          </div>
        </div>

        {/* Payment Status Selection: CASH vs LOAN */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
            Payment Status *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentStatus('cash')}
              className={`p-3 rounded-xl border text-center font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                paymentStatus === 'cash'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/60'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
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
                  ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-md shadow-rose-950/60 ring-1 ring-rose-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>LOAN / DAYN</span>
            </button>
          </div>
        </div>

        {/* Loan Details (Required if Payment Status is Loan) */}
        {paymentStatus === 'loan' && (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Credit / Dayn Transaction Details</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                list="customer-list"
                value={customerName}
                onChange={handleCustomerSelect}
                placeholder="e.g. Abdi Hassan"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-semibold"
                required={paymentStatus === 'loan'}
              />
              <datalist id="customer-list">
                {customers.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} (Debt: ${c.totalDebt?.toFixed(2) || '0.00'})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Phone (Optional)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+252 61 XXX XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
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
            disabled={submitting || (selectedProduct && selectedProduct.stockQuantity <= 0)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all ${
              paymentStatus === 'loan'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/60'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? 'Recording...' : paymentStatus === 'loan' ? 'Confirm Dayn Sale' : 'Complete Cash Sale'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
