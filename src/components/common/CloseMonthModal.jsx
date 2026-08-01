import React, { useState } from 'react';
import { Modal } from './Modal';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../utils/formatters';
import { Lock, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Wallet, ShieldCheck } from 'lucide-react';

export const CloseMonthModal = ({ isOpen, onClose }) => {
  const { sales, customers, products, closeMonth, showNotification } = useData();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);

  // Compute current period YYYY-MM
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Filter current active month sales
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentSales = sales.filter(s => {
    if (!s.date) return false;
    const d = new Date(s.date.toDate ? s.date.toDate() : s.date);
    return d >= startOfMonth;
  });

  const totalSalesRevenue = currentSales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const totalGrossProfit = currentSales.reduce((acc, s) => acc + (s.profit || 0), 0);

  // Enriched snapshot fields
  const totalSalesCount = currentSales.length;
  const totalCashReceived = currentSales
    .filter(s => s.paymentStatus === 'cash')
    .reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const totalLoanSales = currentSales
    .filter(s => s.paymentStatus === 'loan')
    .reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const inventoryValue = products.reduce(
    (acc, p) => acc + ((p.costPrice || 0) * (p.stockQuantity || 0)),
    0
  );
  const totalInventoryUnits = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
  const debtorCount = customers.filter(c => (c.totalDebt || 0) > 0).length;
  
  // Outstanding debts carryover
  const carryoverCustomerDebt = customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  
  // Note: Operational expenses for current month
  // Since expenses are loaded in ExpensesPage or fetched, we compute if expenses array passed or from local storage:
  const localExp = JSON.parse(localStorage.getItem('xisaabiye_local_expenses') || '[]');
  const totalOperationalExpenses = localExp
    .filter(e => e.type === 'operational' && new Date(e.date) >= startOfMonth)
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  const netProfit = totalGrossProfit - totalOperationalExpenses;

  const handleConfirmCloseout = async () => {
    setSubmitting(true);
    try {
      await closeMonth(currentMonthYear, {
        totalSales: totalSalesRevenue,
        grossProfit: totalGrossProfit,
        totalExpenses: totalOperationalExpenses,
        netProfit: netProfit,
        carryoverCustomerDebt: carryoverCustomerDebt,
        carryoverSupplierDebt: 0,
        // Enriched fields
        totalSalesCount,
        totalCashReceived,
        totalLoanSales,
        inventoryValue,
        totalInventoryUnits,
        debtorCount
      });
      onClose();
    } catch (err) {
      console.error(err);
      showNotification && showNotification(err.message || "Failed to close month.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('closeMonth.title')} maxWidth="max-w-md">
      <div className="space-y-4 text-xs font-semibold text-slate-800 dark:text-slate-200">

        {/* Header Accent */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Xisaab Xir ({currentMonthLabel})</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t('closeMonth.subtitle')}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850">
            <span className="text-slate-500">{t('closeMonth.targetPeriod')}</span>
            <span className="font-bold text-slate-900 dark:text-white">{currentMonthLabel} ({currentMonthYear})</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850">
            <span className="text-slate-500">{t('closeMonth.totalSalesRevenue')}</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalSalesRevenue)}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850">
            <span className="text-slate-500">{t('closeMonth.grossProfit')}</span>
            <span className="font-bold text-blue-500">{formatCurrency(totalGrossProfit)}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-850">
            <span className="text-slate-500">{t('closeMonth.operationalExpenses')}</span>
            <span className="font-bold text-rose-400">-{formatCurrency(totalOperationalExpenses)}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 font-extrabold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
            <span>{t('closeMonth.netProfitLoss')}</span>
            <span className={netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
              {formatCurrency(netProfit)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 text-[10px] text-slate-400 pt-2">
            <span>{t('closeMonth.daynCarryover')}</span>
            <span className="font-bold text-amber-400">{formatCurrency(carryoverCustomerDebt)}</span>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>{t('closeMonth.attention')}</strong> {t('closeMonth.warningNote')}
          </span>
        </div>

        {/* Submit Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors"
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            onClick={handleConfirmCloseout}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-950/60 transition-all transform hover:scale-105"
          >
            <Lock className="w-4 h-4" />
            <span>{submitting ? t('closeMonth.closing') : t('closeMonth.confirm')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
