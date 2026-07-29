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
  ShoppingCart
} from 'lucide-react';

export const Dashboard = ({ setActiveTab, onOpenNewSale }) => {
  const { sales, products, customers, selectedMonth, isClosedMonth } = useData();
  const { isManager } = useAuth();

  // Filter sales based on selected month
  const activeSales = sales.filter(s => {
    if (!selectedMonth || selectedMonth === 'CURRENT') return true;
    if (!s.date) return false;
    const d = new Date(s.date.toDate ? s.date.toDate() : s.date);
    const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return itemMonth === selectedMonth;
  });

  // Metrics Calculations
  const totalRevenue = activeSales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const totalProfit = activeSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  
  const totalOutstandingLoans = customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  
  const totalCashReceived = activeSales
    .filter(s => s.paymentStatus === 'cash')
    .reduce((acc, s) => acc + (s.totalPrice || 0), 0);

  const totalInventoryValue = products.reduce(
    (acc, p) => acc + ((p.costPrice || 0) * (p.stockQuantity || 0)), 
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Business Overview & Real-Time Metrics</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {isClosedMonth ? `Historical Ledger View (${selectedMonth} - CLOSED)` : 'Real-time synchronization active for business partners.'}
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle={`${sales.length} sales recorded`}
          icon={DollarSign}
          color="emerald"
        />

        <StatCard
          title="Total Net Profit"
          value={formatCurrency(totalProfit)}
          subtitle="Margin calculated per sale"
          icon={TrendingUp}
          color="blue"
        />

        {/* Highlighted in RED with alert status */}
        <StatCard
          title="Outstanding Loans (Dayn)"
          value={formatCurrency(totalOutstandingLoans)}
          subtitle={`${customers.filter(c => c.totalDebt > 0).length} customers owing debt`}
          icon={AlertTriangle}
          color="rose"
          alert={totalOutstandingLoans > 0}
        />

        <StatCard
          title="Total Cash Recd"
          value={formatCurrency(totalCashReceived)}
          subtitle="Fully settled cash"
          icon={Wallet}
          color="amber"
        />

        <StatCard
          title="Inventory Value"
          value={formatCurrency(totalInventoryValue)}
          subtitle={`${products.reduce((acc, p) => acc + p.stockQuantity, 0)} total units`}
          icon={PackageCheck}
          color="purple"
        />
      </div>

      {/* Chart and Real-time stream grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Sales & Profitability Overview</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Revenue vs Profit over recent activity</p>
            </div>
          </div>
          <SalesProfitChart sales={sales} />
        </div>

        <div>
          <RecentSalesStream sales={sales} onSelectTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
};
