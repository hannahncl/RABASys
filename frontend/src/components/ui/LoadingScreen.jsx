import React from 'react';

/** Full-screen status shown while a route or session is being prepared. */
const LoadingScreen = ({ title = 'Preparing your page', detail = 'This should only take a moment.' }) => (
  <main
    className="flex min-h-screen items-center justify-center bg-[#faf8f4] px-6 text-[#2d2a24]"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="w-full max-w-sm text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#eadfce] bg-white shadow-sm">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#e8dfd2] border-t-[#b88a32] motion-reduce:animate-none" aria-hidden="true" />
      </div>
      <p className="font-display text-lg font-semibold tracking-wide">{title}</p>
      <p className="mt-2 text-sm text-[#756d63]">{detail}</p>
      <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-[#e8dfd2]" aria-hidden="true">
        <div className="h-full w-2/5 animate-pulse rounded-full bg-[#b88a32] motion-reduce:animate-none" />
      </div>
    </div>
  </main>
);

export default LoadingScreen;
