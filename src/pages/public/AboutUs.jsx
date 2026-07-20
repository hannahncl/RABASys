import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MoreVertical } from 'lucide-react';

const AboutUs = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Hannah Nicole',
      role: 'Founder & Administrator',
      location: 'Legazpi, Albay',
      phone: '0917-123-4567',
      email: 'hannah@rabastravel.com',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 2,
      name: 'Gail Escalora',
      role: 'Chief Operations',
      location: 'Naga, Camarines Sur',
      phone: '0918-987-6543',
      email: 'gail@rabastravel.com',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 3,
      name: 'Alison Kiara',
      role: 'Lead Tour Coordinator',
      location: 'Daet, Camarines Norte',
      phone: '0919-246-8102',
      email: 'alisonkiara@const.com',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 4,
      name: 'Adam Gates',
      role: 'Travel Consultant',
      location: 'Sorsogon City',
      phone: '0920-135-7911',
      email: 'adamgates@const.com',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
  ];

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

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 hover:shadow-md transition-all flex flex-col items-center text-center relative group hover:scale-[1.02] duration-300"
              >
                {/* Yellow star top-left */}
                <div className="absolute top-5 left-5 text-yellow-500">
                  <Star className="h-4 w-4 fill-yellow-500 stroke-yellow-500" />
                </div>

                {/* Options menu top-right */}
                <div className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </div>

                {/* Profile Photo */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 shadow-inner mt-4 mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="space-y-1 w-full">
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight">
                    {member.name}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    {member.role}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {member.location}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full border-t border-slate-100 my-4" />

                {/* Contact info */}
                <div className="space-y-1.5 w-full">
                  <p className="text-slate-400 text-xs">
                    {member.phone}
                  </p>
                  <a
                    href={`mailto:${member.email}`}
                    className="text-[#2aa6d1] hover:underline text-xs font-semibold block truncate"
                  >
                    {member.email}
                  </a>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
};

export default AboutUs;
