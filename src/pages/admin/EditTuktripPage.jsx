import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, X } from 'lucide-react';
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
    itinerary: '',
    image: ''
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
          itinerary: Array.isArray(item.itinerary) ? item.itinerary.map(entry => entry.title || entry.desc || '').join('\n') : (item.itinerary || ''),
          image: item.image || ''
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

  const handleImageSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
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
        packageType: 'tuktrip',
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
        image: formData.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800',
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

      <div className="bg-slate-900/60 border border-cyan-500/50 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">
          Edit Tuktrip
        </h3>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Update the tuktrip package details below.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Package Name</label>
            <input name="packageName" value={formData.packageName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Destination</label>
            <input name="destination" value={formData.destination} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Price</label>
              <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Duration</label>
              <input name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Maximum Capacity</label>
            <input name="maximumCapacity" type="number" value={formData.maximumCapacity} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Meeting Location</label>
            <input name="meetingLocation" value={formData.meetingLocation} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Inclusions</label>
            <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} rows={2} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Itinerary</label>
            <textarea name="itinerary" value={formData.itinerary} onChange={handleChange} rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Package Image</label>
            <input type="file" accept="image/*" onChange={handleImageSelection} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-cyan-500 file:text-slate-950" />
            <input name="image" value={formData.image} onChange={handleChange} placeholder="Or paste an image URL" className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="mt-3 h-32 w-full object-cover rounded-lg border border-slate-700" />
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
          <button onClick={() => navigate('/admin/services')} className="p-2 px-4 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer text-sm flex items-center gap-1">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button onClick={handleSave} className="p-2 px-4 text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg cursor-pointer text-sm font-bold flex items-center gap-1">
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTuktripPage;
