import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

const MOCK_USERS = [
  { username: 'admin', password: '123', role: 'admin', name: 'Rabas Admin', email: 'admin@rabastravel.com' },
  { username: 'staff', password: '123', role: 'staff', name: 'Rabas Coordinator', email: 'staff@rabastravel.com' },
  { username: 'tourist', password: '123', role: 'customer', name: 'Happy Tourist', email: 'tourist@gmail.com' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if session exists in localStorage
    const savedUser = localStorage.getItem('rabas_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const foundUser = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const sessionUser = {
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
        email: foundUser.email,
        token: `mock_jwt_${Math.random().toString(36).substring(2)}`
      };
      
      setUser(sessionUser);
      localStorage.setItem('rabas_current_user', JSON.stringify(sessionUser));
      setLoading(false);
      return { success: true, user: sessionUser };
    } else {
      setLoading(false);
      return { success: false, error: 'Invalid username or password. (Hint: Try username "admin", "staff", or "tourist" with password "123")' };
    }
  };

  const register = async (name, email, username, password, address = '', contactNumber = '') => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const newUser = {
      username: username.toLowerCase(),
      password,
      role: 'customer',
      name,
      email,
      address,
      contactNumber,
    };

    MOCK_USERS.push(newUser);

    // Persist to accountService db so profile page can load full details
    const accKey = 'rabas_accounts_db';
    const accounts = JSON.parse(localStorage.getItem(accKey)) || [];
    const newAccount = {
      id: `ACC-${String(accounts.length + 1).padStart(3, '0')}`,
      name,
      email,
      username: newUser.username,
      role: 'customer',
      status: 'Active',
      phone: contactNumber,
      address,
      createdAt: new Date().toISOString(),
    };
    accounts.push(newAccount);
    localStorage.setItem(accKey, JSON.stringify(accounts));

    const sessionUser = {
      username: newUser.username,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      address,
      contactNumber,
      token: `mock_jwt_${Math.random().toString(36).substring(2)}`
    };

    setUser(sessionUser);
    localStorage.setItem('rabas_current_user', JSON.stringify(sessionUser));
    setLoading(false);
    return { success: true, user: sessionUser };
  };

  const logout = () => {
    setUser(null);
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
