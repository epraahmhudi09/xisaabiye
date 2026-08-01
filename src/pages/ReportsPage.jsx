import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { Badge } from '../components/common/Badge';
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Filter
} from 'lucide-react';

export const ReportsPage = () => {
  const { sales, customers, selectedMonth } = useData();
  const { t } = useLanguage();

  const [dateRangeFilter, setDateRangeFilter] = useState('ALL'); // TODAY, THIS_WEEK, THIS_MONTH, ALL
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Date Filtering Logic
  const filteredSales = sales.filter(sale => {
    if (selectedMonth && selectedMonth !== 'CURRENT') {
      if (!sale.date) return false;
      const d = new Date(sale.date.toDate ? sale.date.toDate() : sale.date);
      const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (itemMonth !== selectedMonth) return false;
    }

    if (!sale.date) return true;
    
    let saleDate;
    if (sale.date.toDate && typeof sale.date.toDate === 'function') {
      saleDate = sale.date.toDate();
    } else if (sale.date.seconds) {
      saleDate = new Date(sale.date.seconds * 1000);
    } else {
      saleDate = new Date(sale.date);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRangeFilter === 'TODAY') {
      return saleDate >= startOfToday;
    }

    if (dateRangeFilter === 'THIS_WEEK') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= sevenDaysAgo;
    }

    if (dateRangeFilter === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return saleDate >= startOfMonth;
    }

    if (dateRangeFilter === 'CUSTOM' && startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      return saleDate >= s && saleDate <= e;
    }

    return true; // ALL
  });

  // Calculate Summary Totals for filtered report
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const totalGrossProfit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalCashRecd = filteredSales.filter(s => s.paymentStatus === 'cash').reduce((acc, s) => acc + s.totalPrice, 0);
  const totalLoansInPeriod = filteredSales.filter(s => s.paymentStatus === 'loan').reduce((acc, s) => acc + s.totalPrice, 0);
  const totalCostOfGoods = filteredSales.reduce((acc, s) => acc + ((s.costPriceAtSale || 0) * (s.quantitySold || 0)), 0);

  const handleExportExcel = () => {
    exportToExcel(filteredSales, `Xisaabiye_Sales_Report_${dateRangeFilter}`);
  };

  const handleExportPDF = () => {
    const summary = {
      totalRevenue,
      totalProfit: totalGrossProfit,
      totalLoans: totalLoansInPeriod,
      totalCash: totalCashRecd
    };
    exportToPDF(filteredSales, `Xisaabiye Profit & Loss Report (${dateRangeFilter})`, summary);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('reports.title')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('reports.exportExcel')}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>{t('reports.exportPdf')}</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{t('reports.dateRangeFilter')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: t('reports.allTime') },
              { id: 'TODAY', label: t('reports.today') },
              { id: 'THIS_WEEK', label: t('reports.thisWeek') },
              { id: 'THIS_MONTH', label: t('reports.thisMonth') },
              { id: 'CUSTOM', label: t('reports.customRange') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateRangeFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateRangeFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {dateRangeFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('reports.startDate')}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-input text-xs font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('reports.endDate')}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-input text-xs font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block">{t('reports.filteredRevenue')}</span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">{t('reports.costOfGoods')}: ${totalCostOfGoods.toFixed(2)}</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider block">{t('reports.netGrossProfit')}</span>
          <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(totalGrossProfit)}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{t('reports.margin')}: {totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <span className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider block">{t('reports.cashSettled')}</span>
          <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalCashRecd)}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{t('reports.cashLiquidity')}</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-rose-200 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20">
          <span className="text-xs text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider block">{t('reports.daynCreditIssued')}</span>
          <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalLoansInPeriod)}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{t('reports.daynCreditIssuedSub')}</p>
        </div>
      </div>

      {/* Detailed Sales Report — Mobile Cards */}
      <div className="sm:hidden glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{t('reports.salesLedger')}</h3>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">{filteredSales.length} {t('reports.items')}</span>
        </div>
        <div className="p-4 space-y-3">
          {filteredSales.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-medium">
              {t('reports.noSales')}
            </div>
          ) : (
            filteredSales.map((sale) => {
              const isLoan = sale.paymentStatus === 'loan';
              const profit = sale.profit || 0;
              return (
                <div key={sale.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">{sale.productName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{formatDate(sale.date)}</p>
                    </div>
                    {isLoan ? <Badge variant="loan">DAYN</Badge> : <Badge variant="cash">{t('common.cash')}</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
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
                  {isLoan && (
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80">
                      {t('reports.debtor')}: {sale.customerName}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detailed Sales Report Table — Desktop */}
      <div className="hidden sm:block glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{t('reports.salesLedger')}</h3>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{filteredSales.length} {t('reports.itemsListed')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-400 tracking-wider">
                <th className="py-4 px-6">{t('common.date')}</th>
                <th className="py-4 px-6">{t('inventory.productItem')}</th>
                <th className="py-4 px-6">{t('sales.qty')}</th>
                <th className="py-4 px-6">{t('sales.costPrice')}</th>
                <th className="py-4 px-6">{t('sales.unitSellingPrice')}</th>
                <th className="py-4 px-6">{t('sales.total')} ($)</th>
                <th className="py-4 px-6">{t('sales.grossProfit')} ($)</th>
                <th className="py-4 px-6">{t('sales.paymentStatus')}</th>
                <th className="py-4 px-6">{t('sales.customerNotes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm font-semibold">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500 font-medium">
                    {t('reports.noSales')}
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
                          <Badge variant="loan">DAYN</Badge>
                        ) : (
                          <Badge variant="cash">{t('common.cash')}</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold">
                        {isLoan ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{sale.customerName}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
