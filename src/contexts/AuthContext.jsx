import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export const normalizeFrontendRole = (role) => {
  if (!role) return 'customer';

  const normalized = String(role).trim().toLowerCase();
  if (['admin', 'administrator', 'superadmin'].includes(normalized)) return 'admin';
  if (['staff', 'tour guide', 'tour-guide', 'tourguide', 'guide'].includes(normalized)) return 'staff';
  return 'customer';
};

const frontendUser = (user, token) => {
  const role = normalizeFrontendRole(user?.role);
  return {
    ...user,
    username: user.email,
    role,
    token,
  };
};

const clearStoredAuth = () => {
  localStorage.removeItem('rabas_auth_token');
  localStorage.removeItem('rabas_current_user');
  localStorage.removeItem('rabas_session_id');
  localStorage.removeItem('rabas_session_expires_at');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = (token, currentUser, sessionMeta = {}) => {
    if (!token || !currentUser) {
      clearStoredAuth();
      setUser(null);
      return null;
    }

    const sessionUser = frontendUser(currentUser, token);
    localStorage.setItem('rabas_auth_token', token);
    localStorage.setItem('rabas_current_user', JSON.stringify(sessionUser));

    if (sessionMeta.sessionId) {
      localStorage.setItem('rabas_session_id', String(sessionMeta.sessionId));
    }
    if (sessionMeta.expiresAt) {
      localStorage.setItem('rabas_session_expires_at', sessionMeta.expiresAt);
    }

    setUser(sessionUser);
    return sessionUser;
  };

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('rabas_auth_token');
      const sessionExpiresAt = localStorage.getItem('rabas_session_expires_at');
      if (!token) return setLoading(false);
      if (sessionExpiresAt && new Date(sessionExpiresAt).getTime() <= Date.now()) {
        clearStoredAuth();
        return setLoading(false);
      }

      try {
        const { user: databaseUser, session } = await api('/auth/me');
        persistSession(token, databaseUser, session);
      } catch {
        clearStoredAuth();
      } finally {
        setLoading(false);
      }
    };

    const handleSessionInvalidation = () => {
      clearStoredAuth();
      setUser(null);
    };

    window.addEventListener('rabas-auth-invalidated', handleSessionInvalidation);
    restore();

    return () => window.removeEventListener('rabas-auth-invalidated', handleSessionInvalidation);
  }, []);

  const saveSession = (data) => {
    return persistSession(data.token, data.user, {
      sessionId: data.sessionId,
      expiresAt: data.expiresAt,
    });
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      return {
        success: true,
        user: saveSession(await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })),
      };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName, lastName, email, password, contactNumber) => {
    setLoading(true);
    try {
      return {
        success: true,
        user: saveSession(await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ firstName, lastName, email, password, contactNumber }),
        })),
      };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('rabas_auth_token');
    if (token) {
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch {
        // Ignore network or auth errors and clear the client state anyway.
      }
    }

    clearStoredAuth();
    setUser(null);
  };

  const updateUserSession = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('rabas_current_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};
