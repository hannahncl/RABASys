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
          <div className="w-full max-w-[28rem] rounded-xl border border-[#ead2d4] bg-white shadow-[0_20px_54px_rgba(36,24,21,0.16)]" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message">
            <div className="px-6 py-5 sm:px-7 sm:py-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f8eeee]">
                  <AlertTriangle className="h-4 w-4 text-[#6D2932]" strokeWidth={1.6} />
                </span>
                <h2 id="confirmation-title" className="text-xs font-semibold text-[#561C24]">Please confirm</h2>
              </div>
              <p id="confirmation-message" className="mt-3 text-sm leading-6 text-[#5f4c48]">{request.message}</p>
              <div className="mt-5 border-t border-[#eadfd4] pt-4">
                <div className="flex justify-end gap-2.5">
                  <button type="button" onClick={() => close(false)} className="rounded-md border border-[#d9cfc2] bg-transparent px-4 py-2 text-sm font-medium text-[#6D2932] transition hover:bg-[#f7f0e8]">Cancel</button>
                  <button type="button" onClick={() => close(true)} className="rounded-md bg-[#561C24] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6D2932] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#561C24]">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => useContext(ConfirmationContext);
