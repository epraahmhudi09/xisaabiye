import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald', alert = false }) => {
  const colorMap = {
    emerald: 'border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    rose: 'border-rose-200 dark:border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shadow-sm dark:shadow-lg dark:shadow-rose-950/50',
    blue: 'border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
    amber: 'border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
    purple: 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
  };

  const iconBgMap = {
    emerald: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/40 animate-bounce',
    blue: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    amber: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    purple: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
  };

  return (
    <div className={`p-5 rounded-2xl border glass-panel transition-all duration-300 hover:translate-y-[-2px] ${colorMap[color] || colorMap.emerald} ${alert ? 'ring-2 ring-rose-500/60' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className={`text-2xl lg:text-3xl font-extrabold mt-1 tracking-tight ${alert ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${iconBgMap[color] || iconBgMap.emerald}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
