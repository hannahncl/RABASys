import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { bookingService } from '../../services/bookingService';
import { AuthContext } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Calendar, Users, Mail, Phone, User, Landmark, ShieldCheck, Sparkles, Globe } from 'lucide-react';
import WeatherWidget from '../../components/feedback/WeatherWidget';
import { api } from '../../services/api';
import { weatherService } from '../../services/weatherService';




// Shared style constants
const colors = {
  bg: '#ffffff',
  textPrimary: '#1a1a1a',
  textSecondary: '#45403a',
  textMuted: '#4a453b',
  border: '#e0dbd0',
  borderLight: '#eae5db',
  accent: '#6b6255',
  accentDark: '#2d2a24',
  inputBg: 'rgba(255,255,255,0.9)',
  subtleBg: 'rgba(244,241,235,0.35)',
};

const inputStyle = {
  background: colors.inputBg,
  border: `1px solid ${colors.border}`,
  borderRadius: '4px',
  color: colors.textPrimary,
  fontFamily: "'Inter', sans-serif",
};

const inputFocusHandlers = {
  onFocus: (e) => {
    e.target.style.borderColor = '#b0a68e';
    e.target.style.boxShadow = '0 0 0 3px rgba(176,166,142,0.1)';
  },
  onBlur: (e) => {
    e.target.style.borderColor = colors.border;
    e.target.style.boxShadow = 'none';
  },
};

