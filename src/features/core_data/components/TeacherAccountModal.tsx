import React, { useState, useEffect } from 'react';
import { X, KeyRound, Check, Send, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { Staff, useCreateTeacherAccount, useResetTeacherPassword } from '../hooks/useMasterData';
import { useToast } from '../../../contexts/ToastContext';

interface TeacherAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  mode: 'create' | 'reset';
  onSuccess?: () => void;
}

export const TeacherAccountModal: React.FC<TeacherAccountModalProps> = ({
  isOpen,
  onClose,
  staff,
  mode,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const createAccountMutation = useCreateTeacherAccount();
  const resetPasswordMutation = useResetTeacherPassword();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [scope, setScope] = useState<'GURU' | 'WALI_KELAS'>('GURU');
  const [isCopied, setIsCopied] = useState(false);

  // Hasil akun yang baru dibuat atau di-reset
  const [createdResult, setCreatedResult] = useState<{
    username: string;
    passwordPlain: string;
    scope: string;
    staffName: string;
    phone?: string;
  } | null>(null);

  useEffect(() => {
    if (staff && isOpen) {
      setCreatedResult(null);
      setIsCopied(false);

      const isHomeroom = (staff.kelasWali && staff.kelasWali.length > 0) || Boolean(staff.waliKelas);
      setScope(isHomeroom ? 'WALI_KELAS' : 'GURU');

      if (mode === 'create') {
        const defaultUser = (staff.nik && staff.nik.trim().length >= 4)
          ? staff.nik.trim()
          : staff.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '').slice(0, 20) || 'guru';
        setUsername(defaultUser);
        setPassword(staff.nik ? `${staff.nik.slice(-6)}@Santri` : 'Sulaimaniyah2026!');
      } else {
        setUsername(staff.user?.username || '');
        setPassword(staff.nik ? `${staff.nik.slice(-6)}@Santri` : 'Sulaimaniyah2026!');
      }
    }
  }, [staff, isOpen, mode]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        const res = await createAccountMutation.mutateAsync({
          staffId: staff.id,
          username: username.trim(),
          password: password.trim(),
          scope,
        });
        setCreatedResult({
          username: res.username,
          passwordPlain: res.password,
          scope: res.scope,
          staffName: staff.name,
          phone: staff.phone,
        });
        showToast('success', 'Akun login guru berhasil dibuat!');
        onSuccess?.();
      } else {
        const res = await resetPasswordMutation.mutateAsync({
          staffId: staff.id,
          newPassword: password.trim(),
        });
        setCreatedResult({
          username: res.username,
          passwordPlain: res.newPassword,
          scope: staff.user?.scope || scope,
          staffName: staff.name,
          phone: staff.phone,
        });
        showToast('success', 'Password guru berhasil di-reset!');
        onSuccess?.();
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Terjadi kesalahan saat memproses akun.');
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `*AKUN LOGIN ESANTRI*\nNama: ${createdResult.staffName}\nPeran: ${createdResult.scope === 'WALI_KELAS' ? 'Wali Kelas' : 'Guru Pengampu'}\nUsername: ${createdResult.username}\nPassword: ${createdResult.passwordPlain}\nLink: https://esantri.yts.sch.id/login`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    showToast('success', 'Kredensial berhasil disalin!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) p = '62' + p.substring(1);
    if (p.startsWith('8')) p = '628' + p.substring(1);
    return p;
  };

  const handleSendWhatsApp = () => {
    if (!createdResult) return;
    const rawPhone = createdResult.phone || staff.phone || '';
    const cleanPhone = getCleanPhone(rawPhone);

    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. *${createdResult.staffName}*,\n\nBerikut informasi akun login eSantri untuk akses Bank Soal, Jurnal Pembelajaran, dan Absensi Siswa:\n\n🌐 *Link Login* : https://esantri.yts.sch.id/login\n👤 *Username*   : ${createdResult.username}\n🔑 *Password*   : ${createdResult.passwordPlain}\n🏢 *Peran*      : ${createdResult.scope === 'WALI_KELAS' ? 'Wali Kelas' : 'Guru Pengampu'}\n\nMohon segera login dan ganti password demi keamanan akun Anda.\nJazakumullah Khairan Katsiran.`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const isLoading = createAccountMutation.isPending || resetPasswordMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {mode === 'create' ? 'Buat Akun Login Guru' : 'Reset Password Akun Guru'}
              </h3>
              <p className="text-xs text-indigo-100">{staff.name} • {staff.cabang?.name || 'Cabang'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {createdResult ? (
            /* Tampilan Sukses & Bagikan Kredensial */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {mode === 'create' ? 'Akun Berhasil Dibuat!' : 'Password Berhasil Di-reset!'}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Silakan bagikan data login berikut kepada Ustadz {createdResult.staffName}.
                  </p>
                </div>
              </div>

              {/* Box Kredensial */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-sans">Peran / Scope</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
                    {createdResult.scope}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Username:</span>
                  <span className="font-bold text-amber-400 select-all">{createdResult.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-sans">Password:</span>
                  <span className="font-bold text-emerald-400 select-all">{createdResult.passwordPlain}</span>
                </div>
                {staff.phone && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-slate-400 font-sans">WhatsApp Guru:</span>
                    <span className="text-slate-300 font-sans">{staff.phone}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: WhatsApp & Salin */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Akun via WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Data'}</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Tutup Jendela
                </button>
              </div>
            </div>
          ) : (
            /* Form Buat / Reset Akun */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info Guru */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Nama Ustadz/Guru:</span>
                  <p className="font-bold text-slate-800">{staff.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Cabang:</span>
                  <p className="font-semibold text-slate-700">{staff.cabang?.name || '-'}</p>
                </div>
              </div>

              {/* Scope / Peran */}
              {mode === 'create' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Peran Akun
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScope('GURU')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        scope === 'GURU'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-600/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">GURU</span>
                        {scope === 'GURU' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Akses Bank Soal, Jurnal, Absensi & e-Rapor
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScope('WALI_KELAS')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        scope === 'WALI_KELAS'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-600/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">WALI KELAS</span>
                        {scope === 'WALI_KELAS' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Semua akses guru + Kelola Santri & Rombel Kelas
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Login <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={mode === 'reset'}
                  placeholder="Contoh: ustadz.ahmad atau NIK"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {mode === 'create' ? 'Otomatis diusulkan dari NIK atau nama ustadz.' : 'Username akun yang sudah terdaftar.'}
                </p>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {mode === 'create' ? 'Password Awal' : 'Password Baru'} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(staff.nik ? `${staff.nik.slice(-6)}@Santri` : 'Sulaimaniyah2026!')}
                    className="text-[10px] text-indigo-600 hover:underline font-medium cursor-pointer"
                  >
                    Gunakan Default
                  </button>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Ustadz dapat mengganti password ini secara mandiri setelah berhasil login.
                </p>
              </div>

              {/* Proteksi Data Alert */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-amber-800">
                  <strong>Proteksi Aktif:</strong> Akun guru tidak dapat melihat data keuangan (syahriyah), mutasi/tarik santri, atau pengaturan cabang.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || !password.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
                >
                  {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{mode === 'create' ? 'Buat Akun Sekarang' : 'Simpan Password Baru'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default TeacherAccountModal;
