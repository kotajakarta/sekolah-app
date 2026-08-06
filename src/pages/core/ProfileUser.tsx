import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  UserCircle, Mail, Shield, ShieldCheck, Lock, Edit3, Save, CheckCircle2, AlertCircle,
  Loader2, Users, QrCode, Key, Copy, Check, AlertTriangle, ShieldAlert, Download, RefreshCw, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

import { useLocation, useSearchParams } from 'react-router-dom';

export default function ProfileUser() {
  const { user, login } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'profile' | '2fa'>(
    searchParams.get('tab') === '2fa' || (location.state as any)?.tab === '2fa' ? '2fa' : 'profile'
  );

  useEffect(() => {
    if (searchParams.get('tab') === '2fa' || (location.state as any)?.tab === '2fa') {
      setActiveTab('2fa');
    }
  }, [location, searchParams]);

  const [username, setUsername] = useState(user?.username || '');
  const [operatorName, setOperatorName] = useState(user?.operatorName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Wilayah muadalah fields
  const [ketuaMuadalahName, setKetuaMuadalahName] = useState('');
  const [ketuaMuadalahPhone, setKetuaMuadalahPhone] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 2FA Setup State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [qrCodeData, setQrCodeData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [setupError, setSetupError] = useState('');

  // 2FA Disable State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  // Fetch 2FA Status
  const { data: status2FA, refetch: refetch2FAStatus, isLoading: isLoading2FA } = useQuery({
    queryKey: ['auth/2fa/status'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/2fa/status');
      return res.data;
    }
  });

  // Fetch wilayah profile if WILAYAH scope
  const { data: wilayahData } = useQuery({
    queryKey: ['wilayah', user?.wilayahId, 'profile'],
    enabled: !!user?.wilayahId && user?.scope === 'WILAYAH',
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      const allWilayah = res.data;
      return allWilayah.find((w: any) => w.id === user?.wilayahId) || null;
    }
  });

  useEffect(() => {
    if (wilayahData) {
      setKetuaMuadalahName((wilayahData as any).ketuaMuadalahName || '');
      setKetuaMuadalahPhone((wilayahData as any).ketuaMuadalahPhone || '');
    }
  }, [wilayahData]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.put('/auth/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      setSuccessMsg('Profil berhasil diperbarui!');
      setErrorMsg('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil');
      setSuccessMsg('');
    }
  });

  const wilayahMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.put(`/master-data/wilayah/${user?.wilayahId}/profile`, data);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Data muadalah wilayah berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui data wilayah');
    }
  });

  // 2FA Mutations
  const generate2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/auth/2fa/generate');
      return res.data;
    },
    onSuccess: (data) => {
      setQrCodeData(data);
      setSetupStep(1);
      setSetupError('');
      setVerifyCode('');
      setIsSetupModalOpen(true);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Gagal membuat kunci 2FA');
    }
  });

  const enable2FAMutation = useMutation({
    mutationFn: async (data: { secret: string; code: string }) => {
      const res = await apiClient.post('/auth/2fa/enable', data);
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedBackupCodes(data.backupCodes || []);
      setSetupStep(3);
      setSetupError('');
      refetch2FAStatus();
    },
    onError: (err: any) => {
      setSetupError(err.response?.data?.message || 'Kode verifikasi 2FA tidak sesuai');
    }
  });

  const disable2FAMutation = useMutation({
    mutationFn: async (code?: string) => {
      const res = await apiClient.post('/auth/2fa/disable', { code });
      return res.data;
    },
    onSuccess: () => {
      setIsDisableModalOpen(false);
      setDisableCode('');
      setDisableError('');
      setSuccessMsg('2FA Authenticator berhasil dinonaktifkan.');
      refetch2FAStatus();
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err: any) => {
      setDisableError(err.response?.data?.message || 'Gagal menonaktifkan 2FA');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (password && password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    const payload: any = { operatorName, username };
    if (password) payload.password = password;

    mutation.mutate(payload);

    if (user?.scope === 'WILAYAH' && user?.wilayahId) {
      wilayahMutation.mutate({ ketuaMuadalahName, ketuaMuadalahPhone });
    }
  };

  const handleCopySecret = () => {
    if (qrCodeData?.secret) {
      navigator.clipboard.writeText(qrCodeData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 3000);
    }
  };

  const handleCopyBackupCodes = () => {
    if (generatedBackupCodes.length > 0) {
      navigator.clipboard.writeText(generatedBackupCodes.join('\n'));
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 3000);
    }
  };

  const handleDownloadBackupCodes = () => {
    const textContent = `PUSDATIN E-SANTRI - 2FA RECOVERY BACKUP CODES\nAccount: ${user?.username}\nGenerated At: ${new Date().toLocaleString('id-ID')}\n\n` +
      generatedBackupCodes.map((code, idx) => `${idx + 1}. ${code}`).join('\n') +
      `\n\n* Simpan berkas ini di tempat aman. Setiap kode cadangan hanya bisa digunakan 1 kali jika Anda kehilangan akses ke HP.`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup-Codes-2FA-${user?.username}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isGlobalAdmin = user?.scope === 'GLOBAL';

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-500 pb-10 max-w-3xl mx-auto mt-10">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="bg-white p-1.5 rounded-full ring-4 ring-white shadow-md">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <UserCircle className="w-16 h-16" />
              </div>
            </div>
            <div className="px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {user?.scope === 'GLOBAL' ? 'Administrator' : user?.scope}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {user?.operatorName || user?.username}
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user?.username}
              </p>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit3 className="w-4 h-4" /> Informasi Profil & Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('2fa')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === '2fa'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Keamanan 2FA (Authenticator)
                {status2FA?.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── TAB 1: INFORMASI PROFIL & PASSWORD ── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="pt-2 space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit Profil Pengguna
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      disabled={!isGlobalAdmin}
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    {!isGlobalAdmin && (
                      <p className="text-xs text-slate-400 mt-1">Username hanya dapat diubah oleh Administrator.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Operator</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="Nama Operator"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {user?.scope === 'WILAYAH' && (
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Data Pimpinan Muadalah Wilayah
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Nama Ketua Muadalah Wilayah
                        </label>
                        <input
                          type="text"
                          value={ketuaMuadalahName}
                          onChange={(e) => setKetuaMuadalahName(e.target.value)}
                          placeholder="Nama Ketua Muadalah"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          No. Telp / WhatsApp Ketua Muadalah
                        </label>
                        <input
                          type="text"
                          value={ketuaMuadalahPhone}
                          onChange={(e) => setKetuaMuadalahPhone(e.target.value)}
                          placeholder="Contoh: 08123456789"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Ganti Password (Opsional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password baru"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Konfirmasi password baru"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Hak Akses & Wilayah
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Tingkat Akses</dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">{user?.scope}</dd>
                      </div>
                      {user?.scope !== 'GLOBAL' && (user?.wilayahId || user?.cabangId) && (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Area Tugas</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900">
                            {user.scope === 'WILAYAH'
                              ? `Wilayah: ${user.wilayahName || user.wilayahId}`
                              : `Cabang: ${user.cabangName || user.cabangId}`}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={mutation.isPending || wilayahMutation.isPending}
                    className="inline-flex items-center justify-center px-6 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {(mutation.isPending || wilayahMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB 2: KEAMANAN 2FA (AUTHENTICATOR) ── */}
            {activeTab === '2fa' && (
              <div className="pt-2 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" /> Autentikasi Dua Langkah (2FA TOTP)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Lindungi akun Anda menggunakan aplikasi Authenticator time-based (Google Authenticator, Authy, Microsoft Authenticator, dll).
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    status2FA?.enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isLoading2FA ? '...' : status2FA?.enabled ? '2FA AKTIF' : '2FA NONAKTIF'}
                  </span>
                </div>

                {/* Status Card */}
                {status2FA?.enabled ? (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-emerald-950">2FA Authenticator Sedang Aktif</h4>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          Akun Anda telah dilindungi oleh kode 6-digit Time-based One-Time Password. Setiap kali melakukan sign in, Anda akan diminta memasukkan kode verifikasi dari aplikasi Authenticator.
                        </p>
                        <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-emerald-900">
                          <span>Sisa Kode Cadangan: <strong>{status2FA.backupCodesLeft} dari 8</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsDisableModalOpen(true)}
                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Nonaktifkan 2FA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-slate-800">Aktifkan 2FA Authenticator</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Tingkatkan keamanan akun Anda. Dengan mengaktifkan 2FA, peretas tidak bisa mengakses akun Anda meskipun password Anda bocor.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => generate2FAMutation.mutate()}
                        disabled={generate2FAMutation.isPending}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {generate2FAMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                        Setup Authenticator (2FA)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL SETUP 2FA STEPPER ── */}
      {isSetupModalOpen && qrCodeData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" /> Setup 2FA Authenticator (Langkah {setupStep} dari 3)
              </h3>
              {setupStep !== 3 && (
                <button
                  onClick={() => setIsSetupModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* STEP 1: SCAN QR CODE */}
            {setupStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  1. Buka aplikasi <strong>Google Authenticator</strong>, <strong>Authy</strong>, atau <strong>Microsoft Authenticator</strong> di HP Anda.<br />
                  2. Pilih menu <strong>Scan QR Code</strong> dan arahkan kamera ke gambar QR di bawah ini:
                </p>

                <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <img src={qrCodeData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 rounded-xl shadow-xs" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Kunci Rahasia Manual (Jika Tidak Bisa Scan):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={qrCodeData.secret}
                      className="w-full font-mono text-xs font-bold tracking-widest bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSecret ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Lanjut ke Verifikasi →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY KODE 6-DIGIT */}
            {setupStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Masukkan 6-digit kode verifikasi yang tampil di aplikasi Authenticator HP Anda untuk mengonfirmasi setup:
                </p>

                {setupError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{setupError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 text-center">
                    Kode 6-Digit Authenticator
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.4em] font-mono text-2xl font-extrabold border-slate-300 rounded-2xl py-3 bg-slate-50 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                  >
                    ← Kembali ke QR Code
                  </button>
                  <button
                    type="button"
                    disabled={enable2FAMutation.isPending || verifyCode.length < 6}
                    onClick={() => enable2FAMutation.mutate({ secret: qrCodeData.secret, code: verifyCode })}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {enable2FAMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Verifikasi & Aktifkan
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: KODE CADANGAN (BACKUP RECOVERY CODES) */}
            {setupStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">2FA Authenticator Berhasil Diaktifkan!</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">Akun Anda sekarang aman dengan perlindungan 2 langkah.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">8 Kode Cadangan (Backup Recovery Codes)</h4>
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Penting</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Simpan kode pemulihan ini di tempat aman. Setiap kode dapat digunakan <strong>1 kali</strong> untuk masuk jika Anda tidak membawa HP atau kehilangan aplikasi Authenticator.
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 text-emerald-400 font-mono text-xs font-bold rounded-2xl border border-slate-800">
                    {generatedBackupCodes.map((code, idx) => (
                      <div key={idx} className="p-1.5 bg-slate-800/80 rounded-lg text-center tracking-wider border border-slate-700/50">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyBackupCodes}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedBackup ? 'Tersalin' : 'Salin Kode'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBackupCodes}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" /> Unduh TXT
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsSetupModalOpen(false); }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL NONAKTIFKAN 2FA ── */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Nonaktifkan 2FA Authenticator
              </h3>
              <button
                onClick={() => setIsDisableModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menonaktifkan 2FA? Akun Anda akan menjadi kurang aman. Masukkan 6-digit kode Authenticator atau Password Anda untuk mengonfirmasi:
            </p>

            {disableError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{disableError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Kode Authenticator 6-Digit / Password
              </label>
              <input
                type="password"
                autoFocus
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="Masukkan Kode 2FA / Password"
                className="w-full text-center font-mono text-base font-bold border-slate-300 rounded-xl py-2.5 bg-slate-50 border focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDisableModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={disable2FAMutation.isPending}
                onClick={() => disable2FAMutation.mutate(disableCode)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                {disable2FAMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Nonaktifkan 2FA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
