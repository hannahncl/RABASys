import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Handshake, MapPin, Route, ShieldCheck, Users } from 'lucide-react';

const values = [
  {
    icon: Route,
    title: 'Tailored Trips',
    text: 'Itineraries are shaped around pace, purpose, group size, and preferred destinations.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable Care',
    text: 'Trips are handled with practical planning, clear coordination, and safety in mind.',
  },
  {
    icon: Handshake,
    title: 'Local Network',
    text: 'We work with regional guides and local partners who know the communities firsthand.',
  },
];

const steps = [
  'Understand traveler needs',
  'Plan routes and timing',
  'Coordinate guides and transport',
  'Support the trip experience',
];

const destinations = [
  { name: 'Albay', image: '/ALBAY.jpg' },
  { name: 'Calaguas', image: '/CALAGUAS.jpg' },
  { name: 'Caramoan', image: '/CARAMOAN.jpg' },
  { name: 'Matnog', image: '/MATNOG.jpg' },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white pb-20 text-[#1a1a1a]">
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid items-end gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b0a68e]">
              Bicol-Based Travel Planning
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-[0.02em] text-[#1a1a1a] sm:text-4xl">
              RABAS Travel and Tour Services
            </h1>
            <p className="mt-5 text-sm leading-7 text-[#4a453b]">
              Rabas Travel and Tours is headquartered in Albay, Philippines, creating personalized travel experiences for domestic and international travelers. We design guided trips, custom packages, and local routes built around comfort, clarity, and care.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 rounded border border-[#2d2a24] bg-[#2d2a24] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#f7f4ef] transition-colors hover:bg-transparent hover:text-[#2d2a24]"
              >
                View Packages
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/customize"
                className="inline-flex items-center gap-2 rounded border border-[#e0dbd0] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4a453b] transition-colors hover:bg-[#fcfbf9]"
              >
                Customize Trip
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {destinations.map((destination, index) => (
              <div
                key={destination.name}
                className={`group relative overflow-hidden rounded-md border border-[#e0dbd0] bg-[#fcfbf9] ${index === 0 ? 'row-span-2 min-h-[24rem]' : 'min-h-[11.5rem]'}`}
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-semibold">{destination.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#eae5db] bg-[#fcfbf9]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 sm:px-8 md:grid-cols-3 lg:px-12">
          {values.map((value) => (
            <div key={value.title} className="rounded-md border border-[#e0dbd0] bg-white p-5">
              <value.icon className="mb-4 h-5 w-5 text-[#b0a68e]" />
              <h2 className="text-sm font-bold text-[#1a1a1a]">{value.title}</h2>
              <p className="mt-2 text-xs leading-6 text-[#6b6255]">{value.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b0a68e]">
            How We Work
          </p>
          <h2 className="text-2xl font-bold tracking-[0.02em] text-[#1a1a1a]">
            Planned simply, handled carefully.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#4a453b]">
            Our process keeps each trip easy to understand before travel starts. Guests know the route, timing, inclusions, and support points ahead of the journey.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-4 rounded-md border border-[#e0dbd0] bg-white p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d6cfc2] bg-[#fcfbf9] text-xs font-bold text-[#6b6255]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-sm font-semibold text-[#2d2a24]">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid overflow-hidden rounded-md border border-[#e0dbd0] bg-[#2d2a24] md:grid-cols-[0.9fr_1.1fr]">
          <div className="min-h-[18rem]">
            <img src="/SORSOGON.jpg" alt="Sorsogon destination" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center p-6 text-[#f7f4ef] sm:p-8">
            <Compass className="mb-5 h-6 w-6 text-[#c4b99a]" />
            <h2 className="text-2xl font-bold tracking-[0.02em]">Guides, partners, and travel professionals.</h2>
            <p className="mt-4 text-sm leading-7 text-[#d6cfc2]">
              Our team includes DOT-accredited regional tour guides, local community guides, and travel coordinators who share the same focus on culture, service, and dependable guest care.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d6cfc2]">
              <span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Solo Travelers</span>
              <span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Families</span>
              <span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Groups</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
