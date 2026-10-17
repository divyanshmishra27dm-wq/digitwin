import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const cleanBaseUrl = rawBaseUrl.replace(/\/$/, '');
const baseURL = cleanBaseUrl ? (cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`) : '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ndt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ndt_token');
      localStorage.removeItem('ndt_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
