import React, { useState, useMemo } from 'react';
import { X, FileSpreadsheet, CheckSquare, Square, Filter, Search, Download } from 'lucide-react';
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

interface ColumnOption {
  key: string;
  label: string;
  defaultSelected: boolean;
  getValue: (s: Student) => string;
}

const AVAILABLE_COLUMNS: ColumnOption[] = [
  { key: 'fullName', label: 'Nama Santri', defaultSelected: true, getValue: (s) => s.biodata?.fullName || '-' },
  { key: 'nik', label: 'NIK', defaultSelected: true, getValue: (s) => s.biodata?.nik || '-' },
  { key: 'nisn', label: 'NISN', defaultSelected: true, getValue: (s) => s.biodata?.nisn || '-' },
  { key: 'jenisKelamin', label: 'Jenis Kelamin', defaultSelected: true, getValue: (s) => s.biodata?.jenisKelamin === 'L' ? 'Laki-Laki' : s.biodata?.jenisKelamin === 'P' ? 'Perempuan' : '-' },
  { key: 'namaAyah', label: 'Nama Ayah', defaultSelected: true, getValue: (s) => s.biodata?.namaAyah || '-' },
  { key: 'namaIbu', label: 'Nama Ibu', defaultSelected: true, getValue: (s) => s.biodata?.namaIbu || '-' },
  { key: 'phone', label: 'No. Handphone / WA', defaultSelected: false, getValue: (s) => s.biodata?.phone || '-' },
  { key: 'ttl', label: 'Tempat, Tgl Lahir', defaultSelected: false, getValue: (s) => {
    const t = s.biodata?.tempatLahir || '';
    const d = s.biodata?.tanggalLahir ? new Date(s.biodata.tanggalLahir).toLocaleDateString('id-ID') : '';
    return [t, d].filter(Boolean).join(', ') || '-';
  }},
  { key: 'wilayah', label: 'Wilayah', defaultSelected: true, getValue: (s) => s.wilayah?.name || '-' },
  { key: 'cabang', label: 'Cabang', defaultSelected: true, getValue: (s) => s.cabang?.name || '-' },
  { key: 'kelas', label: 'Kelas', defaultSelected: true, getValue: (s) => s.siswaFormal?.kelas?.name || '-' },
  { key: 'lembagaMuadalah', label: 'Lembaga Muadalah', defaultSelected: false, getValue: (s) => s.siswaFormal?.kelas?.lembagaMuadalah?.name || '-' },
  { key: 'statusVerval', label: 'Status Verval', defaultSelected: false, getValue: (s) => s.siswaFormal?.isVerval ? 'Terverval' : 'Belum Verval' },
  { key: 'statusPool', label: 'Status Pool', defaultSelected: false, getValue: (s) => s.statusPool === 'AKTIF' ? 'Aktif Cabang' : 'Pool' },
];

export default function CustomFilterExportModal({ isOpen, onClose, students }: CustomFilterExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.filter(c => c.defaultSelected).map(c => c.key)
  );

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
      // 1. Filter Mode (Wilayah vs Muadalah)
      if (filterMode === 'WILAYAH' && selectedEntityId) {
        if (s.wilayahId !== selectedEntityId) return false;
      } else if (filterMode === 'MUADALAH' && selectedEntityId) {
        const studentMuadalahId = s.siswaFormal?.kelas?.lembagaMuadalah?.id;
        if (studentMuadalahId !== selectedEntityId) return false;
      }

      // 2. Cabang filter
      if (selectedCabangId && s.cabangId !== selectedCabangId) {
        return false;
      }

      // 3. Kelas filter
      if (selectedKelasId && s.siswaFormal?.kelasId !== selectedKelasId) {
        return false;
      }

      // 4. Search query
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

  // Export to Excel XLSX
  const handleExportXLSX = () => {
    if (filteredStudents.length === 0) {
      alert('Tidak ada data santri yang dapat diexport berdasarkan filter saat ini.');
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
    XLSX.writeFile(workbook, `Data_Santri_Custom_${dateStr}.xlsx`);
  };

  if (!isOpen) return null;

  const activeCols = AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.key));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30">
              <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Filter Custom & Export Data Santri</h3>
              <p className="text-xs text-slate-300">Pilih filter wilayah/lembaga, tentukan kolom custom, dan unduh laporan Excel.</p>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Filter Region / Lembaga Hierarki */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>1. Filter Lokasi & Lembaga</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Dropdown 1: Jenis Region / Lembaga */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Filter</label>
                <select
                  value={filterMode}
                  onChange={(e) => handleFilterModeChange(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="SEMUA">Semua Data</option>
                  <option value="WILAYAH">Berdasarkan Wilayah</option>
                  <option value="MUADALAH">Berdasarkan Lembaga Muadalah</option>
                </select>
              </div>

              {/* Dropdown 2: Nama Wilayah / Lembaga */}
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
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
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

              {/* Dropdown 3: Cabang */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cabang</label>
                <select
                  value={selectedCabangId}
                  onChange={(e) => {
                    setSelectedCabangId(e.target.value);
                    setSelectedKelasId('');
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Semua Cabang --</option>
                  {filteredCabangs.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown 4: Kelas */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kelas</label>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Semua Kelas --</option>
                  {filteredKelass.map((k: any) => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pilihan Kolom Custom */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-900">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>2. Tentukan Kolom Tampilan & Export Custom</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllColumns}
                  className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={resetColumns}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Reset Standar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
              {AVAILABLE_COLUMNS.map((col) => {
                const isSelected = selectedColumns.includes(col.key);
                return (
                  <label
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-white border-indigo-500 text-indigo-900 font-bold shadow-sm ring-1 ring-indigo-500'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{col.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Live Preview Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Preview Data Terfilter</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
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
                  className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
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
                      <td colSpan={activeCols.length + 1} className="py-8 text-center text-slate-400">
                        Tidak ada data santri yang memenuhi kriteria filter.
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
          <div className="text-xs text-slate-500 font-medium">
            Tersedia <span className="font-bold text-slate-800">{activeCols.length}</span> kolom terpilih
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
              disabled={filteredStudents.length === 0}
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
