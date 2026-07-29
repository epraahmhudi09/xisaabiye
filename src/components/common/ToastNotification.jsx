import React from 'react';
import { useData } from '../../context/DataContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastNotification = () => {
  const { notification } = useData();

  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-cyan-400" />
  };

  const borders = {
    success: 'border-emerald-500/40 bg-slate-900/95 text-emerald-300',
    warning: 'border-amber-500/40 bg-slate-900/95 text-amber-300',
    error: 'border-rose-500/40 bg-slate-900/95 text-rose-300',
    info: 'border-cyan-500/40 bg-slate-900/95 text-cyan-300'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl ${borders[notification.type] || borders.success}`}>
        {icons[notification.type] || icons.success}
        <span className="text-sm font-medium">{notification.message}</span>
      </div>
    </div>
  );
};
