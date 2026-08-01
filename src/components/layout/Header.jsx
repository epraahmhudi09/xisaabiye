import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Wifi, 
  Menu,
  X,
  LayoutDashboard,
  Package,
  Users,
  FileSpreadsheet,
  Sun,
  Moon,
  UserCheck,
  Activity,
  Receipt,
  Lock,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { MonthSelector } from '../common/MonthSelector';
import { CloseMonthModal } from '../common/CloseMonthModal';

export const Header = ({ activeTab, setActiveTab, onOpenNewSale, mobileMenuOpen, setMobileMenuOpen }) => {
  const { currentUser, isAdmin, isManager } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isClosedMonth, selectedMonth } = useData();
  const { language, toggleLanguage, t } = useLanguage();

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const getPageTitle = (tab) => {
    switch (tab) {
      case 'customers': return t('header.titles.customers');
      case 'userManagement': return t('header.titles.userManagement');
      case 'activityLogs': return t('header.titles.activityLogs');
      case 'expenses': return t('header.titles.expenses');
      case 'dashboard': return t('header.titles.dashboard');
      case 'inventory': return t('header.titles.inventory');
      case 'sales': return t('header.titles.sales');
      case 'reports': return t('header.titles.reports');
      default: return tab;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 glass-panel border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Sync Indicator */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white capitalize tracking-wide">
              {getPageTitle(activeTab)}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {isClosedMonth ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-950/90 text-amber-300 border-amber-800/80 animate-pulse">
                  <Lock className="w-3 h-3 text-amber-400" />
                  {t('header.readOnly')} ({selectedMonth})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-blue-950/80 text-blue-400 border-blue-800/60">
                  <Wifi className="w-3 h-3 text-blue-400 animate-pulse" />
                  {t('header.liveSync')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons & Period Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Component */}
          <MonthSelector />

          {/* Xisaab Xir (Close Month) Button - Hidden for Manager Role */}
          {!isManager && (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              title="Execute Xisaab Xir (Closeout Month)"
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-amber-950/50 transition-transform hover:scale-105"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('header.closeMonth')}</span>
            </button>
          )}

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={language === 'en' ? 'Ku beddel Af-Soomaali' : 'Switch to English'}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-extrabold"
          >
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>{language === 'en' ? 'EN' : 'SO'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{t('header.lightMode')}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">{t('header.darkMode')}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Close Month Modal */}
      <CloseMonthModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
      />
    </>
  );
};
