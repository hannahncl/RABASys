import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { bookingService } from '../../services/bookingService';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import GCashModal from '../../components/payment/GCashModal';
import { ArrowLeft, Calendar, Users, Mail, Phone, User, Landmark, ShieldCheck, Sparkles, Clock } from 'lucide-react';

const Booking = () => {
  const { packageId } = useParams();
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [firstName, setFirstName] = useState(user?.name ? user.name.split(' ')[0] : '');
  const [lastName, setLastName] = useState(user?.name ? user.name.split(' ').slice(1).join(' ') : '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [tourDate, setTourDate] = useState('');
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  
  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('10:30 am');
  const [calendarDate, setCalendarDate] = useState(new Date(2022, 0, 1)); // January 2022 to match mockup
  
  // Step & Payment State
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Credit Card Form State (mock)
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    const loadPkg = async () => {
      setLoading(true);
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
      setPaymentModalOpen(true);
    } else {
      if (!cardNumber || !expiryDate || !cvv) {
        showNotification('Please fill in card details.', 'warning');
        return;
      }
      // Mock card success
      handlePaymentSuccess('CARD-' + Math.random().toString(36).substr(2, 9).toUpperCase(), 'CARD');
    }
  }

  const handlePaymentSuccess = async (referenceNumber, gcashNumber) => {
    setPaymentModalOpen(false);
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
        gcashNumber: paymentMethod === 'gcash' ? gcashNumber : 'N/A'
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

  // Helper for rendering mockup calendar days
  const renderCalendarDays = () => {
    const days = [
      { num: 26, color: 'text-black' }, { num: 27, color: 'text-black' }, { num: 28, color: 'text-black' }, { num: 29, color: 'text-black' }, { num: 30, color: 'text-black' }, { num: 31, color: 'text-black' }, { num: '01', color: 'text-black' },
      { num: 2, color: 'text-black' }, { num: 3, color: 'text-black' }, { num: 4, color: 'text-black' }, { num: 5, color: 'text-black' }, { num: 6, bg: 'bg-slate-400', color: 'text-white' }, { num: 7, color: 'text-black' }, { num: 8, color: 'text-black' },
      { num: 9, color: 'text-black' }, { num: 10, color: 'text-black' }, { num: 11, color: 'text-black' }, { num: 12, color: 'text-black' }, { num: 13, color: 'text-black' }, { num: 14, color: 'text-black' }, { num: 15, color: 'text-black' },
      { num: 16, color: 'text-black' }, { num: 17, color: 'text-black' }, { num: 18, color: 'text-black' }, { num: 19, bg: 'bg-yellow-400', color: 'text-white' }, { num: 20, color: 'text-yellow-400' }, { num: 21, color: 'text-yellow-400' }, { num: 22, bg: 'bg-yellow-400', color: 'text-white' },
      { num: 23, color: 'text-black' }, { num: 24, color: 'text-black' }, { num: 25, color: 'text-black' }, { num: 26, color: 'text-black' }, { num: 27, color: 'text-black' }, { num: 28, color: 'text-black' }, { num: 29, color: 'text-black' },
      { num: 31, color: 'text-black' }, { num: 1, color: 'text-black' }, { num: 2, color: 'text-black' }, { num: 3, color: 'text-black' }, { num: 4, color: 'text-black' }, { num: 5, color: 'text-black' }, { num: 6, color: 'text-black' }
    ];

    return days.map((day, i) => (
      <div 
        key={i} 
        onClick={() => {
          if (typeof day.num === 'number' && day.color !== 'text-black') {
            setTourDate(`2022-01-${day.num.toString().padStart(2, '0')}`);
          }
        }}
        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold cursor-pointer ${day.bg || 'bg-transparent'} ${day.color || 'text-black'} ${day.color === 'text-black' ? 'cursor-default' : 'hover:bg-slate-100'}`}
      >
        {day.num}
      </div>
    ));
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
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white shadow-sm">
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
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white shadow-sm">
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
                    <label className="block text-sm text-black mb-3">Please select a travel date</label>
                    <div className="relative max-w-[280px]">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`w-full border rounded-xl py-3 px-4 flex items-center justify-center text-sm font-bold shadow-sm transition-all ${showDatePicker ? 'bg-[#FFE053] border-[#FFE053] text-[#3b3a36]' : 'bg-white border-slate-200 hover:border-slate-300 text-black'}`}
                      >
                        {!showDatePicker && <Calendar className="h-4 w-4 mr-2" />}
                        {tourDate && !showDatePicker ? new Date(tourDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Check Availability'}
                      </button>
                      
                      {/* Custom Date Picker Popover */}
                      {showDatePicker && (
                        <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-5 w-[320px] z-50">
                          
                          {/* Time Section */}
                          <div className="mb-4">
                            <h4 className="text-[11px] font-bold text-black mb-2">Time</h4>
                            <div className="flex gap-2">
                              <button 
                                type="button" 
                                onClick={() => setSelectedTime('10:30 am')}
                                className={`flex-1 py-1.5 rounded-full flex items-center justify-center gap-2 text-[10px] font-bold transition-all border ${selectedTime === '10:30 am' ? 'bg-[#FFE053] border-[#FFE053] text-[#3b3a36]' : 'bg-white border-slate-200 text-black hover:bg-slate-50'}`}
                              >
                                <Clock className="w-3 h-3" /> 10 : 30 am
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setSelectedTime('05:30 pm')}
                                className={`flex-1 py-1.5 rounded-full flex items-center justify-center gap-2 text-[10px] font-bold transition-all border ${selectedTime === '05:30 pm' ? 'bg-[#FFE053] border-[#FFE053] text-[#3b3a36]' : 'bg-white border-slate-200 text-black hover:bg-slate-50'}`}
                              >
                                <Clock className="w-3 h-3" /> 05 : 30 pm
                              </button>
                            </div>
                          </div>

                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4 px-2">
                            <button type="button" className="text-black hover:text-yellow-500 font-bold px-2 py-1">&lt;</button>
                            <span className="text-[13px] font-bold text-black">January 2022</span>
                            <button type="button" className="text-black hover:text-yellow-500 font-bold px-2 py-1">&gt;</button>
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
                              className="px-6 py-1.5 rounded-full bg-[#FFE053] hover:bg-[#F2D340] text-[11px] font-bold text-[#3b3a36] transition-colors"
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
                    <h3 className="text-sm font-semibold text-black mb-3">Number of pax</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Adult */}
                      <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3">
                        <span className="text-sm font-bold text-black">Adult</span>
                        <div className="flex items-center gap-4">
                          <button 
                            type="button" 
                            onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                            className="w-6 h-6 flex items-center justify-center text-black hover:text-black font-bold"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{adultsCount}</span>
                          <button 
                            type="button" 
                            onClick={() => setAdultsCount(adultsCount + 1)}
                            className="w-6 h-6 flex items-center justify-center text-black hover:text-black font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Child */}
                      <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3">
                        <span className="text-sm font-bold text-black">Child (6-10)</span>
                        <div className="flex items-center gap-4">
                          <button 
                            type="button" 
                            onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                            className="w-6 h-6 flex items-center justify-center text-black hover:text-black font-bold"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{childrenCount}</span>
                          <button 
                            type="button" 
                            onClick={() => setChildrenCount(childrenCount + 1)}
                            className="w-6 h-6 flex items-center justify-center text-black hover:text-black font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-black mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-black mb-1.5">First Name</label>
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="e.g. John"
                            className="w-full bg-white border border-slate-300 focus:border-yellow-400 rounded-lg py-2.5 px-3 text-black text-sm focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-black mb-1.5">Last Name</label>
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="e.g. John"
                            className="w-full bg-white border border-slate-300 focus:border-yellow-400 rounded-lg py-2.5 px-3 text-black text-sm focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1.5">Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. abc@gmail.com"
                          className="w-full bg-white border border-slate-300 focus:border-yellow-400 rounded-lg py-2.5 px-3 text-black text-sm focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-1.5">Contact Number</label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 09123456789"
                          className="w-full bg-white border border-slate-300 focus:border-yellow-400 rounded-lg py-2.5 px-3 text-black text-sm focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

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
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${paymentMethod === 'gcash' ? 'border-[#E6D41A]' : 'border-slate-300'}`}>
                      {paymentMethod === 'gcash' && <div className="w-2.5 h-2.5 bg-[#E6D41A] rounded-full"></div>}
                    </div>
                    <span className="text-sm font-semibold text-black">GCash</span>
                    <input type="radio" className="hidden" checked={paymentMethod === 'gcash'} onChange={() => setPaymentMethod('gcash')} />
                  </label>

                  <div className="h-px bg-slate-100 my-4 w-full"></div>
                  
                  {/* Credit/Debit Option */}
                  <label className="flex items-center justify-between cursor-pointer py-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'border-[#E6D41A]' : 'border-slate-300'}`}>
                        {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-[#E6D41A] rounded-full"></div>}
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
                        <label className="block text-xs font-medium text-black mb-1.5">Card number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-[260px] bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-black text-sm focus:border-yellow-400 focus:outline-none transition-all"
                        />
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1.5">Expiration date</label>
                          <input
                            type="text"
                            placeholder="MM/YYYY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-[180px] bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-black text-sm focus:border-yellow-400 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1.5">Security Code</label>
                          <input
                            type="text"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            className="w-[180px] bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-black text-sm focus:border-yellow-400 focus:outline-none transition-all"
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
                      className="py-2.5 px-8 bg-[#E6D41A] hover:bg-[#D4C318] text-white font-bold rounded-full text-sm shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
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
                  className="w-full py-3.5 bg-[#E6D41A] hover:bg-[#D4C318] text-white font-bold rounded-xl text-center shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 text-sm mt-8"
                >
                  Proceed to Pay
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <GCashModal
        isOpen={paymentModalOpen}
        amount={totalPrice}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Booking;
