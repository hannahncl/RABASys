import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { AuthContext } from '../../contexts/AuthContext';
import WeatherWidget from '../../components/feedback/WeatherWidget';
import { Compass, MapPin, Star, Calendar, Clock, Award, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PackageDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const data = await packageService.getById(id);
      setPkg(data);
      setLoading(false);
    };
    loadDetails();
  }, [id]);

  const handleBookingRedirect = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/booking/${id}` } } });
    } else {
      navigate(`/booking/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading itinerary details...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-200 font-display">Package Not Found</h2>
        <p className="text-slate-400 text-sm">We couldn't retrieve details for this specific package.</p>
        <Link to="/packages" className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded-xl text-sm font-semibold">
          Back to Tour Packages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Back Button */}
      <Link to="/packages" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm transition-colors group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Tour Packages
      </Link>

      {/* Grid Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold font-display text-slate-100 tracking-tight leading-tight">
              {pkg.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <MapPin className="h-4 w-4" />
                {pkg.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-current" />
                <span className="text-slate-200">{pkg.rating} ({pkg.reviewsCount} reviews)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {pkg.duration}
              </span>
            </div>
          </div>

          {/* Banner Image */}
          <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-900 shadow-2xl">
            <img 
              src={pkg.image} 
              alt={pkg.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold font-display text-slate-100">Overview</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{pkg.description}</p>
          </div>

          {/* Itinerary Timeline */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-display text-slate-100">Tour Itinerary</h3>
            <div className="space-y-6 relative border-l border-slate-900 ml-3 pl-6">
              {pkg.itinerary.map((day) => (
                <div key={day.day} className="relative group">
                  {/* Indicator Dot */}
                  <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-slate-950 border-2 border-cyan-400 group-hover:bg-cyan-400 transition-colors shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                  
                  <div className="glass-panel p-5 rounded-2xl border-slate-900 group-hover:border-slate-800/80 transition-all space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">Day {day.day}</span>
                    <h4 className="font-bold text-slate-200 text-sm font-display">{day.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{day.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col - Checkout Widget & Weather */}
        <div className="space-y-8 lg:sticky lg:top-24">
          {/* Checkout Card */}
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6 shadow-2xl">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Total Package Cost</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold font-display text-slate-100">PHP {pkg.price.toLocaleString()}</span>
                <span className="text-slate-400 text-xs font-semibold">/ person</span>
              </div>
            </div>

            <button
              onClick={handleBookingRedirect}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold font-display rounded-xl text-center shadow-lg shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer block"
            >
              Book This Package
            </button>

            {/* Quick Guarantees */}
            <div className="space-y-3.5 pt-4 border-t border-slate-900 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 text-cyan-500 shrink-0" />
                <span>Secure Payments via GCash Sandbox</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4.5 w-4.5 text-cyan-500 shrink-0" />
                <span>Flexible Dates & Rescheduling</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="h-4.5 w-4.5 text-cyan-500 shrink-0" />
                <span>Accredited Local Ivatan/Palawan Guides</span>
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          <WeatherWidget destination={pkg.destination} />
        </div>
      </div>
    </div>
  );
};

export default PackageDetail;
