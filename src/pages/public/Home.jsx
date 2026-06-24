import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { tripUploadService } from '../../services/tripUploadService';
import { Compass, Search, Star, MapPin, Sparkles, Activity, Clock, Users } from 'lucide-react';

const Home = () => {
  const [packages, setPackages] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const allPkgs = await packageService.getAll();
      setPackages(allPkgs);
      const updates = await tripUploadService.getAll();
      setLiveUpdates(updates.slice(0, 3)); // show top 3 updates
    };
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/packages?search=${encodeURIComponent(searchQuery)}`);
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || pkg.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = ['All', 'Beach', 'Adventure', 'Cultural', 'Nature', 'Premium'];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/70 to-slate-950" />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl text-center space-y-8 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider animate-bounce">
            <Sparkles className="h-3.5 w-3.5" />
            Explore the Gems of the Philippines
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100 tracking-tight leading-none font-display">
            Your Ultimate Gateway to <br />
            <span className="text-cyan-400 text-glow-cyan">
              Rabas Adventures
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Experience premium curated island hopping, culture tours, and outdoor wonders. Instant GCash checkout, real-time forecasts, and live tour reports.
          </p>

          {/* Search Form */}
          <form 
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-xl"
          >
            <div className="relative w-full flex-grow">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations (e.g. Palawan, Boracay, Siargao)..."
                className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-500 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-0"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3.5 bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold font-display rounded-xl shadow-lg shadow-cyan-400/20 hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap"
            >
              Search Tours
            </button>
          </form>
        </div>
      </section>

      {/* Recommended Tour Packages Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold font-display text-slate-100">Featured Packages</h2>
            <p className="text-slate-400 text-sm mt-1">Recommended custom tours by our local travel coordinators.</p>
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-cyan-500 text-slate-950 border-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPackages.slice(0, 3).map((pkg) => (
            <div key={pkg.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group h-full">
              {/* Image with zoom on hover */}
              <div className="h-56 w-full overflow-hidden relative">
                <img 
                  src={pkg.image} 
                  alt={pkg.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-cyan-400 text-xs font-semibold">
                  {pkg.duration}
                </div>
              </div>

              {/* Package Content */}
              <div className="p-6 flex-grow flex flex-col space-y-4">
                <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                  <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                  {pkg.destination}
                </div>

                <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors font-display line-clamp-1">
                  {pkg.title}
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                  {pkg.description}
                </p>

                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{pkg.rating}</span>
                  <span className="text-slate-500">({pkg.reviewsCount} reviews)</span>
                </div>

                {/* Pricing & Button */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-900 mt-auto">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Starts from</span>
                    <span className="text-lg font-extrabold text-slate-100 font-display">PHP {pkg.price.toLocaleString()}</span>
                  </div>
                  <Link 
                    to={`/packages/${pkg.id}`}
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Trip Planner CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl border-slate-800 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="space-y-3 relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              New Feature
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-slate-100">
              Design Your Own Dream Trip
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Choose your destination, pick activities, select a hotel tier, and set your travel dates. Our pricing engine calculates your total cost in real-time as you customize every detail.
            </p>
          </div>
          <Link
            to="/customize"
            className="px-8 py-4 bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold font-display rounded-xl shadow-lg shadow-cyan-400/20 hover:scale-[1.03] transition-all cursor-pointer whitespace-nowrap text-sm shrink-0"
          >
            Start Customizing →
          </Link>
        </div>
      </section>

      {/* Real-time Field Logs Feed */}
      <section className="bg-slate-900/30 border-y border-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5" />
              Live Tour Feed
            </div>
            <h2 className="text-3xl font-extrabold font-display text-slate-100">Real-Time Trip Logs</h2>
            <p className="text-slate-400 text-sm">See live updates, check-ins, and photos directly uploaded from active tours by our guides in the field.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveUpdates.length > 0 ? (
              liveUpdates.map((update) => (
                <div key={update.id} className="glass-card rounded-2xl overflow-hidden border-slate-800/60 flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={update.imageUrl} 
                      alt={update.spotName} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                      {update.spotName}
                    </div>
                  </div>
                  <div className="p-5 flex-grow space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-400">{update.guideName} (Guide)</span>
                      <span>{new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      "{update.caption}"
                    </p>
                    <div className="text-[10px] text-cyan-400 font-bold border-t border-slate-900 pt-2 flex items-center gap-1">
                      <Compass className="h-3 w-3" />
                      {update.packageName}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center col-span-3 text-slate-500 text-sm py-4">No active tour logs available right now.</p>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Map Promo Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/40 rounded-3xl border border-slate-800 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
          
          <div className="lg:col-span-7 space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5" />
              Interactive Experience
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-slate-100 tracking-tight leading-tight">
              Explore the Philippines through Tourist Lenses
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Open our interactive travel map to explore pinned local destinations like Palawan, Boracay, and Siargao. Zoom in to discover real gallery uploads, read stories from fellow travelers, check live spot weather, and share your own unforgettable travel snapshots in real-time!
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/explore"
                className="px-6 py-3.5 bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold font-display rounded-xl shadow-lg shadow-cyan-400/15 hover:scale-[1.02] transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Launch Travel Map
              </Link>
              <Link
                to="/gallery"
                className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold font-display rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                View Grid Gallery
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Visual mock of the map */}
            <div className="w-full max-w-[340px] aspect-square rounded-2xl border-4 border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative group">
              <img 
                src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800" 
                alt="Palawan Map Mock" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-slate-950/20" />
              {/* Fake pins */}
              <div className="absolute top-1/3 left-1/4 animate-bounce">
                <div className="h-9 w-9 rounded-full border-2 border-cyan-400 bg-slate-950 flex items-center justify-center text-cyan-400 shadow-xl">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              <div className="absolute top-1/2 right-1/3 animate-pulse">
                <div className="h-10 w-10 rounded-full border-2 border-white overflow-hidden shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=80" alt="Siargao Pin Mock" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute bottom-1/4 left-1/2">
                <div className="h-8 w-8 rounded-full border-2 border-cyan-400 bg-slate-950 flex items-center justify-center text-cyan-400 shadow-xl">
                  <MapPin className="h-3 w-3" />
                </div>
              </div>
              
              <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-sm text-center">
                <div className="text-[10px] uppercase font-extrabold text-cyan-400 tracking-wider">Palawan Live Uploads</div>
                <div className="text-white font-bold text-xs">"Crystal Lagoon was breathtaking!"</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <h2 className="text-3xl font-extrabold font-display text-slate-100 text-center">What Tourists Say About Rabas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { name: 'Alden Richards', text: 'El Nido Premium island hopping was seamless! The GCash checkout took 20 seconds, and our tour guide sent weather updates every morning.', rating: 5 },
            { name: 'Sarah Geronimo', text: 'Loved the Siargao Surf Package. Suggested spots were perfect, and having the weather integration saved our itinerary when it rained on Day 4.', rating: 5 },
            { name: 'Catriona Gray', text: 'Excellent service. Batanes was a dream, and the cultural guides were incredibly helpful. Highly recommend Rabas for hassle-free booking.', rating: 5 }
          ].map((item, index) => (
            <div key={index} className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
              <div className="flex gap-1 text-amber-400">
                {[...Array(item.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-slate-300 text-sm italic leading-relaxed">"{item.text}"</p>
              <h4 className="text-slate-400 font-semibold text-xs tracking-wider uppercase">— {item.name}</h4>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
