import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, FileText, Download, CheckCircle2, AlertCircle, Info, Building, Clock, ChevronDown, ChevronUp, Sparkles, Loader2, Plus } from 'lucide-react';

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
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByUser: { operatorName: string | null; username: string } | null;
  cabang: { name: string };
  asrama?: { nama: string } | null;
  panitia: Panitia[];
  dokumen: Dokumen[];
  createdAt: string;
}

export default function ListKegiatanBap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch all Kegiatan BAPs
  const { data: BAPs = [], isLoading, isError } = useQuery<Kegiatan[]>({
    queryKey: ['kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan');
      return res.data;
    }
  });

  // Mutation to confirm BAP receipt (Pusat Only)
  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/kegiatan/${id}/confirm`);
    },
    onSuccess: () => {
      showToast('success', 'BAP berhasil dikonfirmasi sebagai tanda terima.');
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal mengkonfirmasi BAP.');
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDownload = (filePath: string, fileName: string) => {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-500" />
            Laporan Berita Acara Pelaksanaan (BAP)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.scope === 'GLOBAL'
              ? 'Seluruh data BAP kegiatan sekolah yang dilaporkan oleh Cabang.'
              : 'Daftar BAP kegiatan sekolah milik cabang Anda yang dilaporkan ke Pusat.'}
          </p>
        </div>
        
        {user?.scope === 'CABANG' && (
          <button
            onClick={() => navigate('/dashboard/kegiatan/buat')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-650 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Laporan BAP
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat data BAP.
        </div>
      ) : BAPs.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">Belum ada laporan BAP kegiatan yang tercatat.</p>
          {user?.scope === 'CABANG' && (
            <button
              onClick={() => navigate('/dashboard/kegiatan/buat')}
              className="mt-4 px-4 py-2 text-xs font-bold text-indigo-650 border border-indigo-250 bg-white hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Mulai Buat Laporan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {BAPs.map(bap => {
            const isExpired = new Date(bap.deadline) < new Date();
            const isOpen = expandedId === bap.id;
            const ketua = bap.panitia.find(p => p.jabatan === 'KETUA')?.user;
            const ketuaName = ketua?.operatorName || ketua?.username || 'Belum ditunjuk';

            return (
              <div
                key={bap.id}
                className={`bg-white border rounded-xl shadow-sm transition-all overflow-hidden ${
                  bap.isConfirmed 
                    ? 'border-slate-200' 
                    : 'border-indigo-500 ring-1 ring-indigo-500/20'
                }`}
              >
                {/* Header Summary */}
                <div
                  onClick={() => toggleExpand(bap.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        bap.jenis === 'HUT'
                          ? 'bg-rose-50 text-rose-700 border-rose-150'
                          : bap.jenis === 'RAMADHAN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                            : bap.jenis === 'PIKNIK'
                              ? 'bg-amber-50 text-amber-700 border-amber-150'
                              : 'bg-slate-50 text-slate-700 border-slate-150'
                      }`}>
                        {bap.jenis}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Tenggat: {new Date(bap.deadline).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {isExpired && (
                        <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">CLOSED</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-800 truncate">{bap.judul}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{bap.ringkasan || bap.deskripsi}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-slate-650 bg-slate-100 px-2 py-0.5 rounded">
                        Cabang: {bap.cabang.name}
                      </span>
                      {bap.asrama && (
                        <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Asrama: {bap.asrama.nama}
                        </span>
                      )}
                      <span>Ketua: {ketuaName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Status Badge */}
                    {bap.isConfirmed ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Diterima Pusat
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-650 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-semibold">
                        <Clock className="w-4 h-4" />
                        Menunggu Verifikasi
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
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Detail Pelaksanaan / Laporan BAP:</span>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-150 rounded-lg p-4 shadow-none">
                        {bap.deskripsi}
                      </p>
                    </div>

                    {/* Files & Media */}
                    {bap.dokumen.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Lampiran Dokumen & Foto:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {bap.dokumen.map(doc => (
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
                        {bap.isConfirmed ? (
                          <p className="text-xs text-slate-500">
                            Diterima oleh Pusat (<span className="font-semibold text-slate-700">{bap.confirmedByUser?.operatorName || bap.confirmedByUser?.username}</span>) pada{' '}
                            <span className="font-semibold">{new Date(bap.confirmedAt!).toLocaleString('id-ID')}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                            {user?.scope === 'GLOBAL' 
                              ? 'Periksa dokumen di atas sebelum menandai tanda terima BAP.'
                              : 'Menunggu konfirmasi penerimaan BAP oleh Administrator Pusat.'}
                          </p>
                        )}
                      </div>

                      {!bap.isConfirmed && user?.scope === 'GLOBAL' && (
                        <button
                          onClick={() => confirmMutation.mutate(bap.id)}
                          disabled={confirmMutation.isPending}
                          className="px-5 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {confirmMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Konfirmasi Terima Laporan BAP
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
