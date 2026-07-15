import React, { useEffect, useMemo, useState } from 'react';
import { customizationService } from '../../services/customizationService';
import { bookingService } from '../../services/bookingService';
import { useNotification } from '../../hooks/useNotification';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Compass,
  Edit,
  Eye,
  Hotel,
  Loader,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  UserRound,
  Users,
  XCircle,
  X
} from 'lucide-react';

const emptyDestinationForm = {
  name: '',
  base: '',
  category: '',
  image: '',
  description: '',
  details: ''
};

const emptyTourForm = {
  name: '',
  price: '',
  details: ''
};

const emptyHotelForm = {
  name: '',
  pricePerGuest: '',
  details: ''
};

const toDestinationForm = (name, details) => ({
  name,
  base: details.base ?? '',
  category: details.category || '',
  image: details.image || '',
  description: details.description || '',
  details: details.details || ''
});

const getDestinationPayload = (form, existing = {}) => ({
  ...existing,
  base: Number(form.base) || 0,
  category: form.category,
  image: form.image,
  description: form.description,
  details: form.details,
  activities: existing.activities || []
});

const isCustomizationBooking = (booking) => (
  booking.packageId === 'custom-package' ||
  booking.packageId === 'custom' ||
  Boolean(booking.customizedDetails)
);

const statusStyle = (status) => {
  if (status === 'Confirmed') return 'bg-emerald-950/60 border-emerald-800/40 text-emerald-400';
  if (status === 'Cancelled') return 'bg-rose-950/60 border-rose-800/40 text-rose-400';
  return 'bg-amber-950/60 border-amber-800/40 text-amber-400';
};

const statusLabel = (status) => status === 'Confirmed' ? 'Booked' : status;

