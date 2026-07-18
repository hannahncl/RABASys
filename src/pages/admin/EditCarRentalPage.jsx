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
    vehicleName: '',
    vehicleType: '',
    plateNumber: '',
    seatingCapacity: '',
    dailyRate: '',
    vehicleImage: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      try {
        const item = await serviceService.getById(id);
        if (!item) {
          showNotification('Car rental not found.', 'error');
          navigate('/admin/services');
          return;
        }

        setFormData({
          vehicleName: item.vehicleName || item.title || '',
          vehicleType: item.vehicleType || '',
          plateNumber: item.plateNumber || '',
          seatingCapacity: item.capacity != null ? String(item.capacity) : '',
          dailyRate: item.price != null ? String(item.price) : '',
          vehicleImage: item.image || ''
        });
      } catch {
        showNotification('Failed to load car rental details.', 'error');
        navigate('/admin/services');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, navigate, showNotification]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'vehicleImage' && files && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, vehicleImage: reader.result }));
      };
      reader.readAsDataURL(files[0]);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const required = ['vehicleName', 'vehicleType', 'plateNumber', 'seatingCapacity', 'dailyRate', 'vehicleImage'];
    const missing = required.filter(field => !String(formData[field]).trim());
    if (missing.length > 0) {
      showNotification('Please complete all fields before saving.', 'error');
      return;
    }

    try {
      const payload = {
        category: 'car',
        title: formData.vehicleName.trim(),
        vehicleName: formData.vehicleName.trim(),
        vehicleType: formData.vehicleType.trim(),
        plateNumber: formData.plateNumber.trim(),
        capacity: formData.seatingCapacity.trim(),
        price: Number(formData.dailyRate),
        image: formData.vehicleImage.trim(),
        description: `${formData.vehicleName.trim()} available for daily rental.`,
        destination: 'Bicol Region',
        duration: 'Per Day',
        tags: ['Car Rental', formData.vehicleType.trim()],
        details: `Plate Number: ${formData.plateNumber.trim()}`
      };

      await serviceService.update(id, payload);
      showNotification('Car rental updated successfully', 'success');
      navigate('/admin/services');
    } catch {
      showNotification('Failed to update car rental', 'error');
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
            <input name="vehicleName" value={formData.vehicleName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Vehicle Type</label>
            <input name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Plate Number</label>
            <input name="plateNumber" value={formData.plateNumber} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Seating Capacity</label>
            <input name="seatingCapacity" type="number" value={formData.seatingCapacity} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Daily Rate</label>
            <input name="dailyRate" type="number" value={formData.dailyRate} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Vehicle Image</label>
            <input name="vehicleImage" type="file" accept="image/*" onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1.5 file:text-cyan-400 file:font-semibold hover:file:bg-cyan-500/30" />
            {formData.vehicleImage && (
              <img src={formData.vehicleImage} alt="Vehicle preview" className="mt-3 h-32 w-full rounded-lg object-cover border border-slate-800" />
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
