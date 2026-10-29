import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Car, Clock, Compass, MapPin, Package, Search, SlidersHorizontal, Star, Users } from 'lucide-react';
import { packageService } from '../../services/packageService';
import { api } from '../../services/api';
import FavoriteButton from '../../components/ui/FavoriteButton';

const fallbackPackages = [
  { id: 'fallback-albay', title: 'Albay Escape', destination: 'Albay, Bicol', description: 'A relaxed route through volcano views, heritage stops, and local flavors.', price: 2500, image: '/ALBAY.jpg' },
  { id: 'fallback-caramoan', title: 'Caramoan Island Hopping', destination: 'Caramoan, Bicol', description: 'Clear waters, quiet beaches, and a full day made for island discovery.', price: 3800, image: '/CARAMOAN.jpg' },
  { id: 'fallback-calaguas', title: 'Calaguas Weekend', destination: 'Calaguas, Bicol', description: 'Slow mornings and wide-open shores on one of Bicol’s favorite escapes.', price: 4200, image: '/CALAGUAS.jpg' },
];

const tuktripBackdrop = 'https://images.unsplash.com/photo-1675650721403-a6a1829eb31a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800';

const imageForPackage = (pkg, index) => {
  if (pkg.image) return pkg.image.startsWith('/') || pkg.image.startsWith('http') ? pkg.image : `/${pkg.image}`;
  return fallbackPackages[index % fallbackPackages.length].image;
};

