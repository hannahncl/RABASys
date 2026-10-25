import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import { Loader, ArrowLeft, Calendar, ShieldCheck, Star } from 'lucide-react';
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


const CarBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { confirm } = useConfirmation();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [bookedRanges, setBookedRanges] = useState([]);

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [gcashRef, setGcashRef] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Calendar state
  const [showPickupCal, setShowPickupCal] = useState(false);
  const [showReturnCal, setShowReturnCal] = useState(false);
  const [pickupCalDate, setPickupCalDate] = useState(new Date());
  const [returnCalDate, setReturnCalDate] = useState(new Date());

  // Calendar weather forecast data { 'YYYY-MM-DD': { description, icon } }
  const [pickupCalWeather, setPickupCalWeather] = useState({});
  const [returnCalWeather, setReturnCalWeather] = useState({});

  useEffect(() => {
    if (!user) {
      showNotification('Please log in to book a car', 'error');
      navigate('/login', { state: { from: { pathname: `/car-rentals/${id}` } } });
      return;
    }

    const fetchCar = async () => {
      try {
        const data = await serviceService.getById(id, 'car');
        if (!data || data.category !== 'car' || String(data.availabilityStatus ?? data.availability_status ?? 'Available').trim().toLowerCase() !== 'available') throw new Error('Not found');
        setCar(data);

        try {
          const availability = await api(`/rental-bookings/availability/${id}`);
          setBookedRanges(Array.isArray(availability?.bookings) ? availability.bookings : []);
        } catch (availabilityError) {
          // The server-side conflict check remains authoritative if the
          // calendar availability request fails.
          console.error('Failed to load vehicle availability:', availabilityError);
        }
      } catch (error) {
        showNotification('Car not found', 'error');
        navigate('/car-rentals');
      } finally {
        setLoading(false);
      }
    };

    const loadReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await api(`/reviews?vehicle_id=${id}`).catch(() => []);
        setReviews(Array.isArray(data) ? data.filter(r => String(r.vehicle_id) === String(id)) : []);
      } catch (err) {
        console.error('Failed to load reviews for vehicle:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchCar();
    loadReviews();
  }, [id, user, navigate, showNotification]);

  const isDateOccupied = (dateValue) => {
    const dateKey = typeof dateValue === 'string'
      ? dateValue.slice(0, 10)
      : `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;
    return bookedRanges.some(({ pickupDate, returnDate }) => pickupDate <= dateKey && dateKey < returnDate);
  };

  const isRentalRangeAvailable = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return !bookedRanges.some(({ pickupDate, returnDate }) => pickupDate < endDate && returnDate > startDate);
  };

  const handleBookCar = async (e) => {
    e.preventDefault();
    if (!(await confirm('Are you sure you want to submit this car rental booking?'))) return;
    if (!pickupDate || !returnDate || !pickupLocation) {
      showNotification('Please fill in all booking details', 'error');
      return;
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (end <= start) {
      showNotification('Return date must be after pickup date', 'error');
      return;
    }

    if (paymentMethod === 'gcash') {
      if (!gcashRef.trim()) {
        showNotification('Please enter your GCash reference number.', 'warning');
        return;
      }
    } else if (!cardNumber || !expiryDate || !cvv) {
      showNotification('Please fill in the card details.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const referenceNumber = paymentMethod === 'gcash'
        ? gcashRef.trim()
        : `CARD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      await bookingService.createRental({
        vehicleId: id,
        pickupDate,
        returnDate,
        pickupLocation,
        paymentMethod: paymentMethod === 'gcash' ? 'GCash' : 'Credit Card',
        paymentRef: referenceNumber,
      });
      showNotification('Car booking submitted successfully and is pending admin approval.', 'success');
      navigate('/profile');
    } catch (error) {
      showNotification(error?.message || error.response?.data?.message || 'Failed to book car', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDaysAndPrice = () => {
    if (!pickupDate || !returnDate || !car) return { days: 0, total: 0 };
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (end <= start) return { days: 0, total: 0 };
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days, total: days * car.price };
  };

  const { days, total } = calculateDaysAndPrice();

  // Fetch weather for pickup calendar month
  useEffect(() => {
    const year = pickupCalDate.getFullYear();
    const month = pickupCalDate.getMonth();
    weatherService.getMonthForecast('Legazpi', year, month)
      .then(data => setPickupCalWeather(data))
      .catch(() => setPickupCalWeather({}));
  }, [pickupCalDate.getFullYear(), pickupCalDate.getMonth()]);

  // Fetch weather for return calendar month
  useEffect(() => {
    const year = returnCalDate.getFullYear();
    const month = returnCalDate.getMonth();
    weatherService.getMonthForecast('Legazpi', year, month)
      .then(data => setReturnCalWeather(data))
      .catch(() => setReturnCalWeather({}));
  }, [returnCalDate.getFullYear(), returnCalDate.getMonth()]);

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

  // Render calendar days for a given calendar date, selected value, and minimum date
  const renderCalendarDays = (calDate, selectedValue, minDate, onSelect, weatherData, isDateDisabled) => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minD = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : today;

    const daysArr = [];
    for (let i = 0; i < firstDay; i++) {
      daysArr.push({ empty: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArr.push({ num: i, date: new Date(year, month, i) });
    }

    const selectedDate = selectedValue ? new Date(`${selectedValue}T00:00:00`) : null;

    // Helper to build date key for weather lookup
    const fmtKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return daysArr.map((day, i) => {
      if (day.empty) return <div key={`empty-${i}`}></div>;

      const currentDate = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
      const isPast = currentDate < minD;
      const dateKey = fmtKey(currentDate);
      const isUnavailable = Boolean(isDateDisabled?.(dateKey));
      const isSelected = selectedDate && currentDate.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();

      // Weather for this date
      const weather = weatherData ? weatherData[dateKey] : null;

      let dayStyle = {
        background: 'transparent',
        color: colors.textPrimary,
        borderRadius: '4px',
        cursor: 'pointer',
        position: 'relative',
      };

      if (isPast || isUnavailable) {
        dayStyle = {
          ...dayStyle,
          color: '#c8c3b8',
          cursor: 'not-allowed',
          opacity: 0.5,
        };
      } else if (isSelected) {
        dayStyle = {
          ...dayStyle,
          background: '#e8dfce',
          color: colors.textPrimary,
          border: '1px solid #b0a68e',
        };
      }

      return (
        <div
          key={i}
          onClick={() => !isPast && !isUnavailable && onSelect(day.date)}
          className="flex items-center justify-center text-xs font-semibold transition-all"
          style={{ ...dayStyle, width: '36px', height: '36px' }}
          title={weather ? `${weather.description} · ${weather.tempMax}°C` : ''}
          onMouseEnter={(e) => {
            if (isPast || isUnavailable) return;
            if (!isSelected) {
              e.currentTarget.style.background = 'rgba(176,166,142,0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (isPast || isUnavailable) return;
            if (!isSelected) {
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

  // Reusable calendar popover component
  const CalendarPopover = ({ calDate, setCalDate, selectedValue, minDate, onSelect, onClose, weatherData, isDateDisabled }) => {
    const now = new Date();
    const minMonth = minDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const isPastMonth = calDate.getFullYear() < minMonth.getFullYear() || (calDate.getFullYear() === minMonth.getFullYear() && calDate.getMonth() <= minMonth.getMonth());

    return (
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
          <button
            type="button"
            disabled={isPastMonth}
            onClick={() => {
              if (isPastMonth) return;
              const prevMonth = new Date(calDate);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setCalDate(prevMonth);
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
          <span
            className="text-[12px] font-semibold"
            style={{
              color: colors.textPrimary,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {calDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextMonth = new Date(calDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setCalDate(nextMonth);
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
          {renderCalendarDays(calDate, selectedValue, minDate, onSelect, weatherData, isDateDisabled)}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between items-center px-1">
          <button
            type="button"
            onClick={onClose}
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
            onClick={onClose}
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
    );
  };

  if (loading) {
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

  if (!car) return null;

  // Min date for return calendar is 1 day after pickup
  const returnMinDate = pickupDate ? (() => { const d = new Date(`${pickupDate}T00:00:00`); d.setDate(d.getDate() + 1); return d; })() : null;

  return (
    <div className="min-h-screen pt-12 pb-24" style={{ background: colors.bg, fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <Link
            to="/car-rentals"
            className="inline-flex items-center gap-2.5 text-[11px] font-medium mb-4 transition-colors duration-300"
            style={{
              color: colors.textMuted,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.textPrimary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Car Rentals
          </Link>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-15">

          {/* Left Column - Car Details Card */}
          <div className="lg:col-span-5">
            <h2
              className="text-[13px] font-semibold mb-6"
              style={{
                color: colors.textPrimary,
                fontFamily: "'Outfit', Georgia, serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Car Details
            </h2>
            <div
              className="p-8 flex flex-col items-center"
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.bg,
              }}
            >
              <div
                className="h-[240px] w-full flex items-center justify-center mb-10 overflow-hidden"
                style={{ background: '#fcfbf9', borderRadius: '4px' }}
              >
                <img
                  src={car.image || 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600'}
                  alt={car.vehicleName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full max-w-xs space-y-4">
                {[
                  { label: 'Vehicle Name:', value: car.vehicleName },
                  { label: 'Vehicle Type:', value: car.vehicleType },
                  { label: 'Plate Number:', value: car.plateNumber },
                  { label: 'Seating Capacity:', value: car.capacity },
                  { label: 'Daily Rate:', value: `₱${Number(car.price).toLocaleString()}` },
                  { 
                    label: 'Rating:', 
                    value: (
                      <span className="flex items-center gap-1.5 font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#c4b99a] text-[#c4b99a]" />
                        <span>
                          {car.rating > 0 
                            ? `${Number(car.rating).toFixed(1)} (${car.reviewsCount || reviews.length} ${car.reviewsCount === 1 ? 'review' : 'reviews'})`
                            : reviews.length > 0
                              ? `${(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} (${reviews.length} reviews)`
                              : 'No reviews yet'}
                        </span>
                      </span>
                    )
                  }
                ].map(item => (
                  <div className="grid grid-cols-2" key={item.label}>
                    <span
                      className="text-[10px] font-semibold"
                      style={{
                        color: colors.textMuted,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.label}
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: colors.textPrimary }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-7 pt-2">
            <h2
              className="text-[13px] font-semibold mb-6"
              style={{
                color: colors.textPrimary,
                fontFamily: "'Outfit', Georgia, serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Rental Information
            </h2>
            <form onSubmit={handleBookCar} className="space-y-10">

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  {/* Pickup Date - Custom Calendar */}
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-2"
                      style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                    >
                      Pickup Date <span style={{ color: '#b83b3b' }}>*</span>
                    </label>
                    <div className="relative max-w-[320px]">
                      <button
                        type="button"
                        onClick={() => { setShowPickupCal(!showPickupCal); setShowReturnCal(false); }}
                        className="w-full py-3 px-4 flex items-center justify-between text-[14px] transition-all focus:outline-none"
                        style={{
                          ...inputStyle,
                          boxShadow: showPickupCal ? '0 0 0 3px rgba(176,166,142,0.1)' : 'none',
                        }}
                      >
                        <span className="flex items-center" style={{ color: pickupDate ? colors.textPrimary : colors.textMuted }}>
                          {pickupDate && !showPickupCal ? new Date(`${pickupDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Pickup Date'}
                        </span>
                        <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
                      </button>

                      {showPickupCal && (
                        <CalendarPopover
                          calDate={pickupCalDate}
                          setCalDate={setPickupCalDate}
                          selectedValue={pickupDate}
                          minDate={null}
                          onSelect={(date) => {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            const val = `${yyyy}-${mm}-${dd}`;
                            setPickupDate(val);
                            // Reset return date if it's before the new pickup date
                            if (returnDate && returnDate <= val) {
                              setReturnDate('');
                            }
                          }}
                          onClose={() => setShowPickupCal(false)}
                          weatherData={pickupCalWeather}
                          isDateDisabled={(dateKey) => isDateOccupied(dateKey)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Return Date - Custom Calendar */}
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-2"
                      style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                    >
                      Return Date <span style={{ color: '#b83b3b' }}>*</span>
                    </label>
                    <div className="relative max-w-[320px]">
                      <button
                        type="button"
                        onClick={() => { setShowReturnCal(!showReturnCal); setShowPickupCal(false); }}
                        className="w-full py-3 px-4 flex items-center justify-between text-[14px] transition-all focus:outline-none"
                        style={{
                          ...inputStyle,
                          boxShadow: showReturnCal ? '0 0 0 3px rgba(176,166,142,0.1)' : 'none',
                        }}
                      >
                        <span className="flex items-center" style={{ color: returnDate ? colors.textPrimary : colors.textMuted }}>
                          {returnDate && !showReturnCal ? new Date(`${returnDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Return Date'}
                        </span>
                        <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
                      </button>

                      {showReturnCal && (
                        <CalendarPopover
                          calDate={returnCalDate}
                          setCalDate={setReturnCalDate}
                          selectedValue={returnDate}
                          minDate={returnMinDate}
                          onSelect={(date) => {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            setReturnDate(`${yyyy}-${mm}-${dd}`);
                          }}
                          onClose={() => setShowReturnCal(false)}
                          weatherData={returnCalWeather}
                          isDateDisabled={(dateKey) => {
                            if (!pickupDate) return isDateOccupied(dateKey);
                            return !isRentalRangeAvailable(pickupDate, dateKey);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    className="block text-[11px] font-medium mb-2"
                    style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                  >
                    Pickup Location <span style={{ color: '#b83b3b' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Where do you want to pick up the car?"
                    required
                    className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                    style={inputStyle}
                    {...inputFocusHandlers}
                  />
                </div>
              </div>

              {/* Price Summary */}
              {days > 0 && (
                <div
                  className="p-6"
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.bg,
                  }}
                >
                  <SectionLabel>Summary</SectionLabel>
                  <div className="flex justify-between font-medium mb-2" style={{ color: colors.textSecondary, fontSize: '13px' }}>
                    <span>₱{Number(car.price).toLocaleString()} × {days} day{days !== 1 && 's'}</span>
                    <span>₱{total.toLocaleString()}</span>
                  </div>
                  <div
                    className="mt-4 pt-4 flex justify-between items-center"
                    style={{ borderTop: `1px solid ${colors.borderLight}` }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: colors.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total Estimated Amount</span>
                    <span
                      className="text-lg font-semibold"
                      style={{
                        color: colors.textPrimary,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      ₱{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div
                className="p-6 space-y-5"
                style={{
                  background: colors.subtleBg,
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '4px',
                }}
              >
                <SectionLabel>Payment</SectionLabel>
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

                {paymentMethod === 'gcash' && (
                  <div className="space-y-3">
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

                {paymentMethod === 'card' && (
                  <div className="space-y-5">
                    <div>
                      <label
                        className="block text-[11px] font-medium mb-2"
                        style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                      >
                        Card number <span style={{ color: '#b83b3b' }}>*</span>
                      </label>
                      <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-[260px] py-3 px-4 text-[14px] focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2"
                          style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                        >
                          Expiration date <span style={{ color: '#b83b3b' }}>*</span>
                        </label>
                        <input type="text" placeholder="MM/YYYY" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-[180px] py-3 px-4 text-[14px] focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                      </div>
                      <div>
                        <label
                          className="block text-[11px] font-medium mb-2"
                          style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                        >
                          Security Code <span style={{ color: '#b83b3b' }}>*</span>
                        </label>
                        <input type="text" placeholder="CVC" value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all" style={inputStyle} {...inputFocusHandlers} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-3 px-12 text-[11px] font-semibold active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
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
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Customer Reviews Section */}
        <div className="mt-16 pt-12 border-t border-[#eae5db]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2
                className="text-[13px] font-semibold"
                style={{
                  color: colors.textPrimary,
                  fontFamily: "'Outfit', Georgia, serif",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Customer Reviews & Ratings
              </h2>
              <p className="text-xs text-[#8f8576] mt-1">Verified feedback from customers who rented this vehicle</p>
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 bg-[#faf9f6] px-4 py-2 rounded-full border border-[#eae5db] self-start sm:self-auto">
                <Star className="w-4 h-4 fill-[#c4b99a] text-[#c4b99a]" />
                <span className="text-sm font-bold text-[#1a1a1a]">
                  {(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)}
                </span>
                <span className="text-xs text-[#6b6255]">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {loadingReviews ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#eae5db] border-t-[#2d2a24]" />
            </div>
          ) : reviews.length === 0 ? (
            <div
              className="text-center py-14"
              style={{
                background: colors.subtleBg,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: '4px',
              }}
            >
              <Star className="w-7 h-7 mx-auto mb-3 text-[#d6cfc2]" />
              <p className="text-[13px] font-medium text-[#4a453b]">
                No reviews yet for this vehicle.
              </p>
              <p className="text-[11px] text-[#8f8576] mt-1">
                Be the first to rent and share your rental experience!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.review_id}
                  className="p-5 border border-[#eae5db] bg-white rounded-md hover:border-[#d6cfc2] hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a1a1a]">
                        {rev.customer_name || `${rev.first_name || ''} ${rev.last_name || ''}`.trim() || 'Verified Renter'}
                      </p>
                      <p className="text-[11px] text-[#8f8576] mt-0.5">
                        {rev.created_at && new Date(rev.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= (rev.rating || 0) ? 'fill-[#c4b99a] text-[#c4b99a]' : 'fill-[#f5f2ee] text-[#d6cfc2]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-[13px] text-[#4a453b] leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarBooking;

