import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastNotification } from './components/common/ToastNotification';
import { NewSaleModal } from './components/sales/NewSaleModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagement } from './pages/UserManagement';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { ExpensesPage } from './pages/ExpensesPage';

import { useAuth } from './context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const PosAccessDenied = () => (
  <div className="p-12 text-center glass-panel rounded-2xl border border-rose-800/40 bg-slate-900/60 font-sans">
    <div className="inline-flex p-4 rounded-2xl bg-rose-500/20 text-rose-400 mb-4 border border-rose-500/30">
      <ShieldAlert className="w-10 h-10" />
    </div>
    <h3 className="text-2xl font-extrabold text-white">Access Denied: POS Restricted</h3>
    <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
      The POS / New Sale feature is restricted for the Read-Only Manager role. Managers are restricted to view-only access across permitted modules.
    </p>
  </div>
);

const MainLayout = () => {
  const { isManager } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname === '/pos') return 'pos';
    return 'dashboard';
  });
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenNewSale = () => {
    if (isManager) return;
    setIsNewSaleOpen(true);
  };

  const renderActiveTab = () => {
    if ((activeTab === 'pos' || window.location.pathname === '/pos') && isManager) {
      return <PosAccessDenied />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} onOpenNewSale={handleOpenNewSale} />;
      case 'inventory':
        return <InventoryPage />;
      case 'sales':
        return <SalesPage onOpenNewSale={handleOpenNewSale} />;
      case 'customers':
        return <CustomersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'userManagement':
        return <UserManagement />;
      case 'activityLogs':
        return <ActivityLogsPage />;
      case 'pos':
        return <Dashboard setActiveTab={setActiveTab} onOpenNewSale={handleOpenNewSale} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} onOpenNewSale={handleOpenNewSale} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenNewSale={handleOpenNewSale} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenNewSale={handleOpenNewSale} 
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {renderActiveTab()}
        </main>
      </div>

      {/* Global POS Sale Modal */}
      {!isManager && (
        <NewSaleModal
          isOpen={isNewSaleOpen}
          onClose={() => setIsNewSaleOpen(false)}
        />
      )}

      {/* Real-time Toast Notifications */}
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
