import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { bookingService } from '../../services/bookingService';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import GCashModal from '../../components/payment/GCashModal';
import { ArrowLeft, Calendar, Users, Mail, Phone, User, Landmark, ShieldCheck, Sparkles } from 'lucide-react';

const Booking = () => {
  const { packageId } = useParams();
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [tourDate, setTourDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  
  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  }, [packageId]);

  if (loading || !pkg) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  const totalPrice = pkg.price * guestsCount;

  const handleOpenPayment = (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !tourDate || !guestsCount) {
      showNotification('Please fill in all booking fields.', 'warning');
      return;
    }
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (referenceNumber, gcashNumber) => {
    setPaymentModalOpen(false);
    setSubmitting(true);
    
    try {
      const bookingData = {
        packageId: pkg.id,
        packageName: pkg.title,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        tourDate,
        guestsCount: Number(guestsCount),
        totalPrice,
        paymentMethod: 'GCash',
        paymentRef: referenceNumber,
        gcashNumber
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Back button */}
      <Link to={`/packages/${pkg.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to {pkg.title}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols - Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 md:p-8 rounded-2xl border-slate-800 space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-slate-100">Booking Details</h2>
              <p className="text-slate-400 text-xs">Fill in your contact information and select dates.</p>
            </div>

            <form onSubmit={handleOpenPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Juan Dela Cruz"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. juan@example.com"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +639171234567"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Target Date of Tour</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={tourDate}
                      onChange={(e) => setTourDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Guests Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Number of Guests</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold font-display rounded-xl text-center shadow-lg active:scale-[0.98] transition-all cursor-pointer block disabled:opacity-50"
                >
                  {submitting ? 'Creating booking records...' : 'Proceed to GCash Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col - Checkout breakdown card */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
            <h3 className="font-bold text-slate-200 font-display border-b border-slate-900 pb-3">Booking Review</h3>
            
            <div className="flex items-start gap-3">
              <img 
                src={pkg.image} 
                alt={pkg.title} 
                className="h-16 w-16 object-cover rounded-xl border border-slate-850"
              />
              <div>
                <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{pkg.title}</h4>
                <p className="text-xs text-cyan-400">{pkg.duration}</p>
                <p className="text-[10px] text-slate-500">{pkg.destination}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-slate-900 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Rate (per person)</span>
                <span className="font-semibold text-slate-200">PHP {pkg.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Total Guests</span>
                <span className="font-semibold text-slate-200">x{guestsCount}</span>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-3 text-base">
                <span className="font-bold text-slate-200 font-display">Total Amount</span>
                <span className="font-extrabold text-cyan-400 font-display">PHP {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-slate-200 uppercase">Payment Protection</span>
              </div>
              <p className="leading-relaxed">This GCash integration processes mock checkout details under sandbox conditions. No real money will be charged.</p>
            </div>
          </div>
        </div>
      </div>

      {/* GCash Simulator Overlay */}
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
