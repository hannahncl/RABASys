import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, X } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
<<<<<<<<< Temporary merge branch 1
import { readImageAsDataUrl } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';
import { normalizeFrontendRole } from '../../contexts/AuthContext';

const AddTourPackagePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
=========
  const [isCompressingImage, setIsCompressingImage] = useState(false);
>>>>>>>>> Temporary merge branch 2
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
        className="flex items-center gap-2 text-sm text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Services
      </button>

      <div className="bg-slate-900/60 border border-cyan-500/50 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">
          Add Tour Package
        </h3>


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
            {formData.image && (
              <img src={formData.image} alt="Preview" className="mt-3 h-32 w-full object-cover rounded-lg border border-slate-700" />
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
          <button onClick={() => navigate('/admin/services')} disabled={isSubmitting} className="p-2 px-4 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer text-sm flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button disabled={isCompressingImage || isSubmitting} onClick={handleSave} className="p-2 px-4 text-slate-950 bg-cyan-400 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg cursor-pointer text-sm font-bold flex items-center gap-1">
            <Save className="h-4 w-4" /> {isCompressingImage ? 'Processing Image...' : isSubmitting ? 'Saving...' : 'Save Package'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTourPackagePage;
