import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Route, ShieldCheck, Globe, Users, X, Award, Languages } from 'lucide-react';

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

const avatarGradients = [
  'linear-gradient(135deg, #2d2a24 0%, #5a5347 100%)',
  'linear-gradient(135deg, #3a3631 0%, #6b6255 100%)',
  'linear-gradient(135deg, #1a1a1a 0%, #4a453b 100%)',
  'linear-gradient(135deg, #2d2a24 0%, #7a7265 100%)',
  'linear-gradient(135deg, #3d3d36 0%, #555550 100%)',
  'linear-gradient(135deg, #1a1a1a 0%, #3a3631 100%)',
];

const AboutUs = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${API_URL}/tour-guides/about`);
        if (res.ok) setGuides(await res.json());
      } catch {
        /* page still renders fine without data */
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

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

          {/* RIGHT — Logo */}
          <div className="flex items-center justify-center">
            <div className="overflow-hidden w-full" style={{ borderRadius: '12px', maxWidth: '520px' }}>
              <img src="/RABAS LOGO.png" alt="RABAS Travel and Tours Services" className="w-full h-auto block" />
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

      {/* ── MEET THE TEAM ── */}
      <section className="mx-auto max-w-7xl px-6 pt-4 pb-24 sm:px-8 lg:px-12">

        {/* Two-column header — matches the reference photo */}
        <div className="grid gap-6 lg:grid-cols-2 items-end mb-14">
          <div>
            <p
              className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#a09888]"
              style={{ textTransform: 'uppercase' }}
            >
              Our Team
              <span
                className="ml-1.5 inline-flex items-center justify-center rounded-full text-[9px] font-bold"
                style={{ background: '#f5f0e8', color: '#8a7e6e', width: 20, height: 20, verticalAlign: 'middle' }}
              >
                {guides.length || '—'}
              </span>
            </p>
            <h2
              className="text-[30px] font-bold leading-[1.2] tracking-tight text-[#1a1a1a] sm:text-[36px]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              The People Behind the Adventures
            </h2>
          </div>
        </div>

        {/* Team grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-[#f0ece4]" />
                <div className="mt-4 space-y-2 px-1">
                  <div className="h-2.5 w-16 rounded bg-[#e8e3da]" />
                  <div className="h-4 w-28 rounded bg-[#e8e3da]" />
                </div>
              </div>
            ))}
          </div>
        ) : guides.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {guides.map((guide, i) => {
              const initials = `${guide.firstName?.[0] || ''}${guide.lastName?.[0] || ''}`.toUpperCase();
              return (
                <div key={guide.id} className="group">

                  {/* Portrait area */}
                  <div
                    className="relative aspect-square overflow-hidden rounded-xl flex items-center justify-center"
                    style={{ background: '#f0ece4' }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-105"
                      style={{
                        width: '55%',
                        paddingBottom: '55%',
                        position: 'relative',
                        background: avatarGradients[i % avatarGradients.length],
                      }}
                    >
                      <span
                        className="absolute inset-0 flex items-center justify-center text-white font-bold select-none"
                        style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.03em' }}
                      >
                        {initials}
                      </span>
                    </div>
                  </div>

                  {/* Info below the portrait */}
                  <div className="mt-4 px-1">
                    <p
                      className="text-[10px] font-medium tracking-[0.1em] text-[#a09888] mb-1"
                      style={{ textTransform: 'uppercase' }}
                    >
                      Tour Guide
                    </p>
                    <h3
                      className="text-[16px] font-bold text-[#1a1a1a] leading-snug"
                      style={{ fontFamily: "'Outfit', Georgia, serif" }}
                    >
                      {guide.name}
                    </h3>
                  </div>

                  {/* View Details button */}
                  <div className="mt-3 px-1">
                    <button
                      onClick={() => setSelectedGuide(guide)}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-semibold transition-all duration-200 cursor-pointer"
                      style={{
                        background: '#2d2a24',
                        color: '#f7f4ef',
                        letterSpacing: '0.06em',
                        border: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#4a453b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2d2a24';
                      }}
                    >
                      <span style={{ fontSize: '8px', lineHeight: 1 }}>●</span>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#ddd6c8] bg-[#fdfbf7] p-14 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-[#c4bba8]" />
            <h3
              className="mb-2 text-[16px] font-bold text-[#4a453b]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              Our Team is Growing
            </h3>
            <p className="text-[13px] text-[#8a7e6e] max-w-md mx-auto">
              We're building a team of experienced local guides who know Bicol inside and out. Check back soon to meet the people who'll make your trip unforgettable.
            </p>
          </div>
        )}
      </section>

      {/* ── Guide Detail Modal ── */}
      {selectedGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedGuide(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: 'blur(4px)' }} />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
            style={{ animation: 'modalIn 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedGuide(null)}
              className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7a7265] transition-colors hover:bg-[#f0ece4] cursor-pointer"
              style={{ border: 'none', background: 'transparent' }}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header with avatar */}
            <div className="flex flex-col items-center pt-10 pb-6 px-8">
              <div
                className="flex items-center justify-center rounded-full mb-5"
                style={{
                  width: '88px',
                  height: '88px',
                  background: avatarGradients[guides.indexOf(selectedGuide) % avatarGradients.length],
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }}
              >
                <span
                  className="text-white font-bold select-none"
                  style={{ fontSize: '30px', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.03em' }}
                >
                  {`${selectedGuide.firstName?.[0] || ''}${selectedGuide.lastName?.[0] || ''}`.toUpperCase()}
                </span>
              </div>

              <p
                className="text-[10px] font-semibold tracking-[0.14em] text-[#a09888] mb-1"
                style={{ textTransform: 'uppercase' }}
              >
                Tour Guide
              </p>
              <h3
                className="text-[22px] font-bold text-[#1a1a1a] text-center"
                style={{ fontFamily: "'Outfit', Georgia, serif" }}
              >
                {selectedGuide.name}
              </h3>
            </div>

            {/* Divider */}
            <div className="mx-8 h-px bg-[#ebe7df]" />

            {/* Details */}
            <div className="px-8 py-6 space-y-5">

              {/* Description */}
              {selectedGuide.description && (
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.1em] text-[#a09888] mb-1.5" style={{ textTransform: 'uppercase' }}>
                    About
                  </p>
                  <p className="text-[13.5px] leading-[1.75] text-[#4a453b]">
                    {selectedGuide.description}
                  </p>
                </div>
              )}

              {/* Experience & Languages row */}
              <div className="flex gap-4">
                {selectedGuide.yearsExperience > 0 && (
                  <div className="flex-1 rounded-lg p-3.5" style={{ background: '#faf8f5' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Award className="h-3 w-3 text-[#a09888]" />
                      <p className="text-[9px] font-semibold tracking-[0.1em] text-[#a09888]" style={{ textTransform: 'uppercase' }}>
                        Experience
                      </p>
                    </div>
                    <p className="text-[15px] font-bold text-[#1a1a1a]" style={{ fontFamily: "'Outfit', Georgia, serif" }}>
                      {selectedGuide.yearsExperience} {selectedGuide.yearsExperience === 1 ? 'Year' : 'Years'}
                    </p>
                  </div>
                )}

                {selectedGuide.languageSpoken && (
                  <div className="flex-1 rounded-lg p-3.5" style={{ background: '#faf8f5' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Languages className="h-3 w-3 text-[#a09888]" />
                      <p className="text-[9px] font-semibold tracking-[0.1em] text-[#a09888]" style={{ textTransform: 'uppercase' }}>
                        Languages
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Outfit', Georgia, serif" }}>
                      {selectedGuide.languageSpoken}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer action */}
            <div className="px-8 pb-8 pt-2">
              <Link
                to="/customize"
                onClick={() => setSelectedGuide(null)}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[11px] font-semibold transition-all duration-200 no-underline"
                style={{
                  background: '#2d2a24',
                  color: '#f7f4ef',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#4a453b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2d2a24'; }}
              >
                Book a Trip
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal animation */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

    </div>
  );
};

export default AboutUs;
