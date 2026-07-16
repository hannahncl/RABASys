import React, { useState, useEffect } from 'react';
import { accountService } from '../../services/accountService';
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

  const splitFullName = (fullName = '') => {
    const trimmed = fullName.trim();
    if (!trimmed) return { firstName: '', lastName: '' };

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  };

  const buildAccountPayload = (form) => {
    const firstName = (form.firstName || '').trim();
    const lastName = (form.lastName || '').trim();
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const username = `${firstName}.${lastName}`.replace(/\s+/g, '').toLowerCase();

    return {
      ...form,
      name,
      firstName,
      lastName,
      username: username || form.username || ''
    };
  };

  const handleEdit = (acc) => {
    const { firstName, lastName } = splitFullName(acc.name);

    setEditingId(acc.id);
    setFormData({
      firstName,
      lastName,
      email: acc.email,
      role: acc.role || '',
      phone: acc.phone
    });
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
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
    if (!formData.firstName || !formData.lastName || !formData.email) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const payload = buildAccountPayload(formData);

    try {
      if (editingId === 'new') {
        await accountService.create(payload);
        showNotification('Account created successfully', 'success');
      } else {
        await accountService.update(editingId, payload);
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
      acc.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {['all', 'tour-guide', 'customer'].map((role) => {
            const isTourGuide = role === 'tour-guide';
            const isCustomer = role === 'customer';
            const isActive = filterRole === role;

            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`w-24 flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                  isActive
                    ? isTourGuide
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : isCustomer
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    : isTourGuide
                      ? 'bg-slate-900/60 text-amber-400 border-slate-800 hover:text-amber-300 hover:border-amber-500/20'
                      : isCustomer
                        ? 'bg-slate-900/60 text-purple-400 border-slate-800 hover:text-purple-300 hover:border-purple-500/20'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {role === 'all' ? 'All' : role === 'tour-guide' ? 'Tour Guide' : 'Customer'}
              </button>
            );
          })}
          <button
            onClick={handleAddNew}
            className="ml-auto flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Add New Account Form */}
      {editingId === 'new' && (
        <div className="bg-slate-900/60 border border-cyan-500/50 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">New Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Juan"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Dela Cruz"
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
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Contact Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 09171234567"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:border-cyan-500 cursor-pointer"
              >
                <option value="">Select role</option>
                <option value="tour-guide">Tour Guide</option>
                <option value="customer">Customer</option>
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

      {!editingId && (
        <div className="glass-panel rounded-2xl overflow-hidden border-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400">
                  <th className="p-4 font-bold uppercase">Name</th>
                  <th className="p-4 font-bold uppercase">Email Address</th>
                  <th className="p-4 font-bold uppercase">Contact Number</th>
                  <th className="p-4 font-bold uppercase text-center">Role</th>
                  <th className="p-4 font-bold uppercase text-center">Status</th>
                  <th className="p-4 font-bold uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-900/20">
                      <td className="p-4 font-medium text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                          {acc.name}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{acc.email}</td>
                      <td className="p-4 text-slate-400">{acc.phone || '—'}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                          acc.role === 'staff'
                            ? 'bg-white border-cyan-900/40 text-cyan-400'
                            : acc.role === 'tour-guide'
                              ? 'bg-white border-amber-900/40 text-amber-400'
                              : 'bg-white border-purple-900/40 text-purple-400'
                        }`}>
                          {acc.role === 'customer' ? 'Customer' : acc.role === 'tour-guide' ? 'Tour Guide' : 'Staff'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                          acc.status === 'Active'
                            ? 'bg-white border-emerald-900/40 text-emerald-400'
                            : 'bg-white border-rose-900/40 text-rose-400'
                        }`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(acc.id)}
                            title={acc.status === 'Active' ? 'Deactivate' : 'Activate'}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              acc.status === 'Active'
                                ? 'text-emerald-400 hover:bg-emerald-950/30'
                                : 'text-rose-400 hover:bg-rose-950/30'
                            }`}
                          >
                            {acc.status === 'Active' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(acc)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;