const packageDate = (date) => date
  ? new Date(`${String(date).slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Date not set';

const Home = () => {
  const [packages, setPackages] = useState(fallbackPackages);
  const [joinerAvailability, setJoinerAvailability] = useState({});
  const [tukTripRun, setTukTripRun] = useState(0);
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchTravelers, setSearchTravelers] = useState('2');

  useEffect(() => {
    let mounted = true;
    packageService.getAll()
      .then(async (items) => {
        if (mounted && items.length > 0) {
          const featuredPackages = items.slice(0, 3);
          setPackages(featuredPackages);
          const availabilityEntries = await Promise.all(featuredPackages
            .filter((pkg) => String(pkg.packageType || pkg.package_type || pkg.category || '').toLowerCase() === 'joiner')
            .map(async (pkg) => {
              try {
                return [String(pkg.id), await api(`/bookings/joiner-availability/${pkg.id}`)];
              } catch {
                return [String(pkg.id), null];
              }
            }));
          if (mounted) setJoinerAvailability(Object.fromEntries(availabilityEntries));
        }
      })
      .catch(() => {
        // Keep the curated fallback cards when the API is unavailable.
      });
    return () => { mounted = false; };
  }, []);

  return (
    <main className="bg-[#fbfaf7] text-[#2d2a24]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <section className="relative isolate mx-4 mt-4 min-h-[320px] overflow-hidden rounded-3xl bg-[#2d2a24] text-white shadow-[0_18px_45px_rgba(79,60,39,0.16)] sm:mx-6 lg:mx-8">
        <img src="/hero-mayon.jpg" alt="Mayon Volcano and a Bicol landscape" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_35%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#211b17]/90 via-[#2d2a24]/65 to-[#2d2a24]/20" />
        <div className="mx-auto flex min-h-[320px] max-w-7xl flex-col justify-start px-8 pt-8 sm:min-h-[350px] sm:px-12 sm:pt-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ead7b4]">RABAS Travel &amp; Tours</p>
            <h1 className="max-w-xl text-4xl font-medium leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Your next great story starts here.
            </h1>
          </div>

        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-6 max-w-6xl px-6 sm:-mt-10 sm:px-8 lg:px-12">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const query = new URLSearchParams();
            if (searchDestination.trim()) query.set('search', searchDestination.trim());
            if (searchDate) query.set('date', searchDate);
            query.set('travelers', searchTravelers);
            window.location.href = `/packages?${query.toString()}`;
          }}
          className="grid gap-3 rounded-2xl border border-[#e0d2c3] bg-white p-3 shadow-[0_16px_35px_rgba(79,60,39,0.16)] sm:grid-cols-[1.4fr_1fr_0.85fr_auto] sm:items-center sm:gap-0 sm:p-2"
        >
          <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-[#faf6f0] sm:border-r sm:border-[#eee5da]">
            <MapPin className="h-5 w-5 shrink-0 text-[#8b5e48]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f8576]">Where to?</span>
              <input value={searchDestination} onChange={(event) => setSearchDestination(event.target.value)} placeholder="Search destinations, activities, or packages" className="mt-1 w-full bg-transparent text-sm font-medium text-[#294136] outline-none placeholder:text-[#aaa093]" />
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-[#faf6f0] sm:border-r sm:border-[#eee5da]">
            <CalendarDays className="h-5 w-5 shrink-0 text-[#8b5e48]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f8576]">When?</span>
              <input type="date" value={searchDate} onChange={(event) => setSearchDate(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium text-[#294136] outline-none" />
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-[#faf6f0]">
            <Users className="h-5 w-5 shrink-0 text-[#8b5e48]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f8576]">Travelers</span>
              <select value={searchTravelers} onChange={(event) => setSearchTravelers(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium text-[#294136] outline-none">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'Traveler' : 'Travelers'}</option>)}
              </select>
            </span>
          </label>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#603524] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#754a36] sm:h-full">
            <Search className="h-4 w-4" />
            <span className="sm:hidden">Search tours</span>
          </button>
        </form>
      </section>

      <section className="hidden mt-8 bg-[#fbfaf7] px-6 py-8 text-white sm:px-8 lg:px-12">
        <style>{`
          @keyframes tuktrip-drive {
            0% { transform: translateX(-18vw) rotate(-1deg); }
            45% { transform: translateX(42vw) rotate(1deg); }
            100% { transform: translateX(112vw) rotate(-1deg); }
          }
          @keyframes tuktrip-bob {
            0%, 100% { margin-bottom: 0; }
            50% { margin-bottom: 5px; }
          }
        `}</style>
        <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center overflow-hidden rounded-3xl bg-[#294136] px-6 py-20 sm:px-8 lg:px-12">
          <img src={tuktripBackdrop} alt="Tuk-tuk riding through a tropical road" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#183127] via-[#294136]/90 to-[#294136]/35" />
          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <div className="max-w-lg">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#d8e4dc]">A different way to see Bicol</p>
              <h2 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Take a Tuktrip.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/75">Small roads, quick stops, and the kind of ride that makes the journey part of the story.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/packages?search=tuktrip" className="inline-flex items-center gap-2 rounded-full bg-[#d8e4dc] px-5 py-3 text-sm font-bold text-[#294136] transition hover:bg-white">Find a Tuktrip <ArrowRight className="h-4 w-4" /></Link>
                <button type="button" onClick={() => setTukTripRun((run) => run + 1)} className="rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Ride again</button>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden">
            <div className="absolute bottom-9 left-0 right-0 h-px bg-white/35" />
            <div className="absolute bottom-3 left-0 right-0 h-px border-t border-dashed border-white/25" />
            <div key={tukTripRun} className="absolute bottom-8 left-0 text-5xl leading-none" style={{ animation: 'tuktrip-drive 9s linear infinite, tuktrip-bob 0.45s ease-in-out infinite' }} aria-label="Animated tuk-tuk riding across the road" role="img">&#x1F6FA;</div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[calc(100vh-80px)] items-start overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#f6e9df]/70 blur-3xl animate-pulse" />
          <span className="absolute right-[-6rem] top-40 h-80 w-80 rounded-full bg-[#e4eef2]/80 blur-3xl animate-pulse [animation-delay:900ms]" />
          <div className="absolute left-[8%] right-[8%] top-[47%] border-t border-dashed border-[#d9c8b9]/60" />
          <span className="absolute left-[18%] top-[calc(47%-5px)] h-2.5 w-2.5 rounded-full bg-[#b98e72] shadow-[0_0_0_6px_rgba(185,142,114,0.12)] animate-[bounce_4s_ease-in-out_infinite]" />
          <span className="absolute left-[67%] top-[calc(47%-5px)] h-2.5 w-2.5 rounded-full bg-[#607d91] shadow-[0_0_0_6px_rgba(96,125,145,0.12)] animate-[bounce_4s_ease-in-out_infinite] [animation-delay:1.2s]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div>
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8f8576]">Find your next escape</p>
              <h2 className="mt-0 text-3xl font-medium tracking-[-0.025em] text-[#2d2a24] sm:text-4xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Featured tour packages.</h2>
            </div>
            <Link to="/packages" className="hidden items-center gap-2 text-sm font-bold text-[#603524] transition hover:text-[#294136] sm:inline-flex">View all packages <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg, index) => {
              const pkgId = pkg.id || pkg.package_id;
              const isJoiner = String(pkg.packageType || pkg.package_type || pkg.category || '').toLowerCase() === 'joiner';
              const availability = joinerAvailability[String(pkgId)];
              const packageTitle = pkg.title || pkg.packageName || pkg.package_name || 'Tour package';
              const bookingLink = String(pkgId).startsWith('fallback-') ? '/packages' : `/packages/${pkgId}`;

              return (
                <article
                  key={pkgId || index}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#d9c1ad] bg-[#fffaf5] shadow-[0_10px_24px_rgba(79,60,39,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#b98e72] hover:shadow-[0_16px_30px_rgba(79,60,39,0.15)]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <div className="relative h-[240px] w-full overflow-hidden bg-[#dfe8e3]">
                    {pkgId && !String(pkgId).startsWith('fallback-') && (
                      <FavoriteButton itemId={pkgId} itemType="tour" className="absolute right-3 top-3 z-10 shadow-sm" />
                    )}
                    <img
                      src={imageForPackage(pkg, index)}
                      alt={packageTitle}
                      onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackPackages[index % fallbackPackages.length].image; }}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#211b17]/35 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
                    <h3 className="mb-1 text-sm font-semibold leading-snug text-[#294136]" style={{ letterSpacing: '0.02em' }}>{packageTitle}</h3>
                    <div className="mb-2 flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#a87543] text-[#a87543]" />
                        <span className="text-xs font-bold text-[#603524]">{Number(pkg.rating) > 0 ? Number(pkg.rating).toFixed(1) : 'New'}</span>
                      </div>
                      <span className="text-[10px] font-medium text-[#8f8576]">
                        {Number(pkg.reviewsCount || pkg.reviews_count) > 0
                          ? `(${Number(pkg.reviewsCount || pkg.reviews_count)} ${Number(pkg.reviewsCount || pkg.reviews_count) === 1 ? 'review' : 'reviews'})`
                          : 'No reviews yet'}
                      </span>
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-3.5 border-t border-[#e4d2bf] pt-4 text-[11px] font-medium text-[#526b7b]">
                      <div className="flex min-w-0 items-center gap-2">
                        {isJoiner ? <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#8b5e48]" /> : <Clock className="h-3.5 w-3.5 shrink-0 text-[#8b5e48]" />}
                        <span className="truncate">{isJoiner ? packageDate(availability?.departureDate || pkg.joinerDate || pkg.joiner_date) : (pkg.duration || 'Duration TBA')}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <Users className="h-3.5 w-3.5 shrink-0 text-[#8b5e48]" />
                        <span className="truncate">{isJoiner
                          ? (availability ? (availability.bookingOpen ? `${availability.remainingSlots} ${availability.remainingSlots === 1 ? 'spot' : 'spots'} left` : 'Booking closed') : 'Availability loading')
                          : (pkg.maximumCapacity ? `Up to ${pkg.maximumCapacity} guests` : 'Flexible group size')}</span>
                      </div>
                    </div>
                    <div className="mb-4 mt-5 h-px bg-[#e4d2bf]" />
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div>
                        <span className="mr-1 text-lg font-semibold text-[#603524]">₱{Number(pkg.price || 0).toLocaleString()}</span>
                        <span className="text-[9px] font-medium tracking-[0.06em] text-[#8f8576]">/ person</span>
                      </div>
                      <Link to={bookingLink} className="rounded-full border border-[#294136] bg-[#294136] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:border-[#426348] hover:bg-[#426348]" style={{ whiteSpace: 'nowrap' }}>
                        {isJoiner ? 'Join this Tour' : 'Book Now'}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div className="hidden grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b5e48]">Why travel with RABAS?</p>
            <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>A better way to see Bicol.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#6b6255]">Thoughtfully planned tours, flexible rentals, and local guidance for every kind of traveler.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/packages?search=Mayon" className="rounded-full border border-[#d9c1ad] bg-[#fff7ef] px-3 py-1.5 text-[11px] font-semibold text-[#8b5e48] transition hover:-translate-y-0.5 hover:bg-[#8b5e48] hover:text-white">Mayon routes</Link>
              <Link to="/packages?search=Caramoan" className="rounded-full border border-[#cbd8e0] bg-[#f1f6f8] px-3 py-1.5 text-[11px] font-semibold text-[#385467] transition hover:-translate-y-0.5 hover:bg-[#385467] hover:text-white">Caramoan escapes</Link>
              <Link to="/packages?search=Tuktrip" className="rounded-full border border-[#c7d8c7] bg-[#f0f6f0] px-3 py-1.5 text-[11px] font-semibold text-[#426348] transition hover:-translate-y-0.5 hover:bg-[#426348] hover:text-white">Tuktrip rides</Link>
            </div>
            <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              <div className="group flex gap-3 rounded-xl p-3 transition hover:bg-[#fff7ef]"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#8b5e48] transition group-hover:scale-110" /><div><h3 className="text-sm font-bold text-[#294136]">Bicol routes</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Explore Mayon, Caramoan, and the places locals love.</p></div></div>
              <div className="group flex gap-3 rounded-xl p-3 transition hover:bg-[#f1f6f8]"><Users className="mt-0.5 h-5 w-5 shrink-0 text-[#385467] transition group-hover:scale-110" /><div><h3 className="text-sm font-bold text-[#294136]">Local guidance</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Travel with people who know the region best.</p></div></div>
              <div className="group flex gap-3 rounded-xl p-3 transition hover:bg-[#f0f6f0]"><Compass className="mt-0.5 h-5 w-5 shrink-0 text-[#426348] transition group-hover:scale-110" /><div><h3 className="text-sm font-bold text-[#294136]">Easy planning</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Choose a tour, car rental, or custom trip.</p></div></div>
              <div className="group flex gap-3 rounded-xl p-3 transition hover:bg-[#f7f1ed]"><ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-[#8b5e48] transition group-hover:translate-x-1" /><div><h3 className="text-sm font-bold text-[#294136]">Made personal</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Build a journey around your pace and interests.</p></div></div>
            </div>
          </div>
          <div className="group relative min-h-[320px] overflow-hidden rounded-2xl bg-[#294136] shadow-[0_18px_45px_rgba(79,60,39,0.16)] transition duration-500 hover:shadow-[0_24px_55px_rgba(41,65,54,0.25)]">
            <img src="/island-paradise.jpg" alt="A peaceful Bicol island destination" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#183127]/90 via-[#294136]/45 to-transparent" />
            <div className="absolute right-6 top-6 z-10 rounded-full border border-white/30 bg-[#183127]/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">Bicol, Philippines</div>
            <div className="absolute bottom-6 right-7 z-10 hidden h-20 w-20 rounded-full border border-white/35 sm:block"><div className="absolute inset-2 rounded-full border border-dashed border-white/40" /><span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d8e4dc] shadow-[0_0_0_6px_rgba(216,228,220,0.18)]" /></div>
            <div className="relative z-10 flex min-h-[320px] max-w-sm flex-col justify-end p-7 sm:p-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d8e4dc]">Your next escape</p>
              <h3 className="mt-3 text-3xl font-semibold leading-tight text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Find your way through Bicol.</h3>
              <p className="mt-3 text-sm leading-6 text-white/75">Start with a ready-made package or let us shape the trip around you.</p>
              <Link to="/packages" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#d8e4dc] px-5 py-3 text-sm font-bold text-[#294136] transition hover:bg-white">Plan your trip <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
        <div className="hidden flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b5e48]">Start exploring</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Featured packages</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6b6255]">Simple itineraries, memorable destinations, and a little more time to enjoy the journey.</p>
          </div>
          <Link to="/packages" className="inline-flex items-center gap-2 text-sm font-bold text-[#603524] hover:underline">View all packages <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="hidden mt-10 grid gap-6 md:grid-cols-3">
          {packages.map((pkg, index) => (
            <article key={pkg.id || pkg.package_id || index} className="group overflow-hidden rounded-2xl border border-[#d9c1ad] bg-[#fffaf5] shadow-[0_16px_35px_rgba(92,57,35,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(92,57,35,0.18)]">
              <div className="relative h-64 overflow-hidden">
                <img src={imageForPackage(pkg, index)} alt={pkg.title || 'Featured travel package'} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackPackages[index % fallbackPackages.length].image; }} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute left-4 top-4 rounded-full bg-[#294136]/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f3e8d8]">Featured</span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#8b5e48]"><MapPin className="h-3.5 w-3.5" /> {pkg.destination || 'Bicol, Philippines'}</p>
                    <h3 className="mt-2 text-xl font-semibold text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{pkg.title || 'Bicol Discovery'}</h3>
                  </div>
                  {pkg.price > 0 && <p className="whitespace-nowrap text-sm font-bold text-[#603524]">₱{Number(pkg.price).toLocaleString()}</p>}
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[#6b6255]">{pkg.description || 'A carefully planned escape made for discovering something new.'}</p>
                <Link to={`/booking/${pkg.id || pkg.package_id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#8b5e48] hover:text-[#294136] hover:underline">Explore package <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
          ))}
        </div>
        </div>
      </section>

      <section className="border-y border-[#e4d9cc] bg-[#f7f3ed]">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-16">
          <div className="mb-8 max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b5e48]">How can we help?</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Choose your way to travel.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6b6255]">Whether you want a ready-made adventure, a reliable ride, or a trip built around you, RABAS has an option for every journey.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Link to="/packages" onClick={() => window.scrollTo(0, 0)} className="group rounded-2xl border border-[#754a36] bg-[#754a36] p-6 text-white shadow-[0_10px_24px_rgba(117,74,54,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[#603524] hover:bg-[#603524] hover:shadow-[0_16px_30px_rgba(117,74,54,0.28)]">
              <div className="mb-5 flex justify-center text-[#f3d8c1] transition group-hover:scale-105"><Package className="h-8 w-8" /></div>
              <h3 className="text-lg font-semibold text-white">Tour Packages</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">Explore curated Bicol destinations with thoughtfully planned itineraries.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f3d8c1]">Explore tours <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </Link>
            <Link to="/car-rentals" onClick={() => window.scrollTo(0, 0)} className="group rounded-2xl border border-[#385467] bg-[#385467] p-6 text-white shadow-[0_10px_24px_rgba(56,84,103,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[#294354] hover:bg-[#294354] hover:shadow-[0_16px_30px_rgba(56,84,103,0.28)]">
              <div className="mb-5 flex justify-center text-[#cfe3ec] transition group-hover:scale-105"><Car className="h-8 w-8" /></div>
              <h3 className="text-lg font-semibold text-white">Car Rentals</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">Get around Bicol comfortably with flexible rental options for your plans.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#cfe3ec]">Browse rentals <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </Link>
            <Link to="/customize" onClick={() => window.scrollTo(0, 0)} className="group rounded-2xl border border-[#426348] bg-[#426348] p-6 text-white shadow-[0_10px_24px_rgba(66,99,72,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[#304f36] hover:bg-[#304f36] hover:shadow-[0_16px_30px_rgba(66,99,72,0.28)]">
              <div className="mb-5 flex justify-center text-[#d4e8d7] transition group-hover:scale-105"><SlidersHorizontal className="h-8 w-8" /></div>
              <h3 className="text-lg font-semibold text-white">Customize Trip</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">Tell us what you want to experience and we’ll help shape the journey.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d4e8d7]">Plan your trip <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </Link>
          </div>
          <div className="relative mt-10 h-12 overflow-hidden" aria-label="Animated car traveling along a road" role="img">
            <style>{`
              @keyframes cardrive {
                0% { transform: translateX(-5rem); }
                100% { transform: translateX(calc(100vw + 5rem)); }
              }
              @keyframes carbounce {
                0%, 100% { margin-bottom: 0; }
                50% { margin-bottom: 3px; }
              }
            `}</style>
            <div className="absolute bottom-2 left-0 right-0 border-t border-dashed border-[#c9b7a5]" />
            <Car className="absolute bottom-3 left-0 h-7 w-7 text-[#603524]" style={{ animation: 'cardrive 8s linear infinite, carbounce 0.45s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      <section className="border-y border-[#e6dfd3] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:px-12 lg:py-24">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8f8576]">Travel made personal</p>
            <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#2d2a24]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>More than a destination.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#6b6255]">From the first idea to the moment you arrive home, RABAS helps make every detail feel easier, warmer, and worth remembering.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div><Users className="h-5 w-5 text-[#603524]" /><h3 className="mt-3 text-sm font-bold text-[#2d2a24]">Local perspective</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Routes shaped by people who know the places best.</p></div>
              <div><Compass className="h-5 w-5 text-[#603524]" /><h3 className="mt-3 text-sm font-bold text-[#2d2a24]">Easy planning</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Clear options for tours, rentals, and custom trips.</p></div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-[#2d2a24] shadow-[0_18px_45px_rgba(79,60,39,0.16)]">
            <video
              className="h-[22rem] w-full rounded-xl object-cover sm:h-[30rem]"
              src="/rabas-travel-showcase.mov"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              poster="/hero-mayon.jpg"
              aria-label="A short RABAS travel journey"
            >
              Your browser does not support the travel video.
            </video>
          </div>
        </div>
      </section>

      <section className="border-y border-[#eadbca] bg-[#f5eee5]">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-16">
          <div className="flex flex-col gap-8 rounded-2xl border border-[#e4d2bf] bg-[#fffaf5] p-6 shadow-[0_12px_30px_rgba(92,57,35,0.09)] sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#426348]">The RABAS difference</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Why travel with us?</h2>
              <p className="mt-3 text-sm leading-6 text-[#6b6255]">From the first idea to the journey home, we make exploring Bicol feel easier, warmer, and more personal.</p>
            </div>
            <div className="grid flex-1 gap-5 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-4">
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#e3eee6] text-[#426348] transition group-hover:scale-110"><Compass className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#294136]">Curated trips</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Thoughtful Bicol itineraries.</p></div>
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f6e9df] text-[#8b5e48] transition group-hover:scale-110"><MapPin className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#294136]">Local guidance</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Routes shaped by locals.</p></div>
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#e6eef2] text-[#385467] transition group-hover:scale-110"><ArrowRight className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#294136]">Easy booking</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Clear options from start to finish.</p></div>
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f0e8df] text-[#76513b] transition group-hover:scale-110"><Users className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#294136]">Travel support</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Help whenever you need it.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 bg-[#fbfaf7] px-6 py-8 text-white sm:px-8 lg:px-12">
        <style>{`
          @keyframes tuktrip-drive {
            0% { transform: translateX(-18vw) rotate(-1deg); }
            45% { transform: translateX(42vw) rotate(1deg); }
            100% { transform: translateX(112vw) rotate(-1deg); }
          }
          @keyframes tuktrip-bob {
            0%, 100% { margin-bottom: 0; }
            50% { margin-bottom: 5px; }
          }
        `}</style>
        <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center overflow-hidden rounded-3xl bg-[#294136] px-6 py-20 sm:px-8 lg:px-12">
          <img src={tuktripBackdrop} alt="Tuk-tuk riding through a tropical road" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#183127] via-[#294136]/90 to-[#294136]/35" />
          <div className="relative z-10 max-w-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#d8e4dc]">A different way to see Bicol</p>
            <h2 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Take a Tuktrip.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/75">Small roads, quick stops, and the kind of ride that makes the journey part of the story.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/packages?search=tuktrip" className="inline-flex items-center gap-2 rounded-full bg-[#d8e4dc] px-5 py-3 text-sm font-bold text-[#294136] transition hover:bg-white">Find a Tuktrip <ArrowRight className="h-4 w-4" /></Link>
              <button type="button" onClick={() => setTukTripRun((run) => run + 1)} className="rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Ride again</button>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden">
            <div className="absolute bottom-9 left-0 right-0 h-px bg-white/35" />
            <div className="absolute bottom-3 left-0 right-0 h-px border-t border-dashed border-white/25" />
            <div key={tukTripRun} className="absolute bottom-8 left-0 text-5xl leading-none" style={{ animation: 'tuktrip-drive 9s linear infinite, tuktrip-bob 0.45s ease-in-out infinite' }} aria-label="Animated tuk-tuk riding across the road" role="img">🛺</div>
            <span className="absolute bottom-2 left-[12%] h-2 w-2 rounded-full bg-[#d8e4dc]/70" />
            <span className="absolute bottom-2 left-[48%] h-2 w-2 rounded-full bg-[#d8e4dc]/70" />
            <span className="absolute bottom-2 left-[82%] h-2 w-2 rounded-full bg-[#d8e4dc]/70" />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
