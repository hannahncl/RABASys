import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPin, Users } from 'lucide-react';
import { packageService } from '../../services/packageService';

const fallbackPackages = [
  { id: 'fallback-albay', title: 'Albay Escape', destination: 'Albay, Bicol', description: 'A relaxed route through volcano views, heritage stops, and local flavors.', price: 2500, image: '/ALBAY.jpg' },
  { id: 'fallback-caramoan', title: 'Caramoan Island Hopping', destination: 'Caramoan, Bicol', description: 'Clear waters, quiet beaches, and a full day made for island discovery.', price: 3800, image: '/CARAMOAN.jpg' },
  { id: 'fallback-calaguas', title: 'Calaguas Weekend', destination: 'Calaguas, Bicol', description: 'Slow mornings and wide-open shores on one of Bicol’s favorite escapes.', price: 4200, image: '/CALAGUAS.jpg' },
];

const featuredDestinations = [
  { name: 'Albay', place: 'Mayon Volcano', image: 'https://images.unsplash.com/photo-1555590858-be28a58c2688?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1200', position: 'center 58%', detail: 'Volcano views, heritage stops, and local flavors.' },
  { name: 'Caramoan', place: 'Island Hopping', image: 'https://qa.visitcamsur.com/assets/img/Beaches/caramoan%20island/1.jpg', position: 'center 62%', detail: 'Clear waters, quiet beaches, and island discovery.' },
  { name: 'Calaguas', place: 'Tinaga Island', image: 'https://static.rappler.com/images/20130508-white-beaches-luzon-calaguas-01.jpg', position: 'center 68%', detail: 'Wide-open shores and slow mornings by the sea.' },
  { name: 'Sorsogon', place: 'Barcelona Church', image: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Barcelona_Church_at_night.jpg', position: 'center 55%', detail: 'Historic landmarks, green landscapes, and local culture.' },
];

const tuktripBackdrop = 'https://images.unsplash.com/photo-1675650721403-a6a1829eb31a?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800';

const imageForPackage = (pkg, index) => {
  if (pkg.image) return pkg.image.startsWith('/') || pkg.image.startsWith('http') ? pkg.image : `/${pkg.image}`;
  return fallbackPackages[index % fallbackPackages.length].image;
};

const Home = () => {
  const [packages, setPackages] = useState(fallbackPackages);
  const [tukTripRun, setTukTripRun] = useState(0);

  useEffect(() => {
    let mounted = true;
    packageService.getAll()
      .then((items) => {
        if (mounted && items.length > 0) {
          setPackages(items.slice(0, 3));
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
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Your next great story starts here.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
              Discover beautiful places in Bicol with thoughtfully planned tours, flexible travel options, and local guidance every step of the way.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/packages" className="inline-flex items-center gap-2 rounded-full bg-[#ead7b4] px-6 py-3 text-sm font-bold text-[#2d2a24] transition hover:bg-white">
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

      <section className="relative flex min-h-[calc(100vh-80px)] items-start overflow-hidden border-y border-[#e5e1da] bg-white">
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
              <h2 className="mt-0 text-5xl font-semibold tracking-[-0.035em] text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Top places to explore.</h2>
            </div>
            <Link to="/packages" className="hidden items-center gap-2 text-sm font-bold text-[#603524] transition hover:text-[#294136] sm:inline-flex">View all destinations <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredDestinations.map((destination) => (
              <Link key={destination.name} to={`/packages?search=${destination.name}`} className="group overflow-hidden rounded-xl border border-[#e3d6c9] bg-[#fffaf5] shadow-[0_10px_24px_rgba(79,60,39,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#b98e72] hover:shadow-[0_16px_30px_rgba(79,60,39,0.15)]">
                <div className="relative h-48 overflow-hidden bg-[#dfe8e3]">
                  <img src={destination.image} alt={`${destination.name}, Bicol`} style={{ objectPosition: destination.position }} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#294136]"><MapPin className="h-3 w-3" /> Bicol</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b5e48]">{destination.place}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{destination.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#6b6255]">{destination.detail}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-3 border-t border-[#e5e1da] pt-6 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#526b7b]"><Compass className="h-4 w-4 text-[#8b5e48]" /> Curated Bicol routes</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#526b7b]"><Users className="h-4 w-4 text-[#8b5e48]" /> Local guidance</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#526b7b]"><MapPin className="h-4 w-4 text-[#8b5e48]" /> Flexible itineraries</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#526b7b]"><ArrowRight className="h-4 w-4 text-[#8b5e48]" /> Easy booking</div>
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

      <section className="border-y border-[#e6dfd3] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:px-12 lg:py-24">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8f8576]">Travel made personal</p>
            <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#2d2a24]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>More than a destination.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#6b6255]">From the first idea to the moment you arrive home, RABAS helps make every detail feel easier, warmer, and worth remembering.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div><Users className="h-5 w-5 text-[#603524]" /><h3 className="mt-3 text-sm font-bold">Local perspective</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Routes shaped by people who know the places best.</p></div>
              <div><Compass className="h-5 w-5 text-[#603524]" /><h3 className="mt-3 text-sm font-bold">Easy planning</h3><p className="mt-1 text-xs leading-5 text-[#6b6255]">Clear options for tours, rentals, and custom trips.</p></div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-[#2d2a24] shadow-[0_18px_45px_rgba(79,60,39,0.16)]">
            <video
              className="h-[22rem] w-full object-cover sm:h-[30rem]"
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
            <h2 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.04em]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Take a Tuktrip.</h2>
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
