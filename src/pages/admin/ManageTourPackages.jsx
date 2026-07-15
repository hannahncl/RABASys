import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import {
  Plus, Edit, Trash2, Loader, MapPin, Clock, Users, Package
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const catConfig = {
  key: 'tour',
  label: 'Tour Packages',
  singular: 'Tour Package',
  icon: Package,
  accent: 'text-cyan-400',
  border: 'border-cyan-500/30',
  bg: 'bg-cyan-500/10',
  activeBg: 'bg-cyan-500',
  description: 'Guided tour itineraries and multi-day travel packages',
};

const ServiceCard = ({ item, onEdit, onDelete }) => {
  const Icon = catConfig.icon;
  return (
    <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col transition-colors group">
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
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${catConfig.bg} ${catConfig.accent} border ${catConfig.border} backdrop-blur-sm`}>
          {catConfig.label}
        </div>
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
        {item.maximumCapacity && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Users className="h-3 w-3" /> {item.maximumCapacity} guests
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

const ManageTourPackages = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getByCategory('tour');
      setServices(data);
    } catch {
      showNotification('Failed to load tour packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    navigate(`/admin/tour-packages/edit/${item.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tour package?')) {
      try {
        await serviceService.delete(id);
        showNotification('Tour package deleted', 'success');
        loadServices();
      } catch {
        showNotification('Failed to delete tour package', 'error');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-100">Tour Packages</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {catConfig.description}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/tour-packages/add')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-slate-950 ${catConfig.activeBg} hover:opacity-90 shrink-0`}
        >
          <Plus className="h-4 w-4" />
          Add Tour Package
        </button>
      </div>

      <div className={`flex items-center gap-2 text-sm ${catConfig.accent} ${catConfig.bg} ${catConfig.border} border rounded-xl px-4 py-2.5`}>
        {React.createElement(catConfig.icon, { className: 'h-4 w-4 shrink-0' })}
        <span className="text-slate-300 text-xs">{catConfig.description}</span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader className={`h-8 w-8 animate-spin ${catConfig.accent}`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(item => (
            <ServiceCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {services.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center h-40 text-center space-y-2">
              {React.createElement(catConfig.icon, { className: `h-10 w-10 ${catConfig.accent} opacity-30` })}
              <p className="text-slate-500 text-sm">No tour packages yet.</p>
              <button
                onClick={() => navigate('/admin/tour-packages/add')}
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

export default ManageTourPackages;
