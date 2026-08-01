import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, CheckCircle2 } from 'lucide-react';

export const LoanPaymentModal = ({ isOpen, onClose, customer }) => {
  const { addLoanPayment } = useData();
  const { t } = useLanguage();

  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!customer) return null;

  const currentDebt = customer.totalDebt || 0;

  const handleFullPayToggle = () => {
    setAmountPaid(currentDebt.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    if (paid > currentDebt) {
      setError(`Payment ($${paid.toFixed(2)}) cannot exceed outstanding debt ($${currentDebt.toFixed(2)}).`);
      return;
    }

    setSubmitting(true);
    try {
      await addLoanPayment(customer.id, customer.name, paid, notes);
      setAmountPaid('');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const remainingDebtAfterPayment = Math.max(0, currentDebt - (parseFloat(amountPaid) || 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('loanPayment.titlePrefix')} ${customer.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        {/* Customer Balance Banner */}
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-rose-300 font-medium block">{t('loanPayment.currentDebt')}</span>
            <span className="text-2xl font-black text-rose-400">{formatCurrency(currentDebt)}</span>
          </div>
          <button
            type="button"
            onClick={handleFullPayToggle}
            className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-xs font-bold text-white transition-colors shrink-0 self-start xs:self-auto"
          >
            {t('loanPayment.payFullDebt')}
          </button>
        </div>

        {/* Payment Input */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            {t('loanPayment.repaymentAmount')}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={currentDebt}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl glass-input text-base font-extrabold text-emerald-400"
              required
            />
          </div>
        </div>

        {/* Remaining debt preview */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">{t('loanPayment.remainingBalance')}</span>
          <span className={`font-bold ${remainingDebtAfterPayment === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(remainingDebtAfterPayment)}
          </span>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            {t('loanPayment.paymentNotes')}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('loanPayment.paymentNotesPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting || currentDebt <= 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/60 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? t('loanPayment.recording') : t('loanPayment.confirmRepayment')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
