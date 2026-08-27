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
import { validateNumber, validatePlateNumber, validateRequired } from '../../utils/validation';
import { compressPackageImage } from '../../utils/compressPackageImage';

const AddCarRentalPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    vehicle_name: '',
    vehicle_type: '',
    plate_number: '',
    capacity: '',
    daily_rate: '',
    availability_status: 'Available',
    image: '',
    fuel_type: '',
    vehicle_brand: '',
    transmission: '',
  });
  const [errors, setErrors] = useState({});
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
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
    const nextErrors = {
      vehicle_name: validateRequired(formData.vehicle_name, 'Vehicle name'),
      vehicle_type: validateRequired(formData.vehicle_type, 'Vehicle type'),
      plate_number: validatePlateNumber(formData.plate_number),
      capacity: validateNumber(formData.capacity, 'Capacity', { min: 1, max: 100 }),
      daily_rate: validateNumber(formData.daily_rate, 'Daily rate', { min: 0 }),
      fuel_type: validateRequired(formData.fuel_type, 'Fuel type'),
      vehicle_brand: validateRequired(formData.vehicle_brand, 'Vehicle brand'),
      transmission: validateRequired(formData.transmission, 'Transmission'),
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      showNotification('Please fix the highlighted fields before saving.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await serviceService.create({
        category: 'car',
        vehicleName: formData.vehicle_name.trim(),
        vehicleType: formData.vehicle_type.trim(),
        plateNumber: formData.plate_number.trim(),
        seatingCapacity: formData.capacity,
        dailyRate: Number(formData.daily_rate),
        availabilityStatus: formData.availability_status,
        vehicleImage: formData.image || null,
        fuelType: formData.fuel_type.trim(),
        vehicleBrand: formData.vehicle_brand.trim(),
        transmission: formData.transmission,
      });
      showNotification('Car rental created successfully', 'success');
      navigate('/admin/services');
    } catch (error) {
      showNotification(error.message || 'Failed to create car rental', 'error');
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
          Add Car Rental
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Vehicle Name</label>
            <input 
              name="vehicle_name" 
              value={formData.vehicle_name} 
              onChange={handleChange} 
              placeholder="e.g. Toyota HiAce"
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${errors.vehicle_name ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`} 
            />
            {errors.vehicle_name && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.vehicle_name}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Vehicle Type</label>
            <select 
              name="vehicle_type" 
              value={formData.vehicle_type} 
              onChange={handleChange} 
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer ${errors.vehicle_type ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
            >
              <option value="" className="bg-slate-950 text-slate-400">Select type...</option>
              <option value="Sedan" className="bg-slate-950 text-slate-200">Sedan</option>
              <option value="SUV" className="bg-slate-950 text-slate-200">SUV</option>
              <option value="Van" className="bg-slate-950 text-slate-200">Van</option>
              <option value="Pickup" className="bg-slate-950 text-slate-200">Pickup</option>
              <option value="Motorcycle" className="bg-slate-950 text-slate-200">Motorcycle</option>
              <option value="Bus" className="bg-slate-950 text-slate-200">Bus</option>
              <option value="Other" className="bg-slate-950 text-slate-200">Other</option>
            </select>
            {errors.vehicle_type && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.vehicle_type}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Plate Number</label>
            <input 
              name="plate_number" 
              value={formData.plate_number} 
              onChange={handleChange} 
              placeholder="e.g. ABC 1234"
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${errors.plate_number ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`} 
            />
            {errors.plate_number && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.plate_number}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Capacity (Passengers)</label>
            <input 
              name="capacity" 
              type="number" 
              min="1" 
              value={formData.capacity} 
              onChange={handleChange} 
              placeholder="e.g. 7"
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${errors.capacity ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`} 
            />
            {errors.capacity && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.capacity}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Daily Rate (PHP)</label>
            <input 
              name="daily_rate" 
              type="number" 
              min="0" 
              step="0.01" 
              value={formData.daily_rate} 
              onChange={handleChange} 
              placeholder="e.g. 3500"
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${errors.daily_rate ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`} 
            />
            {errors.daily_rate && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.daily_rate}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Availability Status</label>
            <select 
              name="availability_status" 
              value={formData.availability_status} 
              onChange={handleChange} 
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
            >
              <option value="Available" className="bg-slate-950 text-slate-200">Available</option>
              <option value="Unavailable" className="bg-slate-950 text-slate-200">Unavailable</option>
              <option value="Maintenance" className="bg-slate-950 text-slate-200">Under Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Vehicle Brand</label>
            <input 
              name="vehicle_brand" 
              value={formData.vehicle_brand} 
              onChange={handleChange} 
              placeholder="e.g. Toyota" 
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${errors.vehicle_brand ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`} 
            />
            {errors.vehicle_brand && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.vehicle_brand}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Fuel Type</label>
            <select 
              name="fuel_type" 
              value={formData.fuel_type} 
              onChange={handleChange} 
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer ${errors.fuel_type ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
            >
              <option value="" className="bg-slate-950 text-slate-400">Select fuel...</option>
              <option value="Gasoline" className="bg-slate-950 text-slate-200">Gasoline</option>
              <option value="Diesel" className="bg-slate-950 text-slate-200">Diesel</option>
              <option value="Hybrid" className="bg-slate-950 text-slate-200">Hybrid</option>
              <option value="Electric" className="bg-slate-950 text-slate-200">Electric</option>
            </select>
            {errors.fuel_type && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.fuel_type}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Transmission</label>
            <select 
              name="transmission" 
              value={formData.transmission} 
              onChange={handleChange} 
              className={`w-full bg-slate-900/40 border rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer ${errors.transmission ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' : 'border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20'}`}
            >
              <option value="" className="bg-slate-950 text-slate-400">Select transmission...</option>
              <option value="Automatic" className="bg-slate-950 text-slate-200">Automatic</option>
              <option value="Manual" className="bg-slate-950 text-slate-200">Manual</option>
            </select>
            {errors.transmission && <p className="mt-1.5 text-[11px] text-rose-455 font-medium">{errors.transmission}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Vehicle Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelection} 
              className="w-full bg-slate-900/20 border border-slate-800 hover:border-slate-750 transition-colors rounded-xl py-2.5 px-3.5 text-xs text-slate-350 file:mr-3.5 file:rounded-lg file:border-0 file:bg-slate-800/80 file:px-4 file:py-1.5 file:text-xs file:text-slate-200 file:font-semibold hover:file:bg-slate-800 cursor-pointer" 
            />
            {formData.image && (
              <img src={formData.image} alt="Vehicle preview" className="mt-4 h-48 w-full rounded-2xl object-cover border border-slate-800" />
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
            onClick={handleSave} 
            disabled={isCompressingImage || isSubmitting} 
            className="px-6 py-2.5 text-slate-950 bg-slate-100 hover:bg-white rounded-xl cursor-pointer text-sm font-bold transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" /> {isCompressingImage ? 'Processing Image...' : isSubmitting ? 'Saving...' : 'Save Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCarRentalPage;
