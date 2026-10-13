import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0ece4] p-4 sm:p-6 font-sans">
      {/* Floating Card */}
      <div
        className="w-full max-w-[820px] bg-white rounded-2xl border border-[#ddd7ce] overflow-hidden flex flex-col md:flex-row items-stretch"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)', minHeight: '520px' }}
      >
        {/* Left Panel — Photo stretches full card height */}
        <div className="hidden md:flex md:w-[45%] shrink-0 relative self-stretch">
          <img
            src="/iwant/login-photo.jpg"
            alt="RABAS Travel and Tours"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          {/* Fallback if no photo */}
          <div
            className="absolute inset-0 bg-[#fef8e7] items-center justify-center flex-col text-center p-8"
            style={{ display: 'none' }}
          >
            <img src="/RABAS LOGO.png" alt="RABAS Logo" className="h-16 w-auto mb-4 opacity-90" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a1a1a]">RABAS Travel</p>
            <p className="text-[10px] text-[#6b6255] mt-1">Bicol Region Exploration</p>
          </div>
          {/* Subtle gradient at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-10 md:py-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
