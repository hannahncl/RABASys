import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft, X } from 'lucide-react';
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
    const required = ['vehicle_name', 'vehicle_type', 'plate_number', 'capacity', 'daily_rate'];
    const missing = required.filter(field => !String(formData[field]).trim());
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
        className="flex items-center gap-2 text-sm text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Services
      </button>

      <div className="bg-slate-900/60 border border-cyan-500/50 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">
          Edit Car Rental
        </h3>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Update the vehicle rental details below.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Vehicle Name</label>
            <input name="vehicle_name" value={formData.vehicle_name} onChange={handleChange} placeholder="e.g. Toyota HiAce" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Vehicle Type</label>
            <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none">
              <option value="">Select type...</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
              <option value="Pickup">Pickup</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Bus">Bus</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Plate Number</label>
            <input name="plate_number" value={formData.plate_number} onChange={handleChange} placeholder="e.g. ABC 1234" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Capacity (Passengers)</label>
            <input name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} placeholder="e.g. 7" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Daily Rate (PHP)</label>
            <input name="daily_rate" type="number" min="0" step="0.01" value={formData.daily_rate} onChange={handleChange} placeholder="e.g. 3500" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
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
            <Save className="h-4 w-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCarRentalPage;
