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
      
      {/* Centered Toast container */}
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 z-[100] pointer-events-none">
        {toasts.map((toast) => {
          // Subtle, elegant colors matching the luxury aesthetic
          const typeStyles = {
            success: { icon: '#2d4a3e', bg: '#f2f7f4', border: '#d5e6df', title: 'Success' },
            error: { icon: '#6b2d2a', bg: '#f9f1f0', border: '#e8d2cf', title: 'Error' },
            warning: { icon: '#785b24', bg: '#fcf8f0', border: '#e8dcba', title: 'Notice' },
            info: { icon: '#2d3e52', bg: '#f0f4f8', border: '#d1dee8', title: 'Information' },
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
              className="flex flex-col items-center text-center p-10 pointer-events-auto transition-all duration-300 transform translate-y-0 w-full max-w-[380px]"
              style={{
                background: '#ffffff',
                border: `1px solid ${typeStyles.border}`,
                borderRadius: '8px', // Slightly softer radius for a large prominent modal
                boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
                fontFamily: "'Inter', 'Georgia', serif"
              }}
              role="alert"
            >
              {/* Large Icon Box */}
              <div 
                className="flex items-center justify-center shrink-0 w-24 h-24 rounded-full mb-6"
                style={{ background: typeStyles.bg }}
              >
                <Icon className="h-10 w-10" style={{ color: typeStyles.icon, strokeWidth: 1.5 }} />
              </div>
              
              {/* Title */}
              <h3 
                className="text-xl font-semibold mb-3"
                style={{
                  color: '#1a1a1a',
                  fontFamily: "'Outfit', Georgia, serif",
                  letterSpacing: '0.02em',
                }}
              >
                {typeStyles.title}
              </h3>

              {/* Message */}
              <div 
                className="text-[13px] font-medium leading-relaxed mb-10 px-4"
                style={{ color: '#4a453b' }}
              >
                {toast.message}
              </div>

              {/* Action Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="w-full py-4 text-[12px] font-semibold transition-all duration-300 cursor-pointer"
                style={{
                  background: '#1a1a1a',
                  color: '#ffffff',
                  borderRadius: '999px', // Pill-shaped button matching the reference image's large button
                  letterSpacing: '0.04em',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#333333';
                  e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1a1a1a';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'translateY(1px)';
                }}
              >
                Okay, got it
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
