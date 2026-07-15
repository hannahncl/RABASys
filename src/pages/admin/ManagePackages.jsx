import React, { useState, useEffect } from 'react';
import { packageService } from '../services/packageService';
import { Plus, Edit, Trash2, Save, X, Loader } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await packageService.getAll();
      setPackages(data);
    } catch (e) {
      showNotification('Failed to load packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg.id);
    setFormData({
      title: pkg.title,
      destination: pkg.destination,
      price: pkg.price,
      duration: pkg.duration,
      image: pkg.image,
      description: pkg.description,
      tags: pkg.tags.join(', ')
    });
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      title: '',
      destination: '',
      price: '',
      duration: '',
      image: '',
      description: '',
      tags: ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingId === 'new') {
        await packageService.create({ ...payload, id: Date.now().toString() });
        showNotification('Package added successfully', 'success');
      } else {
        await packageService.update(editingId, payload);
        showNotification('Package updated successfully', 'success');
      }
      setEditingId(null);
      loadPackages();
    } catch (e) {
      showNotification('Failed to save package', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await packageService.delete(id);
        showNotification('Package deleted', 'success');
        loadPackages();
      } catch (e) {
        showNotification('Failed to delete package', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-100">Manage Tour Packages</h1>
          <p className="text-slate-400 text-sm">Create, update, or remove predefined travel packages.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            {editingId === pkg.id ? (
              <div className="p-5 space-y-4 flex-grow">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Package Title</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. El Nido Premium Island Hopping"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Destination</label>
                  <input
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="e.g. El Nido, Palawan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Base Price (PHP)</label>
                  <input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 18500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Duration</label>
                  <input
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="Duration (e.g. 3 Days, 2 Nights)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Tags (Comma Separated)</label>
                  <input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g. Beach, Adventure, Premium"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Cover Image URL</label>
                  <input
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="e.g. https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g. Explore the world-famous lagoons, white sand beaches..."
                    rows="3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white resize-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                  <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                  <button onClick={handleSave} className="p-2 text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg cursor-pointer">
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-40 overflow-hidden relative">
                  <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => handleEdit(pkg)} className="p-1.5 bg-slate-900/80 hover:bg-cyan-500 text-white rounded-lg cursor-pointer backdrop-blur-sm transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="p-1.5 bg-slate-900/80 hover:bg-rose-500 text-white rounded-lg cursor-pointer backdrop-blur-sm transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5 flex-grow space-y-2">
                  <div className="text-xs text-cyan-400 font-semibold">{pkg.destination}</div>
                  <h3 className="text-base font-bold text-slate-100 line-clamp-1">{pkg.title}</h3>
                  <div className="text-lg font-bold text-slate-100">PHP {pkg.price.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">{pkg.duration}</div>
                  <p className="text-sm text-slate-400 line-clamp-2 mt-2">{pkg.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {pkg.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{t}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add New Card Placeholder */}
        {editingId === 'new' && (
          <div className="bg-slate-900/60 border border-cyan-500/50 rounded-2xl overflow-hidden flex flex-col p-5 space-y-4">
            <h3 className="font-bold text-cyan-400 border-b border-slate-800 pb-2">New Package</h3>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Package Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. El Nido Premium Island Hopping"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Destination</label>
              <input
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g. El Nido, Palawan"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Base Price (PHP)</label>
              <input
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 18500"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Duration</label>
              <input
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="Duration (e.g. 3 Days, 2 Nights)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Tags (Comma Separated)</label>
              <input
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g. Beach, Adventure, Premium"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Cover Image URL</label>
              <input
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="e.g. https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Explore the world-famous lagoons, white sand beaches..."
                rows="3"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white resize-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button onClick={handleCancel} className="p-2 px-4 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer text-sm">
                Cancel
              </button>
              <button onClick={handleSave} className="p-2 px-4 text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg cursor-pointer text-sm font-bold flex items-center gap-1">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePackages;
