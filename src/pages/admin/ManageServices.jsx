import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../services/serviceService';
import {
  Plus, Edit, Trash2, Save, X, Loader, Search,
  MapPin, Clock, Users, Car, Navigation, Package
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

// ─── Category config ────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'tour',
    label: 'Tour Packages',
    singular: 'Tour Package',
    icon: Package,
    color: 'cyan',
    accent: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    activeBg: 'bg-cyan-500',
    description: 'Guided tour itineraries and multi-day travel packages',
    fields: [
      { name: 'packageName',      label: 'Package Name',         type: 'text',     placeholder: 'e.g. Bicol Adventure Escape' },
      { name: 'description',      label: 'Description',          type: 'textarea', placeholder: 'Describe the tour experience...' },
      { name: 'destination',      label: 'Destination',          type: 'text',     placeholder: 'e.g. Legazpi, Albay' },
      { name: 'price',            label: 'Price (PHP)',          type: 'number',   placeholder: 'e.g. 18500' },
      { name: 'duration',         label: 'Duration',             type: 'text',     placeholder: 'e.g. 3 Days, 2 Nights' },
      { name: 'inclusions',       label: 'Inclusions',           type: 'textarea', placeholder: 'Transport, meals, guide, entrance fees' },
      { name: 'maximumCapacity',  label: 'Maximum Capacity',     type: 'number',   placeholder: 'e.g. 12' },
      { name: 'meetingLocation',  label: 'Meeting Location',     type: 'text',     placeholder: 'e.g. Legazpi Airport' },
      { name: 'itinerary',        label: 'Itinerary',            type: 'textarea', placeholder: 'Day 1: Arrival and welcome dinner\nDay 2: Adventure activity' },
    ]
  },
  {
    key: 'tuktrip',
    label: 'Tuktrip',
    singular: 'Tuktrip',
    icon: Navigation,
    color: 'amber',
    accent: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    activeBg: 'bg-amber-500',
    description: 'Tuk-tuk city rides, local tours, and guided sightseeing routes',
    fields: [
      { name: 'packageName',      label: 'Package Name',         type: 'text',     placeholder: 'e.g. City Heritage Tuktrip' },
      { name: 'description',      label: 'Description',          type: 'textarea', placeholder: 'Describe the tuktrip experience...' },
      { name: 'destination',      label: 'Destination',          type: 'text',     placeholder: 'e.g. Legazpi City, Albay' },
      { name: 'price',            label: 'Price (PHP)',          type: 'number',   placeholder: 'e.g. 1800' },
      { name: 'duration',         label: 'Duration',             type: 'text',     placeholder: 'e.g. 4 Hours' },
      { name: 'inclusions',       label: 'Inclusions',           type: 'textarea', placeholder: 'Driver, fuel, route stops' },
      { name: 'maximumCapacity',  label: 'Maximum Capacity',     type: 'number',   placeholder: 'e.g. 4' },
      { name: 'meetingLocation',  label: 'Meeting Location',     type: 'text',     placeholder: 'e.g. Legazpi City Hall' },
      { name: 'itinerary',        label: 'Itinerary',            type: 'textarea', placeholder: 'Day 1: Start at city hall\nDay 2: Visit local landmarks' },
    ]
  },
  {
    key: 'car',
    label: 'Car Rentals',
    singular: 'Car Rental',
    icon: Car,
    color: 'violet',
    accent: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    activeBg: 'bg-violet-500',
    description: 'Vehicle rental services with driver - sedans, SUVs, and vans',
    fields: [
      { name: 'title',        label: 'Vehicle Name / Model',    type: 'text',   placeholder: 'e.g. Toyota Fortuner - Premium SUV' },
      { name: 'destination',  label: 'Service Area',             type: 'text',   placeholder: 'e.g. Bicol Region' },
      { name: 'price',        label: 'Rate per Day (PHP)',        type: 'number', placeholder: 'e.g. 4800' },
      { name: 'duration',     label: 'Rate Unit',                 type: 'text',   placeholder: 'e.g. Per Day' },
      { name: 'vehicleType',  label: 'Vehicle Type',              type: 'text',   placeholder: 'e.g. SUV' },
      { name: 'capacity',     label: 'Passenger Capacity',        type: 'text',   placeholder: 'e.g. 7 Passengers' },
      { name: 'transmission', label: 'Transmission',              type: 'select', options: ['Automatic', 'Manual'] },
      { name: 'fuelType',     label: 'Fuel Type',                 type: 'select', options: ['Gasoline', 'Diesel', 'Hybrid', 'Electric'] },
      { name: 'tags',         label: 'Tags (comma-separated)',    type: 'text',   placeholder: 'e.g. Premium, SUV, Family' },
      { name: 'image',        label: 'Vehicle Photo URL',          type: 'text',   placeholder: 'https://...' },
      { name: 'description',  label: 'Description',               type: 'textarea', placeholder: 'Describe the vehicle and rental terms...' },
      { name: 'details',      label: 'Additional Details',         type: 'textarea', placeholder: 'Add plate number, inclusions, driver terms, or rental notes...' },
    ]
  }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyForm = (fields) =>
  fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {});

