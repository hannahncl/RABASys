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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('rabas_auth_token');
      if (!token) return setLoading(false);
      try {
        const { user: databaseUser } = await api('/auth/me');
        const sessionUser = frontendUser(databaseUser, token);
        setUser(sessionUser);
        localStorage.setItem('rabas_current_user', JSON.stringify(sessionUser));
      } catch {
        localStorage.removeItem('rabas_auth_token');
        localStorage.removeItem('rabas_current_user');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const saveSession = (data) => {
    localStorage.setItem('rabas_auth_token', data.token);
    const sessionUser = frontendUser(data.user, data.token);
    localStorage.setItem('rabas_current_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      return {
        success: true,
        user: saveSession(await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password }),
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rabas_auth_token');
    localStorage.removeItem('rabas_current_user');
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
