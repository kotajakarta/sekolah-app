import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';

export default function PengaturanAkademik() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ semesterAktif: 'Ganjil', tahunAjaran: '', kodeDaftarUlang: '' });

  const { data: setting, isLoading } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/akademik');
      return res.data;
    }
  });

  useEffect(() => {
    if (setting) {
      setFormData({
        semesterAktif: setting.semesterAktif || 'Ganjil',
        tahunAjaran: setting.tahunAjaran || '',
        kodeDaftarUlang: setting.kodeDaftarUlang || ''
      });
    }
  }, [setting]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put('/pengaturan/akademik', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pengaturan-akademik'] });
      showToast('success', 'Pengaturan berhasil disimpan');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // Fetch Module Settings
  const { data: moduleSettings } = useQuery({
    queryKey: ['module-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/modules');
      return res.data;
    },
  });

  const moduleMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put('/pengaturan/modules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-settings'] });
      showToast('success', 'Status Keaktifan Modul berhasil diperbarui');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan status modul');
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Pengaturan Akademik & Fitur Modul</h1>
        <p className="text-sm text-slate-500 mt-1.5">Atur semester, tahun ajaran aktif, serta kontrol keaktifan modul sistem.</p>
      </div>

      {/* ── FITUR TOGGLE MODUL SISTEM (RBAC & SIDEBAR VISIBILITY) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          Kontrol Keaktifan Modul System & Sidebar
        </h2>
        <p className="text-xs text-slate-500">
          Admin Pusat dapat mengaktifkan atau menonaktifkan modul. Jika dinonaktifkan, menu di sidebar akan disembunyikan.
        </p>

        <div className="space-y-3 pt-2">
          {/* TOGGLE PORTAL WALSAN */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Modul Portal Wali Santri</h3>
              <p className="text-xs text-slate-500">Mengontrol akses & tampilan menu Portal Walsan di sidebar.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const currentVal = moduleSettings?.portalWalsanEnabled !== false;
                moduleMutation.mutate({ portalWalsanEnabled: !currentVal });
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                moduleSettings?.portalWalsanEnabled !== false
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
              }`}
            >
              {moduleSettings?.portalWalsanEnabled !== false ? 'AKTIF (Tampil di Sidebar)' : 'NONAKTIF (Sembunyi)'}
            </button>
          </div>

          {/* TOGGLE RAPOR MUADALAH */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Modul Rapor Muadalah</h3>
              <p className="text-xs text-slate-500">Mengontrol akses & tampilan menu Rapor Muadalah di sidebar.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const currentVal = moduleSettings?.raporMuadalahEnabled !== false;
                moduleMutation.mutate({ raporMuadalahEnabled: !currentVal });
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                moduleSettings?.raporMuadalahEnabled !== false
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
              }`}
            >
              {moduleSettings?.raporMuadalahEnabled !== false ? 'AKTIF (Tampil di Sidebar)' : 'NONAKTIF (Sembunyi)'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester Aktif</label>
            <select
              required
              value={formData.semesterAktif}
              onChange={(e) => setFormData({ ...formData, semesterAktif: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
            <input
              type="text"
              required
              value={formData.tahunAjaran}
              onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Contoh: 2026/2027"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kode Daftar Ulang</label>
            <input
              type="text"
              value={formData.kodeDaftarUlang}
              onChange={(e) => setFormData({ ...formData, kodeDaftarUlang: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Contoh: DAFTAR2026 (Kosongkan jika pendaftaran ditutup)"
            />
            <p className="text-xs text-slate-500 mt-1">Kode ini digunakan oleh calon santri / wali santri saat daftar ulang.</p>
          </div>
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
