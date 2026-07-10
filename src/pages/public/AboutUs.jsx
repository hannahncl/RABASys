import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MoreVertical } from 'lucide-react';

const AboutUs = () => {
  // Staff / Team members data matching the cards in the mockup
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
    {
      id: 5,
      name: 'Chris Evans',
      role: 'Senior Field Guide',
      location: 'Virac, Catanduanes',
      phone: '0995-123-8888',
      email: 'chrisevans@const.com',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 6,
      name: 'Sarah Santos',
      role: 'Customer Support Lead',
      location: 'Masbate City',
      phone: '0916-555-4321',
      email: 'sarah@rabastravel.com',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 7,
      name: 'Mark Anthony',
      role: 'Logistics Coordinator',
      location: 'Legazpi, Albay',
      phone: '0922-888-9999',
      email: 'mark@rabastravel.com',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 8,
      name: 'Maria Clara',
      role: 'Booking Specialist',
      location: 'Naga, Camarines Sur',
      phone: '0905-111-2222',
      email: 'mariaclara@rabastravel.com',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
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
              <span className="text-xs font-bold text-red-500 uppercase tracking-[0.3em] block">
                A BIT
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-slate-900 tracking-wide uppercase">
                ABOUT US
              </h1>
            </div>
            
            <p className="text-slate-600 text-sm md:text-base leading-relaxed font-light">
              From they fine john he give of rich he. They age and draw mrs like. Improving end distrusts may instantly was household applauded incommode. Why kept very ever home mrs. Considered sympathize ten uncommonly occasional assistance sufficient not.
            </p>
            
            <div className="pt-2">
              <Link
                to="/packages"
                className="bg-[#2aa6d1] hover:bg-[#208eb4] text-white text-xs font-extrabold uppercase tracking-widest px-7 py-3.5 rounded-lg shadow-md transition-all inline-block hover:scale-[1.02] cursor-pointer"
              >
                EXPLORE MORE
              </Link>
            </div>
          </div>
          
          {/* Right Column: Montage matching mockup structure */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div className="relative w-full max-w-[500px] h-[440px]">
              
              {/* Top Photo (hiker looking at mountains) */}
              <div className="absolute top-0 right-0 w-[320px] h-[130px] rounded-3xl overflow-hidden shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800" 
                  alt="Mountain Hiker" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Middle Right Photo (coastal village cliffs) */}
              <div className="absolute top-[150px] right-0 w-[300px] h-[190px] rounded-3xl overflow-hidden shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800" 
                  alt="Coastal View" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Left Photo (two hikers hiking up) */}
              <div className="absolute top-[210px] left-[10px] w-[200px] h-[180px] rounded-3xl overflow-hidden border-8 border-white shadow-xl z-10">
                <img 
                  src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=800" 
                  alt="Hiking Team" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge (10+ Places) */}
              <div className="absolute bottom-[40px] right-[100px] bg-[#2aa6d1] text-white w-[110px] h-[75px] rounded-2xl flex flex-col justify-center items-center font-bold shadow-lg z-20 text-center select-none">
                <span className="text-2xl font-black tracking-tight leading-none">10+</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">Places</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── BOTTOM SECTION: MEET OUR TEAM ── */}
      <section className="bg-[#FFFCEE] border-t border-slate-100 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight font-display">
              Meet our Team
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xl mx-auto">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