const serializeForm = (formData) => {
  const payload = { ...formData, price: Number(formData.price) };

  if (formData.packageName) {
    payload.title = formData.packageName.trim();
    payload.packageName = formData.packageName.trim();
  }

  if (typeof formData.tags === 'string') {
    payload.tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (typeof formData.inclusions === 'string') {
    payload.inclusions = formData.inclusions.split(',').map(item => item.trim()).filter(Boolean);
  }

  if (formData.maximumCapacity !== '' && formData.maximumCapacity !== undefined && formData.maximumCapacity !== null) {
    payload.maximumCapacity = Number(formData.maximumCapacity);
  }

  if (typeof formData.itinerary === 'string') {
    payload.itinerary = formData.itinerary
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, index) => ({ day: index + 1, title: line, desc: line }));
  }

  return payload;
};

const deserializeForm = (item, fields) => {
  const base = emptyForm(fields);
  fields.forEach(f => {
    let value = '';

    if (f.name === 'packageName') {
      value = item.packageName || item.title || '';
    } else if (f.name === 'inclusions') {
      value = Array.isArray(item.inclusions) ? item.inclusions.join(', ') : (item.inclusions || '');
    } else if (f.name === 'itinerary') {
      value = Array.isArray(item.itinerary)
        ? item.itinerary.map(entry => entry.title || entry.desc || '').join('\n')
        : (item.itinerary || '');
    } else if (f.name === 'tags') {
      value = Array.isArray(item[f.name]) ? item[f.name].join(', ') : (item[f.name] || '');
    } else {
      value = item[f.name] !== undefined ? item[f.name] : '';
    }

    base[f.name] = value;
  });
  return base;
};

// ─── ServiceCard ─────────────────────────────────────────────────────────────

