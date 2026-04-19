import { create } from 'zustand';
import { authAPI } from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  isAdmin: false,
  token: localStorage.getItem('adminToken') || null,

  login: (userData) => set({ user: userData, isAdmin: userData?.role === 'admin' }),

  adminLogin: async (username, password) => {
    const response = await authAPI.adminLogin(username, password);
    const { token, name, role } = response.data;
    localStorage.setItem('adminToken', token);
    set({ token, user: { name, role }, isAdmin: true });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    set({ user: null, isAdmin: false, token: null });
  },

  isLoggedIn: () => {
    const state = useAuthStore.getState();
    return !!state.user;
  },
}));

export default useAuthStore;
