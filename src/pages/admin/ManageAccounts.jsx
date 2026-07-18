import React, { useState, useEffect } from 'react';
import { accountService } from '../../services/accountService';
import { Plus, Edit, Save, X, Loader, UserCheck, UserX, Search } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const ManageAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [filterRole, setFilterRole] = useState('tour-guide');
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
      role: 'tour-guide',
      username: username || form.username || '',
      sex: form.sex || '',
      birthDate: form.birthDate || '',
      yearsExperience: form.yearsExperience || '',
      description: form.description || '',
      languageSpoken: form.languageSpoken || '',
      profilePicture: form.profilePicture || ''
    };
  };

  const handleEdit = (acc) => {
    const { firstName, lastName } = splitFullName(acc.name);

    setEditingId(acc.id);
    setFormData({
      firstName,
      lastName,
      email: acc.email || '',
      phone: acc.phone || '',
      sex: acc.sex || '',
      birthDate: acc.birthDate || '',
      yearsExperience: acc.yearsExperience || '',
      description: acc.description || '',
      languageSpoken: acc.languageSpoken || '',
      profilePicture: acc.profilePicture || ''
    });
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      sex: '',
      birthDate: '',
      yearsExperience: '',
      description: '',
      languageSpoken: '',
      profilePicture: ''
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, profilePicture: file.name }));
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (editingId === 'new') {
        const result = await accountService.createTourGuide(formData);
        if (result.tempPassword) {
          showNotification(
            `Tour guide created! Temporary password: ${result.tempPassword} — please share with the guide.`,
            'success'
          );
        } else {
          showNotification('Tour guide created successfully', 'success');
        }
      } else {
        await accountService.updateTourGuide(editingId, formData);
        showNotification('Tour guide updated successfully', 'success');
      }
      setEditingId(null);
      setFormData(null);
      loadAccounts();
    } catch (e) {
      showNotification(e.message || 'Failed to save tour guide', 'error');
    }
  };

  const updateAccountLocally = (id, updates) => {
    setAccounts(prev => prev.map(acc => (acc.id === id ? { ...acc, ...updates } : acc)));
  };

  const handleToggleStatus = async (id) => {
    const current = accounts.find(acc => acc.id === id);
    if (!current) return;

    const nextStatus = current.status === 'Active' ? 'Inactive' : 'Active';
    updateAccountLocally(id, { status: nextStatus });

    try {
      await accountService.toggleStatus(id);
      showNotification('Tour guide status updated', 'success');
    } catch (e) {
      updateAccountLocally(id, { status: current.status });
      showNotification('Failed to update status', 'error');
    }
  };

  const handleToggleAvailability = async (id) => {
    const current = accounts.find(acc => acc.id === id);
    if (!current) return;

    const nextAvailability = current.availability === 'Available' ? 'Unavailable' : 'Available';
    updateAccountLocally(id, { availability: nextAvailability });

    try {
      await accountService.toggleAvailability(id);
      showNotification('Availability updated', 'success');
    } catch (e) {
      updateAccountLocally(id, { availability: current.availability });
      showNotification('Failed to update availability', 'error');
    }
  };

  const handleToggleEmployment = async (id) => {
    const current = accounts.find(acc => acc.id === id);
    if (!current) return;

    const nextEmploymentStatus = current.employmentStatus === 'Active' ? 'Inactive' : 'Active';
    updateAccountLocally(id, { employmentStatus: nextEmploymentStatus });

    try {
      await accountService.toggleEmployment(id);
      showNotification('Employment status updated', 'success');
    } catch (e) {
      updateAccountLocally(id, { employmentStatus: current.employmentStatus });
      showNotification('Failed to update employment status', 'error');
    }
  };

  const filteredAccounts = accounts
    .filter(acc => acc.role === 'tour-guide' || acc.role === 'customer')
    .filter(acc => acc.role === filterRole)
    .filter(acc => {
      const query = searchQuery.toLowerCase();
      const fullName = `${acc.name || ''} ${acc.firstName || ''} ${acc.lastName || ''}`.toLowerCase();
      return fullName.includes(query) ||
        (acc.email || '').toLowerCase().includes(query) ||
        (acc.languageSpoken || '').toLowerCase().includes(query);
    });

  const isCustomerView = filterRole === 'customer';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {['customer', 'tour-guide'].map((role) => {
            const isTourGuide = role === 'tour-guide';
            const isCustomer = role === 'customer';
            const isActive = filterRole === role;

            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`whitespace-nowrap min-w-[6.5rem] flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                  isActive
                    ? isTourGuide
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : isTourGuide
                      ? 'bg-slate-900/60 text-amber-400 border-slate-800 hover:text-amber-300 hover:border-amber-500/20'
                      : 'bg-slate-900/60 text-purple-400 border-slate-800 hover:text-purple-300 hover:border-purple-500/20'
                }`}
              >
                {role === 'tour-guide' ? 'Tour Guide' : 'Customer'}
              </button>
            );
          })}
          {filterRole === 'tour-guide' && (
            <button
              onClick={handleAddNew}
              className="ml-auto flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Tour Guide
            </button>
          )}
        </div>
      </div>

      {editingId && (
        <div className="bg-slate-900/60 border border-cyan-500/50 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">
            {editingId === 'new' ? 'New Tour Guide' : 'Edit Tour Guide'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Email Address</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Contact Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Profile Picture (Attachment)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-cyan-400 file:font-semibold hover:file:bg-cyan-500/30"
              />
              {formData.profilePicture && (
                <p className="mt-1 text-xs text-slate-300">Selected file: {formData.profilePicture}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                <option value="">Select sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Birthdate</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Language Spoken</label>
              <input
                name="languageSpoken"
                value={formData.languageSpoken}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
            <button onClick={handleCancel} className="p-2 px-4 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer text-sm flex items-center gap-1">
              <X className="h-4 w-4" /> Cancel
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
            {isCustomerView ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Name</th>
                    <th className="p-4 font-bold uppercase">Email Address</th>
                    <th className="p-4 font-bold uppercase">Contact Number</th>
                    <th className="p-4 font-bold uppercase">Role</th>
                    <th className="p-4 font-bold uppercase">Status</th>
                    <th className="p-4 font-bold uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-900/20 align-top">
                        <td className="p-4 font-medium text-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                              {(acc.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate">{acc.name || `${acc.firstName || ''} ${acc.lastName || ''}`.trim()}</div>
                              <div className="text-[10px] text-purple-400 uppercase">Customer</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{acc.email || '—'}</td>
                        <td className="p-4 text-slate-400">{acc.phone || '—'}</td>
                        <td className="p-4 text-slate-400">{acc.role === 'tour-guide' ? 'Tour Guide' : 'Customer'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            acc.status === 'Active'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {acc.status || 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(acc.id)}
                              title={acc.status === 'Active' ? 'Deactivate' : 'Activate'}
                              className="p-2 rounded-full cursor-pointer border border-slate-800/30 text-slate-400 hover:bg-slate-800 focus:outline-none transition-colors"
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
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Name</th>
                    <th className="p-4 font-bold uppercase">Email Address</th>
                    <th className="p-4 font-bold uppercase">Contact Number</th>
                    <th className="p-4 font-bold uppercase">Sex</th>
                    <th className="p-4 font-bold uppercase">Birthdate</th>
                    <th className="p-4 font-bold uppercase">Years of Experience</th>
                    <th className="p-4 font-bold uppercase">Language Spoken</th>
                    <th className="p-4 font-bold uppercase">Description</th>
                    <th className="p-4 font-bold uppercase text-center">Availability</th>
                    <th className="p-4 font-bold uppercase text-center">Employment</th>
                    <th className="p-4 font-bold uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="p-8 text-center text-slate-500">
                        No tour guides found.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-900/20 align-top">
                        <td className="p-4 font-medium text-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                              {(acc.name || 'T').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate">{acc.name || `${acc.firstName || ''} ${acc.lastName || ''}`.trim()}</div>
                              <div className="text-[10px] text-amber-400 uppercase">Tour Guide</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{acc.email || '—'}</td>
                        <td className="p-4 text-slate-400">{acc.phone || '—'}</td>
                        <td className="p-4 text-slate-400">{acc.sex || '—'}</td>
                        <td className="p-4 text-slate-400">{acc.birthDate || '—'}</td>
                        <td className="p-4 text-slate-400">{acc.yearsExperience || '—'}</td>
                        <td className="p-4 text-slate-400">{acc.languageSpoken || '—'}</td>
                        <td className="p-4 text-slate-400 max-w-[16rem]">
                          <div className="line-clamp-3">{acc.description || '—'}</div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleAvailability(acc.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-none ${
                              acc.availability === 'Available'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            {acc.availability || 'Unavailable'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleEmployment(acc.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-none ${
                              acc.employmentStatus === 'Active'
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                                : 'bg-slate-700/70 text-slate-300 border border-slate-600 hover:bg-slate-800/50'
                            }`}
                          >
                            {acc.employmentStatus || 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(acc.id)}
                              title={acc.status === 'Active' ? 'Deactivate' : 'Activate'}
                              className="p-2 rounded-full cursor-pointer border border-slate-800/30 text-slate-400 hover:bg-slate-800 focus:outline-none transition-colors"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;
