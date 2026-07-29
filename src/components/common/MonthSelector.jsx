import React from 'react';
import { useData } from '../../context/DataContext';
import { Calendar, Lock, CheckCircle2 } from 'lucide-react';

export const MonthSelector = () => {
  const { monthlyClosings, selectedMonth, setSelectedMonth } = useData();

  // Helper to format YYYY-MM into a friendly month name e.g. "2026-07" -> "July 2026"
  const formatMonthLabel = (yearMonthStr) => {
    if (!yearMonthStr || yearMonthStr === 'CURRENT') return 'Current Active Month';
    const [year, month] = yearMonthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="appearance-none pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
        >
          <option value="CURRENT" className="bg-slate-900 text-white font-bold">
            ⚡ Current Active Month
          </option>
          
          {monthlyClosings.length > 0 && (
            <optgroup label="Closed Historical Periods" className="bg-slate-900 text-slate-400 font-semibold">
              {monthlyClosings.map((closing) => (
                <option key={closing.monthYear} value={closing.monthYear} className="bg-slate-900 text-slate-200 font-semibold">
                  🔒 {formatMonthLabel(closing.monthYear)} (CLOSED)
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <Calendar className="w-4 h-4 text-blue-500 absolute left-3 top-2.5 pointer-events-none" />
        <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 pointer-events-none">▼</span>
      </div>
    </div>
  );
};
