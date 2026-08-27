import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { serviceService } from '../services/serviceService';
import { Save, ArrowLeft } from 'lucide-react';
=======
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, X } from 'lucide-react';
>>>>>>> ad862ad748519c2d2ee7f9516014e8fcffc906e6
import { useNotification } from '../../hooks/useNotification';
import { readImageAsDataUrl } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';
import { normalizeFrontendRole } from '../../contexts/AuthContext';

const AddTourPackagePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelection = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    try {
      const image = await compressPackageImage(file);
      setFormData(prev => ({ ...prev, image }));
    } catch (error) {
      e.target.value = '';
      showNotification(error.message || 'Failed to process the image.', 'error');
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleSave = async () => {
    const required = ['packageName', 'description', 'destination', 'price', 'duration', 'inclusions', 'maximumCapacity', 'meetingLocation', 'itinerary'];
    const missing = required.filter(field => !String(formData[field]).trim());

    if (missing.length > 0) {
      showNotification('Please complete all fields before saving.', 'error');
      return;
    }

    if (!user || normalizeFrontendRole(user.role) !== 'admin') {
      showNotification('Please sign in as an admin before creating a package.', 'error');
      return;
    }

    const storedToken = localStorage.getItem('rabas_auth_token') || JSON.parse(localStorage.getItem('rabas_current_user') || 'null')?.token;
    if (!storedToken) {
      showNotification('Your admin session has expired. Please sign in again.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        category: 'tour',
        packageType: 'tour',
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
        image: formData.image || '/CAGSAWA.jpg',
        tags: [formData.destination.trim(), 'Tour Package']
      };

      await serviceService.create({ ...payload, id: Date.now().toString() });
      showNotification('Tour package created successfully', 'success');
      navigate('/admin/services');
    } catch (error) {
      const message = error?.message || 'Failed to create tour package';
      showNotification(message.includes('Authentication') || message.includes('permission')
        ? 'Your admin session could not be verified. Please sign in again and try once more.'
        : message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/services')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Services
      </button>

      <div className="bg-slate-900/30 border border-slate-850 backdrop-blur-md rounded-3xl p-8 space-y-6 transition-all duration-300">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-850/50 pb-4">
          Add Tour Package
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Package Name</label>
            <input 
              name="packageName" 
              value={formData.packageName} 
              onChange={handleChange} 
              placeholder="e.g. Bicol Adventure Escape"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Destination</label>
            <input 
              name="destination" 
              value={formData.destination} 
              onChange={handleChange} 
              placeholder="e.g. Legazpi, Albay"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Price</label>
              <input 
                name="price" 
                type="number" 
                value={formData.price} 
                onChange={handleChange} 
                placeholder="e.g. 18500"
                className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Duration</label>
              <input 
                name="duration" 
                value={formData.duration} 
                onChange={handleChange} 
                placeholder="e.g. 3 Days, 2 Nights"
                className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Maximum Capacity</label>
            <input 
              name="maximumCapacity" 
              type="number" 
              value={formData.maximumCapacity} 
              onChange={handleChange} 
              placeholder="e.g. 12"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Meeting Location</label>
            <input 
              name="meetingLocation" 
              value={formData.meetingLocation} 
              onChange={handleChange} 
              placeholder="e.g. Legazpi Airport"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={3} 
              placeholder="Describe the tour experience..."
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-655 focus:outline-none transition-all resize-none" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Inclusions</label>
            <textarea 
              name="inclusions" 
              value={formData.inclusions} 
              onChange={handleChange} 
              rows={2} 
              placeholder="Transport, meals, guide, entrance fees (comma-separated)"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-655 focus:outline-none transition-all resize-none" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Itinerary</label>
            <textarea 
              name="itinerary" 
              value={formData.itinerary} 
              onChange={handleChange} 
              rows={4} 
              placeholder="Day 1: Arrival and welcome dinner&#10;Day 2: Adventure activity"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-655 focus:outline-none transition-all resize-none" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Package Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelection} 
              className="w-full bg-slate-900/20 border border-slate-800 hover:border-slate-750 transition-colors rounded-xl py-2.5 px-3.5 text-xs text-slate-350 file:mr-3.5 file:rounded-lg file:border-0 file:bg-slate-800/80 file:px-4 file:py-1.5 file:text-xs file:text-slate-200 file:font-semibold hover:file:bg-slate-800 cursor-pointer" 
            />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="mt-4 h-48 w-full object-cover rounded-2xl border border-slate-800" />
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-5 border-t border-slate-850/50">
          <button 
            onClick={() => navigate('/admin/services')} 
            disabled={isSubmitting} 
            className="px-5 py-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-slate-800 rounded-xl cursor-pointer text-sm font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
          <button 
            disabled={isCompressingImage || isSubmitting} 
            onClick={handleSave} 
            className="px-6 py-2.5 text-slate-950 bg-slate-100 hover:bg-white rounded-xl cursor-pointer text-sm font-bold transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" /> {isCompressingImage ? 'Processing Image...' : isSubmitting ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTourPackagePage;