const formatDate = (value) => {
  if (!value) return 'Not set';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ManageCustomizations = () => {
  const [data, setData] = useState(null);
  const [customBookings, setCustomBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [activeDestination, setActiveDestination] = useState('');
  const [editingDestination, setEditingDestination] = useState(null);
  const [destinationForm, setDestinationForm] = useState(emptyDestinationForm);
  const [editingTourId, setEditingTourId] = useState(null);
  const [tourForm, setTourForm] = useState(emptyTourForm);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const [activeSection, setActiveSection] = useState('manage');
  const { showNotification } = useNotification();

  const destinationNames = useMemo(
    () => Object.keys(data?.destinations || {}),
    [data]
  );

  const activeDetails = activeDestination ? data?.destinations?.[activeDestination] : null;
  const activeTours = activeDetails?.activities || [];
  const activeHotels = data?.hotels?.[activeDestination] || [];
  const pendingCustomBookings = customBookings.filter(booking => booking.status === 'Pending Verification');
  const bookedCustomBookings = customBookings.filter(booking => booking.status === 'Confirmed');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [result, bookings] = await Promise.all([
        customizationService.getAll(),
        bookingService.getAll()
      ]);
      const names = Object.keys(result.destinations || {});
      const customizationBookings = bookings.filter(isCustomizationBooking);
      setData(result);
      setCustomBookings(customizationBookings);
      setSelectedBooking(current => current ? customizationBookings.find(booking => booking.id === current.id) || null : null);
      setActiveDestination(current => current && result.destinations[current] ? current : names[0] || '');
    } catch {
      showNotification('Failed to load customization data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingStatus = async (booking, status) => {
    const action = status === 'Confirmed' ? 'confirm this customized booking' : 'cancel this customized booking';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    setUpdatingBookingId(booking.id);
    try {
      const updated = await bookingService.updateStatus(booking.id, status);
      setCustomBookings(prev => prev.map(item => item.id === booking.id ? updated : item));
      setSelectedBooking(current => current?.id === booking.id ? updated : current);
      showNotification(status === 'Confirmed' ? 'Customized booking confirmed' : 'Customized booking cancelled', 'success');
    } catch {
      showNotification('Failed to update customized booking', 'error');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const resetInlineForms = () => {
    setEditingTourId(null);
    setTourForm(emptyTourForm);
    setEditingHotelId(null);
    setHotelForm(emptyHotelForm);
  };

  const handleDestinationSelect = (name) => {
    setActiveDestination(name);
    setEditingDestination(null);
    setDestinationForm(emptyDestinationForm);
    resetInlineForms();
  };

  const handleAddDestination = () => {
    setEditingDestination('new');
    setDestinationForm(emptyDestinationForm);
    resetInlineForms();
  };

  const handleEditDestination = (name) => {
    setEditingDestination(name);
    setDestinationForm(toDestinationForm(name, data.destinations[name]));
    resetInlineForms();
  };

  const handleSaveDestination = async () => {
    if (!destinationForm.name.trim()) {
      showNotification('Destination name is required.', 'warning');
      return;
    }

    const nextName = destinationForm.name.trim();
    const destinations = { ...data.destinations };
    const hotels = { ...data.hotels };
    const existingName = editingDestination === 'new' ? nextName : editingDestination;
    const existingDestination = destinations[existingName] || {};

    destinations[nextName] = getDestinationPayload(destinationForm, existingDestination);
    hotels[nextName] = hotels[existingName] || [];

    if (editingDestination !== 'new' && editingDestination !== nextName) {
      delete destinations[editingDestination];
      delete hotels[editingDestination];
    }

    try {
      const afterDestinations = await customizationService.updateDestinations(destinations);
      const afterHotels = await customizationService.updateHotels(hotels);
      setData({ ...afterDestinations, hotels: afterHotels.hotels });
      setActiveDestination(nextName);
      setEditingDestination(null);
      showNotification('Customization destination saved', 'success');
    } catch {
      showNotification('Failed to save destination', 'error');
    }
  };

  const handleDeleteDestination = async (name) => {
    if (!window.confirm(`Delete ${name} and its customization options?`)) return;

    const destinations = { ...data.destinations };
    const hotels = { ...data.hotels };
    delete destinations[name];
    delete hotels[name];

    try {
      const afterDestinations = await customizationService.updateDestinations(destinations);
      const afterHotels = await customizationService.updateHotels(hotels);
      const nextNames = Object.keys(destinations);
      setData({ ...afterDestinations, hotels: afterHotels.hotels });
      setActiveDestination(nextNames[0] || '');
      showNotification('Destination deleted', 'success');
    } catch {
      showNotification('Failed to delete destination', 'error');
    }
  };

  const saveDestinationActivities = async (activities) => {
    const destinations = {
      ...data.destinations,
      [activeDestination]: {
        ...activeDetails,
        activities
      }
    };
    const updated = await customizationService.updateDestinations(destinations);
    setData(prev => ({ ...prev, destinations: updated.destinations }));
  };

  const handleAddTour = () => {
    setEditingTourId('new');
    setTourForm(emptyTourForm);
  };

  const handleEditTour = (tour) => {
    setEditingTourId(tour.id);
    setTourForm({
      name: tour.name,
      price: tour.price ?? '',
      details: tour.details || ''
    });
  };

  const handleSaveTour = async () => {
    if (!activeDestination || !tourForm.name.trim()) {
      showNotification('Tour name is required.', 'warning');
      return;
    }

    const payload = {
      id: editingTourId === 'new' ? `tour_${Date.now()}` : editingTourId,
      name: tourForm.name.trim(),
      price: Number(tourForm.price) || 0,
      details: tourForm.details
    };

    const activities = editingTourId === 'new'
      ? [...activeTours, payload]
      : activeTours.map(tour => tour.id === editingTourId ? payload : tour);

    try {
      await saveDestinationActivities(activities);
      setEditingTourId(null);
      setTourForm(emptyTourForm);
      showNotification('Tour offering saved', 'success');
    } catch {
      showNotification('Failed to save tour offering', 'error');
    }
  };

  const handleDeleteTour = async (id) => {
    if (!window.confirm('Delete this tour offering?')) return;
    try {
      await saveDestinationActivities(activeTours.filter(tour => tour.id !== id));
      showNotification('Tour offering deleted', 'success');
    } catch {
      showNotification('Failed to delete tour offering', 'error');
    }
  };

  const saveDestinationHotels = async (hotelsForDestination) => {
    const hotels = {
      ...data.hotels,
      [activeDestination]: hotelsForDestination
    };
    const updated = await customizationService.updateHotels(hotels);
    setData(prev => ({ ...prev, hotels: updated.hotels }));
  };

  const handleAddHotel = () => {
    setEditingHotelId('new');
    setHotelForm(emptyHotelForm);
  };

  const handleEditHotel = (hotel) => {
    setEditingHotelId(hotel.id);
    setHotelForm({
      name: hotel.name,
      pricePerGuest: hotel.pricePerGuest ?? '',
      details: hotel.details || ''
    });
  };

  const handleSaveHotel = async () => {
    if (!activeDestination || !hotelForm.name.trim()) {
      showNotification('Hotel name is required.', 'warning');
      return;
    }

    const payload = {
      id: editingHotelId === 'new' ? `hotel_${Date.now()}` : editingHotelId,
      name: hotelForm.name.trim(),
      pricePerGuest: Number(hotelForm.pricePerGuest) || 0,
      details: hotelForm.details
    };

    const hotelsForDestination = editingHotelId === 'new'
      ? [...activeHotels, payload]
      : activeHotels.map(hotel => hotel.id === editingHotelId ? payload : hotel);

    try {
      await saveDestinationHotels(hotelsForDestination);
      setEditingHotelId(null);
      setHotelForm(emptyHotelForm);
      showNotification('Accommodation saved', 'success');
    } catch {
      showNotification('Failed to save accommodation', 'error');
    }
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Delete this accommodation?')) return;
    try {
      await saveDestinationHotels(activeHotels.filter(hotel => hotel.id !== id));
      showNotification('Accommodation deleted', 'success');
    } catch {
      showNotification('Failed to delete accommodation', 'error');
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-100">Customization Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage custom-trip destinations, tour offerings, and accommodations using the tourist spot information.
          </p>
        </div>
        {activeSection === 'manage' && (
          <button
            onClick={handleAddDestination}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-sm font-bold transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Destination
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          type="button"
          onClick={() => setActiveSection('manage')}
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
            activeSection === 'manage'
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Manage Customizations
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('review')}
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
            activeSection === 'review'
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Review & Approval
        </button>
      </div>

      {activeSection === 'review' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start mt-6">
          <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-900">
              <div>
                <h2 className="text-lg font-bold text-slate-100 font-display">Customization Review & Approval</h2>
                <p className="text-xs text-slate-500 mt-1">Review custom-trip bookings before marking them as booked.</p>
              </div>
              <div className="flex gap-2 text-[10px] font-bold uppercase">
                <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {pendingCustomBookings.length} Pending
                </span>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {bookedCustomBookings.length} Booked
                </span>
              </div>
            </div>

            {customBookings.length === 0 ? (
              <EmptyState label="No customized bookings submitted yet." />
            ) : (
              <div className="divide-y divide-slate-900">
                {customBookings.map(booking => (
                  <div key={booking.id} className="grid grid-cols-1 md:grid-cols-[1fr_0.8fr_0.7fr_auto] gap-4 px-5 py-4 items-center hover:bg-slate-900/30">
                    <div>
                      <p className="font-mono text-[10px] text-cyan-400 font-bold">{booking.id}</p>
                      <h3 className="text-sm font-bold text-slate-100 mt-1">{booking.packageName}</h3>
                      <p className="text-xs text-slate-500 mt-1">{booking.customizedDetails?.destination || booking.destination || 'Customized trip'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{booking.customerName}</p>
                      <p className="text-xs text-slate-500">{formatDate(booking.tourDate)}</p>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-extrabold uppercase ${statusStyle(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                      <p className="text-xs text-cyan-400 font-bold mt-2">PHP {Number(booking.totalPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex md:justify-end gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 cursor-pointer"
                        title="Review customized booking"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {booking.status === 'Pending Verification' && (
                        <button
                          onClick={() => handleBookingStatus(booking, 'Confirmed')}
                          disabled={updatingBookingId === booking.id}
                          className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
                          title="Confirm customized booking"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CustomBookingReview
            booking={selectedBooking}
            updatingId={updatingBookingId}
            onConfirm={(booking) => handleBookingStatus(booking, 'Confirmed')}
            onCancel={(booking) => handleBookingStatus(booking, 'Cancelled')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-6">
          <aside className="space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">Tourist Spots</div>
            {destinationNames.map(name => (
              <button
                key={name}
                onClick={() => handleDestinationSelect(name)}
                className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  activeDestination === name
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="block text-sm font-bold">{name}</span>
                <span className="block text-[11px] text-slate-500 mt-1">{data.destinations[name]?.category || 'Custom Destination'}</span>
              </button>
            ))}
          </aside>

          <section className="space-y-6">
            {editingDestination && (
              <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-cyan-300">
                    {editingDestination === 'new' ? 'New Customization Destination' : 'Edit Destination Details'}
                  </h2>
                  <button onClick={() => setEditingDestination(null)} className="text-slate-500 hover:text-slate-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-slate-500 font-bold">Destination Name</span>
                    <input value={destinationForm.name} onChange={e => setDestinationForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-slate-500 font-bold">Base Price (PHP)</span>
                    <input type="number" value={destinationForm.base} onChange={e => setDestinationForm(prev => ({ ...prev, base: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-slate-500 font-bold">Category</span>
                    <input value={destinationForm.category} onChange={e => setDestinationForm(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-slate-500 font-bold">Image URL</span>
                    <input value={destinationForm.image} onChange={e => setDestinationForm(prev => ({ ...prev, image: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500" />
                  </label>
                </div>

                <label className="space-y-1 block">
                  <span className="block text-[10px] uppercase text-slate-500 font-bold">Tourist Spot Info</span>
                  <textarea rows={3} value={destinationForm.description} onChange={e => setDestinationForm(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500 resize-none" />
                </label>
                <label className="space-y-1 block">
                  <span className="block text-[10px] uppercase text-slate-500 font-bold">Customization Details</span>
                  <textarea rows={3} value={destinationForm.details} onChange={e => setDestinationForm(prev => ({ ...prev, details: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500 resize-none" />
                </label>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingDestination(null)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm cursor-pointer">Cancel</button>
                  <button onClick={handleSaveDestination} className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-sm font-bold flex items-center gap-2 cursor-pointer">
                    <Save className="h-4 w-4" /> Save
                  </button>
                </div>
              </div>
            )}

            {activeDetails ? (
              <>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                  {activeDetails.image && (
                    <div className="h-48 bg-slate-800">
                      <img src={activeDetails.image} alt={activeDestination} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
                          <MapPin className="h-3.5 w-3.5" /> {activeDetails.category || 'Custom Destination'}
                        </div>
                        <h2 className="text-xl font-bold text-slate-100 mt-1">{activeDestination}</h2>
                        <p className="text-xs text-cyan-400 font-bold mt-1">Base: PHP {Number(activeDetails.base || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditDestination(activeDestination)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 cursor-pointer">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteDestination(activeDestination)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {activeDetails.description && <p className="text-sm text-slate-300 leading-relaxed">{activeDetails.description}</p>}
                    {activeDetails.details && <p className="text-xs text-slate-500 leading-relaxed">{activeDetails.details}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Compass className="h-5 w-5 text-cyan-400" /> Tours Offered
                      </h3>
                      <button onClick={handleAddTour} className="text-xs bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>

                    {editingTourId === 'new' && (
                      <EditorForm form={tourForm} setForm={setTourForm} priceKey="price" onSave={handleSaveTour} onCancel={() => setEditingTourId(null)} />
                    )}

                    <div className="space-y-3">
                      {activeTours.map(tour => (
                        editingTourId === tour.id ? (
                          <EditorForm key={tour.id} form={tourForm} setForm={setTourForm} priceKey="price" onSave={handleSaveTour} onCancel={() => setEditingTourId(null)} />
                        ) : (
                          <ManageRow
                            key={tour.id}
                            icon={Compass}
                            title={tour.name}
                            subtitle={tour.details}
                            price={`PHP ${Number(tour.price || 0).toLocaleString()}`}
                            onEdit={() => handleEditTour(tour)}
                            onDelete={() => handleDeleteTour(tour.id)}
                          />
                        )
                      ))}
                      {activeTours.length === 0 && editingTourId !== 'new' && <EmptyState label="No tours offered yet." />}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Hotel className="h-5 w-5 text-cyan-400" /> Accommodations
                      </h3>
                      <button onClick={handleAddHotel} className="text-xs bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>

                    {editingHotelId === 'new' && (
                      <EditorForm form={hotelForm} setForm={setHotelForm} priceKey="pricePerGuest" priceLabel="Price / Guest" onSave={handleSaveHotel} onCancel={() => setEditingHotelId(null)} />
                    )}

                    <div className="space-y-3">
                      {activeHotels.map(hotel => (
                        editingHotelId === hotel.id ? (
                          <EditorForm key={hotel.id} form={hotelForm} setForm={setHotelForm} priceKey="pricePerGuest" priceLabel="Price / Guest" onSave={handleSaveHotel} onCancel={() => setEditingHotelId(null)} />
                        ) : (
                          <ManageRow
                            key={hotel.id}
                            icon={Building2}
                            title={hotel.name}
                            subtitle={hotel.details}
                            price={`PHP ${Number(hotel.pricePerGuest || 0).toLocaleString()} / Guest`}
                            onEdit={() => handleEditHotel(hotel)}
                            onDelete={() => handleDeleteHotel(hotel.id)}
                          />
                        )
                      ))}
                      {activeHotels.length === 0 && editingHotelId !== 'new' && <EmptyState label="No accommodations yet." />}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState label="Add a destination to start configuring custom trips." />
            )}
          </section>
        </div>
      )}
    </div>
  );
};
const CustomBookingReview = ({ booking, updatingId, onConfirm, onCancel }) => {
  if (!booking) {
    return (
      <aside className="glass-panel rounded-2xl border-slate-800 p-8 text-center xl:sticky xl:top-24">
        <ReceiptText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-300">Select a customized booking</h3>
        <p className="text-xs text-slate-500 mt-2">Review custom-trip details and confirm pending requests here.</p>
      </aside>
    );
  }

  const details = booking.customizedDetails || {};
  const activities = Array.isArray(details.activities) ? details.activities : [];
  const isPending = booking.status === 'Pending Verification';

  return (
    <aside className="glass-panel rounded-2xl border-slate-800 overflow-hidden xl:sticky xl:top-24">
      <div className="p-5 border-b border-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-cyan-400 font-bold">{booking.id}</p>
            <h2 className="text-lg font-bold text-slate-100 mt-1 leading-snug">{booking.packageName}</h2>
          </div>
          <span className={`shrink-0 inline-flex px-2 py-1 rounded-full border text-[10px] font-extrabold uppercase ${statusStyle(booking.status)}`}>
            {statusLabel(booking.status)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Customer</h3>
          <ReviewRow icon={UserRound} label="Name" value={booking.customerName} />
          <ReviewRow icon={Mail} label="Email" value={booking.customerEmail} />
          <ReviewRow icon={Phone} label="Phone" value={booking.customerPhone} />
          <ReviewRow icon={Users} label="Guests" value={`${booking.guestsCount} guest(s)`} />
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Customized Trip</h3>
          <DetailLine label="Destination" value={details.destination || booking.destination || 'Not set'} />
          <DetailLine label="Accommodation" value={details.hotel || 'None'} />
          <DetailLine label="Duration" value={details.duration || booking.duration || 'Not set'} />
          <DetailLine label="Tour Date" value={formatDate(booking.tourDate)} />
          {activities.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-900 rounded-lg px-3 py-2">
              <p className="text-slate-500 text-sm mb-2">Selected Tours</p>
              <div className="space-y-1">
                {activities.map(activity => (
                  <p key={activity} className="text-xs text-slate-300 leading-relaxed">- {activity}</p>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Payment</h3>
          <DetailLine label="Method" value={booking.paymentMethod || 'Not set'} />
          <DetailLine label="Reference" value={booking.paymentRef || 'Not set'} mono />
          <DetailLine label="Total Paid" value={`PHP ${Number(booking.totalPrice || 0).toLocaleString()}`} strong />
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => onConfirm(booking)}
            disabled={!isPending || updatingId === booking.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirm
          </button>
          <button
            onClick={() => onCancel(booking)}
            disabled={booking.status === 'Cancelled' || updatingId === booking.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4" /> Cancel
          </button>
        </div>
      </div>
    </aside>
  );
};

const ReviewRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] uppercase text-slate-500 font-bold">{label}</p>
      <p className="text-slate-200 truncate">{value || 'Not set'}</p>
    </div>
  </div>
);

const DetailLine = ({ label, value, mono, strong }) => (
  <div className="flex items-center justify-between gap-4 text-sm bg-slate-950/60 border border-slate-900 rounded-lg px-3 py-2">
    <span className="text-slate-500">{label}</span>
    <span className={`${mono ? 'font-mono text-cyan-400' : 'text-slate-200'} ${strong ? 'font-extrabold text-cyan-400' : 'font-semibold'} text-right`}>
      {value}
    </span>
  </div>
);

const EditorForm = ({ form, setForm, priceKey, priceLabel = 'Price', onSave, onCancel }) => (
  <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-4 space-y-3">
    <input
      value={form.name}
      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
      placeholder="Name"
      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500"
    />
    <input
      type="number"
      value={form[priceKey]}
      onChange={e => setForm(prev => ({ ...prev, [priceKey]: e.target.value }))}
      placeholder={priceLabel}
      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500"
    />
    <textarea
      rows={3}
      value={form.details}
      onChange={e => setForm(prev => ({ ...prev, details: e.target.value }))}
      placeholder="Details"
      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-cyan-500 resize-none"
    />
    <div className="flex justify-end gap-2">
      <button onClick={onCancel} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer">
        <X className="h-4 w-4" />
      </button>
      <button onClick={onSave} className="p-2 rounded-lg bg-cyan-400 text-slate-950 cursor-pointer">
        <Save className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const ManageRow = ({ icon: Icon, title, subtitle, price, onEdit, onDelete }) => (
  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
          <h4 className="text-sm font-bold text-slate-100 leading-snug">{title}</h4>
        </div>
        {subtitle && <p className="text-xs text-slate-500 leading-relaxed mt-2">{subtitle}</p>}
        <p className="text-xs text-cyan-400 font-bold mt-2">{price}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500">
    {label}
  </div>
);

export default ManageCustomizations;
