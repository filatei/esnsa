import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('esnsa_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('esnsa_token'));

  const login = async (officer_id, password) => {
    const res = await api.post('/auth/login', { officer_id, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('esnsa_token', t);
    localStorage.setItem('esnsa_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };


  const loginWithToken = (t, u) => {
    localStorage.setItem('esnsa_token', t);
    localStorage.setItem('esnsa_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('esnsa_token');
    localStorage.removeItem('esnsa_user');
    setToken(null);
    setUser(null);
  }, []);

  // Auto-logout after 8 hours
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(logout, 8 * 60 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithToken, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
