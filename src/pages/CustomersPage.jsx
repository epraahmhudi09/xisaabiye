import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoanPaymentModal } from '../components/loans/LoanPaymentModal';
import { Badge } from '../components/common/Badge';
import { 
  Users, 
  Search, 
  AlertTriangle, 
  DollarSign, 
  Phone, 
  History,
  CheckCircle2,
  Receipt
} from 'lucide-react';

export const CustomersPage = () => {
  const { customers, loanPayments, sales } = useData();
  const { isManager } = useAuth();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('customers'); // 'customers' or 'paymentsHistory'

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  const totalOutstandingDayn = customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  const totalRepaymentsReceived = loanPayments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

  const handleOpenPayment = (customer) => {
    if (isManager) return;
    setSelectedCustomer(customer);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('customers.title')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('customers.subtitle')}
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-rose-200 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between shadow-sm dark:shadow-lg dark:shadow-rose-950/50">
          <div>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider block">{t('customers.totalOutstanding')}</span>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalOutstandingDayn)}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{t('customers.totalOutstandingSub')}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider block">{t('customers.totalRepayments')}</span>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalRepaymentsReceived)}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{t('customers.totalRepaymentsSub')}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider block">{t('customers.activeDebtors')}</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {customers.filter(c => (c.totalDebt || 0) > 0).length}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{t('customers.activeDebtorsSub')}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-tab selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-2">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'customers'
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/80 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('customers.debtLedgerTab')} ({customers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('paymentsHistory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'paymentsHistory'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('customers.repaymentLogsTab')} ({loanPayments.length})
          </button>
        </div>

        {activeSubTab === 'customers' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 rounded-xl glass-input text-xs font-semibold"
            />
          </div>
        )}
      </div>

      {/* View 1: Customers Ledger */}
      {activeSubTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm font-medium">
              {t('customers.noCustomers')}
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const debt = cust.totalDebt || 0;
              const hasDebt = debt > 0;
              
              // Recent Dayn sales for this customer
              const customerSales = sales.filter(s => s.customerName?.toLowerCase() === cust.name.toLowerCase() && s.paymentStatus === 'loan');

              return (
                <div 
                  key={cust.id} 
                  className={`glass-panel p-5 rounded-2xl border transition-all ${
                    hasDebt 
                      ? 'border-rose-300 dark:border-rose-800/60 bg-white dark:bg-slate-900/90 hover:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{cust.name}</h4>
                      {cust.phone ? (
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{cust.phone}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('customers.noPhone')}</p>
                      )}
                    </div>
                    {hasDebt ? (
                      <Badge variant="loan">{t('customers.debtor')}</Badge>
                    ) : (
                      <Badge variant="cash">{t('customers.cleared')}</Badge>
                    )}
                  </div>

                  {/* Prominent Red Debt Tag - Matching Excel "$95 (loan)" */}
                  <div className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between ${
                    hasDebt
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase block">{t('customers.outstandingBalance')}</span>
                      <span className={`text-xl font-black ${hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(debt)} {hasDebt ? '(loan)' : ''}
                      </span>
                    </div>
                    {hasDebt && !isManager && (
                      <button
                        onClick={() => handleOpenPayment(cust)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/80 transition-colors flex items-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{t('customers.receivePayment')}</span>
                      </button>
                    )}
                  </div>

                  {/* Customer history info */}
                  <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60 font-medium">
                    <span>{t('customers.daynSalesLogged')} <strong className="text-slate-900 dark:text-white">{customerSales.length}</strong></span>
                    <span>{t('customers.lastActive')} {formatDate(cust.lastTransactionDate)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View 2: Repayment Audit Logs — Mobile Cards */}
      {activeSubTab === 'paymentsHistory' && (
        <div className="sm:hidden space-y-3">
          {loanPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium glass-panel rounded-2xl border border-slate-200 dark:border-slate-800">
              {t('customers.noPayments')}
            </div>
          ) : (
            loanPayments.map((pay) => (
              <div key={pay.id} className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{pay.customerName}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{formatDate(pay.paymentDate)}</p>
                  </div>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 shrink-0">+{formatCurrency(pay.amountPaid)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                  {pay.notes || t('customers.fullPartialRepayment')}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* View 2: Repayment Audit Logs — Desktop */}
      {activeSubTab === 'paymentsHistory' && (
        <div className="hidden sm:block glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-400 tracking-wider">
                  <th className="py-4 px-6">{t('customers.paymentDate')}</th>
                  <th className="py-4 px-6">{t('customers.customerName')}</th>
                  <th className="py-4 px-6">{t('customers.amountReceived')}</th>
                  <th className="py-4 px-6">{t('customers.notesRef')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm font-semibold">
                {loanPayments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                      {t('customers.noPayments')}
                    </td>
                  </tr>
                ) : (
                  loanPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {formatDate(pay.paymentDate)}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {pay.customerName}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-emerald-700 dark:text-emerald-400">
                        +{formatCurrency(pay.amountPaid)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 italic">
                        {pay.notes || t('customers.fullPartialRepayment')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loan Repayment Modal */}
      <LoanPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
};
