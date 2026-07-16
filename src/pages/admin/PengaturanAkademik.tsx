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
  const [formData, setFormData] = useState({ semesterAktif: 'Ganjil', tahunAjaran: '' });

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
        tahunAjaran: setting.tahunAjaran || ''
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Pengaturan Akademik</h1>
        <p className="text-sm text-slate-500 mt-1.5">Atur semester dan tahun ajaran aktif sistem.</p>
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
