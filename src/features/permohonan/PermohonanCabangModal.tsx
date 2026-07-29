import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { X, Send, Loader2, Building2 } from 'lucide-react';

interface PermohonanCabangModalProps {
  isOpen: boolean;
  onClose: () => void;
  wilayahId?: string;
}

export default function PermohonanCabangModal({ isOpen, onClose, wilayahId }: PermohonanCabangModalProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    namaCabangUsulan: '',
    alamatJalan: '',
    alamatKabName: '',
    alamatProvName: '',
    kapasitasSantri: 100,
    alasan: ''
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiClient.post('/master-data/cabang/permohonan', {
        ...data,
        wilayahId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-cabang'] });
      showToast('success', 'Permohonan cabang baru berhasil diajukan! Menunggu verifikasi Admin Pusat.');
      onClose();
      setFormData({
        namaCabangUsulan: '',
        alamatJalan: '',
        alamatKabName: '',
        alamatProvName: '',
        kapasitasSantri: 100,
        alasan: ''
      });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mengajukan cabang baru.');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Pengajuan Cabang Baru</h3>
              <p className="text-xs text-slate-500">Ajukan permohonan pendirian cabang baru ke Admin Pusat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Usulan Nama Cabang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Cabang Surabaya Selatan"
              value={formData.namaCabangUsulan}
              onChange={e => setFormData({ ...formData, namaCabangUsulan: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Provinsi
              </label>
              <input
                type="text"
                placeholder="Jawa Timur"
                value={formData.alamatProvName}
                onChange={e => setFormData({ ...formData, alamatProvName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kabupaten / Kota
              </label>
              <input
                type="text"
                placeholder="Kota Surabaya"
                value={formData.alamatKabName}
                onChange={e => setFormData({ ...formData, alamatKabName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Lengkap
            </label>
            <input
              type="text"
              placeholder="Jl. Raya Utama No. 123"
              value={formData.alamatJalan}
              onChange={e => setFormData({ ...formData, alamatJalan: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kapasitas Santri
              </label>
              <input
                type="number"
                min="0"
                value={formData.kapasitasSantri}
                onChange={e => setFormData({ ...formData, kapasitasSantri: parseInt(e.target.value || '0', 10) })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Alasan Pengajuan
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan urgensi atau latar belakang penambahan cabang ini..."
              value={formData.alasan}
              onChange={e => setFormData({ ...formData, alasan: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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
