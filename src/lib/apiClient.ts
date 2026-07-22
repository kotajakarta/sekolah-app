import axios from 'axios';

const apiClient = axios.create({
  // Jika di production, VITE_API_BASE_URL bisa diset misal "https://api.domainku.com/api/v1"
  // Jika di local development, otomatis menggunakan "/api/v1" yang akan ditangkap Vite proxy.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  adapter: 'fetch', // Menggunakan fetch adapter untuk menghindari bug interseptor XHR pada adblocker
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      if (typeof document !== 'undefined' && !document.cookie.includes(`token=${token}`)) {
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
      }
    } else if (!token && typeof document !== 'undefined' && document.cookie.includes('token=')) {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      // Jangan redirect jika ini adalah endpoint login itu sendiri
      // (401 di login = salah password, bukan sesi expired)
      if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/signin') && !requestUrl.includes('/signin')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

