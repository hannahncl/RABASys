import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
<<<<<<< HEAD
<<<<<<< HEAD
import { bookingService } from '../services/bookingService';
import { customizationService } from '../services/customizationService';
=======
=======
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
import { customizationService } from '../../services/customizationService';
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
import { ChevronLeft, ChevronRight, Loader, Calendar } from 'lucide-react';

/* ─── Color Palette & Common Styles ─── */
const colors = {
  bg: '#ffffff',
  subtleBg: '#fcfbf9',
  cardBg: '#ffffff',
  border: '#d6cfc2',
  borderLight: '#eae5db',
  textPrimary: '#1a1a1a',
  textSecondary: '#4a453b',
  textMuted: '#8a8275',
  accent: '#6b6255',
  accentDark: '#1a1715',
  requiredRed: '#b83b3b',
};

const inputStyle = {
  background: '#ffffff',
  border: `1px solid ${colors.border}`,
  borderRadius: '2px',
  color: colors.textPrimary,
  fontSize: '14px',
  fontFamily: "'Inter', sans-serif",
};

const inputFocusHandlers = {
  onFocus: (e) => {
    e.target.style.borderColor = colors.accentDark;
    e.target.style.boxShadow = '0 0 0 3px rgba(26,23,21,0.05)';
  },
  onBlur: (e) => {
    e.target.style.borderColor = colors.border;
    e.target.style.boxShadow = 'none';
  },
};

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
    <div style={{ background: '#ffffff', borderRadius: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}`, padding: '20px', width: '100%', maxWidth: '320px' }}>
      {/* Time Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: colors.accentDark, color: '#f7f4ef', borderRadius: '2px', padding: '6px 12px', fontSize: '11px', fontWeight: 600 }}>
          <span style={{ color: '#c4b99a', fontSize: '10px' }}>☽</span>
          <input type="text" value={startTime.h} onChange={e => setStartTime({ ...startTime, h: e.target.value })}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '11px', border: 'none', outline: 'none', color: '#f7f4ef' }} />
          <span>:</span>
          <input type="text" value={startTime.m} onChange={e => setStartTime({ ...startTime, m: e.target.value })}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '11px', border: 'none', outline: 'none', color: '#f7f4ef' }} />
          <select value={startTime.period} onChange={e => setStartTime({ ...startTime, period: e.target.value })}
            style={{ background: 'transparent', fontSize: '11px', border: 'none', outline: 'none', cursor: 'pointer', color: '#f7f4ef', marginLeft: '2px' }}>
            <option value="am" style={{ color: colors.textPrimary }}>am</option><option value="pm" style={{ color: colors.textPrimary }}>pm</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: colors.subtleBg, border: `1px solid ${colors.borderLight}`, borderRadius: '2px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: colors.textPrimary }}>
          <span style={{ color: colors.textMuted, fontSize: '10px' }}>☀</span>
          <input type="text" value={endTime.h} onChange={e => setEndTime({ ...endTime, h: e.target.value })}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '11px', border: 'none', outline: 'none', color: colors.textPrimary }} />
          <span>:</span>
          <input type="text" value={endTime.m} onChange={e => setEndTime({ ...endTime, m: e.target.value })}
            style={{ width: '20px', background: 'transparent', textAlign: 'center', fontSize: '11px', border: 'none', outline: 'none', color: colors.textPrimary }} />
          <select value={endTime.period} onChange={e => setEndTime({ ...endTime, period: e.target.value })}
            style={{ background: 'transparent', fontSize: '11px', border: 'none', outline: 'none', cursor: 'pointer', color: colors.textPrimary, marginLeft: '2px' }}>
            <option value="am">am</option><option value="pm">pm</option>
          </select>
        </div>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={prevMonth} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ChevronLeft style={{ width: 16, height: 16, color: colors.textSecondary }} />
        </button>
        <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{monthName} {year}</span>
        <button onClick={nextMonth} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ChevronRight style={{ width: 16, height: 16, color: colors.textSecondary }} />
        </button>
      </div>

      {/* Day Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {trailingDays.map((d, i) => (
          <div key={`prev-${i}`} style={{ textAlign: 'center', fontSize: '11px', color: '#d6cfc2', padding: '6px 0' }}>{d}</div>
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
                textAlign: 'center', fontSize: '11px', padding: '6px 0', borderRadius: '2px',
                border: 'none', cursor: 'pointer', fontWeight: sel || td ? 700 : 500,
                background: sel ? colors.accentDark : range ? 'rgba(176,166,142,0.15)' : td ? 'rgba(176,166,142,0.3)' : 'transparent',
                color: sel ? '#f7f4ef' : colors.textPrimary,
                transition: 'all 0.15s'
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${colors.borderLight}` }}>
        <button onClick={onCancel} style={{ padding: '6px 16px', fontSize: '10px', fontWeight: 600, color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: '2px', background: 'transparent', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Cancel
        </button>
        <button onClick={() => onDone(startTime, endTime)} style={{ padding: '6px 20px', fontSize: '10px', fontWeight: 600, color: '#f7f4ef', background: colors.accentDark, borderRadius: '2px', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Done
        </button>
      </div>
    </div>
  );
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

  const [submitting, setSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await customizationService.getAll();
        setData(result);
        const first = Object.keys(result.destinations)[0];
        if (first) setDestination(first);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: colors.bg }}>
        <Loader style={{ width: 32, height: 32, color: colors.accent, animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 12, fontWeight: 600, fontSize: 13, color: colors.textSecondary }}>Loading planner...</span>
      </div>
    );
  }

  const currentDest = data.destinations[destination];
  const currentHotels = data.hotels?.[destination] || [];

  const destCost = currentDest?.base || 0;
  const hotelCost = selectedHotel?.pricePerGuest || 0;
  const activitiesCost = selectedActivities.reduce((total, actId) => {
    const activity = currentDest?.activities?.find(act => act.id === actId);
    return total + (Number(activity?.price) || 0);
  }, 0);
  const guestCount = Number(numGuests) || 0;
  const totalCost = (destCost + hotelCost + activitiesCost) * (guestCount || 1);

  const handleBook = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone) { showNotification('Please fill in all contact fields.', 'warning'); return; }
    if (!destination) { showNotification('Please select a destination.', 'warning'); return; }

    const selectedActNames = selectedActivities.map(actId => currentDest.activities.find(a => a.id === actId)?.name).filter(Boolean);

    const customPkg = {
      id: 'custom-package',
      title: `Customized Trip: ${destination}`,
      destination: destination,
      duration: `${numDays || 0} Days, ${numNights || 0} Nights`,
      price: (destCost + hotelCost + activitiesCost),
      image: currentDest?.image || '',
      customizedDetails: {
        destination,
        hotel: selectedHotel?.name || 'None',
        duration: `${numDays || 0} Days / ${numNights || 0} Nights`,
        activities: selectedActNames
      }
    };

    navigate('/booking/custom', {
      state: {
        customPackage: customPkg,
        firstName,
        lastName,
        email,
        phone,
        tourDate: selectedDates[0] || new Date().toISOString().split('T')[0],
        adultsCount: guestCount,
        childrenCount: 0,
        startStep: 2
      }
    });
  };

  const SectionLabel = ({ children }) => (
    <h3
      className="text-[11px] font-semibold mb-4"
      style={{
        color: colors.textSecondary,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </h3>
  );

  return (
    <div className="min-h-screen pb-24 pt-10" style={{ background: colors.bg, fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10 border-b border-slate-100 pb-8">
          <h1 className="text-2xl text-slate-400 tracking-widest uppercase mb-1">Customize Your Trip</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        </div>



        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* LEFT SIDE: Form Fields & Steps */}
          <div className="lg:col-span-7 flex flex-col gap-10">

            {/* Trip Parameters */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                    Number of Days
                  </label>
                  <input
                    id="input-days"
                    type="number"
                    min="0"
                    max="30"
                    value={numDays}
                    onChange={e => setNumDays(e.target.value)}
                    className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                    Number of Nights
                  </label>
                  <input
                    id="input-nights"
                    type="number"
                    min="0"
                    max="30"
                    value={numNights}
                    onChange={e => setNumNights(e.target.value)}
                    className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                    Number of Guests / PAX
                  </label>
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
                    className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
                  <p className="text-[11px] mt-2 italic" style={{ color: colors.textMuted }}>Note: Maximum of 3 guests/pax only</p>
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                    Preferred Date
                  </label>
                  <div
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full py-3 px-4 flex items-center justify-between text-[14px] cursor-pointer transition-all"
                    style={{ ...inputStyle, boxShadow: showCalendar ? '0 0 0 3px rgba(26,23,21,0.05)' : 'none' }}
                  >
                    <span style={{ color: selectedDates.length ? colors.textPrimary : colors.textMuted }}>
                      {selectedDates.length >= 2 ? `${selectedDates[0]} to ${selectedDates[1]}` : selectedDates[0] || 'Select dates'}
                    </span>
                    <Calendar className="w-4 h-4" style={{ color: colors.accent }} />
                  </div>
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 z-50">
                      <CalendarPicker
                        selectedDates={selectedDates}
                        onDateSelect={handleDateSelect}
                        onDone={() => setShowCalendar(false)}
                        onCancel={() => { setSelectedDates([]); setShowCalendar(false); }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="pt-8 border-t border-[#eae5db] mt-8">
                <SectionLabel>Tourist Contact Details</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                      First Name <span style={{ color: colors.requiredRed }}>*</span>
                    </label>
                    <input
                      id="input-firstname"
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all capitalize"
                      style={inputStyle}
                      {...inputFocusHandlers}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                      Last Name <span style={{ color: colors.requiredRed }}>*</span>
                    </label>
                    <input
                      id="input-lastname"
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all capitalize"
                      style={inputStyle}
                      {...inputFocusHandlers}
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                    Email Address <span style={{ color: colors.requiredRed }}>*</span>
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}>
                    Contact Number <span style={{ color: colors.requiredRed }}>*</span>
                  </label>
                  <input
                    id="input-phone"
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
                </div>
              </div>
            </div>

            {/* Steps Container */}
            <div className="flex flex-col gap-10" id="steps-container">

              {/* 1. Destination */}
              <div id="section-destination">
                <SectionLabel>1. Select Destination</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(data.destinations).map(dest => {
                    const isSelected = destination === dest;
                    return (
                      <button
                        key={dest}
                        onClick={() => setDestination(dest)}
                        className="py-3 px-4 text-left text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                        style={{
                          border: isSelected ? `1.5px solid ${colors.accentDark}` : `1px solid ${colors.border}`,
                          borderRadius: '2px',
                          background: isSelected ? 'rgba(26,23,21,0.03)' : colors.bg,
                          color: isSelected ? colors.accentDark : colors.textPrimary,
                        }}
                      >
                        {dest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Accommodation */}
              <div id="section-accommodation">
                <SectionLabel>2. Select Accommodation</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentHotels.map(hotel => {
                    const isSelected = selectedHotel?.id === hotel.id;
                    return (
                      <button
                        key={hotel.id}
                        onClick={() => setSelectedHotel(hotel)}
                        className="p-4 text-left transition-all duration-200 cursor-pointer"
                        style={{
                          border: isSelected ? `1.5px solid ${colors.accentDark}` : `1px solid ${colors.border}`,
                          borderRadius: '2px',
                          background: isSelected ? 'rgba(26,23,21,0.03)' : colors.bg,
                        }}
                      >
                        <span className="block text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{hotel.name}</span>
                        <span className="block text-[11px] mt-1" style={{ color: colors.textSecondary }}>Base Cost: PHP {hotel.pricePerGuest.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / Guest</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Choose Custom Activities */}
              <div id="section-activities">
                <SectionLabel>3. Choose Custom Activities</SectionLabel>
                <div className="flex flex-col gap-3">
                  {currentDest?.activities?.map(act => {
                    const isChecked = selectedActivities.includes(act.id);
                    return (
                      <label
                        key={act.id}
                        onClick={() => handleActivityToggle(act.id)}
                        className="flex items-start gap-3.5 p-4 cursor-pointer transition-all duration-200"
                        style={{
                          border: isChecked ? `1.5px solid ${colors.accentDark}` : `1px solid ${colors.border}`,
                          borderRadius: '2px',
                          background: isChecked ? 'rgba(26,23,21,0.03)' : colors.bg,
                        }}
                      >
                        <span
                          className="inline-flex items-center justify-center w-4 h-4 mt-0.5 shrink-0 transition-all"
                          style={{
                            border: isChecked ? `1px solid ${colors.accentDark}` : `1px solid ${colors.border}`,
                            borderRadius: '2px',
                            background: isChecked ? colors.accentDark : '#ffffff',
                          }}
                        >
                          {isChecked && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4.5 7.5L8 3" stroke="#f7f4ef" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="text-[13px] leading-relaxed" style={{ color: colors.textPrimary }}>
                          <span className="font-semibold block">{act.name}</span>
                          {Number(act.price) > 0 && (
                            <span className="block font-bold text-[12px] mt-0.5" style={{ color: colors.textPrimary }}>
                              PHP {Number(act.price).toLocaleString('en-PH')}
                            </span>
                          )}
                          {act.details && (
                            <span className="block text-[11px] mt-1 leading-relaxed" style={{ color: colors.textSecondary }}>
                              {act.details}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Estimate Panel */}
          <div className="lg:col-span-5 flex flex-col">
            <div
              className="p-6 sticky top-24"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px'
              }}
              id="section-estimate"
            >
              <h3
                className="text-[11px] font-semibold mb-6 text-center"
                style={{ color: colors.textMuted, letterSpacing: '0.15em', textTransform: 'uppercase' }}
              >
                Real-Time Estimate
              </h3>

              <div className="border-b border-[#eae5db] pb-5 mb-5 space-y-3">
                {[
                  ['Destination:', `PHP ${destCost.toFixed(2)}`, guestCount],
                  ['Accommodation:', `PHP ${hotelCost.toFixed(2)}`, guestCount],
                  ['Selected Activities:', `PHP ${activitiesCost.toFixed(2)}`, guestCount]
                ].map(([label, val, g], i) => (
                  <div key={i} className="flex justify-between items-center text-[12px]">
                    <span style={{ color: colors.textSecondary }}>{label}</span>
                    <span className="font-medium" style={{ color: colors.textPrimary }}>
                      {val} <span style={{ color: colors.textMuted, fontSize: '11px' }}>x{g}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-6 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Estimated Total</span>
                <span
                  className="text-xl font-bold"
                  style={{ color: colors.textPrimary, fontFamily: "'Outfit', Georgia, serif" }}
                >
                  PHP {totalCost.toFixed(2)}
                </span>
              </div>

              <button
                id="btn-book-customized"
                onClick={handleBook}
                disabled={submitting}
                className="w-full py-3 text-[11px] font-semibold active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50"
                style={{
                  background: colors.accentDark,
                  color: '#f7f4ef',
                  borderRadius: '2px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1a1715';
                  e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = colors.accentDark;
                  e.target.style.boxShadow = 'none';
                }}
              >
                {submitting ? 'Registering...' : 'Book Customized Trip'}
              </button>

              <p className="text-[10px] text-center mt-4 leading-relaxed" style={{ color: colors.textMuted }}>
                Note: Your customized booking will undergo verification and approval first.<br />
                Once approved, the approved booking will be sent to your email.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomPlanner;
