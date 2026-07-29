import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Login } from '../../pages/Login';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

/**
 * AdminRoute Component
 * 
 * A protected route wrapper that restricts rendering to authenticated Admin users only.
 * Resolves loading states to prevent UI flickering, redirects unauthenticated users to Login,
 * and renders a secure, custom-styled unauthorized page for non-admin roles.
 */
export const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading, logout } = useAuth();

  // Handle initialization/auth state fetching to prevent flickering
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400 font-sans">Checking Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  // If not logged in at all, render the login page
  if (!currentUser) {
    return <Login />;
  }

  // If logged in but not an admin, render a premium glassmorphic unauthorized view
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-xl shadow-rose-950/80 mb-4 animate-bounce">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-400">
            Unauthorized Role-Based Restriction
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 font-sans">
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 bg-slate-900/60 backdrop-blur-md text-center font-medium">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                You do not have the required permissions to view this resource.
              </p>
              <p className="text-xs text-slate-500">
                Logged in as: <span className="text-rose-400 font-mono">{currentUser.email}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  // Direct navigation back or dashboard reload
                  window.location.reload();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
              
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-rose-500/30"
              >
                <Lock className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated and is an admin, render children
  return children;
};
