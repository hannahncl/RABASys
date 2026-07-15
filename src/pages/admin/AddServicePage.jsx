import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Save } from 'lucide-react';
import { serviceService } from '../../services/serviceService';
import { useNotification } from '../../hooks/useNotification';

const AddServicePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({ serviceName: '', description: '' });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    try {
      const payload = {
        id: Date.now().toString(),
        title: formData.serviceName.trim() || 'Untitled Service',
        description: formData.description.trim(),
        category: 'service'
      };

      await serviceService.create(payload);
      showNotification('Service created successfully', 'success');
      navigate('/admin/services');
    } catch (err) {
      showNotification('Failed to create service', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/services')} className="flex items-center gap-2 text-sm text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to Services
      </button>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display text-slate-100">Add Service</h1>
          <p className="text-sm text-slate-400">Create a generic service entry. Fields: service name and description.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Service Name</label>
            <input name="serviceName" value={formData.serviceName} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <button onClick={() => navigate('/admin/services')} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-500 text-slate-900 rounded-lg">
            <Save className="h-4 w-4" /> Save Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddServicePage;
