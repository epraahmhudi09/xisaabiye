import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
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
const HistoricalBanner = ({ selectedMonth }) => (
  <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-amber-400/40 bg-amber-500/10 dark:bg-amber-950/30 shadow-sm">
    <div className="p-2 rounded-xl bg-amber-500/20 dark:bg-amber-500/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex-shrink-0">
      <Lock className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300 leading-tight">
        Viewing Historical Archived Period: {formatMonthLabel(selectedMonth)} (CLOSED) — Read Only
      </p>
      <p className="text-xs text-amber-600/70 dark:text-amber-400/60 font-medium mt-0.5">
        All metrics are frozen from the closing snapshot. No edits can be made to this period.
      </p>
    </div>
    <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-400/30 px-2.5 py-1 rounded-lg uppercase tracking-wider flex-shrink-0">
      <Archive className="w-3 h-3" />
      Archive
    </span>
  </div>
);

// ─── Historical Snapshot Summary (replaces chart) ───────────────────────────
const HistoricalChartPanel = ({ snapshot, selectedMonth }) => {
  if (!snapshot) return null;
  const rows = [
    { label: 'Total Sales Revenue',     value: formatCurrency(snapshot.totalSales || 0),           color: 'text-emerald-500' },
    { label: 'Gross Profit',            value: formatCurrency(snapshot.grossProfit || 0),           color: 'text-blue-500' },
    { label: 'Operational Expenses',    value: `-${formatCurrency(snapshot.totalExpenses || 0)}`,   color: 'text-rose-400' },
    { label: 'Net Profit / Loss',       value: formatCurrency(snapshot.netProfit || 0),             color: (snapshot.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400', bold: true },
    { label: 'Cash Collected',          value: formatCurrency(snapshot.totalCashReceived || 0),     color: 'text-amber-400' },
    { label: 'Dayn / Loan Sales',       value: formatCurrency(snapshot.totalLoanSales || 0),        color: 'text-rose-400' },
    { label: 'Carryover Customer Debt', value: formatCurrency(snapshot.carryoverCustomerDebt || 0), color: 'text-orange-400' },
  ];

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-500">
          <BarChart2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            Period Financial Summary
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Frozen snapshot · {formatMonthLabel(selectedMonth)}
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
          Closed by <span className="font-bold text-slate-500 dark:text-slate-500">{snapshot.closedBy}</span>
        </p>
      )}
    </div>
  );
};

// ─── Historical Feed Placeholder (replaces RecentSalesStream) ───────────────
const HistoricalFeedPlaceholder = ({ snapshot, selectedMonth }) => (
  <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/60 shadow-sm h-full flex flex-col">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-500">
        <Archive className="w-4 h-4" />
      </div>
      <div>
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Transaction Archive</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Closed period — read only</p>
      </div>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-400/20 text-amber-500 dark:text-amber-400">
        <Lock className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
          {formatMonthLabel(selectedMonth)} (CLOSED)
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-[200px] mx-auto leading-relaxed">
          Live transaction feed is not available for archived periods.
        </p>
      </div>
      {snapshot && (
        <div className="grid grid-cols-2 gap-2 w-full mt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-semibold">Sales Count</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">
              {snapshot.totalSalesCount != null ? snapshot.totalSalesCount : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-semibold">Debtors</p>
            <p className="text-lg font-extrabold text-rose-500 mt-0.5">
              {snapshot.debtorCount != null ? snapshot.debtorCount : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const Dashboard = ({ setActiveTab, onOpenNewSale }) => {
  const { 
    sales, products, customers, 
    selectedMonth, isClosedMonth,
    closedMonthPeriods,
    historicalSnapshot, historicalSnapshotLoading 
  } = useData();
  const { isManager } = useAuth();

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
    ? (snapSalesCount !== null ? `${snapSalesCount} sales recorded` : 'Snapshot total')
    : `${activeSales.length} sales recorded`;
  const loansSubtitle = isClosedMonth
    ? (snapDebtorCount !== null ? `${snapDebtorCount} customers owing debt` : 'At period close')
    : `${customers.filter(c => c.totalDebt > 0).length} customers owing debt`;
  const inventorySubtitle = isClosedMonth
    ? (snapInventoryUnits !== null ? `${snapInventoryUnits} total units at close` : 'Snapshot value')
    : `${products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0)} total units`;

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
            Business Overview &amp; Real-Time Metrics
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {isClosedMonth
              ? `Historical Ledger View — ${formatMonthLabel(selectedMonth)} (CLOSED)`
              : 'Real-time synchronization active for business partners.'}
          </p>
        </div>
        {/* POS button is fully hidden when viewing any closed month */}
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
            title="Total Revenue"
            value={formatCurrency(displayRevenue)}
            subtitle={revenueSubtitle}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Total Net Profit"
            value={formatCurrency(displayProfit)}
            subtitle={isClosedMonth ? 'Net margin at close' : 'Margin calculated per sale'}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Outstanding Loans (Dayn)"
            value={formatCurrency(displayLoans)}
            subtitle={loansSubtitle}
            icon={AlertTriangle}
            color="rose"
            alert={displayLoans > 0}
          />
          <StatCard
            title="Total Cash Recd"
            value={formatCurrency(displayCash)}
            subtitle={isClosedMonth ? 'Cash settled at close' : 'Fully settled cash'}
            icon={Wallet}
            color="amber"
          />
          <StatCard
            title="Inventory Value"
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
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Sales &amp; Profitability Overview</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Revenue vs Profit over recent activity</p>
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
