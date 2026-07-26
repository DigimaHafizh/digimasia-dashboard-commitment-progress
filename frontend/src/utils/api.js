import axios from 'axios'

export const getAssetURL = (path) => {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return `/api${cleanPath}`;
  }
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${base}${cleanPath}`;
};

const getBaseURL = () => {
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
})

// Attach stored user token on every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('auth_user') || 'null')
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
  return config
})

export default api
