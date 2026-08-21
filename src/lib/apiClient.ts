import axios from 'axios';
import { sanitizeTurkishDeep } from '../utils/text';

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
    // Jika data yang dikirim adalah FormData, hapus manual header Content-Type
    // agar peramban otomatis menyertakan boundary=----WebKitFormBoundary...
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else if (config.data && typeof config.data === 'object') {
      config.data = sanitizeTurkishDeep(config.data);
    }

    if (config.params && typeof config.params === 'object') {
      config.params = sanitizeTurkishDeep(config.params);
    }

    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      if (typeof document !== 'undefined' && !document.cookie.includes(`token=${token}`)) {
        const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax${secureFlag}`;
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

const isPublicEndpoint = (url: string) => {
  const publicPatterns = [
    '/auth/login',
    '/auth/signin',
    '/signin',
    '/students/daftar-ulang',
    '/students/check-duplicate',
    '/faq',
    '/pengaturan/modules',
    '/pengaturan/kalender',
    '/pengaturan/pengumuman',
    '/pengaturan/uploads',
    '/uploads',
  ];
  return publicPatterns.some((p) => url.includes(p));
};

const isPublicPage = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return (
    path === '/' ||
    path.startsWith('/daftar-ulang') ||
    path.startsWith('/dafta-ulng') ||
    path.startsWith('/login') ||
    path.startsWith('/faq')
  );
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = sanitizeTurkishDeep(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      
      // Jika di halaman publik atau mengakses endpoint publik, jangan redirect ke /login
      if (isPublicEndpoint(requestUrl) || isPublicPage()) {
        // Jika token basi menyebabkan 401 di endpoint publik, bersihkan token tapi jangan pindah halaman
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        return Promise.reject(error);
      }

      // Sesi kedaluwarsa pada halaman terproteksi: hapus token dan redirect ke login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof document !== 'undefined') {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

