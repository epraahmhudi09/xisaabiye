import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { sales, deleteSale, showNotification, selectedMonth, isClosedMonth, closedMonthPeriods } = useData();
  const { isManager } = useAuth();
  const { t } = useLanguage();

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

  // Helper: derive YYYY-MM period string from a sale's date field
  const getSaleMonth = (sale) => {
    if (!sale.date) return null;
    const d = new Date(sale.date.toDate ? sale.date.toDate() : sale.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL, cash, loan

  // Stage 1: Month-only filter — used for KPI summary cards
  const monthFilteredSales = sales.filter(sale => {
    const saleMonth = getSaleMonth(sale);
    if (!selectedMonth || selectedMonth === 'CURRENT') {
      // Current Active Month: exclude sales that belong to any closed period
      if (!saleMonth) return true;
      return !closedMonthPeriods.has(saleMonth);
    }
    // Historical closed month: show only sales matching that period
    return saleMonth === selectedMonth;
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
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('sales.title')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('sales.subtitle')}
          </p>
        </div>
        {!isClosedMonth && !isManager && (
          <button
            onClick={onOpenNewSale}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t('sales.recordNewSale')}</span>
          </button>
        )}
      </div>

      {/* Stats Quick Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{t('sales.totalTransactions')}</span>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{monthFilteredSales.length} {t('sales.salesCount')}</h4>
          </div>
          <ShoppingCart className="w-6 h-6 text-slate-500 dark:text-slate-400" />
        </div>

        <div className="p-4 rounded-xl glass-panel border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{t('sales.totalCashSales')}</span>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalCashSales)}</h4>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-4 rounded-xl glass-panel border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-bold">{t('sales.totalDaynSales')}</span>
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
            placeholder={t('sales.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('sales.statusLabel')}</span>
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
              {status === 'ALL' ? t('sales.allStatus') : t(`common.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Sales List — Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-medium glass-panel rounded-2xl border border-slate-200 dark:border-slate-800">
            {t('sales.noSales')}
          </div>
        ) : (
          filteredSales.map((sale) => {
            const isLoan = sale.paymentStatus === 'loan';
            const profit = sale.profit || 0;
            return (
              <div key={sale.id} className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{sale.productName}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{formatDate(sale.date)}</p>
                  </div>
                  {isLoan ? <Badge variant="loan">{t('common.loan')}</Badge> : <Badge variant="cash">{t('common.cash')}</Badge>}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('sales.qty')}</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{sale.quantitySold}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('sales.total')}</span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{formatCurrency(sale.totalPrice)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('sales.profit')}</span>
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">+{formatCurrency(profit)}</p>
                  </div>
                </div>

                {(isLoan || sale.notes) && (
                  <div className="mt-3 text-xs">
                    {isLoan && <span className="font-bold text-rose-600 dark:text-rose-400 block">{sale.customerName}</span>}
                    {sale.notes && <span className="text-slate-500 dark:text-slate-400 italic">{sale.notes}</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => { setSelectedSale(sale); setIsViewOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold active:scale-95 transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5" /> {t('common.view')}
                  </button>
                  {!isClosedMonth && !isManager && (
                    <>
                      <button
                        onClick={() => { setSelectedSale(sale); setIsEditOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800 text-xs font-bold active:scale-95 transition-transform"
                      >
                        <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
                      </button>
                      <button
                        onClick={() => { setSelectedSale(sale); setIsDeleteOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-800 text-xs font-bold active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sales Table — Desktop */}
      <div className="hidden sm:block glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-400 tracking-wider">
                <th className="py-4 px-6">{t('sales.dateTime')}</th>
                <th className="py-4 px-6">{t('sales.product')}</th>
                <th className="py-4 px-6">{t('sales.qty')}</th>
                <th className="py-4 px-6">{t('sales.costPrice')}</th>
                <th className="py-4 px-6">{t('sales.unitSellingPrice')}</th>
                <th className="py-4 px-6">{t('sales.totalAmount')}</th>
                <th className="py-4 px-6">{t('sales.grossProfit')}</th>
                <th className="py-4 px-6">{t('sales.paymentStatus')}</th>
                <th className="py-4 px-6">{t('sales.customerNotes')}</th>
                <th className="py-4 px-6 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500 font-medium">
                    {t('sales.noSales')}
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
                          <Badge variant="loan">{t('common.loan')} (DAYN)</Badge>
                        ) : (
                          <Badge variant="cash">{t('common.cash')}</Badge>
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
                            title={t('common.view')}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isClosedMonth && !isManager && (
                            <>
                              <button
                                onClick={() => { setSelectedSale(sale); setIsEditOpen(true); }}
                                title={t('common.edit')}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedSale(sale); setIsDeleteOpen(true); }}
                                title={t('common.delete')}
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
        title={t('sales.confirmDeletion')}
        maxWidth="max-w-md"
      >
        {selectedSale && (
          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200 text-xs font-semibold">
            <div className="flex items-start gap-3.5 pb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{t('sales.areYouSure')}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  {t('sales.deleteWarningPrefix')} <span className="font-bold text-rose-500">{selectedSale.quantitySold} x {selectedSale.productName}</span> {t('sales.deleteWarningFor')} <span className="font-bold text-rose-500">{formatCurrency(selectedSale.totalPrice)}</span>.
                  <span className="block mt-1.5 font-bold text-slate-700 dark:text-slate-350">
                    ⚠️ {t('sales.deleteWarningNote').replace('{qty}', selectedSale.quantitySold)}
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
                {t('common.cancel')}
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
                    <span>{t('sales.reverting')}</span>
                  </>
                ) : (
                  <span>{t('sales.deleteTransaction')}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
