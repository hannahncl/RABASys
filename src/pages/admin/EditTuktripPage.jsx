import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const EditTuktripPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    packageName: '',
    description: '',
    destination: '',
    price: '',
    duration: '',
    inclusions: '',
    maximumCapacity: '',
    meetingLocation: '',
    itinerary: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      try {
        const item = await serviceService.getById(id);
        if (!item) {
          showNotification('Tuktrip not found.', 'error');
          navigate('/admin/services');
          return;
        }

        setFormData({
          packageName: item.packageName || item.title || '',
          description: item.description || '',
          destination: item.destination || '',
          price: item.price != null ? String(item.price) : '',
          duration: item.duration || '',
          inclusions: Array.isArray(item.inclusions) ? item.inclusions.join(', ') : (item.inclusions || ''),
          maximumCapacity: item.maximumCapacity != null ? String(item.maximumCapacity) : '',
          meetingLocation: item.meetingLocation || '',
          itinerary: Array.isArray(item.itinerary) ? item.itinerary.map(entry => entry.title || entry.desc || '').join('\n') : (item.itinerary || '')
        });
      } catch {
        showNotification('Failed to load tuktrip details.', 'error');
        navigate('/admin/services');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, navigate, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const required = ['packageName', 'description', 'destination', 'price', 'duration', 'inclusions', 'maximumCapacity', 'meetingLocation', 'itinerary'];
    const missing = required.filter(field => !String(formData[field]).trim());
    if (missing.length > 0) {
      showNotification('Please complete all fields before saving.', 'error');
      return;
    }

    try {
      const payload = {
        category: 'tuktrip',
        title: formData.packageName.trim(),
        packageName: formData.packageName.trim(),
        description: formData.description.trim(),
        destination: formData.destination.trim(),
        price: Number(formData.price),
        duration: formData.duration.trim(),
        inclusions: formData.inclusions.split(',').map(item => item.trim()).filter(Boolean),
        maximumCapacity: Number(formData.maximumCapacity),
        meetingLocation: formData.meetingLocation.trim(),
        itinerary: formData.itinerary
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(Boolean)
          .map((line, index) => ({ day: index + 1, title: line, desc: line })),
        tags: [formData.destination.trim(), 'Tuktrip']
      };

      await serviceService.update(id, payload);
      showNotification('Tuktrip updated successfully', 'success');
      navigate('/admin/services');
    } catch {
      showNotification('Failed to update tuktrip', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="text-slate-400">Loading tuktrip...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/services')}
        className="flex items-center gap-2 text-sm text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Services
      </button>

      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/70 p-6 shadow-2xl shadow-amber-950/20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display text-slate-100">Edit Tuktrip</h1>
          <p className="text-sm text-slate-400">Update the tuktrip package details below.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Package Name</label>
              <input name="packageName" value={formData.packageName} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Destination</label>
              <input name="destination" value={formData.destination} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Price</label>
                <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Duration</label>
                <input name="duration" value={formData.duration} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Inclusions</label>
              <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} rows={3} className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Maximum Capacity</label>
              <input name="maximumCapacity" type="number" value={formData.maximumCapacity} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Meeting Location</label>
              <input name="meetingLocation" value={formData.meetingLocation} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Itinerary</label>
              <textarea name="itinerary" value={formData.itinerary} onChange={handleChange} rows={5} className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-500">
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTuktripPage;
