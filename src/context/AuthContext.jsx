'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('daami_token');
      const savedUser = localStorage.getItem('daami_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Login failed' };

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('daami_token', data.token);
      localStorage.setItem('daami_user', JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Registration failed' };

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('daami_token', data.token);
      localStorage.setItem('daami_user', JSON.stringify(data.user));
      toast.success(`Account created! Welcome, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const googleSignIn = async (credential) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Google sign-in failed' };
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('daami_token', data.token);
      localStorage.setItem('daami_user', JSON.stringify(data.user));
      toast.success(`Welcome, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('daami_token');
    localStorage.removeItem('daami_user');
    toast.success('Logged out successfully');
    router.push('/auth/login');
  };

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, login, register, googleSignIn, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
