import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle2, XCircle, Clock, GraduationCap, Loader2, Check, X, Edit3 } from 'lucide-react';

interface PermohonanKelasItem {
  id: string;
  namaKelasUsulan: string;
  namaKelasDisetujui?: string;
  tingkat?: string;
  tahunAjaran?: string;
  kurikulum?: string;
  jurusan?: string;
  kapasitas?: number;
  catatanAdmin?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  cabang?: { name: string };
  wilayah?: { name: string };
  createdBy?: { operatorName?: string; username?: string };
  approvedBy?: { operatorName?: string; username?: string };
}

interface Props {
  isAdmin: boolean;
}

export default function PermohonanKelasTab({ isAdmin }: Props) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [approveModalItem, setApproveModalItem] = useState<PermohonanKelasItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<PermohonanKelasItem | null>(null);

  const [kodeKelasResmi, setKodeKelasResmi] = useState('');
  const [catatanAdmin, setCatatanAdmin] = useState('');

  const { data: list = [], isLoading } = useQuery<PermohonanKelasItem[]>({
    queryKey: ['permohonan-kelas'],
    queryFn: async () => (await apiClient.get('/formal/kelas/permohonan')).data
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, kodeKelasResmi, catatanAdmin }: { id: string; kodeKelasResmi: string; catatanAdmin?: string }) => {
      return apiClient.post(`/formal/kelas/permohonan/${id}/approve`, { kodeKelasResmi, catatanAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-kelas'] });
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      showToast('success', 'Permohonan kelas disetujui & kelas resmi berhasil dibuat!');
      setApproveModalItem(null);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyetujui kelas.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, catatanAdmin }: { id: string; catatanAdmin?: string }) => {
      return apiClient.post(`/formal/kelas/permohonan/${id}/reject`, { catatanAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-kelas'] });
      showToast('success', 'Permohonan kelas telah ditolak.');
      setRejectModalItem(null);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menolak permohonan kelas.');
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-brand" /> Memuat daftar permohonan kelas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          Belum ada permohonan kelas baru.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Usulan vs Kode Disetujui</th>
                  <th className="px-4 py-3">Cabang / Wilayah</th>
                  <th className="px-4 py-3">Tingkat / Kurikulum</th>
                  <th className="px-4 py-3">Pemohon</th>
                  <th className="px-4 py-3 text-center">Aksi (Verifikasi Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> APPROVED
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">Usulan: {item.namaKelasUsulan}</div>
                      {item.namaKelasDisetujui ? (
                        <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">
                          Kode Resmi: {item.namaKelasDisetujui}
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-600 italic mt-0.5">Menunggu penentuan Kode Resmi oleh Admin</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-semibold text-slate-700">{item.cabang?.name || '-'}</div>
                      <div className="text-[10px] text-slate-400">{item.wilayah?.name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{item.tingkat || '-'}</div>
                      <div className="text-[10px] text-slate-400">{item.kurikulum || '-'}</div>
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
                              // Auto-suggest code or use proposal
                              setKodeKelasResmi(item.namaKelasUsulan);
                              setCatatanAdmin('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit &amp; Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalItem(item);
                              setCatatanAdmin('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {item.catatanAdmin ? `Catatan: ${item.catatanAdmin}` : '—'}
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

      {/* Modal Approve & Edit Kode Kelas Resmi */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-base border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5" /> Verifikasi &amp; Tentukan Kode Kelas Resmi
            </div>

            <p className="text-xs text-slate-500">
              Admin Pusat <b>wajib/berhak mengedit</b> nama usulan <i>&ldquo;{approveModalItem.namaKelasUsulan}&rdquo;</i> menjadi <b>Kode Kelas Resmi</b> (contoh: <code>7-W2104</code> / <code>11-U1111</code>) sebelum menyetujui.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Kode Kelas Resmi (Standardized Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 7-W2104"
                value={kodeKelasResmi}
                onChange={e => setKodeKelasResmi(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Catatan Admin (Opsional)</label>
              <input
                type="text"
                placeholder="Disetujui dengan penyesuaian kode kelas resmi..."
                value={catatanAdmin}
                onChange={e => setCatatanAdmin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setApproveModalItem(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
              <button
                onClick={() => approveMutation.mutate({ id: approveModalItem.id, kodeKelasResmi, catatanAdmin })}
                disabled={approveMutation.isPending || !kodeKelasResmi.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Memproses...' : 'Setujui dengan Kode Resmi ini'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Kelas */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-base text-rose-700">Tolak Permohonan Kelas</h3>
            <p className="text-xs text-slate-500">Permohonan usulan kelas &ldquo;{rejectModalItem.namaKelasUsulan}&rdquo; akan ditolak.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Alasan Penolakan</label>
              <textarea
                rows={2}
                placeholder="Misal: Format usulan tidak sesuai / kuota kelas cabang penuh..."
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
