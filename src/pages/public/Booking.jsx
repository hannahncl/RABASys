import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { packageService } from '../services/packageService';
import { bookingService } from '../services/bookingService';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Calendar, Users, Mail, Phone, User, Landmark, ShieldCheck, Sparkles, Globe } from 'lucide-react';
import WeatherWidget from '../../components/feedback/WeatherWidget';
import { api } from '../../services/api';




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
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [firstName, setFirstName] = useState(stateData.firstName || (user?.name ? user.name.split(' ')[0] : ''));
  const [lastName, setLastName] = useState(stateData.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : ''));
  const [email, setEmail] = useState(stateData.email || user?.email || '');
  const [phone, setPhone] = useState(stateData.phone || '');
  const [tourDate, setTourDate] = useState(stateData.tourDate || '');
  const [adultsCount, setAdultsCount] = useState(stateData.adultsCount || 1);
  const [childrenCount, setChildrenCount] = useState(stateData.childrenCount || 0);

  // Tour Guide Selection
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [tourGuides, setTourGuides] = useState([]);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

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
      setLoading(false);
    };
    loadPkg();
  }, [packageId, navigate, showNotification]);

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

  const totalGuests = adultsCount + childrenCount;
  const totalPrice = pkg.price * totalGuests;

  const getPackageDurationInDays = () => {
    if (!pkg?.duration) return 1;
    const match = String(pkg.duration).match(/(\d+)\s*Day/i);
    return match ? parseInt(match[1], 10) : 1;
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
    if (!firstName || !lastName || !email || !phone || !tourDate || totalGuests === 0) {
      showNotification('Please fill in all booking fields.', 'warning');
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
      showNotification('Booking successfully submitted! A confirmation email has been dispatched.', 'success');
      navigate('/');
    } catch (error) {
      showNotification('Failed to save booking. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for rendering calendar days
  const renderCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ num: i, date: new Date(year, month, i) });
    }

    const numDays = getPackageDurationInDays();
    const selectedDate = tourDate ? new Date(`${tourDate}T00:00:00`) : null;
    let endDate = null;
    if (selectedDate && numDays > 1) {
      endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + (numDays - 1));
    }

    return days.map((day, i) => {
      if (day.empty) return <div key={`empty-${i}`}></div>;

      const currentDate = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
      const isSelected = selectedDate && currentDate.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
      const isEnd = endDate && currentDate.getTime() === new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
      const isInRange = selectedDate && endDate && currentDate >= new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) && currentDate <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      let dayStyle = {
        background: 'transparent',
        color: colors.textPrimary,
        borderRadius: '2px',
        cursor: 'pointer',
      };

      if (isSelected || isEnd) {
        dayStyle = {
          ...dayStyle,
          background: colors.accentDark,
          color: '#f7f4ef',
        };
      } else if (isInRange) {
        dayStyle = {
          ...dayStyle,
          background: 'rgba(176,166,142,0.15)',
          color: colors.textPrimary,
          border: `1px solid ${colors.border}`,
        };
      }

      return (
        <div
          key={i}
          onClick={() => handleDateSelect(day.date)}
          className="w-7 h-7 flex items-center justify-center text-xs font-semibold transition-all"
          style={dayStyle}
          onMouseEnter={(e) => {
            if (!isSelected && !isEnd) {
              e.currentTarget.style.background = 'rgba(176,166,142,0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected && !isEnd && !isInRange) {
              e.currentTarget.style.background = 'transparent';
            } else if (isInRange && !isSelected && !isEnd) {
              e.currentTarget.style.background = 'rgba(176,166,142,0.15)';
            }
          }}
        >
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
                    <SectionLabel>Please select a travel date</SectionLabel>
                    <div className="relative max-w-[320px]">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
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
                            <button
                              type="button"
                              onClick={() => {
                                const prevMonth = new Date(calendarDate);
                                prevMonth.setMonth(prevMonth.getMonth() - 1);
                                setCalendarDate(prevMonth);
                              }}
                              className="font-semibold px-2 py-1 transition-colors"
                              style={{ color: colors.textPrimary }}
                              onMouseEnter={(e) => (e.target.style.color = colors.accent)}
                              onMouseLeave={(e) => (e.target.style.color = colors.textPrimary)}
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
                  </div>

                  {/* Number of Pax */}
                  <div>
                    <SectionLabel>Number of pax</SectionLabel>
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
                            onClick={() => setAdultsCount(adultsCount + 1)}
                            className="w-6 h-6 flex items-center justify-center font-semibold transition-colors"
                            style={{ color: colors.textMuted }}
                            onMouseEnter={(e) => (e.target.style.color = colors.textPrimary)}
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
                            onClick={() => setChildrenCount(childrenCount + 1)}
                            className="w-6 h-6 flex items-center justify-center font-semibold transition-colors"
                            style={{ color: colors.textMuted }}
                            onMouseEnter={(e) => (e.target.style.color = colors.textPrimary)}
                            onMouseLeave={(e) => (e.target.style.color = colors.textMuted)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
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
                            onChange={(e) => setFirstName(e.target.value)}
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
                            onChange={(e) => setLastName(e.target.value)}
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
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                          style={inputStyle}
                          {...inputFocusHandlers}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tour Guide Selection (Only for Tour Packages) */}
                  {packageId !== 'custom' && (
                    <div>
                      <SectionLabel>Select a Tour Guide (Optional)</SectionLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tourGuides.map(guide => (
                          <div
                            key={guide.id}
                            onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                            className="p-4 cursor-pointer transition-all duration-300"
                            style={{
                              border: selectedGuide === guide.id
                                ? `1px solid ${colors.accentDark}`
                                : `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              background: selectedGuide === guide.id
                                ? 'rgba(45,42,36,0.03)'
                                : colors.bg,
                            }}
                            onMouseEnter={(e) => {
                              if (selectedGuide !== guide.id) {
                                e.currentTarget.style.borderColor = colors.accent;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedGuide !== guide.id) {
                                e.currentTarget.style.borderColor = colors.border;
                              }
                            }}
                          >
                            <div className="flex gap-4">
                              <div
                                className="w-12 h-12 shrink-0 flex items-center justify-center text-[13px] font-bold"
                                style={{
                                  borderRadius: '2px',
                                  background: '#e8e3da',
                                  color: '#4a453b',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {(guide.firstName?.[0] || guide.name?.[0] || 'T').toUpperCase()}
                                {(guide.lastName?.[0] || guide.name?.split(' ')[1]?.[0] || 'G').toUpperCase()}
                              </div>
                              <div>
                                <h4
                                  className="font-semibold text-[13px]"
                                  style={{ color: colors.textPrimary }}
                                >
                                  {guide.name}
                                </h4>
                                <p
                                  className="text-[11px] mt-1 leading-relaxed"
                                  style={{ color: colors.textSecondary }}
                                >
                                  {guide.description || 'Professional local tour guide.'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Globe className="w-3 h-3" style={{ color: colors.accent }} />
                                  <span
                                    className="text-[10px] font-medium"
                                    style={{ color: colors.textMuted }}
                                  >
                                    {guide.languageSpoken || (guide.languages && guide.languages.join(', ')) || 'English, Tagalog'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                    <span className="text-[11px] font-semibold" style={{ color: colors.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</span>
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
              <WeatherWidget
                destination={pkg.destination || pkg.meetingLocation || pkg.title || 'Legazpi, Albay'}
                tourDate={tourDate}
                durationDays={getPackageDurationInDays()}
                theme="light"
              />
            </div>
          </div>


        </div>
      </div>

    </div>
  );
};

export default Booking;
