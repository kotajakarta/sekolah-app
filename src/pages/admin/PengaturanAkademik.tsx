import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  GraduationCap,
  Calendar,
  Layers,
  KeyRound,
  CheckCircle2,
  Loader2,
  Info,
  Building,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function PengaturanAkademik() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    semesterAktif: 'Ganjil',
    tahunAjaran: '',
    kodeDaftarUlang: '',
  });

  const { data: setting, isLoading } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/akademik');
      return res.data;
    },
  });

  useEffect(() => {
    if (setting) {
      setFormData({
        semesterAktif: setting.semesterAktif || 'Ganjil',
        tahunAjaran: setting.tahunAjaran || '',
        kodeDaftarUlang: setting.kodeDaftarUlang || '',
      });
    }
  }, [setting]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put('/pengaturan/akademik', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pengaturan-akademik'] });
      showToast('success', 'Pengaturan akademik berhasil disimpan');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan pengaturan akademik');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Akademik</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Konfigurasi tahun ajaran, semester berjalan, dan kode pendaftaran daftar ulang santri.
            </p>
          </div>
        </div>
      </div>

      {/* ── CARD FORM ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Periode Akademik Aktif</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan ini akan menjadi acuan global untuk modul e-Rapor, Pembelajaran, dan Riwayat Nilai.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Semester Aktif */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Semester Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.semesterAktif}
                  onChange={(e) => setFormData({ ...formData, semesterAktif: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>

            {/* Tahun Ajaran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tahun Ajaran <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={formData.tahunAjaran}
                onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                placeholder="Contoh: 2025/2026 atau 2026/2027"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Kode Daftar Ulang */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Kode Akses Daftar Ulang Santri</span>
            </label>
            <input
              type="text"
              value={formData.kodeDaftarUlang}
              onChange={(e) => setFormData({ ...formData, kodeDaftarUlang: e.target.value })}
              placeholder="Contoh: DAFTAR2026 (Kosongkan jika registrasi daftar ulang ditutup)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-mono"
            />
            <div className="p-3 mt-2 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                Kode ini digunakan oleh calon santri / wali santri saat mengakses formulir daftar ulang.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Pengaturan Akademik</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
