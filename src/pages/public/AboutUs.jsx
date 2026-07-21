import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MoreVertical } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="bg-white min-h-screen text-slate-800">
      {/* ── TOP SECTION: ABOUT US & MONTAGE ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: text content */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-1">
              <span className="text-3xl font-bold text-cyan-500 uppercase tracking-[0.3em] block">
                RABAS TRAVEL AND TOUR SERVICES
              </span>
            </div>

            <span className="text-slate-600 text-sm md:text-base leading-relaxed font-light">
              Rabas – Travel and Tours Services is a Bicol-based travel and tourism company
                headquartered in Albay, Philippines, specializing in personalized and premium travel
                experiences for both domestic and international travelers.
            </span>
            <p></p>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed font-light">
              We provide travel and tour services, professional tour guiding, and customized tour
                package design, focusing on creating tailor-made itineraries that match each
                traveler’s preferences, pace, and purpose. Our services cater to solo travelers,
                joiners, families, and small to large groups, ensuring a high standard of quality,
                safety, and care across every journey</p>
        

            <div className="pt-2">
              <Link
                to="/packages"
                className="bg-cyan-500 hover:bg-[#208eb4] text-white text-xs font-extrabold uppercase tracking-widest px-7 py-3.5 rounded-lg shadow-md transition-all inline-block hover:scale-[1.02] cursor-pointer"
              >
                EXPLORE MORE
              </Link>
            </div>
          </div>

          {/* Right Column: Montage matching mockup structure */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div className="relative w-full max-w-[600px] h-[540px]">

              {/* Middle Right Photo (coastal village cliffs) */}
              <div className="absolute top-[50px] right-0 w-[500px] h-[390px] rounded-3xl overflow-hidden shadow-md">
                <img
                  src="https://scontent.fmnl33-2.fna.fbcdn.net/v/t39.30808-6/602335986_122106580341161293_4013693818088048221_n.jpg?stp=dst-jpg_tt6&cstp=mx1620x1620&ctp=s1620x1620&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFQx5FfSVou41zWMREJCZYMVgQjFAPdNVxWBCMUA901XJzrV0ve-LNL-EkbdLkGFx8ldHqgk1ONu329iIAbnyqO&_nc_ohc=8wsAbzvqYvQQ7kNvwH1-1Xt&_nc_oc=AdoHPoto2yL7OE2O4lytnKvJga11L7l4iLDK9yG2dfAiuZOF08GKsQIhEXEyFRAa6fhZGZMP_sACtFWBnOi6SjJl&_nc_zt=23&_nc_ht=scontent.fmnl33-2.fna&_nc_gid=QMPvExXPvJXz3nFx4RrzCA&_nc_ss=7b2a8&oh=00_AQBtx_vPqwDf7DxdHrXH6HzcBotXyi_JXC7sGFEzbd7a1Q&oe=6A63BF52"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── BOTTOM SECTION: MEET OUR TEAM ── */}
      <section className="bg-white border-t border-slate-100 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-3xl font-bold text-cyan-500 uppercase tracking-[0.3em] block">
                MEET OUR TEAM
              </span>

          
            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-light justify-center items-center">
              At Rabas – Travel and Tours Services, our strength lies in our people. Our team is composed of DOT-accredited
                  regional tour guides, experienced local community guides, and dedicated travel professionals who share
                  the same passion for tourism, culture, and service excellence.

            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default AboutUs;
