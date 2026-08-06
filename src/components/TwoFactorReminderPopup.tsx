import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, ShieldAlert, ArrowRight, X } from 'lucide-react';

export default function TwoFactorReminderPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  const storageKey = user ? `dismissed_2fa_reminder_${user.id}` : 'dismissed_2fa_reminder';

  // Check 2FA status for logged in user from backend
  const { data: status2FA, isLoading, isError } = useQuery({
    queryKey: ['auth/2fa/status', user?.id],
    enabled: !!user && user.scope !== 'WALI',
    queryFn: async () => {
      const res = await apiClient.get('/auth/2fa/status');
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 2,
  });

  useEffect(() => {
    if (!user) return;
    try {
      const dismissed = sessionStorage.getItem(storageKey);
      if (dismissed === 'true') {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      // ignore
    }
  }, [user, storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(storageKey, 'true');
    } catch {
      // ignore
    }
  };

  const handleGoTo2FA = () => {
    handleDismiss();
    navigate('/dashboard/profile?tab=2fa', { state: { tab: '2fa' } });
  };

  // Do not render if user not logged in, user is WALI, or user explicitly dismissed popup in this session
  if (!user || user.scope === 'WALI' || isDismissed) {
    return null;
  }

  // Do not render while fetching or if 2FA is already enabled
  if (isLoading || isError || !status2FA || status2FA.enabled === true) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] w-full max-w-md overflow-hidden border border-slate-200/90 animate-in zoom-in-95 duration-300">
        
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Decorative Gradient Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500" />

        <div className="p-6 space-y-5 text-center">
          {/* Icon Badge */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">!</span>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.75 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100/80 text-amber-800 border border-amber-200/60">
              Rekomendasi Keamanan Akun
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Aktifkan 2FA Authenticator
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed px-2">
              Akun Anda (<strong>{user.username}</strong>) saat ini belum dilindungi oleh <strong>Autentikasi Dua Langkah (2FA)</strong>. Aktifkan 2FA sekarang menggunakan Google Authenticator / Authy agar akun Anda aman dari akses tidak sah.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleGoTo2FA}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Aktifkan 2FA Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
