import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Car, Clock, Compass, MapPin, Package, Search, SlidersHorizontal, Star, Users } from 'lucide-react';
import { packageService } from '../../services/packageService';
import { api } from '../../services/api';
import FavoriteButton from '../../components/ui/FavoriteButton';
import DatePicker from '../../components/ui/DatePicker';

const fallbackPackages = [
  { id: 'fallback-albay', title: 'Albay Escape', destination: 'Albay, Bicol', description: 'A relaxed route through volcano views, heritage stops, and local flavors.', price: 2500, image: '/ALBAY.jpg' },
  { id: 'fallback-caramoan', title: 'Caramoan Island Hopping', destination: 'Caramoan, Bicol', description: 'Clear waters, quiet beaches, and a full day made for island discovery.', price: 3800, image: '/CARAMOAN.jpg' },
  { id: 'fallback-calaguas', title: 'Calaguas Weekend', destination: 'Calaguas, Bicol', description: 'Slow mornings and wide-open shores on one of Bicol’s favorite escapes.', price: 4200, image: '/CALAGUAS.jpg' },
];
const tukTripImages = ['/Tuktrip1.jpg', '/Tuktrip2.jpg', '/Tuktrip3.jpg'];
const imageForPackage = (pkg, index) => {
  if (pkg.image) return pkg.image.startsWith('/') || pkg.image.startsWith('http') ? pkg.image : `/${pkg.image}`;
  return fallbackPackages[index % fallbackPackages.length].image;
};

