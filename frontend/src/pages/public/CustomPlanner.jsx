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
    <div className="mx-auto max-w-5xl">
      <div className="bg-white p-0 sm:p-2">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#6b6255] transition-colors hover:text-[#1a1715]"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>{title}</h1>
            <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>{description}</p>
          </div>
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="mt-1 shrink-0 rounded-md bg-[#1a1715] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#332e2a]"
            >
              {actionLabel}
            </button>
          )}
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

const AccommodationPreferenceDialog = ({ value, onChange, onClose, onSave }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accommodation-preference-title"
      className="w-full max-w-md rounded-lg border border-[#d6cfc2] bg-white p-5 shadow-2xl sm:p-6"
      onMouseDown={event => event.stopPropagation()}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 id="accommodation-preference-title" className="text-base font-semibold" style={{ color: colors.textPrimary }}>Tell us about your preferred stay</h3>
          <p className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>We’ll pass your request to our team. Your preferred stay may not be available.</p>
        </div>
        <button type="button" onClick={onClose} className="text-xl leading-none" style={{ color: colors.textMuted }} aria-label="Close accommodation preference">×</button>
      </div>
      <label htmlFor="other-accommodation-preference" className="mb-2 block text-sm font-medium" style={{ color: colors.textSecondary }}>What are you looking for?</label>
      <textarea
        id="other-accommodation-preference"
        autoFocus
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="For example, a beachfront stay or a family room"
        rows={4}
        className="w-full resize-y rounded-md border border-[#d6cfc2] px-3 py-2.5 text-sm focus:border-[#1a1715] focus:outline-none focus:ring-2 focus:ring-[#1a1715]/10"
      />
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-md border border-[#d6cfc2] px-4 py-2.5 text-sm font-medium text-[#4a453b] hover:bg-[#fcfbf9]">Cancel</button>
        <button
          type="button"
          onClick={onSave}
          disabled={!value.trim()}
          className="rounded-md bg-[#1a1715] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#332e2a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save preference
        </button>
      </div>
    </div>
  </div>
);

const ActivityPreferenceDialog = ({ value, onChange, onClose, onSave }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-preference-title"
      className="w-full max-w-md rounded-lg border border-[#d6cfc2] bg-white p-5 shadow-2xl sm:p-6"
      onMouseDown={event => event.stopPropagation()}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 id="activity-preference-title" className="text-base font-semibold" style={{ color: colors.textPrimary }}>Request a different activity</h3>
          <p className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>Tell us what you’d like to do. Our team will review your request.</p>
        </div>
        <button type="button" onClick={onClose} className="text-xl leading-none" style={{ color: colors.textMuted }} aria-label="Close activity request">×</button>
      </div>
      <label htmlFor="other-activity-preference" className="mb-2 block text-sm font-medium" style={{ color: colors.textSecondary }}>What activity would you like?</label>
      <textarea
        id="other-activity-preference"
        autoFocus
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="For example, a cooking class or a guided nature walk"
        rows={4}
        className="w-full resize-y rounded-md border border-[#d6cfc2] px-3 py-2.5 text-sm focus:border-[#1a1715] focus:outline-none focus:ring-2 focus:ring-[#1a1715]/10"
      />
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-md border border-[#d6cfc2] px-4 py-2.5 text-sm font-medium text-[#4a453b] hover:bg-[#fcfbf9]">Cancel</button>
        <button
          type="button"
          onClick={onSave}
          disabled={!value.trim()}
          className="rounded-md bg-[#1a1715] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#332e2a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save request
        </button>
      </div>
    </div>
  </div>
);

const OptionCard = ({ item, selected, price, multiSelect = false, compact = false, checkboxPosition = 'top-right', disabled = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={`group overflow-hidden border text-left transition-all ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${compact
      ? 'flex aspect-square flex-col'
      : ''
    } ${compact
      ? `rounded-lg bg-white ${disabled ? '' : 'hover:border-[#8a7f70] hover:bg-[#fcfbf9] hover:shadow-sm'} ${selected ? 'border-[#1a1715] bg-[#f7f4ef]' : 'border-[#d6cfc2]'}`
      : `rounded-md ${disabled ? '' : 'hover:-translate-y-0.5 hover:border-[#8a7f70] hover:bg-[#f7f4ef] hover:shadow-md'} ${selected ? 'border-[#1a1715] bg-[#f7f4ef] ring-1 ring-[#1a1715]' : 'border-[#d6cfc2]'}`}`}
  >
    {item.image ? <img src={item.image} alt={item.name} className={`${compact ? 'h-1/2 shrink-0' : 'h-36'} w-full object-cover`} /> : <div className={`${compact ? 'h-1/2 shrink-0' : 'h-24'} w-full bg-[#f7f4ef]`} />}
    <span className={compact ? 'flex min-h-0 flex-1 flex-col justify-center p-4' : 'block p-4'}>
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{item.name}</span>
        {multiSelect && checkboxPosition === 'top-right' && <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${selected ? 'border-[#1a1715] bg-[#1a1715] text-white' : 'border-[#b8b0a4]'}`}>{selected ? '✓' : ''}</span>}
      </span>
      <span className="mt-1 block text-[11px] font-semibold" style={{ color: colors.accentDark }}>{price}</span>
      {item.details && <span className={`mt-2 block text-[11px] leading-relaxed ${compact ? 'line-clamp-3' : ''}`} style={{ color: colors.textMuted }}>{item.details}</span>}
      {multiSelect && checkboxPosition === 'bottom-right' && <span className={`mt-3 flex h-4 w-4 items-center justify-center self-end rounded border text-[10px] ${selected ? 'border-[#1a1715] bg-[#1a1715] text-white' : 'border-[#b8b0a4]'}`}>{selected ? '✓' : ''}</span>}
    </span>
  </button>
);

const DestinationDropdown = ({ dayIndex, selectedDestinations, destinations, onToggle, onOpen, isOpen }) => (
  <details open={isOpen} className="group relative">
    <summary onClick={event => { event.preventDefault(); onOpen(dayIndex); }} className="flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-md border px-3 py-2.5 text-[13px] [&::-webkit-details-marker]:hidden" style={inputStyle}>
      <span className={selectedDestinations.length ? '' : 'text-[#8a8275]'}>{selectedDestinations[0] || 'Select a destination'}</span>
      <span className="ml-3 text-base transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
    </summary>
    <div className="mt-1 max-h-56 overflow-y-auto rounded-md border bg-white p-2 shadow-lg" style={{ borderColor: colors.border }}>
      <button
        type="button"
        onClick={() => onToggle(dayIndex, selectedDestinations[0] || '')}
        disabled={!selectedDestinations.length}
        className="flex w-full items-center rounded px-2 py-2 text-left text-[13px] text-[#8a8275] hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear selection
      </button>
      {Object.keys(destinations).map(destinationName => {
        const selected = selectedDestinations.includes(destinationName);
        return (
          <button key={destinationName} type="button" onClick={() => onToggle(dayIndex, destinationName)} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-[13px] hover:bg-[#f7f4ef]" style={{ color: colors.textPrimary }}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border" style={{ borderColor: selected ? colors.accentDark : colors.border }}>
              {selected && <span className="h-2 w-2 rounded-full" style={{ background: colors.accentDark }} />}
            </span>
            {destinationName}
          </button>
        );
      })}
    </div>
  </details>
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

const getTripDayDateLabel = (startDate, dayIndex) => {
  if (!startDate) return '';
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + dayIndex);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  const [dayDestinations, setDayDestinations] = useState([]);
  const [dayHotels, setDayHotels] = useState([]);
  const [dayActivities, setDayActivities] = useState([]);
  const [dayOtherAccommodationPreferences, setDayOtherAccommodationPreferences] = useState([]);
  const [dayOtherActivityPreferences, setDayOtherActivityPreferences] = useState([]);
  const [dayPreferredGuideIds, setDayPreferredGuideIds] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [summaryDayIndex, setSummaryDayIndex] = useState(0);
  const [openDestinationDay, setOpenDestinationDay] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [otherAccommodationPreference, setOtherAccommodationPreference] = useState('');
  const [accommodationPreferenceDraft, setAccommodationPreferenceDraft] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [otherActivityPreference, setOtherActivityPreference] = useState('');
  const [activityPreferenceDraft, setActivityPreferenceDraft] = useState('');
  const [tourGuides, setTourGuides] = useState([]);
  const [preferredGuideId, setPreferredGuideId] = useState('');
  const [showGuidePicker, setShowGuidePicker] = useState(false);
  const [showAccommodationPicker, setShowAccommodationPicker] = useState(false);
  const [showAccommodationPreferenceDialog, setShowAccommodationPreferenceDialog] = useState(false);
  const [showActivityPreferenceDialog, setShowActivityPreferenceDialog] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [selectionPage, setSelectionPage] = useState(null);
  const [destinationDayBeingEdited, setDestinationDayBeingEdited] = useState(0);
  const [accommodationDayBeingEdited, setAccommodationDayBeingEdited] = useState(0);
  const [activityDayBeingEdited, setActivityDayBeingEdited] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [requestReference, setRequestReference] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const redirectToLogin = () => {
    navigate('/login', { state: { from: { pathname: '/customize' } } });
  };

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

  const openAccommodationPreferenceDialog = () => {
    setAccommodationPreferenceDraft(otherAccommodationPreference);
    setShowAccommodationPicker(false);
    setShowAccommodationPreferenceDialog(true);
  };

  const saveAccommodationPreference = () => {
    const preference = accommodationPreferenceDraft.trim();
    const customHotel = { id: '__other__', name: 'Custom accommodation request', pricePerGuest: 0 };
    setOtherAccommodationPreference(preference);
    setSelectedHotel(customHotel);
    setDayOtherAccommodationPreferences(prev => {
      const next = [...prev];
      next[accommodationDayBeingEdited] = preference;
      return next;
    });
    selectDayHotel(accommodationDayBeingEdited, customHotel);
    setShowAccommodationPreferenceDialog(false);
    setSelectionPage(null);
  };

  const openActivityPreferenceDialog = () => {
    setActivityPreferenceDraft(otherActivityPreference);
    setShowActivityPicker(false);
    setShowActivityPreferenceDialog(true);
  };

  const saveActivityPreference = () => {
    const preference = activityPreferenceDraft.trim();
    setOtherActivityPreference(preference);
    setDayOtherActivityPreferences(prev => {
      const next = [...prev];
      next[activityDayBeingEdited] = preference;
      return next;
    });
    setShowActivityPreferenceDialog(false);
  };

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

    const dayCount = Math.max(1, Number(value) || 1);
    setDayDestinations(prev => Array.from({ length: dayCount }, (_, index) => prev[index] || []));
    setDayHotels(prev => Array.from({ length: dayCount }, (_, index) => prev[index] || null));
    setDayActivities(prev => Array.from({ length: dayCount }, (_, index) => prev[index] || []));
    setDayOtherAccommodationPreferences(prev => Array.from({ length: dayCount }, (_, index) => prev[index] || ''));
    setDayOtherActivityPreferences(prev => Array.from({ length: dayCount }, (_, index) => prev[index] || ''));
    setDayPreferredGuideIds(prev => Array.from({ length: dayCount }, (_, index) => prev[index] || ''));
    setActiveDayIndex(current => Math.min(current, dayCount - 1));
    setSummaryDayIndex(current => Math.min(current, dayCount - 1));

    if (selectedDates.length) {
      const durationEndDate = getDurationEndDate(selectedDates[0], value, nextNights);
      setSelectedDates(durationEndDate ? [selectedDates[0], durationEndDate] : [selectedDates[0]]);
    }
  };

  const toggleDayDestination = (dayIndex, destinationName) => {
    setDayDestinations(prev => {
      const next = Array.from({ length: Math.max(1, Number(numDays) || 1) }, (_, index) => [...(prev[index] || [])]);
      next[dayIndex] = !destinationName || next[dayIndex][0] === destinationName
        ? []
        : [destinationName];
      setDayHotels(current => { const updated = [...current]; updated[dayIndex] = null; return updated; });
      setDayActivities(current => { const updated = [...current]; updated[dayIndex] = []; return updated; });
      setDayOtherAccommodationPreferences(current => { const updated = [...current]; updated[dayIndex] = ''; return updated; });
      setDayOtherActivityPreferences(current => { const updated = [...current]; updated[dayIndex] = ''; return updated; });
      if (activeDayIndex === dayIndex) {
        setSelectedHotel(null);
        setSelectedActivities([]);
        setOtherAccommodationPreference('');
        setOtherActivityPreference('');
      }
      setOpenDestinationDay(null);
      setDestination(next.flat()[0] || '');
      return next;
    });
  };

  const activateDay = (dayIndex) => {
    setActiveDayIndex(dayIndex);
    setSelectedHotel(dayHotels[dayIndex] || null);
    setSelectedActivities(dayActivities[dayIndex] || []);
    setOtherAccommodationPreference(dayOtherAccommodationPreferences[dayIndex] || '');
    setOtherActivityPreference(dayOtherActivityPreferences[dayIndex] || '');
    setPreferredGuideId(dayPreferredGuideIds[dayIndex] || '');
    setOpenDestinationDay(null);
  };

  const openDayDestinationSelector = (dayIndex) => {
    setDestinationDayBeingEdited(dayIndex);
    setActiveDayIndex(dayIndex);
    setSelectedHotel(dayHotels[dayIndex] || null);
    setSelectedActivities(dayActivities[dayIndex] || []);
    setOtherAccommodationPreference(dayOtherAccommodationPreferences[dayIndex] || '');
    setOtherActivityPreference(dayOtherActivityPreferences[dayIndex] || '');
    setPreferredGuideId(dayPreferredGuideIds[dayIndex] || '');
    setOpenDestinationDay(dayIndex);
  };

  const toggleDayActivity = (dayIndex, activityId) => {
    const currentActivities = dayActivities[dayIndex] || [];
    const nextActivities = currentActivities.includes(activityId)
      ? currentActivities.filter(id => id !== activityId)
      : [...currentActivities, activityId];
    setDayActivities(prev => {
      const next = [...prev];
      next[dayIndex] = nextActivities;
      return next;
    });
    if (dayIndex === activeDayIndex) setSelectedActivities(nextActivities);
  };

  const selectDayHotel = (dayIndex, hotel) => {
    setDayHotels(prev => {
      const next = Array.from({ length: Math.max(1, Number(numDays) || 1) }, (_, index) => prev[index] || null);
      next[dayIndex] = hotel;
      return next;
    });
    if (hotel?.id !== '__other__') {
      setDayOtherAccommodationPreferences(prev => {
        const next = [...prev];
        next[dayIndex] = '';
        return next;
      });
    }
    if (dayIndex === activeDayIndex) {
      setSelectedHotel(hotel);
      if (hotel?.id !== '__other__') setOtherAccommodationPreference('');
    }
  };

  const handleActivityToggle = (actId) => {
    setSelectedActivities(prev => {
      const next = prev.includes(actId) ? prev.filter(id => id !== actId) : [...prev, actId];
      setDayActivities(current => {
        const updated = [...current];
        updated[activeDayIndex] = next;
        return updated;
      });
      return next;
    });
  };

  const selectPreferredGuide = (guideId) => {
    setPreferredGuideId(guideId);
    setDayPreferredGuideIds(prev => {
      const next = [...prev];
      next[activeDayIndex] = guideId;
      return next;
    });
    setShowGuidePicker(false);
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

  const scheduledDestinationNames = [...new Set(dayDestinations.flat())];
  const activeAccommodationDestinations = dayDestinations[accommodationDayBeingEdited] || [];
  const activeActivityDestinations = dayDestinations[activityDayBeingEdited] || [];
  const activeAccommodationHotels = data.hotels?.[activeAccommodationDestinations[0]] || [];
  const activeDayActivities = activeActivityDestinations
    .flatMap(name => data.destinations[name]?.activities || [])
    .filter((activity, index, activities) => activities.findIndex(item => item.id === activity.id) === index);
  const activeAvailableActivities = (dayDestinations[activeDayIndex] || [])
    .flatMap(name => data.destinations[name]?.activities || [])
    .filter((activity, index, activities) => activities.findIndex(item => item.id === activity.id) === index);
  const preferredGuide = tourGuides.find(guide => String(guide.guideId) === preferredGuideId);
  const currentHotels = data.hotels?.[dayDestinations[activeDayIndex]?.[0]] || [];
  const selectedActivityNames = selectedActivities
    .map((actId) => activeAvailableActivities.find((activity) => activity.id === actId)?.name)
    .filter(Boolean);
  const selectedAccommodation = dayHotels[activeDayIndex] || selectedHotel;
  const daySelectionSummary = dayDestinations.map((destinations, index) => {
    const activities = destinations
      .flatMap(name => data.destinations[name]?.activities || [])
      .filter((activity, activityIndex, allActivities) => allActivities.findIndex(item => item.id === activity.id) === activityIndex);
    const activityNames = (dayActivities[index] || [])
      .map(activityId => activities.find(activity => activity.id === activityId)?.name)
      .filter(Boolean);
    const otherActivity = dayOtherActivityPreferences[index]?.trim();
    if (otherActivity) activityNames.push(`Other: ${otherActivity}`);
    const hotel = dayHotels[index];
    const accommodation = hotel?.id === '__other__'
      ? dayOtherAccommodationPreferences[index]?.trim() || 'Other preference (not specified)'
      : hotel?.name || 'Not selected';
    const guide = tourGuides.find(item => String(item.guideId) === String(dayPreferredGuideIds[index] || ''));
    return {
      day: index + 1,
      destinations,
      accommodation,
      activities: activityNames,
      guide: guide?.name || 'No preference',
    };
  });
  const selectedTravelDates = selectedDates.length > 1 && selectedDates[0] !== selectedDates[1]
    ? `${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]}`
    : selectedDates[0] || 'Not selected';
  const guestCount = adultCount + childCount;
  const summaryDayCount = Math.max(1, Number(numDays) || 1);
  const selectedSummaryDay = daySelectionSummary[summaryDayIndex] || {
    destinations: [],
    accommodation: 'Not selected',
    guide: 'No preference',
    activities: [],
  };

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

    const selectedActNames = [...new Set(daySelectionSummary.flatMap(day => day.activities))];
    const guideSchedule = dayPreferredGuideIds.map((guideId, index) => {
      const guide = tourGuides.find(item => String(item.guideId) === String(guideId || ''));
      return {
        day: index + 1,
        preferredGuideId: guide?.guideId || null,
        preferredGuideName: guide?.name || null,
      };
    });

    setSubmitting(true);
    try {
      const request = await bookingService.create({
        packageId: 'custom-package',
        tourDate: selectedDates[0] || new Date().toISOString().split('T')[0],
        guestsCount: Math.max(1, guestCount),
        customizedDetails: {
          destination,
          destinations: scheduledDestinationNames,
          destinationSchedule: daySelectionSummary.map((day, index) => ({
            ...day,
            otherAccommodationPreference: dayOtherAccommodationPreferences[index] || '',
            otherActivityPreference: dayOtherActivityPreferences[index] || '',
          })),
          accommodationSchedule: daySelectionSummary.map(({ day, accommodation }) => ({ day, accommodation })),
          activitySchedule: daySelectionSummary.map(({ day, activities }) => ({ day, activities })),
          hotel: selectedAccommodation?.id === '__other__'
            ? `Other: ${otherAccommodationPreference.trim() || 'Preference not specified'}`
            : selectedAccommodation?.name || 'None',
          otherAccommodationPreference: otherAccommodationPreference.trim(),
          duration: `${numDays || 0} Days / ${numNights || 0} Nights`,
          adultCount,
          childCount,
          activities: selectedActNames,
          preferredGuideId: preferredGuide?.guideId || null,
          preferredGuideName: preferredGuide?.name || null,
          guideSchedule,
        },
      });
      setRequestReference(request.paymentRef || request.id);
    } catch (error) {
      showNotification(error.message || 'Failed to submit your custom trip request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectionPage === 'destinations') {
    const dayIndex = destinationDayBeingEdited;
    return (
      <SelectionPage
        title={`Choose a destination for Day ${dayIndex + 1}`}
        description="Select one destination for this day."
        onBack={() => setSelectionPage(null)}
        actionLabel="Done"
        onAction={() => setSelectionPage(null)}
      >
        {!activeAccommodationHotels.length && (
          <p className="mx-auto mb-4 max-w-4xl text-[12px]" style={{ color: colors.textMuted }}>
            Select the destination for Day {accommodationDayBeingEdited + 1} to see matching accommodations. This selection is optional.
          </p>
        )}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(data.destinations).map(dest => (
            <OptionCard
              key={dest}
              item={{ name: dest, details: data.destinations[dest]?.details || 'Custom trip destination.' }}
              selected={(dayDestinations[dayIndex] || []).includes(dest)}
              onClick={() => toggleDayDestination(dayIndex, dest)}
            />
          ))}
        </div>
      </SelectionPage>
    );
  }

  if (selectionPage === 'accommodation') {
    return (
      <SelectionPage
        title="Choose an accommodation"
        description="Choose one of these stays, or tell us what you’re looking for."
        onBack={() => setSelectionPage(null)}
        actionLabel="Done"
        onAction={() => setSelectionPage(null)}
      >
        <div className="mx-auto mb-5 flex max-w-4xl flex-col gap-4 rounded-lg border border-[#d6cfc2] bg-[#fcfbf9] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {selectedHotel?.id === '__other__' ? 'Looking for a different stay?' : 'Can’t find what you’re looking for?'}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
              Tell us your preferred accommodation and our team will review your request.
            </p>
          </div>
          <button
            type="button"
            onClick={() => user ? openAccommodationPreferenceDialog() : redirectToLogin()}
            className="shrink-0 rounded-md bg-[#1a1715] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#332e2a]"
          >
            {selectedHotel?.id === '__other__' ? 'Edit request' : 'Request a different stay'}
          </button>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeAccommodationHotels.map(hotel => (
            <OptionCard
              key={hotel.id}
              item={hotel}
              selected={dayHotels[accommodationDayBeingEdited]?.id === hotel.id}
              price={`PHP ${Number(hotel.pricePerGuest || 0).toLocaleString()} / guest`}
              multiSelect
              checkboxPosition="bottom-right"
              compact
              onClick={() => {
                if (!user) {
                  redirectToLogin();
                  return;
                }
                selectDayHotel(accommodationDayBeingEdited, hotel);
                setOtherAccommodationPreference('');
              }}
            />
          ))}
        </div>
        {!activeDayActivities.length && (
          <p className="mx-auto mt-4 max-w-4xl text-[12px]" style={{ color: colors.textMuted }}>
            Select a destination for Day {activityDayBeingEdited + 1} to see matching activities. This selection is optional.
          </p>
        )}
        {showAccommodationPreferenceDialog && (
          <AccommodationPreferenceDialog
            value={accommodationPreferenceDraft}
            onChange={setAccommodationPreferenceDraft}
            onClose={() => setShowAccommodationPreferenceDialog(false)}
            onSave={saveAccommodationPreference}
          />
        )}
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
        <div className="mx-auto mb-5 flex max-w-4xl flex-col gap-4 rounded-lg border border-[#d6cfc2] bg-[#fcfbf9] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {otherActivityPreference ? 'Want to change your activity request?' : 'Can’t find the activity you want?'}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: colors.textMuted }}>
              Tell us what you’d like to do and our team will review your request.
            </p>
          </div>
          <button
            type="button"
            onClick={() => user
              ? openActivityPreferenceDialog()
              : navigate('/login', { state: { from: { pathname: '/customize' } } })}
            className="shrink-0 rounded-md bg-[#1a1715] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#332e2a]"
          >
            {otherActivityPreference ? 'Edit activity request' : 'Request another activity'}
          </button>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeDayActivities.map(activity => (
            <OptionCard
              key={activity.id}
              item={activity}
              selected={(dayActivities[activityDayBeingEdited] || []).includes(activity.id)}
              price={`PHP ${Number(activity.price || 0).toLocaleString()}`}
              multiSelect
              compact
              onClick={() => user
                ? toggleDayActivity(activityDayBeingEdited, activity.id)
                : navigate('/login', { state: { from: { pathname: '/customize' } } })}
            />
          ))}
        </div>
        {showActivityPreferenceDialog && (
          <ActivityPreferenceDialog
            value={activityPreferenceDraft}
            onChange={setActivityPreferenceDraft}
            onClose={() => setShowActivityPreferenceDialog(false)}
            onSave={saveActivityPreference}
          />
        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 xl:gap-8">
              <div className="contents">
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

              <div className="sm:col-span-2">
                <div className="mb-3 flex items-center gap-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.textSecondary }}>
                    Number of PAX
                  </label>
                  <span className="text-xs" style={{ color: colors.textMuted }}></span>
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
              <div className="mt-2 pt-8 border-t border-[#eae5db] sm:col-span-2">
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
            <div className="sm:col-span-2 flex flex-col gap-10" id="steps-container">

              {/* 1. Destinations by day */}
              <div id="section-destination">
                <SectionLabel>1. Select Destinations per Day</SectionLabel>
                <p className="mb-4 text-[12px]" style={{ color: colors.textMuted }}>
                  Choose one destination for each day of your trip.
                </p>
                <div className="flex flex-wrap border-b" style={{ borderColor: colors.borderLight }}>
                  {Array.from({ length: Math.max(1, Number(numDays) || 1) }, (_, dayIndex) => (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => activateDay(dayIndex)}
                      aria-pressed={activeDayIndex === dayIndex}
                      className="min-w-[100px] cursor-pointer border-b-2 px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors"
                      style={{
                        borderColor: activeDayIndex === dayIndex ? '#d49a00' : 'transparent',
                        color: activeDayIndex === dayIndex ? colors.textPrimary : colors.textSecondary,
                      }}
                    >
                      Day {dayIndex + 1}
                    </button>
                  ))}
                </div>
                <div className="pt-4">
                  <DestinationDropdown
                    dayIndex={activeDayIndex}
                    selectedDestinations={dayDestinations[activeDayIndex] || []}
                    destinations={data.destinations}
                    onToggle={toggleDayDestination}
                    onOpen={openDayDestinationSelector}
                    isOpen={openDestinationDay === activeDayIndex}
                  />
                </div>
              </div>

              <>
              {/* 2. Accommodation */}
              <div id="section-accommodation">
                <SectionLabel>2. Select Accommodation</SectionLabel>
                <button
                  id="select-accommodation"
                  type="button"
                  onClick={() => { setAccommodationDayBeingEdited(activeDayIndex); setSelectionPage('accommodation'); }}
                  className="flex w-full items-center justify-between py-3 px-4 text-left text-[14px] transition-all hover:border-[#1a1715]"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <span>{selectedHotel?.name || 'Select Accommodation'}</span>
                  <span className="text-[18px] leading-none" style={{ color: colors.textMuted }}>⌄</span>
                </button>
                {selectedHotel?.id === '__other__' && (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: colors.borderLight, background: colors.subtleBg }}>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>Custom stay request</p>
                      <p className="mt-1 break-words text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{otherAccommodationPreference}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => user ? openAccommodationPreferenceDialog() : redirectToLogin()}
                      className="self-start rounded-md border px-3 py-2 text-xs font-semibold transition-colors hover:bg-white sm:self-center"
                      style={{ borderColor: colors.border, color: colors.accentDark }}
                    >
                      Edit request
                    </button>
                  </div>
                )}

                {showAccommodationPicker && (
                  <OptionPickerModal
                    title="Choose an accommodation"
                    description="Select an accommodation to include in your custom trip request."
                    onClose={() => setShowAccommodationPicker(false)}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {currentHotels.map(hotel => (
                        <OptionCard
                          key={hotel.id}
                          item={hotel}
                          selected={selectedHotel?.id === hotel.id}
                          price={`PHP ${Number(hotel.pricePerGuest || 0).toLocaleString()} / guest`}
                          multiSelect
                          checkboxPosition="bottom-right"
                          compact
                          onClick={() => {
                            if (!user) {
                              redirectToLogin();
                              return;
                            }
                            selectDayHotel(activeDayIndex, hotel);
                            setShowAccommodationPicker(false);
                          }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => user ? openAccommodationPreferenceDialog() : redirectToLogin()}
                        className={`flex aspect-square flex-col items-center justify-center rounded-lg border p-5 text-center transition-all hover:border-[#8a7f70] hover:bg-[#fcfbf9] ${selectedHotel?.id === '__other__' ? 'border-[#1a1715] bg-[#f7f4ef]' : 'border-[#d6cfc2]'}`}
                      >
                        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Other preference</span>
                        <span className="mt-2 block text-[11px]" style={{ color: colors.textMuted }}>Describe the stay you are looking for.</span>
                        <span className={`mt-3 flex h-4 w-4 self-end items-center justify-center rounded border text-[10px] ${selectedHotel?.id === '__other__' ? 'border-[#1a1715] bg-[#1a1715] text-white' : 'border-[#b8b0a4]'}`}>{selectedHotel?.id === '__other__' ? '✓' : ''}</span>
                      </button>
                    </div>
                  </OptionPickerModal>
                )}
                {showAccommodationPreferenceDialog && (
                  <AccommodationPreferenceDialog
                    value={accommodationPreferenceDraft}
                    onChange={setAccommodationPreferenceDraft}
                    onClose={() => setShowAccommodationPreferenceDialog(false)}
                    onSave={saveAccommodationPreference}
                  />
                )}
              </div>

              {/* 3. Choose Custom Activities */}
              <div id="section-activities">
                <SectionLabel>3. Choose Custom Activities</SectionLabel>
                <button
                  type="button"
                  onClick={() => { setActivityDayBeingEdited(activeDayIndex); setSelectionPage('activities'); }}
                  className="flex w-full items-center justify-between py-3 px-4 text-left text-[14px] transition-all hover:border-[#1a1715]"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <span>{selectedActivities.length ? `${selectedActivities.length} activit${selectedActivities.length === 1 ? 'y' : 'ies'} selected` : 'Select activities'}</span>
                  <span className="text-[18px] leading-none" style={{ color: colors.textMuted }}>⌄</span>
                </button>
                {selectedActivityNames.length > 0 && (
                  <div className="mt-3 rounded-md border px-4 py-3" style={{ borderColor: colors.borderLight, background: colors.subtleBg }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>Selected activities</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {selectedActivityNames.map(activity => (
                        <li key={activity} className="rounded-full border px-3 py-1 text-[12px]" style={{ borderColor: colors.border, color: colors.textSecondary, background: colors.cardBg }}>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {otherActivityPreference && (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: colors.borderLight, background: colors.subtleBg }}>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>Custom activity request</p>
                      <p className="mt-1 break-words text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{otherActivityPreference}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectionPage('activities')}
                      className="self-start rounded-md border px-3 py-2 text-xs font-semibold transition-colors hover:bg-white sm:self-center"
                      style={{ borderColor: colors.border, color: colors.accentDark }}
                    >
                      Edit request
                    </button>
                  </div>
                )}
                {showActivityPicker && (
                  <OptionPickerModal
                    title="Choose activities"
                    description="Select one or more activities to include in your custom trip request."
                    onClose={() => setShowActivityPicker(false)}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {activeAvailableActivities.map(act => (
                        <OptionCard
                          key={act.id}
                          item={act}
                          selected={selectedActivities.includes(act.id)}
                          price={`PHP ${Number(act.price || 0).toLocaleString()}`}
                          multiSelect
                          compact
                          onClick={() => handleActivityToggle(act.id)}
                        />
                      ))}
                    </div>
                    {!activeAvailableActivities.length && <p className="py-3 text-[12px]" style={{ color: colors.textMuted }}>Select a destination first to see available activities.</p>}
                    <button type="button" onClick={() => setShowActivityPicker(false)} className="mt-5 w-full bg-[#1a1715] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">Done</button>
                  </OptionPickerModal>
                )}
              </div>

              </>

              {/* 2. Select a Tour Guide */}
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
                              onClick={() => user ? selectPreferredGuide(String(guide.guideId)) : redirectToLogin()}
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
                          onClick={() => user ? selectPreferredGuide('') : redirectToLogin()}
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
          </div>

          {/* RIGHT SIDE: Selection Summary */}
          <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1 flex flex-col gap-5">
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
                  ['Travel dates', selectedTravelDates],
                  ['Duration', `${numDays || 0} days / ${numNights || 0} nights`],
                  ['Guests', guestCount],
                  ['Children (6-10)', childCount],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="shrink-0" style={{ color: colors.textMuted }}>{label}</span>
                    <span className="text-right font-medium" style={{ color: colors.textPrimary }}>{value}</span>
                  </div>
                ))}
                <div className="border-t pt-4" style={{ borderColor: colors.borderLight }}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.textSecondary }}>
                      Selections by day
                    </p>
                    <div className="flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Filter trip selections by day">
                      {Array.from({ length: summaryDayCount }, (_, dayIndex) => (
                        <button
                          key={dayIndex}
                          type="button"
                          aria-pressed={summaryDayIndex === dayIndex}
                          onClick={() => setSummaryDayIndex(dayIndex)}
                          className="shrink-0 rounded px-2 py-1 text-[10px] font-semibold transition-colors"
                          style={{
                            background: summaryDayIndex === dayIndex ? colors.accentDark : 'transparent',
                            color: summaryDayIndex === dayIndex ? '#ffffff' : colors.textMuted,
                          }}
                        >
                          Day {dayIndex + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 text-[12px]" aria-live="polite">
                    {getTripDayDateLabel(selectedDates[0], summaryDayIndex) && (
                      <p className="text-[11px]" style={{ color: colors.textMuted }}>
                        {getTripDayDateLabel(selectedDates[0], summaryDayIndex)}
                      </p>
                    )}
                    {[
                      ['Destination', selectedSummaryDay.destinations.join(', ') || 'Not selected'],
                      ['Accommodation', selectedSummaryDay.accommodation],
                      ['Tour guide', selectedSummaryDay.guide],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-start gap-3">
                        <span className="shrink-0" style={{ color: colors.textMuted }}>{label}</span>
                        <span className="text-right font-medium" style={{ color: colors.textPrimary }}>{value}</span>
                      </div>
                    ))}
                    <div>
                      <p style={{ color: colors.textMuted }}>Activities</p>
                      <p className="mt-1 break-words font-medium" style={{ color: colors.textPrimary }}>
                        {selectedSummaryDay.activities.join(', ') || 'None selected'}
                      </p>
                    </div>
                  </div>
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
