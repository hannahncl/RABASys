import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { bookingService } from '../../services/bookingService';
import { tripUploadService } from '../../services/tripUploadService';
import { api } from '../../services/api';
import { Compass, Search, Star, MapPin, Sparkles, Activity, Clock, Users } from 'lucide-react';

const Home = () => {
  const [packages, setPackages] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const allPkgs = await packageService.getAll();
      setPackages(allPkgs);
      const updates = await tripUploadService.getAll();
      setLiveUpdates(updates.slice(0, 3)); // show top 3 updates
      
      // Load all bookings and reviews
      try {
        const allBookings = await bookingService.getAll();
        setBookings(allBookings);
        const reviewData = await api('/reviews');
        setReviews(reviewData);
      } catch (err) {
        console.error('Failed to load reviews/bookings', err);
      }
    };
    loadData();
  }, []);

  // Helper function to get review stats for a package
  const getPackageReviewStats = (packageId) => {
    const packageReviews = reviews.filter(review => {
      const booking = bookings.find(b => b.id === String(review.booking_id));
      return booking && booking.packageId === String(packageId);
    });
    
    if (packageReviews.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }
    
    const averageRating = (
      packageReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / packageReviews.length
    ).toFixed(1);
    
    return {
      averageRating: parseFloat(averageRating),
      reviewCount: packageReviews.length
    };
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/packages?search=${encodeURIComponent(searchQuery)}`);
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || pkg.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const showcaseImages = [
    { id: 'albay', title: 'Albay', image: '/ALBAY.jpg' },
    { id: 'calaguas', title: 'Calaguas', image: '/CALAGUAS.jpg' },
    { id: 'caramoan', title: 'Caramoan', image: '/CARAMOAN.jpg' },
    { id: 'matnog', title: 'Matnog', image: '/MATNOG.jpg' },
    { id: 'sorsogon', title: 'Sorsogon', image: '/SORSOGON.jpg' }
  ];

  const allTags = ['All', 'Beach', 'Adventure', 'Cultural', 'Nature', 'Premium'];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/70 to-slate-950" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl text-center space-y-8 px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-100 tracking-tight leading-[0.95] font-display whitespace-nowrap mt-2 mb-6">
            Explore Bicol the
            <span className="ml-2 text-cyan-400 text-glow-cyan">
              RABAS Way
            </span>
          </h1>

          <div className="w-full max-w-7xl mx-auto">
            <div className="flex justify-center items-stretch gap-3 px-1 pb-2">
              {showcaseImages.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex-[0_0_calc(100%/5-0.75rem)] min-w-[190px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPackages.slice(0, 3).map((pkg) => {
            const { averageRating, reviewCount } = getPackageReviewStats(pkg.id);
            return (
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
                  <span>{averageRating}</span>
                  <span className="text-slate-500">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
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
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default Home;
