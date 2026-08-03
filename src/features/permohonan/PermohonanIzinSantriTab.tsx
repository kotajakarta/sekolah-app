import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle2, XCircle, Clock, Loader2, Check, X } from 'lucide-react';

type JenisIzinSantri = 'IZIN_PULANG' | 'SAKIT' | 'LAINNYA';
type StatusPermohonan = 'PENDING' | 'APPROVED' | 'REJECTED';

interface PermohonanIzinSantriItem {
  id: string;
  studentId: string;
  jenisIzin: JenisIzinSantri;
  keterangan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: StatusPermohonan;
  catatanAdmin?: string | null;
  createdAt: string;
  student?: { biodata?: { fullName?: string } | null } | null;
  createdBy?: { operatorName?: string; username?: string } | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PermohonanIzinSantriTab() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const JENIS_LABEL: Record<JenisIzinSantri, string> = {
    IZIN_PULANG: t('portal.izin_jenis_pulang') || 'Izin Pulang',
    SAKIT: t('portal.izin_jenis_sakit') || 'Sakit',
    LAINNYA: t('portal.izin_jenis_lainnya') || 'Lainnya',
  };

  const [approveModalItem, setApproveModalItem] = useState<PermohonanIzinSantriItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<PermohonanIzinSantriItem | null>(null);
  const [catatanAdmin, setCatatanAdmin] = useState('');

  const { data: list = [], isLoading } = useQuery<PermohonanIzinSantriItem[]>({
    queryKey: ['permohonan-izin-santri'],
    queryFn: async () => (await apiClient.get('/permohonan-izin-santri')).data,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, catatanAdmin }: { id: string; catatanAdmin?: string }) => {
      return apiClient.post(`/permohonan-izin-santri/${id}/approve`, { catatanAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-izin-santri'] });
      showToast('success', t('portal.izin_approve_success') || 'Permohonan izin berhasil disetujui.');
      setApproveModalItem(null);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || t('portal.izin_approve_error') || 'Gagal menyetujui permohonan izin.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, catatanAdmin }: { id: string; catatanAdmin: string }) => {
      return apiClient.post(`/permohonan-izin-santri/${id}/reject`, { catatanAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permohonan-izin-santri'] });
      showToast('success', t('portal.izin_reject_success') || 'Permohonan izin telah ditolak.');
      setRejectModalItem(null);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || t('portal.izin_reject_error') || 'Gagal menolak permohonan izin.');
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-brand" /> {t('portal.izin_loading') || 'Memuat daftar permohonan izin...'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          {t('portal.izin_empty') || 'Belum ada permohonan izin.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">{t('portal.izin_status') || 'Status'}</th>
                  <th className="px-4 py-3">{t('portal.izin_santri') || 'Santri'}</th>
                  <th className="px-4 py-3">{t('portal.izin_jenis_tanggal') || 'Jenis Izin & Tanggal'}</th>
                  <th className="px-4 py-3">{t('portal.izin_keterangan') || 'Keterangan'}</th>
                  <th className="px-4 py-3">{t('portal.izin_pemohon') || 'Pemohon'}</th>
                  <th className="px-4 py-3 text-center">{t('portal.izin_aksi') || 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors align-top">
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
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.student?.biodata?.fullName || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-semibold text-slate-700">{JENIS_LABEL[item.jenisIzin]}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(item.tanggalMulai)} &ndash; {formatDate(item.tanggalSelesai)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      <p className="whitespace-pre-wrap break-words">{item.keterangan}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{item.createdBy?.operatorName || item.createdBy?.username || '-'}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(item.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setApproveModalItem(item);
                              setCatatanAdmin('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> {t('portal.izin_approve_btn') || 'Setujui'}
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalItem(item);
                              setCatatanAdmin('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> {t('portal.izin_reject_btn') || 'Tolak'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {item.catatanAdmin ? `${t('portal.izin_catatan_admin_label') || 'Catatan Admin'}: ${item.catatanAdmin}` : '—'}
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

      {/* Modal Approve */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-base border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-5 h-5" /> {t('portal.izin_approve_modal_title') || 'Setujui Permohonan Izin'}
            </div>

            <p className="text-xs text-slate-500">
              {t('portal.izin_approve_modal_desc', {
                jenis: JENIS_LABEL[approveModalItem.jenisIzin],
                nama: approveModalItem.student?.biodata?.fullName || '-',
              }) ||
                `Permohonan ${JENIS_LABEL[approveModalItem.jenisIzin]} untuk santri ${approveModalItem.student?.biodata?.fullName || '-'} akan disetujui.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('portal.izin_catatan_admin') || 'Catatan Admin (Opsional)'}
              </label>
              <input
                type="text"
                placeholder={t('portal.izin_catatan_admin_placeholder') || 'Catatan tambahan (opsional)...'}
                value={catatanAdmin}
                onChange={e => setCatatanAdmin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setApproveModalItem(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                {t('portal.izin_batal') || 'Batal'}
              </button>
              <button
                onClick={() => approveMutation.mutate({ id: approveModalItem.id, catatanAdmin })}
                disabled={approveMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {approveMutation.isPending ? (t('portal.izin_processing') || 'Memproses...') : (t('portal.izin_approve_btn') || 'Setujui')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 text-base text-rose-700">{t('portal.izin_reject_modal_title') || 'Tolak Permohonan Izin'}</h3>
            <p className="text-xs text-slate-500">
              {t('portal.izin_reject_modal_desc', { nama: rejectModalItem.student?.biodata?.fullName || '-' }) ||
                `Permohonan izin untuk santri ${rejectModalItem.student?.biodata?.fullName || '-'} akan ditolak.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {t('portal.izin_alasan_tolak') || 'Alasan Penolakan'}
              </label>
              <textarea
                rows={2}
                placeholder={t('portal.izin_alasan_tolak_placeholder') || 'Jelaskan alasan penolakan...'}
                value={catatanAdmin}
                onChange={e => setCatatanAdmin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setRejectModalItem(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                {t('portal.izin_batal') || 'Batal'}
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModalItem.id, catatanAdmin })}
                disabled={rejectMutation.isPending || !catatanAdmin.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? (t('portal.izin_processing') || 'Memproses...') : (t('portal.izin_reject_btn') || 'Tolak')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
