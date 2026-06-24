import React, { useState, useEffect } from 'react';
import { customizationService } from '../../services/customizationService';
import { Plus, Edit, Trash2, Save, X, Loader, MapPin, Hotel, Compass } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const ManageCustomizations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // Destination Edit States
  const [editingDestId, setEditingDestId] = useState(null);
  const [destForm, setDestForm] = useState({ name: '', base: '' });

  // Hotel Tier Edit States
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [hotelForm, setHotelForm] = useState({ id: '', name: '', pricePerNight: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await customizationService.getAll();
      setData(res);
    } catch (e) {
      showNotification('Failed to load customization data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- DESTINATION HANDLERS ---
  const handleEditDest = (name, base) => {
    setEditingDestId(name);
    setDestForm({ name, base });
  };

  const handleAddDest = () => {
    setEditingDestId('new');
    setDestForm({ name: '', base: '' });
  };

  const handleSaveDest = async () => {
    if (!destForm.name || !destForm.base) {
      showNotification('Name and base price are required.', 'warning');
      return;
    }
    const newDestinations = { ...data.destinations };
    
    // If we're renaming a destination, delete the old one
    if (editingDestId && editingDestId !== 'new' && editingDestId !== destForm.name) {
      newDestinations[destForm.name] = { ...newDestinations[editingDestId], base: Number(destForm.base) };
      delete newDestinations[editingDestId];
    } else {
      newDestinations[destForm.name] = { 
        ...(newDestinations[editingDestId === 'new' ? destForm.name : editingDestId] || { activities: [] }), 
        base: Number(destForm.base) 
      };
    }

    try {
      await customizationService.updateDestinations(newDestinations);
      showNotification('Destination saved', 'success');
      setEditingDestId(null);
      loadData();
    } catch (e) {
      showNotification('Failed to save destination', 'error');
    }
  };

  const handleDeleteDest = async (name) => {
    if (window.confirm(`Delete destination ${name}?`)) {
      const newDestinations = { ...data.destinations };
      delete newDestinations[name];
      try {
        await customizationService.updateDestinations(newDestinations);
        showNotification('Destination deleted', 'success');
        loadData();
      } catch (e) {
        showNotification('Failed to delete destination', 'error');
      }
    }
  };

  // --- HOTEL TIER HANDLERS ---
  const handleEditHotel = (hotel) => {
    setEditingHotelId(hotel.id);
    setHotelForm({ ...hotel });
  };

  const handleAddHotel = () => {
    setEditingHotelId('new');
    setHotelForm({ id: '', name: '', pricePerNight: '' });
  };

  const handleSaveHotel = async () => {
    if (!hotelForm.name || !hotelForm.pricePerNight) {
      showNotification('Name and price are required.', 'warning');
      return;
    }

    let newHotels = [...data.hotelTiers];
    const payload = {
      ...hotelForm,
      id: hotelForm.id || Date.now().toString(),
      pricePerNight: Number(hotelForm.pricePerNight)
    };

    if (editingHotelId === 'new') {
      newHotels.push(payload);
    } else {
      newHotels = newHotels.map(h => h.id === editingHotelId ? payload : h);
    }

    try {
      await customizationService.updateHotelTiers(newHotels);
      showNotification('Hotel tier saved', 'success');
      setEditingHotelId(null);
      loadData();
    } catch (e) {
      showNotification('Failed to save hotel tier', 'error');
    }
  };

  const handleDeleteHotel = async (id) => {
    if (window.confirm('Delete hotel tier?')) {
      const newHotels = data.hotelTiers.filter(h => h.id !== id);
      try {
        await customizationService.updateHotelTiers(newHotels);
        showNotification('Hotel tier deleted', 'success');
        loadData();
      } catch (e) {
        showNotification('Failed to delete hotel tier', 'error');
      }
    }
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-100">Trip Customization Data</h1>
        <p className="text-slate-400 text-sm">Manage destinations, activities, and hotel tiers for the custom trip planner.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DESTINATIONS LIST */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-400" />
              Destinations & Activities
            </h2>
            <button onClick={handleAddDest} className="text-xs bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          <div className="space-y-4">
            {editingDestId === 'new' && (
              <div className="bg-slate-900 border border-cyan-500/50 p-4 rounded-xl flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Destination Name" 
                  value={destForm.name} 
                  onChange={(e) => setDestForm({...destForm, name: e.target.value})}
                  className="flex-grow bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Base Price" 
                  value={destForm.base} 
                  onChange={(e) => setDestForm({...destForm, base: e.target.value})}
                  className="w-24 bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
                <button onClick={handleSaveDest} className="text-cyan-400 hover:text-cyan-300 p-2"><Save className="h-5 w-5" /></button>
                <button onClick={() => setEditingDestId(null)} className="text-slate-500 hover:text-white p-2"><X className="h-5 w-5" /></button>
              </div>
            )}

            {Object.entries(data.destinations).map(([destName, details]) => (
              <div key={destName} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                {editingDestId === destName ? (
                   <div className="flex items-center gap-3">
                     <input 
                       type="text" 
                       value={destForm.name} 
                       onChange={(e) => setDestForm({...destForm, name: e.target.value})}
                       className="flex-grow bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white outline-none"
                     />
                     <input 
                       type="number" 
                       value={destForm.base} 
                       onChange={(e) => setDestForm({...destForm, base: e.target.value})}
                       className="w-24 bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white outline-none"
                     />
                     <button onClick={handleSaveDest} className="text-cyan-400 hover:text-cyan-300 p-1"><Save className="h-4 w-4" /></button>
                     <button onClick={() => setEditingDestId(null)} className="text-slate-500 hover:text-white p-1"><X className="h-4 w-4" /></button>
                   </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-100">{destName}</h3>
                      <p className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">Base: PHP {details.base.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditDest(destName, details.base)} className="text-slate-400 hover:text-cyan-400 cursor-pointer p-1"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteDest(destName)} className="text-slate-400 hover:text-rose-400 cursor-pointer p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}

                {/* Nested Activities (Read-only representation for brevity, or full CRUD can be added later) */}
                {details.activities && details.activities.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/50 space-y-2 mt-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Activities</p>
                    {details.activities.map(act => (
                      <div key={act.id} className="flex justify-between text-xs bg-slate-950 p-2 rounded border border-slate-800/50 text-slate-300">
                        <span>{act.name}</span>
                        <span className="text-cyan-400">PHP {act.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* HOTEL TIERS LIST */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Hotel className="h-5 w-5 text-cyan-400" />
              Hotel Tiers
            </h2>
            <button onClick={handleAddHotel} className="text-xs bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          <div className="space-y-4">
            {editingHotelId === 'new' && (
              <div className="bg-slate-900 border border-cyan-500/50 p-4 rounded-xl flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Tier Name" 
                  value={hotelForm.name} 
                  onChange={(e) => setHotelForm({...hotelForm, name: e.target.value})}
                  className="flex-grow bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Price/Night" 
                  value={hotelForm.pricePerNight} 
                  onChange={(e) => setHotelForm({...hotelForm, pricePerNight: e.target.value})}
                  className="w-24 bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
                <button onClick={handleSaveHotel} className="text-cyan-400 hover:text-cyan-300 p-2"><Save className="h-5 w-5" /></button>
                <button onClick={() => setEditingHotelId(null)} className="text-slate-500 hover:text-white p-2"><X className="h-5 w-5" /></button>
              </div>
            )}

            {data.hotelTiers.map((hotel) => (
              <div key={hotel.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                {editingHotelId === hotel.id ? (
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={hotelForm.name} 
                      onChange={(e) => setHotelForm({...hotelForm, name: e.target.value})}
                      className="flex-grow bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white outline-none"
                    />
                    <input 
                      type="number" 
                      value={hotelForm.pricePerNight} 
                      onChange={(e) => setHotelForm({...hotelForm, pricePerNight: e.target.value})}
                      className="w-24 bg-slate-950 border border-slate-800 rounded p-2 text-sm text-white outline-none"
                    />
                    <button onClick={handleSaveHotel} className="text-cyan-400 hover:text-cyan-300 p-1"><Save className="h-4 w-4" /></button>
                    <button onClick={() => setEditingHotelId(null)} className="text-slate-500 hover:text-white p-1"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-100">{hotel.name}</h3>
                      <p className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">PHP {hotel.pricePerNight.toLocaleString()} / Night</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditHotel(hotel)} className="text-slate-400 hover:text-cyan-400 cursor-pointer p-1"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteHotel(hotel.id)} className="text-slate-400 hover:text-rose-400 cursor-pointer p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCustomizations;
