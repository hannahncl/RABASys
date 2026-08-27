import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
<<<<<<< HEAD
import { serviceService } from '../services/serviceService';
import { Save, ArrowLeft } from 'lucide-react';
=======
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, X } from 'lucide-react';
>>>>>>> ad862ad748519c2d2ee7f9516014e8fcffc906e6
import { useNotification } from '../../hooks/useNotification';

const EditCarRentalPage = () => {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const item = await serviceService.getById(id, 'car');
        if (!item) {
          showNotification('Car rental not found.', 'error');
          navigate('/admin/services');
          return;
        }

        setFormData({
          vehicle_name: item.vehicle_name || item.vehicleName || item.title || '',
          vehicle_type: item.vehicle_type || item.vehicleType || '',
          plate_number: item.plate_number || item.plateNumber || '',
          capacity: item.capacity != null ? String(item.capacity) : '',
          daily_rate: item.daily_rate != null ? String(item.daily_rate) : (item.dailyRate != null ? String(item.dailyRate) : ''),
          availability_status: item.availability_status || item.availabilityStatus || 'Available',
          image: item.image || '',
          fuel_type: item.fuel_type || item.fuelType || '',
          vehicle_brand: item.vehicle_brand || item.vehicleBrand || '',
          transmission: item.transmission || '',
        });
      } catch {
        showNotification('Failed to load car rental details.', 'error');
        navigate('/admin/services');
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [id, navigate, showNotification]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(files[0]);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const required = ['vehicle_name', 'vehicle_type', 'plate_number', 'capacity', 'daily_rate', 'fuel_type', 'vehicle_brand', 'transmission'];
    const missing = required.filter(field => !String(formData[field] || '').trim());
    if (missing.length > 0) {
      showNotification('Please complete all fields before saving.', 'error');
      return;
    }

    try {
      await serviceService.update(id, {
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
      showNotification('Car rental updated successfully', 'success');
      navigate('/admin/services');
    } catch (error) {
      showNotification(error.message || 'Failed to update car rental', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="text-slate-400">Loading car rental...</div>
      </div>
    );
  }

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
          Edit Car Rental
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Vehicle Name</label>
            <input 
              name="vehicle_name" 
              value={formData.vehicle_name} 
              onChange={handleChange} 
              placeholder="e.g. Toyota HiAce"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Vehicle Type</label>
            <select 
              name="vehicle_type" 
              value={formData.vehicle_type} 
              onChange={handleChange} 
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
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
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Plate Number</label>
            <input 
              name="plate_number" 
              value={formData.plate_number} 
              onChange={handleChange} 
              placeholder="e.g. ABC 1234"
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
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
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
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
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
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
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Fuel Type</label>
            <select 
              name="fuel_type" 
              value={formData.fuel_type} 
              onChange={handleChange} 
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
            >
              <option value="" className="bg-slate-950 text-slate-400">Select fuel...</option>
              <option value="Gasoline" className="bg-slate-950 text-slate-200">Gasoline</option>
              <option value="Diesel" className="bg-slate-950 text-slate-200">Diesel</option>
              <option value="Hybrid" className="bg-slate-950 text-slate-200">Hybrid</option>
              <option value="Electric" className="bg-slate-950 text-slate-200">Electric</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Transmission</label>
            <select 
              name="transmission" 
              value={formData.transmission} 
              onChange={handleChange} 
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 focus:ring-1 focus:ring-slate-700/20 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
            >
              <option value="" className="bg-slate-950 text-slate-400">Select transmission...</option>
              <option value="Automatic" className="bg-slate-950 text-slate-200">Automatic</option>
              <option value="Manual" className="bg-slate-950 text-slate-200">Manual</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-2">Vehicle Image</label>
            <input 
              name="image" 
              type="file" 
              accept="image/*" 
              onChange={handleChange} 
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
            className="px-5 py-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border border-slate-800 rounded-xl cursor-pointer text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2.5 text-slate-950 bg-slate-100 hover:bg-white rounded-xl cursor-pointer text-sm font-bold transition-all flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCarRentalPage;
