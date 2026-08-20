import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import {
  Calendar, FileText, Download, CheckCircle2, AlertCircle, Info,
  Building, Clock, ChevronDown, ChevronUp, Sparkles, Loader2, Plus,
  Tag, Eye, X, Image as ImageIcon, File, ZoomIn, ZoomOut, RotateCw,
  Search, Filter, RotateCcw, Check, Users, MapPin, ChevronRight
} from 'lucide-react';

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

  // Advanced Filter States
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('ALL');
  const [selectedCabang, setSelectedCabang] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');
  const [selectedDeadline, setSelectedDeadline] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch all BAPs
  const { data: BAPs = [], isLoading, isError } = useQuery<Kegiatan[]>({
    queryKey: ['kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan');
      return res.data;
    }
  });

  // Extract distinct options for dropdowns
  const jenisList = useMemo(() => {
    const set = new Set<string>();
    BAPs.forEach(b => {
      if (b.template?.jenis?.nama) set.add(b.template.jenis.nama);
    });
    return Array.from(set).sort();
  }, [BAPs]);

  const cabangList = useMemo(() => {
    const set = new Set<string>();
    BAPs.forEach(b => {
      if (b.cabang?.name) set.add(b.cabang.name);
    });
    return Array.from(set).sort();
  }, [BAPs]);

  // Filtered BAPs
  const filteredBAPs = useMemo(() => {
    return BAPs.filter(bap => {
      // 1. Keyword search (Judul, Cabang, Asrama, Panitia, Tempat)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const judulMatch = bap.template?.judul?.toLowerCase().includes(q);
        const cabangMatch = bap.cabang?.name?.toLowerCase().includes(q);
        const asramaMatch = bap.asrama?.nama?.toLowerCase().includes(q);
        const tempatMatch = bap.tempatKegiatan?.toLowerCase().includes(q);
        const panitiaMatch = bap.panitia?.some(p => 
          p.staff?.name?.toLowerCase().includes(q) ||
          p.user?.operatorName?.toLowerCase().includes(q) ||
          p.user?.username?.toLowerCase().includes(q)
        );
        if (!judulMatch && !cabangMatch && !asramaMatch && !tempatMatch && !panitiaMatch) {
          return false;
        }
      }

      // 2. Jenis Kegiatan
      if (selectedJenis !== 'ALL' && bap.template?.jenis?.nama !== selectedJenis) {
        return false;
      }

      // 3. Cabang
      if (selectedCabang !== 'ALL' && bap.cabang?.name !== selectedCabang) {
        return false;
      }

      // 4. Status Konfirmasi
      if (selectedStatus === 'CONFIRMED' && !bap.isConfirmed) return false;
      if (selectedStatus === 'PENDING' && bap.isConfirmed) return false;

      // 5. Deadline status
      const isExpired = new Date(bap.template.deadline) < new Date();
      if (selectedDeadline === 'ACTIVE' && isExpired) return false;
      if (selectedDeadline === 'CLOSED' && !isExpired) return false;

      // 6. Date Range (based on tanggalKegiatan or createdAt)
      const bapDateStr = bap.tanggalKegiatan || bap.createdAt;
      if (startDate) {
        const d = new Date(bapDateStr);
        const start = new Date(startDate);
        if (d < start) return false;
      }
      if (endDate) {
        const d = new Date(bapDateStr);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }

      return true;
    });
  }, [BAPs, searchQuery, selectedJenis, selectedCabang, selectedStatus, selectedDeadline, startDate, endDate]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedJenis !== 'ALL') count++;
    if (selectedCabang !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedDeadline !== 'ALL') count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  }, [searchQuery, selectedJenis, selectedCabang, selectedStatus, selectedDeadline, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedJenis('ALL');
    setSelectedCabang('ALL');
    setSelectedStatus('ALL');
    setSelectedDeadline('ALL');
    setStartDate('');
    setEndDate('');
  };

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

  // KPI calculations
  const totalCount = BAPs.length;
  const confirmedCount = BAPs.filter(b => b.isConfirmed).length;
  const pendingCount = totalCount - confirmedCount;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* File Viewer Modal */}
      {viewingDoc && <FileViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-600" />
            Laporan Berita Acara Pelaksanaan (BAP)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {user?.scope === 'GLOBAL' || user?.scope === 'AUDITOR'
              ? 'Seluruh data BAP kegiatan sekolah yang dilaporkan oleh Cabang.'
              : 'Daftar BAP kegiatan sekolah milik cabang Anda yang dilaporkan ke Pusat.'}
          </p>
        </div>
        
        {user?.scope === 'CABANG' && (
          <button
            onClick={() => navigate('/dashboard/kegiatan/buat')}
            className="inline-flex items-center justify-center px-4 py-2.5 shadow-sm text-xs sm:text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Laporan BAP
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total BAP</span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalCount}</span>
        </div>
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Diterima Pusat</span>
          <span className="text-xl font-bold text-emerald-800 mt-0.5 block">{confirmedCount}</span>
        </div>
        <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Menunggu Verifikasi</span>
          <span className="text-xl font-bold text-indigo-900 mt-0.5 block">{pendingCount}</span>
        </div>
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Hasil Filter</span>
          <span className="text-xl font-bold text-slate-800 mt-0.5 block">{filteredBAPs.length}</span>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul kegiatan, cabang, panitia, tempat..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle & Quick Status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isFilterExpanded || activeFiltersCount > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Advanced Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filter Panel */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
            {/* Jenis Kegiatan */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Jenis Kegiatan
              </label>
              <select
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Jenis Kegiatan</option>
                {jenisList.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            {/* Cabang (for Pusat/Wilayah/Auditor) */}
            {user?.scope !== 'CABANG' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cabang Pelapor
                </label>
                <select
                  value={selectedCabang}
                  onChange={(e) => setSelectedCabang(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
                >
                  <option value="ALL">Semua Cabang</option>
                  {cabangList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Konfirmasi */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status Verifikasi
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="CONFIRMED">Diterima Pusat</option>
                <option value="PENDING">Menunggu Verifikasi</option>
              </select>
            </div>

            {/* Status Tenggat */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status Tenggat
              </label>
              <select
                value={selectedDeadline}
                onChange={(e) => setSelectedDeadline(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Tenggat</option>
                <option value="ACTIVE">Masih Berlaku</option>
                <option value="CLOSED">Tenggat Berakhir (Closed)</option>
              </select>
            </div>

            {/* Rentang Tanggal Mulai */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all"
              />
            </div>

            {/* Rentang Tanggal Selesai */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main BAP Content (Compact 1-Line Table View) */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat laporan BAP kegiatan...</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat data BAP kegiatan.
        </div>
      ) : filteredBAPs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Info className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-700 text-sm">
            {BAPs.length === 0 ? 'Belum ada laporan BAP kegiatan yang tercatat.' : 'Tidak ada laporan BAP yang sesuai dengan filter.'}
          </p>
          {activeFiltersCount > 0 ? (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          ) : user?.scope === 'CABANG' ? (
            <button
              onClick={() => navigate('/dashboard/kegiatan/buat')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
            >
              Mulai Buat Laporan Pertama
            </button>
          ) : null}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50/90 text-slate-600">
                <tr>
                  <th scope="col" className="w-10 px-3 py-3 text-center"></th>
                  <th scope="col" className="px-4 py-3 text-left font-bold uppercase tracking-wider">
                    Kegiatan & Judul
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-bold uppercase tracking-wider">
                    Cabang & Lokasi
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-bold uppercase tracking-wider">
                    Waktu / Tanggal
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-bold uppercase tracking-wider">
                    Peserta
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-bold uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBAPs.map((bap, index) => {
                  const isExpired = new Date(bap.template.deadline) < new Date();
                  const isOpen = expandedId === bap.id;
                  const ketuaPanitia = bap.panitia.find(p => p.jabatan === 'KETUA');
                  const sekretarisPanitia = bap.panitia.find(p => p.jabatan === 'SEKRETARIS');
                  const bendaharaPanitia = bap.panitia.find(p => p.jabatan === 'BENDAHARA');

                  const ketuaName = ketuaPanitia?.staff?.name || ketuaPanitia?.user?.operatorName || ketuaPanitia?.user?.username || '-';
                  const sekretarisName = sekretarisPanitia?.staff?.name || sekretarisPanitia?.user?.operatorName || sekretarisPanitia?.user?.username || '-';
                  const bendaharaName = bendaharaPanitia?.staff?.name || bendaharaPanitia?.user?.operatorName || bendaharaPanitia?.user?.username || '-';

                  const docFiles = bap.dokumen.filter(d => d.fileType === 'DOCUMENT' || d.fileType === 'SURAT_PENGANTAR' || (!d.fileType && !/\.(jpe?g|png|gif|webp|bmp)$/i.test(d.fileName)));
                  const photoFiles = bap.dokumen.filter(d => d.fileType === 'PHOTO' || (!d.fileType && /\.(jpe?g|png|gif|webp|bmp)$/i.test(d.fileName)));
                  const totalPeserta = bap.jumlahPeserta ?? ((bap.totalSantri || 0) + (bap.totalGuru || 0));

                  return (
                    <React.Fragment key={bap.id}>
                      {/* Compact Single-Line Row */}
                      <tr
                        onClick={() => toggleExpand(bap.id)}
                        className={`hover:bg-indigo-50/40 transition-colors cursor-pointer group ${
                          isOpen ? 'bg-indigo-50/60' : index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                        }`}
                      >
                        {/* 1. Expand Chevron */}
                        <td className="px-3 py-3 text-center text-slate-400 group-hover:text-indigo-600">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 mx-auto text-indigo-600 transition-transform" />
                          ) : (
                            <ChevronRight className="w-4 h-4 mx-auto transition-transform" />
                          )}
                        </td>

                        {/* 2. Jenis & Judul Kegiatan (Single-Line) */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100/70 text-indigo-700 border border-indigo-200 shrink-0">
                              {bap.template.jenis.nama}
                            </span>
                            <span className="font-bold text-slate-800 truncate max-w-[280px]" title={bap.template.judul}>
                              {bap.template.judul}
                            </span>
                            {isExpired && (
                              <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0">
                                CLOSED
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Cabang & Asrama */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{bap.cabang.name}</span>
                            {bap.asrama && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({bap.asrama.nama})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Waktu / Tanggal Kegiatan */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {bap.tanggalKegiatan
                                ? new Date(bap.tanggalKegiatan).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                : new Date(bap.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                            </span>
                          </div>
                        </td>

                        {/* 5. Peserta */}
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700" title={`Santri: ${bap.totalSantri || 0}, Guru: ${bap.totalGuru || 0}`}>
                            <Users className="w-3 h-3 text-slate-500" />
                            {totalPeserta}
                          </span>
                        </td>

                        {/* 6. Status Badge */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {bap.isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Diterima
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              Verifikasi
                            </span>
                          )}
                        </td>

                        {/* 7. Action Button */}
                        <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(bap.id)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                            >
                              {isOpen ? 'Tutup' : 'Detail'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-slate-50/60 border-y border-slate-200/80">
                            <div className="p-5 sm:p-6 space-y-5 animate-in slide-in-from-top-1 duration-200">
                              {/* Juknis Petunjuk Pusat */}
                              {bap.template.deskripsi && (
                                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 text-xs">
                                  <span className="font-bold text-indigo-700 block mb-1">
                                    Petunjuk / Juknis Pusat:
                                  </span>
                                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {bap.template.deskripsi}
                                  </p>
                                </div>
                              )}

                              {/* Grid Detail Pelaksanaan & Panitia */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Pelaksanaan */}
                                <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2">
                                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-indigo-600" /> Pelaksanaan Kegiatan
                                  </h4>
                                  <div className="space-y-1 text-slate-600">
                                    <div><span className="text-slate-400">Tempat:</span> <strong className="text-slate-800">{bap.tempatKegiatan || bap.cabang?.name}</strong></div>
                                    <div><span className="text-slate-400">Tanggal:</span> <strong className="text-slate-800">{bap.tanggalKegiatan ? new Date(bap.tanggalKegiatan).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '-'}</strong></div>
                                    <div><span className="text-slate-400">Waktu:</span> <strong className="text-slate-800">{bap.waktuKegiatan || '-'}</strong></div>
                                    <div><span className="text-slate-400">Santri:</span> <strong className="text-slate-800">{bap.totalSantri ?? 0} orang</strong> | <span className="text-slate-400">Guru:</span> <strong className="text-slate-800">{bap.totalGuru ?? 0} orang</strong></div>
                                  </div>
                                </div>

                                {/* Panitia */}
                                <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2">
                                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-indigo-600" /> Panitia Pelaksana
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-slate-50 p-2 rounded-lg">
                                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Ketua</span>
                                      <span className="font-bold text-slate-800 truncate block">{ketuaName}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg">
                                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Sekretaris</span>
                                      <span className="font-semibold text-slate-800 truncate block">{sekretarisName}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg">
                                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Bendahara</span>
                                      <span className="font-semibold text-slate-800 truncate block">{bendaharaName}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Bentuk & Rangkaian Kegiatan */}
                              {(bap.bentukKegiatan || bap.rangkaianKegiatan || bap.hasilPelaksanaan) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  {bap.bentukKegiatan && (
                                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1">
                                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">Bentuk Kegiatan:</span>
                                      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{bap.bentukKegiatan}</p>
                                    </div>
                                  )}
                                  {bap.rangkaianKegiatan && (
                                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1">
                                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">Rangkaian Kegiatan:</span>
                                      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{bap.rangkaianKegiatan}</p>
                                    </div>
                                  )}
                                  {bap.hasilPelaksanaan && (
                                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-1 md:col-span-2">
                                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">Hasil Pelaksanaan:</span>
                                      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{bap.hasilPelaksanaan}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Evaluasi */}
                              {(bap.evaluasiBaik || bap.evaluasiPerbaikan) && (
                                <div className="bg-amber-50/30 border border-amber-200/60 rounded-xl p-4 space-y-2 text-xs">
                                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block">Evaluasi Kegiatan</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {bap.evaluasiBaik && (
                                      <div className="bg-white border border-amber-100 rounded-lg p-3">
                                        <strong className="text-emerald-700 block mb-1">Hal Yang Sudah Baik:</strong>
                                        <p className="text-slate-600 whitespace-pre-wrap">{bap.evaluasiBaik}</p>
                                      </div>
                                    )}
                                    {bap.evaluasiPerbaikan && (
                                      <div className="bg-white border border-amber-100 rounded-lg p-3">
                                        <strong className="text-amber-800 block mb-1">Hal Yang Perlu Ditingkatkan:</strong>
                                        <p className="text-slate-600 whitespace-pre-wrap">{bap.evaluasiPerbaikan}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Lampiran Dokumen & Foto */}
                              {(docFiles.length > 0 || photoFiles.length > 0) && (
                                <div className="space-y-3">
                                  {docFiles.length > 0 && (
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                        Dokumen Lampiran ({docFiles.length}):
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {docFiles.map(doc => (
                                          <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                              <span className="truncate font-medium text-slate-800">{doc.fileName}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                              <button
                                                type="button"
                                                onClick={() => setViewingDoc(doc)}
                                                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                                                title="Lihat"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDownload(doc.filePath, doc.fileName)}
                                                className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                                                title="Unduh"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {photoFiles.length > 0 && (
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                        Foto Kegiatan ({photoFiles.length}):
                                      </span>
                                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {photoFiles.map(doc => {
                                          const photoUrl = `${apiClient.defaults.baseURL || ''}${doc.filePath}`;
                                          return (
                                            <div
                                              key={doc.id}
                                              onClick={() => setViewingDoc(doc)}
                                              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer"
                                            >
                                              <img src={photoUrl} alt={doc.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                                <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Footer Actions (Konfirmasi Terima BAP Pusat) */}
                              <div className="border-t border-slate-200 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                  {bap.isConfirmed ? (
                                    <p className="text-slate-500">
                                      Diterima oleh Pusat (<strong className="text-slate-800">{bap.confirmedByUser?.operatorName || bap.confirmedByUser?.username}</strong>) pada{' '}
                                      <strong>{new Date(bap.confirmedAt!).toLocaleString('id-ID')}</strong>
                                    </p>
                                  ) : (
                                    <p className="text-slate-500 flex items-center gap-1.5">
                                      <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                                      {user?.scope === 'GLOBAL'
                                        ? 'Periksa kelengkapan laporan sebelum menandai konfirmasi penerimaan BAP.'
                                        : 'Laporan BAP sedang menunggu verifikasi dan tanda terima dari Pusat.'}
                                    </p>
                                  )}
                                </div>

                                {user?.scope === 'GLOBAL' && (
                                  <div className="flex items-center gap-2 shrink-0">
                                    {bap.isConfirmed ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm('Batalkan konfirmasi terima BAP ini? Akses edit akan dibuka kembali.')) {
                                            unconfirmMutation.mutate(bap.id);
                                          }
                                        }}
                                        disabled={unconfirmMutation.isPending}
                                        className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-xl hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50"
                                      >
                                        {unconfirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
                                        Batalkan Konfirmasi
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => confirmMutation.mutate(bap.id)}
                                        disabled={confirmMutation.isPending}
                                        className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                                      >
                                        {confirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        Konfirmasi Terima BAP
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm('Hapus laporan BAP ini? Cabang dapat membuat ulang laporan setelah dihapus.')) {
                                          deleteMutation.mutate(bap.id);
                                        }
                                      }}
                                      disabled={deleteMutation.isPending}
                                      className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
                                      Hapus
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
