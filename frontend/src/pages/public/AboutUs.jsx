import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const avatarGradients = [
  'linear-gradient(135deg, #2d2a24 0%, #5a5347 100%)',
  'linear-gradient(135deg, #3a3631 0%, #6b6255 100%)',
  'linear-gradient(135deg, #1a1a1a 0%, #4a453b 100%)',
  'linear-gradient(135deg, #2d2a24 0%, #7a7265 100%)',
  'linear-gradient(135deg, #3d3d36 0%, #555550 100%)',
  'linear-gradient(135deg, #1a1a1a 0%, #3a3631 100%)',
];

const founderProfile = {
  id: 'rikka-founder',
  name: 'Rikka',
  roleLabel: 'CEO & Founder',
  yearsExperience: null,
  languageSpoken: '',
  description: 'DOT REGIONAL TOUR GUIDE, JUST A NORMAL GIRL WHO DREAM TO HAVE HER OWN BUSINESS.',
  profilePicture: '/rikka-founder.jpg',
};

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

  useEffect(() => {
    if (!selectedGuide) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedGuide(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedGuide]);

  return (
    <div className="min-h-screen bg-white pb-20 text-[#1a1a1a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── FOUNDER STORY ── */}
      <section className="w-full pb-20">
        <div className="mx-4 mt-4 grid min-h-[420px] overflow-hidden rounded-3xl shadow-[0_18px_45px_rgba(79,60,39,0.16)] sm:mx-6 sm:min-h-[460px] lg:mx-8 lg:grid-cols-2">
          <div className="flex min-h-[300px] items-center justify-center bg-[#f5f0e6] px-8 py-14 sm:min-h-[400px] sm:px-14 lg:min-h-full lg:px-16">
            <img
              src="/White%20RABAS%20Travel%20Logo.png"
              alt="RABAS Travel and Tours Services logo"
              className="h-auto w-full max-w-2xl object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(24%) saturate(1360%) hue-rotate(347deg) brightness(93%) contrast(88%)' }}
            />
          </div>
          <div className="flex min-h-[360px] min-w-0 items-center bg-[#f5f0e6] px-7 py-14 sm:px-12 lg:min-h-full lg:px-14 xl:px-20">
            <div className="min-w-0 max-w-2xl">
              <p
                className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f8576]"
              >
                Discover Bicol
              </p>
              <h2
                className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium uppercase leading-[1.05] tracking-[-0.025em] text-black"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                RABAS Travel and Tours Services
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#4a453b] sm:text-lg">
                Thoughtfully planned Bicol journeys, shaped by local knowledge and Filipino hospitality.
              </p>
              <Link
                to="/packages"
                className="mt-7 inline-flex max-w-full items-center justify-center border border-[#8f8576] px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2d2a24] transition-colors hover:bg-[#2d2a24] hover:text-white"
              >
                Explore our packages
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR MISSION ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="grid overflow-hidden rounded-2xl border border-[#e6dfd3] bg-[#faf8f5] lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-between bg-[#603724] px-7 py-9 text-white sm:px-10 sm:py-12 lg:px-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">What guides us</p>
            <div className="mt-8">
              <p className="text-sm font-medium text-[#ead7b4]">Our Mission</p>
              <h2
                className="mt-3 max-w-sm text-3xl font-medium leading-tight tracking-[-0.03em] sm:text-4xl"
                style={{ fontFamily: "'Outfit', Georgia, serif" }}
              >
                Travel that feels like coming home.
              </h2>
            </div>
          </div>
          <div className="px-7 py-9 sm:px-10 sm:py-12 lg:px-14">
            <p className="max-w-2xl text-sm leading-7 text-[#4a453b] sm:text-base">
              We create thoughtful, high-quality trips for every kind of traveler, grounded in local knowledge and Filipino hospitality. With accredited guides, local communities, and trusted partners, we make each journey personal, safe, and seamless.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ['Personal', 'Trips shaped around each traveler.'],
                ['Locally rooted', 'Made with guides and community partners.'],
                ['Handled with care', 'Safety and service at every step.'],
              ].map(([title, description]) => (
                <div key={title} className="border-t border-[#d6cfc2] pt-4">
                  <h3 className="text-xs font-semibold text-[#603724]">{title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#6b6255]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR TEAM ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="rounded-2xl bg-[#faf8f5] px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <p
              className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#a09888]"
              style={{ textTransform: 'uppercase' }}
            >
              The People Behind RABAS
            </p>
            <h2
              className="mb-6 text-[30px] font-bold leading-[1.2] tracking-tight text-[#1a1a1a] sm:text-[36px]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              Our Team
            </h2>
            <p className="text-[14px] leading-[1.85] text-[#4a453b]">
              At RABAS – Travel and Tours Services, our strength lies in our people. Our team is composed of DOT-accredited regional tour guides, experienced local community guides, and dedicated travel professionals who share the same passion for tourism, culture, and service excellence.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {[founderProfile, ...guides].map((guide, i) => {
                  const initials = `${guide.firstName?.[0] || ''}${guide.lastName?.[0] || ''}`.toUpperCase()
                    || guide.name?.slice(0, 2).toUpperCase()
                    || 'TG';
                  return (
                    <button
                      key={guide.id}
                      type="button"
                      onClick={() => setSelectedGuide(guide)}
                      aria-label={`View ${guide.name}'s ${guide.roleLabel || 'tour guide'} profile`}
                      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#ddd6c8] bg-white text-left transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#603724]"
                    >
                      <div
                        className="relative flex aspect-square items-center justify-center overflow-hidden"
                        style={{ background: '#faf8f5' }}
                      >
                        <div
                          className="relative flex items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-105"
                          style={{
                            width: '55%',
                            paddingBottom: '55%',
                            background: avatarGradients[i % avatarGradients.length],
                          }}
                        >
                          <span
                            className="absolute inset-0 flex select-none items-center justify-center font-bold text-white"
                            style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.03em' }}
                          >
                            {initials}
                          </span>
                        </div>
                        {guide.profilePicture && (
                          <img
                            src={guide.profilePicture}
                            alt={guide.name}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(event) => { event.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-4 text-center">
                        <p
                          className="mb-1 text-[10px] font-medium tracking-[0.1em] text-[#a09888]"
                          style={{ textTransform: 'uppercase' }}
                        >
                          {guide.roleLabel || 'Tour Guide'}
                        </p>
                        <h3
                          className="text-[16px] font-semibold leading-snug text-[#1a1a1a]"
                          style={{ fontFamily: "'Outfit', Georgia, serif" }}
                        >
                          {guide.name}
                        </h3>
                      </div>
                    </button>
                  );
                })}
                {loading && [...Array(4)].map((_, i) => (
                  <div key={`guide-skeleton-${i}`} className="animate-pulse">
                    <div className="aspect-square rounded-xl bg-[#f0ece4]" />
                    <div className="mt-4 space-y-2 px-1">
                      <div className="h-2.5 w-16 rounded bg-[#e8e3da]" />
                      <div className="h-4 w-28 rounded bg-[#e8e3da]" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {selectedGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={() => setSelectedGuide(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-guide-profile-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#faf8f5] p-6 shadow-2xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGuide(null)}
              aria-label="Close tour guide profile"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#6b6255] transition-colors hover:bg-[#eee8dc]"
            >
              ×
            </button>
            {selectedGuide.profilePicture ? (
              <img
                src={selectedGuide.profilePicture}
                alt={selectedGuide.name}
                className="mx-auto mb-5 h-28 w-28 rounded-full object-cover"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-[#e8dfce] text-2xl font-semibold text-[#603724]">
                {`${selectedGuide.firstName?.[0] || ''}${selectedGuide.lastName?.[0] || ''}`.toUpperCase()
                  || selectedGuide.name?.slice(0, 2).toUpperCase()
                  || 'TG'}
              </div>
            )}
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a09888]">
              {selectedGuide.roleLabel || 'Tour Guide'}
            </p>
            <h2
              id="tour-guide-profile-title"
              className="mt-2 text-center text-2xl font-semibold text-[#1a1a1a]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              {selectedGuide.name}
            </h2>
            <div className="mt-6 space-y-4 border-t border-[#ddd6c8] pt-5 text-sm leading-6 text-[#4a453b]">
              {selectedGuide.yearsExperience !== null && selectedGuide.yearsExperience !== undefined && (
                <p>
                  <span className="font-semibold text-[#1a1a1a]">Experience: </span>
                  {selectedGuide.yearsExperience || 0} {Number(selectedGuide.yearsExperience) === 1 ? 'year' : 'years'}
                </p>
              )}
              {selectedGuide.languageSpoken && (
                <p>
                  <span className="font-semibold text-[#1a1a1a]">Languages: </span>
                  {selectedGuide.languageSpoken}
                </p>
              )}
              <p>
                <span className="font-semibold text-[#1a1a1a]">About: </span>
                {selectedGuide.description || 'No profile description provided.'}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AboutUs;
