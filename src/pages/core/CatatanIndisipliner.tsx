import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  FileWarning,
  LogOut,
  Eye,
  Trash2,
  Download,
  Calendar,
  ShieldAlert,
  FileText,
  Filter,
  CheckCircle2,
  X,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  PelanggaranRecord,
  SuratPeringatanRecord,
  PengeluaranSiswaRecord,
  IndisiplinerTab
} from '../../features/indisipliner/types';
import {
  useGetIndisiplinerStats,
  useGetPelanggaran,
  useCreatePelanggaran,
  useDeletePelanggaran,
  useGetSp,
  useCreateSp,
  useDeleteSp,
  useGetPengeluaran,
  useCreatePengeluaran,
  useDeletePengeluaran,
} from '../../features/indisipliner/useIndisipliner';
import TambahDataModal from '../../features/indisipliner/TambahDataModal';
import DetailIndisiplinerModal from '../../features/indisipliner/DetailIndisiplinerModal';
import { useGetStudents } from '../../features/core_data/hooks/useGetStudents';

export default function CatatanIndisipliner() {
  // State Tab Management (Active Default: 'pelanggaran')
  const [activeTab, setActiveTab] = useState<IndisiplinerTab>('pelanggaran');

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');

  // Category Filter State (opsional untuk menyaring lebih spesifik)
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');

  // Data States - Murni hanya santri yang memiliki catatan indisipliner / bermasalah (Default kosong)
  const [pelanggaranList, setPelanggaranList] = useState<PelanggaranRecord[]>([]);
  const [spList, setSpList] = useState<SuratPeringatanRecord[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranSiswaRecord[]>([]);

  // API Queries (Real Database)
  const { data: allStudents = [] } = useGetStudents();
  const { data: apiStats } = useGetIndisiplinerStats();
  const { data: apiPelanggaran, isLoading: isPelLoading } = useGetPelanggaran();
  const { data: apiSp, isLoading: isSpLoading } = useGetSp();
  const { data: apiPengeluaran, isLoading: isPengLoading } = useGetPengeluaran();

  // API Mutations
  const createPelanggaranMutation = useCreatePelanggaran();
  const deletePelanggaranMutation = useDeletePelanggaran();
  const createSpMutation = useCreateSp();
  const deleteSpMutation = useDeleteSp();
  const createPengeluaranMutation = useCreatePengeluaran();
  const deletePengeluaranMutation = useDeletePengeluaran();

  // Sinkronisasi data real API ke local state
  React.useEffect(() => {
    if (apiPelanggaran) {
      setPelanggaranList(apiPelanggaran);
    }
  }, [apiPelanggaran]);

  React.useEffect(() => {
    if (apiSp) {
      setSpList(apiSp);
    }
  }, [apiSp]);

  React.useEffect(() => {
    if (apiPengeluaran) {
      setPengeluaranList(apiPengeluaran);
    }
  }, [apiPengeluaran]);

  // Modal States
  const [isTambahModalOpen, setIsTambahModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState<
    | { type: 'pelanggaran'; data: PelanggaranRecord }
    | { type: 'sp'; data: SuratPeringatanRecord }
    | { type: 'pengeluaran'; data: PengeluaranSiswaRecord }
    | null
  >(null);

  // Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Format Date Helper
  const formatDate = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      return isNaN(dt.getTime()) ? dateStr : dt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Handlers Tambah Data (Optimistic UI + API async sync)
  const handleAddPelanggaran = async (newData: PelanggaranRecord) => {
    setPelanggaranList(prev => [newData, ...prev]);
    showNotification(`Catatan pelanggaran santri "${newData.namaSiswa}" berhasil ditambahkan.`);
    try {
      await createPelanggaranMutation.mutateAsync(newData);
    } catch (e) {
      console.warn('API sync: Catatan pelanggaran tersimpan di state lokal.', e);
    }
  };

  const handleAddSp = async (newData: SuratPeringatanRecord) => {
    setSpList(prev => [newData, ...prev]);
    showNotification(`Surat Peringatan ${newData.tingkatSp} untuk "${newData.namaSiswa}" berhasil diterbitkan.`);
    try {
      await createSpMutation.mutateAsync(newData);
    } catch (e) {
      console.warn('API sync: SP tersimpan di state lokal.', e);
    }
  };

  const handleAddPengeluaran = async (newData: PengeluaranSiswaRecord) => {
    setPengeluaranList(prev => [newData, ...prev]);
    showNotification(`Catatan pengeluaran santri "${newData.namaSiswa}" berhasil diregistrasi.`);
    try {
      await createPengeluaranMutation.mutateAsync(newData);
    } catch (e) {
      console.warn('API sync: Pengeluaran tersimpan di state lokal.', e);
    }
  };

  // Handlers Hapus Data
  const handleDeletePelanggaran = async (id: string, nama: string) => {
    if (window.confirm(`Hapus catatan pelanggaran untuk "${nama}"?`)) {
      setPelanggaranList(prev => prev.filter(item => item.id !== id));
      showNotification(`Catatan pelanggaran "${nama}" telah dihapus.`);
      try {
        await deletePelanggaranMutation.mutateAsync(id);
      } catch (e) {
        console.warn('API delete warning:', e);
      }
    }
  };

  const handleDeleteSp = async (id: string, nomor: string) => {
    if (window.confirm(`Batalkan / hapus surat peringatan nomor "${nomor}"?`)) {
      setSpList(prev => prev.filter(item => item.id !== id));
      showNotification(`Surat peringatan "${nomor}" telah dihapus.`);
      try {
        await deleteSpMutation.mutateAsync(id);
      } catch (e) {
        console.warn('API delete warning:', e);
      }
    }
  };

  const handleDeletePengeluaran = async (id: string, nama: string) => {
    if (window.confirm(`Hapus arsip pengeluaran santri "${nama}"?`)) {
      setPengeluaranList(prev => prev.filter(item => item.id !== id));
      showNotification(`Arsip pengeluaran santri "${nama}" telah dihapus.`);
      try {
        await deletePengeluaranMutation.mutateAsync(id);
      } catch (e) {
        console.warn('API delete warning:', e);
      }
    }
  };

  // Filter Data berdasarkan Search Query & Tab
  const filteredPelanggaran = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return pelanggaranList.filter(item => {
      const matchSearch =
        !q ||
        item.namaSiswa.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q) ||
        item.jenisPelanggaran.toLowerCase().includes(q) ||
        item.nisLokal.includes(q);
      const matchKategori = selectedKategori === 'ALL' || item.kategori === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [pelanggaranList, searchQuery, selectedKategori]);

  const filteredSp = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return spList.filter(item => {
      const matchSearch =
        !q ||
        item.namaSiswa.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q) ||
        item.nomorSp.toLowerCase().includes(q) ||
        item.tingkatSp.toLowerCase().includes(q);
      const matchKategori = selectedKategori === 'ALL' || item.tingkatSp === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [spList, searchQuery, selectedKategori]);

  const filteredPengeluaran = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return pengeluaranList.filter(item => {
      return (
        !q ||
        item.namaSiswa.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q) ||
        item.alasanPemberhentian.toLowerCase().includes(q) ||
        item.nomorSk.toLowerCase().includes(q)
      );
    });
  }, [pengeluaranList, searchQuery]);

  // Statistik Ringkas (KPI) - Berasal dari data aktual
  const totalPelanggaran = apiStats?.totalPelanggaran ?? pelanggaranList.length;
  const totalSpAktif = apiStats?.spAktif ?? spList.filter(s => s.status === 'Aktif' || s.status === 'Masa Pembinaan').length;
  const totalDikeluarkan = apiStats?.totalPengeluaran ?? pengeluaranList.length;
  const totalPoinSemua = apiStats?.totalPoin ?? pelanggaranList.reduce((acc, curr) => acc + curr.poin, 0);

  // Menghitung santri bermasalah riil (yang ada di daftar indisipliner) vs total santri keseluruhan
  const uniqueTroubledCount = useMemo(() => {
    const ids = new Set<string>();
    pelanggaranList.forEach(p => p.siswaId && ids.add(p.siswaId));
    spList.forEach(s => s.siswaId && ids.add(s.siswaId));
    pengeluaranList.forEach(d => d.siswaId && ids.add(d.siswaId));
    return ids.size;
  }, [pelanggaranList, spList, pengeluaranList]);

  const totalSantriLembaga = allStudents.length;
  const tingkatKedisiplinan = totalSantriLembaga > 0
    ? Math.max(0, Math.min(100, Math.round(((totalSantriLembaga - uniqueTroubledCount) / totalSantriLembaga) * 1000) / 10))
    : 100;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs font-medium animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── HEADER HALAMAN: TITLE, SEARCH BAR & TOMBOL TAMBAH DATA SEJAJAR ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Catatan Indisipliner
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Kedisiplinan Santri
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan pelanggaran tata tertib, penerbitan surat peringatan (SP), dan pengeluaran santri
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar & Tombol + Tambah Data Sejajar */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'pelanggaran'
                  ? 'Cari nama siswa, kelas, pelanggaran...'
                  : activeTab === 'sp'
                  ? 'Cari siswa, no. SP, tingkat...'
                  : 'Cari siswa, alasan, no. SK...'
              }
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tombol + Tambah Data */}
          <button
            onClick={() => setIsTambahModalOpen(true)}
            className="shrink-0 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Catatan Pelanggaran</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalPelanggaran}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Akumulasi {totalPoinSemua} Poin</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Surat Peringatan (SP)</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{spList.length}</span>
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">{totalSpAktif} SP Masa Aktif</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <FileWarning className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Santri Dikeluarkan (DO)</span>
            <span className="text-2xl font-black text-red-700 mt-1 block">{totalDikeluarkan}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Arsip SK Resmi</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
            <LogOut className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tingkat Kedisiplinan</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {tingkatKedisiplinan}%
            </span>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
              {uniqueTroubledCount === 0
                ? 'Seluruh Santri Tertib (0 Bermasalah)'
                : `${uniqueTroubledCount} dari ${totalSantriLembaga} Santri Bermasalah`}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── TAB MENU HORIZONTAL (STATE MANAGEMENT) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 pt-3 gap-2 bg-slate-50/50">
          {/* Tabs Button List */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tab 1: Data Pelanggaran (Active Default) */}
            <button
              onClick={() => {
                setActiveTab('pelanggaran');
                setSelectedKategori('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'pelanggaran'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-xl'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Data Pelanggaran</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pelanggaran' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {pelanggaranList.length}
              </span>
            </button>

            {/* Tab 2: Surat Peringatan (SP) */}
            <button
              onClick={() => {
                setActiveTab('sp');
                setSelectedKategori('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'sp'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-xl'
              }`}
            >
              <FileWarning className="w-4 h-4 text-amber-500" />
              <span>Surat Peringatan (SP)</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'sp' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {spList.length}
              </span>
            </button>

            {/* Tab 3: Pengeluaran Siswa */}
            <button
              onClick={() => {
                setActiveTab('pengeluaran');
                setSelectedKategori('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'pengeluaran'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-xl'
              }`}
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Pengeluaran Siswa</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pengeluaran' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {pengeluaranList.length}
              </span>
            </button>
          </div>

          {/* Quick Filter Pill Tag */}
          {activeTab === 'pelanggaran' && (
            <div className="flex items-center gap-1.5 pb-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Kategori:</span>
              {['ALL', 'Ringan', 'Sedang', 'Berat'].map(kat => (
                <button
                  key={kat}
                  onClick={() => setSelectedKategori(kat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedKategori === kat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {kat === 'ALL' ? 'Semua' : kat}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'sp' && (
            <div className="flex items-center gap-1.5 pb-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Tingkat:</span>
              {['ALL', 'SP 1', 'SP 2', 'SP 3'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedKategori(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedKategori === lvl
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lvl === 'ALL' ? 'Semua Tingkat' : lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="p-0">
          {/* =========================================================================
              TAB 1: DATA PELANGGARAN (Active Default)
              Kolom: Tanggal, Nama Siswa, Kelas, Jenis Pelanggaran, Poin, Aksi
              UI Rules: Conditional color badge untuk Poin (merah = tinggi, kuning = sedang, hijau/biru = rendah)
          ========================================================================= */}
          {activeTab === 'pelanggaran' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-32">Tanggal</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 w-28">Kelas</th>
                    <th className="py-3 px-4">Jenis Pelanggaran</th>
                    <th className="py-3 px-4 w-24 text-center">Poin</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPelanggaran.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-xs">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">
                          {searchQuery ? 'Tidak ada catatan pelanggaran yang cocok dengan pencarian' : 'Tidak Ada Catatan Pelanggaran Santri'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                          {searchQuery
                            ? `Tidak ditemukan hasil pencarian untuk kata kunci "${searchQuery}".`
                            : 'Alhamdulillah, seluruh santri tertib dan mematuhi peraturan. Hanya santri yang melakukan pelanggaran yang akan dicatat pada daftar ini.'}
                        </p>
                        {!searchQuery && (
                          <button
                            onClick={() => setIsTambahModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> + Catat Pelanggaran Baru
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredPelanggaran.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDate(item.tanggal)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.namaSiswa}</div>
                          <div className="text-[10.5px] text-slate-400 font-mono">NIS: {item.nisLokal}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                            {item.kelas}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{item.jenisPelanggaran}</div>
                          {item.keterangan && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.keterangan}</div>
                          )}
                        </td>
                        {/* Conditional color badge untuk Poin: Merah (tinggi), Kuning (sedang), Biru (rendah) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black border ${
                              item.poin >= 25
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.poin >= 10
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            +{item.poin} Poin
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailModalData({ type: 'pelanggaran', data: item })}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                              title="Lihat Rincian"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePelanggaran(item.id, item.namaSiswa)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =========================================================================
              TAB 2: SURAT PERINGATAN (SP)
              Kolom: Tanggal Terbit, Nama Siswa, Kelas, Tingkat SP, Status, Aksi
              UI Rules: Render 'Tingkat SP' dengan warna badge yang berbeda (SP 1, SP 2, SP 3)
          ========================================================================= */}
          {activeTab === 'sp' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-32">Tanggal Terbit</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 w-28">Kelas</th>
                    <th className="py-3 px-4 w-28 text-center">Tingkat SP</th>
                    <th className="py-3 px-4 w-36">Status</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSp.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-xs">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">
                          {searchQuery ? 'Tidak ada Surat Peringatan yang cocok dengan pencarian' : 'Tidak Ada Surat Peringatan (SP) Diterbitkan'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                          {searchQuery
                            ? `Tidak ditemukan SP untuk kata kunci "${searchQuery}".`
                            : 'Belum ada santri yang melampaui batas akumulasi poin untuk penerbitan SP 1, SP 2, maupun SP 3.'}
                        </p>
                        {!searchQuery && (
                          <button
                            onClick={() => setIsTambahModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> + Terbitkan SP Baru
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredSp.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDate(item.tanggalTerbit)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.nomorSp}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.namaSiswa}</div>
                          <div className="text-[10.5px] text-slate-400 font-mono">NIS: {item.nisLokal}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                            {item.kelas}
                          </span>
                        </td>
                        {/* Render 'Tingkat SP' dengan warna badge berbeda: SP 1 (kuning), SP 2 (oranye), SP 3 (merah) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black border tracking-wide ${
                              item.tingkatSp === 'SP 3'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : item.tingkatSp === 'SP 2'
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {item.tingkatSp}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.status === 'Aktif'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : item.status === 'Masa Pembinaan'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : item.status === 'Sidang Disiplin'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailModalData({ type: 'sp', data: item })}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                              title="Lihat Surat Peringatan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSp(item.id, item.nomorSp)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              title="Hapus SP"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =========================================================================
              TAB 3: PENGELUARAN SISWA
              Kolom: Tanggal Keluar, Nama Siswa, Kelas, Alasan Pemberhentian, Dokumen SK, Aksi
          ========================================================================= */}
          {activeTab === 'pengeluaran' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-32">Tanggal Keluar</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 w-28">Kelas</th>
                    <th className="py-3 px-4">Alasan Pemberhentian</th>
                    <th className="py-3 px-4 w-44">Dokumen SK</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPengeluaran.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-xs">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">
                          {searchQuery ? 'Tidak ada data pengeluaran yang cocok dengan pencarian' : 'Tidak Ada Santri yang Dikeluarkan'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                          {searchQuery
                            ? `Tidak ditemukan arsip pengeluaran untuk kata kunci "${searchQuery}".`
                            : 'Seluruh santri masih aktif belajar dan tidak ada catatan pemberhentian resmi / Drop Out (DO) pada lembaga ini.'}
                        </p>
                        {!searchQuery && (
                          <button
                            onClick={() => setIsTambahModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> + Catat Pengeluaran Santri
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredPengeluaran.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDate(item.tanggalKeluar)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.namaSiswa}</div>
                          <div className="text-[10.5px] text-slate-400 font-mono">NIS: {item.nisLokal}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                            {item.kelas}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-rose-900 leading-snug">{item.alasanPemberhentian}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {item.kategoriAlasan}
                          </span>
                        </td>
                        {/* Dokumen SK */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => setDetailModalData({ type: 'pengeluaran', data: item })}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-50/60 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-mono text-[11px] font-bold transition-colors cursor-pointer group"
                            title="Klik untuk melihat berkas SK"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-700" />
                            <span className="truncate max-w-[130px]">{item.nomorSk}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailModalData({ type: 'pengeluaran', data: item })}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                              title="Lihat Berita Acara & SK"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePengeluaran(item.id, item.namaSiswa)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info counts */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Menampilkan{' '}
            <strong className="text-slate-800">
              {activeTab === 'pelanggaran'
                ? filteredPelanggaran.length
                : activeTab === 'sp'
                ? filteredSp.length
                : filteredPengeluaran.length}
            </strong>{' '}
            data dari{' '}
            <strong className="text-slate-800">
              {activeTab === 'pelanggaran'
                ? pelanggaranList.length
                : activeTab === 'sp'
                ? spList.length
                : pengeluaranList.length}
            </strong>{' '}
            total catatan
          </div>
          <div className="text-[11px] text-slate-400">
            Sistem Informasi Manajemen Pesantren (SIMP) • Kedisiplinan
          </div>
        </div>
      </div>

      {/* Modal Tambah Data */}
      <TambahDataModal
        isOpen={isTambahModalOpen}
        onClose={() => setIsTambahModalOpen(false)}
        defaultTab={activeTab}
        onAddPelanggaran={handleAddPelanggaran}
        onAddSp={handleAddSp}
        onAddPengeluaran={handleAddPengeluaran}
      />

      {/* Modal Detail */}
      <DetailIndisiplinerModal
        detail={detailModalData}
        onClose={() => setDetailModalData(null)}
      />
    </div>
  );
}
