import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import {
  Plus, Edit, Trash2, Loader, Users, Car, Search
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const catConfig = {
  key: 'car',
  label: 'Car Rentals',
  singular: 'Car Rental',
  icon: Car,
  accent: 'text-yellow-600',
  border: 'border-yellow-200',
  bg: 'bg-yellow-50',
  activeBg: 'bg-[#1a1a1a]',
  description: 'Vehicle rental services with driver - sedans, SUVs, and vans',
};

const ServiceCard = ({ item, onEdit, onDelete, onView }) => {
  const Icon = catConfig.icon;
  return (
    <div
      onClick={() => onView(item)}
      className="bg-white border border-[#e0dbd0] hover:border-[#b0a68e] rounded-md overflow-hidden flex flex-col transition-colors group cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
    >
      <div className="relative h-44 overflow-hidden bg-[#ebe7df]">
        {item.image && item.image !== '/CAGSAWA.jpg' ? (
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
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${catConfig.bg} ${catConfig.accent} border ${catConfig.border}`}>
          {item.vehicleType || catConfig.label}
        </div>
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-sm font-bold text-sm transition-all cursor-pointer text-white ${catConfig.activeBg} hover:bg-[#333333]`}
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-1.5 bg-white hover:bg-[#f7f4ef] border border-[#d6cfc2] text-[#1a1a1a] rounded-sm cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 flex-grow space-y-2">
        <h3 className="text-sm font-semibold text-[#1a1a1a] line-clamp-1 leading-snug">{item.title}</h3>
        {item.vehicleBrand && (
          <p className="text-[11px] text-slate-400">{item.vehicleBrand}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-[#1a1a1a]">PHP {Number(item.price).toLocaleString()}<span className="text-[10px] font-normal text-slate-500">/day</span></span>
          {item.capacity && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Users className="h-3 w-3" /> {item.capacity}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {item.fuelType && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">{item.fuelType}</span>
          )}
          {item.transmission && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">{item.transmission}</span>
          )}
          {item.plateNumber && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400">{item.plateNumber}</span>
          )}
        </div>
      </div>
    </div>
  );

};

const ManageCarRentals = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getByCategory('car');
      setServices(data);
    } catch {
      showNotification('Failed to load car rentals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    navigate(`/admin/car-rentals/edit/${item.id}`);
  };

  const handleView = (item) => {
    navigate(`/admin/car-rentals/${item.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this car rental?')) {
      try {
        await serviceService.delete(id);
        showNotification('Car rental deleted', 'success');
        loadServices();
      } catch {
        showNotification('Failed to delete car rental', 'error');
      }
    }
  };

  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold font-display text-[#1a1a1a]">Car Rentals</h1>
          <p className="text-[#6b6255] text-sm mt-0.5">{catConfig.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {searchOpen && <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicles..." className="w-40 px-3 py-2 text-xs border border-[#d6cfc2] rounded-sm bg-white text-[#1a1a1a] outline-none focus:border-[#b0a68e]" />}
          <button onClick={() => setSearchOpen((open) => !open)} className="p-2.5 rounded-sm border border-[#d6cfc2] bg-white text-[#1a1a1a] hover:bg-[#f7f4ef]" aria-label="Search car rentals"><Search className="h-4 w-4" /></button>
          <button onClick={() => navigate('/admin/car-rentals/add')} className={`flex items-center gap-2 px-4 py-2.5 rounded-sm font-bold text-sm transition-all cursor-pointer text-white ${catConfig.activeBg} hover:bg-[#333333]`}><Plus className="h-4 w-4" />Add Car Rental</button>
        </div>
      </div>


      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader className={`h-8 w-8 animate-spin ${catConfig.accent}`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.filter(item => !search.trim() || `${item.title || ''} ${item.vehicleBrand || ''} ${item.vehicleType || ''}`.toLowerCase().includes(search.toLowerCase())).map(item => (
            <ServiceCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}

          {services.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center h-40 text-center space-y-2">
              {React.createElement(catConfig.icon, { className: `h-10 w-10 ${catConfig.accent} opacity-30` })}
              <p className="text-slate-500 text-sm">No car rentals yet.</p>
              <button
                onClick={() => navigate('/admin/car-rentals/add')}
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

export default ManageCarRentals;
