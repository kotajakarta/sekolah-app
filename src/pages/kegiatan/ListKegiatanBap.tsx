import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, FileText, Download, CheckCircle2, AlertCircle, Info, Building, Clock, ChevronDown, ChevronUp, Sparkles, Loader2, Plus, Tag, Eye, X, Image as ImageIcon, File, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface Panitia {
  id?: string;
  staffId?: string;
  staff?: {
    id: string;
    name: string;
    position: string;
  };
  user?: {
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
  deskripsi?: string;
  tanggalKegiatan?: string | null;
  waktuKegiatan?: string | null;
  tempatKegiatan?: string | null;
  jumlahPeserta?: number | null;
  totalSantri?: number | null;
  totalGuru?: number | null;
  ringkasanKegiatan?: string | null;
  kesimpulan?: string | null;
  evaluasiBaik?: string | null;
  evaluasiPerbaikan?: string | null;
  bentukKegiatan?: string | null;
  rangkaianKegiatan?: string | null;
  hasilPelaksanaan?: string | null;
  isConfirmed: boolean;
  confirmedAt: string | null;
  confirmedByUser: { operatorName: string | null; username: string } | null;
  cabang: { name: string };
  asrama?: { nama: string } | null;
  panitia: Panitia[];
  dokumen: Dokumen[];
  createdAt: string;
  template: {
    judul: string;
    deskripsi?: string;
    deadline: string;
    jenis: { nama: string };
    dokumen?: Dokumen[];
  };
}

// ─── File Viewer Modal ─────────────────────────────────────────────────────────
interface FileViewerProps {
  doc: Dokumen;
  onClose: () => void;
}

function FileViewer({ doc, onClose }: FileViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fileUrl = `${apiClient.defaults.baseURL || ''}${doc.filePath}`;
  const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.fileName) || doc.fileType?.startsWith('image');
  const isPdf = /\.pdf$/i.test(doc.fileName) || doc.fileType === 'application/pdf';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '90vw', maxWidth: 900, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isImage ? <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" /> : <FileText className="w-4 h-4 text-indigo-500 shrink-0" />}
            <span className="text-sm font-semibold text-slate-800 truncate">{doc.fileName}</span>
            <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{doc.fileType || 'file'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {isImage && (
              <>
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} title="Perkecil" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} title="Perbesar" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setRotation(r => (r + 90) % 360)} title="Putar" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer">
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200" />
              </>
            )}
            <button onClick={handleDownload} title="Unduh" className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} title="Tutup" className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 rounded-b-2xl" style={{ minHeight: 300 }}>
          {isImage ? (
            <div className="overflow-auto flex items-center justify-center w-full h-full p-4">
              <img
                src={fileUrl}
                alt={doc.fileName}
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={doc.fileName}
              className="w-full rounded-b-2xl border-0"
              style={{ height: '70vh' }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-12 text-center">
              <File className="w-16 h-16 text-slate-300" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Preview tidak tersedia</p>
                <p className="text-xs text-slate-400 mt-1">Format {doc.fileType || doc.fileName.split('.').pop()?.toUpperCase()} tidak dapat ditampilkan secara langsung.</p>
              </div>
              <button
                onClick={handleDownload}
                className="mt-2 px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh Berkas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ListKegiatanBap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Dokumen | null>(null);

  // Fetch all BAPs
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

  // Mutation to unconfirm BAP receipt (Pusat Only)
  const unconfirmMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/kegiatan/${id}/unconfirm`);
    },
    onSuccess: () => {
      showToast('success', 'Konfirmasi BAP berhasil dibatalkan. Akses edit kini terbuka.');
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal membatalkan konfirmasi BAP.');
    }
  });

  // Mutation to delete BAP (Pusat Only)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/kegiatan/${id}`);
    },
    onSuccess: () => {
      showToast('success', 'Laporan BAP berhasil dihapus. Cabang kini dapat membuat ulang.');
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal menghapus BAP.');
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
      {/* File Viewer Modal */}
      {viewingDoc && <FileViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}

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
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Laporan BAP
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
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
              className="mt-4 px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 bg-white hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Mulai Buat Laporan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {BAPs.map(bap => {
            const isExpired = new Date(bap.template.deadline) < new Date();
            const isOpen = expandedId === bap.id;
            const ketuaPanitia = bap.panitia.find(p => p.jabatan === 'KETUA');
            const sekretarisPanitia = bap.panitia.find(p => p.jabatan === 'SEKRETARIS');
            const bendaharaPanitia = bap.panitia.find(p => p.jabatan === 'BENDAHARA');

            const ketuaName = ketuaPanitia?.staff?.name || ketuaPanitia?.user?.operatorName || ketuaPanitia?.user?.username || 'Belum ditunjuk';
            const sekretarisName = sekretarisPanitia?.staff?.name || sekretarisPanitia?.user?.operatorName || sekretarisPanitia?.user?.username || '-';
            const bendaharaName = bendaharaPanitia?.staff?.name || bendaharaPanitia?.user?.operatorName || bendaharaPanitia?.user?.username || '-';

            // Categorize dokumen based on fileType (DOCUMENT/SURAT_PENGANTAR vs PHOTO)
            const docFiles = bap.dokumen.filter(d => d.fileType === 'DOCUMENT' || d.fileType === 'SURAT_PENGANTAR' || (!d.fileType && !/\.(jpe?g|png|gif|webp|bmp)$/i.test(d.fileName)));
            const photoFiles = bap.dokumen.filter(d => d.fileType === 'PHOTO' || (!d.fileType && /\.(jpe?g|png|gif|webp|bmp)$/i.test(d.fileName)));

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
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border bg-indigo-50 text-indigo-700 border-indigo-150">
                        {bap.template.jenis.nama}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Tenggat: {new Date(bap.template.deadline).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      {isExpired && (
                        <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">CLOSED</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-800 truncate">{bap.template.judul}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">Dilaporkan oleh: {bap.cabang.name}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-slate-655 bg-slate-100 px-2 py-0.5 rounded">
                        Cabang: {bap.cabang.name}
                      </span>
                      {bap.asrama && (
                        <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Asrama: {bap.asrama.nama}
                        </span>
                      )}
                      <span>Ketua Panitia: {ketuaName}</span>
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
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-semibold">
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
                    {/* Template Instruction Helper */}
                    <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Petunjuk / Juknis Pusat:</span>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap">{bap.template.deskripsi}</p>
                      </div>

                      {bap.template.dokumen && bap.template.dokumen.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-indigo-100/30">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lampiran Pusat ({bap.template.dokumen.length}):</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {bap.template.dokumen.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white">
                                <span className="text-[11px] text-slate-700 truncate font-medium flex-1 mr-2">{doc.fileName}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setViewingDoc(doc)}
                                    title="Lihat"
                                    className="p-1.5 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(doc.filePath, doc.fileName)}
                                    title="Unduh"
                                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Data Lengkap Pelaksanaan BAP */}
                    <div className="space-y-4">
                      {/* Grid 1: Tempat, Waktu, Breakdown Peserta */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Waktu & Tempat */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-indigo-500" />
                            Pelaksanaan & Waktu
                          </h4>
                          <div className="text-xs space-y-1 text-slate-600">
                            <div><span className="font-medium text-slate-400">Tempat:</span> <span className="font-semibold text-slate-800">{bap.tempatKegiatan || bap.cabang?.name}</span></div>
                            <div><span className="font-medium text-slate-400">Tanggal:</span> <span className="font-semibold text-slate-800">{bap.tanggalKegiatan ? new Date(bap.tanggalKegiatan).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '-'}</span></div>
                            <div><span className="font-medium text-slate-400">Waktu:</span> <span className="font-semibold text-slate-800">{bap.waktuKegiatan || '-'}</span></div>
                          </div>
                        </div>

                        {/* Breakdown Peserta */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-indigo-500" />
                            Rincian Jumlah Peserta
                          </h4>
                          <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Santri</span>
                              <span className="text-sm font-bold text-slate-800">{bap.totalSantri ?? 0}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Guru</span>
                              <span className="text-sm font-bold text-slate-800">{bap.totalGuru ?? 0}</span>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2">
                              <span className="block text-[10px] text-indigo-500 uppercase font-bold">Total</span>
                              <span className="text-sm font-bold text-indigo-900">{bap.jumlahPeserta ?? ((bap.totalSantri || 0) + (bap.totalGuru || 0))}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Grid 2: Penanggung Jawab / Panitia */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Penanggung Jawab Pelaksana</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Ketua</span>
                            <span className="font-bold text-slate-800">{ketuaName}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Sekretaris</span>
                            <span className="font-semibold text-slate-800">{sekretarisName}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase">Bendahara</span>
                            <span className="font-semibold text-slate-800">{bendaharaName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Grid 3: Bentuk & Rangkaian Kegiatan */}
                      {(bap.bentukKegiatan || bap.rangkaianKegiatan) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {bap.bentukKegiatan && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Bentuk Kegiatan:</span>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{bap.bentukKegiatan}</p>
                            </div>
                          )}
                          {bap.rangkaianKegiatan && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Rangkaian Kegiatan:</span>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{bap.rangkaianKegiatan}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hasil Pelaksanaan */}
                      {(bap.hasilPelaksanaan || bap.kesimpulan || bap.deskripsi) && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
                          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Hasil Pelaksanaan:</span>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {bap.hasilPelaksanaan || bap.kesimpulan || bap.deskripsi}
                          </p>
                        </div>
                      )}

                      {/* Evaluasi Kegiatan */}
                      {(bap.evaluasiBaik || bap.evaluasiPerbaikan) && (
                        <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 space-y-3">
                          <span className="block text-xs font-bold text-amber-900 uppercase tracking-wider">Evaluasi Pelaksanaan</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {bap.evaluasiBaik && (
                              <div className="bg-white border border-amber-100 rounded-lg p-3">
                                <span className="font-bold text-emerald-700 block mb-1">Hal Yang Sudah Baik:</span>
                                <p className="text-slate-700 whitespace-pre-wrap">{bap.evaluasiBaik}</p>
                              </div>
                            )}
                            {bap.evaluasiPerbaikan && (
                              <div className="bg-white border border-amber-100 rounded-lg p-3">
                                <span className="font-bold text-amber-800 block mb-1">Hal Yang Perlu Ditingkatkan:</span>
                                <p className="text-slate-700 whitespace-pre-wrap">{bap.evaluasiPerbaikan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dokumen Files */}
                    {docFiles.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Dokumen Lampiran ({docFiles.length}):</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {docFiles.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-semibold text-slate-700 truncate">{doc.fileName}</p>
                                  <p className="text-[9px] text-slate-400 uppercase font-bold">{doc.fileType}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2 shrink-0">
                                <button
                                  onClick={() => setViewingDoc(doc)}
                                  title="Lihat"
                                  className="p-1.5 hover:bg-indigo-50 rounded text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownload(doc.filePath, doc.fileName)}
                                  title="Unduh"
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photo Gallery */}
                    {photoFiles.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Foto Kegiatan ({photoFiles.length}):</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {photoFiles.map(doc => {
                            const photoUrl = `${apiClient.defaults.baseURL || ''}${doc.filePath}`;
                            return (
                              <div
                                key={doc.id}
                                className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer"
                                onClick={() => setViewingDoc(doc)}
                              >
                                <img
                                  src={photoUrl}
                                  alt={doc.fileName}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 translate-y-full group-hover:translate-y-0 transition-transform">
                                  <p className="text-[10px] text-white truncate">{doc.fileName}</p>
                                </div>
                              </div>
                            );
                          })}
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
                              ? 'Periksa kesesuaian laporan dengan petunjuk pusat sebelum menandai tanda terima BAP.'
                              : 'Menunggu konfirmasi penerimaan BAP oleh Administrator Pusat.'}
                          </p>
                        )}
                      </div>

                      {user?.scope === 'GLOBAL' && (
                        <div className="flex flex-wrap items-center gap-2">
                          {bap.isConfirmed ? (
                            <button
                              onClick={() => {
                                if (window.confirm('Batalkan konfirmasi terima BAP ini? Akses edit akan dibuka kembali.')) {
                                  unconfirmMutation.mutate(bap.id);
                                }
                              }}
                              disabled={unconfirmMutation.isPending}
                              className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {unconfirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
                              Batalkan Konfirmasi (Buka Akses Edit)
                            </button>
                          ) : (
                            <button
                              onClick={() => confirmMutation.mutate(bap.id)}
                              disabled={confirmMutation.isPending}
                              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                            >
                              {confirmMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              Konfirmasi Terima Laporan BAP
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm('Hapus laporan BAP ini? Cabang dapat membuat ulang laporan setelah dihapus.')) {
                                deleteMutation.mutate(bap.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
                            Hapus Laporan (Izinkan Buat Ulang)
                          </button>
                        </div>
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
