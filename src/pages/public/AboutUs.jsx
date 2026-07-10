import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Users, Heart, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="space-y-20 pb-20 pt-10">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden px-4">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=1600')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl text-center space-y-6 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Discover Our Story
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-100 tracking-tight leading-none font-display">
            Rabas Travel & Tours
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Connecting passionate adventurers to the authentic beauty, rich cultures, and hidden treasures of the Philippines.
          </p>
        </div>
      </section>

      {/* Our Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold font-display text-slate-100 border-l-4 border-yellow-500 pl-4">
              Our Mission
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              At Rabas Travel and Tours, our mission is to deliver unforgettable, high-quality, and hassle-free domestic travel experiences. We strive to highlight the Philippines' most beautiful and untouched spots while ensuring that every journey supports local micro-economies and community stakeholders.
            </p>
            <p className="text-slate-400 text-base leading-relaxed">
              By combining local coordinator expertise with cutting-edge digital integrations—like instant checkouts and live field reporting—we make exploration secure, structured, and profoundly rewarding.
            </p>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="w-full max-w-[450px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800" 
                alt="Beautiful Philippines Beach" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
              <div className="absolute bottom-4 left-4 p-4 flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
                <MapPin className="h-5 w-5 text-yellow-500" />
                <span className="text-white text-sm font-semibold">El Nido, Palawan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold font-display text-slate-100">Our Core Principles</h2>
          <p className="text-slate-400 text-sm">The pillars that define every Rabas journey and partnership.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Eco Tourism */}
          <div className="glass-panel p-8 rounded-3xl border-slate-800 space-y-4 hover:border-yellow-500/30 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-display">Responsible Tourism</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We promote ecological mindfulness. We guide tourists to leave zero carbon footprint, respect local wildlife habitats, and support sustainable conservation programs.
            </p>
          </div>

          {/* Local Empowerment */}
          <div className="glass-panel p-8 rounded-3xl border-slate-800 space-y-4 hover:border-yellow-500/30 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-display">Local Empowerment</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We employ registered, passionate local guides and coordinate directly with homegrown transport providers and family-owned accommodations to keep tourism revenues in local hands.
            </p>
          </div>

          {/* Safety & Integrity */}
          <div className="glass-panel p-8 rounded-3xl border-slate-800 space-y-4 hover:border-yellow-500/30 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-display">Safety & Trust</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Travel with confidence. All bookings are protected by transparent refund structures, secure checkout gateways, and 24/7 direct communication channels with our coordinators in the field.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl border-slate-800 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden text-center md:text-left">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-yellow-500/5 blur-3xl" />
          <div className="space-y-3 relative z-10 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-slate-100">
              Ready to Start Your Rabas Journey?
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Check out our featured custom-curated tour packages, or configure your dream vacation in Bicol and beyond using our interactive itinerary builder.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto shrink-0 justify-center">
            <Link
              to="/packages"
              className="px-6 py-3.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold font-display rounded-xl shadow-lg shadow-yellow-500/10 hover:scale-[1.03] transition-all cursor-pointer text-xs uppercase tracking-wider text-center"
            >
              Browse Packages
            </Link>
            <Link
              to="/customize"
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold font-display rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider text-center"
            >
              Customize Trip
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
