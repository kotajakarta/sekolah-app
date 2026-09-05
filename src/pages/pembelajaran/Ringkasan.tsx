import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  Loader2, AlertCircle, Building2, CheckCircle2, Users, BookOpen,
  ChevronLeft, ChevronRight, Search, ArrowUpRight, Calendar, X, Info, RefreshCw
} from 'lucide-react';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../hooks/useAuth';

interface ClassWeekDetail {
  kelasId: string;
  kelasName: string;
  guruName?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR' | null;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
}

interface WeekCell {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR' | null;
  guruNames: string[];
  kelasNames?: string[];
  details?: ClassWeekDetail[];
}

interface MapelWeekRow {
  mataPelajaranId: string;
  mataPelajaranName: string;
  weeks: WeekCell[];
}

interface WeekInfo {
  weekNumber: number;
  dateLabel: string;
  saturdayDate: string | null;
  dateRange: string;
}

interface MapelDetailItem {
  id: string;
  mataPelajaranId: string;
  mataPelajaranName: string;
  guruName?: string | null;
  tanggal: string;
  statusPelaksanaan: 'COMPLETED' | 'PENDING' | 'LIBUR';
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalSiswa: number;
  persenHadirMapel: number;
}

interface ClassWeekBreakdown {
  weekNumber: number;
  dateLabel: string;
  isFuture?: boolean;
  mapelCompleted: number;
  mapelTarget: number;
  persenMapel: number;
  hadir: number;
  totalAbsensi: number;
  persenKehadiran: number;
  details?: MapelDetailItem[];
}

interface UnitBreakdownItem {
  id: string;
  name: string;
  parentName: string;
  jumlahCabang?: number;
  jumlahKelas?: number;
  jumlahSiswa?: number;
  silabusCompleted: number;
  silabusTotal: number;
  persenSilabus: number;
  hadir: number;
  totalAbsensi: number;
  persenKehadiran: number;
  status: 'Optimal' | 'Sesuai Jalur' | 'Berisiko';
  weeks?: ClassWeekBreakdown[];
  details?: MapelDetailItem[];
}

interface FilterOptions {
  wilayahList: Array<{ id: string; name: string }>;
  cabangList: Array<{ id: string; name: string; wilayahId: string | null }>;
}

interface RingkasanResponse {
  tahunAjaran: string;
  semester: string;
  scopeLevel: 'GLOBAL' | 'WILAYAH' | 'CABANG';
  unitLabel: string;
  selectedMonth: string;
  periodeLabel: string;
  totalSilabusCompleted: number;
  totalSilabusTarget: number;
  persenSilabus: number;
  hadir: number;
  totalAbsensi: number;
  persenKehadiran: number;
  kehadiranDelta: number;
  persenPelajaranTerlaksana: number;
  belumMulai: number;
  statusDistribution: { optimal: number; sesuaiJalur: number; berisiko: number };
  breakdownTotal: number;
  unitBreakdown: UnitBreakdownItem[];
  filterOptions: FilterOptions;
  kelasOptions: Array<{ id: string; name: string }>;
  selectedKelasId: string | null;
  pemantauanMingguan: MapelWeekRow[];
  weeksInfo?: WeekInfo[];
}

// ── Helpers ──

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseMonth = (v: string) => {
  const [y, m] = v.split('-').map(Number);
  return { year: y || 2026, month: m || 1 };
};

