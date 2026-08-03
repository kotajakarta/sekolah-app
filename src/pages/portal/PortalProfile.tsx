import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useUpdatePortalProfile } from '../../features/portal/hooks/useUpdatePortalProfile';
import { UserCircle, Lock, Edit3, Save, CheckCircle2, AlertCircle, Loader2, Users, ShieldCheck } from 'lucide-react';

export default function PortalProfile() {
  const { user, login } = useAuth();
  const { links, isLoading, isError } = usePortalStudent();

  const [operatorName, setOperatorName] = useState(user?.operatorName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const mutation = useUpdatePortalProfile();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (password && password !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    const payload: { operatorName?: string; password?: string } = { operatorName };
    if (password) payload.password = password;

    mutation.mutate(payload, {
      onSuccess: (data) => {
        login(data.token, data.user);
        setSuccessMsg('Profil akun walisantri berhasil diperbarui!');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMsg(''), 5000);
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil.');
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* ── CARD PROFIL AKUN WALISANTRI ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#0A192F] via-indigo-900 to-indigo-800 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
        </div>
        <div className="px-6 sm:px-8 pb-8">
          <div className="flex justify-between items-end -mt-10 mb-5">
            <div className="bg-white p-1.5 rounded-2xl ring-4 ring-white shadow-md">
              <div className="w-18 h-18 sm:w-20 sm:h-20 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-2xl border border-indigo-100">
                {user?.operatorName ? user.operatorName.charAt(0).toUpperCase() : <UserCircle className="w-12 h-12" />}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <ShieldCheck className="w-3.5 h-3.5" /> Akun Walisantri
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{user?.operatorName || user?.username}</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Username: @{user?.username}</p>

          {successMsg && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-slate-100 mt-6 pt-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Edit3 className="w-4 h-4" /> Informasi Nama Pengguna
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nama Walisantri / Operator</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Nama Lengkap Walisantri"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4" /> Ubah Password Akun (Opsional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password Baru</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── CARD SANTRI TERHUBUNG ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600" /> Daftar Anak Santri Terhubung
        </h2>
        {isLoading ? (
          <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat data anak...
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-sm text-rose-600">Gagal memuat data anak santri.</div>
        ) : links.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            Belum ada santri yang terhubung ke akun ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {links.map((link) => (
              <div key={link.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">{link.student.biodata?.fullName ?? '-'}</p>
                  {link.student.cabang?.name && (
                    <p className="text-xs text-slate-400 mt-0.5">{link.student.cabang.name}</p>
                  )}
                </div>
                {link.hubungan && (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    {link.hubungan}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
