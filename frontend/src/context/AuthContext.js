import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('koya_token'));

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('koya_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    const { user: userData, token: authToken } = response.data;
    localStorage.setItem('koya_token', authToken);
    setToken(authToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, phone) => {
    const response = await axios.post(`${API}/auth/register`, { name, email, password, phone }, { withCredentials: true });
    const { user: userData, token: authToken } = response.data;
    localStorage.setItem('koya_token', authToken);
    setToken(authToken);
    setUser(userData);
    return userData;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const processOAuthSession = async (sessionId) => {
    const response = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
    const { user: userData, token: authToken } = response.data;
    localStorage.setItem('koya_token', authToken);
    setToken(authToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('koya_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await axios.put(`${API}/users/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
    setUser(response.data);
    return response.data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginWithGoogle,
    processOAuthSession,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
