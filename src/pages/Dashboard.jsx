import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { StatCard } from '../components/common/StatCard';
import { SalesProfitChart } from '../components/dashboard/SalesProfitChart';
import { RecentSalesStream } from '../components/dashboard/RecentSalesStream';
import { formatCurrency } from '../utils/formatters';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Wallet, 
  PackageCheck,
  ShoppingCart,
  Lock,
  Archive,
  BarChart2
} from 'lucide-react';

// Helper to format YYYY-MM into "July 2026"
const formatMonthLabel = (yearMonthStr) => {
  if (!yearMonthStr || yearMonthStr === 'CURRENT') return 'Current Month';
  const [year, month] = yearMonthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// ─── Historical Archive Banner ──────────────────────────────────────────────
const HistoricalBanner = ({ selectedMonth }) => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-amber-400/40 bg-amber-500/10 dark:bg-amber-950/30 shadow-sm">
      <div className="p-2 rounded-xl bg-amber-500/20 dark:bg-amber-500/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex-shrink-0">
        <Lock className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300 leading-tight">
          {t('dashboard.historicalBannerTitle')}: {formatMonthLabel(selectedMonth)} {t('dashboard.historicalBannerClosed')}
        </p>
        <p className="text-xs text-amber-600/70 dark:text-amber-400/60 font-medium mt-0.5">
          {t('dashboard.historicalBannerNote')}
        </p>
      </div>
      <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-400/30 px-2.5 py-1 rounded-lg uppercase tracking-wider flex-shrink-0">
        <Archive className="w-3 h-3" />
        {t('dashboard.archive')}
      </span>
    </div>
  );
};

