import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileSpreadsheet,
  LogOut,
  UserCheck,
  Activity,
  ShieldCheck,
  Sun,
  Moon,
  Receipt,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// Stylized 'X' representing Xisaabiye
const XLogo = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 4H15L9 20H6" />
    <path d="M6 4H9L15 20H18" />
  </svg>
);

export const Sidebar = ({ activeTab, setActiveTab, onOpenNewSale, mobileMenuOpen, setMobileMenuOpen }) => {
  const { currentUser, logout, isAdmin, isManager } = useAuth();
  const { customers } = useData();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    );

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions((prev) => !prev);
    }
  };

  const canShowInstallButton = !isStandalone && (installPrompt || isIOS);

  const totalOutstandingLoans = customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);

  // Base navigation available to all roles
  const navItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { id: 'inventory', label: t('sidebar.inventory'), icon: Package },
    { id: 'sales', label: t('sidebar.sales'), icon: ShoppingCart },
    {
      id: 'customers',
      label: t('sidebar.loans'),
      icon: Users,
      badge: totalOutstandingLoans > 0 ? `$${totalOutstandingLoans.toFixed(0)}` : null,
      badgeColor: 'rose'
    },
    { id: 'reports', label: t('sidebar.reports'), icon: FileSpreadsheet },
    { id: 'expenses', label: t('sidebar.expenses'), icon: Receipt }
  ];

  // Admin exclusive navigation tabs
  if (isAdmin) {
    navItems.push(
      { id: 'userManagement', label: t('sidebar.userManagement'), icon: UserCheck },
      { id: 'activityLogs', label: t('sidebar.activityLogs'), icon: Activity }
    );
  }

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-45 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-screen fixed md:sticky top-0 left-0 z-50 md:z-auto transition-transform duration-300 ease-in-out font-sans ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-400 text-white shadow-lg shadow-blue-950/60">
              <XLogo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-wide leading-tight">Xisaabiye</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('sidebar.tagline')}</p>
            </div>
          </div>
        </div>

        {/* Action Button - Hidden for Manager Role */}
        {!isManager && (
          <div className="p-4">
            <button
              onClick={() => {
                onOpenNewSale();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-950/60 hover:shadow-blue-600/30 transition-all duration-200"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('sidebar.newSale')}</span>
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="px-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                 className={`w-full flex items-center justify-between px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                   isActive 
                     ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 dark:border-r-4 dark:border-blue-500 shadow-sm' 
                     : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                 }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    item.badgeColor === 'rose' 
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/60 animate-pulse' 
                      : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User & Theme Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        {/* Install App Button */}
        {canShowInstallButton && (
          <div>
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('sidebar.installApp')}</span>
            </button>
            {showIOSInstructions && (
              <p className="mt-2 text-[11px] leading-snug text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                {t('sidebar.installAppIOS')}
              </p>
            )}
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{theme === 'dark' ? t('sidebar.darkTheme') : t('sidebar.lightTheme')}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase font-bold">{t('sidebar.toggle')}</span>
        </button>

        {/* User Role Card */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-hidden pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('sidebar.loggedIn')}</span>
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                isAdmin 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
              }`}>
                {currentUser?.role || 'user'}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {currentUser?.displayName || currentUser?.email}
            </p>
          </div>
          <button
            onClick={logout}
            title={t('sidebar.logOut')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};
