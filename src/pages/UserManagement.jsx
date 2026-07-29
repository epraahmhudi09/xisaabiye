import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  Info, 
  UserCheck, 
  UserX, 
  Copy, 
  Check, 
  ShieldCheck, 
  User,
  Plus
} from 'lucide-react';

export const UserManagement = () => {
  const { isAdmin } = useAuth();
  const { usersList, loading, updateUser, deleteUser, createUserAccount } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit fields
  const [editRole, setEditRole] = useState('manager');
  const [editStatus, setEditStatus] = useState('active');
  
  // Create fields
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('manager');
  const [newStatus, setNewStatus] = useState('active');
  const [createError, setCreateError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // If the logged in user is not an Admin, render an access block layout
  if (!isAdmin) {
    return (
      <div className="p-12 text-center glass-panel rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-white dark:bg-slate-900/60 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          User Account Directory and Role Access Control are restricted exclusively to System Administrators.
        </p>
      </div>
    );
  }

  // Normalize users list first with fallbacks and variations
  const normalizedUsers = usersList.map(user => {
    const displayName = user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'User');
    const email = user.email || '';
    
    // Normalize role
    let role = 'staff';
    if (user.role) {
      const r = user.role.toLowerCase().trim();
      if (r === 'admin' || r === 'administrator') role = 'admin';
      else if (r === 'manager') role = 'manager';
      else if (r === 'cashier') role = 'cashier';
      else role = r;
    }
    
    const status = user.status ? user.status.toLowerCase().trim() : 'active';
    
    return {
      ...user,
      displayName,
      email,
      role,
      status
    };
  });

  // Filter list
  const filteredUsers = normalizedUsers.filter(user => {
    const name = user.displayName.toLowerCase();
    const email = user.email.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setCopied(false);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditRole(user.role || 'manager');
    setEditStatus(user.status || 'active');
    setIsEditOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateUser(selectedUser.id, {
        role: editRole,
        status: editStatus
      });
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setSubmitting(true);
    try {
      await deleteUser(selectedUser.id, selectedUser.email);
      setIsDeleteOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (newPassword.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await createUserAccount(newName, newEmail, newPassword, newRole, newStatus);
      setIsCreateOpen(false);
      
      // Reset fields
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('manager');
      setNewStatus('active');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setCreateError('This email address is already in use.');
      } else if (err.code === 'auth/invalid-email') {
        setCreateError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setCreateError('The password is too weak.');
      } else {
        setCreateError(err.message || 'Failed to create user account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">User Management & Privilege Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Oversee corporate access permissions, assign cashier/staff roles, and audit account states.
          </p>
        </div>
        <button
          onClick={() => {
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            setNewRole('manager');
            setNewStatus('active');
            setCreateError('');
            setIsCreateOpen(true);
          }}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-950/60 flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter Role:</span>
          {['ALL', 'admin', 'manager', 'cashier', 'staff'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 ${
                roleFilter === role
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-850'
              }`}
            >
              {role === 'ALL' ? 'ALL ROLES' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Directory Table Grid */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="py-4 px-6">User Profile</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">System Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created Date</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                // Skeletons
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                      <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </td>
                    <td className="py-4 px-6"><div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-14 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="w-28 h-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-medium">
                    No users matching criteria found in directory database.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((usr) => {
                  const isSuspended = usr.status === 'suspended' || usr.status === 'inactive';
                  return (
                    <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300">
                          {usr.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <User className="w-4 h-4" />}
                        </div>
                        <span>{usr.displayName || 'User'}</span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {usr.email}
                      </td>
                      <td className="py-4 px-6">
                        {usr.role === 'admin' ? (
                          <Badge variant="cash" className="uppercase">ADMINISTRATOR</Badge>
                        ) : usr.role === 'manager' ? (
                          <Badge variant="info" className="uppercase">MANAGER</Badge>
                        ) : usr.role === 'cashier' ? (
                          <Badge variant="warning" className="uppercase">CASHIER</Badge>
                        ) : (
                          <Badge variant="neutral" className="uppercase">{usr.role || 'STAFF'}</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isSuspended 
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30' 
                            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                          {isSuspended ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {formatDate(usr.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetails(usr)}
                            title="View Full Profile"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenEdit(usr)}
                            title="Edit Role & Status"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenDelete(usr)}
                            title="Remove Account"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DETAILS */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="User Account Details"
        maxWidth="max-w-md"
      >
        {selectedUser && (
          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                {selectedUser.displayName ? selectedUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {selectedUser.displayName || 'User Profile'}
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">{selectedUser.role || 'Staff'}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div>
                <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">User Unique UID</span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <code className="text-slate-700 dark:text-slate-300 select-all font-mono break-all pr-2">{selectedUser.uid || selectedUser.id}</code>
                  <button
                    onClick={() => handleCopyToClipboard(selectedUser.uid || selectedUser.id)}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-150 dark:hover:bg-slate-850 rounded"
                    title="Copy UID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Email Address</span>
                  <p className="text-slate-900 dark:text-white text-xs truncate">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Role Group</span>
                  <p className="text-slate-900 dark:text-white text-xs uppercase">{selectedUser.role || 'staff'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Created Date</span>
                  <p className="text-slate-900 dark:text-white text-xs">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Current Status</span>
                  <p className={`text-xs font-bold ${selectedUser.status === 'suspended' || selectedUser.status === 'inactive' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedUser.status === 'suspended' || selectedUser.status === 'inactive' ? 'Inactive' : 'Active'}
                  </p>
                </div>
              </div>

              {selectedUser.createdBy && (
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Created By (Admin)</span>
                  <p className="text-slate-900 dark:text-white text-xs font-semibold">{selectedUser.createdBy}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: EDIT ROLE & STATUS */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modify User Credentials"
        maxWidth="max-w-md"
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                Update credentials access permissions for <span className="font-bold text-slate-900 dark:text-white">{selectedUser.displayName || selectedUser.email}</span>.
              </p>
            </div>

            {/* Select Role */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                System Role Selection
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['admin', 'manager', 'cashier', 'staff'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEditRole(r)}
                    className={`py-2 px-3.5 rounded-xl border text-center font-bold text-xs uppercase transition-all ${
                      editRole === r
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-750'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Status */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                User Access Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={editStatus === 'active'}
                    onChange={() => setEditStatus('active')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Active (Allowed Logins)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="suspended"
                    checked={editStatus === 'suspended'}
                    onChange={() => setEditStatus('suspended')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <UserX className="w-4 h-4 text-rose-500" />
                    <span>Inactive (Banned)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit / Cancel Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-2"
              >
                <span>{submitting ? 'Saving...' : 'Apply Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm User Account Deletion"
        maxWidth="max-w-md"
      >
        {selectedUser && (
          <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">CRITICAL WARNING:</p>
                <p className="mt-0.5">
                  Deleting this user account is permanent and cannot be undone. All role permission claims will be revoked immediately.
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold space-y-1">
              <p>User details targeted for deletion:</p>
              <p className="text-slate-900 dark:text-white">
                Name: <span className="font-bold">{selectedUser.displayName || 'Unnamed User'}</span>
              </p>
              <p className="text-slate-900 dark:text-white">
                Email: <span className="font-mono font-bold">{selectedUser.email}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submitting}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: CREATE NEW USER */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New System User"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
          {createError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-455 text-xs font-semibold">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Full Name / Alias *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mohamed Ali"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-semibold animate-in fade-in"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                System Role *
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold uppercase cursor-pointer"
              >
                <option value="admin" className="text-slate-900 bg-white">Admin</option>
                <option value="manager" className="text-slate-900 bg-white">Manager</option>
                <option value="cashier" className="text-slate-900 bg-white">Cashier</option>
                <option value="staff" className="text-slate-900 bg-white">Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold uppercase cursor-pointer"
              >
                <option value="active" className="text-slate-900 bg-white">Active</option>
                <option value="suspended" className="text-slate-900 bg-white">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-2"
            >
              <span>{submitting ? 'Creating...' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
