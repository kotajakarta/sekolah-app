import React, { useState, useMemo } from 'react';
import { X, FileSpreadsheet, CheckSquare, Square, Filter, Search, Download, Plus, Check, Trash2, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '../hooks/useGetStudents';
import { useGetCabang, useGetWilayah } from '../hooks/useMasterData';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

interface CustomFilterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export interface ColumnOption {
  key: string;
  label: string;
  category: 'IDENTITAS' | 'ORTU' | 'ALAMAT' | 'KELEMBAGAAN';
  defaultSelected: boolean;
  getValue: (s: Student) => string;
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  // Identitas Santri
  { key: 'fullName', label: 'Nama Santri', category: 'IDENTITAS', defaultSelected: true, getValue: (s) => s.biodata?.fullName || '-' },
  { key: 'nik', label: 'NIK Santri', category: 'IDENTITAS', defaultSelected: true, getValue: (s) => s.biodata?.nik || '-' },
  { key: 'nisn', label: 'NISN', category: 'IDENTITAS', defaultSelected: true, getValue: (s) => s.biodata?.nisn || '-' },
  { key: 'noKk', label: 'Nomor KK', category: 'IDENTITAS', defaultSelected: false, getValue: (s) => (s.biodata as any)?.noKk || '-' },
  { key: 'anakKe', label: 'Anak Ke-', category: 'IDENTITAS', defaultSelected: false, getValue: (s) => (s.biodata as any)?.anakKe ? String((s.biodata as any).anakKe) : '-' },
  { key: 'jumlahSaudara', label: 'Jumlah Saudara', category: 'IDENTITAS', defaultSelected: false, getValue: (s) => (s.biodata as any)?.jumlahSaudara ? String((s.biodata as any).jumlahSaudara) : '-' },
  { key: 'jenisKelamin', label: 'Jenis Kelamin', category: 'IDENTITAS', defaultSelected: true, getValue: (s) => s.biodata?.jenisKelamin === 'L' ? 'Laki-Laki' : s.biodata?.jenisKelamin === 'P' ? 'Perempuan' : '-' },
  { key: 'tempatLahir', label: 'Tempat Lahir', category: 'IDENTITAS', defaultSelected: false, getValue: (s) => s.biodata?.tempatLahir || '-' },
  { key: 'tanggalLahir', label: 'Tanggal Lahir', category: 'IDENTITAS', defaultSelected: false, getValue: (s) => s.biodata?.tanggalLahir ? new Date(s.biodata.tanggalLahir).toLocaleDateString('id-ID') : '-' },
  { key: 'kewarganegaraan', label: 'Kewarganegaraan', category: 'IDENTITAS', defaultSelected: false, getValue: (s) => s.biodata?.kewarganegaraan || 'WNI' },
  { key: 'phone', label: 'No. Handphone / WA', category: 'IDENTITAS', defaultSelected: false, getValue: (s) => s.biodata?.phone || '-' },

  // Data Ayah
  { key: 'namaAyah', label: 'Nama Ayah', category: 'ORTU', defaultSelected: true, getValue: (s) => s.biodata?.namaAyah || '-' },
  { key: 'statusHidupAyah', label: 'Status Hidup Ayah', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.statusHidupAyah || '-' },
  { key: 'nikAyah', label: 'NIK Ayah', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.nikAyah || '-' },
  { key: 'pekerjaanAyah', label: 'Pekerjaan Ayah', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.pekerjaanAyah || '-' },
  { key: 'pendidikanAyah', label: 'Pendidikan Ayah', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.pendidikanAyah || '-' },
  { key: 'penghasilanAyah', label: 'Penghasilan Ayah', category: 'ORTU', defaultSelected: false, getValue: (s) => (s.biodata as any)?.penghasilanAyah || '-' },

  // Data Ibu
  { key: 'namaIbu', label: 'Nama Ibu', category: 'ORTU', defaultSelected: true, getValue: (s) => s.biodata?.namaIbu || '-' },
  { key: 'statusHidupIbu', label: 'Status Hidup Ibu', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.statusHidupIbu || '-' },
  { key: 'nikIbu', label: 'NIK Ibu', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.nikIbu || '-' },
  { key: 'pekerjaanIbu', label: 'Pekerjaan Ibu', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.pekerjaanIbu || '-' },
  { key: 'pendidikanIbu', label: 'Pendidikan Ibu', category: 'ORTU', defaultSelected: false, getValue: (s) => s.biodata?.pendidikanIbu || '-' },
  { key: 'penghasilanIbu', label: 'Penghasilan Ibu', category: 'ORTU', defaultSelected: false, getValue: (s) => (s.biodata as any)?.penghasilanIbu || '-' },

  // Alamat Domisili
  { key: 'alamatJalan', label: 'Alamat', category: 'ALAMAT', defaultSelected: false, getValue: (s) => s.biodata?.alamatJalan || s.biodata?.address || '-' },
  { key: 'alamatKelName', label: 'Kel', category: 'ALAMAT', defaultSelected: false, getValue: (s) => s.biodata?.alamatKelName || '-' },
  { key: 'alamatKecName', label: 'Kec', category: 'ALAMAT', defaultSelected: false, getValue: (s) => s.biodata?.alamatKecName || '-' },
  { key: 'alamatKabName', label: 'Kab/Kota', category: 'ALAMAT', defaultSelected: false, getValue: (s) => s.biodata?.alamatKabName || '-' },
  { key: 'alamatProvName', label: 'Provinsi', category: 'ALAMAT', defaultSelected: false, getValue: (s) => s.biodata?.alamatProvName || '-' },

  // Kelembagaan & Status Pusdatin
  { key: 'wilayah', label: 'Wilayah', category: 'KELEMBAGAAN', defaultSelected: true, getValue: (s) => s.wilayah?.name || '-' },
  { key: 'cabang', label: 'Cabang', category: 'KELEMBAGAAN', defaultSelected: true, getValue: (s) => s.cabang?.name || '-' },
  { key: 'kelas', label: 'Kelas', category: 'KELEMBAGAAN', defaultSelected: true, getValue: (s) => s.siswaFormal?.kelas?.name || '-' },
  { key: 'lembagaMuadalah', label: 'Lembaga Muadalah', category: 'KELEMBAGAAN', defaultSelected: false, getValue: (s) => s.siswaFormal?.kelas?.lembagaMuadalah?.name || '-' },
  { key: 'statusVerval', label: 'Status Verval', category: 'KELEMBAGAAN', defaultSelected: false, getValue: (s) => s.siswaFormal?.isVerval ? 'Terverval' : 'Belum Verval' },
  { key: 'statusPool', label: 'Status Pool', category: 'KELEMBAGAAN', defaultSelected: false, getValue: (s) => s.statusPool === 'AKTIF' ? 'Aktif Cabang' : 'Pool' },
];

export default function CustomFilterExportModal({ isOpen, onClose, students }: CustomFilterExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.filter(c => c.defaultSelected).map(c => c.key)
  );

  // Category tab filter inside column selection
  const [activeColCategory, setActiveColCategory] = useState<'ALL' | 'IDENTITAS' | 'ORTU' | 'ALAMAT' | 'KELEMBAGAAN'>('ALL');
  const [colSearchQuery, setColSearchQuery] = useState('');

  // Region / Lembaga Multi-level filters
  const [filterMode, setFilterMode] = useState<'SEMUA' | 'WILAYAH' | 'MUADALAH'>('SEMUA');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedCabangId, setSelectedCabangId] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Master Data
  const { data: wilayahs = [] } = useGetWilayah();
  const { data: cabangs = [] } = useGetCabang();

  const { data: muadalahs = [] } = useQuery({
    queryKey: ['lembaga-muadalah-custom-export'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/muadalah');
      return res.data.filter((m: any) => m.isActive);
    },
    enabled: isOpen
  });

  const { data: kelass = [] } = useQuery({
    queryKey: ['kelas-custom-export'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      return res.data.filter((k: any) => k.isActive);
    },
    enabled: isOpen
  });

  // Reset sub filters when filterMode changes
  const handleFilterModeChange = (mode: 'SEMUA' | 'WILAYAH' | 'MUADALAH') => {
    setFilterMode(mode);
    setSelectedEntityId('');
    setSelectedCabangId('');
    setSelectedKelasId('');
  };

  // Filtered cabangs based on Wilayah
  const filteredCabangs = useMemo(() => {
    if (filterMode === 'WILAYAH' && selectedEntityId) {
      return cabangs.filter((c: any) => c.wilayahId === selectedEntityId);
    }
    return cabangs;
  }, [cabangs, filterMode, selectedEntityId]);

  // Filtered kelass based on Cabang or Muadalah
  const filteredKelass = useMemo(() => {
    let result = kelass;
    if (selectedCabangId) {
      result = result.filter((k: any) => k.cabangId === selectedCabangId);
    }
    if (filterMode === 'MUADALAH' && selectedEntityId) {
      result = result.filter((k: any) => k.lembagaMuadalahId === selectedEntityId);
    }
    return result;
  }, [kelass, selectedCabangId, filterMode, selectedEntityId]);

  // Apply filters to students list
  const filteredStudents = useMemo(() => {
    return students.filter((s: Student) => {
      if (filterMode === 'WILAYAH' && selectedEntityId) {
        if (s.wilayahId !== selectedEntityId) return false;
      } else if (filterMode === 'MUADALAH' && selectedEntityId) {
        const studentMuadalahId = s.siswaFormal?.kelas?.lembagaMuadalah?.id;
        if (studentMuadalahId !== selectedEntityId) return false;
      }

      if (selectedCabangId && s.cabangId !== selectedCabangId) return false;
      if (selectedKelasId && s.siswaFormal?.kelasId !== selectedKelasId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = s.biodata?.fullName?.toLowerCase().includes(q);
        const nikMatch = s.biodata?.nik?.toLowerCase().includes(q);
        const nisnMatch = s.biodata?.nisn?.toLowerCase().includes(q);
        const ayahMatch = s.biodata?.namaAyah?.toLowerCase().includes(q);
        const ibuMatch = s.biodata?.namaIbu?.toLowerCase().includes(q);
        if (!nameMatch && !nikMatch && !nisnMatch && !ayahMatch && !ibuMatch) return false;
      }

      return true;
    });
  }, [students, filterMode, selectedEntityId, selectedCabangId, selectedKelasId, searchQuery]);

  // Filter column options by category & search
  const visibleColumnOptions = useMemo(() => {
    return AVAILABLE_COLUMNS.filter(col => {
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
    setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.key));
  };

  const resetColumns = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.filter(c => c.defaultSelected).map(c => c.key));
  };

  const clearAllColumns = () => {
    setSelectedColumns([]);
  };

  // Export to Excel XLSX
  const handleExportXLSX = () => {
    if (filteredStudents.length === 0) {
      alert('Tidak ada data santri yang dapat diexport berdasarkan filter saat ini.');
      return;
    }

    if (selectedColumns.length === 0) {
      alert('Silakan pilih minimal 1 kolom untuk diexport.');
      return;
    }

    const activeCols = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));

    const exportData = filteredStudents.map((s, idx) => {
      const row: Record<string, any> = { 'No': idx + 1 };
      activeCols.forEach(col => {
        row[col.label] = col.getValue(s);
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_Santri_Lengkap_${dateStr}.xlsx`);
  };

  if (!isOpen) return null;

  const activeCols = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));

  const getCategoryBadge = (cat: ColumnOption['category']) => {
    switch (cat) {
      case 'IDENTITAS': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Santri</span>;
      case 'ORTU': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Orang Tua</span>;
      case 'ALAMAT': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Alamat</span>;
      case 'KELEMBAGAAN': return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Lembaga</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl my-4 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30">
              <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Filter Custom &amp; Export Data Santri (Lengkap)</h3>
              <p className="text-xs text-slate-300">Pilih filter lokasi/lembaga, pilih kolom dari data pendaftaran ulang, dan unduh XLSX.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Section 1: Filter Region / Lembaga Hierarki */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>1. Filter Lokasi &amp; Lembaga</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Filter Region</label>
                <select
                  value={filterMode}
                  onChange={(e) => handleFilterModeChange(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="SEMUA">Semua Data Wilayah &amp; Lembaga</option>
                  <option value="WILAYAH">Berdasarkan Wilayah</option>
                  <option value="MUADALAH">Berdasarkan Lembaga Muadalah</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {filterMode === 'WILAYAH' ? 'Pilih Wilayah' : filterMode === 'MUADALAH' ? 'Pilih Lembaga' : 'Region/Lembaga'}
                </label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => {
                    setSelectedEntityId(e.target.value);
                    setSelectedCabangId('');
                    setSelectedKelasId('');
                  }}
                  disabled={filterMode === 'SEMUA'}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">{filterMode === 'WILAYAH' ? '-- Semua Wilayah --' : filterMode === 'MUADALAH' ? '-- Semua Lembaga --' : 'Pilih Jenis Filter Dulu'}</option>
                  {filterMode === 'WILAYAH' && wilayahs.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                  {filterMode === 'MUADALAH' && muadalahs.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cabang</label>
                <select
                  value={selectedCabangId}
                  onChange={(e) => {
                    setSelectedCabangId(e.target.value);
                    setSelectedKelasId('');
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Semua Cabang --</option>
                  {filteredCabangs.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kelas</label>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Semua Kelas --</option>
                  {filteredKelass.map((k: any) => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Multiselect Dual-Panel (Pilih Kolom & Hasil Terpilih di Kanan) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  2. Tentukan Kolom Tampilan &amp; Export Custom ({AVAILABLE_COLUMNS.length} Field Daftar Ulang)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Pilih kolom dari panel kiri. Kolom terpilih akan muncul di sebelah kanan.</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors"
                >
                  Pilih Semua ({AVAILABLE_COLUMNS.length})
                </button>
                <button
                  type="button"
                  onClick={resetColumns}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Standar
                </button>
                <button
                  type="button"
                  onClick={clearAllColumns}
                  className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 font-semibold hover:bg-rose-100 transition-colors"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Dual Panel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Panel Kiri: Pilihan Kategori Kolom & Multi-Select Picker */}
              <div className="md:col-span-7 bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveColCategory('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeColCategory === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Semua ({AVAILABLE_COLUMNS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColCategory('IDENTITAS')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeColCategory === 'IDENTITAS' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Identitas Santri
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColCategory('ORTU')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeColCategory === 'ORTU' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Data Orang Tua
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColCategory('ALAMAT')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeColCategory === 'ALAMAT' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Alamat
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColCategory('KELEMBAGAAN')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activeColCategory === 'KELEMBAGAAN' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Status
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={colSearchQuery}
                    onChange={(e) => setColSearchQuery(e.target.value)}
                    placeholder="Cari kolom (misal: NIK Ayah, Ibu, Pekerjaan, Alamat...)"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                        className={`w-full text-left flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate mr-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{col.label}</span>
                        </div>
                        {getCategoryBadge(col.category)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Panel Kanan: Hasil Kolom Terpilih */}
              <div className="md:col-span-5 bg-indigo-50/30 rounded-xl p-3.5 border border-indigo-100 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                  <span className="font-bold text-xs text-indigo-950 uppercase tracking-wider">
                    Daftar Kolom Terpilih
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[11px]">
                    {selectedColumns.length} Kolom
                  </span>
                </div>

                {selectedColumns.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Square className="w-8 h-8 text-slate-300" />
                    <span>Belum ada kolom yang dipilih. Klik kolom di sebelah kiri untuk menambahkan.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto pr-1">
                    {AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key)).map((col, idx) => (
                      <span
                        key={col.key}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-900 text-xs font-semibold shadow-2xs group hover:border-rose-300 transition-colors"
                      >
                        <span className="text-[10px] text-indigo-400 font-bold">{idx + 1}.</span>
                        <span>{col.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleColumn(col.key)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Hapus kolom ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Live Preview Table */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Preview Data Terfilter</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {filteredStudents.length} Santri Ditemukan
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari santri / ortu..."
                  className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    {activeCols.map(col => (
                      <th key={col.key} className="py-2.5 px-3 whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(activeCols.length + 1, 1)} className="py-8 text-center text-slate-400">
                        Tidak ada data santri yang memenuhi kriteria filter.
                      </td>
                    </tr>
                  ) : activeCols.length === 0 ? (
                    <tr>
                      <td colSpan={1} className="py-8 text-center text-slate-400">
                        Silakan pilih minimal 1 kolom di atas.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.slice(0, 50).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        {activeCols.map(col => (
                          <td key={col.key} className="py-2 px-3 whitespace-nowrap">
                            {col.getValue(s)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredStudents.length > 50 && (
                <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
                  Menampilkan 50 dari {filteredStudents.length} santri pada preview. Semua {filteredStudents.length} santri akan disertakan saat diexport ke Excel.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Tersedia <span className="font-bold text-indigo-700">{activeCols.length}</span> kolom terpilih dari total <span className="font-bold text-slate-800">{AVAILABLE_COLUMNS.length}</span> field pendaftaran ulang
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleExportXLSX}
              disabled={filteredStudents.length === 0 || selectedColumns.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              <Download className="w-4 h-4" />
              Export ke XLSX ({filteredStudents.length} Data)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
