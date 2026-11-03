import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-[#fffdf9] pb-20 text-[#561C24]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── FOUNDER STORY ── */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#fffdf9_0%,#fff8f1_62%,#fff4e8_100%)] px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#fed7b8]/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-[#C7B7A3]/60 bg-[#fffaf4] shadow-[0_22px_60px_rgba(86,28,36,0.12)] lg:min-h-[480px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#561C24] to-[#6D2932] px-8 py-12 sm:min-h-[360px] sm:px-14 lg:min-h-full lg:px-16">
            <span className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-[#fed7b8]/20" />
            <span className="absolute -right-2 -top-12 h-48 w-48 rounded-full border border-[#fed7b8]/15" />
            <img
              src="/White%20RABAS%20Travel%20Logo.png"
              alt="RABAS Travel and Tours Services logo"
              className="relative h-auto w-full max-w-md object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
            />
          </div>
          <div className="relative flex min-h-[360px] min-w-0 items-center bg-[#fffaf4] px-7 py-12 sm:px-12 lg:min-h-full lg:px-14 xl:px-20">
            <div className="min-w-0 max-w-2xl">
              <h2
                className="text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[0.98] tracking-[-0.035em] text-[#561C24]"
                style={{ fontFamily: "'Bodoni MT', 'Didot', 'Times New Roman', serif" }}
              >
                Rabas <span className="italic text-[#6D2932]">Travel and Tours Services</span>
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#5f4c48] sm:text-lg">
                Thoughtfully planned Bicol journeys, shaped by local knowledge and Filipino hospitality.
              </p>
              <Link
                to="/packages"
                className="mt-8 inline-flex max-w-full items-center justify-center rounded-full bg-[#561C24] px-6 py-3 text-center text-xs font-semibold text-[#fff7ed] shadow-[0_8px_20px_rgba(86,28,36,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6D2932]"
              >
                Explore our packages
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR MISSION ── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#561C24] to-[#6D2932] px-6 py-12 text-[#fff7ed] sm:px-8 sm:py-16">
        <span className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 font-serif text-[28rem] leading-none text-white/[0.035]">“</span>
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative flex min-h-[220px] flex-col justify-between border-l-2 border-[#fed7b8]/60 pl-6 sm:pl-8">
            <span className="absolute -bottom-16 -right-12 h-48 w-48 rounded-full border border-[#fed7b8]/20" />
            <div className="mt-8">
              <p className="text-sm font-medium text-[#fed7b8]">Our Mission</p>
              <h2
                className="relative mt-3 max-w-sm text-3xl font-normal leading-tight tracking-[-0.03em] sm:text-4xl"
                style={{ fontFamily: "'Bodoni MT', 'Didot', Georgia, serif" }}
              >
                Travel that feels like coming home.
              </h2>
            </div>
          </div>
          <div className="lg:pl-10">
            <p className="max-w-2xl text-sm leading-7 text-[#fff7ed]/90 sm:text-base">
              We create thoughtful, high-quality trips for every kind of traveler, grounded in local knowledge and Filipino hospitality. With accredited guides, local communities, and trusted partners, we make each journey personal, safe, and seamless.
            </p>
            <div className="mt-8 grid gap-5 border-t border-[#fed7b8]/30 pt-5 sm:grid-cols-3">
              {[
                ['Personal', 'Trips shaped around each traveler.'],
                ['Locally rooted', 'Made with guides and community partners.'],
                ['Handled with care', 'Safety and service at every step.'],
              ].map(([title, description]) => (
                <div key={title} className="border-l border-[#fed7b8]/50 pl-4">
                  <h3 className="text-xs font-semibold text-[#fed7b8]">{title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#fff7ed]/75">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR TEAM ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        <div>
          <div className="mx-auto grid max-w-6xl gap-5 border-b border-[#C7B7A3]/70 pb-7 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <h2
              className="mb-0 text-[42px] font-normal leading-[1.05] tracking-tight text-[#561C24] sm:text-[54px]"
              style={{ fontFamily: "'Bodoni MT', 'Didot', Georgia, serif" }}
            >
              Our Team
            </h2>
            <p className="text-[14px] leading-[1.85] text-[#5f4c48]">
              At RABAS – Travel and Tours Services, our strength lies in our people. Our team is composed of DOT-accredited regional tour guides, experienced local community guides, and dedicated travel professionals who share the same passion for tourism, culture, and service excellence.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-4">
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
                      className="group flex h-full w-full flex-col overflow-hidden border-b border-[#C7B7A3]/70 bg-transparent pb-3 text-left transition duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#561C24]"
                    >
                      <div
                        className="relative flex aspect-[4/4.5] items-center justify-center overflow-hidden rounded-t-[45%]"
                        style={{ background: '#fff4e8' }}
                      >
                        <div
                          className="relative flex items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-105"
                          style={{
                            width: '55%',
                            paddingBottom: '55%',
                            background: ['linear-gradient(135deg,#561C24 0%,#6D2932 100%)','linear-gradient(135deg,#6D2932 0%,#C7B7A3 100%)','linear-gradient(135deg,#561C24 0%,#C7B7A3 100%)'][i % 3],
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
                          className="mb-1 text-[10px] font-semibold tracking-[0.1em] text-[#6D2932]"
                          style={{ textTransform: 'uppercase' }}
                        >
                          {guide.roleLabel || 'Tour Guide'}
                        </p>
                        <h3
                          className="text-[16px] font-semibold leading-snug text-[#561C24]"
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
                    <div className="aspect-square rounded-xl bg-[#f4e9dc]" />
                    <div className="mt-4 space-y-2 px-1">
                      <div className="h-2.5 w-16 rounded bg-[#ead8c7]" />
                      <div className="h-4 w-28 rounded bg-[#ead8c7]" />
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
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#C7B7A3]/60 bg-[#fffaf4] p-6 text-[#561C24] shadow-2xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGuide(null)}
              aria-label="Close tour guide profile"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#6D2932] transition-colors hover:bg-[#f4e9dc]"
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
              <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#561C24] to-[#6D2932] text-2xl font-semibold text-[#fff7ed]">
                {`${selectedGuide.firstName?.[0] || ''}${selectedGuide.lastName?.[0] || ''}`.toUpperCase()
                  || selectedGuide.name?.slice(0, 2).toUpperCase()
                  || 'TG'}
              </div>
            )}
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6D2932]">
              {selectedGuide.roleLabel || 'Tour Guide'}
            </p>
            <h2
              id="tour-guide-profile-title"
              className="mt-2 text-center text-2xl font-semibold text-[#561C24]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              {selectedGuide.name}
            </h2>
            <div className="mt-6 space-y-4 border-t border-[#C7B7A3]/60 pt-5 text-sm leading-6 text-[#5f4c48]">
              {selectedGuide.yearsExperience !== null && selectedGuide.yearsExperience !== undefined && (
                <p>
                  <span className="font-semibold text-[#561C24]">Experience: </span>
                  {selectedGuide.yearsExperience || 0} {Number(selectedGuide.yearsExperience) === 1 ? 'year' : 'years'}
                </p>
              )}
              {selectedGuide.languageSpoken && (
                <p>
                  <span className="font-semibold text-[#561C24]">Languages: </span>
                  {selectedGuide.languageSpoken}
                </p>
              )}
              <p>
                <span className="font-semibold text-[#561C24]">About: </span>
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
