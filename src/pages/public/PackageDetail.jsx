import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { bookingService } from '../../services/bookingService';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import WeatherWidget from '../../components/feedback/WeatherWidget';
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

  const parseItinerary = (data) => {
    if (!data) return [];
    if (typeof data === 'string') {
      return data.split('\n').filter(line => line.trim()).map(line => typeof line === 'string' ? line : String(line));
    }
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item.title) return item.title;
        if (typeof item === 'object' && item.desc) return item.desc;
        return String(item);
      });
    }
    return [];
  };

  const parseInclusions = (data) => {
    if (!data) return [];
    if (typeof data === 'string') {
      return data.split('\n').filter(line => line.trim()).map(line => typeof line === 'string' ? line : String(line));
    }
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item;
        return String(item);
      });
    }
    return [];
  };

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

  const handlePaymentSuccess = async (referenceNumber) => {
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
        gcashNumber: 'N/A'
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
        <Link to="/packages" className="inline-block px-5 py-2.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 rounded-xl text-sm font-semibold transition-all cursor-pointer">
          Back to Tour Packages
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-black font-sans pb-24">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Package Image */}
            <div className="w-full h-[320px] rounded-lg bg-slate-50 relative overflow-hidden">
              <img 
                src={pkg.image || '/CAGSAWA.jpg'} 
                alt={pkg.title} 
                className="min-h-full min-w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/CAGSAWA.jpg';
                }}
              />
            </div>

            {/* Tabs Navigation - Minimalist */}
            <div className="flex gap-12 border-b border-slate-200 pb-6">
              <button onClick={() => scrollToSection('overview')} className="text-sm font-medium text-black border-b-2 border-black pb-6 -mb-6">Overview</button>
              <button onClick={() => scrollToSection('itinerary')} className="text-sm font-medium text-slate-400 hover:text-black transition-colors">Itinerary</button>
              <button onClick={() => scrollToSection('inclusions')} className="text-sm font-medium text-slate-400 hover:text-black transition-colors">Inclusions</button>
            </div>

            {/* Overview Section */}
            <div id="overview" className="space-y-8 scroll-mt-6">
              <p className="text-base text-slate-700 leading-relaxed">
                {pkg.description}
              </p>
              
              {/* Key Details - Clean Grid */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-slate-500 mb-2">Duration</p>
                  <p className="text-sm font-medium text-black">{pkg.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Group Size</p>
                  <p className="text-sm font-medium text-black">Up to {pkg.maximumCapacity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Destination</p>
                  <p className="text-sm font-medium text-black">{pkg.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">Meeting Point</p>
                  <p className="text-sm font-medium text-black">{pkg.meetingLocation || 'TBA'}</p>
                </div>
              </div>
            </div>

            {/* Itinerary Section */}
            <div id="itinerary" className="space-y-8 scroll-mt-6 pt-12 border-t border-slate-100">
              <h2 className="text-lg font-medium text-black">Tour Itinerary</h2>
              
              <div className="space-y-6">
                {parseItinerary(pkg.itinerary).map((line, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-slate-300 text-black flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      {index < (parseItinerary(pkg.itinerary).length - 1) && (
                        <div className="w-px h-14 bg-slate-200 mt-1"></div>
                      )}
                    </div>
                    <div className="pt-1 pb-2">
                      <p className="text-sm text-slate-700 leading-relaxed">{line}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions Section */}
            <div id="inclusions" className="space-y-8 scroll-mt-6 pt-12 border-t border-slate-100">
              <h2 className="text-lg font-medium text-black">What's Included</h2>
              
              <div className="space-y-3">
                {parseInclusions(pkg.inclusions).map((inclusion, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-700">{inclusion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-6 pt-12 border-t border-slate-100">
              <h2 className="text-lg font-medium text-black">Terms & Conditions</h2>
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <p className="font-medium text-black mb-2">Confirmation</p>
                  <p>You'll receive confirmation within minutes. If you don't see confirmation, contact our customer support.</p>
                </div>
                <div>
                  <p className="font-medium text-black mb-2">Cancellation & Rescheduling</p>
                  <p>No cancellation policy - only rescheduling is allowed based on availability.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Sidebar) - Sticky & Compact Monochrome */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-6">
              
              {/* Booking Card - Compact */}
              <div className="max-w-sm rounded-3xl border border-slate-300 bg-white p-5 shadow-sm text-black">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{pkg.destination || 'Tour Package'}</p>
                    <h1 className="mt-2 text-2xl font-semibold text-black leading-tight">{pkg.title}</h1>
                  </div>

                  <div>
                    <p className="mt-2 text-3xl font-bold text-black">₱{pkg.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-black" />
                    <span>{pkg.duration || 'Duration TBA'}</span>
                  </div>

                  <div className="grid gap-2 border-t border-slate-200 pt-4 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-black" />
                      <span>Max {pkg.maximumCapacity || 1} guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-black" />
                      <span>{pkg.destination || 'Destination TBA'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/booking/${pkg.id}`)}
                    className="mt-5 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                  >
                    Book This Package
                  </button>
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-black mt-1" />
                    <div>
                      <p className="font-semibold text-black">Secure Payment</p>
                      <p className="text-slate-600">GCash payment with confirmation.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black mt-1" />
                    <div>
                      <p className="font-semibold text-black">Flexible Rescheduling</p>
                      <p className="text-slate-600">Change your date if needed.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Meeting Info */}
              <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Meeting Point</p>
                <p className="mt-2 text-base font-medium text-black">{pkg.meetingLocation || 'TBA'}</p>
                <p className="mt-2 text-xs text-slate-500">Please arrive 15 minutes before departure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PackageDetail;
