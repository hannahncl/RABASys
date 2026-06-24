import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
      {/* Left split - brand & image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-10000"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=1200')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-cyan-500/20" />
        
        <div className="relative z-10 max-w-md text-center lg:text-left">
          <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 font-display font-bold text-2xl tracking-wide mb-8">
            <Compass className="h-8 w-8 animate-pulse" />
            RABAS TRAVEL
          </Link>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 leading-tight mb-4 tracking-tight">
            Discover the Hidden Gems of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 text-glow-cyan">Philippines</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Register your tourist profile to book curated packages, view real-time trip logs, and check local weather forecasts before you pack.
          </p>
        </div>
        
        {/* Decorative corner highlights */}
        <div className="absolute bottom-10 left-10 text-xs text-slate-500 font-mono">
          RABAS SYSTEMS v1.0.0
        </div>
      </div>

      {/* Right split - form content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-12 bg-slate-950">
        <div className="w-full max-w-md space-y-8 glass-panel p-8 md:p-10 rounded-2xl border-slate-800 shadow-2xl">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-cyan-400 font-display font-bold text-xl tracking-wide mb-6">
              <Compass className="h-6 w-6" />
              RABAS TRAVEL
            </Link>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
