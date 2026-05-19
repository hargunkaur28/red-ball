import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data;
  },

  googleAuth: async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data;
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        const refreshURL = import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/auth/refresh`
          : '/api/auth/refresh';
        const refresh = await fetch(refreshURL, {
          method: 'POST',
          credentials: 'include',
        });
        if (!refresh.ok) {
          set({ isLoading: false });
          return;
        }
        const refreshData = await refresh.json();
        localStorage.setItem('accessToken', refreshData.accessToken);
      }
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  getRedirectPath: () => {
    const { user } = get();
    if (!user) return '/login';
    switch (user.role) {
      case 'superadmin': case 'admin': return '/admin';
      case 'manager': return '/restaurant';
      case 'receptionist': return '/reception';
      case 'student': return '/user';
      case 'customer': return '/user';
      default: return '/login';
    }
  },
}));

export default useAuthStore;
