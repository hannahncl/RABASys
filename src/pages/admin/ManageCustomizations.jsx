import React, { useEffect, useMemo, useState } from 'react';
import { customizationService } from '../../services/customizationService';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import {
  Building2,
  Compass,
  Edit,
  Hotel,
  Loader,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  Users,
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

const ManageCustomizations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDestination, setActiveDestination] = useState('');
  const [editingDestination, setEditingDestination] = useState(null);
  const [destinationForm, setDestinationForm] = useState(emptyDestinationForm);
  const [editingTourId, setEditingTourId] = useState(null);
  const [tourForm, setTourForm] = useState(emptyTourForm);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const { showNotification } = useNotification();
  const { confirm } = useConfirmation();

  const destinationNames = useMemo(
    () => Object.keys(data?.destinations || {}),
    [data]
  );

  const activeDetails = activeDestination ? data?.destinations?.[activeDestination] : null;
  const activeTours = activeDetails?.activities || [];
  const activeHotels = data?.hotels?.[activeDestination] || [];
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await customizationService.getAll();
      const names = Object.keys(result.destinations || {});
      setData(result);
      setActiveDestination(current => current && result.destinations[current] ? current : names[0] || '');
    } catch {
      showNotification('Failed to load customization data', 'error');
    } finally {
      setLoading(false);
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
    if (!(await confirm('Are you sure you want to save this destination?'))) return;
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
    if (!(await confirm(`Delete ${name} and its customization options?`))) return;

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
    if (!(await confirm('Are you sure you want to save this tour offering?'))) return;
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
    if (!(await confirm('Delete this tour offering?'))) return;
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
    if (!(await confirm('Are you sure you want to save this accommodation?'))) return;
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
    if (!(await confirm('Delete this accommodation?'))) return;
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
        <Loader className="h-6 w-6 text-[#c49b27] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Helper Banner */}
      <div className="bg-white border border-[#e0dbd0] rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Custom Trip Options & Customer Approvals</h1>
        </div>

      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-md border border-[#e0dbd0] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div>
            <h2 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Configure Catalog Options</h2>
            <p className="text-xs text-[#6b6255]">Select a destination on the left sidebar to add hotel choices and tour add-ons.</p>
          </div>
          <button
            onClick={handleAddDestination}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#2d2a24] text-[#f7f4ef] text-xs font-semibold uppercase tracking-[0.12em] hover:bg-transparent hover:text-[#2d2a24] border border-[#2d2a24] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            + Add New Destination
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-6">
          <aside className="space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-[#6b6255] font-bold px-1">Tourist Spots</div>
            {destinationNames.map(name => (
              <button
                key={name}
                onClick={() => handleDestinationSelect(name)}
                className={`w-full text-left p-3 rounded-md border transition-colors cursor-pointer ${activeDestination === name
                    ? 'bg-[#fef8e7] border-[#f5e6b8] text-[#1a1a1a] shadow-xs'
                    : 'bg-white border-[#e0dbd0] text-[#4a453b] hover:border-[#b0a68e]'
                  }`}
              >
                <span className="block text-sm font-bold">{name}</span>
                <span className="block text-[11px] text-[#6b6255] mt-0.5">{data.destinations[name]?.category || 'Custom Destination'}</span>
              </button>
            ))}
          </aside>

          <section className="space-y-6">
            {editingDestination && (
              <div className="bg-white border border-[#e0dbd0] rounded-md p-5 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between border-b border-[#eae5db] pb-3">
                  <h2 className="text-base font-bold text-[#1a1a1a]">
                    {editingDestination === 'new' ? 'New Customization Destination' : 'Edit Destination Details'}
                  </h2>
                  <button onClick={() => setEditingDestination(null)} className="text-[#6b6255] hover:text-[#1a1a1a]">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-[#6b6255] font-bold">Destination Name</span>
                    <input value={destinationForm.name} onChange={e => setDestinationForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-white border border-[#d6cfc2] rounded p-2 text-sm text-[#1a1a1a] outline-none focus:border-[#b0a68e]" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-[#6b6255] font-bold">Base Price (PHP)</span>
                    <input type="number" value={destinationForm.base} onChange={e => setDestinationForm(prev => ({ ...prev, base: e.target.value }))} className="w-full bg-white border border-[#d6cfc2] rounded p-2 text-sm text-[#1a1a1a] outline-none focus:border-[#b0a68e]" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-[#6b6255] font-bold">Category</span>
                    <input value={destinationForm.category} onChange={e => setDestinationForm(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-white border border-[#d6cfc2] rounded p-2 text-sm text-[#1a1a1a] outline-none focus:border-[#b0a68e]" />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[10px] uppercase text-[#6b6255] font-bold">Image URL</span>
                    <input value={destinationForm.image} onChange={e => setDestinationForm(prev => ({ ...prev, image: e.target.value }))} className="w-full bg-white border border-[#d6cfc2] rounded p-2 text-sm text-[#1a1a1a] outline-none focus:border-[#b0a68e]" />
                  </label>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setEditingDestination(null)} className="px-4 py-2 rounded bg-white border border-[#e0dbd0] text-[#4a453b] text-xs font-semibold uppercase tracking-[0.1em] cursor-pointer">Cancel</button>
                  <button onClick={handleSaveDestination} className="px-4 py-2 rounded bg-[#2d2a24] text-[#f7f4ef] text-xs font-semibold uppercase tracking-[0.1em] flex items-center gap-2 cursor-pointer">
                    <Save className="h-4 w-4" /> Save
                  </button>
                </div>
              </div>
            )}

            {activeDetails ? (
              <>
                <div className="bg-white border border-[#e0dbd0] rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                  {activeDetails.image && (
                    <div className="h-48 bg-slate-100">
                      <img src={activeDetails.image} alt={activeDestination} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#c49b27] font-bold">
                          <MapPin className="h-3.5 w-3.5" /> {activeDetails.category || 'Custom Destination'}
                        </div>
                        <h2 className="text-xl font-bold text-[#1a1a1a] mt-1">{activeDestination}</h2>
                        <p className="text-xs text-[#1a1a1a] font-bold mt-1">Base Cost: PHP {Number(activeDetails.base || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditDestination(activeDestination)} className="p-2 rounded bg-[#fcfbf9] border border-[#e0dbd0] text-[#6b6255] hover:text-[#1a1a1a] cursor-pointer">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteDestination(activeDestination)} className="p-2 rounded bg-[#fcfbf9] border border-[#e0dbd0] text-[#6b6255] hover:text-rose-600 cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {activeDetails.description && <p className="text-sm text-[#4a453b] leading-relaxed">{activeDetails.description}</p>}
                    {activeDetails.details && <p className="text-xs text-[#6b6255] leading-relaxed">{activeDetails.details}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#e0dbd0] rounded-md p-5 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between border-b border-[#eae5db] pb-3">
                      <h3 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
                        <Compass className="h-4 w-4 text-[#c49b27]" /> Tours Offered
                      </h3>
                      <button onClick={handleAddTour} className="text-xs bg-[#2d2a24] text-[#f7f4ef] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer">
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

                  <div className="bg-white border border-[#e0dbd0] rounded-md p-5 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between border-b border-[#eae5db] pb-3">
                      <h3 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
                        <Hotel className="h-4 w-4 text-[#c49b27]" /> Accommodations
                      </h3>
                      <button onClick={handleAddHotel} className="text-xs bg-[#2d2a24] text-[#f7f4ef] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer">
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
    </div>
  );
};

const CustomBookingReview = ({ booking, updatingId, onConfirm }) => {
  if (!booking) {
    return (
      <aside className="bg-white rounded-md border border-[#e0dbd0] p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] xl:sticky xl:top-24">
        <ReceiptText className="h-10 w-10 text-[#b0a68e] mx-auto mb-3" />
        <h3 className="text-sm font-bold text-[#1a1a1a]">Select a customized booking</h3>
        <p className="text-xs text-[#6b6255] mt-2">Review custom-trip details and confirm pending requests here.</p>
      </aside>
    );
  }

  const details = booking.customizedDetails || {};
  const activities = Array.isArray(details.activities) ? details.activities : [];
  const isPending = booking.status === 'Pending Verification';

  return (
    <aside className="bg-white rounded-md border border-[#e0dbd0] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden xl:sticky xl:top-24">
      <div className="p-5 border-b border-[#eae5db]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-[#c49b27] font-bold">{booking.id}</p>
            <h2 className="text-base font-bold text-[#1a1a1a] mt-0.5 leading-snug">{booking.packageName}</h2>
          </div>
          <span className={`shrink-0 inline-flex px-2 py-1 rounded border text-[10px] font-extrabold uppercase ${statusStyle(booking.status)}`}>
            {statusLabel(booking.status)}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider text-[#6b6255] font-bold">Customer</h3>
          <ReviewRow icon={UserRound} label="Name" value={booking.customerName} />
          <ReviewRow icon={Mail} label="Email" value={booking.customerEmail} />
          <ReviewRow icon={Phone} label="Phone" value={booking.customerPhone} />
          <ReviewRow icon={Users} label="Guests" value={`${booking.guestsCount} guest(s)`} />
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider text-[#6b6255] font-bold">Customized Trip</h3>
          <DetailLine label="Destination" value={details.destination || booking.destination || 'Not set'} />
          <DetailLine label="Accommodation" value={details.hotel || 'None'} />
          <DetailLine label="Duration" value={details.duration || booking.duration || 'Not set'} />
          <DetailLine label="Tour Date" value={formatDate(booking.tourDate)} />
          {activities.length > 0 && (
            <div className="bg-[#fcfbf9] border border-[#e0dbd0] rounded p-3">
              <p className="text-[#6b6255] text-xs font-semibold mb-2">Selected Tours</p>
              <div className="space-y-1">
                {activities.map(activity => (
                  <p key={activity} className="text-xs text-[#1a1a1a] font-medium leading-relaxed">• {activity}</p>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-wider text-[#6b6255] font-bold">Payment</h3>
          <DetailLine label="Method" value={booking.paymentMethod || 'Not set'} />
          <DetailLine label="Reference" value={booking.paymentRef || 'Not set'} mono />
          <DetailLine label="Total Paid" value={`PHP ${Number(booking.totalPrice || 0).toLocaleString()}`} strong />
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => onConfirm(booking)}
            disabled={!isPending || updatingId === booking.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirm
          </button>
        </div>
      </div>
    </aside>
  );
};

const ReviewRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="h-4 w-4 text-[#c49b27] shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] uppercase text-[#6b6255] font-bold">{label}</p>
      <p className="text-[#1a1a1a] font-medium truncate">{value || 'Not set'}</p>
    </div>
  </div>
);

const DetailLine = ({ label, value, mono, strong }) => (
  <div className="flex items-center justify-between gap-4 text-xs bg-[#fcfbf9] border border-[#e0dbd0] rounded px-3 py-2">
    <span className="text-[#6b6255]">{label}</span>
    <span className={`${mono ? 'font-mono text-[#c49b27]' : 'text-[#1a1a1a]'} ${strong ? 'font-bold text-[#1a1a1a]' : 'font-semibold'} text-right`}>
      {value}
    </span>
  </div>
);

const EditorForm = ({ form, setForm, priceKey, priceLabel = 'Price', onSave, onCancel }) => (
  <div className="bg-[#fcfbf9] border border-[#e0dbd0] rounded p-4 space-y-3">
    <input
      value={form.name}
      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
      placeholder="Name"
      className="w-full bg-white border border-[#d6cfc2] rounded p-2 text-sm text-[#1a1a1a] outline-none focus:border-[#b0a68e]"
    />
    <input
      type="number"
      value={form[priceKey]}
      onChange={e => setForm(prev => ({ ...prev, [priceKey]: e.target.value }))}
      placeholder={priceLabel}
      className="w-full bg-white border border-[#d6cfc2] rounded p-2 text-sm text-[#1a1a1a] outline-none focus:border-[#b0a68e]"
    />
    <textarea
      rows={3}
      value={form.details}
      onChange={e => setForm(prev => ({ ...prev, details: e.target.value }))}
      placeholder="Details"
      className="w-full bg-white border border-[#d6cfc2] rounded p-2 text-sm text-[#1a1a1a] outline-none focus:border-[#b0a68e] resize-none"
    />
    <div className="flex justify-end gap-2">
      <button onClick={onCancel} className="p-2 rounded bg-white border border-[#e0dbd0] text-[#6b6255] hover:text-[#1a1a1a] cursor-pointer">
        <X className="h-4 w-4" />
      </button>
      <button onClick={onSave} className="p-2 rounded bg-[#2d2a24] text-[#f7f4ef] cursor-pointer">
        <Save className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const ManageRow = ({ icon: Icon, title, subtitle, price, onEdit, onDelete }) => (
  <div className="bg-[#fcfbf9] border border-[#e0dbd0] rounded p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#c49b27] shrink-0" />
          <h4 className="text-sm font-bold text-[#1a1a1a] leading-snug">{title}</h4>
        </div>
        {subtitle && <p className="text-xs text-[#6b6255] leading-relaxed mt-1">{subtitle}</p>}
        <p className="text-xs text-[#1a1a1a] font-bold mt-2">{price}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded text-[#6b6255] hover:text-[#1a1a1a] hover:bg-white cursor-pointer">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded text-[#6b6255] hover:text-rose-600 hover:bg-white cursor-pointer">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="border border-dashed border-[#e0dbd0] rounded p-8 text-center text-xs text-[#6b6255]">
    {label}
  </div>
);

export default ManageCustomizations;
