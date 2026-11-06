import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import FeedbackNotice from '../components/ui/FeedbackNotice';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef(null);

  const clearNotificationTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const removeToast = useCallback((id) => {
    clearNotificationTimer();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearNotificationTimer]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    clearNotificationTimer();
    setToasts([{ id, message, type }]);

    timerRef.current = setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [clearNotificationTimer, removeToast]);

  useEffect(() => clearNotificationTimer, [clearNotificationTimer]);

  return (
    <NotificationContext.Provider value={{ showNotification: addToast }}>
      {children}
      
      <>
        {toasts.map((toast) => {
          return (
            <FeedbackNotice
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onDismiss={() => removeToast(toast.id)}
            />
          );
        })}
      </>
    </NotificationContext.Provider>
  );
};
