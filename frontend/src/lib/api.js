import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
    }
    return Promise.reject(error);
  }
);

// ── Menu ──────────────────────────────────────────────────────────────────
export const menuAPI = {
  getToday: () => api.get('/menu/today'),
  getAll: () => api.get('/menu'),
  add: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  remove: (id) => api.delete(`/menu/${id}`),
  toggleAvailability: (id) => api.patch(`/menu/${id}/toggle`),
  updateStock: (id, stock) => api.patch(`/menu/${id}/stock`, { stock }),
  seed: () => api.post('/menu/seed'),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getActive: (rollNumber) => api.get(`/orders/active?rollNumber=${rollNumber}`),
  place: (data) => api.post('/orders', data),
  getAll: (status) => api.get(`/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  verifyOTP: (id, otp) => api.post(`/orders/${id}/verify-otp`, { otp }),
  cancel: (id) => api.delete(`/orders/${id}`),
};

// ── Deals ─────────────────────────────────────────────────────────────────
export const dealsAPI = {
  getAll: () => api.get('/deals'),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  toggle: (id) => api.patch(`/deals/${id}/toggle`),
  remove: (id) => api.delete(`/deals/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDaily: () => api.get('/analytics/daily'),
  getTimewise: () => api.get('/analytics/timewise'),
  getWeekly: () => api.get('/analytics/weekly'),
  getAIInsights: () => api.get('/analytics/ai-insights'),
};

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  adminLogin: (username, password) => api.post('/auth/login', { username, password }),
  verify: () => api.get('/auth/verify'),
};

export default api;
