import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const UsersPage = () => {
  const { createNewUser, isAdmin } = useAuth();
  const { usersList, logActivity, showNotification } = useData();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager'); // 'admin' or 'manager'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAdmin) {
    return (
      <div className="p-12 text-center glass-panel rounded-2xl border border-rose-800/40">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white">Access Restricted</h3>
        <p className="text-sm text-slate-400 mt-1">User Management is restricted exclusively to Administrators.</p>
      </div>
    );
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || !username.trim() || !password) {
      setError('Please fill in all required user fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createNewUser(displayName, username, password, role);
      await logActivity('NEW_USER_CREATED', `Admin created new ${role.toUpperCase()} user "${displayName}" (${created.email})`);
      showNotification(`New ${role} user "${displayName}" created successfully!`);

      // Reset form
      setDisplayName('');
      setUsername('');
      setPassword('');
      setRole('manager');
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">User Management & Role Access Control (RBAC)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create and manage business partner accounts (Administrators and Managers).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form (Left column) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base text-white">Create System User</h3>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Full Name / Alias *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Mohamed Ali"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Username or Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. manager1 or user@xisaabiye.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs font-semibold"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                User can log in using username or full email address.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Assign System Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('manager')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                    role === 'manager'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>MANAGER</span>
                  <span className="text-[10px] font-normal text-slate-400">POS & Stock Ops</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                    role === 'admin'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ADMIN</span>
                  <span className="text-[10px] font-normal text-slate-400">Full System Control</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating User...' : 'Provision User Account'}</span>
            </button>
          </form>
        </div>

        {/* Existing Users Table (Right column) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Registered System Users</span>
            </h3>
            <span className="text-xs text-slate-400">{usersList.length} Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">User / Name</th>
                  <th className="py-4 px-6">Email / Username</th>
                  <th className="py-4 px-6">System Role</th>
                  <th className="py-4 px-6">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                      No registered users found.
                    </td>
                  </tr>
                ) : (
                  usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                          {usr.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <User className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <span>{usr.displayName || 'User'}</span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-300 font-medium">
                        {usr.email}
                      </td>
                      <td className="py-4 px-6">
                        {usr.role === 'admin' ? (
                          <Badge variant="cash" className="uppercase">ADMINISTRATOR</Badge>
                        ) : (
                          <Badge variant="info" className="uppercase">MANAGER</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {formatDate(usr.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