const ServiceCard = ({ item, catConfig, onEdit, onDelete }) => {
  const Icon = catConfig.icon;
  return (
    <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col transition-colors group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-800">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${catConfig.bg}`}>
            <Icon className={`h-12 w-12 ${catConfig.accent} opacity-40`} />
          </div>
        )}
        {/* Badge */}
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${catConfig.bg} ${catConfig.accent} border ${catConfig.border} backdrop-blur-sm`}>
          {catConfig.label}
        </div>
        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-slate-950 ${catConfig.activeBg} hover:opacity-90`}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 bg-slate-900/90 hover:bg-rose-500 text-white rounded-lg cursor-pointer backdrop-blur-sm transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow space-y-2">
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${catConfig.accent}`}>
          <MapPin className="h-3 w-3" />
          {item.destination}
        </div>
        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">{item.packageName || item.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-slate-100">PHP {Number(item.price).toLocaleString()}</span>
          {item.duration && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" /> {item.duration}
            </span>
          )}
        </div>
        {item.capacity && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Users className="h-3 w-3" /> {item.capacity}
          </div>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {(Array.isArray(item.tags) ? item.tags : item.tags.split(',')).slice(0, 3).map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">
                {typeof t === 'string' ? t.trim() : t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ServiceForm ─────────────────────────────────────────────────────────────

const ServiceForm = ({ catConfig, formData, onChange, onSave, onCancel, isNew }) => (
  <div className={`bg-slate-900/80 border ${catConfig.border} rounded-2xl overflow-hidden flex flex-col p-5 space-y-4`}>
    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
      <h3 className={`font-bold ${catConfig.accent}`}>
        {isNew ? `New ${catConfig.singular}` : `Edit Service`}
      </h3>
      <button onClick={onCancel} className="text-slate-500 hover:text-slate-300">
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {catConfig.fields.map(field => (
        <div key={field.name}>
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              name={field.name}
              value={formData[field.name] || ''}
              onChange={onChange}
              placeholder={field.placeholder}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 resize-none focus:border-cyan-500 focus:outline-none transition-colors"
            />
          ) : field.type === 'select' ? (
            <select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={onChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none transition-colors"
            >
              <option value="">Select...</option>
              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              name={field.name}
              type={field.type}
              value={formData[field.name] || ''}
              onChange={onChange}
              placeholder={field.placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none transition-colors"
            />
          )}
        </div>
      ))}
    </div>

    <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className={`px-4 py-2 text-sm font-bold text-slate-950 rounded-lg cursor-pointer flex items-center gap-1.5 ${catConfig.activeBg} hover:opacity-90 transition-opacity`}
      >
        <Save className="h-4 w-4" /> Save
      </button>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ManageServices = () => {
  const [activeTab, setActiveTab] = useState('tour');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const catConfig = CATEGORIES.find(c => c.key === activeTab);

  useEffect(() => {
    loadServices();
  }, [activeTab]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getByCategory(activeTab);
      setServices(data);
    } catch {
      showNotification('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    if (activeTab === 'tour') {
      navigate(`/admin/services/edit-tour-package/${item.id}`);
      return;
    }

    if (activeTab === 'tuktrip') {
      navigate(`/admin/services/edit-tuktrip/${item.id}`);
      return;
    }

    if (activeTab === 'car') {
      navigate(`/admin/services/edit-car-rental/${item.id}`);
      return;
    }

    setEditingId(item.id);
    setFormData(deserializeForm(item, catConfig.fields));
  };

  const handleAddNew = () => {
    if (activeTab === 'tour') {
      navigate('/admin/services/add-tour-package');
      return;
    }

    if (activeTab === 'tuktrip') {
      navigate('/admin/services/add-tuktrip');
      return;
    }

    if (activeTab === 'car') {
      navigate('/admin/services/add-car-rental');
      return;
    }

    setEditingId('new');
    setFormData(emptyForm(catConfig.fields));
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
      const payload = { ...serializeForm(formData), category: activeTab };
      if (editingId === 'new') {
        await serviceService.create({ ...payload, id: Date.now().toString() });
        showNotification(`${catConfig.singular} added successfully`, 'success');
      } else {
        await serviceService.update(editingId, payload);
        showNotification('Service updated successfully', 'success');
      }
      setEditingId(null);
      setFormData(null);
      loadServices();
    } catch {
      showNotification('Failed to save service', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceService.delete(id);
        showNotification('Service deleted', 'success');
        loadServices();
      } catch {
        showNotification('Failed to delete service', 'error');
      }
    }
  };

  const filteredServices = services.filter(item => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      (item.packageName && item.packageName.toLowerCase().includes(term)) ||
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.destination && item.destination.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header & Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const CatIcon = cat.icon;
            const isActive = cat.key === activeTab;
            
            return (
              <button
                key={cat.key}
                onClick={() => { setActiveTab(cat.key); setEditingId(null); setFormData(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? `${cat.bg} ${cat.accent} ${cat.border}`
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${catConfig.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            onClick={handleAddNew}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-slate-950 ${catConfig.activeBg} hover:opacity-90 shrink-0`}
          >
            <Plus className="h-4 w-4" />
            Add {catConfig.singular}
          </button>
        </div>
      </div>


      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader className={`h-8 w-8 animate-spin ${catConfig.accent}`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Existing services */}
          {filteredServices.map(item =>
            editingId === item.id ? (
              <ServiceForm
                key={item.id}
                catConfig={catConfig}
                formData={formData}
                onChange={handleChange}
                onSave={handleSave}
                onCancel={handleCancel}
                isNew={false}
              />
            ) : (
              <ServiceCard
                key={item.id}
                item={item}
                catConfig={catConfig}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )
          )}

          {/* New service form card */}
          {editingId === 'new' && (
            <ServiceForm
              catConfig={catConfig}
              formData={formData}
              onChange={handleChange}
              onSave={handleSave}
              onCancel={handleCancel}
              isNew={true}
            />
          )}

          {/* Empty state */}
          {filteredServices.length === 0 && editingId !== 'new' && (
            <div className="col-span-3 flex flex-col items-center justify-center h-40 text-center space-y-2">
              {React.createElement(catConfig.icon, { className: `h-10 w-10 ${catConfig.accent} opacity-30` })}
              <p className="text-slate-500 text-sm">No {catConfig.label.toLowerCase()} yet.</p>
              <button
                onClick={handleAddNew}
                className={`text-xs font-semibold ${catConfig.accent} hover:underline cursor-pointer`}
              >
                + Add the first one
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageServices;
