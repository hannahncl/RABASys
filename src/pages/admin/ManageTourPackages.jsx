import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import {
  Plus, Edit, Power, Loader, MapPin, Clock, Users, Package, Search, X, RotateCcw, UsersRound, Navigation
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';

const catConfig = {
  key: 'tour',
  label: 'Tour Packages',
  singular: 'Tour Package',
  icon: Package,
  accent: 'text-yellow-600',
  border: 'border-yellow-200',
  bg: 'bg-yellow-50',
  activeBg: 'bg-[#1a1a1a]',
  description: 'Guided tour itineraries and multi-day travel packages',
};

const packageTypes = [
  { key: 'all', label: 'All Packages' },
  { key: 'exclusive', label: 'Exclusive Tour Package', icon: Package },
  { key: 'joiner', label: 'Joiner Tour Package', icon: UsersRound },
  { key: 'tuktrip', label: 'Tuktrip', icon: Navigation },
];

const packageTypeLabels = Object.fromEntries(packageTypes.map(({ key, label }) => [key, label]));

const sortOptions = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
];

const isPackageDeactivated = (item) => {
  const status = item.availabilityStatus ?? item.availability_status;
  return status != null && String(status).trim().toLowerCase() !== 'available';
};

const ServiceCard = ({ item, onEdit, onDelete, onView }) => {
  const Icon = catConfig.icon;
  const isDeactivated = isPackageDeactivated(item);
  return (
    <div
      onClick={isDeactivated ? undefined : () => onView(item)}
      className={`bg-white border rounded-md overflow-hidden flex flex-col transition-colors group shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${isDeactivated ? 'border-[#d6cfc2] grayscale opacity-60 cursor-default' : 'border-[#e0dbd0] hover:border-[#b0a68e] cursor-pointer'}`}
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
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${isDeactivated ? 'bg-slate-200 text-slate-600 border-slate-300' : `${catConfig.bg} ${catConfig.accent} border ${catConfig.border}`}`}>
          {packageTypeLabels[item.category] || catConfig.label}
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
            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
            title={isDeactivated ? 'Activate package' : 'Deactivate package'}
            className={`p-1.5 bg-white border border-[#d6cfc2] rounded-sm cursor-pointer transition-colors ${isDeactivated ? 'text-emerald-700 hover:bg-emerald-50' : 'text-[#1a1a1a] hover:bg-[#f7f4ef]'}`}
          >
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 flex-grow space-y-2">
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${catConfig.accent}`}>
          <MapPin className="h-3 w-3" />
          {item.destination}
        </div>
        <h3 className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 leading-snug">{item.packageName || item.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-[#1a1a1a]">PHP {Number(item.price).toLocaleString()}</span>
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
        {item.category === 'joiner' && (item.joinerDate || item.joinerSlots) && (
          <div className="rounded-sm bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-700">
            {item.joinerDate && <span>{new Date(`${item.joinerDate}T00:00:00`).toLocaleDateString()}</span>}
            {item.joinerDate && item.joinerSlots ? ' · ' : ''}
            {item.joinerSlots ? `${item.joinerSlots} slots available` : ''}
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { confirm } = useConfirmation();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getAll();
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

  const handleView = (item) => {
    navigate(`/admin/tour-packages/${item.id}`);
  };

  const handleToggleAvailability = async (item) => {
    const isDeactivated = isPackageDeactivated(item);
    const nextStatus = isDeactivated ? 'Available' : 'Deactivated';
    const action = isDeactivated ? 'activate' : 'deactivate';

    if (await confirm(`Are you sure you want to ${action} this tour package?`)) {
      try {
        await serviceService.setAvailability(item.id, nextStatus);
        showNotification(`Tour package ${action}d`, 'success');
        loadServices();
      } catch {
        showNotification(`Failed to ${action} tour package`, 'error');
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedSort('newest');
  };

  const filteredServices = services
    .filter(item => selectedType === 'all' || item.category === selectedType)
    .filter(item => !search.trim() || `${item.packageName || item.title} ${item.destination || ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aDeactivated = isPackageDeactivated(a);
      const bDeactivated = isPackageDeactivated(b);
      if (aDeactivated !== bDeactivated) return aDeactivated ? 1 : -1;
      const newestFirst = new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime();
      return selectedSort === 'oldest' ? -newestFirst : newestFirst;
    });

  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold font-display text-[#1a1a1a]">Tour Packages</h1>
          <p className="text-[#6b6255] text-sm mt-0.5">{catConfig.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {searchOpen && <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages..." className="w-40 px-3 py-2 text-xs border border-[#d6cfc2] rounded-sm bg-white text-[#1a1a1a] outline-none focus:border-[#b0a68e]" />}
          <button onClick={() => setSearchOpen((open) => !open)} className="p-2.5 rounded-sm border border-[#d6cfc2] bg-white text-[#1a1a1a] hover:bg-[#f7f4ef]" aria-label="Search tour packages"><Search className="h-4 w-4" /></button>
          <button onClick={() => setTypePickerOpen(true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-sm font-bold text-sm transition-all cursor-pointer text-white ${catConfig.activeBg} hover:bg-[#333333]`}><Plus className="h-4 w-4" />Add Tour Package</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[#e0dbd0] pb-4 text-xs">
        <label className="font-bold uppercase tracking-wider text-[#1a1a1a]">Type</label>
        <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-10 min-w-[190px] rounded-md border border-[#d6cfc2] bg-white px-3 text-sm text-[#2d2a24] outline-none focus:border-[#1a1a1a]">
          {packageTypes.map((type) => <option key={type.key} value={type.key}>{type.key === 'all' ? 'All Types' : type.label}</option>)}
        </select>
        <label className="ml-1 font-bold uppercase tracking-wider text-[#1a1a1a]">Sort</label>
        <select value={selectedSort} onChange={(event) => setSelectedSort(event.target.value)} className="h-10 min-w-[140px] rounded-md border border-[#d6cfc2] bg-white px-3 text-sm text-[#2d2a24] outline-none focus:border-[#1a1a1a]">
          {sortOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
        <button onClick={handleResetFilters} className="flex h-10 items-center gap-2 rounded-md border border-[#d6cfc2] bg-white px-4 font-semibold text-[#6b6255] hover:bg-[#f7f4ef]"><RotateCcw className="h-4 w-4" />Reset</button>
      </div>


      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader className={`h-8 w-8 animate-spin ${catConfig.accent}`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(item => (
            <ServiceCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleToggleAvailability}
              onView={handleView}
            />
          ))}

          {filteredServices.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center h-40 text-center space-y-2">
              {React.createElement(catConfig.icon, { className: `h-10 w-10 ${catConfig.accent} opacity-30` })}
              <p className="text-slate-500 text-sm">No tour packages yet.</p>
              <button
                onClick={() => setTypePickerOpen(true)}
                className={`text-xs font-semibold ${catConfig.accent} hover:underline cursor-pointer`}
              >
                + Add the first one
              </button>
            </div>
          )}
        </div>
      )}

      {typePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setTypePickerOpen(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1a1a1a]">Select Package Type</h2>
                <p className="mt-1 text-xs text-[#6b6255]">Choose the category for the new package.</p>
              </div>
              <button onClick={() => setTypePickerOpen(false)} className="text-[#6b6255] hover:text-[#1a1a1a]" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2">
              {packageTypes.slice(1).map((type) => (
                <button key={type.key} onClick={() => navigate(`/admin/tour-packages/add?type=${type.key}`)} className="flex w-full items-center gap-3 rounded-sm border border-[#d6cfc2] px-4 py-3 text-left text-sm font-semibold text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#f7f4ef]">
                  <type.icon className="h-5 w-5 text-[#6b6255]" />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTourPackages;
