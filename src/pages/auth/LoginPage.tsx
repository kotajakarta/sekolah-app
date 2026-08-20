import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../lib/apiClient';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/signin', { username, password });
      
      if (response.data?.requires2FA) {
        setRequires2FA(true);
        setTempToken(response.data.tempToken);
        setTotpCode('');
        setError('');
      } else {
        const { token, user } = response.data;
        login(token, { ...user, username });
        navigate(user.scope === 'WALI' ? '/portal' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali username dan password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim()) {
      setError('Masukkan kode verifikasi 6-digit Authenticator atau Kode Cadangan.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/auth/2fa/verify-login', {
        tempToken,
        code: totpCode.trim()
      });
      const { token, user } = response.data;
      login(token, { ...user, username });
      navigate(user.scope === 'WALI' ? '/portal' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kode verifikasi 2FA atau Kode Cadangan tidak valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="https://cdn.aithendi.my.id/assets/logoyts-modern.png" alt="eSiswa Logo" className="h-16 w-auto object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-bold text-slate-800 tracking-tight">
          eSantri
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-200/70">
          {requires2FA ? (
            <form className="space-y-6" onSubmit={handleVerify2FA}>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Verifikasi 2FA Authenticator</h3>
                <p className="text-xs text-slate-500">
                  Akun Anda dilindungi 2FA. Masukkan 6-digit kode dari aplikasi Authenticator (Google/Authy) atau Kode Cadangan.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="totpCode" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600" /> Kode Verifikasi 2FA / Kode Cadangan
                </label>
                <input
                  id="totpCode"
                  type="text"
                  required
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Contoh: 123456 atau XXXX-XXXX"
                  className="block w-full text-center tracking-widest text-lg font-mono font-bold border-slate-300 rounded-xl py-3 bg-slate-50 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !totpCode.trim()}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verifikasi & Masuk'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setRequires2FA(false); setTempToken(''); setTotpCode(''); setError(''); }}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Kembali ke Login
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 sm:text-sm border-slate-300 rounded-xl py-2.5 bg-slate-50 border transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
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
          )}

          <div className="mt-6 border-t border-slate-100 pt-6 space-y-3 text-center">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-left flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-900">Wali Santri / Orang Tua?</p>
                <p className="text-[11px] text-emerald-700">Belum memiliki akun untuk memantau santri?</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/portal-register')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                Daftar Akun
              </button>
            </div>

            <span className="block text-xs text-slate-500">
              Calon Santri Baru?{' '}
              <button
                type="button"
                onClick={() => navigate('/daftar-ulang')}
                className="font-semibold text-indigo-600 hover:text-slate-900 transition-colors"
              >
                Daftar Ulang di Sini
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
