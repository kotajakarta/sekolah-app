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
      if (!requestUrl.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

