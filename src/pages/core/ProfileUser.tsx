import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserCircle, Mail, Shield, ShieldCheck, Lock, Edit3, Save, CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

export default function ProfileUser() {
  const { user, login } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState(user?.username || '');
  const [operatorName, setOperatorName] = useState(user?.operatorName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Wilayah muadalah fields
  const [ketuaMuadalahName, setKetuaMuadalahName] = useState('');
  const [ketuaMuadalahPhone, setKetuaMuadalahPhone] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

    // Save wilayah muadalah data if WILAYAH scope
    if (user?.scope === 'WILAYAH' && user?.wilayahId) {
      wilayahMutation.mutate({ ketuaMuadalahName, ketuaMuadalahPhone });
    }
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

            <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-6 space-y-6">
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

              {/* Wilayah Muadalah Info - Only for WILAYAH scope */}
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
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
          </div>
        </div>
      </div>
    </div>
  );
}
