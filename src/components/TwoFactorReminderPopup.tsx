import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'dismissed_2fa_reminder';

export default function TwoFactorReminderPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check 2FA status for logged in user
  const { data: status2FA } = useQuery({
    queryKey: ['auth/2fa/status'],
    enabled: !!user && user.scope !== 'WALI',
    queryFn: async () => {
      const res = await apiClient.get('/auth/2fa/status');
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleGoTo2FA = () => {
    handleDismiss();
    navigate('/dashboard/profile?tab=2fa', { state: { tab: '2fa' } });
  };

  // Only show if user is logged in, 2FA is NOT enabled, and not dismissed in this session
  if (!user || user.scope === 'WALI' || isDismissed || !status2FA || status2FA.enabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] w-full max-w-md overflow-hidden border border-slate-200/90 animate-in zoom-in-95 duration-300">
        
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
              Akun Anda saat ini belum dilindungi oleh <strong>Autentikasi Dua Langkah (2FA)</strong>. Aktifkan 2FA sekarang menggunakan Google Authenticator / Authy agar akun Anda aman dari akses tidak sah.
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
