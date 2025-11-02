import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
};

// Activation code endpoints
export const activationCodes = {
  list: () => api.get('/activation-codes'),
  generate: (expiresInHours = 24) => api.post('/activation-codes', { expires_in_hours: expiresInHours }),
  delete: (id) => api.delete(`/activation-codes/${id}`),
};

// Device endpoints
export const devices = {
  list: () => api.get('/devices'),
  heartbeat: (deviceUuid) => api.post('/devices/heartbeat', { device_uuid: deviceUuid }),
  delete: (id) => api.delete(`/devices/${id}`),
  activate: (data) => api.post('/devices/activate', data),
};

// Watch event endpoints
export const watchEvents = {
  list: (params) => api.get('/watch-events', { params }),
  create: (data) => api.post('/watch-events', data),
  createBatch: (data) => api.post('/watch-events/batch', data),
};

// Dashboard endpoints
export const dashboard = {
  stats: (params) => api.get('/dashboard/stats', { params }),
  overview: () => api.get('/dashboard/overview'),
};

export default api;
