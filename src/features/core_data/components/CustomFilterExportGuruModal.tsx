import React, { useState, useMemo } from 'react';
import { X, FileSpreadsheet, CheckSquare, Filter, Search, RotateCcw, Check, Trash2, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Guru } from '../hooks/usePoolGuru';
import { useGetCabang, useGetWilayah } from '../hooks/useMasterData';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

interface CustomFilterExportGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  guruList: any[];
}

export interface GuruColumnOption {
  key: string;
  label: string;
  category: 'IDENTITAS' | 'PENDIDIKAN' | 'PENUGASAN' | 'AKUN';
  defaultSelected: boolean;
  getValue: (g: any) => string;
}

const AVAILABLE_COLUMNS_GURU: GuruColumnOption[] = [
  // 1. Identitas Guru
  { key: 'name', label: 'Nama Lengkap Guru', category: 'IDENTITAS', defaultSelected: true, getValue: (g) => g.name || '-' },
  { key: 'nik', label: 'NIK (KTP)', category: 'IDENTITAS', defaultSelected: true, getValue: (g) => g.nik || '-' },
  { key: 'jenisKelamin', label: 'Jenis Kelamin', category: 'IDENTITAS', defaultSelected: true, getValue: (g) => g.jenisKelamin === 'L' ? 'Laki-Laki' : g.jenisKelamin === 'P' ? 'Perempuan' : g.jenisKelamin || '-' },
  { key: 'position', label: 'Jabatan / Posisi', category: 'IDENTITAS', defaultSelected: true, getValue: (g) => g.position || 'Guru' },
  { key: 'phone', label: 'No. Handphone / WhatsApp', category: 'IDENTITAS', defaultSelected: true, getValue: (g) => g.phone || '-' },
  { key: 'tempatLahir', label: 'Tempat Lahir', category: 'IDENTITAS', defaultSelected: false, getValue: (g) => g.tempatLahir || '-' },
  { key: 'tanggalLahir', label: 'Tanggal Lahir', category: 'IDENTITAS', defaultSelected: false, getValue: (g) => g.tanggalLahir ? new Date(g.tanggalLahir).toLocaleDateString('id-ID') : '-' },
  { key: 'statusPool', label: 'Status Penugasan', category: 'IDENTITAS', defaultSelected: false, getValue: (g) => g.statusPool === 'AKTIF_CABANG' ? 'Aktif Cabang' : g.statusPool || '-' },

  // 2. Pendidikan
  { key: 'pendidikanTerakhir', label: 'Pendidikan Terakhir', category: 'PENDIDIKAN', defaultSelected: true, getValue: (g) => g.pendidikanTerakhir || '-' },
  { key: 'perguruanTinggi', label: 'Perguruan Tinggi / Kampus', category: 'PENDIDIKAN', defaultSelected: true, getValue: (g) => g.perguruanTinggi || '-' },
  { key: 'programStudi', label: 'Program Studi / Jurusan', category: 'PENDIDIKAN', defaultSelected: false, getValue: (g) => g.programStudi || '-' },
  { key: 'tahunLulus', label: 'Tahun Kelulusan', category: 'PENDIDIKAN', defaultSelected: false, getValue: (g) => g.tahunLulus ? String(g.tahunLulus) : '-' },

  // 3. Penugasan & Akademik
  { key: 'wilayah', label: 'Wilayah', category: 'PENUGASAN', defaultSelected: true, getValue: (g) => g.wilayah?.name || '-' },
  { key: 'cabang', label: 'Cabang Penempatan', category: 'PENUGASAN', defaultSelected: true, getValue: (g) => g.cabang?.name || '-' },
  {
    key: 'isWaliKelas',
    label: 'Status Wali Kelas',
    category: 'PENUGASAN',
    defaultSelected: true,
    getValue: (g) => (g.waliKelas === 'true' || g.waliKelas === 'YA' || (g.kelasWali && g.kelasWali.length > 0)) ? 'Ya' : 'Bukan'
  },
  {
    key: 'kelasWali',
    label: 'Kelas Asuhan (Wali)',
    category: 'PENUGASAN',
    defaultSelected: false,
    getValue: (g) => g.kelasWali?.map((k: any) => k.name).join(', ') || '-'
  },
  {
    key: 'mapelDiajar',
    label: 'Mata Pelajaran yang Diampu',
    category: 'PENUGASAN',
    defaultSelected: true,
    getValue: (g: any) => {
      const formal = g.guruMapelKelas?.map((m: any) => m.mataPelajaran?.name).filter(Boolean) || [];
      const umum = Array.isArray(g.mapelUmum) ? g.mapelUmum : [];
      const combined = Array.from(new Set([...formal, ...umum]));
      return combined.join(', ') || '-';
    }
  },
  {
    key: 'kelasDiajar',
    label: 'Kelas yang Diajar',
    category: 'PENUGASAN',
    defaultSelected: false,
    getValue: (g: any) => {
      const names = Array.from(new Set(g.guruMapelKelas?.map((m: any) => m.kelas?.name).filter(Boolean) || []));
      return (names as string[]).join(', ') || '-';
    }
  },
  {
    key: 'grupDaimi',
    label: 'Halaqah Daimi',
    category: 'PENUGASAN',
    defaultSelected: false,
    getValue: (g: any) => g.grupDaimi?.name || '-'
  },

  // 4. Akun Login Sistem
  { key: 'username', label: 'Username Login', category: 'AKUN', defaultSelected: false, getValue: (g) => g.user?.username || '-' },
  { key: 'userScope', label: 'Role Akses Sistem', category: 'AKUN', defaultSelected: false, getValue: (g) => g.user?.scope || '-' },
  { key: 'accountStatus', label: 'Status Akun', category: 'AKUN', defaultSelected: false, getValue: (g) => g.user?.status || (g.user ? 'Aktif' : 'Belum Ada Akun') },
  { key: 'isApproved', label: 'Status Persetujuan Akun', category: 'AKUN', defaultSelected: false, getValue: (g) => g.user?.isApproved ? 'Disetujui' : (g.user ? 'Pending' : '-') },
];