// ─── Historical Snapshot Summary (replaces chart) ───────────────────────────
const HistoricalChartPanel = ({ snapshot, selectedMonth }) => {
  const { t } = useLanguage();
  if (!snapshot) return null;
  const rows = [
    { label: t('dashboard.totalSalesRevenue'), value: formatCurrency(snapshot.totalSales || 0),           color: 'text-emerald-500' },
    { label: t('dashboard.grossProfit'),       value: formatCurrency(snapshot.grossProfit || 0),           color: 'text-blue-500' },
    { label: t('dashboard.operationalExpenses'), value: `-${formatCurrency(snapshot.totalExpenses || 0)}`, color: 'text-rose-400' },
    { label: t('dashboard.netProfitLoss'),     value: formatCurrency(snapshot.netProfit || 0),             color: (snapshot.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400', bold: true },
    { label: t('dashboard.cashCollected'),     value: formatCurrency(snapshot.totalCashReceived || 0),     color: 'text-amber-400' },
    { label: t('dashboard.daynLoanSales'),     value: formatCurrency(snapshot.totalLoanSales || 0),        color: 'text-rose-400' },
    { label: t('dashboard.carryoverDebt'),     value: formatCurrency(snapshot.carryoverCustomerDebt || 0), color: 'text-orange-400' },
  ];

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-500">
          <BarChart2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t('dashboard.periodFinancialSummary')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('dashboard.frozenSnapshot')} · {formatMonthLabel(selectedMonth)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
              row.bold
                ? 'bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800'
            }`}
          >
            <span className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${row.bold ? 'font-extrabold text-slate-800 dark:text-slate-200' : ''}`}>
              {row.label}
            </span>
            <span className={`text-sm font-extrabold ${row.color} ${row.bold ? 'text-base' : ''}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {snapshot.closedBy && (
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-3 text-right font-medium">
          {t('dashboard.closedBy')} <span className="font-bold text-slate-500 dark:text-slate-500">{snapshot.closedBy}</span>
        </p>
      )}
    </div>
  );
};

// ─── Historical Feed Placeholder (replaces RecentSalesStream) ───────────────
const HistoricalFeedPlaceholder = ({ snapshot, selectedMonth }) => {
  const { t } = useLanguage();
  return (
  <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/60 shadow-sm h-full flex flex-col">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-500">
        <Archive className="w-4 h-4" />
      </div>
      <div>
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{t('dashboard.transactionArchive')}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('dashboard.closedReadOnly')}</p>
      </div>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-400/20 text-amber-500 dark:text-amber-400">
        <Lock className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
          {formatMonthLabel(selectedMonth)} {t('dashboard.historicalBannerClosed')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-[200px] mx-auto leading-relaxed">
          {t('dashboard.liveFeedNotAvailable')}
        </p>
      </div>
      {snapshot && (
        <div className="grid grid-cols-2 gap-2 w-full mt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-semibold">{t('dashboard.salesCount')}</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">
              {snapshot.totalSalesCount != null ? snapshot.totalSalesCount : t('common.na')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-semibold">{t('dashboard.debtors')}</p>
            <p className="text-lg font-extrabold text-rose-500 mt-0.5">
              {snapshot.debtorCount != null ? snapshot.debtorCount : t('common.na')}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const Dashboard = ({ setActiveTab, onOpenNewSale }) => {
  const { 
    sales, products, customers, 
    selectedMonth, isClosedMonth,
    closedMonthPeriods,
    historicalSnapshot, historicalSnapshotLoading 
  } = useData();
  const { isManager } = useAuth();
  const { t } = useLanguage();

  // ── Live metrics (used when selectedMonth === 'CURRENT') ─────────────────
  // Excludes sales belonging to any already-closed month period so the
  // active month resets to $0.00 immediately after a Xisaab Xir closeout.
  const activeSales = sales.filter(s => {
    if (!s.date) return false;
    const d = new Date(s.date.toDate ? s.date.toDate() : s.date);
    const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!selectedMonth || selectedMonth === 'CURRENT') {
      // Only include sales that do NOT belong to a closed period
      return !closedMonthPeriods.has(itemMonth);
    }
    // Historical view: exact period match
    return itemMonth === selectedMonth;
  });

  const totalRevenue       = activeSales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const totalProfit        = activeSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalOutstandingLoans = customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  const totalCashReceived  = activeSales
    .filter(s => s.paymentStatus === 'cash')
    .reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + ((p.costPrice || 0) * (p.stockQuantity || 0)), 
    0
  );

  // ── Snapshot-derived metrics ─────────────────────────────────────────────
  const snap = historicalSnapshot;
  const snapRevenue        = snap?.totalSales ?? 0;
  const snapProfit         = snap?.netProfit ?? 0;
  const snapLoans          = snap?.carryoverCustomerDebt ?? 0;
  const snapDebtorCount    = snap?.debtorCount ?? null;
  const snapCash           = snap?.totalCashReceived ?? (snapRevenue - snapLoans);
  const snapInventory      = snap?.inventoryValue ?? 0;
  const snapInventoryUnits = snap?.totalInventoryUnits ?? null;
  const snapSalesCount     = snap?.totalSalesCount ?? null;

  // ── Resolved display values ──────────────────────────────────────────────
  const displayRevenue   = isClosedMonth ? snapRevenue   : totalRevenue;
  const displayProfit    = isClosedMonth ? snapProfit    : totalProfit;
  const displayLoans     = isClosedMonth ? snapLoans     : totalOutstandingLoans;
  const displayCash      = isClosedMonth ? snapCash      : totalCashReceived;
  const displayInventory = isClosedMonth ? snapInventory : totalInventoryValue;

  const revenueSubtitle = isClosedMonth
    ? (snapSalesCount !== null ? `${snapSalesCount} ${t('dashboard.salesRecorded')}` : t('dashboard.snapshotTotal'))
    : `${activeSales.length} ${t('dashboard.salesRecorded')}`;
  const loansSubtitle = isClosedMonth
    ? (snapDebtorCount !== null ? `${snapDebtorCount} ${t('dashboard.customersOwing')}` : t('dashboard.atPeriodClose'))
    : `${customers.filter(c => c.totalDebt > 0).length} ${t('dashboard.customersOwing')}`;
  const inventorySubtitle = isClosedMonth
    ? (snapInventoryUnits !== null ? `${snapInventoryUnits} ${t('dashboard.totalUnitsClose')}` : t('dashboard.snapshotValue'))
    : `${products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0)} ${t('dashboard.totalUnits')}`;

  return (
    <div className="space-y-5">
      {/* Historical Read-Only Banner */}
      {isClosedMonth && (
        <HistoricalBanner selectedMonth={selectedMonth} />
      )}

      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('dashboard.title')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {isClosedMonth
              ? `${t('dashboard.historicalSubtitle')} — ${formatMonthLabel(selectedMonth)} ${t('dashboard.historicalBannerClosed')}`
              : t('dashboard.subtitle')}
          </p>
        </div>
        {/* POS button is fully hidden when viewing any closed month */}
        {!isClosedMonth && !isManager && (
          <button
            onClick={onOpenNewSale}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t('dashboard.recordSale')}</span>
          </button>
        )}
      </div>

      {/* Snapshot loading shimmer */}
      {isClosedMonth && historicalSnapshotLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 animate-pulse h-28" />
          ))}
        </div>
      )}

      {/* KPI Cards Grid */}
      {(!isClosedMonth || !historicalSnapshotLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title={t('dashboard.totalRevenue')}
            value={formatCurrency(displayRevenue)}
            subtitle={revenueSubtitle}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title={t('dashboard.totalNetProfit')}
            value={formatCurrency(displayProfit)}
            subtitle={isClosedMonth ? t('dashboard.netMarginClose') : t('dashboard.marginCalculated')}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title={t('dashboard.outstandingLoans')}
            value={formatCurrency(displayLoans)}
            subtitle={loansSubtitle}
            icon={AlertTriangle}
            color="rose"
            alert={displayLoans > 0}
          />
          <StatCard
            title={t('dashboard.totalCashRecd')}
            value={formatCurrency(displayCash)}
            subtitle={isClosedMonth ? t('dashboard.cashSettledClose') : t('dashboard.fullySettled')}
            icon={Wallet}
            color="amber"
          />
          <StatCard
            title={t('dashboard.inventoryValue')}
            value={formatCurrency(displayInventory)}
            subtitle={inventorySubtitle}
            icon={PackageCheck}
            color="purple"
          />
        </div>
      )}

      {/* Chart and stream grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          {isClosedMonth ? (
            <HistoricalChartPanel snapshot={snap} selectedMonth={selectedMonth} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{t('dashboard.salesProfitOverview')}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('dashboard.revenueVsProfit')}</p>
                </div>
              </div>
              <SalesProfitChart sales={activeSales} />
            </>
          )}
        </div>

        <div>
          {isClosedMonth ? (
            <HistoricalFeedPlaceholder snapshot={snap} selectedMonth={selectedMonth} />
          ) : (
            <RecentSalesStream sales={activeSales} onSelectTab={setActiveTab} />
          )}
        </div>
      </div>
    </div>
  );
};
