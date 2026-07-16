import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../lib/apiClient';
import { Database, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{status: 'idle'|'loading'|'success'|'error', message: string}>({status: 'idle', message: ''});

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCheckConnection = async () => {
    setConnectionStatus({status: 'loading', message: 'Mengecek koneksi...'});
    // Ini SAMA PERSIS dengan baseURL yang dipakai apiClient saat login
    const apiClientBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    try {
      const response = await fetch(`${apiClientBaseUrl}/health`, { method: 'GET' });
      const statusText = `Status: ${response.status} ${response.statusText}`;
      setConnectionStatus({status: 'success', message: `✅ API URL: ${apiClientBaseUrl} | ${statusText}`});
    } catch (err: any) {
      setConnectionStatus({status: 'error', message: `❌ Gagal: ${err.message} | URL yg dipakai: "${apiClientBaseUrl}"`});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, user } = response.data;
      login(token, { ...user, username });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="https://cdn.aithendi.my.id/assets/logoyts-modern2.png" alt="eSiswa Logo" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-bold text-slate-800 tracking-tight">
          eSiswa
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-200/70">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl py-2.5 bg-slate-50 border transition-colors"
                  placeholder="admin / wilayah1 / cabang1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl py-2.5 bg-slate-50 border transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={handleCheckConnection}
              disabled={connectionStatus.status === 'loading'}
              className="w-full flex justify-center items-center py-2 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {connectionStatus.status === 'loading' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2 text-slate-400" />
              )}
              Cek Koneksi API
            </button>
            {connectionStatus.message && (
              <p className={`mt-3 text-center text-xs font-medium ${connectionStatus.status === 'error' ? 'text-red-500' : connectionStatus.status === 'success' ? 'text-green-600' : 'text-slate-500'}`}>
                {connectionStatus.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
