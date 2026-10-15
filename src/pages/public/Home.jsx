import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setLiveUpdates(updates.slice(0, 3));
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

  const getPackageReviewStats = (packageId) => {
    const packageReviews = reviews.filter((review) => {
      const booking = bookings.find((bookingItem) => bookingItem.id === String(review.booking_id));
      return booking && booking.packageId === String(packageId);
    });
    if (packageReviews.length === 0) return { averageRating: 0, reviewCount: 0 };
    const averageRating = (packageReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / packageReviews.length).toFixed(1);
    return { averageRating: parseFloat(averageRating), reviewCount: packageReviews.length };
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    navigate(`/packages?search=${encodeURIComponent(searchQuery)}`);
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) || pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || pkg.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const showcaseImages = [
    { id: 'albay', title: 'Albay', image: '/ALBAY.jpg' },
    { id: 'calaguas', title: 'Calaguas', image: '/CALAGUAS.jpg' },
    { id: 'caramoan', title: 'Caramoan', image: '/CARAMOAN.jpg' },
    { id: 'matnog', title: 'Matnog', image: '/MATNOG.jpg' },
    { id: 'sorsogon', title: 'Sorsogon', image: '/SORSOGON.jpg' },
  ];

  const allTags = ['All', 'Beach', 'Adventure', 'Cultural', 'Nature', 'Premium'];

  return (
    <div className="space-y-20 pb-20">
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/70 to-slate-950" />
        <div className="relative z-10 max-w-4xl space-y-8 px-4 text-center">
          <h1 className="mt-2 mb-6 whitespace-nowrap text-4xl font-extrabold leading-[0.95] tracking-tight text-slate-100 sm:text-5xl md:text-6xl">
            Explore Bicol the
            <span className="ml-2 text-cyan-400 text-glow-cyan">RABAS Way</span>
          </h1>
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex items-stretch justify-center gap-3 px-1 pb-2">
              {showcaseImages.map((item) => (
                <div key={item.id} className="group relative min-w-[190px] flex-[0_0_calc(100%/5-0.75rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                  <img src={item.image} alt={item.title} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white"><p className="text-sm font-semibold">{item.title}</p></div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 backdrop-blur-xl sm:flex-row">
            <div className="relative w-full flex-grow"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" /><input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search Destinations" className="w-full border-0 bg-transparent py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0" /></div>
            <button type="submit" className="w-full whitespace-nowrap rounded-xl bg-cyan-400 px-7 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all hover:scale-[1.03] hover:bg-cyan-500 sm:w-auto">Search Tours</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
