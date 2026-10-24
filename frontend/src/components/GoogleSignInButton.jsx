import React, { useCallback, useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const GoogleSignInButton = ({ onCredential, disabled = false }) => {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  const initialize = useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      setStatus('unavailable');
      return false;
    }
    if (!window.google?.accounts?.id || !buttonRef.current) return false;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => callbackRef.current?.(response.credential),
    });
    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(Math.max(buttonRef.current.offsetWidth || 360, 200), 400),
    });
    setStatus('ready');
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let poll;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      setStatus('unavailable');
      return undefined;
    }

    const tryInitialize = () => {
      if (!cancelled && initialize() && poll) clearInterval(poll);
    };
    if (!window.google?.accounts?.id) {
      const script = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
      if (!script) {
        const nextScript = document.createElement('script');
        nextScript.src = GOOGLE_SCRIPT_SRC;
        nextScript.async = true;
        nextScript.defer = true;
        nextScript.onload = tryInitialize;
        document.head.appendChild(nextScript);
      }
      poll = setInterval(tryInitialize, 200);
    } else {
      tryInitialize();
    }
    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, [initialize]);

  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) window.google.accounts.id.prompt();
  };

  return (
    <div className="w-full flex justify-center min-h-10">
      {status !== 'ready' && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={disabled || status === 'unavailable'}
          className="flex w-full items-center justify-center gap-3 rounded border border-[#d6cfc2] bg-white py-3 text-sm font-semibold text-[#3c3a36] transition-colors hover:bg-[#faf8f4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-base font-bold text-[#4285F4]">G</span>
          Continue with Google
        </button>
      )}
      <div ref={buttonRef} className={status === 'ready' ? 'w-full flex justify-center' : 'hidden'} />
    </div>
  );
};

export default GoogleSignInButton;