export default function CustomFilterExportGuruModal({ isOpen, onClose, guruList }: CustomFilterExportGuruModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS_GURU.filter(c => c.defaultSelected).map(c => c.key)
  );

  // Category tab filter inside column selection
  const [activeColCategory, setActiveColCategory] = useState<'ALL' | 'IDENTITAS' | 'PENDIDIKAN' | 'PENUGASAN' | 'AKUN'>('ALL');
  const [colSearchQuery, setColSearchQuery] = useState('');

  // Region & Filter State
  const [filterMode, setFilterMode] = useState<'SEMUA' | 'WILAYAH' | 'CABANG'>('SEMUA');
  const [selectedWilayahId, setSelectedWilayahId] = useState('');
  const [selectedCabangId, setSelectedCabangId] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Master Data
  const { data: wilayahs = [] } = useGetWilayah();
  const { data: cabangs = [] } = useGetCabang();

  const { data: kelass = [] } = useQuery({
    queryKey: ['kelas-custom-export-guru'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      return res.data.filter((k: any) => k.isActive);
    },
    enabled: isOpen
  });

  // Filter Cabangs based on Wilayah
  const filteredCabangs = useMemo(() => {
    if (selectedWilayahId) {
      return cabangs.filter((c: any) => c.wilayahId === selectedWilayahId);
    }
    return cabangs;
  }, [cabangs, selectedWilayahId]);

  // Apply filters to guru list
  const filteredGuru = useMemo(() => {
    const raw = Array.isArray(guruList) ? guruList : [];

    return raw.filter((g: any) => {
      if (selectedWilayahId && g.wilayahId !== selectedWilayahId) return false;
      if (selectedCabangId && g.cabangId !== selectedCabangId) return false;

      if (selectedKelasId) {
        const teachesClass = g.guruMapelKelas?.some((asg: any) => asg.kelasId === selectedKelasId);
        const isWali = g.kelasWali?.some((kw: any) => kw.id === selectedKelasId);
        if (!teachesClass && !isWali) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = g.name?.toLowerCase().includes(q);
        const nikMatch = g.nik?.includes(q);
        const posMatch = g.position?.toLowerCase().includes(q);
        const cabMatch = g.cabang?.name?.toLowerCase().includes(q);
        const wilMatch = g.wilayah?.name?.toLowerCase().includes(q);
        const mapelMatch = g.guruMapelKelas?.some((asg: any) =>
          asg.mataPelajaran?.name?.toLowerCase().includes(q)
        );
        const mapelUmumMatch = Array.isArray(g.mapelUmum) && g.mapelUmum.some((m: string) => m.toLowerCase().includes(q));

        if (!nameMatch && !nikMatch && !posMatch && !cabMatch && !wilMatch && !mapelMatch && !mapelUmumMatch) {
          return false;
        }
      }

      return true;
    });
  }, [guruList, selectedWilayahId, selectedCabangId, selectedKelasId, searchQuery]);

  // Filter column options by category & search
  const visibleColumnOptions = useMemo(() => {
    return AVAILABLE_COLUMNS_GURU.filter(col => {
      if (activeColCategory !== 'ALL' && col.category !== activeColCategory) return false;
      if (colSearchQuery.trim()) {
        return col.label.toLowerCase().includes(colSearchQuery.toLowerCase());
      }
      return true;
    });
  }, [activeColCategory, colSearchQuery]);

  // Toggle Column Selection
  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(AVAILABLE_COLUMNS_GURU.map(c => c.key));
  };

  const resetColumns = () => {
    setSelectedColumns(AVAILABLE_COLUMNS_GURU.filter(c => c.defaultSelected).map(c => c.key));
  };

  const clearAllColumns = () => {
    setSelectedColumns([]);
  };

  // Export to Excel XLSX
  const handleExportXLSX = () => {
    if (filteredGuru.length === 0) {
      alert('Tidak ada data guru yang dapat diekspor berdasarkan filter saat ini.');
      return;
    }

    if (selectedColumns.length === 0) {
      alert('Silakan pilih minimal 1 kolom untuk diekspor.');
      return;
    }

    const activeCols = AVAILABLE_COLUMNS_GURU.filter(c => selectedColumns.includes(c.key));

    const exportData = filteredGuru.map((g, idx) => {
      const row: Record<string, any> = { 'No': idx + 1 };
      activeCols.forEach(col => {
        row[col.label] = col.getValue(g);
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-size column width
    const colWidths = [{ wch: 6 }, ...activeCols.map(col => ({ wch: Math.max(col.label.length + 4, 16) }))];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_Guru_Lengkap_${dateStr}.xlsx`);
  };

  if (!isOpen) return null;

  const activeCols = AVAILABLE_COLUMNS_GURU.filter(c => selectedColumns.includes(c.key));

  const getCategoryBadge = (cat: GuruColumnOption['category']) => {
    switch (cat) {
      case 'IDENTITAS': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Identitas</span>;
      case 'PENDIDIKAN': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pendidikan</span>;
      case 'PENUGASAN': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Penugasan</span>;
      case 'AKUN': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Akun Login</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl my-4 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/30 border border-emerald-400/30 text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Filter Custom &amp; Export Data Guru (Lengkap)</h3>
              <p className="text-xs text-slate-300">Pilih filter wilayah/cabang/kelas, tentukan kolom yang ingin ditampilkan, dan unduh format XLSX.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Section 1: Filter Lokasi & Penugasan */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>1. Filter Lokasi &amp; Penugasan Guru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Wilayah</label>
                <select
                  value={selectedWilayahId}
                  onChange={(e) => {
                    setSelectedWilayahId(e.target.value);
                    setSelectedCabangId('');
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Semua Wilayah --</option>
                  {wilayahs.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cabang Penempatan</label>
                <select
                  value={selectedCabangId}
                  onChange={(e) => setSelectedCabangId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Semua Cabang --</option>
                  {filteredCabangs.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kelas Formal (Ajar/Wali)</label>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Semua Kelas --</option>
                  {kelass.map((k: any) => (
                    <option key={k.id} value={k.id}>{k.name} (Tingkat {k.tingkat || '-'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pencarian Cepat</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nama, NIK, Mapel..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pemilihan Kolom Custom (Dual Panel) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  2. Tentukan Kolom Tampilan &amp; Ekspor ({AVAILABLE_COLUMNS_GURU.length} Kolom Tersedia)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Centang kolom dari panel kiri. Kolom aktif yang akan diekspor tampil di sebelah kanan.</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Pilih Semua ({AVAILABLE_COLUMNS_GURU.length})
                </button>
                <button
                  type="button"
                  onClick={resetColumns}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Standar
                </button>
                <button
                  type="button"
                  onClick={clearAllColumns}
                  className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Dual Panel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Panel Kiri: Pilihan Kategori & Checkbox Kolom */}
              <div className="md:col-span-7 bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col space-y-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveColCategory('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeColCategory === 'ALL' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Semua ({AVAILABLE_COLUMNS_GURU.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveColCategory('IDENTITAS')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeColCategory === 'IDENTITAS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Identitas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveColCategory('PENDIDIKAN')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeColCategory === 'PENDIDIKAN' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Pendidikan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveColCategory('PENUGASAN')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeColCategory === 'PENUGASAN' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Penugasan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveColCategory('AKUN')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activeColCategory === 'AKUN' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Akun Login
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={colSearchQuery}
                    onChange={(e) => setColSearchQuery(e.target.value)}
                    placeholder="Cari kolom (misal: NIK, Kampus, Cabang, Mapel...)"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {visibleColumnOptions.map((col) => {
                    const isSelected = selectedColumns.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => toggleColumn(col.key)}
                        className={`w-full text-left flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate mr-1">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] shrink-0 ${isSelected ? 'bg-emerald-600' : 'border border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </span>
                          <span className="truncate">{col.label}</span>
                        </div>
                        {getCategoryBadge(col.category)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Panel Kanan: Daftar Kolom Terpilih yang Akan Masuk XLSX */}
              <div className="md:col-span-5 bg-white rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kolom Terpilih ({selectedColumns.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Urutan Ekspor</span>
                  </div>

                  {selectedColumns.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center">
                      <RotateCcw className="w-6 h-6 mb-1 text-slate-300" />
                      <span>Belum ada kolom yang dipilih.</span>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {activeCols.map((col, idx) => (
                        <div
                          key={col.key}
                          className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-mono text-slate-400 w-4">{idx + 1}.</span>
                            <span className="font-semibold text-slate-800 truncate">{col.label}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {getCategoryBadge(col.category)}
                            <button
                              type="button"
                              onClick={() => toggleColumn(col.key)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                              title="Hapus Kolom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>Data tersaring: <strong>{filteredGuru.length} guru</strong></span>
                  <span>Kolom: <strong>{selectedColumns.length} kolom</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Live Sample Preview Tabel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                3. Pratinjau 5 Baris Pertama Data
              </span>
              <span className="text-[11px] text-slate-400">Menampilkan sampel {Math.min(filteredGuru.length, 5)} dari {filteredGuru.length} guru</span>
            </div>

            {filteredGuru.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data guru yang memenuhi filter di atas.
              </div>
            ) : selectedColumns.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Pilih minimal 1 kolom di atas untuk melihat sampel tabel.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10 border-b border-slate-200 text-center">No</th>
                      {activeCols.map(c => (
                        <th key={c.key} className="py-2 px-3 border-b border-slate-200 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGuru.slice(0, 5).map((g, idx) => (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        {activeCols.map(c => (
                          <td key={c.key} className="py-1.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                            {c.getValue(g)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Total <strong>{filteredGuru.length} guru</strong> akan diekspor dengan <strong>{selectedColumns.length} kolom</strong> pilihan.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleExportXLSX}
              disabled={filteredGuru.length === 0 || selectedColumns.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download File XLSX ({filteredGuru.length} Guru)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