const packageDate = (date) => date
  ? new Date(`${String(date).slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Date not set';

const Home = () => {
  const [packages, setPackages] = useState(fallbackPackages);
  const [tukTripPackage, setTukTripPackage] = useState(null);
  const [tukTripImageIndex, setTukTripImageIndex] = useState(0);
  const [joinerAvailability, setJoinerAvailability] = useState({});
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchTravelers, setSearchTravelers] = useState('1');
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  useEffect(() => {
    // Let the hero poster and page content paint before starting the large video request.
    const timer = window.setTimeout(() => setHeroVideoReady(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    packageService.getAll()
      .then(async (items) => {
        if (mounted && items.length > 0) {
          const featuredPackages = items.slice(0, 3);
          setPackages(featuredPackages);
          setTukTripPackage(items.find((pkg) => String(pkg.packageType || pkg.package_type || pkg.category || '').toLowerCase() === 'tuktrip') || null);
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

  const tukTripPackageLink = tukTripPackage?.id
    ? `/packages/${tukTripPackage.id}`
    : '/packages?search=Tuktrip';

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTukTripImageIndex((index) => (index + 1) % tukTripImages.length);
    }, 7000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="bg-[#fffdf9] text-[#561C24]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <section className="overflow-hidden bg-[linear-gradient(120deg,#fffdf9_0%,#fff8f1_58%,#fff4e8_100%)] text-[#561C24] lg:min-h-[calc(100svh-12rem)]">
        <div className="mx-auto grid h-full max-w-[90rem] items-center gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:min-h-[calc(100svh-12rem)] lg:grid-cols-[0.9fr_1.35fr] lg:gap-12 lg:px-12 lg:py-8">
          <div className="relative z-10">
            <h1 className="max-w-2xl text-4xl font-normal uppercase leading-[0.98] tracking-[0.025em] text-[#561C24] sm:text-5xl lg:text-7xl" style={{ fontFamily: "'Bodoni MT', 'Didot', 'Times New Roman', serif" }}>
              Travel Bicol,<br />the RABAS way.
            </h1>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-[#fed7b8]/80 bg-[#561C24] p-1.5 shadow-[0_18px_42px_rgba(86,28,36,0.24)] ring-1 ring-[#C7B7A3]/60">
            <video
              className="h-[17rem] w-full object-cover sm:h-[22rem] lg:h-[60vh] lg:min-h-[25rem] lg:max-h-[38rem]"
              src={heroVideoReady ? '/rabas-travel-showcase.mov' : undefined}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              preload="none"
              poster="/hero-mayon.jpg"
              aria-label="Travel scenery from Bicol"
            >
              Your browser does not support the travel video.
            </video>
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-5 max-w-7xl bg-[#fffdf9] px-6 sm:-mt-8 sm:px-8 lg:px-12">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const query = new URLSearchParams();
            if (searchDestination.trim()) query.set('search', searchDestination.trim());
            if (searchDate) query.set('date', searchDate);
            query.set('travelers', searchTravelers);
            window.location.href = `/packages?${query.toString()}`;
          }}
          className="grid gap-0 rounded-2xl border border-[#eadfd4] bg-white p-3 shadow-[0_12px_30px_rgba(86,28,36,0.09)] sm:grid-cols-[1.4fr_1fr_0.85fr_auto] sm:items-stretch sm:p-2"
        >
          <label className="flex min-w-0 items-center gap-3 px-4 py-3 sm:border-r sm:border-[#e8d8c4]">
            <MapPin className="h-[18px] w-[18px] shrink-0 text-[#561C24]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6D2932]">Destination</span>
              <input value={searchDestination} onChange={(event) => setSearchDestination(event.target.value)} placeholder="Search destinations, activities, or packages" className="mt-1 w-full bg-transparent text-sm font-medium text-[#561C24] outline-none placeholder:text-[#927d73]" />
            </span>
          </label>
          <div className="flex min-w-0 items-center gap-3 px-4 py-3 sm:border-r sm:border-[#e8d8c4]">
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#561C24]">Travel date</span>
              <DatePicker value={searchDate} onChange={setSearchDate} label="Travel date" />
            </span>
          </div>
          <label className="flex min-w-0 items-center gap-3 px-4 py-3">
            <Users className="h-[18px] w-[18px] shrink-0 text-[#561C24]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#561C24]">No. of Travelers</span>
              <select value={searchTravelers} onChange={(event) => setSearchTravelers(event.target.value)} className="mt-1 w-full bg-transparent text-sm text-[#561C24] outline-none">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'Traveler' : 'Travelers'}</option>)}
              </select>
            </span>
          </label>
          <button type="submit" aria-label="Search tours" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#561C24] bg-[#561C24] px-6 py-3.5 text-sm font-semibold text-[#fff7ed] transition hover:bg-[#6D2932] sm:min-w-36">
            <Search className="h-4 w-4" />
            <span>Find a trip</span>
          </button>
        </form>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#fffdf9_0%,#fffaf5_65%,#fff8ef_100%)] text-[#561C24]">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div>
          <div className="flex items-end justify-between gap-5 border-b border-[#C7B7A3] pb-4">
            <div>
              <h2 className="mt-0 text-3xl font-normal tracking-[0.01em] text-[#561C24] sm:text-4xl" style={{ fontFamily: "'Bodoni MT', 'Didot', 'Times New Roman', serif" }}>Featured Tour Package.</h2>
            </div>
            <Link to="/packages" className="hidden items-center gap-2 text-xs font-semibold text-[#561C24] transition hover:text-[#6D2932] sm:inline-flex">All tours <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-x-6">
            {packages.map((pkg, index) => {
              const pkgId = pkg.id || pkg.package_id;
              const isJoiner = String(pkg.packageType || pkg.package_type || pkg.category || '').toLowerCase() === 'joiner';
              const availability = joinerAvailability[String(pkgId)];
              const packageTitle = pkg.title || pkg.packageName || pkg.package_name || 'Tour package';
              const bookingLink = String(pkgId).startsWith('fallback-') ? '/packages' : `/packages/${pkgId}`;

              return (
                <article
                  key={pkgId || index}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#eee4da] bg-white shadow-[0_8px_24px_rgba(86,28,36,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(86,28,36,0.14)]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <div className="relative h-[220px] w-full overflow-hidden bg-[#C7B7A3] sm:h-[240px]">
                    {pkgId && !String(pkgId).startsWith('fallback-') && (
                      <FavoriteButton itemId={pkgId} itemType="tour" className="absolute right-3 top-3 z-10 shadow-sm" />
                    )}
                    <img
                      src={imageForPackage(pkg, index)}
                      alt={packageTitle}
                      onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackPackages[index % fallbackPackages.length].image; }}
                      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-90"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
                    <h3 className="text-base font-semibold leading-snug text-[#561C24]">{packageTitle}</h3>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-[#b8957f] text-[#b8957f]" />
                      <span className="text-xs font-semibold text-[#561C24]">{Number(pkg.rating) > 0 ? Number(pkg.rating).toFixed(1) : 'New'}</span>
                      <span className="text-xs text-[#6D2932]">{Number(pkg.reviewsCount || pkg.reviews_count) > 0 ? `(${Number(pkg.reviewsCount || pkg.reviews_count)} reviews)` : 'No reviews yet'}</span>
                    </div>
                    <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 border-y border-[#e8d8c4] py-3 text-xs leading-5 text-[#6D2932]">
                      <div className="flex items-center gap-2">
                        {isJoiner ? <CalendarDays className="h-4 w-4 shrink-0 text-[#6D2932]" /> : <Clock className="h-4 w-4 shrink-0 text-[#6D2932]" />}
                        <span>{isJoiner ? packageDate(availability?.departureDate || pkg.joinerDate || pkg.joiner_date) : (pkg.duration || 'Duration TBA')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0 text-[#6D2932]" />
                        <span>{isJoiner
                          ? (availability ? (availability.bookingOpen ? `${availability.remainingSlots} ${availability.remainingSlots === 1 ? 'spot' : 'spots'} left` : 'Booking closed') : 'Checking availability')
                          : (pkg.maximumCapacity ? `Up to ${pkg.maximumCapacity} guests` : 'Flexible group size')}</span>
                      </div>
                    </div>
                    <div className="-mx-5 -mb-4 mt-4 flex w-auto items-center justify-between gap-3 bg-gradient-to-r from-[#561C24] to-[#6D2932] px-5 py-3">
                      <div>
                        <span className="mr-1 text-lg font-semibold text-[#fff7ed]">&#8369;{Number(pkg.price || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-medium tracking-[0.04em] text-[#fed7b8]">/ person</span>
                      </div>
                      <Link to={bookingLink} className="rounded-lg border border-[#fed7b8] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#fff7ed] transition hover:bg-[#fed7b8] hover:text-[#561C24]" style={{ whiteSpace: 'nowrap' }}>
                      {isJoiner ? 'Join this tour' : 'Book now'}
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
          <Link to="/packages" className="inline-flex items-center gap-2 text-sm font-bold text-[#4b0508] hover:underline">View all packages <ArrowRight className="h-4 w-4" /></Link>
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
                  {pkg.price > 0 && <p className="whitespace-nowrap text-sm font-bold text-[#4b0508]">₱{Number(pkg.price).toLocaleString()}</p>}
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[#6b6255]">{pkg.description || 'A carefully planned escape made for discovering something new.'}</p>
                <Link to={`/booking/${pkg.id || pkg.package_id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#8b5e48] hover:text-[#294136] hover:underline">Explore package <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
          ))}
        </div>
        </div>
      </section>


      <section className="border-y border-[#6D2932]/10 bg-[#fffdf9]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12 lg:py-20">
          <div className="max-w-md rounded-2xl bg-gradient-to-br from-[#561C24] to-[#6D2932] p-6 text-[#fff7ed] shadow-[0_16px_36px_rgba(86,28,36,0.22)] lg:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#fed7b8]">How can we help?</p>
              <h2 className="mt-3 text-3xl font-normal leading-tight tracking-[0.01em] text-[#fff7ed] sm:text-4xl" style={{ fontFamily: "'Bodoni MT', 'Didot', 'Times New Roman', serif" }}>Choose your way to travel.</h2>
              <p className="mt-4 text-sm leading-6 text-[#f8e6d8]">Whether you want a ready-made adventure, a reliable ride, or a trip built around you, RABAS has an option for every journey.</p>
          </div>
          <div className="divide-y divide-[#6D2932]/15 border-y border-[#6D2932]/25">
            <Link to="/packages" onClick={() => window.scrollTo(0, 0)} className="group grid grid-cols-[1.5rem_1.5rem_1fr] items-center gap-2 py-5 sm:gap-4 lg:grid-cols-[2.5rem_2rem_1fr_auto]">
              <span className="font-serif text-sm text-[#6D2932]">01</span>
              <Package className="h-5 w-5 text-[#561C24]" />
              <span><span className="block text-sm font-semibold text-[#561C24]">Tour Packages</span><span className="mt-1 block text-xs leading-5 text-[#5f4c48]">Explore curated Bicol destinations with thoughtfully planned itineraries.</span></span>
              <span className="col-span-3 ml-12 inline-flex items-center gap-2 text-xs font-semibold text-[#561C24] transition group-hover:text-[#6D2932] lg:col-span-1 lg:ml-0">Explore tours <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
            <Link to="/car-rentals" onClick={() => window.scrollTo(0, 0)} className="group grid grid-cols-[1.5rem_1.5rem_1fr] items-center gap-2 py-5 sm:gap-4 lg:grid-cols-[2.5rem_2rem_1fr_auto]">
              <span className="font-serif text-sm text-[#6D2932]">02</span>
              <Car className="h-5 w-5 text-[#561C24]" />
              <span><span className="block text-sm font-semibold text-[#561C24]">Car Rentals</span><span className="mt-1 block text-xs leading-5 text-[#5f4c48]">Get around Bicol comfortably with flexible rental options for your plans.</span></span>
              <span className="col-span-3 ml-12 inline-flex items-center gap-2 text-xs font-semibold text-[#561C24] transition group-hover:text-[#6D2932] lg:col-span-1 lg:ml-0">Browse rentals <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
            <Link to="/customize" onClick={() => window.scrollTo(0, 0)} className="group grid grid-cols-[1.5rem_1.5rem_1fr] items-center gap-2 py-5 sm:gap-4 lg:grid-cols-[2.5rem_2rem_1fr_auto]">
              <span className="font-serif text-sm text-[#6D2932]">03</span>
              <SlidersHorizontal className="h-5 w-5 text-[#561C24]" />
              <span><span className="block text-sm font-semibold text-[#561C24]">Customize Trip</span><span className="mt-1 block text-xs leading-5 text-[#5f4c48]">Tell us what you want to experience and we&rsquo;ll help shape the journey.</span></span>
              <span className="col-span-3 ml-12 inline-flex items-center gap-2 text-xs font-semibold text-[#561C24] transition group-hover:text-[#6D2932] lg:col-span-1 lg:ml-0">Plan your trip <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(125deg,#fffdf9_0%,#fffaf5_55%,#fff4e8_100%)] px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-[0.9fr_1fr]">
          <div className="flex flex-col items-start justify-center py-9 sm:py-12 lg:px-10 lg:py-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D2932]">Around Bicol</p>
            <h2 className="mt-3 text-4xl font-normal leading-tight text-[#561C24] sm:text-5xl" style={{ fontFamily: "'Bodoni MT', 'Didot', 'Times New Roman', serif" }}>Take a Tuktrip.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#5f4c48]">See Bicol from the side roads, with time for the stops along the way.</p>
            <Link to={tukTripPackageLink} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#561C24] px-5 py-3 text-sm font-semibold text-[#fff7ed] shadow-sm transition hover:bg-[#6D2932]">
              View Tuktrip package <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className={`grid min-h-[240px] w-full max-w-[36rem] justify-self-end gap-2 rounded-2xl border border-[#fed7b8]/70 bg-[#561C24] p-2 shadow-[0_16px_34px_rgba(86,28,36,0.18)] sm:min-h-[320px] lg:min-h-[380px] ${tukTripImages.length > 1 ? 'grid-cols-[1.45fr_0.75fr] grid-rows-2' : 'grid-cols-1'}`}>
            <style>{`@keyframes tuktrip-photo-drift { from { transform: scale(1); } to { transform: scale(1.055); } }`}</style>
            <div className={`relative min-h-0 overflow-hidden ${tukTripImages.length > 1 ? 'row-span-2' : ''}`}>
              {tukTripImages.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt="Tuk-tuk ride through Bicol"
                  onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.style.display = 'none'; }}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${index === tukTripImageIndex ? 'opacity-100 motion-safe:animate-[tuktrip-photo-drift_18s_ease-in-out_infinite_alternate] motion-reduce:animate-none' : 'opacity-0'}`}
                />
              ))}
            </div>
            {tukTripImages.length > 1 && (
              <>
                <div className="relative min-h-0 overflow-hidden">
                  <img src={tukTripImages[(tukTripImageIndex + 1) % tukTripImages.length]} alt="Tuktrip vehicle on a Bicol route" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover" />
                </div>
                {tukTripImages.length > 2 && (
                  <div className="relative min-h-0 overflow-hidden">
                    <img src={tukTripImages[(tukTripImageIndex + 2) % tukTripImages.length]} alt="Another view from a Tuktrip ride" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
