import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useAuth } from '../../hooks/useAuth';
import { customizationService } from '../../services/customizationService';
import { Loader, Calendar } from 'lucide-react';
import { weatherService } from '../../services/weatherService';

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
const CalendarPicker = ({ selectedDates, onDateSelect, onDone, onCancel, destination }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [calendarWeather, setCalendarWeather] = useState({});

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    if (!isPastMonth) setViewDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  useEffect(() => {
    weatherService.getMonthForecast(destination || 'Legazpi', year, month)
      .then(setCalendarWeather)
      .catch(() => setCalendarWeather({}));
  }, [year, month, destination]);

  const getWeatherEmoji = (description = '') => {
    const condition = description.toLowerCase();
    if (condition.includes('rain') || condition.includes('shower') || condition.includes('drizzle')) return '🌧️';
    if (condition.includes('clear') || condition.includes('sunny') || condition.includes('sun')) return '🌞';
    if (condition.includes('thunder') || condition.includes('storm')) return '⛈️';
    if (condition.includes('fog')) return '🌫️';
    if (condition.includes('cloud') || condition.includes('overcast')) return '☁️';
    return '☁️';
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(year, month, day);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (clickedDate < currentDate) return;
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
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isPastDay = (day) => new Date(year, month, day) < todayDate;
  const isPastMonth = year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth());

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ background: '#ffffff', borderRadius: '6px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: `1px solid ${colors.border}`, padding: '20px', width: '320px', maxWidth: 'calc(100vw - 2rem)' }}>
      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
        <button type="button" onClick={prevMonth} disabled={isPastMonth} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: isPastMonth ? 'not-allowed' : 'pointer', color: isPastMonth ? '#c8c3b8' : colors.textPrimary, opacity: isPastMonth ? 0.5 : 1, fontWeight: 700 }}>
          &lt;
        </button>
        <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={nextMonth} style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: colors.textPrimary, fontWeight: 700 }}>
          &gt;
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '12px', marginBottom: '24px', justifyItems: 'center' }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} style={{ width: '36px', height: '36px' }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const sel = isSelected(day);
          const range = isInRange(day);
          const td = isToday(day);
          const past = isPastDay(day);
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const weather = calendarWeather[dateKey];
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={past}
              title={weather ? `${weather.description} · ${weather.tempMax}°C` : ''}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '4px',
                border: sel || range ? '1px solid #b0a68e' : td ? '1px solid #d6cfc2' : '1px solid transparent',
                cursor: past ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: sel || td ? 700 : 500,
                background: sel || range ? '#e8dfce' : 'transparent',
                color: past ? '#c8c3b8' : colors.textPrimary,
                opacity: past ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (!past && !sel && !range) e.currentTarget.style.background = 'rgba(176,166,142,0.12)'; }}
              onMouseLeave={(e) => { if (!past && !sel && !range) e.currentTarget.style.background = 'transparent'; }}
            >
              {weather && !past && (
                <span style={{ position: 'absolute', top: '1px', right: '1px', fontSize: '11px', lineHeight: 1, pointerEvents: 'none' }}>
                  {getWeatherEmoji(weather.description)}
                </span>
              )}
              {day}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '6px 20px', fontSize: '10px', fontWeight: 600, color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: '2px', background: 'transparent', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Cancel
        </button>
        <button type="button" onClick={onDone} style={{ padding: '6px 20px', fontSize: '10px', fontWeight: 600, color: '#f7f4ef', background: colors.accentDark, borderRadius: '2px', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Done
        </button>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const CustomPlanner = () => {
  const { showNotification } = useNotification();
  const { confirm } = useConfirmation();
  const { user } = useAuth();
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
  const [otherAccommodationPreference, setOtherAccommodationPreference] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [otherActivityPreference, setOtherActivityPreference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await customizationService.getAll();
        setData(result);
      } catch { showNotification('Failed to load customization options.', 'error'); }
      finally { setLoading(false); }
    })();
  }, [showNotification]);

  useEffect(() => {
    setSelectedHotel(null);
    setOtherAccommodationPreference('');
    setSelectedActivities([]);
    setOtherActivityPreference('');
  }, [destination]);

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
  const selectedActivitiesSummary = selectedActivities
    .map((actId) => currentDest?.activities?.find((activity) => activity.id === actId)?.name)
    .filter(Boolean);
  if (otherActivityPreference.trim()) {
    selectedActivitiesSummary.push(`Other: ${otherActivityPreference.trim()}`);
  }
  const selectedTravelDates = selectedDates.length > 1
    ? `${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]}`
    : selectedDates[0] || 'Not selected';
  const accommodationSummary = selectedHotel?.id === '__other__'
    ? otherAccommodationPreference.trim() || 'Other preference (not specified)'
    : selectedHotel?.name || 'Not selected';

  const destCost = currentDest?.base || 0;
  const hotelCost = selectedHotel?.pricePerGuest || 0;
  const activitiesCost = selectedActivities.reduce((total, actId) => {
    const activity = currentDest?.activities?.find(act => act.id === actId);
    return total + (Number(activity?.price) || 0);
  }, 0);
  const guestCount = Number(numGuests) || 0;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!(await confirm('Are you sure you want to submit this customized trip request?'))) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/customize' } } });
      return;
    }
    if (!firstName || !lastName || !email || !phone) { showNotification('Please fill in all contact fields.', 'warning'); return; }
    if (!/^[A-Za-z\s]+$/.test(firstName.trim())) { showNotification('First Name must only contain letters.', 'warning'); return; }
    if (!/^[A-Za-z\s]+$/.test(lastName.trim())) { showNotification('Last Name must only contain letters.', 'warning'); return; }
    if (!/^\d{11}$/.test(phone)) { showNotification('Contact Number must be exactly 11 digits.', 'warning'); return; }
    if (!destination) { showNotification('Please select a destination.', 'warning'); return; }

    const selectedActNames = selectedActivities.map(actId => currentDest.activities.find(a => a.id === actId)?.name).filter(Boolean);
    if (otherActivityPreference.trim()) selectedActNames.push(`Other: ${otherActivityPreference.trim()}`);

    const customPkg = {
      id: 'custom-package',
      title: `Customized Trip: ${destination}`,
      destination: destination,
      duration: `${numDays || 0} Days, ${numNights || 0} Nights`,
      price: (destCost + hotelCost + activitiesCost),
      image: currentDest?.image || '',
      customizedDetails: {
        destination,
        hotel: selectedHotel?.id === '__other__'
          ? `Other: ${otherAccommodationPreference.trim() || 'Preference not specified'}`
          : selectedHotel?.name || 'None',
        otherAccommodationPreference: otherAccommodationPreference.trim(),
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
                        destination={destination}
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
                      onChange={e => setFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
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
                      onChange={e => setLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
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
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    inputMode="numeric"
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
                <select
                  id="select-destination"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  {...inputFocusHandlers}
                >
                  <option value="" disabled>Select Destination</option>
                  {Object.keys(data.destinations).map(dest => (
                    <option key={dest} value={dest}>{dest}</option>
                  ))}
                </select>
              </div>

              {/* 2. Accommodation */}
              <div id="section-accommodation">
                <SectionLabel>2. Select Accommodation</SectionLabel>
                <select
                  id="select-accommodation"
                  value={selectedHotel?.id || ''}
                  onChange={e => {
                    const value = e.target.value;
                    setSelectedHotel(value === '__other__'
                      ? { id: '__other__', name: 'Other', pricePerGuest: 0 }
                      : currentHotels.find(hotel => String(hotel.id) === value) || null);
                    setOtherAccommodationPreference('');
                  }}
                  className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  {...inputFocusHandlers}
                >
                  <option value="">Select Accommodation</option>
                  {currentHotels.map(hotel => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                  <option value="__other__">Other</option>
                </select>
                {selectedHotel?.id === '__other__' && (
                  <input
                    type="text"
                    value={otherAccommodationPreference}
                    onChange={e => setOtherAccommodationPreference(e.target.value)}
                    placeholder="Enter your accommodation preference"
                    aria-label="Other accommodation preference"
                    className="mt-3 w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
                )}
              </div>

              {/* 3. Choose Custom Activities */}
              <div id="section-activities">
                <SectionLabel>3. Choose Custom Activities</SectionLabel>
                <div className="mb-2 flex items-center justify-between text-[11px]" style={{ color: colors.textMuted }}>
                  <span>Select any activities</span>
                  <span>{selectedActivities.length} selected</span>
                </div>
                <div
                  className="max-h-60 overflow-y-auto divide-y"
                  style={{ borderTop: `1px solid ${colors.borderLight}`, borderBottom: `1px solid ${colors.borderLight}`, borderColor: colors.borderLight }}
                >
                  {(currentDest?.activities || []).map(act => (
                    <label
                      key={act.id}
                      title={act.details || undefined}
                      className="flex items-center gap-3 py-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedActivities.includes(act.id)}
                        onChange={() => handleActivityToggle(act.id)}
                        className="h-4 w-4 shrink-0 cursor-pointer"
                        style={{ accentColor: colors.accentDark }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium" style={{ color: colors.textPrimary }}>
                        {act.name}
                      </span>
                    </label>
                  ))}
                  {!currentDest?.activities?.length && (
                    <p className="py-3 text-[12px]" style={{ color: colors.textMuted }}>No activities available for this destination.</p>
                  )}
                </div>
                <textarea
                  value={otherActivityPreference}
                  onChange={e => setOtherActivityPreference(e.target.value)}
                  placeholder="Other activity preference (optional)"
                  aria-label="Other activity preference"
                  rows={2}
                  className="mt-3 w-full py-3 px-4 text-[13px] focus:outline-none transition-all"
                  style={{ ...inputStyle, resize: 'vertical' }}
                  {...inputFocusHandlers}
                />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Selection Summary */}
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
                Your Trip Selections
              </h3>

              <div className="border-b border-[#eae5db] pb-5 mb-5 space-y-4 text-[12px]">
                {[
                  ['Destination', destination || 'Not selected'],
                  ['Travel dates', selectedTravelDates],
                  ['Duration', `${numDays || 0} days / ${numNights || 0} nights`],
                  ['Guests', guestCount || 'Not selected'],
                  ['Accommodation', accommodationSummary],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="shrink-0" style={{ color: colors.textMuted }}>{label}</span>
                    <span className="text-right font-medium" style={{ color: colors.textPrimary }}>{value}</span>
                  </div>
                ))}
                <div>
                  <p className="mb-2" style={{ color: colors.textMuted }}>Activities</p>
                  {selectedActivitiesSummary.length > 0 ? (
                    <ul className="space-y-1.5" style={{ color: colors.textPrimary }}>
                      {selectedActivitiesSummary.map(activity => <li key={activity}>• {activity}</li>)}
                    </ul>
                  ) : (
                    <p style={{ color: colors.textPrimary }}>None selected</p>
                  )}
                </div>
              </div>

              <div className="mb-5 p-3 text-[11px] leading-relaxed" style={{ background: colors.subtleBg, border: `1px solid ${colors.borderLight}`, color: colors.textSecondary }}>
                Pricing is not final yet. An admin will review your selections and confirm the price.
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
                Your selected trip details will be reviewed before the final price is confirmed.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomPlanner;
