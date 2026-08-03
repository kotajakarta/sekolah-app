import { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useUpdatePortalProfile } from '../../features/portal/hooks/useUpdatePortalProfile';
import { UserCircle, Lock, Edit3, Save, CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';

export default function PortalProfile() {
  const { user, login } = useAuth();
  // Profile editing is account-level, not student-scoped, so this page does not
  // block on `selectedStudentId` being null the way the other five portal pages do
  // (see report: PortalProfile deviation) — a wali with zero linked children must
  // still be able to change their own password. `links` is still read here to
  // render the read-only "Santri Terhubung" list below.
  const { links, isLoading } = usePortalStudent();

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
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    const payload: { operatorName?: string; password?: string } = { operatorName };
    if (password) payload.password = password;

    mutation.mutate(payload, {
      onSuccess: (data) => {
        login(data.token, data.user);
        setSuccessMsg('Profil berhasil diperbarui!');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMsg(''), 5000);
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil');
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-600 to-blue-600" />
        <div className="px-5 pb-5">
          <div className="flex justify-between items-end -mt-8 mb-4">
            <div className="bg-white p-1 rounded-full ring-4 ring-white shadow-md">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <UserCircle className="w-10 h-10" />
              </div>
            </div>
          </div>
          <h1 className="text-lg font-bold text-slate-800">{user?.operatorName || user?.username}</h1>
          <p className="text-sm text-slate-500">{user?.username}</p>

          {successMsg && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-slate-100 mt-5 pt-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit Profil
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Operator</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4" /> Ganti Password (Opsional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password baru"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-2.5 shadow-sm disabled:opacity-50"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" /> Santri Terhubung
        </h2>
        {isLoading ? (
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
          </p>
        ) : links.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada santri yang terhubung ke akun ini.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {links.map((link) => (
              <li key={link.id} className="py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{link.student.biodata?.fullName ?? '-'}</span>
                {link.hubungan && (
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                    {link.hubungan}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
