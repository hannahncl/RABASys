import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmationContext = createContext(null);

export const ConfirmationProvider = ({ children }) => {
  const [request, setRequest] = useState(null);

  const confirm = useCallback((message) => new Promise((resolve) => {
    setRequest({ message, resolve });
  }), []);

  const close = (accepted) => {
    request?.resolve(accepted);
    setRequest(null);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {request && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation">
          <div className="w-full max-w-sm rounded-2xl border border-[#e0dbd0] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-50 p-2 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
              <div>
                <h2 id="confirmation-title" className="text-base font-bold text-[#1a1a1a]">Please confirm</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6b6255]">{request.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => close(false)} className="rounded-lg border border-[#d6cfc2] bg-white px-4 py-2 text-sm font-semibold text-[#6b6255] hover:bg-[#f7f4ef]">Cancel</button>
              <button onClick={() => close(true)} className="rounded-lg bg-[#2d2a24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a453b]">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => useContext(ConfirmationContext);
