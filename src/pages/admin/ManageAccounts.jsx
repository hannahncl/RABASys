import React, { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import { Plus, Edit, Trash2, Save, X, Loader, UserCheck, UserX, Search, Users, ShieldCheck, Briefcase } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const ManageAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (e) {
      showNotification('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (acc) => {
    setEditingId(acc.id);
    setFormData({
      name: acc.name,
      email: acc.email,
      username: acc.username,
      role: acc.role,
      phone: acc.phone
    });
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      name: '',
      email: '',
      username: '',
      role: 'staff',
      phone: ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.username) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    try {
      if (editingId === 'new') {
        await accountService.create(formData);
        showNotification('Account created successfully', 'success');
      } else {
        await accountService.update(editingId, formData);
        showNotification('Account updated successfully', 'success');
      }
      setEditingId(null);
      setFormData(null);
      loadAccounts();
    } catch (e) {
      showNotification('Failed to save account', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}'s account?`)) {
      try {
        await accountService.delete(id);
        showNotification('Account deleted', 'success');
        loadAccounts();
      } catch (e) {
        showNotification('Failed to delete account', 'error');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await accountService.toggleStatus(id);
      showNotification('Account status updated', 'success');
      loadAccounts();
    } catch (e) {
      showNotification('Failed to update status', 'error');
    }
  };

  // Filter accounts (exclude admin from editable list)
  const filteredAccounts = accounts
    .filter(acc => acc.role !== 'admin')
    .filter(acc => filterRole === 'all' || acc.role === filterRole)
    .filter(acc =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const staffCount = accounts.filter(a => a.role === 'staff').length;
  const touristCount = accounts.filter(a => a.role === 'customer').length;
  const activeCount = accounts.filter(a => a.role !== 'admin' && a.status === 'Active').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-100">Account Management</h1>
          <p className="text-slate-400 text-sm">Manage staff and tourist accounts.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Staff</span>
            <span className="text-xl font-extrabold text-slate-100 font-display">{staffCount}</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tourists</span>
            <span className="text-xl font-extrabold text-slate-100 font-display">{touristCount}</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active</span>
            <span className="text-xl font-extrabold text-slate-100 font-display">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'staff', 'customer'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                filterRole === role
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {role === 'customer' ? 'Tourist' : role === 'all' ? 'All' : 'Staff'}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Account Form */}
      {editingId === 'new' && (
        <div className="bg-slate-900/60 border border-cyan-500/50 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">New Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Username</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. juan.delacruz"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Email Address</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. juan@rabastravel.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Phone Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 09171234567"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500 cursor-pointer"
              >
                <option value="staff">Staff</option>
                <option value="customer">Tourist</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
            <button onClick={handleCancel} className="p-2 px-4 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer text-sm">
              Cancel
            </button>
            <button onClick={handleSave} className="p-2 px-4 text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg cursor-pointer text-sm font-bold flex items-center gap-1">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400">
                <th className="p-4 font-bold uppercase">Name</th>
                <th className="p-4 font-bold uppercase">Username</th>
                <th className="p-4 font-bold uppercase">Email</th>
                <th className="p-4 font-bold uppercase">Phone</th>
                <th className="p-4 font-bold uppercase text-center">Role</th>
                <th className="p-4 font-bold uppercase text-center">Status</th>
                <th className="p-4 font-bold uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-900/20">
                    {editingId === acc.id ? (
                      /* Inline Edit Row */
                      <>
                        <td className="p-3">
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Juan Dela Cruz"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="e.g. juan.delacruz"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g. juan@email.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="e.g. 09171234567"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:border-cyan-500"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:border-cyan-500 cursor-pointer"
                          >
                            <option value="staff">Staff</option>
                            <option value="customer">Tourist</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[9px] text-slate-500">—</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer">
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={handleSave} className="p-1.5 text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg cursor-pointer">
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      /* Display Row */
                      <>
                        <td className="p-4 font-medium text-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            {acc.name}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">{acc.username}</td>
                        <td className="p-4 text-slate-400">{acc.email}</td>
                        <td className="p-4 text-slate-400">{acc.phone || '—'}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                            acc.role === 'staff'
                              ? 'bg-cyan-950/40 border-cyan-900/40 text-cyan-400'
                              : 'bg-purple-950/40 border-purple-900/40 text-purple-400'
                          }`}>
                            {acc.role === 'customer' ? 'Tourist' : 'Staff'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                            acc.status === 'Active'
                              ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400'
                              : 'bg-rose-950/40 border-rose-900/40 text-rose-400'
                          }`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(acc.id)}
                              title={acc.status === 'Active' ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                acc.status === 'Active'
                                  ? 'text-emerald-400 hover:bg-emerald-950/30'
                                  : 'text-rose-400 hover:bg-rose-950/30'
                              }`}
                            >
                              {acc.status === 'Active' ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleEdit(acc)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(acc.id, acc.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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

export default ManageAccounts;
