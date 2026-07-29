import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

export const RecentSalesStream = ({ sales = [], onSelectTab }) => {
  const recentSales = sales.slice(0, 10);

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Recent Real-time Sales Feed</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Instant stream of logged transactions</p>
        </div>
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('sales')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
          >
            <span>View All Sales</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {recentSales.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          No sales recorded yet. Click "+ Record Sale" to start.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {recentSales.map((sale) => {
            const isLoan = sale.paymentStatus === 'loan';
            return (
              <div key={sale.id} className="py-3 flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isLoan 
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400' 
                      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'
                  }`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                      {sale.productName}
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">x{sale.quantitySold}</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {formatDate(sale.date)} • Logged by <span className="text-slate-700 dark:text-slate-300 font-bold">{sale.createdBy || 'Partner'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                    {formatCurrency(sale.totalPrice)}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    {isLoan ? (
                      <Badge variant="loan">
                        DAYN: ${sale.totalPrice?.toFixed(2)} ({sale.customerName || 'Customer'})
                      </Badge>
                    ) : (
                      <Badge variant="cash">CASH</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
