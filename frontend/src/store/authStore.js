import { create } from 'zustand';
import { authAPI } from '../lib/api';
import api from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  isAdmin: false,
  token: localStorage.getItem('adminToken') || localStorage.getItem('customerToken') || null,

  login: (userData, token) => {
    if (token) {
      localStorage.setItem('customerToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    set({ user: userData, isAdmin: userData?.role === 'admin', token });
  },

  adminLogin: async (username, password) => {
    const response = await authAPI.adminLogin(username, password);
    const { token, name, role } = response.data;
    localStorage.setItem('adminToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, user: { name, role }, isAdmin: true });
    return response.data;
  },

  updateProfile: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : state.user
  })),

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('customerToken');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, isAdmin: false, token: null });
  },

  isLoggedIn: () => {
    const state = useAuthStore.getState();
    return !!state.user;
  },
}));

export default useAuthStore;
