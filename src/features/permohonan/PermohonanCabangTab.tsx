import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock, Building2, Loader2, Check, X, Eye } from 'lucide-react';

interface PermohonanCabangItem {
  id: string;
  namaCabangUsulan: string;
  alamatJalan?: string;
  alamatKabName?: string;
  alamatProvName?: string;
  kapasitasSantri?: number;
  alasan?: string;
  catatanAdmin?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  wilayah?: { name: string };
  createdBy?: { operatorName?: string; username?: string };
  approvedBy?: { operatorName?: string; username?: string };
}

interface Props {
  isAdmin: boolean;
}

export default function PermohonanCabangTab({ isAdmin }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [approveModalItem, setApproveModalItem] = useState<PermohonanCabangItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<PermohonanCabangItem | null>(null);

  const [namaCabangFinal, setNamaCabangFinal] = useState('');
  const [catatanAdmin, setCatatanAdmin] = useState('');

  const { data: list = [], isLoading } = useQuery<PermohonanCabangItem[]>({
    queryKey: ['permohonan-cabang'],
    queryFn: async () => (await apiClient.get('/master-data/cabang/permohonan')).data
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, namaCabangFinal, catatanAdmin }: { id: string; namaCabangFinal: string; catatanAdmin?: string }) => {
      return apiClient.post(`/master-data/cabang/permohonan/${id}/approve`, { namaCabangFinal, catatanAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-cabang'] });
      queryClient.invalidateQueries({ queryKey: ['master-data', 'cabang'] });
      showToast('success', 'Permohonan cabang disetujui & cabang baru berhasil dibuat!');
      setApproveModalItem(null);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyetujui cabang.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, catatanAdmin }: { id: string; catatanAdmin?: string }) => {
      return apiClient.post(`/master-data/cabang/permohonan/${id}/reject`, { catatanAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-cabang'] });
      showToast('success', 'Permohonan cabang telah ditolak.');
      setRejectModalItem(null);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menolak cabang.');
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-brand" /> {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          {t('common.no_data')}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">{t('permohonan.status') || 'Status'}</th>
                  <th className="px-4 py-3">{t('permohonan.usulan_nama') || 'Nama Usulan Cabang'}</th>
                  <th className="px-4 py-3">{t('cabang.region') || 'Wilayah'}</th>
                  <th className="px-4 py-3">Lokasi / Kapasitas</th>
                  <th className="px-4 py-3">Pemohon</th>
                  <th className="px-4 py-3 text-center">{t('common.actions') || 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> {t('permohonan.pending') || 'PENDING'}
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> {t('permohonan.approved') || 'APPROVED'}
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> {t('permohonan.rejected') || 'REJECTED'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {item.namaCabangUsulan}
                      {item.alasan && (
                        <p className="text-[11px] font-normal text-slate-500 italic mt-0.5">&ldquo;{item.alasan}&rdquo;</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{item.wilayah?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{[item.alamatKabName, item.alamatProvName].filter(Boolean).join(', ') || '-'}</div>
                      <div className="text-[10px] text-slate-400">Kapasitas: {item.kapasitasSantri || 0} santri</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{item.createdBy?.operatorName || item.createdBy?.username || '-'}</div>
                      <div className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isAdmin && item.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setApproveModalItem(item);
                              setNamaCabangFinal(item.namaCabangUsulan);
                              setCatatanAdmin('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> {t('permohonan.approve_btn') || 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalItem(item);
                              setCatatanAdmin('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> {t('permohonan.reject_btn') || 'Tolak'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {item.catatanAdmin ? `${t('permohonan.catatan_admin') || 'Catatan'}: ${item.catatanAdmin}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Approve Cabang */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Verifikasi &amp; Disetujui Pendirian Cabang</h3>
            <p className="text-xs text-slate-500">Anda dapat menyempurnakan Nama Resmi Cabang sebelum disetujui.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nama Cabang Resmi</label>
              <input
                type="text"
                value={namaCabangFinal}
                onChange={e => setNamaCabangFinal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Catatan Admin (Opsional)</label>
              <input
                type="text"
                placeholder="Catatan verifikasi..."
                value={catatanAdmin}
                onChange={e => setCatatanAdmin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setApproveModalItem(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
              <button
                onClick={() => approveMutation.mutate({ id: approveModalItem.id, namaCabangFinal, catatanAdmin })}
                disabled={approveMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                {approveMutation.isPending ? 'Memproses...' : 'Setujui & Buat Cabang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Cabang */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-base text-rose-700">Tolak Permohonan Cabang</h3>
            <p className="text-xs text-slate-500">Permohonan usulan cabang &ldquo;{rejectModalItem.namaCabangUsulan}&rdquo; akan ditolak.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alasan Penolakan</label>
              <textarea
                rows={2}
                placeholder="Misal: Dokumen kurang lengkap / lokasi sudah ada..."
                value={catatanAdmin}
                onChange={e => setCatatanAdmin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalItem(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModalItem.id, catatanAdmin })}
                disabled={rejectMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                {rejectMutation.isPending ? 'Memproses...' : 'Tolak Permohonan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
