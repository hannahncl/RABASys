import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import GCashModal from '../../components/payment/GCashModal';
import { bookingService } from '../../services/bookingService';
import { customizationService } from '../../services/customizationService';
import mapGalleryService from '../../services/mapGalleryService';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/* ─── Inline Calendar Component ─── */
const CalendarPicker = ({ selectedDates, onDateSelect, onDone, onCancel }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [startTime, setStartTime] = useState({ h: '10', m: '30', period: 'am' });
  const [endTime, setEndTime] = useState({ h: '05', m: '30', period: 'pm' });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateStr);
  };

  const isSelected = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDates.includes(dateStr);
  };

  const isInRange = (day) => {
    if (selectedDates.length < 2) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sorted = [...selectedDates].sort();
    return dateStr > sorted[0] && dateStr < sorted[sorted.length - 1];
  };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const trailingDays = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    trailingDays.push(prevMonthDays - i);
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', padding: '20px', width: '100%', maxWidth: '320px' }}>
      {/* Time Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1e293b', color: '#fff', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}>
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>☽</span>
          <input type="text" value={startTime.h} onChange={e => setStartTime({...startTime, h: e.target.value})}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '12px', border: 'none', outline: 'none', color: '#fff' }} />
          <span>:</span>
          <input type="text" value={startTime.m} onChange={e => setStartTime({...startTime, m: e.target.value})}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '12px', border: 'none', outline: 'none', color: '#fff' }} />
          <select value={startTime.period} onChange={e => setStartTime({...startTime, period: e.target.value})}
            style={{ background: 'transparent', fontSize: '12px', border: 'none', outline: 'none', cursor: 'pointer', color: '#fff', marginLeft: '2px' }}>
            <option value="am">am</option><option value="pm">pm</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>☀</span>
          <input type="text" value={endTime.h} onChange={e => setEndTime({...endTime, h: e.target.value})}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '12px', border: 'none', outline: 'none', color: '#374151' }} />
          <span>:</span>
          <input type="text" value={endTime.m} onChange={e => setEndTime({...endTime, m: e.target.value})}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '12px', border: 'none', outline: 'none', color: '#374151' }} />
          <select value={endTime.period} onChange={e => setEndTime({...endTime, period: e.target.value})}
            style={{ background: 'transparent', fontSize: '12px', border: 'none', outline: 'none', cursor: 'pointer', color: '#374151', marginLeft: '2px' }}>
            <option value="am">am</option><option value="pm">pm</option>
          </select>
        </div>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={prevMonth} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex' }}>
          <ChevronLeft style={{ width: 16, height: 16, color: '#6b7280' }} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>{monthName} {year}</span>
        <button onClick={nextMonth} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex' }}>
          <ChevronRight style={{ width: 16, height: 16, color: '#6b7280' }} />
        </button>
      </div>

      {/* Day Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#9ca3af', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {trailingDays.map((d, i) => (
          <div key={`prev-${i}`} style={{ textAlign: 'center', fontSize: '11px', color: '#d1d5db', padding: '6px 0' }}>{d}</div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const sel = isSelected(day);
          const range = isInRange(day);
          const td = isToday(day);
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              style={{
                textAlign: 'center', fontSize: '11px', padding: '6px 0', borderRadius: '50%',
                border: 'none', cursor: 'pointer', fontWeight: sel || td ? 700 : 500,
                background: sel ? '#facc15' : range ? '#fef9c3' : td ? '#06b6d4' : 'transparent',
                color: sel ? '#1f2937' : td ? '#fff' : '#374151',
                transition: 'all 0.15s'
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={onCancel} style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={() => onDone(startTime, endTime)} style={{ padding: '6px 20px', fontSize: '12px', fontWeight: 600, color: '#fff', background: '#1f2937', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          Done
        </button>
      </div>
    </div>
  );
};

/* ─── Styles (inline to bypass theme CSS variable overrides) ─── */
const S = {
  page: { background: '#ffffff', minHeight: '100vh', color: '#1f2937', fontFamily: "'Inter', system-ui, sans-serif" },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '40px 16px' },
  h1: { fontSize: '1.65rem', fontWeight: 800, color: '#111827', lineHeight: 1.3, fontFamily: "'Outfit', system-ui, sans-serif" },
  subtitle: { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '6px' },
  input: { width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '14px' },
  card: (active) => ({
    textAlign: 'left', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
    border: active ? '2px solid #facc15' : '1px solid #e5e7eb',
    background: active ? '#fefce8' : '#fff',
    boxShadow: active ? '0 2px 8px rgba(250,204,21,0.15)' : 'none'
  }),
  cardName: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#1f2937' },
  cardSub: { display: 'block', fontSize: '10px', color: '#6b7280', marginTop: '2px' },
  destBtn: (active) => ({
    padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
    border: active ? '2px solid #facc15' : '1px solid #e5e7eb',
    background: active ? '#fefce8' : '#fff',
    fontSize: '13px', fontWeight: 600, color: '#1f2937',
  }),
  sectionBox: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px' },
  estimatePanel: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', position: 'sticky', top: '96px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  bookBtn: { width: '100%', padding: '14px', background: '#facc15', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#1f2937', cursor: 'pointer', fontFamily: "'Outfit', system-ui, sans-serif", transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(250,204,21,0.25)' },
};

/* ─── Main Component ─── */
const CustomPlanner = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [numDays, setNumDays] = useState('');
  const [numNights, setNumNights] = useState('');
  const [numGuests, setNumGuests] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [destination, setDestination] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const result = await customizationService.getAll();
        setData(result);
        const first = Object.keys(result.destinations)[0];
        if (first) setDestination(first);
        
        const spotsData = await mapGalleryService.getSpots();
        setSpots(spotsData);
      } catch { showNotification('Failed to load customization options.', 'error'); }
      finally { setLoading(false); }
    })();
  }, [showNotification]);

  useEffect(() => { setSelectedHotel(null); setSelectedActivities([]); }, [destination]);

  const handleDateSelect = useCallback((dateStr) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      if (prev.length >= 2) return [dateStr];
      return [...prev, dateStr].sort();
    });
  }, []);

  const handleActivityToggle = (actId) => {
    setSelectedActivities(prev => prev.includes(actId) ? prev.filter(id => id !== actId) : [...prev, actId]);
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff' }}>
        <Loader style={{ width: 32, height: 32, color: '#facc15', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 12, fontWeight: 600, fontSize: 14, color: '#374151' }}>Loading planner...</span>
      </div>
    );
  }

  const getMarkerIcon = (spot) => {
    return L.divIcon({
      className: 'custom-marker-wrapper',
      html: `
        <div class="relative flex flex-col items-center group cursor-pointer" style="z-index: 400;">
          <div class="relative flex items-center justify-center h-9 w-9 rounded-full border-2 border-white shadow-xl overflow-hidden">
            <img src="${spot.featuredImage}" class="w-full h-full object-cover" />
          </div>
          <div class="absolute -bottom-7 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold py-0.5 px-2 rounded-full whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            ${spot.name.split(',')[0]}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const currentDest = data.destinations[destination];
  const currentHotels = data.hotels?.[destination] || [];

  const destCost = currentDest?.base || 0;
  const hotelCost = selectedHotel?.pricePerGuest || 0;
  const activitiesCost = 0; // Activities are checkbox selections without individual pricing
  const guestCount = Number(numGuests) || 0;
  const totalCost = (destCost + hotelCost + activitiesCost) * (guestCount || 1);

  const handleBook = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) { showNotification('Please fill in all contact fields.', 'warning'); return; }
    if (!destination) { showNotification('Please select a destination.', 'warning'); return; }
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (referenceNumber, gcashNumber) => {
    setPaymentModalOpen(false);
    setSubmitting(true);
    try {
      const selectedActNames = selectedActivities.map(actId => currentDest.activities.find(a => a.id === actId)?.name).filter(Boolean);
      await bookingService.create({
        packageId: 'custom-package',
        packageName: `Customized TukTrip: ${destination} (${numDays || 0} Days / ${numNights || 0} Nights)`,
        customerName: `${firstName} ${lastName}`,
        customerEmail: email, customerPhone: phone,
        tourDate: selectedDates[0] || new Date().toISOString().split('T')[0],
        guestsCount: guestCount, totalPrice: totalCost,
        paymentMethod: 'GCash', paymentRef: referenceNumber, gcashNumber,
        customizedDetails: { destination, hotel: selectedHotel?.name || 'None', duration: `${numDays || 0} Days / ${numNights || 0} Nights`, activities: selectedActNames }
      });
      showNotification('Your customized booking will undergo verification and approval. Once approved, the booking will be sent to your email.', 'success');
      navigate('/');
    } catch { showNotification('Error registering custom trip booking.', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }} id="customize-header">
          <h1 style={S.h1}>Try the First Ever TukTrip in Bicol Region with Rabas!</h1>
          <p style={S.subtitle}>Choose your destination, hotels, and activities with real-time price updates.</p>
        </div>

        {/* Top: Form + Calendar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '40px' }} className="lg-grid-top">
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }} className="top-inner-grid">

            {/* Left form */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={S.label}>Number of Days</label>
                  <input id="input-days" type="number" min="0" max="30" value={numDays} onChange={e => setNumDays(e.target.value)} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Number of Nights</label>
                  <input id="input-nights" type="number" min="0" max="30" value={numNights} onChange={e => setNumNights(e.target.value)} style={S.input} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={S.label}>Number of Guests / PAX</label>
                  <input 
                    id="input-guests" 
                    type="number" 
                    min="1" 
                    max="3" 
                    value={numGuests} 
                    onChange={e => {
                      let val = e.target.value;
                      if (val !== '') {
                        const num = Number(val);
                        if (num > 3) {
                          val = '3';
                          showNotification('Maximum of 3 guests allowed per trip.', 'warning');
                        } else if (num < 1) {
                          val = '1';
                        }
                      }
                      setNumGuests(val);
                    }} 
                    style={S.input} 
                  />
                  <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>Note: Maximum of 3 guests/pax only</p>
                </div>
                <div>
                  <label style={S.label}>Preferred Date</label>
                  <div style={{ ...S.input, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: '37px' }}>
                     <input type="text" placeholder="YYYY-MM-DD" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#111827', width: '40%', textAlign: 'center' }} 
                        value={selectedDates[0] || ''} 
                        onChange={(e) => {
                           const val = e.target.value;
                           setSelectedDates(prev => {
                              let newDates = [val, prev[1] || ''];
                              if (!newDates[0] && !newDates[1]) return [];
                              return newDates;
                           });
                        }} 
                     />
                     <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>to</span>
                     <input type="text" placeholder="YYYY-MM-DD" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: '#111827', width: '40%', textAlign: 'center' }} 
                        value={selectedDates[1] || ''} 
                        onChange={(e) => {
                           const val = e.target.value;
                           setSelectedDates(prev => {
                              let newDates = [prev[0] || '', val];
                              if (!newDates[0] && !newDates[1]) return [];
                              return newDates;
                           });
                        }} 
                     />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div style={{ paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Tourist Contact Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <label style={S.label}>First Name</label>
                    <input id="input-firstname" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Last Name</label>
                    <input id="input-lastname" type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={S.input} />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={S.label}>Email Address</label>
                  <input id="input-email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Contact Number</label>
                  <input id="input-phone" type="text" value={phone} onChange={e => setPhone(e.target.value)} style={S.input} />
                </div>
              </div>
            </div>

            {/* Right calendar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
              <CalendarPicker selectedDates={selectedDates} onDateSelect={handleDateSelect}
                onDone={() => {}} onCancel={() => setSelectedDates([])} />
            </div>
          </div>
        </div>

        {/* Main Steps + Sidebar Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }} className="bottom-grid">
          
          {/* LEFT: Master Steps Container */}
          <div style={{ ...S.sectionBox, display: 'flex', flexDirection: 'column', gap: '40px' }} id="steps-container">
            
            {/* 1. Destination */}
            <div id="section-destination">
              <h3 style={S.sectionTitle}>1. Select Destination</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.keys(data.destinations).map(dest => (
                  <button key={dest} onClick={() => setDestination(dest)} style={S.destBtn(destination === dest)}>
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Accommodation */}
            <div id="section-accommodation">
              <h3 style={S.sectionTitle}>2. Select Accommodation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {currentHotels.map(hotel => (
                  <button key={hotel.id} onClick={() => setSelectedHotel(hotel)} style={S.card(selectedHotel?.id === hotel.id)}>
                    <span style={S.cardName}>{hotel.name}</span>
                    <span style={S.cardSub}>Base Cost: PHP {hotel.pricePerGuest.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / Guest</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Choose Custom Activities */}
            <div id="section-activities">
              <h3 style={S.sectionTitle}>3. Choose Custom Activities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentDest?.activities?.map(act => {
                  const isChecked = selectedActivities.includes(act.id);
                  return (
                    <label
                      key={act.id}
                      onClick={() => handleActivityToggle(act.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                        border: isChecked ? '1.5px solid #facc15' : '1px solid #e5e7eb',
                        background: isChecked ? '#fefce8' : '#fff',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '16px', height: '16px', minWidth: '16px', marginTop: '2px',
                        border: isChecked ? '2px solid #facc15' : '1.5px solid #d1d5db',
                        borderRadius: '3px', background: isChecked ? '#facc15' : '#fff',
                        transition: 'all 0.15s',
                      }}>
                        {isChecked && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ display: 'block' }}>
                            <path d="M2 5L4.5 7.5L8 3" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{act.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT: Estimate & Map Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Estimate panel (No longer sticky because map needs to be sticky, or they can both be sticky if container is short) */}
            <div style={{ ...S.estimatePanel, position: 'relative', top: '0' }} id="section-estimate">
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '20px', textAlign: 'center' }}>Real-Time Estimate</h3>
              <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '20px', marginBottom: '20px' }}>
                {[
                  ['Destination:', `PHP ${destCost.toFixed(2)}`, guestCount],
                  ['Accommodation:', `PHP ${hotelCost.toFixed(2)}`, guestCount],
                  ['Selected Activities:', `PHP ${activitiesCost.toFixed(2)}`, guestCount]
                ].map(([label, val, g], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{val} <span style={{ color: '#9ca3af', fontSize: '11px' }}>x{g}</span></span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Estimated Total</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', fontFamily: "'Outfit', system-ui, sans-serif" }}>PHP {totalCost.toFixed(2)}</span>
              </div>
              <button id="btn-book-customized" onClick={handleBook} disabled={submitting}
                style={{ ...S.bookBtn, opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Registering...' : 'Book Customized Trip'}
              </button>
              <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', marginTop: '16px', lineHeight: '1.6' }}>
                Note: Your customized booking will undergo verification and approval first.<br />
                Once approved, the approved booking will be sent to your email.
              </p>
            </div>

            {/* Bicol Region Map */}
            <div style={{ position: 'sticky', top: '96px', alignSelf: 'start', width: '100%' }}>
              <div style={{
                borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '460px', zIndex: 0
              }}>
                <MapContainer
                  center={[13.4, 123.6]}
                  zoom={8.5}
                  className="w-full h-full"
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {spots.map(spot => (
                    <Marker
                      key={spot.id}
                      position={spot.coords}
                      icon={getMarkerIcon(spot)}
                    />
                  ))}
                </MapContainer>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Responsive media query via style tag */}
      <style>{`
        @media (max-width: 1024px) {
          .top-inner-grid { grid-template-columns: 1fr !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
          .activities-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <GCashModal isOpen={paymentModalOpen} amount={totalCost}
        onClose={() => setPaymentModalOpen(false)} onPaymentSuccess={handlePaymentSuccess} />
    </div>
  );
};

export default CustomPlanner;
