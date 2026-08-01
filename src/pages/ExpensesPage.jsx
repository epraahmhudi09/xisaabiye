import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  fetchExpenses, 
  fetchSuppliers, 
  deleteExpense 
} from '../services/firebaseExpenseService';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Trash2, 
  Info, 
  TrendingDown, 
  DollarSign, 
  Loader2, 
  AlertTriangle,
  User
} from 'lucide-react';

export const ExpensesPage = () => {
  const { showNotification, selectedMonth, isClosedMonth, closedMonthPeriods } = useData();
  const { currentUser, isManager } = useAuth();
  
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('THIS_MONTH'); // TODAY, THIS_WEEK, THIS_MONTH, CUSTOM, ALL
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const expList = await fetchExpenses();
      const supList = await fetchSuppliers();
      setExpenses(expList);
      setSuppliers(supList);
    } catch (err) {
      console.error("Error loading expenses/suppliers:", err);
      setError("Failed to load records from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Delete Action Handler
  const handleDelete = async () => {
    if (!expenseToDelete || isManager) return;
    setDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      showNotification && showNotification("Transaction deleted and supplier balance reverted successfully!", "success");
      setExpenseToDelete(null);
      setIsDeleteOpen(false);
      loadData(); // Reload updated arrays
    } catch (err) {
      console.error("Error deleting expense:", err);
      showNotification && showNotification("Failed to delete transaction. Permission denied.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Helper: derive YYYY-MM period string from an expense's date field
  const getExpenseMonth = (exp) => {
    if (!exp.date) return null;
    const d = new Date(exp.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Helper date parsing (robust)
  const getParsedDate = (d) => {
    if (!d) return new Date(0);
    return new Date(d);
  };

  // Stage 1: Month-only pre-filter — drives KPI cards and scopes all downstream filters
  const monthFilteredExpenses = expenses.filter(exp => {
    const expMonth = getExpenseMonth(exp);
    if (!selectedMonth || selectedMonth === 'CURRENT') {
      // Current Active Month: exclude any expense that belongs to a closed period
      if (!expMonth) return true;
      return !closedMonthPeriods.has(expMonth);
    }
    // Historical closed month: show only expenses in that exact period
    return expMonth === selectedMonth;
  });

  // Unique categories derived from the month-scoped dataset
  const categoriesList = ['ALL', ...new Set(monthFilteredExpenses.map(e => e.category))];

  // Stage 2: Full filter (search + category + date range) applied on top of month-scoped set
  const filteredExpenses = monthFilteredExpenses.filter(exp => {
    // 1. Search filter (Notes, ReceiptNo, SupplierName)
    const nameMatch = (exp.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const refMatch = (exp.receiptNo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const notesMatch = (exp.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || refMatch || notesMatch;

    // 2. Category filter
    const matchesCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;

    // 3. Date range filter
    if (!matchesSearch || !matchesCategory) return false;
    if (dateFilter === 'ALL') return true;

    const expDate = getParsedDate(exp.date);
    const now = new Date();

    if (dateFilter === 'TODAY') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return expDate >= today;
    }

    if (dateFilter === 'THIS_WEEK') {
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return expDate >= startOfWeek;
    }

    if (dateFilter === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return expDate >= startOfMonth;
    }

    if (dateFilter === 'CUSTOM' && startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      return expDate >= s && expDate <= e;
    }

    return true;
  });

  // KPI metrics — all scoped to monthFilteredExpenses (respects selected month)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Today's Operational Expenses (within the month-scoped set)
  const todayExpensesVal = monthFilteredExpenses
    .filter(e => e.type === 'operational' && getParsedDate(e.date) >= todayStart)
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  // Total Operational Expenses for the selected period
  const monthlyExpensesVal = monthFilteredExpenses
    .filter(e => e.type === 'operational')
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  // Total Supplier Payments for the selected period
  const monthlySupplierPaymentsVal = monthFilteredExpenses
    .filter(e => e.type === 'supplier_payment')
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  // Outstanding Debt (Net sum of all supplier balances — always current, not period-scoped).
  // Clamped to 0: prevents negative display caused by over-reversed balances.
  const outstandingDebtVal = Math.max(0, suppliers.reduce((acc, s) => acc + (s.currentBalance || 0), 0));

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm animate-in fade-in duration-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Expenses & Supplier Payments</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor company overhead costs, log operational expenses, and record debt settlements to suppliers in real-time.
          </p>
        </div>
        {!isManager && !isClosedMonth && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-950/60 flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Transaction</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Operational"
          value={formatCurrency(todayExpensesVal)}
          subtitle="All operating costs today"
          icon={TrendingDown}
          color="amber"
        />
        <StatCard
          title="This Month's Operational"
          value={formatCurrency(monthlyExpensesVal)}
          subtitle="Operating overhead this month"
          icon={TrendingDown}
          color="purple"
        />
        <StatCard
          title="Monthly Supplier Payments"
          value={formatCurrency(monthlySupplierPaymentsVal)}
          subtitle="Settlements paid this month"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Outstanding Supplier Debt"
          value={formatCurrency(outstandingDebtVal)}
          subtitle="Total balance owed to suppliers"
          icon={Receipt}
          color="rose"
          alert={outstandingDebtVal > 1000}
        />
      </div>

      {/* Filter Options Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by notes, receipt, or supplier..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-semibold"
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Category Select */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-none"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat === 'ALL' ? 'ALL CATEGORIES' : cat}</option>
                ))}
              </select>
            </div>

            {/* Date Select */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase">Date Range:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="p-2 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="ALL">ALL TIME</option>
                <option value="TODAY">TODAY</option>
                <option value="THIS_WEEK">THIS WEEK</option>
                <option value="THIS_MONTH">THIS MONTH</option>
                <option value="CUSTOM">CUSTOM DATE RANGE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Inputs if CUSTOM filter selected */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900/60 max-w-md animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <span className="text-[9px] uppercase text-slate-400 font-bold block">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-xs font-bold"
              />
            </div>
            <span className="text-slate-400 font-bold text-xs mt-3">to</span>
            <div className="space-y-1">
              <span className="text-[9px] uppercase text-slate-400 font-bold block">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-xs font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Receipt No</th>
                <th className="py-4 px-6">Supplier / Payee</th>
                <th className="py-4 px-6">Payment Method</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-350">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-14 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6 text-right"><div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                    <td className="py-4 px-6 text-center"><div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 font-medium">
                    No transactions matching the criteria found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isPayment = exp.type === 'supplier_payment';
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="py-4 px-6 font-medium whitespace-nowrap text-slate-500">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-4 px-6">
                        {isPayment ? (
                          <Badge variant="info" className="uppercase">Supplier Payment</Badge>
                        ) : (
                          <Badge variant="neutral" className="uppercase">{exp.category || 'General'}</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        {exp.receiptNo || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        {isPayment ? (
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {exp.supplierName}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Operational Expense</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedExpense(exp); setIsDetailsOpen(true); }}
                            title="View Details"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          {!isManager && !isClosedMonth && (
                            <button
                              onClick={() => { setExpenseToDelete(exp); setIsDeleteOpen(true); }}
                              title="Delete Transaction"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onExpenseAdded={loadData}
        showNotification={showNotification}
      />

      {/* Details View Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Transaction Details"
        maxWidth="max-w-md"
      >
        {selectedExpense && (
          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200 text-xs font-semibold">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {selectedExpense.type === 'supplier_payment' ? 'Supplier Settlement' : 'Operational Expense'}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{selectedExpense.category}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Amount Paid</span>
                  <p className="text-slate-900 dark:text-white text-sm font-extrabold">{formatCurrency(selectedExpense.amount)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Payment Method</span>
                  <p className="text-slate-900 dark:text-white text-xs">{selectedExpense.paymentMethod}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Receipt No</span>
                  <p className="text-slate-900 dark:text-white text-xs font-mono font-bold">{selectedExpense.receiptNo || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Transaction Date</span>
                  <p className="text-slate-900 dark:text-white text-xs">{formatDate(selectedExpense.date)}</p>
                </div>
              </div>

              {selectedExpense.supplierName && (
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Supplier Name</span>
                  <p className="text-slate-900 dark:text-white text-xs font-bold">{selectedExpense.supplierName}</p>
                </div>
              )}

              {selectedExpense.notes && (
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Notes / Description</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs font-medium bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-900/60 leading-relaxed max-h-24 overflow-y-auto">{selectedExpense.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Created By</span>
                  <p className="text-slate-500 text-[11px] font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {selectedExpense.createdBy || 'system'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">System Entry Date</span>
                  <p className="text-slate-500 text-[11px]">{formatDate(selectedExpense.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Deletion"
        maxWidth="max-w-md"
      >
        {expenseToDelete && (
          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200 text-xs font-semibold">
            <div className="flex items-start gap-3.5 pb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Are you absolutely sure?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  You are about to delete this transaction of <span className="font-bold text-rose-500">{formatCurrency(expenseToDelete.amount)}</span> ({expenseToDelete.category}).
                  {expenseToDelete.type === 'supplier_payment' && (
                    <span className="block mt-1.5 font-bold text-slate-700 dark:text-slate-350">
                      ⚠️ Note: Deleting this payment will revert/increase the supplier's outstanding debt balance back by {formatCurrency(expenseToDelete.amount)}.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-950/50 flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Reverting...</span>
                  </>
                ) : (
                  <span>Delete Transaction</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