const shiftMonth = (v: string, delta: number) => {
  const { year, month } = parseMonth(v);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (v: string) => {
  const { year, month } = parseMonth(v);
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const getMapelBadgeClass = (persen: number, isFuture?: boolean) => {
  if (isFuture) {
    return 'bg-slate-100 text-slate-400 border-slate-200';
  }
  if (persen === 0) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (persen < 50) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (persen < 80) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (persen < 100) {
    return 'bg-teal-50 text-teal-700 border-teal-200';
  }
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const getKehadiranTextClass = (persen: number, isFuture?: boolean) => {
  if (isFuture) return 'text-slate-400 font-bold';
  if (persen === 0) return 'text-rose-600 font-bold';
  if (persen < 50) return 'text-amber-600 font-bold';
  if (persen < 80) return 'text-blue-600 font-bold';
  if (persen < 100) return 'text-teal-600 font-bold';
  return 'text-emerald-600 font-bold';
};

type FilterMode = 'monthly' | 'semester' | 'yearly';

export default function Ringkasan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [filterMode, setFilterMode] = useState<FilterMode>('monthly');
  const [monthFilter, setMonthFilter] = useState(currentMonthValue());
  const [semesterFilter, setSemesterFilter] = useState<'GANJIL' | 'GENAP'>('GANJIL');
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState<string>('2026/2027');

  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState('');
  const [selectedCabangFilter, setSelectedCabangFilter] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [detailModalItem, setDetailModalItem] = useState<UnitBreakdownItem | null>(null);

  // Pagination for Unit Breakdown Table
  const [tablePage, setTablePage] = useState(1);
  const tableLimit = 8;

  const { data, isLoading, isError } = useQuery<RingkasanResponse>({
    queryKey: ['pembelajaran-ringkasan', filterMode, monthFilter, semesterFilter, tahunAjaranFilter, kelasFilter, selectedWilayahFilter, selectedCabangFilter],
    queryFn: async () => (await apiClient.get('/pembelajaran/ringkasan', {
      params: {
        mode: filterMode,
        month: filterMode === 'monthly' ? monthFilter : undefined,
        semester: filterMode === 'semester' ? semesterFilter : undefined,
        tahunAjaran: (filterMode === 'semester' || filterMode === 'yearly') ? tahunAjaranFilter : undefined,
        kelasId: kelasFilter || undefined,
        wilayahId: selectedWilayahFilter || undefined,
        cabangId: selectedCabangFilter || undefined,
      }
    })).data
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/pembelajaran/rekap/sync', {
        mode: filterMode,
        periodeKey: filterMode === 'monthly' ? monthFilter : undefined,
        semester: filterMode === 'semester' ? semesterFilter : undefined,
        tahunAjaran: (filterMode === 'semester' || filterMode === 'yearly') ? tahunAjaranFilter : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setSyncSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['pembelajaran-ringkasan'] });
      setTimeout(() => setSyncSuccess(false), 3000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal sinkronisasi data ringkasan');
    }
  });

  // Filtered cabang list based on selected Wilayah
  const availableCabangList = useMemo(() => {
    if (!data?.filterOptions?.cabangList) return [];
    if (!selectedWilayahFilter) return data.filterOptions.cabangList;
    return data.filterOptions.cabangList.filter(c => c.wilayahId === selectedWilayahFilter);
  }, [data?.filterOptions?.cabangList, selectedWilayahFilter]);

  // Filtered unit breakdown items
  const filteredUnitBreakdown = useMemo(() => {
    if (!data?.unitBreakdown) return [];
    return data.unitBreakdown.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(term) || item.parentName.toLowerCase().includes(term);
    });
  }, [data?.unitBreakdown, searchTerm]);

  const totalTablePages = Math.ceil(filteredUnitBreakdown.length / tableLimit) || 1;
  const paginatedUnitBreakdown = useMemo(() => {
    return filteredUnitBreakdown.slice((tablePage - 1) * tableLimit, tablePage * tableLimit);
  }, [filteredUnitBreakdown, tablePage]);

  // Aggregated totals across all filtered units for the top summary row
  const summaryTotals = useMemo(() => {
    // Saring TES-WILAYAH agar tidak dihitung dalam total (hanya 7 wilayah resmi yang dihitung)
    const isExcluded = (name?: string, parentName?: string) => {
      const n = (name || '').toUpperCase();
      const p = (parentName || '').toUpperCase();
      return n.includes('TES-WILAYAH') || p.includes('TES-WILAYAH') || n.startsWith('TES-');
    };

    const list = filteredUnitBreakdown.filter(u => !isExcluded(u.name, u.parentName));
    const totalCount = list.length;
    const totalCabang = list.reduce((acc, u) => acc + (u.jumlahCabang || 0), 0);
    const totalKelas = list.reduce((acc, u) => acc + (u.jumlahKelas || 0), 0);
    const totalSiswa = list.reduce((acc, u) => acc + (u.jumlahSiswa || 0), 0);
    const totalSilabusCompleted = list.reduce((acc, u) => acc + (u.silabusCompleted || 0), 0);
    const totalSilabusTarget = list.reduce((acc, u) => acc + (u.silabusTotal || 0), 0);
    const persenSilabus = totalSilabusTarget > 0 ? Math.round((totalSilabusCompleted / totalSilabusTarget) * 100) : 0;
    const totalHadir = list.reduce((acc, u) => acc + (u.hadir || 0), 0);
    const totalAbsensi = list.reduce((acc, u) => acc + (u.totalAbsensi || 0), 0);

    // Perhitungan persen hadir total: yang 0% juga dihitung dengan membagi rata seluruh unit valid yang dihitung
    const sumTotalPersenKehadiran = list.reduce((acc, u) => acc + (u.persenKehadiran || 0), 0);
    const persenKehadiran = list.length > 0 ? Math.round(sumTotalPersenKehadiran / list.length) : 0;

    const weeksInfo = data?.weeksInfo || [];
    const weeks = weeksInfo.map((_, wIdx) => {
      let mapelCompleted = 0;
      let mapelTarget = 0;
      let hadir = 0;
      let totalAbsensi = 0;
      let isFuture = false;
      const allDetails: MapelDetailItem[] = [];

      list.forEach(u => {
        const w = u.weeks?.[wIdx];
        if (w) {
          if (w.isFuture) isFuture = true;
          mapelCompleted += (w.mapelCompleted || 0);
          mapelTarget += (w.mapelTarget ?? (u.jumlahKelas ? u.jumlahKelas * 5 : 0));
          hadir += (w.hadir || 0);
          totalAbsensi += (w.totalAbsensi || 0);
          if (w.details) allDetails.push(...w.details);
        }
      });

      const persenMapel = isFuture || mapelTarget === 0 ? 0 : Math.min(100, Math.round((mapelCompleted / mapelTarget) * 100));

      // Persen kehadiran mingguan: yang 0% juga dihitung dengan membagi rata seluruh unit valid
      const sumWeekPersenKehadiran = list.reduce((acc, u) => {
        const w = u.weeks?.[wIdx];
        return acc + (w?.persenKehadiran || 0);
      }, 0);
      const persenKehadiran = isFuture || list.length === 0 ? 0 : Math.round(sumWeekPersenKehadiran / list.length);

      return {
        mapelCompleted,
        mapelTarget,
        persenMapel,
        hadir,
        totalAbsensi,
        persenKehadiran,
        isFuture,
        details: allDetails
      };
    });

    return {
      totalCount,
      totalCabang,
      totalKelas,
      totalSiswa,
      totalSilabusCompleted,
      totalSilabusTarget,
      persenSilabus,
      totalHadir,
      totalAbsensi,
      persenKehadiran,
      weeks
    };
  }, [filteredUnitBreakdown, data?.weeksInfo]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh] font-sans text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand mr-2" />
        <span>Memuat data kontrol pembelajaran...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 text-sm font-sans flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <span>Gagal memuat ringkasan pembelajaran. Pastikan koneksi ke server stabil.</span>
      </div>
    );
  }

  if (!data.tahunAjaran || !data.semester) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
        Tahun ajaran &amp; semester aktif belum diatur. Atur di menu Pengaturan Akademik terlebih dahulu.
      </div>
    );
  }

  const deltaCls = data.kehadiranDelta > 0 ? 'text-emerald-700 bg-emerald-50' : data.kehadiranDelta < 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-500 bg-slate-100';
  const deltaLabel = data.kehadiranDelta > 0 ? `+${data.kehadiranDelta}%` : data.kehadiranDelta < 0 ? `${data.kehadiranDelta}%` : '0%';

  const weeksHeaderInfo = data.weeksInfo || [];

  return (
    <div className="font-sans text-slate-900 pb-10 space-y-4">
      {/* Top Header & Filter Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Monitoring Kontrol Pembelajaran</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand border border-blue-100">
              TA {data.tahunAjaran} &middot; {data.semester}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring real-time kurikulum &amp; ketercapaian silabus tingkat {data.unitLabel.toLowerCase()}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Period Mode Selector Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => { setFilterMode('monthly'); setTablePage(1); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${filterMode === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Per Bulan
            </button>
            <button
              onClick={() => { setFilterMode('semester'); setTablePage(1); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${filterMode === 'semester' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Per Semester
            </button>
            <button
              onClick={() => { setFilterMode('yearly'); setTablePage(1); }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${filterMode === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Per Tahun
            </button>
          </div>

          {/* Dynamic Input based on Mode */}
          {filterMode === 'monthly' && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <button
                onClick={() => { setMonthFilter(shiftMonth(monthFilter, -1)); setTablePage(1); }}
                className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-700 min-w-[100px] text-center">
                {formatMonthLabel(monthFilter)}
              </span>
              <button
                onClick={() => { setMonthFilter(shiftMonth(monthFilter, 1)); setTablePage(1); }}
                className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {filterMode === 'semester' && (
            <div className="flex items-center gap-2">
              <select
                value={semesterFilter}
                onChange={e => { setSemesterFilter(e.target.value as any); setTablePage(1); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="GANJIL">Semester Ganjil</option>
                <option value="GENAP">Semester Genap</option>
              </select>

              <select
                value={tahunAjaranFilter}
                onChange={e => { setTahunAjaranFilter(e.target.value); setTablePage(1); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="2026/2027">TA 2026/2027</option>
                <option value="2025/2026">TA 2025/2026</option>
                <option value="2024/2025">TA 2024/2025</option>
              </select>
            </div>
          )}

          {filterMode === 'yearly' && (
            <select
              value={tahunAjaranFilter}
              onChange={e => { setTahunAjaranFilter(e.target.value); setTablePage(1); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="2026/2027">Tahun Ajaran 2026/2027</option>
              <option value="2025/2026">Tahun Ajaran 2025/2026</option>
              <option value="2024/2025">Tahun Ajaran 2024/2025</option>
            </select>
          )}

          {/* Wilayah Filter */}
          {data.filterOptions?.wilayahList?.length > 0 && (
            <select
              value={selectedWilayahFilter}
              onChange={e => {
                setSelectedWilayahFilter(e.target.value);
                setSelectedCabangFilter('');
                setTablePage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Semua Wilayah</option>
              {data.filterOptions.wilayahList.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}

          {/* Cabang Filter */}
          {availableCabangList.length > 0 && (
            <select
              value={selectedCabangFilter}
              onChange={e => {
                setSelectedCabangFilter(e.target.value);
                setTablePage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Semua Cabang</option>
              {availableCabangList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Manual Sync Button (GLOBAL admin only) */}
          {user?.scope === 'GLOBAL' && (
            <button
              type="button"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title="Hitung ulang data ringkasan periode yang sedang dilihat"
              className="inline-flex items-center px-3 py-1.5 bg-brand text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Menyinkronkan...' : syncSuccess ? 'Data Diperbarui' : 'Sync Data'}
            </button>
          )}
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total {data.unitLabel}</span>
            <div className="p-2 rounded-xl bg-blue-50 text-brand">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.breakdownTotal.toLocaleString('id-ID')}</div>
          <p className="text-xs text-brand font-medium mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif Terintegrasi
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pelajaran Terlaksana</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.persenPelajaranTerlaksana}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${data.persenPelajaranTerlaksana}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kehadiran Siswa</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.persenKehadiran}%</div>
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${deltaCls}`}>
              {data.kehadiranDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 text-rose-500" />}
              {deltaLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-3">
            {data.hadir.toLocaleString('id-ID')} / {data.totalAbsensi.toLocaleString('id-ID')} sesi hadir
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Progres Kurikulum</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.persenSilabus}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${data.persenSilabus}%` }} />
          </div>
        </div>
      </div>

      {/* Main Monitoring Section: Unit Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Ringkasan Ketercapaian per {data.unitLabel} — {data.periodeLabel}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ketercapaian silabus &amp; absensi per {data.unitLabel.toLowerCase()} (Target Penyebut: {
                filterMode === 'monthly' ? 'Jumlah Sabtu x 5' : filterMode === 'semester' ? 'Jumlah Sabtu x 6' : '12/tahun'
              })
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Cari ${data.unitLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setTablePage(1); }}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Breakdown Table with Multi-Week Columns */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 min-w-[150px]">Nama {data.unitLabel}</th>
                {data.unitLabel === 'Wilayah' && <th className="px-3 py-3 text-center min-w-[100px]">Jumlah Cabang</th>}
                {(data.unitLabel === 'Wilayah' || data.unitLabel === 'Cabang') && <th className="px-3 py-3 text-center min-w-[100px]">Jumlah Kelas</th>}
                <th className="px-3 py-3 text-center min-w-[100px]">Jumlah Siswa</th>

                {/* Multi-Week Columns */}
                {weeksHeaderInfo.map((wHeader, wIdx) => (
                  <th key={wIdx} className="px-3 py-3 text-center border-l border-slate-200/60 min-w-[150px]">
                    <div className="text-slate-800 font-bold normal-case text-xs">{wHeader.dateLabel}</div>
                    <div className="text-[10px] text-slate-400 font-normal">Minggu {wHeader.weekNumber}</div>
                  </th>
                ))}

                {/* Total / Summary Column */}
                <th className="px-4 py-3 text-center border-l border-slate-200/60 min-w-[160px]">
                  <div className="text-slate-800 font-bold normal-case text-xs">Total Ringkasan</div>
                  <div className="text-[10px] text-slate-400 font-normal">Mapel &amp; Kehadiran</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {/* TOP SUMMARY TOTAL ROW (Posisi tanda merah pada gambar) */}
              {filteredUnitBreakdown.length > 0 && (
                <tr className="bg-slate-100/95 font-extrabold border-b-2 border-slate-300 text-slate-900 shadow-xs">
                  {/* Sticky Nama Unit: "TOTAL" */}
                  <td className="px-4 py-3.5 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-white text-[11px] font-black tracking-wider uppercase shadow-2xs">
                        TOTAL
                      </span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        ({summaryTotals.totalCount} {data.unitLabel})
                      </span>
                    </div>
                  </td>

                  {/* Total Cabang */}
                  {data.unitLabel === 'Wilayah' && (
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 text-xs font-black border border-purple-300 shadow-2xs">
                        {summaryTotals.totalCabang.toLocaleString('id-ID')} Cabang
                      </span>
                    </td>
                  )}

                  {/* Total Kelas */}
                  {(data.unitLabel === 'Wilayah' || data.unitLabel === 'Cabang') && (
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 shadow-2xs">
                        {summaryTotals.totalKelas.toLocaleString('id-ID')} Kelas
                      </span>
                    </td>
                  )}

                  {/* Total Siswa */}
                  <td className="px-3 py-3.5 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-100 text-brand text-xs font-black border border-blue-300 shadow-2xs">
                      {summaryTotals.totalSiswa.toLocaleString('id-ID')} Siswa
                    </span>
                  </td>

                  {/* Multi-Week Columns for Total */}
                  {weeksHeaderInfo.map((wHeader, wIdx) => {
                    const wData = summaryTotals.weeks[wIdx];
                    const isFuture = wData?.isFuture;

                    return (
                      <td key={wIdx} className="px-3 py-3.5 text-center border-l border-slate-200">
                        {wData ? (
                          <div className="space-y-1">
                            {/* Mapel Week Badge + Info button */}
                            <div className="flex items-center justify-center gap-1">
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold border shadow-2xs ${getMapelBadgeClass(wData.persenMapel, isFuture)}`}>
                                <span>Mapel: {wData.mapelCompleted.toLocaleString('id-ID')}/{wData.mapelTarget.toLocaleString('id-ID')}</span>
                                <span>({wData.persenMapel}%)</span>
                              </div>

                              <button
                                onClick={() => setDetailModalItem({
                                  id: 'TOTAL',
                                  name: `TOTAL KESELURUHAN — ${wHeader.dateLabel}`,
                                  parentName: '',
                                  silabusCompleted: wData.mapelCompleted,
                                  silabusTotal: wData.mapelTarget,
                                  persenSilabus: wData.persenMapel,
                                  hadir: wData.hadir,
                                  totalAbsensi: wData.totalAbsensi,
                                  persenKehadiran: wData.persenKehadiran,
                                  status: wData.persenMapel >= 90 ? 'Optimal' : wData.persenMapel >= 70 ? 'Sesuai Jalur' : 'Berisiko',
                                  details: wData.details || []
                                })}
                                title={`Detail Pengerjaan & Kehadiran Total ${wHeader.dateLabel}`}
                                className="p-1 text-slate-400 hover:text-brand hover:bg-white rounded-lg transition-all shrink-0 cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Kehadiran Week Text */}
                            <div className="text-[10px] font-bold text-slate-600">
                              Hadir: <span className={getKehadiranTextClass(wData.persenKehadiran, isFuture)}>{wData.persenKehadiran}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Total Ringkasan Column */}
                  <td className="px-4 py-3.5 border-l border-slate-200">
                    <div className="space-y-1.5">
                      {/* Mapel Summary */}
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-slate-700">Mapel:</span>
                        <span className="text-brand">
                          {summaryTotals.totalSilabusCompleted.toLocaleString('id-ID')}/{summaryTotals.totalSilabusTarget.toLocaleString('id-ID')} ({summaryTotals.persenSilabus}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            summaryTotals.persenSilabus >= 85 ? 'bg-emerald-500' :
                            summaryTotals.persenSilabus >= 70 ? 'bg-brand' : 'bg-rose-500'
                          }`}
                          style={{ width: `${summaryTotals.persenSilabus}%` }}
                        />
                      </div>

                      {/* Kehadiran Summary */}
                      <div className="flex items-center justify-between text-xs font-extrabold pt-0.5">
                        <span className="text-slate-700">Hadir:</span>
                        <span className={`${
                          summaryTotals.persenKehadiran >= 85 ? 'text-emerald-700' :
                          summaryTotals.persenKehadiran >= 70 ? 'text-blue-700' : 'text-slate-800'
                        }`}>{summaryTotals.persenKehadiran}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {paginatedUnitBreakdown.length > 0 ? (
                paginatedUnitBreakdown.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Unit Name (Wilayah / Cabang / Kelas) */}
                    <td className="px-4 py-3.5 font-bold text-slate-800 sticky left-0 bg-white z-10">{item.name}</td>

                    {/* Jumlah Cabang (when unit is Wilayah) */}
                    {data.unitLabel === 'Wilayah' && (
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                          {item.jumlahCabang || 0} Cabang
                        </span>
                      </td>
                    )}

                    {/* Jumlah Kelas (when unit is Wilayah or Cabang) */}
                    {(data.unitLabel === 'Wilayah' || data.unitLabel === 'Cabang') && (
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                          {item.jumlahKelas || 0} Kelas
                        </span>
                      </td>
                    )}

                    {/* Total Students */}
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-brand text-xs font-bold border border-blue-100">
                        {item.jumlahSiswa || 0} Siswa
                      </span>
                    </td>

                    {/* Week-by-Week Columns */}
                    {weeksHeaderInfo.map((wHeader, wIdx) => {
                      const wData = item.weeks?.[wIdx];
                      const isFuture = wData?.isFuture;

                      return (
                        <td key={wIdx} className="px-3 py-3.5 text-center border-l border-slate-100">
                          {wData ? (
                            <div className="space-y-1">
                              {/* Mapel Week Badge + (!) Detail Button */}
                              <div className="flex items-center justify-center gap-1">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${getMapelBadgeClass(wData.persenMapel, isFuture)}`}>
                                  <span>Mapel: {wData.mapelCompleted}/{wData.mapelTarget ?? (item.jumlahKelas ? item.jumlahKelas * 5 : 0)}</span>
                                  <span>({wData.persenMapel}%)</span>
                                </div>

                                {/* (!) Info button for weekly detail */}
                                <button
                                  onClick={() => setDetailModalItem({
                                    ...item,
                                    name: `${item.name} — ${wHeader.dateLabel}`,
                                    details: wData.details || []
                                  })}
                                  title={`Detail Pengerjaan & Kehadiran ${wHeader.dateLabel}`}
                                  className="p-1 text-slate-400 hover:text-brand hover:bg-blue-50 rounded-lg transition-all shrink-0"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Kehadiran Week Text */}
                              <div className="text-[10px] font-semibold text-slate-500">
                                Hadir: <span className={getKehadiranTextClass(wData.persenKehadiran, isFuture)}>{wData.persenKehadiran}%</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Ringkasan Column */}
                    <td className="px-4 py-3.5 border-l border-slate-100">
                      <div className="space-y-1.5">
                        {/* Mapel Summary */}
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600">Mapel:</span>
                          <span className="text-brand">{item.silabusCompleted}/{item.silabusTotal} ({item.persenSilabus}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.persenSilabus >= 85 ? 'bg-emerald-500' :
                              item.persenSilabus >= 70 ? 'bg-brand' : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.persenSilabus}%` }}
                          />
                        </div>

                        {/* Kehadiran Summary */}
                        <div className="flex items-center justify-between text-xs font-bold pt-0.5">
                          <span className="text-slate-600">Hadir:</span>
                          <span className={`${
                            item.persenKehadiran >= 85 ? 'text-emerald-700' :
                            item.persenKehadiran >= 70 ? 'text-blue-700' : 'text-slate-700'
                          }`}>{item.persenKehadiran}%</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6 + weeksHeaderInfo.length} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Tidak ada data {data.unitLabel.toLowerCase()} yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {filteredUnitBreakdown.length > 0 && (
          <div className="p-3 border-t border-slate-100">
            <Pagination
              currentPage={tablePage}
              totalPages={totalTablePages}
              onPageChange={setTablePage}
              totalItems={filteredUnitBreakdown.length}
              itemsPerPage={tableLimit}
            />
          </div>
        )}
      </div>

      {/* Modal Detail Lengkap Ketercapaian Kelas */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Detail Lengkap Ketercapaian</span>
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-brand/10 text-brand font-extrabold">{detailModalItem.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  {detailModalItem.jumlahCabang !== undefined && detailModalItem.jumlahCabang > 0 && (
                    <>
                      <span>Cabang: <strong>{detailModalItem.jumlahCabang} Cabang</strong></span>
                      <span>&bull;</span>
                    </>
                  )}
                  {detailModalItem.jumlahKelas !== undefined && detailModalItem.jumlahKelas > 0 && (
                    <>
                      <span>Kelas: <strong>{detailModalItem.jumlahKelas} Kelas</strong></span>
                      <span>&bull;</span>
                    </>
                  )}
                  <span>Jumlah Siswa: <strong>{detailModalItem.jumlahSiswa || 0} Siswa</strong></span>
                  <span>&bull;</span>
                  <span>Periode: <strong>{data.periodeLabel}</strong></span>
                </p>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {detailModalItem.details && detailModalItem.details.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                        <th className="px-4 py-3 w-10 text-center">No</th>
                        <th className="px-4 py-3">Mata Pelajaran</th>
                        <th className="px-4 py-3">Guru Pengajar</th>
                        <th className="px-4 py-3">Tanggal / Pertemuan</th>
                        <th className="px-4 py-3 text-center">Status Mapel</th>
                        <th className="px-4 py-3 text-center">Rincian Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detailModalItem.details.map((d, idx) => (
                        <tr key={d.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-center font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{d.mataPelajaranName}</td>
                          <td className="px-4 py-3 text-slate-600">{d.guruName || '-'}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {new Date(d.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              d.statusPelaksanaan === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              d.statusPelaksanaan === 'LIBUR' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {d.statusPelaksanaan === 'COMPLETED' ? 'Terlaksana' : d.statusPelaksanaan === 'LIBUR' ? 'Libur' : 'Belum'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded" title="Hadir">H: {d.hadir}</span>
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 font-bold rounded" title="Alpa">A: {d.alpa}</span>
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded" title="Izin">I: {d.izin}</span>
                              <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 font-bold rounded" title="Sakit">S: {d.sakit}</span>
                              <div className="ml-1.5 flex flex-col items-start leading-none">
                                <span className="font-bold text-brand">{Math.min(100, d.persenHadirMapel)}%</span>
                                <span className="text-[9px] text-slate-400 font-normal">({d.hadir}/{d.totalSiswa || 1} Siswa)</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 border border-slate-200 rounded-xl">
                  Belum ada rincian pengerjaan mapel atau absensi di unit ini pada periode yang dipilih.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
