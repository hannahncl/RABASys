import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, Compass, MapPin, Star, Users } from 'lucide-react';
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
      <section className="relative isolate mx-4 mt-4 overflow-hidden rounded-3xl bg-[#2d2a24] text-white shadow-[0_18px_45px_rgba(79,60,39,0.16)] sm:mx-6 lg:mx-8">
        <img src="/hero-mayon.jpg" alt="Mayon Volcano and a Bicol landscape" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#211b17]/90 via-[#2d2a24]/65 to-[#2d2a24]/20" />
        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-8 py-16 sm:min-h-[460px] sm:px-12 lg:px-16">
          <div className="max-w-2xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ead7b4]">RABAS Travel &amp; Tours</p>
            <h1 className="max-w-xl text-4xl font-medium leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Your next great story starts here.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
              Discover beautiful places in Bicol with thoughtfully planned tours, flexible travel options, and local guidance every step of the way.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/packages" className="inline-flex items-center gap-2 rounded-full bg-[#6b1022] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(74,8,24,0.28)] transition hover:bg-[#841b31]">
                Book Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/customize" className="inline-flex items-center gap-2 rounded-full border border-white/45 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Plan a Custom Trip
              </Link>
            </div>
          </div>

        </div>
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

      <section className="relative flex min-h-[calc(100vh-80px)] items-start overflow-hidden border-y border-[#ead8d8] bg-[linear-gradient(135deg,#fffaf9_0%,#f8eeee_52%,#fff8f4_100%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#f1dce0]/75 blur-3xl animate-pulse" />
          <span className="absolute right-[-6rem] top-40 h-80 w-80 rounded-full bg-[#f5e8e3]/80 blur-3xl animate-pulse [animation-delay:900ms]" />
          <div className="absolute left-[8%] right-[8%] top-[47%] border-t border-dashed border-[#d6b8bd]/60" />
          <span className="absolute left-[18%] top-[calc(47%-5px)] h-2.5 w-2.5 rounded-full bg-[#7a1428] shadow-[0_0_0_6px_rgba(122,20,40,0.12)] animate-[bounce_4s_ease-in-out_infinite]" />
          <span className="absolute left-[67%] top-[calc(47%-5px)] h-2.5 w-2.5 rounded-full bg-[#b47b68] shadow-[0_0_0_6px_rgba(180,123,104,0.14)] animate-[bounce_4s_ease-in-out_infinite] [animation-delay:1.2s]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div>
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8b4a55]">Find your next escape</p>
              <h2 className="mt-0 text-3xl font-medium tracking-[-0.025em] text-[#4a1020] sm:text-4xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Featured tour packages.</h2>
            </div>
            <Link to="/packages" className="hidden items-center gap-2 text-sm font-bold text-[#76172a] transition hover:text-[#a13b4c] sm:inline-flex">View all packages <ArrowRight className="h-4 w-4" /></Link>
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
                  className="group relative flex h-full w-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-[3px] hover:border-[#b56c78] hover:shadow-[0_14px_32px_rgba(91,16,35,0.13)]"
                  style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e8d5d6', boxShadow: '0 4px 16px rgba(91,16,35,0.06)', fontFamily: "'Inter', sans-serif" }}
                >
                  <div className="relative h-[240px] w-full overflow-hidden bg-[#fcf6f5]">
                    {pkgId && !String(pkgId).startsWith('fallback-') && (
                      <FavoriteButton itemId={pkgId} itemType="tour" className="absolute right-3 top-3 z-10 shadow-sm" />
                    )}
                    <img
                      src={imageForPackage(pkg, index)}
                      alt={packageTitle}
                      onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackPackages[index % fallbackPackages.length].image; }}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#351018]/35 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
                    <h3 className="mb-1 text-sm font-semibold leading-snug text-[#3d1b22]" style={{ letterSpacing: '0.02em' }}>{packageTitle}</h3>
                    <div className="mb-2 flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#a87543] text-[#a87543]" />
                        <span className="text-xs font-bold text-[#4a1020]">{Number(pkg.rating) > 0 ? Number(pkg.rating).toFixed(1) : 'New'}</span>
                      </div>
                      <span className="text-[10px] font-medium text-[#917b78]">
                        {Number(pkg.reviewsCount || pkg.reviews_count) > 0
                          ? `(${Number(pkg.reviewsCount || pkg.reviews_count)} ${Number(pkg.reviewsCount || pkg.reviews_count) === 1 ? 'review' : 'reviews'})`
                          : 'No reviews yet'}
                      </span>
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-3.5 border-t border-[#efdfdf] pt-4 text-[11px] font-medium text-[#514346]">
                      <div className="flex min-w-0 items-center gap-2">
                        {isJoiner ? <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#861c32]" /> : <Clock className="h-3.5 w-3.5 shrink-0 text-[#861c32]" />}
                        <span className="truncate">{isJoiner ? packageDate(availability?.departureDate || pkg.joinerDate || pkg.joiner_date) : (pkg.duration || 'Duration TBA')}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <Users className="h-3.5 w-3.5 shrink-0 text-[#861c32]" />
                        <span className="truncate">{isJoiner
                          ? (availability ? (availability.bookingOpen ? `${availability.remainingSlots} ${availability.remainingSlots === 1 ? 'spot' : 'spots'} left` : 'Booking closed') : 'Availability loading')
                          : (pkg.maximumCapacity ? `Up to ${pkg.maximumCapacity} guests` : 'Flexible group size')}</span>
                      </div>
                    </div>
                    <div className="mb-4 mt-5 h-px bg-[#efdfdf]" />
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div>
                        <span className="mr-1 text-lg font-semibold text-[#5a1023]">₱{Number(pkg.price || 0).toLocaleString()}</span>
                        <span className="text-[9px] font-medium tracking-[0.06em] text-[#765b5f]">/ person</span>
                      </div>
                      <Link to={bookingLink} className="rounded-[3px] border border-[#681326] bg-[#681326] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_12px_rgba(104,19,38,0.16)] transition-all duration-300 hover:border-[#8c263b] hover:bg-[#8c263b]" style={{ whiteSpace: 'nowrap' }}>
                        Book Now
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

      <section className="relative isolate overflow-hidden border-y border-[#57101f] bg-[linear-gradient(120deg,#4b0d1b_0%,#751a2d_52%,#4b0d1b_100%)]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-56 left-[10%] h-96 w-96 rounded-full bg-[#a94455]/20 blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-16">
          <div className="relative flex flex-col gap-8 rounded-2xl border border-[#ead7d5] bg-[#fffaf8] p-6 shadow-[0_18px_42px_rgba(35,4,13,0.24)] sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b3547]">The RABAS difference</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#4a1020]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Why travel with us?</h2>
              <p className="mt-3 text-sm leading-6 text-[#6b6255]">From the first idea to the journey home, we make exploring Bicol feel easier, warmer, and more personal.</p>
            </div>
            <div className="grid flex-1 gap-5 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-4">
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f4e3e5] text-[#7a1428] transition group-hover:scale-110"><Compass className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#4a1020]">Curated trips</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Thoughtful Bicol itineraries.</p></div>
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f4e3e5] text-[#7a1428] transition group-hover:scale-110"><MapPin className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#4a1020]">Local guidance</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Routes shaped by locals.</p></div>
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f4e3e5] text-[#7a1428] transition group-hover:scale-110"><ArrowRight className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#4a1020]">Easy booking</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Clear options from start to finish.</p></div>
              <div className="group"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f4e3e5] text-[#7a1428] transition group-hover:scale-110"><Users className="h-4 w-4" /></div><h3 className="text-xs font-bold text-[#4a1020]">Travel support</h3><p className="mt-1 text-[11px] leading-5 text-[#6b6255]">Help whenever you need it.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ead8d8] bg-[linear-gradient(180deg,#fffaf9_0%,#f8eeee_100%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:px-12 lg:py-24">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b4a55]">Travel made personal</p>
            <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#4a1020]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>More than a destination.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#6b6255]">From the first idea to the moment you arrive home, RABAS helps make every detail feel easier, warmer, and worth remembering.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div><Users className="h-5 w-5 text-[#7a1428]" /><h3 className="mt-3 text-sm font-bold text-[#4a1020]">Local perspective</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Routes shaped by people who know the places best.</p></div>
              <div><Compass className="h-5 w-5 text-[#7a1428]" /><h3 className="mt-3 text-sm font-bold text-[#4a1020]">Easy planning</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Clear options for tours, rentals, and custom trips.</p></div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-[#d9b7bd] bg-[#4a1020] p-1 shadow-[0_18px_45px_rgba(79,16,32,0.2)]">
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
