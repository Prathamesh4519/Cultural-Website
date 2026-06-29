import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('culturespace_token') || null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('culturespace_theme') || 'light');
  const [notifications, setNotifications] = useState([]);

  // Check user profile on reload if token exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data.user);
          fetchNotifications();
        } catch (err) {
          console.error('Session expired or token invalid', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [token]);

  // Apply theme class to HTML body
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    localStorage.setItem('culturespace_theme', theme);
  }, [theme]);

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Mark specific notification read
  const markNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  // Mark all notifications read
  const markAllNotificationsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Student Login
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('culturespace_token', res.data.token);
      localStorage.setItem('culturespace_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  // Admin / Owner Login
  const loginAdmin = async (email, password) => {
    try {
      const res = await api.post('/auth/login-admin', { email, password });
      localStorage.setItem('culturespace_token', res.data.token);
      localStorage.setItem('culturespace_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || 'Admin login failed';
    }
  };

  // Student Registration
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  // OTP Verification
  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('culturespace_token', res.data.token);
      localStorage.setItem('culturespace_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || 'OTP verification failed';
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('culturespace_token');
    localStorage.removeItem('culturespace_user');
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        notifications,
        unreadCount,
        toggleTheme,
        login,
        loginAdmin,
        register,
        verifyOtp,
        logout,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
