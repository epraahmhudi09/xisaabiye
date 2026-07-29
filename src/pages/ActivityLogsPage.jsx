import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  User
} from 'lucide-react';

export const ActivityLogsPage = () => {
  const { activityLogs } = useData();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  if (!isAdmin) {
    return (
      <div className="p-12 text-center glass-panel rounded-2xl border border-rose-800/40">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-white">Access Restricted</h3>
        <p className="text-sm text-slate-400 mt-1">Activity Audit Logs are restricted exclusively to Administrators.</p>
      </div>
    );
  }

  const actionTypes = ['ALL', 'NEW_SALE', 'RECORD_LOAN', 'ADD_STOCK', 'UPDATE_STOCK', 'LOAN_REPAYMENT', 'NEW_USER_CREATED', 'DELETE_PRODUCT'];

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = 
      (log.username && log.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = filterAction === 'ALL' || log.actionType === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeVariant = (actionType) => {
    switch (actionType) {
      case 'NEW_SALE': return 'cash';
      case 'RECORD_LOAN': return 'loan';
      case 'ADD_STOCK': return 'purple';
      case 'UPDATE_STOCK': return 'info';
      case 'LOAN_REPAYMENT': return 'cash';
      case 'NEW_USER_CREATED': return 'info';
      case 'DELETE_PRODUCT': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">System Activity Audit Log (Dhaqdhaqaaq)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of operational sales, stock modifications, loan entries, and user administration.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user or activity description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {actionTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterAction(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap uppercase transition-colors ${
                filterAction === type 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {type === 'ALL' ? 'ALL EVENTS' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Audit Event Log</span>
          </h3>
          <span className="text-xs text-slate-400">{filteredLogs.length} Events Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">User / Role</th>
                <th className="py-4 px-6">Event Type</th>
                <th className="py-4 px-6">Activity Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                    No activity logs matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-300 font-medium flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(log.timestamp)}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span>{log.username}</span>
                          <span className="text-[10px] text-slate-400 block font-normal capitalize">
                            {log.userRole || 'User'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <Badge variant={getActionBadgeVariant(log.actionType)}>
                        {log.actionType ? log.actionType.replace(/_/g, ' ') : 'EVENT'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-200 font-medium">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
