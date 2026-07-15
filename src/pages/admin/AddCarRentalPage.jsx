import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Save, ArrowLeft } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const AddCarRentalPage = () => {
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'vehicleImage' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, vehicleImage: reader.result }));
      };
      reader.readAsDataURL(file);
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

      await serviceService.create({ ...payload, id: Date.now().toString() });
      showNotification('Car rental created successfully', 'success');
      navigate('/admin/services');
    } catch (error) {
      showNotification('Failed to create car rental', 'error');
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

      <div className="rounded-2xl border border-violet-500/30 bg-slate-900/70 p-6 shadow-2xl shadow-violet-950/20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display text-slate-100">Add Car Rental</h1>
          <p className="text-sm text-slate-400">Fill in the details below to create a new car rental listing.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Name</label>
              <input name="vehicleName" value={formData.vehicleName} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Type</label>
              <input name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Plate Number</label>
              <input name="plateNumber" value={formData.plateNumber} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Seating Capacity</label>
              <input name="seatingCapacity" type="number" value={formData.seatingCapacity} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Daily Rate</label>
              <input name="dailyRate" type="number" value={formData.dailyRate} onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Image</label>
              <input name="vehicleImage" type="file" accept="image/*" onChange={handleChange} className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-300" />
              {formData.vehicleImage && (
                <img src={formData.vehicleImage} alt="Vehicle preview" className="mt-3 h-32 w-full rounded-lg object-cover border border-slate-800" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-violet-400 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-violet-500">
            <Save className="h-4 w-4" /> Save Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCarRentalPage;
