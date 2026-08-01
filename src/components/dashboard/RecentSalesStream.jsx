import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

export const RecentSalesStream = ({ sales = [], onSelectTab }) => {
  const recentSales = sales.slice(0, 10);
  const { t } = useLanguage();

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{t('dashboard.recentSalesFeed')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('dashboard.instantStream')}</p>
        </div>
        {onSelectTab && (
          <button
            onClick={() => onSelectTab('sales')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
          >
            <span>{t('dashboard.viewAllSales')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {recentSales.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          {t('dashboard.noSalesFeed')}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {recentSales.map((sale) => {
            const isLoan = sale.paymentStatus === 'loan';
            return (
              <div key={sale.id} className="py-3 flex flex-col xs:flex-row xs:items-center justify-between gap-2 group hover:bg-slate-100 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    isLoan
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400'
                      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'
                  }`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2 truncate">
                      <span className="truncate">{sale.productName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal shrink-0">x{sale.quantitySold}</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                      {formatDate(sale.date)} • {t('dashboard.loggedBy')} <span className="text-slate-700 dark:text-slate-300 font-bold">{sale.createdBy || t('dashboard.partner')}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left xs:text-right pl-[52px] xs:pl-0 shrink-0">
                  <div className="text-sm font-extrabold text-slate-950 dark:text-white">
                    {formatCurrency(sale.totalPrice)}
                  </div>
                  <div className="mt-1 flex items-center xs:justify-end gap-1.5">
                    {isLoan ? (
                      <Badge variant="loan">
                        DAYN: ${sale.totalPrice?.toFixed(2)} ({sale.customerName || t('common.customer')})
                      </Badge>
                    ) : (
                      <Badge variant="cash">{t('common.cash')}</Badge>
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
