import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0ece4] p-4 sm:p-6 font-sans">
      {/* Floating Card */}
      <div
        className="w-full max-w-[820px] bg-white rounded-2xl border border-[#ddd7ce] overflow-hidden flex flex-col md:flex-row items-stretch"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)', minHeight: '540px' }}
      >
        {/* Left Panel — Solid brown background with centered transparent logo */}
        <div
          className="hidden md:flex md:w-[45%] shrink-0 items-center justify-center p-8 sm:p-10 self-stretch"
          style={{ backgroundColor: '#603524' }}
        >
          <img
            src="/rabas-logo-white.png"
            alt="RABAS Travel and Tours Services"
            className="w-full max-w-[250px] h-auto object-contain select-none"
          />
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex flex-col justify-center px-8 py-6 md:px-10 md:py-7">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
