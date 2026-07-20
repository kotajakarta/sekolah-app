import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, FileText, Download, CheckCircle2, AlertCircle, Info, Building, Clock, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';

interface Panitia {
  user: {
    operatorName: string | null;
    username: string;
  };
  jabatan: string;
}

interface Dokumen {
  id: string;
  filePath: string;
  fileName: string;
  fileType: string;
}

interface Kegiatan {
  id: string;
  judul: string;
  deskripsi: string;
  ringkasan: string;
  jenis: string;
  deadline: string;
  status: string;
  panitia: Panitia[];
  dokumen: Dokumen[];
}

interface Notifikasi {
  id: string;
  kegiatanId: string;
  asramaId: string;
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByUser: { operatorName: string | null; username: string } | null;
  kegiatan: Kegiatan;
  asrama: { nama: string };
  createdAt: string;
}

export default function DashboardAsrama() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch all BAP notifications for Dorms
  const { data: notifications = [], isLoading, isError } = useQuery<Notifikasi[]>({
    queryKey: ['kegiatan', 'notifikasi'],
    queryFn: async () => {
      // Admin/Global can see everything. Branch users see theirs.
      const res = await apiClient.get('/kegiatan/notifikasi/asrama');
      return res.data;
    }
  });

  // Filter notifications for the current user's branch if they are scope = CABANG
  const filteredNotifications = notifications.filter(notif => {
    if (user?.scope === 'CABANG') {
      // Since Ruang/Asrama belongs to Cabang, we can trust the backend handles scope or filter here
      return true; 
    }
    return true;
  });

  // Mutation to confirm BAP receipt
  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/kegiatan/notifikasi/${id}/confirm`);
    },
    onSuccess: () => {
      showToast('success', 'BAP berhasil dikonfirmasi sebagai tanda terima.');
      queryClient.invalidateQueries({ queryKey: ['kegiatan', 'notifikasi'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal mengkonfirmasi BAP.');
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDownload = (filePath: string, fileName: string) => {
    // Generate full URL
    const url = `${apiClient.defaults.baseURL || ''}${filePath}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-6 h-6 text-indigo-500" />
          Dashboard BAP Asrama
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar berita acara pelaksanaan (BAP) kegiatan sekolah yang di-broadcast ke asrama Anda.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat data notifikasi BAP.
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">Belum ada broadcast kegiatan atau berita acara untuk asrama saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notif => {
            const isExpired = new Date(notif.kegiatan.deadline) < new Date();
            const isOpen = expandedId === notif.id;
            const ketua = notif.kegiatan.panitia.find(p => p.jabatan === 'KETUA')?.user;
            const ketuaName = ketua?.operatorName || ketua?.username || 'Belum ditunjuk';

            return (
              <div
                key={notif.id}
                className={`bg-white border rounded-xl shadow-sm transition-all overflow-hidden ${
                  notif.isConfirmed 
                    ? 'border-slate-200' 
                    : 'border-indigo-500 ring-1 ring-indigo-500/20'
                }`}
              >
                {/* Header Summary */}
                <div
                  onClick={() => toggleExpand(notif.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        notif.kegiatan.jenis === 'HUT'
                          ? 'bg-rose-50 text-rose-700 border-rose-150'
                          : notif.kegiatan.jenis === 'RAMADHAN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                            : notif.kegiatan.jenis === 'PIKNIK'
                              ? 'bg-amber-50 text-amber-700 border-amber-150'
                              : 'bg-slate-50 text-slate-700 border-slate-150'
                      }`}>
                        {notif.kegiatan.jenis}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Tenggat: {new Date(notif.kegiatan.deadline).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {isExpired && (
                        <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">CLOSED</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-800 truncate">{notif.kegiatan.judul}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{notif.kegiatan.ringkasan || notif.kegiatan.deskripsi}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-slate-650 bg-slate-100 px-2 py-0.5 rounded">
                        Asrama: {notif.asrama.nama}
                      </span>
                      <span>Ketua: {ketuaName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Status Badge */}
                    {notif.isConfirmed ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Terkonfirmasi
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-650 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-semibold">
                        <Clock className="w-4 h-4" />
                        Perlu Konfirmasi
                      </div>
                    )}
                    
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-[#fbfbfb] p-6 space-y-6">
                    {/* Description */}
                    <div className="space-y-2">
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Detail Pelaksanaan / Juknis:</span>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-150 rounded-lg p-4 shadow-none">
                        {notif.kegiatan.deskripsi}
                      </p>
                    </div>

                    {/* Files & Media */}
                    {notif.kegiatan.dokumen.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Lampiran Dokumen & Foto:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {notif.kegiatan.dokumen.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-semibold text-slate-700 truncate">{doc.fileName}</p>
                                  <p className="text-[9px] text-slate-400 uppercase font-bold">{doc.fileType}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownload(doc.filePath, doc.fileName)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confirm receipt section */}
                    <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        {notif.isConfirmed ? (
                          <p className="text-xs text-slate-500">
                            Dikonfirmasi oleh <span className="font-semibold text-slate-700">{notif.confirmedByUser?.operatorName || notif.confirmedByUser?.username}</span> pada{' '}
                            <span className="font-semibold">{new Date(notif.confirmedAt!).toLocaleString('id-ID')}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                            Konfirmasi tanda terima ini menandakan asrama Anda telah membaca juknis dan siap mensosialisasikan.
                          </p>
                        )}
                      </div>

                      {!notif.isConfirmed && (
                        <button
                          onClick={() => confirmMutation.mutate(notif.id)}
                          disabled={confirmMutation.isPending || isExpired}
                          className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          {confirmMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Konfirmasi Tanda Terima BAP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
