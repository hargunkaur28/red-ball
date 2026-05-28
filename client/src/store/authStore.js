import { create } from 'zustand';
import api from '../lib/axios';
import { queryClient } from '../lib/queryClient';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password, securityCode, rememberMe = false) => {
    const payload = { email, password, rememberMe };
    if (securityCode) payload.securityCode = securityCode;
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('cachedUser', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('cachedUser', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data;
  },

  googleAuth: async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('cachedUser', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data;
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('cachedUser');
    queryClient.clear();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const refreshURL = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/auth/refresh`
      : '/api/auth/refresh';

    const isTokenExpired = (token) => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
      } catch {
        return true;
      }
    };

    // Returns { ok, status } — lets us distinguish network errors from auth rejections
    const tryRefresh = async () => {
      try {
        const res = await fetch(refreshURL, { method: 'POST', credentials: 'include' });
        if (!res.ok) return { ok: false, status: res.status };
        const d = await res.json();
        localStorage.setItem('accessToken', d.accessToken);
        if (d.user) localStorage.setItem('cachedUser', JSON.stringify(d.user));
        return { ok: true };
      } catch {
        return { ok: false, status: 0 }; // status 0 = network error
      }
    };

    try {
      const token = localStorage.getItem('accessToken');

      if (!token || isTokenExpired(token)) {
        const { ok, status } = await tryRefresh();
        if (!ok) {
          if (status === 0) {
            // Network error (server cold-starting or offline) — keep the session
            // alive using cached user data so the admin isn't forced to re-login
            const cached = localStorage.getItem('cachedUser');
            if (cached) {
              set({ user: JSON.parse(cached), isAuthenticated: true, isLoading: false });
              return;
            }
          }
          // Explicit auth rejection (401/403) — clear session
          localStorage.removeItem('accessToken');
          localStorage.removeItem('cachedUser');
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
      }

      const { data } = await api.get('/auth/me');
      localStorage.setItem('cachedUser', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const isNetworkError = !err.response;
      if (isNetworkError) {
        // Server unreachable but local token still valid — stay logged in
        const token = localStorage.getItem('accessToken');
        const cached = localStorage.getItem('cachedUser');
        if (token && !isTokenExpired(token) && cached) {
          set({ user: JSON.parse(cached), isAuthenticated: true, isLoading: false });
          return;
        }
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('cachedUser');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  pendingEntryIntent: (() => {
    try {
      const stored = localStorage.getItem('pendingEntryIntent');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),

  setPendingEntryIntent: (intent) => {
    if (intent) {
      localStorage.setItem('pendingEntryIntent', JSON.stringify(intent));
    } else {
      localStorage.removeItem('pendingEntryIntent');
    }
    set({ pendingEntryIntent: intent });
  },

  clearPendingEntryIntent: () => {
    localStorage.removeItem('pendingEntryIntent');
    set({ pendingEntryIntent: null });
  },

  updateProfile: async (formData) => {
    const { data } = await api.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    localStorage.setItem('cachedUser', JSON.stringify(data.user));
    set({ user: data.user });
    return data;
  },

  updatePhone: async (phone) => {
    const fd = new FormData();
    fd.append('phone', phone);
    const { data } = await api.put('/auth/profile', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    set({ user: data.user });
    return data;
  },

  changePassword: async (passwordData) => {
    const { data } = await api.put('/auth/change-password', passwordData);
    return data;
  },

  deleteAccount: async (password) => {
    const { data } = await api.delete('/auth/account', { data: { password } });
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
    return data;
  },


  getRedirectPath: () => {
    const { user, pendingEntryIntent } = get();
    if (!user) return '/login';

    if (pendingEntryIntent && user.role === 'user') {
      const { flow, sportSlug, planId } = pendingEntryIntent;
      if (flow === 'one-time-access' && sportSlug) {
        return `/one-time-booking?sport=${sportSlug}`;
      } else if (flow === 'membership') {
        return planId ? `/user/membership?planId=${planId}` : '/user/membership';
      }
    }

    switch (user.role) {
      case 'superadmin': return '/super-admin';
      case 'manager': return '/restaurant';
      case 'user': return '/user';
      default: return '/login';
    }
  },
}));

export default useAuthStore;
