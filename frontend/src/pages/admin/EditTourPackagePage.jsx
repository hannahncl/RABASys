import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, X } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { compressPackageImage } from '../../utils/compressPackageImage';

const EditTourPackagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { confirm } = useConfirmation();
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [packageType, setPackageType] = useState('exclusive');
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
    image: '',
    images: [],
    availabilityStatus: 'Available',
    joinerDate: '',
    joinerSlots: '',
    joinerBookingDeadline: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      try {
        const item = await serviceService.getById(id);
        if (!item) {
          showNotification('Tour package not found.', 'error');
          navigate('/admin/tour-packages');
          return;
        }

        const type = ['exclusive', 'joiner', 'tuktrip'].includes(item.packageType) ? item.packageType : 'exclusive';
        setPackageType(type);

        const images = Array.isArray(item.images) && item.images.length
          ? item.images
          : (item.image ? [item.image] : []);
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
          image: images[0] || item.image || '',
          images,
          availabilityStatus: item.availabilityStatus || item.availability_status || 'Available',
          joinerDate: item.joinerDate || '',
          joinerSlots: item.joinerSlots != null ? String(item.joinerSlots) : '',
          joinerBookingDeadline: item.joinerBookingDeadline || ''
        });
      } catch {
        showNotification('Failed to load tour package details.', 'error');
        navigate('/admin/tour-packages');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, navigate, showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => name === 'image'
      ? { ...prev, image: value, images: value ? [value, ...prev.images.filter(image => image !== prev.image && image !== value)] : prev.images }
      : { ...prev, [name]: value });
  };

  const handleImageSelection = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsCompressingImage(true);
    try {
      const selectedImages = await Promise.all(files.slice(0, 8).map(compressPackageImage));
      setFormData(prev => ({
        ...prev,
        image: prev.images[0] || selectedImages[0] || '',
        images: [...prev.images, ...selectedImages].slice(0, 8),
      }));
    } catch (error) {
      e.target.value = '';
      showNotification(error.message || 'Failed to process the selected images.', 'error');
    } finally {
      setIsCompressingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => {
      const images = prev.images.filter((_, imageIndex) => imageIndex !== index);
      return { ...prev, images, image: images[0] || '' };
    });
  };

  const handleSave = async () => {
    if (!(await confirm('Are you sure you want to save these tour package changes?'))) return;
    const required = ['packageName', 'description', 'destination', 'price', 'duration', 'inclusions', 'maximumCapacity', 'meetingLocation', 'itinerary'];
    const joinerRequired = packageType === 'joiner' ? ['joinerDate', 'joinerSlots', 'joinerBookingDeadline'] : [];
    const missing = [...required, ...joinerRequired].filter(field => !String(formData[field]).trim());
    if (missing.length > 0) {
      showNotification('Please complete all fields before saving.', 'error');
      return;
    }
    if (packageType === 'joiner' && formData.joinerBookingDeadline > formData.joinerDate) {
      showNotification('The booking deadline must be on or before the trip date.', 'error');
      return;
    }
    if (packageType === 'joiner' && (!Number.isInteger(Number(formData.joinerSlots)) || Number(formData.joinerSlots) < 1)) {
      showNotification('Joiner slots must be a positive whole number.', 'error');
      return;
    }
    if (packageType === 'joiner' && (!Number.isInteger(Number(formData.maximumCapacity)) || Number(formData.maximumCapacity) < 1)) {
      showNotification('Maximum capacity must be a positive whole number for Joiner trips.', 'error');
      return;
    }

    try {
      const payload = {
        category: 'tour',
        packageType,
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
        joinerDate: packageType === 'joiner' ? formData.joinerDate : null,
        joinerSlots: packageType === 'joiner' ? Number(formData.joinerSlots) : null,
        joinerBookingDeadline: packageType === 'joiner' ? formData.joinerBookingDeadline : null,
        image: formData.images[0] || formData.image || '/CAGSAWA.jpg',
        images: formData.images.length ? formData.images : [formData.image || '/CAGSAWA.jpg'],
        availabilityStatus: formData.availabilityStatus,
        tags: [formData.destination.trim(), 'Tour Package']
      };

      await serviceService.update(id, payload);
      showNotification('Tour package updated successfully', 'success');
      navigate('/admin/tour-packages');
    } catch (error) {
      showNotification(error?.message || 'Failed to update tour package', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="text-slate-400">Loading tour package...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/tour-packages')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tour Packages
      </button>

      <div className="bg-slate-900/30 border border-slate-850 backdrop-blur-md rounded-3xl p-8 space-y-6 transition-all duration-300">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-850/50 pb-4">
          Edit {packageType === 'joiner' ? 'Joiner Tour Package' : packageType === 'tuktrip' ? 'Tuktrip' : 'Exclusive Tour Package'}
        </h3>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Update the tour package details below.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Package Name</label>
            <input name="packageName" value={formData.packageName} onChange={handleChange} placeholder="e.g. Bicol Adventure Escape" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Destination</label>
            <input name="destination" value={formData.destination} onChange={handleChange} placeholder="e.g. Legazpi, Albay" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Price</label>
              <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="e.g. 18500" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Duration</label>
              <input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 3 Days, 2 Nights" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Maximum Capacity</label>
            <input name="maximumCapacity" type="number" value={formData.maximumCapacity} onChange={handleChange} placeholder="e.g. 12" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Meeting Location</label>
            <input name="meetingLocation" value={formData.meetingLocation} onChange={handleChange} placeholder="e.g. Legazpi Airport" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" />
          </div>
          {packageType === 'joiner' && (
            <div className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-300">Joiner Schedule & Availability</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Trip Date</label>
                  <input name="joinerDate" type="date" value={formData.joinerDate} onChange={handleChange} className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Available Slots</label>
                  <input name="joinerSlots" type="number" min="1" value={formData.joinerSlots} onChange={handleChange} placeholder="e.g. 12" className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Booking Deadline</label>
                  <input name="joinerBookingDeadline" type="date" max={formData.joinerDate || undefined} value={formData.joinerBookingDeadline} onChange={handleChange} className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none" />
                  <p className="mt-1 text-[10px] text-slate-500">Last day to book; must be on or before the trip date.</p>
                </div>
              </div>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the tour experience..." className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-655 focus:outline-none transition-all resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Inclusions</label>
            <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} rows={2} placeholder="Transport, meals, guide, entrance fees (comma-separated)" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-655 focus:outline-none transition-all resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Itinerary</label>
            <textarea name="itinerary" value={formData.itinerary} onChange={handleChange} rows={4} placeholder="Day 1: Arrival and welcome dinner&#10;Day 2: Adventure activity" className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-655 focus:outline-none transition-all resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Package Photos</label>
            <input type="file" accept="image/*" multiple onChange={handleImageSelection} className="w-full bg-slate-900/20 border border-slate-800 hover:border-slate-750 transition-colors rounded-xl py-2.5 px-3.5 text-xs text-slate-350 file:mr-3.5 file:rounded-lg file:border-0 file:bg-slate-800/80 file:px-4 file:py-1.5 file:text-xs file:text-slate-200 file:font-semibold hover:file:bg-slate-800 cursor-pointer" />
            <input name="image" value={formData.image} onChange={handleChange} placeholder="Or paste a cover image URL" className="w-full mt-2 bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" />
            <p className="mt-2 text-[10px] text-slate-500">Select up to 8 photos. The first photo will be used as the cover image.</p>
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {formData.images.map((image, index) => (
                  <div key={`${image}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
                    <img src={image} alt={`Package preview ${index + 1}`} className="h-full w-full object-cover" />
                    {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-800">Cover</span>}
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100" aria-label={`Remove photo ${index + 1}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-5 border-t border-slate-850/50">
          <button onClick={() => navigate('/admin/tour-packages')} disabled={isCompressingImage} className="px-5 py-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-slate-800 rounded-xl cursor-pointer text-sm font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button disabled={isCompressingImage} onClick={handleSave} className="px-6 py-2.5 text-white bg-[#1a1a1a] hover:bg-[#333333] rounded-xl cursor-pointer text-sm font-bold transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
            <Save className="h-4 w-4" /> {isCompressingImage ? 'Processing Image...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTourPackagePage;
