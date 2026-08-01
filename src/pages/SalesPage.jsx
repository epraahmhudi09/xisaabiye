import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  UserCheck, 
  DollarSign,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { SaleDetailsModal } from '../components/sales/SaleDetailsModal';
import { EditSaleModal } from '../components/sales/EditSaleModal';
import { Modal } from '../components/common/Modal';

export const SalesPage = ({ onOpenNewSale }) => {
  const { sales, deleteSale, showNotification, selectedMonth, isClosedMonth } = useData();
  const { isManager } = useAuth();

  const [selectedSale, setSelectedSale] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedSale || isManager) return;
    setDeleting(true);
    try {
      await deleteSale(selectedSale.id);
      setIsDeleteOpen(false);
      setSelectedSale(null);
    } catch (err) {
      console.error(err);
      showNotification && showNotification(err.message || "Failed to delete sale.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL, cash, loan

  // Stage 1: Month-only filter — used for KPI summary cards
  const monthFilteredSales = sales.filter(sale => {
    if (!selectedMonth || selectedMonth === 'CURRENT') return true;
    if (!sale.date) return false;
    const d = new Date(sale.date.toDate ? sale.date.toDate() : sale.date);
    const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return itemMonth === selectedMonth;
  });

  // Stage 2: Full filter (month + search + status) — used for the data table
  const filteredSales = monthFilteredSales.filter(sale => {
    const matchesSearch =
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.createdBy && sale.createdBy.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = paymentFilter === 'ALL' || sale.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI metrics — scoped to the selected month's dataset
  const totalCashSales = monthFilteredSales.filter(s => s.paymentStatus === 'cash').reduce((acc, s) => acc + s.totalPrice, 0);
  const totalLoanSales = monthFilteredSales.filter(s => s.paymentStatus === 'loan').reduce((acc, s) => acc + s.totalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sales Records & History</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Real-time ledger of completed Cash and Credit/Loan (Dayn) transactions.
          </p>
        </div>
        {!isClosedMonth && !isManager && (
          <button
            onClick={onOpenNewSale}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Record New Sale (POS)</span>
          </button>
        )}
      </div>

      {/* Stats Quick Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Total Transactions Logged</span>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{monthFilteredSales.length} Sales</h4>
          </div>
          <ShoppingCart className="w-6 h-6 text-slate-500 dark:text-slate-400" />
        </div>

        <div className="p-4 rounded-xl glass-panel border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Total Cash Sales</span>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalCashSales)}</h4>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-4 rounded-xl glass-panel border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-bold">Total Dayn (Loan) Sales</span>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalLoanSales)}</h4>
          </div>
          <UserCheck className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product, customer, or partner..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status:</span>
          {['ALL', 'cash', 'loan'].map((status) => (
            <button
              key={status}
              onClick={() => setPaymentFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                paymentFilter === status
                  ? status === 'loan' 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {status === 'ALL' ? 'ALL STATUS' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-400 tracking-wider">
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Qty</th>
                <th className="py-4 px-6">Cost Price</th>
                <th className="py-4 px-6">Unit Selling Price</th>
                <th className="py-4 px-6">Total Amount</th>
                <th className="py-4 px-6">Gross Profit</th>
                <th className="py-4 px-6">Payment Status</th>
                <th className="py-4 px-6">Customer / Notes</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500 font-medium">
                    No sales matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isLoan = sale.paymentStatus === 'loan';
                  const profit = sale.profit || 0;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        {formatDate(sale.date)}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {sale.productName}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                        {sale.quantitySold}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400 text-xs">
                        {formatCurrency(sale.costPriceAtSale || 0)}
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(sale.unitSellingPrice)}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(sale.totalPrice)}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-emerald-700 dark:text-emerald-400">
                        +{formatCurrency(profit)}
                      </td>
                      <td className="py-4 px-6">
                        {isLoan ? (
                          <Badge variant="loan">LOAN (DAYN)</Badge>
                        ) : (
                          <Badge variant="cash">CASH</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-300">
                        {isLoan && (
                          <span className="font-bold text-rose-600 dark:text-rose-400 block">
                            {sale.customerName}
                          </span>
                        )}
                        {sale.notes && <span className="text-slate-600 dark:text-slate-400 italic">{sale.notes}</span>}
                        {!isLoan && !sale.notes && <span className="text-slate-400 dark:text-slate-500">-</span>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedSale(sale); setIsViewOpen(true); }}
                            title="View Detail"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isClosedMonth && !isManager && (
                            <>
                              <button
                                onClick={() => { setSelectedSale(sale); setIsEditOpen(true); }}
                                title="Edit Sale"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedSale(sale); setIsDeleteOpen(true); }}
                                title="Delete Sale"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Sale Details Modal */}
      <SaleDetailsModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setSelectedSale(null); }}
        sale={selectedSale}
      />

      {/* Edit Sale Modal */}
      <EditSaleModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedSale(null); }}
        sale={selectedSale}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedSale(null); }}
        title="Confirm Deletion"
        maxWidth="max-w-md"
      >
        {selectedSale && (
          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200 text-xs font-semibold">
            <div className="flex items-start gap-3.5 pb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Are you absolutely sure?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  You are about to delete the sale of <span className="font-bold text-rose-500">{selectedSale.quantitySold} x {selectedSale.productName}</span> for <span className="font-bold text-rose-500">{formatCurrency(selectedSale.totalPrice)}</span>.
                  <span className="block mt-1.5 font-bold text-slate-700 dark:text-slate-350">
                    ⚠️ Note: Deleting this transaction will restock the inventory (+{selectedSale.quantitySold} units) and revert the customer's outstanding debt balance if it was a Loan (Dayn).
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setIsDeleteOpen(false); setSelectedSale(null); }}
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
