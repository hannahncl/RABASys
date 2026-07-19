import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { packageService } from '../services/packageService';
import { bookingService } from '../services/bookingService';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { ArrowLeft, Calendar, Users, Mail, Phone, User, Landmark, ShieldCheck, Sparkles, Globe } from 'lucide-react';

const TOUR_GUIDES = [
  {
    id: 1,
    name: 'Ms. Anne',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    description: 'Expert in Bicol history and cultural heritage with 5+ years of guiding experience.',
    languages: ['English', 'Tagalog', 'Bicolano']
  },
  {
    id: 2,
    name: 'Mr. Mark',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    description: 'Adventure specialist, perfect for eco-tours and extreme activities.',
    languages: ['English', 'Tagalog']
  }
];

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
      <div className="flex min-h-screen items-center justify-center bg-white text-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
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

      let bgClass = 'bg-transparent text-black hover:bg-slate-100 cursor-pointer';
      if (isSelected || isEnd) {
        bgClass = 'bg-yellow-400 text-yellow-900 cursor-pointer';
      } else if (isInRange) {
        bgClass = 'bg-yellow-50 ring-1 ring-yellow-200 text-yellow-750 cursor-pointer';
      }

      return (
        <div 
          key={i} 
          onClick={() => handleDateSelect(day.date)}
          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ${bgClass}`}
        >
          {day.num}
        </div>
      );
    });
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-24 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stepper */}
        <div className="flex items-center justify-between mb-16 relative w-full max-w-4xl mx-auto px-8">
          {/* Connecting Lines */}
          <div className="absolute top-4 left-16 right-1/2 h-px bg-slate-400 -z-10"></div>
          <div className={`absolute top-4 left-1/2 right-16 h-px -z-10 ${currentStep === 2 ? 'bg-slate-400' : 'bg-slate-200'}`}></div>

          {/* Step 1: Choose Booking */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-50 border border-yellow-250 flex items-center justify-center text-yellow-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span className="text-sm font-medium text-black">Choose Booking</span>
          </div>

          {/* Step 2: Enter Info */}
          <div className="flex flex-col items-center gap-2">
            {currentStep === 1 ? (
              <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-black shadow-sm">
                <span className="leading-none mb-2 font-bold tracking-widest text-lg">...</span>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-yellow-50 border border-yellow-250 flex items-center justify-center text-yellow-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            )}
            <span className="text-sm font-medium text-black">Enter Info</span>
          </div>

          {/* Step 3: Payment */}
          <div className="flex flex-col items-center gap-2">
            {currentStep === 1 ? (
              <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center"></div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-black shadow-sm">
                <span className="leading-none mb-2 font-bold tracking-widest text-lg">...</span>
              </div>
            )}
            <span className="text-sm font-medium text-black">Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column - Form */}
          <div className="lg:col-span-7">
            {currentStep === 1 ? (
              // STEP 1: Enter Info UI
              <>
                <h2 className="text-xl font-bold text-black mb-8">Select Options</h2>
                <form id="booking-form" onSubmit={handleProceedToPayment} className="space-y-10">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Please select a travel date</label>
                    <div className="relative max-w-[320px]">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`w-full border rounded-lg py-3 px-4 flex items-center justify-between text-[15px] transition-all bg-white border-gray-200 text-gray-900 focus:outline-none ${showDatePicker ? 'border-gray-300 shadow-sm' : ''}`}
                      >
                        <span className="flex items-center">
                           {tourDate && !showDatePicker ? new Date(tourDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Check Availability'}
                        </span>
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </button>
                      
                      {/* Custom Date Picker Popover */}
                      {showDatePicker && (
                        <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-5 w-[320px] z-50">
                          
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4 px-2">
                            <button 
                              type="button" 
                              onClick={() => {
                                const prevMonth = new Date(calendarDate);
                                prevMonth.setMonth(prevMonth.getMonth() - 1);
                                setCalendarDate(prevMonth);
                              }}
                              className="text-black hover:text-yellow-500 font-bold px-2 py-1"
                            >
                              &lt;
                            </button>
                            <span className="text-[13px] font-bold text-black">
                              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const nextMonth = new Date(calendarDate);
                                nextMonth.setMonth(nextMonth.getMonth() + 1);
                                setCalendarDate(nextMonth);
                              }}
                              className="text-black hover:text-yellow-500 font-bold px-2 py-1"
                            >
                              &gt;
                            </button>
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-y-3 mb-6 justify-items-center">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-[10px] font-bold text-black">{day}</div>
                            ))}
                            {renderCalendarDays()}
                          </div>

                          {/* Footer Buttons */}
                          <div className="flex justify-between items-center px-1">
                            <button 
                              type="button" 
                              onClick={() => setShowDatePicker(false)}
                              className="px-6 py-1.5 rounded-full border border-slate-300 text-[11px] font-bold text-black hover:bg-slate-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setShowDatePicker(false)}
                              className="px-6 py-1.5 rounded-full bg-yellow-50 hover:bg-yellow-100 border border-yellow-250 text-[11px] font-bold text-yellow-800 transition-colors cursor-pointer"
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
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Number of pax</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Adult */}
                      <div className="flex items-center justify-between border border-gray-200 rounded-lg py-3 px-4 bg-white">
                        <span className="text-[15px] font-medium text-gray-900">Adult</span>
                        <div className="flex items-center gap-4">
                          <button 
                            type="button" 
                            onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold"
                          >
                            -
                          </button>
                          <span className="text-[15px] font-bold w-4 text-center">{adultsCount}</span>
                          <button 
                            type="button" 
                            onClick={() => setAdultsCount(adultsCount + 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Child */}
                      <div className="flex items-center justify-between border border-gray-200 rounded-lg py-3 px-4 bg-white">
                        <span className="text-[15px] font-medium text-gray-900">Child (6-10)</span>
                        <div className="flex items-center gap-4">
                          <button 
                            type="button" 
                            onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold"
                          >
                            -
                          </button>
                          <span className="text-[15px] font-bold w-4 text-center">{childrenCount}</span>
                          <button 
                            type="button" 
                            onClick={() => setChildrenCount(childrenCount + 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-4">Contact Information</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-2">First Name</label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all capitalize"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-2">Last Name</label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all capitalize"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Contact Number</label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tour Guide Selection (Only for Tour Packages) */}
                  {packageId !== 'custom' && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-4">Select a Tour Guide (Optional)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {TOUR_GUIDES.map(guide => (
                          <div 
                            key={guide.id}
                            onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                            className={`border rounded-xl p-4 cursor-pointer transition-all ${
                              selectedGuide === guide.id 
                                ? 'border-yellow-500 bg-yellow-50 shadow-sm ring-1 ring-yellow-500' 
                                : 'border-gray-200 bg-white hover:border-yellow-300'
                            }`}
                          >
                            <div className="flex gap-4">
                              <img src={guide.image} alt={guide.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                              <div>
                                <h4 className="font-bold text-gray-900 text-[15px]">{guide.name}</h4>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{guide.description}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-[10px] text-gray-500 font-medium">{guide.languages.join(', ')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 text-[10px] text-black font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>Once your info is submitted, it cannot be changed. Please double-check before proceeding.</p>
                  </div>

                </form>
              </>
            ) : (
              // STEP 2: Payment UI
              <>
                <h2 className="text-[17px] font-extrabold text-black mb-8">Complete Payment</h2>
                <form id="payment-form" onSubmit={handleFinalSubmit} className="space-y-6">
                  
                  {/* GCash Option */}
                  <label className="flex items-center gap-4 cursor-pointer py-2">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${paymentMethod === 'gcash' ? 'border-yellow-400' : 'border-slate-300'}`}>
                      {paymentMethod === 'gcash' && <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>}
                    </div>
                    <span className="text-sm font-semibold text-black">GCash</span>
                    <input type="radio" className="hidden" checked={paymentMethod === 'gcash'} onChange={() => setPaymentMethod('gcash')} />
                  </label>

                  {/* GCash Reference Number Input */}
                  {paymentMethod === 'gcash' && (
                    <div className="bg-[#F8F9FA] rounded-xl p-6 space-y-3">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Please send your payment via GCash and enter the reference number below. Our admin will verify your payment.
                      </p>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">GCash Reference Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 1234 5678 9012"
                          value={gcashRef}
                          onChange={(e) => setGcashRef(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-slate-100 my-4 w-full"></div>
                  
                  {/* Credit/Debit Option */}
                  <label className="flex items-center justify-between cursor-pointer py-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'border-yellow-400' : 'border-slate-300'}`}>
                        {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>}
                      </div>
                      <span className="text-sm font-semibold text-black">Credit/ Debit Card</span>
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
                    <div className="bg-[#F8F9FA] rounded-xl p-6 mt-6 space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Card number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-[260px] bg-white border border-gray-200 rounded-lg py-3 px-4 text-gray-900 text-[15px] focus:outline-none transition-all"
                        />
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-2">Expiration date</label>
                          <input
                            type="text"
                            placeholder="MM/YYYY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-[180px] bg-white border border-gray-200 rounded-lg py-3 px-4 text-gray-900 text-[15px] focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-2">Security Code</label>
                          <input
                            type="text"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            className="w-[180px] bg-white border border-gray-200 rounded-lg py-3 px-4 text-gray-900 text-[15px] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 pt-2 cursor-pointer">
                        <input type="checkbox" className="w-3.5 h-3.5 border-slate-300 rounded text-yellow-400 focus:ring-yellow-400" />
                        <span className="text-[11px] font-medium text-black">Save card details</span>
                      </label>
                    </div>
                  )}

                  {/* Final T&C and Submit */}
                  <div className="flex items-center justify-between pt-12">
                    <label className="flex items-start gap-2 cursor-pointer max-w-[280px]">
                      <input type="checkbox" className="w-3 h-3 mt-0.5 border-slate-300 rounded text-yellow-400 focus:ring-yellow-400" />
                      <span className="text-[9px] text-black leading-tight">
                        By continuing, you acknowledge and agree to <span className="underline cursor-pointer">General Terms of Use</span> and <span className="underline cursor-pointer">Privacy Policy</span>
                      </span>
                    </label>
                    
                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2.5 px-8 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold rounded-full text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Processing...' : 'Proceed to Pay'}
                    </button>
                  </div>

                </form>
              </>
            )}
          </div>

          {/* Right Column - Booking Details Card */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white border border-slate-200 shadow-xl rounded-sm p-6 sticky top-24">
              <h3 className="font-extrabold text-black border-b border-slate-200 pb-4 mb-4">Booking Details</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-bold text-black text-lg">{pkg.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-black font-medium mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Strictly No Cancellation
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="flex justify-between text-xs font-semibold text-black">
                    <span>Date</span>
                    <span className="text-black">{tourDate ? new Date(tourDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-black">
                    <span>Quantity</span>
                    <span className="text-black">
                      {adultsCount > 0 && `Adult x ${adultsCount}`}
                      {adultsCount > 0 && childrenCount > 0 && ', '}
                      {childrenCount > 0 && `Child x ${childrenCount}`}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs font-semibold text-black">
                  <span>Total</span>
                  <span className="text-base font-black text-black">₱{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {currentStep === 1 && (
                <button
                  type="submit"
                  form="booking-form"
                  disabled={submitting}
                  className="w-full py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold rounded-xl text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all disabled:opacity-50 text-sm mt-8 cursor-pointer"
                >
                  Proceed to Pay
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Booking;
