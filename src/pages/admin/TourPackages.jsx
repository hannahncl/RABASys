import React, { useEffect, useState } from 'react';
import { serviceService } from '../../services/serviceService';
import { Plus, Edit, Trash2, Save, X, Loader, MapPin, Clock, Users, CalendarDays, Navigation, PackageCheck } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const emptyForm = () => ({
  packageName: '',
  description: '',
  destination: '',
  price: '',
  duration: '',
  inclusions: '',
  maximumCapacity: '',
  meetingLocation: '',
  itinerary: ''
});

const parseItinerary = (value) => {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  return lines.map((line, index) => {
    const dayMatch = line.match(/^day\s*(\d+)/i);
    if (dayMatch) {
      return {
        day: Number(dayMatch[1]),
        title: line.replace(/^day\s*\d+\s*[:.-]\s*/i, '').trim(),
        desc: line.replace(/^day\s*\d+\s*[:.-]\s*/i, '').trim()
      };
    }

    return {
      day: index + 1,
      title: `Day ${index + 1}`,
      desc: line
    };
  });
};

const TourPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const { showNotification } = useNotification();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getByCategory('tour');
      setPackages(data);
    } catch (error) {
      showNotification('Failed to load tour packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setIsFormOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg.id);
    setFormData({
      packageName: pkg.packageName || pkg.title || '',
      description: pkg.description || '',
      destination: pkg.destination || '',
      price: pkg.price ?? '',
      duration: pkg.duration || '',
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join(', ') : (pkg.inclusions || ''),
      maximumCapacity: pkg.maximumCapacity ?? '',
      meetingLocation: pkg.meetingLocation || '',
      itinerary: Array.isArray(pkg.itinerary)
        ? pkg.itinerary.map((item) => `${item.day ? `Day ${item.day}` : 'Day'}: ${item.title || item.desc || ''}`).join('\n')
        : (pkg.itinerary || '')
    });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const requiredFields = ['packageName', 'description', 'destination', 'price', 'duration', 'inclusions', 'maximumCapacity', 'meetingLocation', 'itinerary'];
    const missing = requiredFields.filter((field) => !String(formData[field]).trim());

    if (missing.length > 0) {
      showNotification('Please complete all required fields before saving.', 'error');
      return;
    }

    try {
      const payload = {
        category: 'tour',
        title: formData.packageName.trim(),
        packageName: formData.packageName.trim(),
        description: formData.description.trim(),
        destination: formData.destination.trim(),
        price: Number(formData.price),
        duration: formData.duration.trim(),
        inclusions: formData.inclusions
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        maximumCapacity: Number(formData.maximumCapacity),
        meetingLocation: formData.meetingLocation.trim(),
        itinerary: parseItinerary(formData.itinerary),
        image: '/CAGSAWA.jpg',
        tags: [formData.destination.trim(), 'Tour Package']
      };

      if (editingId) {
        await serviceService.update(editingId, payload);
        showNotification('Tour package updated successfully', 'success');
      } else {
        await serviceService.create({ ...payload, id: Date.now().toString() });
        showNotification('Tour package created successfully', 'success');
      }

      setIsFormOpen(false);
      setEditingId(null);
      loadPackages();
    } catch (error) {
      showNotification('Failed to save tour package', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tour package?')) {
      return;
    }

    try {
      await serviceService.delete(id);
      showNotification('Tour package removed', 'success');
      loadPackages();
    } catch (error) {
      showNotification('Failed to delete tour package', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-100">Tour Packages Management</h1>
          <p className="text-sm text-slate-400">Create, edit, and remove tour packages from the admin dashboard.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-500"
        >
          <Plus className="h-4 w-4" />
          Add Tour Package
        </button>
      </div>

      {isFormOpen ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-cyan-400">{editingId ? 'Edit Tour Package' : 'Create New Tour Package'}</h2>
              <p className="text-sm text-slate-400">Add the package details needed for booking and itinerary planning.</p>
            </div>
            <button onClick={handleCancel} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Package Name</label>
                <input name="packageName" value={formData.packageName} onChange={handleChange} placeholder="e.g. Bicol Adventure Escape" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Describe the experience in a few sentences" className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Destination</label>
                <input name="destination" value={formData.destination} onChange={handleChange} placeholder="e.g. Legazpi, Albay" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Price</label>
                  <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="e.g. 18500" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Duration</label>
                  <input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 3 Days, 2 Nights" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Inclusions</label>
                <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} rows={3} placeholder="Transport, meals, guide, entrance fees" className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Maximum Capacity</label>
                <input name="maximumCapacity" type="number" value={formData.maximumCapacity} onChange={handleChange} placeholder="e.g. 12" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Meeting Location</label>
                <input name="meetingLocation" value={formData.meetingLocation} onChange={handleChange} placeholder="e.g. Legazpi Airport" className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Itinerary</label>
                <textarea name="itinerary" value={formData.itinerary} onChange={handleChange} rows={5} placeholder="Day 1: Arrival and welcome dinner\nDay 2: Adventure activity" className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white outline-none focus:border-cyan-500" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button onClick={handleCancel} className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-500">
              <Save className="h-4 w-4" /> Save Package
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {packages.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400">
              No tour packages yet. Use the button above to create your first package.
            </div>
          ) : (
            packages.map((pkg) => (
              <div key={pkg.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="relative h-44 bg-slate-800">
                  <img src={pkg.image || '/CAGSAWA.jpg'} alt={pkg.packageName || pkg.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Tour Package
                  </div>
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button onClick={() => handleEdit(pkg)} className="rounded-lg bg-slate-900/80 p-1.5 text-white transition-colors hover:bg-cyan-500">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="rounded-lg bg-slate-900/80 p-1.5 text-white transition-colors hover:bg-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <MapPin className="h-4 w-4" />
                    {pkg.destination}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">{pkg.packageName || pkg.title}</h3>
                  <p className="text-sm text-slate-400">{pkg.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {pkg.duration}</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {pkg.maximumCapacity || 'N/A'} pax</span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <PackageCheck className="h-4 w-4 text-cyan-400" /> Inclusions
                    </div>
                    <p className="text-sm text-slate-400">{Array.isArray(pkg.inclusions) ? pkg.inclusions.join(', ') : pkg.inclusions}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Price</div>
                      <div className="text-lg font-bold text-slate-100">PHP {Number(pkg.price).toLocaleString()}</div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div className="flex items-center gap-1 justify-end"><CalendarDays className="h-3.5 w-3.5" /> Meeting</div>
                      <div className="mt-1 text-sm text-slate-300">{pkg.meetingLocation}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TourPackages;
