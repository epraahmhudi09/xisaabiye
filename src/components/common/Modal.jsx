import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[92vh] sm:max-h-[88vh] flex flex-col glass-panel rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom sm:zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 pt-3 sm:pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-wide pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
