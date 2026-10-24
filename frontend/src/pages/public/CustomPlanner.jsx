import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useAuth } from '../../hooks/useAuth';
import { customizationService } from '../../services/customizationService';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
import WeatherWidget from '../../components/feedback/WeatherWidget';
import { Loader, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
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

const SelectionPage = ({ title, description, onBack, actionLabel, onAction, children }) => (
  <div className="min-h-screen bg-white px-4 py-10 sm:px-8 sm:py-14" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
    <div className="mx-auto max-w-6xl">
      <button type="button" onClick={onBack} className="mb-8 text-sm font-semibold text-[#6b6255] hover:text-[#1a1715]">← Back to trip customization</button>
      <div className="bg-white p-0 sm:p-2">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>{title}</h1>
            <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>{description}</p>
          </div>
          {actionLabel && <button type="button" onClick={onAction} className="bg-[#1a1715] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">{actionLabel}</button>}
        </div>
        {children}
      </div>
    </div>
  </div>
);

const OptionPickerModal = ({ title, description, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
    <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white p-5 shadow-2xl sm:p-6" style={{ border: `1px solid ${colors.border}` }} onMouseDown={event => event.stopPropagation()}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{title}</h3>
          <p className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>{description}</p>
        </div>
        <button type="button" onClick={onClose} className="text-xl leading-none" style={{ color: colors.textMuted }} aria-label={`Close ${title}`}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const OptionCard = ({ item, selected, price, multiSelect = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group overflow-hidden rounded-md border text-left transition-all hover:-translate-y-0.5 hover:border-[#8a7f70] hover:bg-[#f7f4ef] hover:shadow-md ${selected ? 'border-[#1a1715] bg-[#f7f4ef] ring-1 ring-[#1a1715]' : 'border-[#d6cfc2]'}`}
  >
    {item.image ? <img src={item.image} alt={item.name} className="h-36 w-full object-cover" /> : <div className="h-24 w-full bg-[#f7f4ef]" />}
    <span className="block p-4">
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{item.name}</span>
        {multiSelect && <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${selected ? 'border-[#1a1715] bg-[#1a1715] text-white' : 'border-[#b8b0a4]'}`}>{selected ? '✓' : ''}</span>}
      </span>
      <span className="mt-1 block text-[11px] font-semibold" style={{ color: colors.accentDark }}>{price}</span>
      {item.details && <span className="mt-2 block text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>{item.details}</span>}
    </span>
  </button>
);

const getWeatherEmoji = (description = '') => {
  const condition = description.toLowerCase();
  if (condition.includes('rain') || condition.includes('shower') || condition.includes('drizzle')) return '🌧️';
  if (condition.includes('clear') || condition.includes('sunny') || condition.includes('sun')) return '🌞';
  if (condition.includes('thunder') || condition.includes('storm')) return '⛈️';
  if (condition.includes('fog')) return '🌫️';
  if (condition.includes('cloud') || condition.includes('overcast')) return '☁️';
  return '☁️';
};

const getDurationEndDate = (startDate, daysValue, nightsValue) => {
  if (daysValue === '' && nightsValue === '') return null;

  const days = Number(daysValue);
  const nights = Number(nightsValue);
  if ((daysValue !== '' && (!Number.isFinite(days) || days < 1))
    || (nightsValue !== '' && (!Number.isFinite(nights) || nights < 0))) return null;

  const calendarDays = Math.max(days || 1, (nights || 0) + 1);
  const endDate = new Date(`${startDate}T00:00:00`);
  endDate.setDate(endDate.getDate() + calendarDays - 1);
  return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
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
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
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
  const [tourGuides, setTourGuides] = useState([]);
  const [preferredGuideId, setPreferredGuideId] = useState('');
  const [showGuidePicker, setShowGuidePicker] = useState(false);
  const [showAccommodationPicker, setShowAccommodationPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [selectionPage, setSelectionPage] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [requestReference, setRequestReference] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [result, guides] = await Promise.all([
          customizationService.getAll(),
          api('/tour-guides/about').catch(() => []),
        ]);
        setData(result);
        setTourGuides(guides);
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
    const durationEndDate = getDurationEndDate(dateStr, numDays, numNights);
    if (durationEndDate) {
      setSelectedDates([dateStr, durationEndDate]);
      return;
    }

    setSelectedDates(prev => {
      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      if (prev.length >= 2) return [dateStr];
      return [...prev, dateStr].sort();
    });
  }, [numDays, numNights]);

  const handleDurationChange = (value) => {
    const nextNights = value === '' ? '' : String(Math.max(Number(value) - 1, 0));
    setNumDays(value);
    setNumNights(nextNights);

    if (selectedDates.length) {
      const durationEndDate = getDurationEndDate(selectedDates[0], value, nextNights);
      setSelectedDates(durationEndDate ? [selectedDates[0], durationEndDate] : [selectedDates[0]]);
    }
  };

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

  if (requestReference) {
    return (
      <div className="min-h-screen px-4 py-16 sm:py-24" style={{ background: 'linear-gradient(135deg, #fcfbf9 0%, #f4eee5 100%)', fontFamily: "'Inter', 'Georgia', serif" }}>
        <div className="mx-auto max-w-2xl overflow-hidden rounded-sm border shadow-[0_20px_60px_rgba(74,62,48,0.12)]" style={{ borderColor: colors.border, background: colors.cardBg }}>
          <div className="h-1.5" style={{ background: colors.accentDark }} />
          <div className="px-6 py-10 text-center sm:px-14 sm:py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ background: '#eee8de', color: colors.accentDark }}>
              <CheckCircle2 className="h-11 w-11" strokeWidth={1.5} />
            </div>
            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: colors.accent }}>Request received</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: colors.textPrimary }}>Your custom trip is on its way</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7" style={{ color: colors.textSecondary }}>
            The business will review your trip details and prepare the final pricing. No payment is due yet. We’ll email you with the quote and any updates.
            </p>

            <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2">
              <div className="border p-4" style={{ borderColor: colors.borderLight, background: colors.subtleBg }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Request reference</p>
                <p className="mt-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>{requestReference}</p>
              </div>
              <div className="border p-4" style={{ borderColor: colors.borderLight, background: colors.subtleBg }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Updates sent to</p>
                <p className="mt-2 truncate text-sm font-semibold" style={{ color: colors.textPrimary }}>{user?.email || email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-9 inline-flex items-center gap-3 px-7 py-3.5 text-[11px] font-semibold uppercase tracking-wider transition-all hover:gap-4"
              style={{ background: colors.accentDark, color: '#f7f4ef', borderRadius: '2px' }}
            >
              Return to home <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDest = data.destinations[destination];
  const preferredGuide = tourGuides.find(guide => String(guide.guideId) === preferredGuideId);
  const currentHotels = data.hotels?.[destination] || [];
  const selectedActivitiesSummary = selectedActivities
    .map((actId) => currentDest?.activities?.find((activity) => activity.id === actId)?.name)
    .filter(Boolean);
  if (otherActivityPreference.trim()) {
    selectedActivitiesSummary.push(`Other: ${otherActivityPreference.trim()}`);
  }
  const selectedTravelDates = selectedDates.length > 1 && selectedDates[0] !== selectedDates[1]
    ? `${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]}`
    : selectedDates[0] || 'Not selected';
  const accommodationSummary = selectedHotel?.id === '__other__'
    ? otherAccommodationPreference.trim() || 'Other preference (not specified)'
    : selectedHotel?.name || 'Not selected';

  const guestCount = adultCount + childCount;

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

    setSubmitting(true);
    try {
      const request = await bookingService.create({
        packageId: 'custom-package',
        tourDate: selectedDates[0] || new Date().toISOString().split('T')[0],
        guestsCount: Math.max(1, guestCount),
        customizedDetails: {
          destination,
          hotel: selectedHotel?.id === '__other__'
            ? `Other: ${otherAccommodationPreference.trim() || 'Preference not specified'}`
            : selectedHotel?.name || 'None',
          otherAccommodationPreference: otherAccommodationPreference.trim(),
          duration: `${numDays || 0} Days / ${numNights || 0} Nights`,
          adultCount,
          childCount,
          activities: selectedActNames,
          preferredGuideId: preferredGuide?.guideId || null,
          preferredGuideName: preferredGuide?.name || null,
        },
      });
      setRequestReference(request.paymentRef || request.id);
    } catch (error) {
      showNotification(error.message || 'Failed to submit your custom trip request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectionPage === 'accommodation') {
    return (
      <SelectionPage
        title="Choose an accommodation"
        description="Select an accommodation to include in your custom trip request."
        onBack={() => setSelectionPage(null)}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {currentHotels.map(hotel => (
            <OptionCard
              key={hotel.id}
              item={hotel}
              selected={selectedHotel?.id === hotel.id}
              price={`PHP ${Number(hotel.pricePerGuest || 0).toLocaleString()} / guest`}
              onClick={() => { setSelectedHotel(hotel); setOtherAccommodationPreference(''); setSelectionPage(null); }}
            />
          ))}
          <button
            type="button"
            onClick={() => { setSelectedHotel({ id: '__other__', name: 'Other', pricePerGuest: 0 }); setOtherAccommodationPreference(''); setSelectionPage(null); }}
            className={`rounded-md border p-6 text-center transition-all hover:bg-[#f7f4ef] ${selectedHotel?.id === '__other__' ? 'border-[#1a1715] bg-[#f7f4ef]' : 'border-[#d6cfc2]'}`}
          >
            <span className="text-base font-semibold" style={{ color: colors.textPrimary }}>Other preference</span>
            <span className="mt-2 block text-sm" style={{ color: colors.textMuted }}>Tell the tour team what type of stay you prefer.</span>
          </button>
        </div>
      </SelectionPage>
    );
  }

  if (selectionPage === 'activities') {
    return (
      <SelectionPage
        title="Choose activities"
        description="Select one or more activities to include in your custom trip request."
        onBack={() => setSelectionPage(null)}
        actionLabel="Done"
        onAction={() => setSelectionPage(null)}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {(currentDest?.activities || []).map(activity => (
            <OptionCard
              key={activity.id}
              item={activity}
              selected={selectedActivities.includes(activity.id)}
              price={`PHP ${Number(activity.price || 0).toLocaleString()}`}
              multiSelect
              onClick={() => handleActivityToggle(activity.id)}
            />
          ))}
        </div>
      </SelectionPage>
    );
  }

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <h1
            className="text-lg font-semibold"
            style={{ color: '#1a1a1a', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.03em' }}
          >
            Customize Your Trip
          </h1>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">

          {/* LEFT SIDE: Form Fields & Steps */}
          <div className="lg:col-span-8 flex flex-col gap-10">

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
                    min="1"
                    max="30"
                    value={numDays}
                    onChange={e => handleDurationChange(e.target.value)}
                    className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
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
                      {selectedDates.length >= 2 && selectedDates[0] !== selectedDates[1]
                        ? `${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]}`
                        : selectedDates[0] || 'Select dates'}
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

              <div className="mb-6">
                <div className="mb-3 flex items-center gap-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.textSecondary }}>
                    Number of PAX
                  </label>
                  <span className="text-xs" style={{ color: colors.textMuted }}>(max 212 pax)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: 'Adult', count: adultCount, setCount: setAdultCount, minimum: guestCount > 1 ? 0 : 1 },
                    { label: 'Child (6-10)', count: childCount, setCount: setChildCount, minimum: 0 },
                  ].map(({ label, count, setCount, minimum }) => (
                    <div key={label} className="flex items-center justify-between rounded-sm border px-5 py-4" style={{ ...inputStyle, borderColor: colors.border }}>
                      <span className="text-[14px] text-[#1a1a1a]">{label}</span>
                      <div className="flex items-center gap-6">
                        <button
                          type="button"
                          aria-label={`Decrease ${label.toLowerCase()} count`}
                          disabled={count <= minimum}
                          onClick={() => setCount(value => Math.max(minimum, value - 1))}
                          className="text-sm font-semibold text-[#4a453b] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="min-w-3 text-center text-[14px] font-semibold text-[#1a1a1a]" aria-live="polite">
                          {count}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${label.toLowerCase()} count`}
                          disabled={guestCount >= 212}
                          onClick={() => setCount(value => value + 1)}
                          className="text-sm font-semibold text-[#4a453b] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
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
                <button
                  id="select-accommodation"
                  type="button"
                  onClick={() => setSelectionPage('accommodation')}
                  className="flex w-full items-center justify-between py-3 px-4 text-left text-[14px] transition-all hover:border-[#1a1715]"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <span>{selectedHotel?.name || 'Select Accommodation'}</span>
                  <span className="text-[18px] leading-none" style={{ color: colors.textMuted }}>⌄</span>
                </button>
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

                {showAccommodationPicker && (
                  <OptionPickerModal
                    title="Choose an accommodation"
                    description="Select an accommodation to include in your custom trip request."
                    onClose={() => setShowAccommodationPicker(false)}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {currentHotels.map(hotel => (
                        <OptionCard
                          key={hotel.id}
                          item={hotel}
                          selected={selectedHotel?.id === hotel.id}
                          price={`PHP ${Number(hotel.pricePerGuest || 0).toLocaleString()} / guest`}
                          onClick={() => { setSelectedHotel(hotel); setOtherAccommodationPreference(''); setShowAccommodationPicker(false); }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => { setSelectedHotel({ id: '__other__', name: 'Other', pricePerGuest: 0 }); setOtherAccommodationPreference(''); setShowAccommodationPicker(false); }}
                        className={`rounded-md border p-5 text-center transition-all hover:bg-[#f7f4ef] ${selectedHotel?.id === '__other__' ? 'border-[#1a1715] bg-[#f7f4ef]' : 'border-[#d6cfc2]'}`}
                      >
                        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Other preference</span>
                        <span className="mt-2 block text-[11px]" style={{ color: colors.textMuted }}>Tell the tour team what type of stay you prefer.</span>
                      </button>
                    </div>
                  </OptionPickerModal>
                )}
              </div>

              {/* 3. Choose Custom Activities */}
              <div id="section-activities">
                <SectionLabel>3. Choose Custom Activities</SectionLabel>
                <button
                  type="button"
                  onClick={() => setSelectionPage('activities')}
                  className="flex w-full items-center justify-between py-3 px-4 text-left text-[14px] transition-all hover:border-[#1a1715]"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <span>{selectedActivities.length ? `${selectedActivities.length} activit${selectedActivities.length === 1 ? 'y' : 'ies'} selected` : 'Select activities'}</span>
                  <span className="text-[18px] leading-none" style={{ color: colors.textMuted }}>⌄</span>
                </button>
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
                {showActivityPicker && (
                  <OptionPickerModal
                    title="Choose activities"
                    description="Select one or more activities to include in your custom trip request."
                    onClose={() => setShowActivityPicker(false)}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(currentDest?.activities || []).map(act => (
                        <OptionCard
                          key={act.id}
                          item={act}
                          selected={selectedActivities.includes(act.id)}
                          price={`PHP ${Number(act.price || 0).toLocaleString()}`}
                          multiSelect
                          onClick={() => handleActivityToggle(act.id)}
                        />
                      ))}
                    </div>
                    {!currentDest?.activities?.length && <p className="py-3 text-[12px]" style={{ color: colors.textMuted }}>No activities available for this destination.</p>}
                    <button type="button" onClick={() => setShowActivityPicker(false)} className="mt-5 w-full bg-[#1a1715] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">Done</button>
                  </OptionPickerModal>
                )}
              </div>

              {/* 4. Select a Tour Guide */}
              <div id="section-tour-guide">
                <SectionLabel>4. Select a Tour Guide</SectionLabel>
                <label htmlFor="select-tour-guide" className="block text-[11px] font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Choose a preferred guide (optional)
                </label>
                <button
                  id="select-tour-guide"
                  type="button"
                  onClick={() => setShowGuidePicker(true)}
                  className="flex w-full items-center justify-between py-3 px-4 text-left text-[14px] transition-all hover:border-[#1a1715]"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <span>{preferredGuide?.nickname || preferredGuide?.name || 'No preference'}</span>
                  <span className="text-[18px] leading-none" style={{ color: colors.textMuted }}>⌄</span>
                </button>
                {preferredGuide && (
                  <div className="mt-3 flex gap-3 border p-4" style={{ borderColor: colors.borderLight, background: colors.subtleBg }}>
                    {preferredGuide.profilePicture && (
                      <img
                        src={preferredGuide.profilePicture}
                        alt={preferredGuide.name}
                        className="h-14 w-14 shrink-0 rounded object-cover"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>{preferredGuide.name}</p>
                      <p className="mt-1 text-[11px]" style={{ color: colors.textSecondary }}>
                        {preferredGuide.yearsExperience} {Number(preferredGuide.yearsExperience) === 1 ? 'year' : 'years'} of experience
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: colors.textSecondary }}>
                        Languages: {preferredGuide.languageSpoken || 'Not specified'}
                      </p>
                      {preferredGuide.description && (
                        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
                          {preferredGuide.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {tourGuides.length === 0 && (
                  <p className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>No guides are currently available to select.</p>
                )}

                {showGuidePicker && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onMouseDown={() => setShowGuidePicker(false)}
                  >
                    <div
                      className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white p-5 shadow-2xl"
                      style={{ border: `1px solid ${colors.border}` }}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>Choose a tour guide</h3>
                          <p className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>Select a guide to include in your custom trip request.</p>
                        </div>
                        <button type="button" onClick={() => setShowGuidePicker(false)} className="text-xl leading-none" style={{ color: colors.textMuted }} aria-label="Close guide selection">×</button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {tourGuides.map((guide) => {
                          const isSelected = String(guide.guideId) === String(preferredGuideId);
                          const initials = `${guide.firstName?.[0] || ''}${guide.lastName?.[0] || ''}`.toUpperCase() || 'TG';
                          return (
                            <button
                              key={guide.guideId}
                              type="button"
                              onClick={() => { setPreferredGuideId(String(guide.guideId)); setShowGuidePicker(false); }}
                              className={`group flex flex-col items-center rounded-md border p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#8a7f70] hover:bg-[#f7f4ef] hover:shadow-md ${isSelected ? 'border-[#1a1715] bg-[#f7f4ef]' : 'border-[#d6cfc2]'}`}
                            >
                              {guide.profilePicture ? (
                                <img src={guide.profilePicture} alt={guide.name} className="h-16 w-16 shrink-0 rounded-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                              ) : (
                                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e8dfce] text-sm font-semibold" style={{ color: colors.accentDark }}>{initials}</span>
                              )}
                              <span className="mt-3 min-w-0">
                                <span className="block text-sm font-semibold" style={{ color: colors.textPrimary }}>{guide.nickname || guide.name}</span>
                                <span className="mt-1 block text-[11px]" style={{ color: colors.textSecondary }}>
                                  {guide.yearsExperience || 0} {Number(guide.yearsExperience) === 1 ? 'year' : 'years'} experience
                                </span>
                                <span className="mt-2 block line-clamp-3 text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>{guide.description || 'No profile description provided.'}</span>
                                <span className="mt-2 block text-[11px]" style={{ color: colors.textSecondary }}>Languages: {guide.languageSpoken || 'Not specified'}</span>
                              </span>
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => { setPreferredGuideId(''); setShowGuidePicker(false); }}
                          className={`group flex flex-col items-center justify-center rounded-md border p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#8a7f70] hover:bg-[#f7f4ef] hover:shadow-md ${!preferredGuideId ? 'border-[#1a1715] bg-[#f7f4ef]' : 'border-[#d6cfc2]'}`}
                        >
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0ede7] text-xl" style={{ color: colors.accent }}>—</span>
                          <span className="mt-3 text-sm font-semibold" style={{ color: colors.textPrimary }}>No preference</span>
                          <span className="mt-2 text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>Let the tour team recommend an available guide.</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Selection Summary */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div
              className="p-6"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px'
              }}
              id="section-estimate"
            >
              <h3
                className="text-[11px] font-semibold mb-6 text-center"
                style={{ color: colors.textPrimary, letterSpacing: '0.15em', textTransform: 'uppercase' }}
              >
                Your Trip Selections
              </h3>

              <div className="border-b border-[#eae5db] pb-5 mb-5 space-y-4 text-[12px]">
                {[
                  ['Destination', destination || 'Not selected'],
                  ['Travel dates', selectedTravelDates],
                  ['Duration', `${numDays || 0} days / ${numNights || 0} nights`],
                  ['Guests', guestCount || 'Not selected'],
                  ['Children (6-10)', childCount],
                  ['Accommodation', accommodationSummary],
                  ['Tour guide', preferredGuide?.name || 'No preference'],
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
            {selectedDates.length > 0 && (
              <WeatherWidget
                destination={destination || 'Legazpi, Albay'}
                tourDate={selectedDates[0]}
                durationDays={Math.max(Number(numDays) || 1, (Number(numNights) || 0) + 1)}
                theme="light"
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomPlanner;
