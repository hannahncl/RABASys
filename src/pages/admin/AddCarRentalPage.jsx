import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, X } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { validateNumber, validatePlateNumber, validateRequired } from '../../utils/validation';

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
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSave = async () => {
    const nextErrors = {
      vehicle_name: validateRequired(formData.vehicle_name, 'Vehicle name'),
      vehicle_type: validateRequired(formData.vehicle_type, 'Vehicle type'),
      plate_number: validatePlateNumber(formData.plate_number),
      capacity: validateNumber(formData.capacity, 'Capacity', { min: 1, max: 100 }),
      daily_rate: validateNumber(formData.daily_rate, 'Daily rate', { min: 0 }),
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      showNotification('Please fix the highlighted fields before saving.', 'error');
      return;
    }

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
      });
      showNotification('Car rental created successfully', 'success');
      navigate('/admin/services');
    } catch (error) {
      showNotification(error.message || 'Failed to create car rental', 'error');
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
          Add Car Rental
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Vehicle Name</label>
            <input name="vehicle_name" value={formData.vehicle_name} onChange={handleChange} className={`w-full bg-slate-950 border rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none ${errors.vehicle_name ? 'border-rose-500' : 'border-slate-700'}`} />
            {errors.vehicle_name && <p className="mt-1 text-xs text-rose-400">{errors.vehicle_name}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Vehicle Type</label>
            <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className={`w-full bg-slate-950 border rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none ${errors.vehicle_type ? 'border-rose-500' : 'border-slate-700'}`}>
              <option value="">Select type...</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
              <option value="Pickup">Pickup</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Bus">Bus</option>
              <option value="Other">Other</option>
            </select>
            {errors.vehicle_type && <p className="mt-1 text-xs text-rose-400">{errors.vehicle_type}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Plate Number</label>
            <input name="plate_number" value={formData.plate_number} onChange={handleChange} className={`w-full bg-slate-950 border rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none ${errors.plate_number ? 'border-rose-500' : 'border-slate-700'}`} />
            {errors.plate_number && <p className="mt-1 text-xs text-rose-400">{errors.plate_number}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Capacity (Passengers)</label>
            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} className={`w-full bg-slate-950 border rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none ${errors.capacity ? 'border-rose-500' : 'border-slate-700'}`} />
            {errors.capacity && <p className="mt-1 text-xs text-rose-400">{errors.capacity}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Daily Rate (PHP)</label>
            <input name="daily_rate" type="number" min="0" step="0.01" value={formData.daily_rate} onChange={handleChange} className={`w-full bg-slate-950 border rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none ${errors.daily_rate ? 'border-rose-500' : 'border-slate-700'}`} />
            {errors.daily_rate && <p className="mt-1 text-xs text-rose-400">{errors.daily_rate}</p>}
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Availability Status</label>
            <select name="availability_status" value={formData.availability_status} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none">
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
              <option value="Maintenance">Under Maintenance</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Vehicle Image</label>
            <input name="image" type="file" accept="image/*" onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-cyan-400 file:font-semibold hover:file:bg-cyan-500/30" />
            {formData.image && (
              <img src={formData.image} alt="Vehicle preview" className="mt-3 h-32 w-full rounded-lg object-cover border border-slate-800" />
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
          <button onClick={() => navigate('/admin/services')} className="p-2 px-4 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer text-sm flex items-center gap-1">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button onClick={handleSave} className="p-2 px-4 text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg cursor-pointer text-sm font-bold flex items-center gap-1">
            <Save className="h-4 w-4" /> Save Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCarRentalPage;
