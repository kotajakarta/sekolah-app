import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { X, Send, Loader2, GraduationCap } from 'lucide-react';

interface PermohonanKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  wilayahId?: string;
}

export default function PermohonanKelasModal({ isOpen, onClose, wilayahId }: PermohonanKelasModalProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    namaKelasUsulan: '',
    cabangId: '',
    tingkat: 'Non Muadalah',
    tahunAjaran: '2026/2027 Ganjil',
    lembagaMuadalahId: '',
    kurikulum: 'Kurikulum Mandiri',
    jurusan: 'AGAMA',
    kapasitas: 80
  });

  const { data: cabangList = [] } = useQuery<any[]>({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => (await apiClient.get('/master-data/cabang')).data
  });

  const { data: muadalahList = [] } = useQuery<any[]>({
    queryKey: ['lembaga-muadalah'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/muadalah');
      return res.data.filter((m: any) => m.isActive);
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiClient.post('/formal/kelas/permohonan', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-kelas'] });
      showToast('success', 'Permohonan kelas baru berhasil diajukan! Menunggu verifikasi & penomoran Kode Resmi oleh Admin Pusat.');
      onClose();
      setFormData({
        namaKelasUsulan: '',
        cabangId: '',
        tingkat: 'Non Muadalah',
        tahunAjaran: '2026/2027 Ganjil',
        lembagaMuadalahId: '',
        kurikulum: 'Kurikulum Mandiri',
        jurusan: 'AGAMA',
        kapasitas: 80
      });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mengajukan kelas baru.');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Pengajuan Kelas Baru</h3>
              <p className="text-xs text-slate-500">Wilayah hanya mengajukan. Admin Pusat akan memverifikasi &amp; menentukan Kode Kelas Resmi.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Pilih Cabang Sasaran <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.cabangId}
              onChange={e => setFormData({ ...formData, cabangId: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">-- Pilih Cabang --</option>
              {cabangList.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.wilayah?.name ? `(${c.wilayah.name})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Usulan Nama Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kelas 7 A (akan diverifikasi Admin Pusat)"
              value={formData.namaKelasUsulan}
              onChange={e => setFormData({ ...formData, namaKelasUsulan: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[11px] text-amber-600 mt-1 font-medium">
              ℹ️ Admin Pusat berhak mengubah nama kelas sesuai Kode Kelas standar (misal: 7-W2104 / 11-U1111) sebelum menyetujui.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tingkat Kelas
              </label>
              <select
                value={formData.tingkat}
                onChange={e => setFormData({ ...formData, tingkat: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="Non Muadalah">Non Muadalah</option>
                <option value="Kelas 7">Kelas 7</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
                <option value="Kelas 10">Kelas 10</option>
                <option value="Kelas 11">Kelas 11</option>
                <option value="Kelas 12">Kelas 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lembaga Muadalah
              </label>
              <select
                value={formData.lembagaMuadalahId}
                onChange={e => setFormData({ ...formData, lembagaMuadalahId: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Tanpa Muadalah --</option>
                {muadalahList.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kurikulum
              </label>
              <input
                type="text"
                value={formData.kurikulum}
                onChange={e => setFormData({ ...formData, kurikulum: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kapasitas
              </label>
              <input
                type="number"
                min="1"
                value={formData.kapasitas}
                onChange={e => setFormData({ ...formData, kapasitas: parseInt(e.target.value || '80', 10) })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Kirim Pengajuan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
