import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Route, ShieldCheck, Globe } from 'lucide-react';

const features = [
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
    icon: Globe,
    title: 'Local Network',
    text: 'We work with regional guides and local partners who know the communities firsthand.',
  },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white pb-20 text-[#1a1a1a]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* MAIN SECTION — Two-column layout */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="grid items-center gap-14 lg:grid-cols-2">

          {/* LEFT — Text content */}
          <div className="flex flex-col justify-center space-y-6">

            <h1
              className="text-4xl font-bold leading-[1.15] tracking-tight text-[#1a1a1a] sm:text-[42px]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              RABAS Travel and Tour Services
            </h1>

            <p className="text-[15px] leading-[1.85] text-[#4a453b]">
              Rabas Travel and Tours is headquartered in Albay, Philippines, creating personalized travel experiences for domestic and international travelers. We design guided trips, custom packages, and local routes built around comfort, clarity, and care.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 px-6 py-3 text-[10px] font-semibold transition-all duration-300"
                style={{
                  background: '#2d2a24',
                  border: '1px solid #2d2a24',
                  borderRadius: '2px',
                  color: '#f7f4ef',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#2d2a24';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2d2a24';
                  e.currentTarget.style.color = '#f7f4ef';
                }}
              >
                View Packages
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/customize"
                className="inline-flex items-center gap-2 px-6 py-3 text-[10px] font-semibold transition-all duration-300"
                style={{
                  border: '1px solid #2d2a24',
                  borderRadius: '2px',
                  color: '#2d2a24',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2d2a24';
                  e.currentTarget.style.color = '#f7f4ef';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#2d2a24';
                }}
              >
                Customize Trip
              </Link>
            </div>
          </div>

          {/* RIGHT — Logo with yellow background */}
          <div className="flex items-center justify-center">
            <div
              className="overflow-hidden w-full"
              style={{ borderRadius: '12px', maxWidth: '520px' }}
            >
              <img
                src="/RABAS LOGO.png"
                alt="RABAS Travel and Tours Services"
                className="w-full h-auto block"
              />
            </div>
          </div>

        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-[#e8e3da] bg-white p-7 transition-shadow duration-200 hover:shadow-sm"
            >
              <div
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-md text-[#7a7265]"
                style={{ background: '#faf8f5' }}
              >
                <feature.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </div>
              <h3
                className="mb-2 text-[15px] font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Outfit', Georgia, serif" }}
              >
                {feature.title}
              </h3>
              <p className="text-[13px] leading-[1.7] text-[#6b6255]">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
