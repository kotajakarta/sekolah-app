import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  Activity,
  Loader2,
  Calendar,
  FileSpreadsheet,
  Printer,
  Search,
  AlertCircle,
  Info
} from 'lucide-react';

interface Program {
  id: string;
  name: string;
  date: string;
}

interface Summary {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  percentage: number;
}

interface StudentRecapRow {
  studentId: string;
  fullName: string;
  nisLokal: string | null;
  attendanceDetails: Record<string, string>;
  summary: Summary;
}

interface RecapResponse {
  programs: Program[];
  recap: StudentRecapRow[];
}

export default function RekapitulasiAbsensi() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  // Filters State
  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'date' | 'semester'>('date');

  // Date Range State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Semester State
  const [selectedSemester, setSelectedSemester] = useState<string>('GANJIL');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');

  // Filter state indicators

  // Initialize locked scope values based on user role
  useEffect(() => {
    if (isWilayah && user?.wilayahId) {
      setSelectedWilayah(user.wilayahId);
    }
    if (isCabang) {
      if (user?.wilayahId) setSelectedWilayah(user.wilayahId);
      if (user?.cabangId) setSelectedCabang(user.cabangId);
    }
  }, [user, isWilayah, isCabang]);

  // Load Active Academic Settings to auto-select current Semester / Year
  const { data: academicSetting } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/akademik');
      return res.data;
    }
  });

  useEffect(() => {
    if (academicSetting) {
      setSelectedTahunAjaran(academicSetting.tahunAjaran || '');
      setSelectedSemester(academicSetting.semesterAktif?.toUpperCase() || 'GANJIL');
    }
  }, [academicSetting]);

  // Load Wilayah list
  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    },
    enabled: isGlobal
  });

  // Load Cabang list
  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    },
    enabled: isGlobal || isWilayah
  });

  // Filter branches based on selected Wilayah
  const filteredBranches = branches.filter((b: any) => {
    if (isWilayah && user?.wilayahId) {
      return b.wilayahId === user.wilayahId;
    }
    if (selectedWilayah) {
      return b.wilayahId === selectedWilayah;
    }
    return true;
  });

  // Load Kelas list
  const { data: classes = [] } = useQuery({
    queryKey: ['formal-classes', selectedCabang],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      if (selectedCabang) {
        return res.data.filter((c: any) => c.cabangId === selectedCabang && c.isActive);
      }
      return [];
    },
    enabled: !!selectedCabang
  });

  const isFilterReady = !!selectedKelas && (
    (filterMode === 'date' && !!startDate && !!endDate) ||
    (filterMode === 'semester' && !!selectedTahunAjaran && !!selectedSemester)
  );

  const handleWilayahChange = (wilayahId: string) => {
    setSelectedWilayah(wilayahId);
    setSelectedCabang('');
    setSelectedKelas('');
  };

  const handleCabangChange = (cabangId: string) => {
    setSelectedCabang(cabangId);
    setSelectedKelas('');
  };

  // Fetch Recap Data
  const { data: recapData, isLoading: loadingRecap, isError, refetch } = useQuery<RecapResponse>({
    queryKey: [
      'absensi-rekap',
      selectedKelas,
      filterMode,
      startDate,
      endDate,
      selectedSemester,
      selectedTahunAjaran
    ],
    queryFn: async () => {
      let url = `/absensi/rekap?kelasId=${selectedKelas}&cabangId=${selectedCabang}`;
      if (filterMode === 'date') {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else {
        url += `&semester=${selectedSemester}&tahunAjaran=${selectedTahunAjaran}`;
      }
      const res = await apiClient.get(url);
      return res.data;
    },
    enabled: isFilterReady
  });

  // Export to CSV Function
  const handleExportCSV = () => {
    if (!recapData || recapData.recap.length === 0) return;

    const selectedKelasName = classes.find(c => c.id === selectedKelas)?.name || 'Kelas';

    // Headers
    const headers = [
      'No',
      'NIS Lokal',
      'Nama Lengkap',
      ...recapData.programs.map(p => p.name),
      'Hadir',
      'Sakit',
      'Izin',
      'Alpa',
      'Persentase Kehadiran (%)'
    ];

    // Rows mapping
    const rows = recapData.recap.map((row, index) => {
      const details = recapData.programs.map(p => row.attendanceDetails[p.id] || '-');
      return [
        index + 1,
        row.nisLokal || '',
        row.fullName,
        ...details,
        row.summary.hadir,
        row.summary.sakit,
        row.summary.izin,
        row.summary.alpa,
        `${row.summary.percentage}%`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Absensi_${selectedKelasName.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12 print:pb-0">
      
      {/* Title Header */}
      <div className="mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-500" />
          Rekapitulasi Absensi Siswa
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Laporan rekapitulasi kehadiran siswa formal per kelas berdasarkan rentang tanggal atau semester.
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-none mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Wilayah</label>
            <select
              value={selectedWilayah}
              onChange={e => handleWilayahChange(e.target.value)}
              disabled={!isGlobal}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
            >
              {isGlobal ? (
                <>
                  <option value="">-- Pilih Wilayah --</option>
                  {wilayahs.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </>
              ) : (
                <option value={selectedWilayah}>{user?.wilayahName || 'Wilayah Terkunci'}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Cabang</label>
            <select
              value={selectedCabang}
              onChange={e => handleCabangChange(e.target.value)}
              disabled={isCabang || (!isGlobal && !selectedWilayah)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
            >
              {isCabang ? (
                <option value={selectedCabang}>{user?.cabangName || 'Cabang Terkunci'}</option>
              ) : (
                <>
                  <option value="">-- Pilih Cabang --</option>
                  {filteredBranches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Kelas Formal</label>
            <select
              value={selectedKelas}
              onChange={e => setSelectedKelas(e.target.value)}
              disabled={!selectedCabang}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} (Tingkat {c.tingkat || '-'})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Mode Toggle & Inputs */}
        <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="w-full md:w-auto">
            <span className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Metode Filter</span>
            <div className="flex border border-slate-200 rounded overflow-hidden w-full md:w-64">
              <button
                type="button"
                onClick={() => setFilterMode('date')}
                className={`flex-1 text-center py-1.5 text-xs font-semibold transition-all ${
                  filterMode === 'date'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#fbfbfb] text-slate-600 hover:bg-slate-50'
                }`}
              >
                Rentang Tanggal
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('semester')}
                className={`flex-1 text-center py-1.5 text-xs font-semibold transition-all ${
                  filterMode === 'semester'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#fbfbfb] text-slate-600 hover:bg-slate-50'
                }`}
              >
                Per Semester
              </button>
            </div>
          </div>

          {filterMode === 'date' ? (
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mulai Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tahun Ajaran</label>
                <select
                  value={selectedTahunAjaran}
                  onChange={e => setSelectedTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
                >
                  <option value="">-- Pilih Tahun Ajaran --</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2023/2024">2023/2024</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
                >
                  <option value="GANJIL">GANJIL</option>
                  <option value="GENAP">GENAP</option>
                </select>
              </div>
            </div>
          )}

          {isFilterReady && (
            <div className="w-full md:w-auto">
              <button
                onClick={() => refetch()}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Segarkan Laporan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Recap Grid Layout */}
      {!isFilterReady ? (
        <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded p-12 text-center text-slate-400 flex flex-col items-center justify-center print:hidden">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">Silakan lengkapi pemilihan Wilayah, Cabang, Kelas, dan filter tanggal/semester untuk memuat rekapitulasi absensi.</p>
        </div>
      ) : loadingRecap ? (
        <div className="bg-white border border-slate-200 rounded p-12 flex justify-center items-center print:hidden">
          <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded p-6 text-center shadow-none flex items-center justify-center gap-2 print:hidden">
          <AlertCircle className="w-5 h-5" /> Gagal memuat rekapitulasi. Pastikan data filter terisi dengan benar.
        </div>
      ) : !recapData || recapData.recap.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-400 shadow-none print:hidden">
          Tidak ada data absensi untuk rentang tanggal/semester yang dipilih pada kelas ini.
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Action Header Panel */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded print:hidden">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rekapitulasi: {recapData.programs.length} Pertemuan ditemukan
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-500" />
                Cetak Laporan
              </button>
            </div>
          </div>

          {/* Printable Report Header */}
          <div className="hidden print:block mb-6 border-b-2 border-slate-300 pb-4">
            <h1 className="text-xl font-bold text-center uppercase tracking-wide">Laporan Rekapitulasi Absensi Siswa</h1>
            <div className="grid grid-cols-2 text-xs mt-3">
              <div>
                <p><span className="font-semibold">Wilayah:</span> {branches.find(b => b.id === selectedCabang)?.wilayah?.name || user?.wilayahName || '-'}</p>
                <p><span className="font-semibold">Cabang:</span> {branches.find(b => b.id === selectedCabang)?.name || user?.cabangName || '-'}</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold">Kelas:</span> {classes.find(c => c.id === selectedKelas)?.name || '-'}</p>
                <p>
                  <span className="font-semibold">Periode:</span>{' '}
                  {filterMode === 'date'
                    ? `${new Date(startDate).toLocaleDateString('id-ID')} s.d ${new Date(endDate).toLocaleDateString('id-ID')}`
                    : `${selectedSemester} (TA ${selectedTahunAjaran})`}
                </p>
              </div>
            </div>
          </div>

          {/* Table Matrix */}
          <div className="bg-white border border-slate-200 rounded shadow-none overflow-hidden flex flex-col print:border-none">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#fbfbfb]">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left border-b border-slate-200">
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 w-28">NIS</th>
                    <th className="px-4 py-3 w-48">Nama Lengkap</th>
                    
                    {/* Render Date columns */}
                    {recapData.programs.map(p => (
                      <th key={p.id} className="px-2 py-3 text-center text-[10px] min-w-14" title={p.name}>
                        {new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                      </th>
                    ))}
                    
                    {/* Summary columns */}
                    <th className="px-3 py-3 w-14 text-center text-emerald-700 bg-emerald-50/30">H</th>
                    <th className="px-3 py-3 w-14 text-center text-blue-700 bg-blue-50/30">S</th>
                    <th className="px-3 py-3 w-14 text-center text-amber-700 bg-amber-50/30">I</th>
                    <th className="px-3 py-3 w-14 text-center text-rose-700 bg-rose-50/30">A</th>
                    <th className="px-4 py-3 w-20 text-center bg-slate-50">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs bg-white">
                  {recapData.recap.map((row, index) => (
                    <tr key={row.studentId} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-650 font-medium font-mono">{row.nisLokal || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{row.fullName}</td>

                      {/* Render statuses */}
                      {recapData.programs.map(p => {
                        const status = row.attendanceDetails[p.id] || '-';
                        return (
                          <td key={p.id} className="px-2 py-3 text-center">
                            {status === 'HADIR' ? (
                              <span className="inline-flex justify-center items-center w-5 h-5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150">H</span>
                            ) : status === 'SAKIT' ? (
                              <span className="inline-flex justify-center items-center w-5 h-5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-150">S</span>
                            ) : status === 'IZIN' ? (
                              <span className="inline-flex justify-center items-center w-5 h-5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-150">I</span>
                            ) : status === 'ALPA' ? (
                              <span className="inline-flex justify-center items-center w-5 h-5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-150">A</span>
                            ) : (
                              <span className="text-slate-350">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Summaries */}
                      <td className="px-3 py-3 text-center font-bold text-emerald-600 bg-emerald-50/10">{row.summary.hadir}</td>
                      <td className="px-3 py-3 text-center font-bold text-blue-600 bg-blue-50/10">{row.summary.sakit}</td>
                      <td className="px-3 py-3 text-center font-bold text-amber-600 bg-amber-50/10">{row.summary.izin}</td>
                      <td className="px-3 py-3 text-center font-bold text-rose-600 bg-rose-50/10">{row.summary.alpa}</td>
                      <td className={`px-4 py-3 text-center font-bold bg-slate-50/50 ${
                        row.summary.percentage >= 90
                          ? 'text-emerald-750'
                          : row.summary.percentage >= 80
                            ? 'text-amber-650'
                            : 'text-rose-700'
                      }`}>
                        {row.summary.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Bottom Summary Legend */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded print:hidden">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Legenda Status:</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150">H</span> Hadir
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-150">S</span> Sakit
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-150">I</span> Izin
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-150">A</span> Alpa
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-350 font-bold">-</span> Belum Terisi
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
