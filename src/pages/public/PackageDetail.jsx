import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { bookingService } from '../../services/bookingService';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import WeatherWidget from '../../components/feedback/WeatherWidget';
import GCashModal from '../../components/payment/GCashModal';
import { Compass, MapPin, Star, Calendar, Clock, Award, ShieldCheck, ArrowLeft, CheckCircle2, User, Mail, Phone, Users } from 'lucide-react';

const PackageDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [tourDate, setTourDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  
  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const data = await packageService.getById(id);
      setPkg(data);
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
      }
      setLoading(false);
    };
    loadDetails();
  }, [id, user]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookClick = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/packages/${id}` } } });
    } else {
      setShowForm(true);
    }
  };

  const totalPrice = pkg ? pkg.price * guestsCount : 0;

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
          <p className="text-sm text-black font-medium">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 bg-white min-h-screen">
        <h2 className="text-2xl font-bold text-black font-display">Package Not Found</h2>
        <p className="text-black text-sm">We couldn't retrieve details for this specific package.</p>
        <Link to="/packages" className="inline-block px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-sm font-semibold">
          Back to Tour Packages
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Tabs */}
            <div className="flex gap-8 text-sm font-semibold text-black pb-[11px]">
              <button onClick={() => scrollToSection('overview')} className="text-black border-b-2 border-yellow-400 pb-[9px] -mb-[12px]">Overview</button>
              <button onClick={() => scrollToSection('package-details')} className="hover:text-black transition-colors pb-[9px]">Package Details</button>
              <button onClick={() => scrollToSection('reviews')} className="hover:text-black transition-colors pb-[9px]">Reviews</button>
            </div>

            {/* Banner Image */}
            <div id="overview" className="w-full h-[400px] rounded-xl overflow-hidden shadow-sm scroll-mt-6">
              <img 
                src={pkg.image} 
                alt={pkg.title} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Package Details Heading */}
            <div id="package-details" className="flex items-center gap-3 scroll-mt-6">
              <div className="w-6 h-1.5 bg-yellow-400"></div>
              <h2 className="text-xl font-extrabold text-black">Package Details</h2>
            </div>

            {/* Tour Itinerary */}
            <div className="space-y-6">
              <h3 className="text-[15px] font-semibold text-black">Tour Itinerary</h3>
              <div className="space-y-8 pl-1">
                {pkg.itinerary.map((day, index) => (
                  <div key={day.day} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold z-10 shrink-0">
                        {index + 1}
                      </div>
                      {index !== pkg.itinerary.length - 1 && (
                        <div className="w-px h-full bg-slate-200 mt-2"></div>
                      )}
                    </div>
                    <div className="pb-2">
                      <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-2 mt-0.5">DAY {day.day}</h4>
                      <p className="text-xs text-black font-medium leading-relaxed mb-3">
                        {day.title}
                      </p>
                      <p className="text-xs text-black font-medium leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-black">
                        {day.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions */}
            <div className="space-y-4">
              <h3 className="text-[15px] font-semibold text-black">Inclusions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-xs text-black font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-black" /> Admission to attractions</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-black" /> Environmental fees</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-black" /> English / Filipino-speaking guide</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-black" /> Tour guide fee</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-black" /> Lunch and Dinner</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-black" /> Private air-conditioned room</div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[15px] font-semibold text-black">Terms & Conditions</h3>
              <div className="space-y-4 text-xs text-black font-medium">
                <div>
                  <p className="text-black mb-1.5">Confirmation</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You'll get confirmation within minutes. If you don't see any confirmation, reach out to our customer support.</li>
                  </ul>
                </div>
                <div>
                  <p className="text-black mb-1.5">Cancellation</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>No cancellation policy, only rescheduling is allowed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reviews Heading */}
            <div id="reviews" className="flex items-center gap-3 pt-8 scroll-mt-6">
              <div className="w-6 h-1.5 bg-yellow-400"></div>
              <h2 className="text-xl font-extrabold text-black">Reviews</h2>
            </div>
            
            {/* Mocked Reviews Summary */}
            <div className="space-y-6">
              <div className="flex items-end gap-3">
                <div className="text-2xl font-extrabold text-yellow-500 leading-none">4.1 / 5</div>
                <div className="text-xs text-black font-medium mb-0.5">
                  <span className="block text-black">Good</span>
                  (125 Reviews)
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-black">
                <span>Filter by:</span>
                <button className="px-4 py-1.5 border border-slate-200 rounded-full text-black hover:text-black">All</button>
                <button className="px-4 py-1.5 border border-slate-200 rounded-full text-black hover:text-black">With Pictures</button>
              </div>
              
              <div className="flex items-center justify-between text-xs font-bold text-black">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  5.0 Reviews (125)
                </div>
                <button className="text-[10px] text-black font-semibold hover:text-black">View All</button>
              </div>

              {/* Review Items */}
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0"></div>
                        <span className="text-xs font-bold text-black">Luke</span>
                      </div>
                      <span className="text-[10px] text-black font-medium">Today</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 text-yellow-400 fill-current" />)}
                    </div>
                    <p className="text-[10px] text-black font-medium leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h1 className="text-2xl font-extrabold text-black uppercase tracking-tight mb-4">
                {pkg.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-black font-semibold mb-6">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {pkg.duration}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {pkg.destination}</span>
              </div>
              
              <p className="text-xs text-black font-medium leading-relaxed mb-6">
                {pkg.description}
              </p>
              
              <div className="space-y-3 text-[11px] text-black font-semibold mb-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-black" /> Secure Payments
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-black" /> Flexible Dates & Rescheduling
                </div>
              </div>
              
              <div className="text-3xl font-black text-black mb-6">
                ₱{pkg.price.toLocaleString()}
              </div>
              
              {/* Booking Button */}
              <button 
                onClick={() => navigate(`/booking/${pkg.id}`)} 
                className="w-full py-3.5 bg-[#FFE053] hover:bg-[#F2D340] text-[#3b3a36] font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Book This Package
              </button>
            </div>

            {/* Map Placeholder */}
            <div className="w-full h-64 bg-cyan-50 rounded-[20px] overflow-hidden relative shadow-sm border border-slate-100">
              {/* Mock map background image */}
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" alt="Map View" className="w-full h-full object-cover opacity-20 mix-blend-multiply" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-black bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    <MapPin className="w-3 h-3 text-yellow-400" /> Map View Available Soon
                 </div>
              </div>
            </div>

            {/* Pick-up Info */}
            <div className="space-y-5">
              <h3 className="text-xs font-semibold text-black">Pick-up & meet-up information</h3>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-black mb-3 pl-[30px]">Departure</p>
                  <div className="flex items-start gap-3.5 text-[11px] text-black font-medium">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-black" />
                    <div>
                      <p className="font-bold text-black text-xs mb-0.5">08:30 am</p>
                      <p>RABAS Travel and Tours Office</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5 text-[11px] text-black font-medium mt-3.5">
                    <div className="w-4 h-4 shrink-0 mt-0.5 border-2 border-slate-400 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                    <p>Please arrive at the location 15 mins before the departure time</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-black mb-3 pl-[30px]">Return</p>
                  <div className="flex items-start gap-3.5 text-[11px] text-black font-medium">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-black" />
                    <div>
                      <p className="font-bold text-black text-xs mb-0.5">09:30 am</p>
                      <p>RABAS Travel and Tours Office</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* GCash Simulator Overlay */}
      <GCashModal
        isOpen={paymentModalOpen}
        amount={pkg ? pkg.price * guestsCount : 0}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default PackageDetail;
