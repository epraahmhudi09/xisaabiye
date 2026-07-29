import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { fetchSuppliers, addExpense } from '../../services/firebaseExpenseService';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded, showNotification }) => {
  const { currentUser } = useAuth();
  const [type, setType] = useState('operational');
  const [category, setCategory] = useState('General');
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EVC Plus');
  const [receiptNo, setReceiptNo] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Operational categories list
  const operationalCategories = [
    'Fuel',
    'Labor',
    'Rent',
    'Utilities',
    'General',
    'Custom'
  ];
  
  const [customCategory, setCustomCategory] = useState('');

  // Fetch suppliers when modal is open and type is supplier_payment
  useEffect(() => {
    if (isOpen && type === 'supplier_payment') {
      const getSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
          const list = await fetchSuppliers();
          setSuppliers(list);
          if (list.length > 0 && !supplierId && !isNewSupplier) {
            setSupplierId(list[0].id);
          } else if (list.length === 0) {
            setSupplierId('__NEW__');
            setIsNewSupplier(true);
          }
        } catch (err) {
          console.error("Error loading suppliers:", err);
          setError("Failed to load suppliers list.");
        } finally {
          setLoadingSuppliers(false);
        }
      };
      getSuppliers();
    }
  }, [isOpen, type]);

  const handleSupplierSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setSupplierId('__NEW__');
      setIsNewSupplier(true);
    } else {
      setSupplierId(val);
      setIsNewSupplier(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than $0.");
      return;
    }

    if (type === 'supplier_payment') {
      if (isNewSupplier || supplierId === '__NEW__') {
        if (!newSupplierName.trim()) {
          setError("Please enter a new supplier name.");
          return;
        }
      } else if (!supplierId) {
        setError("Please select a supplier.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let finalCategory = category;
      if (type === 'supplier_payment') {
        finalCategory = 'Supplier Payment';
      } else if (category === 'Custom') {
        finalCategory = customCategory.trim() || 'General';
      }

      let selectedSupplierName = '';
      if (type === 'supplier_payment') {
        if (isNewSupplier || supplierId === '__NEW__') {
          selectedSupplierName = newSupplierName.trim();
        } else {
          const found = suppliers.find(s => s.id === supplierId);
          selectedSupplierName = found ? found.name : '';
        }
      }

      const expenseData = {
        type,
        category: finalCategory,
        amount: parsedAmount,
        paymentMethod,
        receiptNo: receiptNo.trim(),
        notes: notes.trim(),
        date: new Date(date).toISOString(),
        ...(type === 'supplier_payment' && {
          supplierId: isNewSupplier ? '' : supplierId,
          supplierName: selectedSupplierName,
          isNewSupplier
        })
      };

      await addExpense(expenseData, currentUser?.uid);
      showNotification && showNotification(
        `Successfully logged ${type === 'supplier_payment' ? 'Supplier Payment' : 'Operational Expense'} of $${parsedAmount.toFixed(2)}!`, 
        'success'
      );
      
      // Reset form fields
      setType('operational');
      setCategory('General');
      setSupplierId('');
      setNewSupplierName('');
      setIsNewSupplier(false);
      setAmount('');
      setPaymentMethod('EVC Plus');
      setReceiptNo('');
      setNotes('');
      setCustomCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      
      onExpenseAdded();
      onClose();
    } catch (err) {
      console.error("Error logging transaction:", err);
      setError(err.message || "Failed to log transaction. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Expense / Supplier Payment" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
        
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30">
            {error}
          </div>
        )}

        {/* Transaction Type Select */}
        <div className="space-y-2">
          <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setType('operational'); setCategory('General'); }}
              className={`py-2.5 px-4 rounded-xl border text-center font-bold transition-all ${
                type === 'operational'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/50'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Operational Expense
            </button>
            <button
              type="button"
              onClick={() => { setType('supplier_payment'); setCategory('Supplier Payment'); }}
              className={`py-2.5 px-4 rounded-xl border text-center font-bold transition-all ${
                type === 'supplier_payment'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/50'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Supplier Payment
            </button>
          </div>
        </div>

        {/* Supplier Dropdown - shown if Supplier Payment */}
        {type === 'supplier_payment' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
                Supplier Selector
              </label>
              {!isNewSupplier && (
                <button
                  type="button"
                  onClick={() => { setSupplierId('__NEW__'); setIsNewSupplier(true); }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
                >
                  + Add New Supplier
                </button>
              )}
            </div>

            {loadingSuppliers ? (
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Fetching suppliers...</span>
              </div>
            ) : (
              <select
                value={supplierId}
                onChange={handleSupplierSelectChange}
                className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {s.name} {s.phone ? `(${s.phone})` : ''} - Bal: ${s.currentBalance ? s.currentBalance.toFixed(2) : '0.00'}
                  </option>
                ))}
                <option value="__NEW__" className="bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400 font-bold">
                  + Add New Supplier (Enter Name Directly)
                </option>
              </select>
            )}

            {(isNewSupplier || supplierId === '__NEW__') && (
              <div className="mt-2 space-y-1">
                <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
                  New Supplier Name
                </label>
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. Somali Energy Corp, Local Vendor"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Category Selector - shown if Operational Expense */}
        {type === 'operational' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                {operationalCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">{cat}</option>
                ))}
              </select>
            </div>

            {category === 'Custom' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
                  Custom Category Name
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Electricity, Repairs"
                  className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
              Amount ($ USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
              Transaction Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>
        </div>

        {/* Payment Method & Receipt No */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="Cash" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Cash</option>
              <option value="EVC Plus" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">EVC Plus</option>
              <option value="Zaad" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Zaad</option>
              <option value="Sahal" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Sahal</option>
              <option value="Bank Transfer" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">Bank Transfer</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
              Receipt No / Ref ID (Optional)
            </label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              placeholder="e.g. REC-1029"
              className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">
            Notes / Description
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add some details about this transaction..."
            rows="3"
            className="w-full p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
          ></textarea>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-950/50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Transaction</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
