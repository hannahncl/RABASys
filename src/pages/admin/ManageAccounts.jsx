import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { accountService } from '../services/accountService';
import { Plus, Edit, Trash2, Save, X, Loader, UserCheck, UserX, Search, Users, ShieldCheck, Briefcase } from 'lucide-react';
=======
import { accountService } from '../../services/accountService';
import { Plus, Edit, Save, X, Loader, UserCheck, UserX, Search } from 'lucide-react';
>>>>>>> ad862ad748519c2d2ee7f9516014e8fcffc906e6
import { useNotification } from '../../hooks/useNotification';
import { validatePassword, validateEmail, validateName, validatePhone, sanitizeInput } from '../../utils/validation';

const ManageAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [filterRole, setFilterRole] = useState('tour-guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
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
      password: '',
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
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, profilePicture: file.name }));
  };

  const handleSave = async () => {
    const errors = {};
    errors.firstName = validateName(formData.firstName, 'First name');
    errors.lastName = validateName(formData.lastName, 'Last name');
    errors.email = validateEmail(formData.email);
    errors.phone = validatePhone(formData.phone);

    if (editingId === 'new') {
      errors.password = validatePassword(formData.password);
    }

    if (!formData.sex) {
      errors.sex = 'Sex is required.';
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Birthdate is required.';
    } else {
      const birthDateObj = new Date(formData.birthDate);
      const today = new Date();
      if (birthDateObj >= today) {
        errors.birthDate = 'Birthdate must be in the past.';
      }
    }

    if (formData.yearsExperience !== '' && formData.yearsExperience !== undefined) {
      const yoe = Number(formData.yearsExperience);
      if (!Number.isFinite(yoe) || yoe < 0) {
        errors.yearsExperience = 'Years of experience must be a valid positive number.';
      }
    }

    if (formData.languageSpoken) {
      const sanitized = sanitizeInput(formData.languageSpoken);
      if (!/^[A-Za-z\s,.'\-]+$/.test(sanitized)) {
        errors.languageSpoken = 'Language spoken can only contain letters and basic punctuation.';
      }
    }

    // Remove empty error entries
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification('Please fix the highlighted fields.', 'error');
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
      setFieldErrors({});
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
    <div className="space-y-8" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#d6cfc2] rounded-sm pl-10 pr-4 py-2.5 text-sm text-[#1a1a1a] focus:border-[#b0a68e] focus:outline-none"
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
                className={`whitespace-nowrap min-w-[6.5rem] flex items-center justify-center px-4 py-2 rounded-sm text-xs font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : isTourGuide
                      ? 'bg-white text-[#4a453b] border-[#d6cfc2] hover:bg-[#f7f4ef]'
                      : 'bg-white text-[#4a453b] border-[#d6cfc2] hover:bg-[#f7f4ef]'
                }`}
              >
                {role === 'tour-guide' ? 'Tour Guide' : 'Customer'}
              </button>
            );
          })}
          {filterRole === 'tour-guide' && (
            <button
              onClick={handleAddNew}
              className="ml-auto flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#333333] text-white px-4 py-2 rounded-sm font-medium text-sm transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Tour Guide
            </button>
          )}
        </div>
      </div>
      {editingId && (
        <div className="bg-white border border-[#e0dbd0] rounded-md p-8 space-y-6 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-850/50 pb-4">
            {editingId === 'new' ? 'Create Tour Guide' : 'Modify Tour Guide'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">First Name *</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^A-Za-z\s.'\-]/g, '');
                  setFormData(prev => ({ ...prev, firstName: val }));
                  if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: '' }));
                }}
                placeholder="e.g. John"
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.firstName ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              />
              {fieldErrors.firstName && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Last Name *</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^A-Za-z\s.'\-]/g, '');
                  setFormData(prev => ({ ...prev, lastName: val }));
                  if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: '' }));
                }}
                placeholder="e.g. Doe"
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.lastName ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              />
              {fieldErrors.lastName && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.lastName}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.email ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              />
              {fieldErrors.email && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.email}</p>}
            </div>
            {editingId === 'new' && (
              <div>
                <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength="8"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.password ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
                />
                <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500 font-medium">Use at least 8 characters, including one uppercase letter and one number.</p>
                {fieldErrors.password && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.password}</p>}
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Contact Number *</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9+\-()\s]/g, '');
                  setFormData(prev => ({ ...prev, phone: val }));
                  if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder="e.g. +63 9123456789"
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.phone ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              />
              {fieldErrors.phone && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.phone}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Profile Picture (Attachment)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-900/20 border border-slate-800 hover:border-slate-750 transition-colors rounded-xl py-2.5 px-3.5 text-xs text-slate-350 file:mr-3.5 file:rounded-lg file:border-0 file:bg-slate-800/80 file:px-4 file:py-1.5 file:text-xs file:text-slate-200 file:font-semibold hover:file:bg-slate-800 cursor-pointer"
              />
              {formData.profilePicture && (
                <p className="mt-2 text-xs text-slate-400">Selected file: <span className="font-semibold text-slate-200">{formData.profilePicture}</span></p>
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Sex *</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer ${fieldErrors.sex ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              >
                <option value="" className="bg-slate-950 text-slate-400">Select sex</option>
                <option value="Male" className="bg-slate-950 text-slate-200">Male</option>
                <option value="Female" className="bg-slate-950 text-slate-200">Female</option>
                <option value="Other" className="bg-slate-950 text-slate-200">Other</option>
              </select>
              {fieldErrors.sex && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.sex}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Birthdate *</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.birthDate ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              />
              {fieldErrors.birthDate && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.birthDate}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Years of Experience</label>
              <input
                type="number"
                min="0"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setFormData(prev => ({ ...prev, yearsExperience: val }));
                  if (fieldErrors.yearsExperience) setFieldErrors(prev => ({ ...prev, yearsExperience: '' }));
                }}
                placeholder="e.g. 5"
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.yearsExperience ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              />
              {fieldErrors.yearsExperience && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.yearsExperience}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Language Spoken</label>
              <input
                name="languageSpoken"
                value={formData.languageSpoken}
                onChange={handleChange}
                placeholder="e.g. English, Filipino"
                className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${fieldErrors.languageSpoken ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
              />
              {fieldErrors.languageSpoken && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{fieldErrors.languageSpoken}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Provide a brief background info..."
                className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-655 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-5 border-t border-slate-850/50">
            <button 
              onClick={handleCancel} 
              className="px-5 py-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-slate-800 rounded-xl cursor-pointer text-sm font-semibold transition-all flex items-center gap-1.5"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="px-6 py-2.5 text-slate-950 bg-slate-100 hover:bg-white rounded-xl cursor-pointer text-sm font-bold transition-all flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>
      )}

      {!editingId && (
        <div className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            {isCustomerView ? (
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#faf9f6] border-b border-[#eae5db] text-[#6b6255]">
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
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#faf9f6] border-b border-[#eae5db] text-[#6b6255]">
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
                          <div className="truncate max-w-[16rem]">{acc.description || '—'}</div>
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
