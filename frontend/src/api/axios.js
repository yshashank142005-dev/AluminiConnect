import axios from 'axios';

const defaultApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '/api');
const api = axios.create({
  baseURL: defaultApiUrl,
  headers: { 'Content-Type': 'application/json' },
});

const isPublicAuthRequest = (config) => {
  const u = (config?.url || '').replace(/^\//, '');
  return ['auth/login', 'auth/register', 'auth/send-otp', 'auth/verify-otp'].some((p) => u === p || u.endsWith(`/${p}`));
};

// Attach JWT on every request (not on unauthenticated auth calls — avoids odd 401 handling)
api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config)) {
    delete config.headers.Authorization;
    return config;
  }
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handler — do not treat "wrong password" login 401 as session expiry
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const cfg = error.config;
      if (isPublicAuthRequest(cfg)) {
        return Promise.reject(error);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname || '';
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
