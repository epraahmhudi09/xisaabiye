import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    cash: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 shadow-sm shadow-emerald-950/50',
    loan: 'bg-rose-950/80 text-rose-400 border-rose-800/60 shadow-sm shadow-rose-950/50 animate-pulse',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    info: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60',
    purple: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};
