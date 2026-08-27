import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import { Loader, ArrowLeft, Calendar, ShieldCheck } from 'lucide-react';

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

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [gcashRef, setGcashRef] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    if (!user) {
      showNotification('Please log in to book a car', 'error');
      navigate('/login');
      return;
    }

    const fetchCar = async () => {
      try {
        const data = await serviceService.getById(id);
        if (!data || data.category !== 'car') throw new Error('Not found');
        setCar(data);
      } catch (error) {
        showNotification('Car not found', 'error');
        navigate('/car-rentals');
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id, user, navigate, showNotification]);

  const handleBookCar = async (e) => {
    e.preventDefault();
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
      navigate('/history');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to book car', 'error');
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
                  { label: 'Daily Rate:', value: `₱${Number(car.price).toLocaleString()}` }
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
                  <div>
                    <label
                      className="block text-[11px] font-medium mb-2"
                      style={{ color: colors.textSecondary, letterSpacing: '0.04em' }}
                    >
                      Pickup Date <span style={{ color: '#b83b3b' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
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
                      Return Date <span style={{ color: '#b83b3b' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                      style={inputStyle}
                      {...inputFocusHandlers}
                    />
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
      </div>
    </div>
  );
};

export default CarBooking;
