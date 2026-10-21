import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Route, ShieldCheck, Globe, Users } from 'lucide-react';

const features = [
  {
    icon: Route,
    title: 'Personalized Journeys',
    text: 'Tailor-made itineraries are crafted around each traveler’s interests, schedule, pace, and purpose.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality and Care',
    text: 'We serve solo travelers, joiners, families, and groups with thoughtful planning, safety, and dependable coordination.',
  },
  {
    icon: Globe,
    title: 'Authentic Bicol',
    text: 'Our accredited guides and trusted local partners share the natural beauty, culture, and people of Bicol.',
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
              RABAS Travel and Tours Services is a Bicol-based travel and tourism company headquartered in Albay, Philippines. Founded by Rikka, known as Bicolanang Rabas, the company grew from local tour guiding into a full-service travel and tours operation built on deep local knowledge and authentic experiences. As a sole proprietorship, we create personalized and premium journeys for domestic and international travelers through professional guiding, customized packages, and trusted local partners - with the warmth, professionalism, and excellence of Filipino hospitality.
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

      {/* ── FOUNDER STORY ── */}
      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 rounded-2xl bg-[#faf8f5] p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:gap-16 lg:p-14">
          <div className="space-y-5">
            <p
              className="text-[11px] font-semibold tracking-[0.18em] text-[#a09888]"
              style={{ textTransform: 'uppercase' }}
            >
              Meet the Founder
            </p>
            <h2
              className="text-[30px] font-bold leading-[1.2] tracking-tight text-[#1a1a1a] sm:text-[36px]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              Hi, I’m Ate Rikka!
            </h2>
            <p className="text-[14px] leading-[1.85] text-[#4a453b]">
              The proud founder of RABAS Travel &amp; Tours Services and a DOT Regional Tour Guide. I’m just an ordinary girl with big dreams and a passion for travel, adventure, and exploring the beauty of the Philippines. What started as a simple dream of having my own business has turned into a journey of sharing unforgettable travel experiences with others. Through RABAS, I aim to showcase the breathtaking destinations of the Bicol Region, promote local tourism, and help travelers create beautiful memories. My journey is a reminder that with passion, hard work, and determination, even the simplest dreams can turn into something extraordinary.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <img
              src="/rikka-founder.jpg"
              alt="Ate Rikka, founder of RABAS Travel & Tours Services"
              className="aspect-[3/4] w-full max-w-md rounded-xl object-cover object-top shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* ── OUR MISSION ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="rounded-2xl bg-[#faf8f5] px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <p
              className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#a09888]"
              style={{ textTransform: 'uppercase' }}
            >
              What Guides Us
            </p>
            <h2
              className="mb-6 text-[30px] font-bold leading-[1.2] tracking-tight text-[#1a1a1a] sm:text-[36px]"
              style={{ fontFamily: "'Outfit', Georgia, serif" }}
            >
              Our Mission
            </h2>
            <div className="space-y-5 text-[14px] leading-[1.85] text-[#4a453b]">
              <p>
                Our mission is to provide personalized, quality, and premium travel and tour services rooted in local expertise and delivered through the Filipino brand of service excellence. We are committed to designing unique, well-curated travel experiences for solo travelers, joiners, families, and groups, ensuring consistent standards of care, safety, and professionalism across every journey.
              </p>
              <p>
                Through collaboration with accredited guides, local communities, and trusted partners, we strive to make every travel experience feel seamless and familiar—where destinations may be new, but the hospitality feels like coming back to a place you already belong.
              </p>
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
            <div className="space-y-5 text-[14px] leading-[1.85] text-[#4a453b]">
              <p>
                At RABAS – Travel and Tours Services, our strength lies in our people. Our team is composed of DOT-accredited regional tour guides, experienced local community guides, and dedicated travel professionals who share the same passion for tourism, culture, and service excellence.
              </p>
              <p>
                We collaborate closely with local communities, ensuring authentic storytelling, responsible tourism, and inclusive growth while delivering meaningful travel experiences. Supporting our operations is a reliable network of transportation partners, from skilled drivers and coach operators to logistics coordinators, working alongside our administrative and operations team to ensure smooth, safe, and well-organized journeys.
              </p>
              <p>
                United by a common goal, our team upholds the Filipino brand of service excellence as promoted by the Department of Tourism (DOT), marked by warmth, professionalism, hospitality, and care. Together, we are committed to providing high-quality, legitimate, and memorable travel and tourism services that reflect the true spirit of Bicol and the Philippines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOUR GUIDES ── */}
      <section className="mx-auto max-w-7xl px-6 pt-4 pb-24 sm:px-8 lg:px-12">

        {/* Tour guide directory */}
        <div className="grid gap-6 lg:grid-cols-2 items-end mb-14">
          <div>
            <p
              className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#a09888]"
              style={{ textTransform: 'uppercase' }}
            >
              Tour Guides
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
              Meet Our Tour Guides
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
                <div
                  key={guide.id}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#ddd6c8] bg-white"
                >

                  {/* Portrait area */}
                  <div
                    className="relative aspect-square overflow-hidden flex items-center justify-center"
                    style={{ background: '#faf8f5' }}
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
                    {guide.profilePicture && (
                      <img
                        src={guide.profilePicture}
                        alt={guide.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>

                  {/* Info below the portrait */}
                  <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-4 text-center">
                    <p
                      className="mb-1 text-[10px] font-medium tracking-[0.1em] text-[#a09888]"
                      style={{ textTransform: 'uppercase' }}
                    >
                      Tour Guide
                    </p>
                    <h3
                      className="text-[16px] font-semibold leading-snug text-[#1a1a1a]"
                      style={{ fontFamily: "'Outfit', Georgia, serif" }}
                    >
                      {guide.name}
                    </h3>
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
              Our team brings together DOT-accredited regional tour guides, experienced local community guides, and dedicated travel professionals who share a passion for tourism, culture, and service excellence.
            </p>
          </div>
        )}
      </section>

    </div>
  );
};

export default AboutUs;
