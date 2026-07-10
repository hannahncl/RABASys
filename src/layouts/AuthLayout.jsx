import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-white text-slate-800 font-sans">
      {/* Left split - Logo Area */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-white">
        <div className="max-w-lg w-full flex justify-center">
          {/* We use an image tag assuming the user will place the logo image in the public folder.
              If the image is not available, we show a fallback styled text block. */}
          <img 
            src="/RABAS LOGO.png" 
            alt="RABAS Travel and Tours Services" 
            className="w-full max-w-md object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
          <div className="hidden text-center" style={{ display: 'none' }}>
            <h1 className="text-6xl font-black text-yellow-400 tracking-tighter mb-2">RABAS</h1>
            <p className="text-xl font-semibold text-yellow-400 tracking-wider">TRAVEL AND TOURS SERVICES</p>
          </div>
        </div>
      </div>

      {/* Right split - Form content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-12 bg-white">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
