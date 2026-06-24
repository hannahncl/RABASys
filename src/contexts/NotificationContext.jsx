import React, { createContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification: addToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-950 border-emerald-800 text-emerald-200',
            error: 'bg-rose-950 border-rose-800 text-rose-200',
            warning: 'bg-amber-950 border-amber-800 text-amber-200',
            info: 'bg-cyan-950 border-cyan-800 text-cyan-200',
          }[toast.type];

          const Icon = {
            success: CheckCircle,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border glass-panel shadow-2xl pointer-events-auto transition-all duration-300 transform translate-y-0 ${typeStyles}`}
              role="alert"
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