const Booking = () => {
  const { packageId } = useParams();
  const { user } = useContext(AuthContext);
  const { confirm } = useConfirmation();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinerAvailability, setJoinerAvailability] = useState(null);

  // Form fields
  const [firstName, setFirstName] = useState(stateData.firstName || (user?.name ? user.name.split(' ')[0] : ''));
  const [lastName, setLastName] = useState(stateData.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : ''));
  const [email, setEmail] = useState(stateData.email || user?.email || '');
  const [phone, setPhone] = useState(stateData.phone || '');
  const [tourDate, setTourDate] = useState(stateData.tourDate || '');
  const [adultsCount, setAdultsCount] = useState(Math.max(1, Math.floor(Number(stateData.adultsCount) || 1)));
  const [childrenCount, setChildrenCount] = useState(Math.max(0, Math.floor(Number(stateData.childrenCount) || 0)));

  // Tour Guide Selection
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [tourGuides, setTourGuides] = useState([]);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const initialDate = stateData.tourDate ? new Date(`${stateData.tourDate}T00:00:00`) : new Date();
    return Number.isNaN(initialDate.getTime()) ? new Date() : initialDate;
  });

  // Calendar weather forecast data { 'YYYY-MM-DD': { description, icon } }
  const [calendarWeather, setCalendarWeather] = useState({});

  // Step & Payment State
  const [currentStep, setCurrentStep] = useState(stateData.startStep || 1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Credit Card Form State (mock)
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [gcashRef, setGcashRef] = useState('');

  useEffect(() => {
    const loadPkg = async () => {
      setLoading(true);
      setJoinerAvailability(null);

      try {
        const guides = await api('/tour-guides/public');
        setTourGuides(guides);
      } catch (err) {
        console.error('Failed to load tour guides:', err);
      }

      if (packageId === 'custom') {
        if (stateData.customPackage) {
          setPkg(stateData.customPackage);
        } else {
          navigate('/customize');
        }
        setLoading(false);
        return;
      }

      const data = await packageService.getById(packageId);
      if (!data) {
        showNotification('Invalid package selected.', 'error');
        navigate('/packages');
        return;
      }
      setPkg(data);
      if (String(data.packageType || data.package_type || data.category || '').toLowerCase() === 'joiner') {
        try {
          const availability = await api(`/bookings/joiner-availability/${packageId}`);
          setJoinerAvailability(availability);
          const departureDate = availability.departureDate || data.joinerDate;
          if (departureDate) {
            const fixedDate = String(departureDate).slice(0, 10);
            setTourDate(fixedDate);
            setCalendarDate(new Date(`${fixedDate}T00:00:00`));
          }
        } catch {
          if (data.joinerDate) setTourDate(String(data.joinerDate).slice(0, 10));
        }
      }
      setLoading(false);
    };
    loadPkg();
  }, [packageId, navigate, showNotification]);

  // Fetch calendar weather whenever calendarDate month/year changes
  useEffect(() => {
    const destination = pkg?.destination || pkg?.title || 'Legazpi';
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    weatherService.getMonthForecast(destination, year, month)
      .then(data => setCalendarWeather(data))
      .catch(() => setCalendarWeather({}));
  }, [calendarDate, pkg]);

  if (loading || !pkg) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: colors.bg }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin"
            style={{
              border: `1.5px solid ${colors.borderLight}`,
              borderTop: `1.5px solid ${colors.accentDark}`,
              borderRadius: '50%',
            }}
          />
        </div>
      </div>
    );
  }

  const isJoiner = String(pkg.packageType || pkg.package_type || pkg.category || '').toLowerCase() === 'joiner';
  const rawPackageCapacity = Number(pkg.maximumCapacity ?? pkg.max_capacity ?? 0);
  const packageCapacity = Number.isFinite(rawPackageCapacity) && rawPackageCapacity > 0
    ? Math.floor(rawPackageCapacity)
    : 0;
  const joinerPaxLimit = Number(joinerAvailability?.remainingSlots ?? pkg.joinerSlots ?? pkg.joiner_slots ?? 0);
  const maxPax = isJoiner
    ? Math.min(packageCapacity || joinerPaxLimit, joinerPaxLimit)
    : packageCapacity;
  const hasPaxLimit = packageCapacity > 0 || (isJoiner && joinerAvailability !== null);
  const totalGuests = adultsCount + childrenCount;
  const pricePerGuest = Number(pkg.price || 0);
  const totalPrice = isJoiner ? pricePerGuest * totalGuests : pricePerGuest;

  const handleIncreaseAdults = () => {
    if (hasPaxLimit && totalGuests >= maxPax) {
      showNotification(`Maximum capacity is ${maxPax} pax for this package.`, 'warning');
      return;
    }
    setAdultsCount((prev) => prev + 1);
  };

  const handleIncreaseChildren = () => {
    if (hasPaxLimit && totalGuests >= maxPax) {
      showNotification(`Maximum capacity is ${maxPax} pax for this package.`, 'warning');
      return;
    }
    setChildrenCount((prev) => prev + 1);
  };

  const getPackageDurationInDays = () => {
    if (!pkg?.duration) return 1;
    const match = String(pkg.duration).match(/(\d+)\s*-?\s*(?:days?|d)\b/i);
    const durationDays = match ? Number.parseInt(match[1], 10) : Number(pkg.duration);
    return Number.isInteger(durationDays) && durationDays > 0 ? durationDays : 1;
  };

  const formatDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date) => {
    setTourDate(formatDateInputValue(date));
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (isJoiner) {
      if (!joinerAvailability) {
        showNotification('Joiner availability is still loading. Please wait a moment and try again.', 'warning');
        return;
      }
      if (joinerAvailability.scheduleValid === false) {
        showNotification('This departure cannot be booked because its deadline must be at least 3 days before departure. Please contact the tour operator.', 'warning');
        return;
      }
      if (!joinerAvailability.bookingOpen) {
        showNotification('Booking for this departure is closed. Check the booking deadline or choose another departure.', 'warning');
        return;
      }
      if (totalGuests > joinerAvailability.remainingSlots) {
        showNotification(`Only ${joinerAvailability.remainingSlots} spot${joinerAvailability.remainingSlots === 1 ? '' : 's'} remain for this departure.`, 'warning');
        return;
      }
    }
    if (!firstName || !lastName || !email || !phone || !tourDate || totalGuests === 0) {
      showNotification('Please fill in all booking fields.', 'warning');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(firstName.trim())) {
      showNotification('First Name must only contain letters.', 'warning');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(lastName.trim())) {
      showNotification('Last Name must only contain letters.', 'warning');
      return;
    }
    if (!/^\d{11}$/.test(phone)) {
      showNotification('Contact Number must be exactly 11 digits.', 'warning');
      return;
    }
    if (hasPaxLimit && totalGuests > maxPax) {
      showNotification(`The selected number of pax (${totalGuests}) exceeds the package capacity (${maxPax} pax).`, 'warning');
      return;
    }
    setCurrentStep(2);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'gcash') {
      if (!gcashRef.trim()) {
        showNotification('Please enter your GCash reference number.', 'warning');
        return;
      }
      handlePaymentSuccess(gcashRef.trim());
    } else {
      if (!cardNumber || !expiryDate || !cvv) {
        showNotification('Please fill in card details.', 'warning');
        return;
      }
      // Mock card success
      handlePaymentSuccess('CARD-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    }
  }

  const handlePaymentSuccess = async (referenceNumber) => {
    if (!(await confirm('Are you sure you want to submit this tour booking?'))) return;
    setSubmitting(true);

    try {
      const bookingData = {
        packageId: pkg.id,
        packageName: pkg.title,
        customerName: `${firstName} ${lastName}`.trim(),
        customerEmail: email,
        customerPhone: phone,
        tourDate,
        guestsCount: totalGuests,
        totalPrice,
        paymentMethod: paymentMethod === 'gcash' ? 'GCash' : 'Credit Card',
        paymentRef: referenceNumber,
        gcashNumber: 'N/A',
        ...(pkg.customizedDetails && { customizedDetails: pkg.customizedDetails })
      };

      await bookingService.create(bookingData);
      showNotification(isJoiner
        ? 'Joiner booking confirmed! Your spots are reserved and a confirmation email has been dispatched.'
        : 'Booking successfully submitted! A confirmation email has been dispatched.', 'success');
      navigate('/');
    } catch (error) {
      showNotification(error.message || 'Failed to save booking. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Weather emoji helper
  const getWeatherEmoji = (description = '') => {
    const d = description.toLowerCase();
    if (d.includes('thunder') || d.includes('storm')) return '⛈️';
    if (d.includes('rain') || d.includes('shower') || d.includes('drizzle')) return '🌧️';
    if (d.includes('fog')) return '🌫️';
    if (d.includes('overcast')) return '☁️';
    if (d.includes('cloud') || d.includes('partly')) return '⛅';
    if (d.includes('clear') || d.includes('sunny') || d.includes('sun')) return '🌞';
    return '☁️';
  };

  // Helper for rendering calendar days
  const renderCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // Today at midnight for comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ num: i, date: new Date(year, month, i) });
    }

    const numDays = getPackageDurationInDays();
    const selectedDate = tourDate ? new Date(`${tourDate}T00:00:00`) : null;
    const rangeEndDate = selectedDate && !Number.isNaN(selectedDate.getTime())
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + numDays - 1)
      : null;

    // Helper to build date key for weather lookup
    const fmtKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return days.map((day, i) => {
      if (day.empty) return <div key={`empty-${i}`}></div>;

      const currentDate = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
      const isPast = currentDate < today;
      const isSelected = tourDate === fmtKey(currentDate);
      const isInRange = selectedDate && rangeEndDate && currentDate >= selectedDate && currentDate <= rangeEndDate;

      // Weather for this date
      const dateKey = fmtKey(currentDate);
      const weather = calendarWeather[dateKey];

      let dayStyle = {
        background: 'transparent',
        color: colors.textPrimary,
        borderRadius: '4px',
        cursor: 'pointer',
        position: 'relative',
      };

      // Past dates: pale color and not clickable
      if (isPast) {
        dayStyle = {
          ...dayStyle,
          color: '#c8c3b8',
          cursor: 'not-allowed',
          opacity: 0.5,
        };
      } else if (isInRange) {
        dayStyle = {
          ...dayStyle,
          background: '#E5E7EB',
          color: colors.textPrimary,
          border: '1px solid #9CA3AF',
        };
      }

      return (
        <div
          key={i}
          onClick={() => !isPast && handleDateSelect(day.date)}
          className="flex items-center justify-center text-xs font-semibold transition-all"
          style={{ ...dayStyle, width: '36px', height: '36px' }}
          title={weather ? `${weather.description} · ${weather.tempMax}°C` : ''}
          onMouseEnter={(e) => {
            if (isPast) return;
            if (!isInRange) {
              e.currentTarget.style.background = 'rgba(176,166,142,0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (isPast) return;
            if (!isInRange) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {weather && !isPast && (
            <span style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              fontSize: '11px',
              lineHeight: 1,
              filter: 'saturate(0.85)',
              pointerEvents: 'none',
            }}>
              {getWeatherEmoji(weather.description)}
            </span>
          )}
          {day.num}
        </div>
      );
    });
  };

  // Section label component
  const SectionLabel = ({ children }) => (
    <h3
      className="text-[10px] font-semibold mb-4"
      style={{
        color: colors.textMuted,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </h3>
  );

  return (
    <div className="min-h-screen pb-24 pt-8" style={{ background: colors.bg, fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column - Form */}
          <div className="lg:col-span-7">
            {currentStep === 1 ? (
              // STEP 1: Enter Info UI
              <>
                <h2
                  className="text-[13px] font-semibold mb-10"
                  style={{
                    color: colors.textPrimary,
                    fontFamily: "'Outfit', Georgia, serif",
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Select Options
                </h2>
                <form id="booking-form" onSubmit={handleProceedToPayment} className="space-y-10">
                  {/* Date Selection */}
                  <div>
                    <SectionLabel>{isJoiner ? 'Scheduled Joiner Departure' : 'Please select a travel date'}</SectionLabel>
                    {isJoiner ? (
                      <div className="max-w-[420px] rounded border border-[#e0dbd0] bg-[#faf9f6] p-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#8b7355]" />
                          <div>
                            <p className="text-sm font-semibold text-[#2d2a24]">
                              {tourDate ? new Date(`${tourDate}T00:00:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Departure date not set'}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[#777064]">Join this scheduled departure with other travelers. Your spots are reserved automatically when you submit your booking.</p>
                            <p className="mt-2 text-[11px] font-medium text-[#6b6255]">{joinerAvailability?.scheduleValid === false ? 'The booking deadline must be at least 3 days before departure. The operator needs to correct this schedule.' : joinerAvailability ? (joinerAvailability.bookingOpen ? `${joinerAvailability.remainingSlots} spots remaining` : 'Booking is closed for this departure') : 'Availability could not be checked. Please refresh.'}</p>
                            {joinerAvailability?.scheduleValid !== false && (joinerAvailability?.bookingDeadline || pkg.joinerBookingDeadline) && <p className="mt-2 text-[11px] text-[#6b6255]">Booking closes {new Date(`${String(joinerAvailability?.bookingDeadline || pkg.joinerBookingDeadline).slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })}, at least 3 days before departure.</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div className="relative max-w-[320px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (!showDatePicker && tourDate) {
                            const selectedDate = new Date(`${tourDate}T00:00:00`);
                            if (!Number.isNaN(selectedDate.getTime())) setCalendarDate(selectedDate);
                          }
                          setShowDatePicker(!showDatePicker);
                        }}
                        className="w-full py-3 px-4 flex items-center justify-between text-[14px] transition-all focus:outline-none"
                        style={{
                          ...inputStyle,
                          boxShadow: showDatePicker ? '0 0 0 3px rgba(176,166,142,0.1)' : 'none',
                        }}
                      >
                        <span className="flex items-center" style={{ color: tourDate ? colors.textPrimary : colors.textMuted }}>
                          {tourDate && !showDatePicker ? new Date(tourDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Check Availability'}
                        </span>
                        <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
                      </button>

                      {/* Custom Date Picker Popover */}
                      {showDatePicker && (
                        <div
                          className="absolute top-full left-0 mt-3 p-5 w-[320px] z-50"
                          style={{
                            background: '#ffffff',
                            borderRadius: '6px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                            border: `1px solid ${colors.border}`,
                          }}
                        >

                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4 px-2">
                            {(() => {
                              const now = new Date();
                              const isCurrentMonth = calendarDate.getFullYear() === now.getFullYear() && calendarDate.getMonth() === now.getMonth();
                              const isPastMonth = calendarDate.getFullYear() < now.getFullYear() || (calendarDate.getFullYear() === now.getFullYear() && calendarDate.getMonth() <= now.getMonth());
                              return (
                                <button
                                  type="button"
                                  disabled={isPastMonth}
                                  onClick={() => {
                                    if (isPastMonth) return;
                                    const prevMonth = new Date(calendarDate);
                                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                                    setCalendarDate(prevMonth);
                                  }}
                                  className="font-semibold px-2 py-1 transition-colors"
                                  style={{
                                    color: isPastMonth ? '#c8c3b8' : colors.textPrimary,
                                    cursor: isPastMonth ? 'not-allowed' : 'pointer',
                                    opacity: isPastMonth ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) => { if (!isPastMonth) e.target.style.color = colors.accent; }}
                                  onMouseLeave={(e) => { if (!isPastMonth) e.target.style.color = colors.textPrimary; }}
                                >
                                  &lt;
                                </button>
                              );
                            })()}
                            <span
                              className="text-[12px] font-semibold"
                              style={{
                                color: colors.textPrimary,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                              }}
                            >
                              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextMonth = new Date(calendarDate);
                                nextMonth.setMonth(nextMonth.getMonth() + 1);
                                setCalendarDate(nextMonth);
                              }}
                              className="font-semibold px-2 py-1 transition-colors"
                              style={{ color: colors.textPrimary }}
                              onMouseEnter={(e) => (e.target.style.color = colors.accent)}
                              onMouseLeave={(e) => (e.target.style.color = colors.textPrimary)}
                            >
                              &gt;
                            </button>
                          </div>

                          {/* Calendar Grid */}
                          <p className="mb-3 text-center text-[10px]" style={{ color: colors.textMuted }}>
                            Choose a start date · highlights {getPackageDurationInDays()} {getPackageDurationInDays() === 1 ? 'day' : 'consecutive days'}
                          </p>
                          <div className="grid grid-cols-7 gap-y-3 mb-6 justify-items-center">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div
                                key={day}
                                className="text-[9px] font-semibold"
                                style={{
                                  color: colors.textMuted,
                                  letterSpacing: '0.08em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {day}
                              </div>
                            ))}
                            {renderCalendarDays()}
                          </div>

                          {/* Footer Buttons */}
                          <div className="flex justify-between items-center px-1">
                            <button
                              type="button"
                              onClick={() => setShowDatePicker(false)}
                              className="px-5 py-1.5 text-[10px] font-semibold transition-all duration-300"
                              style={{
                                border: `1px solid ${colors.border}`,
                                borderRadius: '2px',
                                color: colors.textSecondary,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                background: 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.borderColor = colors.accentDark;
                                e.target.style.color = colors.textPrimary;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.borderColor = colors.border;
                                e.target.style.color = colors.textSecondary;
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDatePicker(false)}
                              className="px-5 py-1.5 text-[10px] font-semibold transition-all duration-300 cursor-pointer"
                              style={{
                                background: colors.accentDark,
                                borderRadius: '2px',
                                color: '#f7f4ef',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                border: 'none',
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#1a1715';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = colors.accentDark;
                              }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </div>

                  {/* Number of Pax */}
                  <div>
                    <SectionLabel>
                      Number of pax {maxPax > 0 && (
                        <span className="text-[11px] font-normal lowercase tracking-normal text-[#8a7f70] ml-1.5">
                          (max {maxPax} pax)
                        </span>
                      )}
                    </SectionLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Adult */}
                      <div
                        className="flex items-center justify-between py-3 px-4"
                        style={inputStyle}
                      >
                        <span className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>Adult</span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                            className="w-6 h-6 flex items-center justify-center font-semibold transition-colors"
                            style={{ color: colors.textMuted }}
                            onMouseEnter={(e) => (e.target.style.color = colors.textPrimary)}
                            onMouseLeave={(e) => (e.target.style.color = colors.textMuted)}
                          >
                            -
                          </button>
                          <span className="text-[14px] font-bold w-4 text-center" style={{ color: colors.textPrimary }}>{adultsCount}</span>
                          <button
                            type="button"
                            onClick={handleIncreaseAdults}
                            disabled={hasPaxLimit && totalGuests >= maxPax}
                            className={`w-6 h-6 flex items-center justify-center font-semibold transition-colors ${hasPaxLimit && totalGuests >= maxPax ? 'opacity-30 cursor-not-allowed' : ''}`}
                            style={{ color: colors.textMuted }}
                            onMouseEnter={(e) => { if (!(hasPaxLimit && totalGuests >= maxPax)) e.target.style.color = colors.textPrimary; }}
                            onMouseLeave={(e) => (e.target.style.color = colors.textMuted)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Child */}
                      <div
                        className="flex items-center justify-between py-3 px-4"
                        style={inputStyle}
                      >
                        <span className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>Child (6-10)</span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                            className="w-6 h-6 flex items-center justify-center font-semibold transition-colors"
                            style={{ color: colors.textMuted }}
                            onMouseEnter={(e) => (e.target.style.color = colors.textPrimary)}
                            onMouseLeave={(e) => (e.target.style.color = colors.textMuted)}
                          >
                            -
                          </button>
                          <span className="text-[14px] font-bold w-4 text-center" style={{ color: colors.textPrimary }}>{childrenCount}</span>
                          <button
                            type="button"
                            onClick={handleIncreaseChildren}
                            disabled={hasPaxLimit && totalGuests >= maxPax}
                            className={`w-6 h-6 flex items-center justify-center font-semibold transition-colors ${hasPaxLimit && totalGuests >= maxPax ? 'opacity-30 cursor-not-allowed' : ''}`}
                            style={{ color: colors.textMuted }}
                            onMouseEnter={(e) => { if (!(hasPaxLimit && totalGuests >= maxPax)) e.target.style.color = colors.textPrimary; }}
                            onMouseLeave={(e) => (e.target.style.color = colors.textMuted)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    {hasPaxLimit && (
                      <p className="text-[11px] mt-1.5 text-[#8a7f70]">
                        {isJoiner
                          ? `${totalGuests} guest${totalGuests === 1 ? '' : 's'} selected · PHP ${pricePerGuest.toLocaleString()} per person`
                          : `${totalGuests} / ${maxPax} total pax selected (package rate is fixed regardless of pax)`}
                      </p>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div>
                    <SectionLabel>Contact Information</SectionLabel>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label
                            className="block text-[11px] font-medium mb-2"
                            style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                          >
                            First Name <span style={{ color: '#b83b3b' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                            className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all capitalize"
                            style={inputStyle}
                            {...inputFocusHandlers}
                          />
                        </div>
                        <div>
                          <label
                            className="block text-[11px] font-medium mb-2"
                            style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                          >
                            Last Name <span style={{ color: '#b83b3b' }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                            className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all capitalize"
                            style={inputStyle}
                            {...inputFocusHandlers}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2"
                          style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                        >
                          Email Address <span style={{ color: '#b83b3b' }}>*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                          style={inputStyle}
                          {...inputFocusHandlers}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2"
                          style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                        >
                          Contact Number <span style={{ color: '#b83b3b' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          maxLength={11}
                          inputMode="numeric"
                          className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                          style={inputStyle}
                          {...inputFocusHandlers}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: colors.accent }} />
                    <p
                      className="text-[10px] font-medium leading-relaxed"
                      style={{ color: colors.textSecondary, letterSpacing: '0.02em' }}
                    >
                      Once your info is submitted, it cannot be changed. Please double-check before proceeding.
                    </p>
                  </div>

                </form>
              </>
            ) : (
              // STEP 2: Payment UI
              <>
                <h2
                  className="text-[13px] font-semibold mb-10"
                  style={{
                    color: colors.textPrimary,
                    fontFamily: "'Outfit', Georgia, serif",
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Complete Payment
                </h2>
                <form id="payment-form" onSubmit={handleFinalSubmit} className="space-y-6">

                  {/* GCash Option */}
                  <label className="flex items-center gap-4 cursor-pointer py-2">
                    <div
                      className="w-[18px] h-[18px] flex items-center justify-center transition-colors"
                      style={{
                        border: `1.5px solid ${paymentMethod === 'gcash' ? colors.accentDark : colors.border}`,
                        borderRadius: '50%',
                      }}
                    >
                      {paymentMethod === 'gcash' && (
                        <div
                          className="w-2.5 h-2.5"
                          style={{ background: colors.accentDark, borderRadius: '50%' }}
                        />
                      )}
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: colors.textPrimary, letterSpacing: '0.04em' }}>GCash</span>
                    <input type="radio" className="hidden" checked={paymentMethod === 'gcash'} onChange={() => setPaymentMethod('gcash')} />
                  </label>

                  {/* GCash Reference Number Input */}
                  {paymentMethod === 'gcash' && (
                    <div
                      className="p-6 space-y-3"
                      style={{
                        background: colors.subtleBg,
                        border: `1px solid ${colors.borderLight}`,
                        borderRadius: '4px',
                      }}
                    >
                      <p className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                        Please send your payment via GCash and enter the reference number below. Our admin will verify your payment.
                      </p>
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2"
                          style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                        >
                          GCash Reference Number <span style={{ color: '#b83b3b' }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1234 5678 9012"
                          value={gcashRef}
                          onChange={(e) => setGcashRef(e.target.value)}
                          className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                          style={inputStyle}
                          {...inputFocusHandlers}
                        />
                      </div>
                    </div>
                  )}

                  <div className="my-4 w-full" style={{ height: '1px', background: colors.borderLight }} />

                  {/* Credit/Debit Option */}
                  <label className="flex items-center justify-between cursor-pointer py-2">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-[18px] h-[18px] flex items-center justify-center transition-colors"
                        style={{
                          border: `1.5px solid ${paymentMethod === 'card' ? colors.accentDark : colors.border}`,
                          borderRadius: '50%',
                        }}
                      >
                        {paymentMethod === 'card' && (
                          <div
                            className="w-2.5 h-2.5"
                            style={{ background: colors.accentDark, borderRadius: '50%' }}
                          />
                        )}
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: colors.textPrimary, letterSpacing: '0.04em' }}>Credit/ Debit Card</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[#1A1F71] font-bold italic text-sm">VISA</div>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-[#EB001B] relative left-1 z-10"></div>
                        <div className="w-3 h-3 rounded-full bg-[#F79E1B] relative right-1"></div>
                      </div>
                    </div>
                    <input type="radio" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  </label>

                  {/* Credit Card Form (Visible if selected) */}
                  {paymentMethod === 'card' && (
                    <div
                      className="p-6 mt-4 space-y-5"
                      style={{
                        background: colors.subtleBg,
                        border: `1px solid ${colors.borderLight}`,
                        borderRadius: '4px',
                      }}
                    >
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2"
                          style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                        >
                          Card number <span style={{ color: '#b83b3b' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-[260px] py-3 px-4 text-[14px] focus:outline-none transition-all"
                          style={inputStyle}
                          {...inputFocusHandlers}
                        />
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <label
                            className="block text-[11px] font-medium mb-2"
                            style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                          >
                            Expiration date <span style={{ color: '#b83b3b' }}>*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YYYY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-[180px] py-3 px-4 text-[14px] focus:outline-none transition-all"
                            style={inputStyle}
                            {...inputFocusHandlers}
                          />
                        </div>
                        <div>
                          <label
                            className="block text-[11px] font-medium mb-2"
                            style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                          >
                            Security Code <span style={{ color: '#b83b3b' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            className="w-[180px] py-3 px-4 text-[14px] focus:outline-none transition-all"
                            style={inputStyle}
                            {...inputFocusHandlers}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5"
                          style={{ accentColor: colors.accentDark }}
                        />
                        <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>Save card details</span>
                      </label>
                    </div>
                  )}

                  {/* Final T&C and Submit */}
                  <div className="flex items-center justify-between pt-12">
                    <label className="flex items-start gap-2.5 cursor-pointer max-w-[280px]">
                      <input
                        type="checkbox"
                        className="w-3 h-3 mt-0.5"
                        style={{ accentColor: colors.accentDark }}
                      />
                      <span className="text-[9px] leading-tight" style={{ color: colors.textSecondary }}>
                        By continuing, you acknowledge and agree to <span className="underline cursor-pointer">General Terms of Use</span> and <span className="underline cursor-pointer">Privacy Policy</span>
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2.5 px-8 text-[11px] font-semibold active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      style={{
                        background: colors.accentDark,
                        color: '#f7f4ef',
                        borderRadius: '2px',
                        letterSpacing: '0.12em',
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
                      {submitting ? 'Processing...' : 'Proceed to Pay'}
                    </button>
                  </div>

                </form>
              </>
            )}
          </div>

          {/* Right Column - Booking Details Card & Weather Forecast */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-20 space-y-6 max-w-sm">
              <div
                className="p-6"
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.bg,
                }}
              >
                <h3
                  className="text-[11px] font-semibold mb-6 pb-4"
                  style={{
                    color: colors.textMuted,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}
                >
                  Booking Details
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4
                      className="font-medium text-lg"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: "'Outfit', Georgia, serif",
                        letterSpacing: '0.02em',
                      }}
                    >
                      {pkg.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] font-medium mt-2" style={{ color: colors.textSecondary }}>
                      <ShieldCheck className="w-3.5 h-3.5" style={{ color: colors.accent }} />
                      <span>Strictly No Cancellation</span>
                    </div>
                  </div>

                  <div
                    className="pt-4 space-y-3 text-[12px]"
                    style={{ borderTop: `1px solid ${colors.borderLight}` }}
                  >
                    <div className="flex justify-between font-medium" style={{ color: colors.textPrimary }}>
                      <span>Date</span>
                      <span>{tourDate ? new Date(tourDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'}</span>
                    </div>
                    <div className="flex justify-between font-medium" style={{ color: colors.textPrimary }}>
                      <span>Quantity</span>
                      <span>
                        {adultsCount > 0 && `Adult x ${adultsCount}`}
                        {adultsCount > 0 && childrenCount > 0 && ', '}
                        {childrenCount > 0 && `Child x ${childrenCount}`}
                      </span>
                    </div>
                  </div>

                  <div
                    className="pt-4 flex justify-between items-center"
                    style={{ borderTop: `1px solid ${colors.borderLight}` }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: colors.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{isJoiner ? 'Total (per person × pax)' : 'Total'}</span>
                    <span
                      className="text-lg font-semibold"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      ₱{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {currentStep === 1 && (
                  <button
                    type="submit"
                    form="booking-form"
                    disabled={submitting}
                    className="w-full py-3 text-[11px] font-semibold transition-all duration-300 disabled:opacity-50 mt-3 cursor-pointer"
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
                    Proceed to Pay
                  </button>
                )}
              </div>

              {/* Free Weather API Forecast Box (Flashes automatically on Date Selection) */}
              {currentStep === 1 && (
                <WeatherWidget
                  destination={pkg.destination || pkg.meetingLocation || pkg.title || 'Legazpi, Albay'}
                  tourDate={tourDate}
                  durationDays={getPackageDurationInDays()}
                  theme="light"
                />
              )}
            </div>
          </div>


        </div>
      </div>

    </div>
  );
};

export default Booking;
