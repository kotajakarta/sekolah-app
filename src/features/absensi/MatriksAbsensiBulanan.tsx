import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Users,
  CheckCircle2,
  Stethoscope,
  Clock,
  UserX,
  FileSpreadsheet,
  Printer,
  Info,
  Building2,
  Home,
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import { parseCatatanSakit } from './ModalSakitSantri';

interface ProgramItem {
  id: string;
  name: string;
  date: string;
}

interface StudentRecapItem {
  studentId: string;
  fullName: string;
  nisLokal: string | null;
  attendanceDetails: Record<string, string>;
  attendanceNotes?: Record<string, string>;
  summary: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    percentage: number;
  };
}

interface MatriksAbsensiBulananProps {
  selectedWilayah: string;
  selectedCabang: string;
  selectedKelas: string;
  onWilayahChange: (val: string) => void;
  onCabangChange: (val: string) => void;
  onKelasChange: (val: string) => void;
  wilayahs: any[];
  branches: any[];
  classes: any[];
  isGlobal: boolean;
  isWilayah: boolean;
  isCabang: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MatriksAbsensiBulanan({
  selectedWilayah,
  selectedCabang,
  selectedKelas,
  onWilayahChange,
  onCabangChange,
  onKelasChange,
  wilayahs,
  branches,
  classes,
  isGlobal,
  isCabang,
}: MatriksAbsensiBulananProps) {
  const { user } = useAuth();

  // State Bulan & Tahun (Default bulan saat ini)
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // State Pencarian & Paginasi
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Tooltip state untuk detail sakit saat hover
  const [activeTooltip, setActiveTooltip] = useState<{
    key: string;
    studentName: string;
    dateStr: string;
    status: string;
    note?: string;
    x: number;
    y: number;
  } | null>(null);

  // Helper navigasi bulan
  const handlePrevMonth = () => {
    const [y, m] = selectedMonthStr.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonthStr(`${newY}-${newM}`);
    setPage(1);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonthStr.split('-').map(Number);
    const d = new Date(y, m, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonthStr(`${newY}-${newM}`);
    setPage(1);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonthStr(`${y}-${m}`);
    setPage(1);
  };

  const displayMonthLabel = useMemo(() => {
    const [y, m] = selectedMonthStr.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }, [selectedMonthStr]);

  // Query Data Rekap Matriks dari Backend
  const { data, isLoading, isError, refetch } = useQuery<{
    programs: ProgramItem[];
    recap: StudentRecapItem[];
  }>({
    queryKey: ['absensi-matriks-bulanan', selectedMonthStr, selectedWilayah, selectedCabang, selectedKelas],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('month', selectedMonthStr);
      if (selectedWilayah) params.append('wilayahId', selectedWilayah);
      if (selectedCabang) params.append('cabangId', selectedCabang);
      if (selectedKelas) params.append('kelasId', selectedKelas);

      const res = await apiClient.get(`/absensi/rekap?${params.toString()}`);
      return res.data;
    },
  });

  const programs = data?.programs || [];
  const recap = data?.recap || [];

  // Filtered & Paginated Recap
  const filteredRecap = useMemo(() => {
    if (!searchQuery.trim()) return recap;
    const q = searchQuery.toLowerCase();
    return recap.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.nisLokal && r.nisLokal.toLowerCase().includes(q))
    );
  }, [recap, searchQuery]);

  const totalPages = Math.ceil(filteredRecap.length / limit) || 1;
  const paginatedRecap = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRecap.slice(start, start + limit);
  }, [filteredRecap, page, limit]);

  // Statistik Agregat Bulanan
  const stats = useMemo(() => {
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;
    let totalPositions = {
      asrama: 0,
      rs: 0,
      orangTua: 0,
    };

    recap.forEach((r) => {
      totalHadir += r.summary.hadir;
      totalSakit += r.summary.sakit;
      totalIzin += r.summary.izin;
      totalAlpa += r.summary.alpa;

      // Hitung rincian posisi santri sakit dari notes
      if (r.attendanceNotes) {
        Object.values(r.attendanceNotes).forEach((note) => {
          if (note && note.includes('[Sakit:')) {
            const parsed = parseCatatanSakit(note);
            if (parsed.posisiSantri === 'Di Asrama') totalPositions.asrama++;
            else if (parsed.posisiSantri === 'Di Rumah Sakit') totalPositions.rs++;
            else if (parsed.posisiSantri === 'Di Rumah Orang Tua') totalPositions.orangTua++;
          }
        });
      }
    });

    const totalSessions = totalHadir + totalSakit + totalIzin + totalAlpa;
    const avgPercentage =
      totalSessions > 0 ? Math.round((totalHadir / totalSessions) * 100) : 0;

    return {
      totalSantri: recap.length,
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlpa,
      avgPercentage,
      totalPositions,
    };
  }, [recap]);

  // Ekspor CSV Sederhana
  const handleExportCSV = () => {
    if (recap.length === 0) return;

    const headers = [
      'No',
      'NIS Lokal',
      'Nama Santri',
      ...programs.map((p) => {
        const d = new Date(p.date);
        return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
      }),
      'Total Hadir (H)',
      'Total Sakit (S)',
      'Total Izin (I)',
      'Total Alpa (A)',
      'Persentase Kehadiran (%)',
    ];

    const rows = recap.map((r, idx) => [
      idx + 1,
      `"${r.nisLokal || '-'}"`,
      `"${r.fullName}"`,
      ...programs.map((p) => r.attendanceDetails[p.id] || '-'),
      r.summary.hadir,
      r.summary.sakit,
      r.summary.izin,
      r.summary.alpa,
      `${r.summary.percentage}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriks_Absensi_${selectedMonthStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Baris Filter & Pemilihan Periode Bulan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Matriks Kehadiran: <span className="text-indigo-600">{displayMonthLabel}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pilih bulan dan kelas untuk menampilkan rekap sesi pembelajaran harian/pekanan.
              </p>
            </div>
          </div>

          {/* Pengontrol Navigasi Bulan */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              className="p-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="month"
              value={selectedMonthStr}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonthStr(e.target.value);
                  setPage(1);
                }
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <button
              type="button"
              onClick={handleNextMonth}
              title="Bulan Selanjutnya"
              className="p-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Filter Dropdowns: Wilayah, Cabang, Kelas */}
        <div className={`grid ${isCabang ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
          {!isCabang && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Wilayah</label>
                <select
                  value={selectedWilayah}
                  onChange={(e) => onWilayahChange(e.target.value)}
                  disabled={!isGlobal}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
                >
                  {isGlobal ? (
                    <>
                      <option value="">-- Semua Wilayah --</option>
                      {wilayahs.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value={selectedWilayah}>{user?.wilayahName || 'Wilayah Terkunci'}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Cabang</label>
                <select
                  value={selectedCabang}
                  onChange={(e) => onCabangChange(e.target.value)}
                  disabled={isCabang}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
                >
                  {isCabang ? (
                    <option value={selectedCabang}>{user?.cabangName || 'Cabang Terkunci'}</option>
                  ) : (
                    <>
                      <option value="">-- Semua Cabang --</option>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Kelas Formal</label>
            <select
              value={selectedKelas}
              onChange={(e) => {
                onKelasChange(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Semua Kelas Formal --</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Tingkat {c.tingkat || '-'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Kartu Ringkasan KPI Bulanan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Santri</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-800">{stats.totalSantri}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Siswa terdaftar</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Rata-Rata</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-indigo-600">{stats.avgPercentage}%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tingkat kehadiran</p>
        </div>

        <div className="bg-white border border-emerald-100 p-4 rounded-2xl shadow-xs bg-gradient-to-b from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Hadir (H)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{stats.totalHadir}</div>
          <p className="text-[11px] text-emerald-600/70 mt-0.5">Total sesi hadir</p>
        </div>

        <div className="bg-white border border-blue-100 p-4 rounded-2xl shadow-xs bg-gradient-to-b from-white to-blue-50/30">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Sakit (S)</span>
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-blue-700">{stats.totalSakit}</div>
          <div className="flex gap-1 text-[10px] text-blue-600/80 mt-0.5 font-medium">
            <span>🏠{stats.totalPositions.asrama}</span>
            <span>🏥{stats.totalPositions.rs}</span>
            <span>🏡{stats.totalPositions.orangTua}</span>
          </div>
        </div>

        <div className="bg-white border border-amber-100 p-4 rounded-2xl shadow-xs bg-gradient-to-b from-white to-amber-50/30">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Izin (I)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-amber-700">{stats.totalIzin}</div>
          <p className="text-[11px] text-amber-600/70 mt-0.5">Izin keterangan</p>
        </div>

        <div className="bg-white border border-rose-100 p-4 rounded-2xl shadow-xs bg-gradient-to-b from-white to-rose-50/30">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Alpa (A)</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-rose-700">{stats.totalAlpa}</div>
          <p className="text-[11px] text-rose-600/70 mt-0.5">Tanpa kabar</p>
        </div>
      </div>

      {/* 3. Toolbar & Konten Matriks Bulanan */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Header Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons & Legends */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="hidden md:flex items-center gap-2 text-[11px] font-semibold text-slate-500 mr-2">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> H = Hadir
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> S = Sakit
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> I = Izin
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> A = Alpa
              </span>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={recap.length === 0}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={recap.length === 0}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Tabel Matriks */}
        <div className="relative">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium">Memuat data matriks bulanan...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-rose-600 text-xs">
              Gagal memuat rekap bulanan. Silakan refresh halaman atau periksa koneksi.
            </div>
          ) : programs.length === 0 ? (
            <div className="py-16 px-6 text-center text-slate-400 flex flex-col items-center justify-center">
              <Info className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Tidak ada program absensi aktif di bulan {displayMonthLabel}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan tab "Input Absensi" atau menu "Jadwal Program Absensi" untuk membuat sesi kegiatan.
              </p>
            </div>
          ) : recap.length === 0 ? (
            <div className="py-16 px-6 text-center text-slate-400">
              Belum ada data santri pada kelas/cabang terpilih untuk bulan ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-100 z-10">No</th>
                    <th className="py-3 px-3 w-24 sticky left-10 bg-slate-100 z-10">NIS</th>
                    <th className="py-3 px-3 min-w-[180px] sticky left-34 bg-slate-100 z-10">Nama Santri</th>

                    {/* Dynamic program date columns */}
                    {programs.map((p) => {
                      const d = new Date(p.date);
                      const dayNum = String(d.getDate()).padStart(2, '0');
                      const dayName = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()];
                      return (
                        <th
                          key={p.id}
                          className="py-2.5 px-1.5 text-center min-w-[44px] border-l border-slate-200"
                          title={`${p.name} - ${d.toLocaleDateString('id-ID', { dateStyle: 'full' })}`}
                        >
                          <div className="text-[11px] font-bold text-slate-800">{dayNum}</div>
                          <div className="text-[9px] font-medium text-slate-400 lowercase">{dayName}</div>
                        </th>
                      );
                    })}

                    {/* Summary columns */}
                    <th className="py-3 px-2 text-center w-11 bg-emerald-50/80 text-emerald-800 border-l-2 border-slate-200">H</th>
                    <th className="py-3 px-2 text-center w-11 bg-blue-50/80 text-blue-800 border-l border-slate-200">S</th>
                    <th className="py-3 px-2 text-center w-11 bg-amber-50/80 text-amber-800 border-l border-slate-200">I</th>
                    <th className="py-3 px-2 text-center w-11 bg-rose-50/80 text-rose-800 border-l border-slate-200">A</th>
                    <th className="py-3 px-3 text-center w-16 bg-indigo-50/80 text-indigo-800 border-l border-slate-200">%</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedRecap.map((row, idx) => (
                    <tr key={row.studentId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-center font-medium text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 sticky left-10 bg-white z-10">
                        {row.nisLokal || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 sticky left-34 bg-white z-10 truncate max-w-[200px]">
                        {row.fullName}
                      </td>

                      {/* Date Cells */}
                      {programs.map((p) => {
                        const status = row.attendanceDetails[p.id] || '-';
                        const note = row.attendanceNotes?.[p.id];
                        const isSakit = status === 'SAKIT';

                        let badgeStyle = 'text-slate-300 bg-slate-50 border-slate-100';
                        if (status === 'HADIR') badgeStyle = 'bg-emerald-500 text-white font-bold shadow-xs';
                        else if (status === 'SAKIT') badgeStyle = 'bg-blue-600 text-white font-bold shadow-xs cursor-pointer ring-1 ring-blue-400/50';
                        else if (status === 'IZIN') badgeStyle = 'bg-amber-500 text-white font-bold shadow-xs';
                        else if (status === 'ALPA') badgeStyle = 'bg-rose-600 text-white font-bold shadow-xs';

                        return (
                          <td
                            key={p.id}
                            className="py-2 px-1 text-center border-l border-slate-100"
                            onMouseEnter={(e) => {
                              if (isSakit || note) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveTooltip({
                                  key: `${row.studentId}-${p.id}`,
                                  studentName: row.fullName,
                                  dateStr: new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                                  status,
                                  note,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] transition-transform hover:scale-115 ${badgeStyle}`}
                            >
                              {status === 'HADIR' ? 'H' : status === 'SAKIT' ? 'S' : status === 'IZIN' ? 'I' : status === 'ALPA' ? 'A' : '-'}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary Cells */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/30 border-l-2 border-slate-200">
                        {row.summary.hadir}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-blue-700 bg-blue-50/30 border-l border-slate-200">
                        {row.summary.sakit}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-amber-700 bg-amber-50/30 border-l border-slate-200">
                        {row.summary.izin}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-rose-700 bg-rose-50/30 border-l border-slate-200">
                        {row.summary.alpa}
                      </td>
                      <td className="py-2 px-3 text-center font-bold border-l border-slate-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                            row.summary.percentage >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.summary.percentage >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.summary.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Floating Tooltip Detail Sakit */}
          {activeTooltip && (
            <div
              style={{
                position: 'fixed',
                left: `${activeTooltip.x}px`,
                top: `${activeTooltip.y - 8}px`,
                transform: 'translate(-50%, -100%)',
                zIndex: 9999,
              }}
              className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 text-xs w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-1.5">
                <span className="font-bold text-blue-300 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Keterangan {activeTooltip.status}
                </span>
                <span className="text-[10px] text-slate-400">{activeTooltip.dateStr}</span>
              </div>
              <p className="font-semibold text-slate-100 truncate mb-1">{activeTooltip.studentName}</p>

              {(() => {
                const parsed = parseCatatanSakit(activeTooltip.note);
                if (parsed.namaPenyakit || parsed.posisiSantri) {
                  return (
                    <div className="space-y-1 text-[11px]">
                      {parsed.namaPenyakit && (
                        <div className="text-slate-300">
                          Penyakit: <strong className="text-white">{parsed.namaPenyakit}</strong>
                        </div>
                      )}
                      {parsed.posisiSantri && (
                        <div className="text-slate-300 flex items-center gap-1">
                          Posisi:
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-800 text-blue-300 font-medium">
                            {parsed.posisiSantri === 'Di Asrama' ? (
                              <Home className="w-3 h-3" />
                            ) : parsed.posisiSantri === 'Di Rumah Sakit' ? (
                              <Building2 className="w-3 h-3 text-rose-300" />
                            ) : (
                              <UserX className="w-3 h-3 text-amber-300" />
                            )}
                            {parsed.posisiSantri}
                          </span>
                        </div>
                      )}
                      {parsed.keteranganTambahan && (
                        <div className="text-slate-400 italic text-[10px] pt-1 border-t border-slate-800">
                          "{parsed.keteranganTambahan}"
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <p className="text-slate-300 text-[11px]">
                    {activeTooltip.note || 'Tidak ada catatan tambahan.'}
                  </p>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, filteredRecap.length)} dari{' '}
              {filteredRecap.length} santri
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
