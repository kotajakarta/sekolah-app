import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  Loader2, Search, AlertCircle, Info, Building2, BookOpen, UserCheck,
  CheckCircle2, Sparkles, Filter, FileBarChart, TrendingUp, BarChart3
} from 'lucide-react';

interface Mapel {
  id: string;
  name: string;
  aktifPembelajaran: boolean;
}

interface RekapCabang {
  cabangId: string;
  cabangName: string;
  wilayahName: string;
  jumlahRombel?: number;
  jumlahSiswa?: number;
  persenSilabus: number;
  silabusCompleted: number;
  silabusTotal: number;
  persenKehadiran: number;
  hadir: number;
  totalAbsensi: number;
  persenPelaksanaan?: number;
  pelaksanaanCompleted?: number;
  pelaksanaanTotal?: number;
}

interface LaporanResponse {
  periode: { gte: string; lte: string };
  rekap: RekapCabang[];
}

const statusForPercent = (pct: number) =>
  pct >= 90
    ? { label: 'Optimal', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    : pct >= 70
      ? { label: 'Sesuai Jalur', cls: 'bg-amber-100 text-amber-800 border-amber-300' }
      : { label: 'Berisiko', cls: 'bg-rose-100 text-rose-800 border-rose-300' };

export default function LaporanPembelajaran() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';

  const currentMonthValue = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedWilayah, setSelectedWilayah] = useState('');
  const [selectedCabang, setSelectedCabang] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [mode, setMode] = useState<'weekly' | 'monthly' | 'semester'>('monthly');

  const [weekStart, setWeekStart] = useState('');
  const [month, setMonth] = useState(currentMonthValue());
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [semester, setSemester] = useState('Ganjil');

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isWilayah && user?.wilayahId) setSelectedWilayah(user.wilayahId);
  }, [user, isWilayah]);

  const { data: academicSetting } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => (await apiClient.get('/pengaturan/akademik')).data
  });

  useEffect(() => {
    if (academicSetting) {
      setTahunAjaran(academicSetting.tahunAjaran || '');
      setSemester(academicSetting.semesterAktif || 'Ganjil');
    }
  }, [academicSetting]);

  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => (await apiClient.get('/master-data/wilayah')).data,
    enabled: isGlobal
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => (await apiClient.get('/master-data/cabang')).data
  });

  const filteredBranches = branches.filter((b: any) => {
    if (isWilayah && user?.wilayahId) return b.wilayahId === user.wilayahId;
    if (selectedWilayah) return b.wilayahId === selectedWilayah;
    return true;
  });

  const { data: mapelList = [] } = useQuery<Mapel[]>({
    queryKey: ['mapel'],
    queryFn: async () => (await apiClient.get('/formal/mapel')).data
  });

  const isFilterReady =
    (mode === 'weekly' && !!weekStart) ||
    (mode === 'monthly' && !!month) ||
    (mode === 'semester' && !!tahunAjaran && !!semester);

  const { data: laporan, isLoading, isError, refetch } = useQuery<LaporanResponse>({
    queryKey: ['laporan-pembelajaran', selectedWilayah, selectedCabang, selectedMapel, mode, weekStart, month, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/laporan', {
        params: {
          wilayahId: selectedWilayah || undefined,
          cabangId: selectedCabang || undefined,
          mataPelajaranId: selectedMapel || undefined,
          mode,
          weekStart: mode === 'weekly' ? weekStart : undefined,
          month: mode === 'monthly' ? month : undefined,
          tahunAjaran: mode === 'semester' ? tahunAjaran : undefined,
          semester: mode === 'semester' ? semester : undefined
        }
      });
      return res.data;
    },
    enabled: isFilterReady
  });

  // Rekap per Wilayah summary list
  const wilayahSummaryList = useMemo(() => {
    if (!laporan?.rekap) return [];

    const map = new Map<string, {
      wilayahName: string;
      totalCabang: number;
      jumlahRombel: number;
      jumlahSiswa: number;
      silabusCompleted: number;
      silabusTotal: number;
      hadir: number;
      totalAbsensi: number;
      pelaksanaanCompleted: number;
      pelaksanaanTotal: number;
    }>();

    laporan.rekap.forEach(r => {
      const wName = r.wilayahName || 'Tanpa Wilayah';
      if (!map.has(wName)) {
        map.set(wName, {
          wilayahName: wName,
          totalCabang: 0,
          jumlahRombel: 0,
          jumlahSiswa: 0,
          silabusCompleted: 0,
          silabusTotal: 0,
          hadir: 0,
          totalAbsensi: 0,
          pelaksanaanCompleted: 0,
          pelaksanaanTotal: 0
        });
      }
      const entry = map.get(wName)!;
      entry.totalCabang += 1;
      entry.jumlahRombel += (r.jumlahRombel || 0);
      entry.jumlahSiswa += (r.jumlahSiswa || 0);
      entry.silabusCompleted += r.silabusCompleted;
      entry.silabusTotal += r.silabusTotal;
      entry.hadir += r.hadir;
      entry.totalAbsensi += r.totalAbsensi;
      entry.pelaksanaanCompleted += (r.pelaksanaanCompleted || 0);
      entry.pelaksanaanTotal += (r.pelaksanaanTotal || 0);
    });

    return Array.from(map.values()).sort((a, b) => a.wilayahName.localeCompare(b.wilayahName));
  }, [laporan?.rekap]);

  // Aggregated totals across all Wilayahs
  const wilayahTotals = useMemo(() => {
    if (!wilayahSummaryList.length) {
      return {
        totalWilayah: 0,
        totalCabang: 0,
        totalRombel: 0,
        totalSiswa: 0,
        silabusCompleted: 0,
        silabusTotal: 0,
        persenSilabus: 0,
        hadir: 0,
        totalAbsensi: 0,
        persenKehadiran: 0,
        pelaksanaanCompleted: 0,
        pelaksanaanTotal: 0,
        persenPelaksanaan: 0
      };
    }
    const isExcluded = (name?: string) => {
      const n = (name || '').toUpperCase();
      return n.includes('TES-WILAYAH') || n.startsWith('TES-');
    };
    const validWilayahList = wilayahSummaryList.filter(w => !isExcluded(w.wilayahName));
    const totalWilayah = validWilayahList.length;
    const totalCabang = validWilayahList.reduce((acc, w) => acc + w.totalCabang, 0);
    const totalRombel = validWilayahList.reduce((acc, w) => acc + w.jumlahRombel, 0);
    const totalSiswa = validWilayahList.reduce((acc, w) => acc + w.jumlahSiswa, 0);
    const silabusCompleted = validWilayahList.reduce((acc, w) => acc + w.silabusCompleted, 0);
    const silabusTotal = validWilayahList.reduce((acc, w) => acc + w.silabusTotal, 0);
    const hadir = validWilayahList.reduce((acc, w) => acc + w.hadir, 0);
    const totalAbsensi = validWilayahList.reduce((acc, w) => acc + w.totalAbsensi, 0);
    const pelaksanaanCompleted = validWilayahList.reduce((acc, w) => acc + w.pelaksanaanCompleted, 0);
    const pelaksanaanTotal = validWilayahList.reduce((acc, w) => acc + w.pelaksanaanTotal, 0);

    // Hitung rata-rata persen kehadiran termasuk wilayah yang 0%
    const sumPersenKehadiran = validWilayahList.reduce((acc, w) => {
      const pct = w.totalAbsensi > 0 ? Math.round((w.hadir / w.totalAbsensi) * 100) : 0;
      return acc + pct;
    }, 0);
    const persenKehadiran = validWilayahList.length > 0 ? Math.round(sumPersenKehadiran / validWilayahList.length) : 0;

    return {
      totalWilayah,
      totalCabang,
      totalRombel,
      totalSiswa,
      silabusCompleted,
      silabusTotal,
      persenSilabus: silabusTotal > 0 ? Math.round((silabusCompleted / silabusTotal) * 100) : 0,
      hadir,
      totalAbsensi,
      persenKehadiran,
      pelaksanaanCompleted,
      pelaksanaanTotal,
      persenPelaksanaan: pelaksanaanTotal > 0 ? Math.round((pelaksanaanCompleted / pelaksanaanTotal) * 100) : 0
    };
  }, [wilayahSummaryList]);

  // Filtered cabang list by search query
  const filteredCabangList = useMemo(() => {
    if (!laporan?.rekap) return [];
    if (!searchQuery.trim()) return laporan.rekap;
    const query = searchQuery.toLowerCase();
    return laporan.rekap.filter(r =>
      r.cabangName.toLowerCase().includes(query) ||
      r.wilayahName.toLowerCase().includes(query)
    );
  }, [laporan?.rekap, searchQuery]);

  // Aggregated totals for filtered Cabangs
  const filteredTotals = useMemo(() => {
    if (!filteredCabangList.length) {
      return {
        totalCabang: 0,
        totalRombel: 0,
        totalSiswa: 0,
        silabusCompleted: 0,
        silabusTotal: 0,
        persenSilabus: 0,
        hadir: 0,
        totalAbsensi: 0,
        persenKehadiran: 0,
        pelaksanaanCompleted: 0,
        pelaksanaanTotal: 0,
        persenPelaksanaan: 0
      };
    }
    const totalRombel = filteredCabangList.reduce((acc, r) => acc + (r.jumlahRombel || 0), 0);
    const totalSiswa = filteredCabangList.reduce((acc, r) => acc + (r.jumlahSiswa || 0), 0);
    const silabusCompleted = filteredCabangList.reduce((acc, r) => acc + r.silabusCompleted, 0);
    const silabusTotal = filteredCabangList.reduce((acc, r) => acc + r.silabusTotal, 0);
    const hadir = filteredCabangList.reduce((acc, r) => acc + r.hadir, 0);
    const totalAbsensi = filteredCabangList.reduce((acc, r) => acc + r.totalAbsensi, 0);
    const pelaksanaanCompleted = filteredCabangList.reduce((acc, r) => acc + (r.pelaksanaanCompleted || 0), 0);
    const pelaksanaanTotal = filteredCabangList.reduce((acc, r) => acc + (r.pelaksanaanTotal || 0), 0);

    return {
      totalCabang: filteredCabangList.length,
      totalRombel,
      totalSiswa,
      silabusCompleted,
      silabusTotal,
      persenSilabus: silabusTotal > 0 ? Math.round((silabusCompleted / silabusTotal) * 100) : 0,
      hadir,
      totalAbsensi,
      persenKehadiran: totalAbsensi > 0 ? Math.round((hadir / totalAbsensi) * 100) : 0,
      pelaksanaanCompleted,
      pelaksanaanTotal,
      persenPelaksanaan: pelaksanaanTotal > 0 ? Math.round((pelaksanaanCompleted / pelaksanaanTotal) * 100) : 0
    };
  }, [filteredCabangList]);

  const renderProgressCell = (
    completed: number,
    total: number,
    isTotalCell: boolean = false,
    customColor?: { bar: string; badge: string; text: string },
    forcedPct?: number
  ) => {
    const pct = forcedPct !== undefined ? forcedPct : (total > 0 ? Math.round((completed / total) * 100) : 0);
    const clampedPct = Math.min(pct, 100);

    let textColor = customColor?.text || 'text-emerald-600 font-bold';
    let barColor = customColor?.bar || 'bg-emerald-500';
    let badgeColor = customColor?.badge || 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (!customColor) {
      if (pct < 70) {
        textColor = 'text-rose-600 font-bold';
        barColor = 'bg-rose-500';
        badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (pct < 90) {
        textColor = 'text-amber-600 font-bold';
        barColor = 'bg-amber-500';
        badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
      }
    }

    if (isTotalCell) {
      return (
        <div className="flex flex-col items-center justify-center py-0.5 max-w-[120px] mx-auto">
          <div className="text-xs font-extrabold text-slate-900">
            {completed.toLocaleString('id-ID')} <span className="text-slate-400 font-normal text-[10px]">/ {total.toLocaleString('id-ID')}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-1 shadow-2xs">
            <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${clampedPct}%` }} />
          </div>
          <div className="mt-1">
            <span className={`inline-flex px-2 py-0.2 text-[10px] font-extrabold rounded-full border shadow-2xs ${badgeColor}`}>
              {pct}%
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-0.5 max-w-[110px] mx-auto">
        <div className="flex items-baseline justify-center gap-0.5 w-full text-[11px]">
          <span className="font-extrabold text-slate-900 text-xs">{completed.toLocaleString('id-ID')}</span>
          <span className="text-slate-400 font-normal text-[10px]">/{total.toLocaleString('id-ID')}</span>
        </div>
        <div className="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden mt-0.5 shadow-2xs">
          <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${clampedPct}%` }} />
        </div>
        <div className="text-center mt-0.5 leading-none">
          <span className={`text-[10px] font-extrabold ${textColor}`}>{pct}%</span>
        </div>
      </div>
    );
  };

  const renderStatusBadge = (pct: number) => {
    const status = statusForPercent(pct);
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border shadow-2xs ${status.cls}`}>
        {status.label}
      </span>
    );
  };

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-300 pb-12 space-y-6">
      {/* ── FILTER SECTION ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Wilayah</label>
            <select
              value={selectedWilayah}
              onChange={e => { setSelectedWilayah(e.target.value); setSelectedCabang(''); }}
              disabled={!isGlobal}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-75"
            >
              {isGlobal ? (
                <>
                  <option value="">Semua Wilayah</option>
                  {wilayahs.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </>
              ) : (
                <option value={selectedWilayah}>{user?.wilayahName || 'Wilayah Terkunci'}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cabang Pesantren</label>
            <select
              value={selectedCabang}
              onChange={e => setSelectedCabang(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Semua Cabang</option>
              {filteredBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Semua Mapel</option>
              {mapelList.filter(m => m.aktifPembelajaran).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="w-full md:w-auto">
            <span className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Periode Laporan</span>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden w-full md:w-72 bg-slate-50 p-0.5">
              {(['weekly', 'monthly', 'semester'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === m ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {m === 'weekly' ? 'Mingguan' : m === 'monthly' ? 'Bulanan' : 'Semester'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'weekly' ? (
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Minggu Laporan</label>
              <input
                type="date"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          ) : mode === 'monthly' ? (
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pilih Bulan</label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Tahun Ajaran</label>
                <select
                  value={tahunAjaran}
                  onChange={e => setTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Semester</label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>
          )}

          {isFilterReady && (
            <div className="w-full md:w-auto">
              <button
                onClick={() => refetch()}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Segarkan Laporan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT BODY ── */}
      {!isFilterReady ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Lengkapi filter periode untuk memuat laporan pembelajaran.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex justify-center items-center">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center flex items-center justify-center gap-2 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-500" /> Gagal memuat data laporan pembelajaran.
        </div>
      ) : !laporan || laporan.rekap.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-400">
          Tidak ada data pelaksanaan pembelajaran untuk filter yang dipilih.
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── KPI SUMMARY CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Cabang</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{laporan.rekap.length} Cabang</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rata-Rata Pelaksanaan</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{filteredTotals.persenPelaksanaan}%</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rata-Rata Silabus</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{filteredTotals.persenSilabus}%</h4>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rata-Rata Kehadiran</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{filteredTotals.persenKehadiran}%</h4>
              </div>
            </div>
          </div>

          {/* ── REKAPITULASI PER WILAYAH TABLE (Hanya muncul jika Filter Wilayah = Semua Wilayah / empty) ── */}
          {selectedWilayah === '' && wilayahSummaryList.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                    Rekapitulasi Data Per Wilayah ({wilayahSummaryList.length} Wilayah)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-300">
                  Akumulasi Pelaksanaan, Silabus & Kehadiran per Wilayah
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr className="border-b border-slate-200">
                      <th rowSpan={2} className="py-2.5 px-3 text-center w-12 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">No</th>
                      <th rowSpan={2} className="py-2.5 px-3 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">Nama Wilayah</th>
                      <th rowSpan={2} className="py-2.5 px-3 text-center bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">Jumlah Cabang</th>
                      <th rowSpan={2} className="py-2.5 px-3 text-center bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">Rombel Aktif</th>
                      <th colSpan={2} className="py-2.5 px-3 text-center bg-[#6B21A8] text-white font-extrabold tracking-wide border-r border-purple-600 shadow-2xs">
                        PELAKSANAAN PEMBELAJARAN
                      </th>
                      <th colSpan={2} className="py-2.5 px-3 text-center bg-[#0073B7] text-white font-extrabold tracking-wide border-r border-sky-600 shadow-2xs">
                        PROGRES SILABUS
                      </th>
                      <th colSpan={2} className="py-2.5 px-3 text-center bg-[#10B981] text-white font-extrabold tracking-wide border-r border-emerald-600 shadow-2xs">
                        KEHADIRAN SISWA
                      </th>
                      <th rowSpan={2} className="py-2.5 px-3 text-center bg-indigo-900 text-white font-extrabold align-middle">
                        JUMLAH SISWA AKTIF DIROMBEL
                      </th>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-3 text-center bg-purple-50 text-purple-950 font-bold border-r border-purple-200 text-[11px]">TERLAKSANA & TARGET</th>
                      <th className="py-2 px-3 text-center bg-purple-50 text-purple-950 font-bold border-r border-purple-300 text-[11px]">% PELAKSANAAN</th>
                      <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TARGET & COMPLETED</th>
                      <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-300 text-[11px]">% SILABUS</th>
                      <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">HADIR & TOTAL ABSENSI</th>
                      <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-300 text-[11px]">% KEHADIRAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Top Summary Row for All Wilayahs */}
                    <tr className="bg-blue-50/90 font-extrabold text-slate-900 border-b-2 border-blue-200 shadow-2xs">
                      <td colSpan={2} className="py-2.5 px-3 text-center bg-blue-100/80 text-blue-950 font-black border-r border-blue-200 text-xs">
                        TOTAL ({wilayahTotals.totalWilayah} WILAYAH):
                      </td>
                      <td className="py-2.5 px-3 text-center bg-blue-100/60 font-black border-r border-blue-200 text-xs">
                        {wilayahTotals.totalCabang} Cabang
                      </td>
                      <td className="py-2.5 px-3 text-center bg-blue-100/60 font-black border-r border-blue-200 text-xs">
                        {wilayahTotals.totalRombel} Rombel
                      </td>
                      <td className="py-2 px-3 text-center bg-purple-50 border-r border-purple-200 font-bold">
                        {wilayahTotals.pelaksanaanCompleted.toLocaleString('id-ID')} / {wilayahTotals.pelaksanaanTotal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-center bg-purple-50/90 border-r border-purple-300">
                        {renderProgressCell(wilayahTotals.pelaksanaanCompleted, wilayahTotals.pelaksanaanTotal, true)}
                      </td>
                      <td className="py-2 px-3 text-center bg-blue-50 border-r border-sky-200 font-bold">
                        {wilayahTotals.silabusCompleted.toLocaleString('id-ID')} / {wilayahTotals.silabusTotal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-center bg-blue-50/90 border-r border-sky-300">
                        {renderProgressCell(wilayahTotals.silabusCompleted, wilayahTotals.silabusTotal, true)}
                      </td>
                      <td className="py-2 px-3 text-center bg-emerald-50 border-r border-emerald-200 font-bold">
                        {wilayahTotals.hadir.toLocaleString('id-ID')} / {wilayahTotals.totalAbsensi.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-center bg-emerald-50/90 border-r border-emerald-300">
                        {renderProgressCell(wilayahTotals.hadir, wilayahTotals.totalAbsensi, true, undefined, wilayahTotals.persenKehadiran)}
                      </td>
                      <td className="py-2 px-3 text-center bg-indigo-100/70 border-r border-indigo-200 font-extrabold text-slate-900">
                        {wilayahTotals.totalSiswa.toLocaleString('id-ID')} Siswa
                      </td>
                    </tr>

                    {wilayahSummaryList.map((w, idx) => {
                      return (
                        <tr key={w.wilayahName} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-100">
                            <div>{w.wilayahName}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700 border-r border-slate-100">
                            {w.totalCabang} Cabang
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700 border-r border-slate-100">
                            {w.jumlahRombel} Rombel
                          </td>
                          <td className="py-2 px-3 text-center bg-purple-50/30 border-r border-purple-100 font-semibold text-slate-700">
                            {w.pelaksanaanCompleted.toLocaleString('id-ID')} / {w.pelaksanaanTotal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center bg-purple-50/50 border-r border-purple-200">
                            {renderProgressCell(w.pelaksanaanCompleted, w.pelaksanaanTotal)}
                          </td>
                          <td className="py-2 px-3 text-center bg-sky-50/30 border-r border-sky-100 font-semibold text-slate-700">
                            {w.silabusCompleted.toLocaleString('id-ID')} / {w.silabusTotal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center bg-sky-50/50 border-r border-sky-200">
                            {renderProgressCell(w.silabusCompleted, w.silabusTotal)}
                          </td>
                          <td className="py-2 px-3 text-center bg-emerald-50/30 border-r border-emerald-100 font-semibold text-slate-700">
                            {w.hadir.toLocaleString('id-ID')} / {w.totalAbsensi.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center bg-emerald-50/50 border-r border-emerald-200">
                            {renderProgressCell(w.hadir, w.totalAbsensi)}
                          </td>
                          <td className="py-2 px-3 text-center font-extrabold text-indigo-950 bg-indigo-50/60">
                            {(w.jumlahSiswa || 0).toLocaleString('id-ID')} Siswa
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── RINCIAN DATA CABANG TABLE ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                  Rincian Data Cabang ({filteredCabangList.length} Cabang)
                </h3>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari cabang..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr className="border-b border-slate-200">
                    <th rowSpan={2} className="py-2.5 px-3 text-center w-12 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">No</th>
                    <th rowSpan={2} className="py-2.5 px-3 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">Nama Cabang</th>
                    <th rowSpan={2} className="py-2.5 px-3 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">Wilayah</th>
                    <th rowSpan={2} className="py-2.5 px-3 text-center bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">Rombel Aktif</th>
                    <th colSpan={2} className="py-2.5 px-3 text-center bg-[#6B21A8] text-white font-extrabold tracking-wide border-r border-purple-600 shadow-2xs">
                      PELAKSANAAN PEMBELAJARAN
                    </th>
                    <th colSpan={2} className="py-2.5 px-3 text-center bg-[#0073B7] text-white font-extrabold tracking-wide border-r border-sky-600 shadow-2xs">
                      PROGRES SILABUS
                    </th>
                    <th colSpan={2} className="py-2.5 px-3 text-center bg-[#10B981] text-white font-extrabold tracking-wide border-r border-emerald-600 shadow-2xs">
                      KEHADIRAN SISWA
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 text-center bg-indigo-900 text-white font-extrabold align-middle">
                      JUMLAH SISWA AKTIF DIROMBEL
                    </th>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3 text-center bg-purple-50 text-purple-950 font-bold border-r border-purple-200 text-[11px]">TERLAKSANA & TARGET</th>
                    <th className="py-2 px-3 text-center bg-purple-50 text-purple-950 font-bold border-r border-purple-300 text-[11px]">% PELAKSANAAN</th>
                    <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TARGET & COMPLETED</th>
                    <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-300 text-[11px]">% SILABUS</th>
                    <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">HADIR & TOTAL ABSENSI</th>
                    <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-300 text-[11px]">% KEHADIRAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* TOP TOTAL SUMMARY ROW FOR FILTERED CABANGS */}
                  <tr className="bg-[#DCEBFB] border-b-2 border-sky-300 text-xs font-bold shadow-2xs">
                    <td colSpan={3} className="py-3 px-3 text-right font-extrabold text-slate-800 bg-[#CFE2F9] border-r border-sky-300 uppercase tracking-wider">
                      TOTAL ({filteredTotals.totalCabang} CABANG):
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-slate-800 bg-[#CFE2F9] border-r border-sky-300 text-xs">
                      {filteredTotals.totalRombel} Rombel
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#F3E8FF] border-r border-purple-200 font-bold">
                      {filteredTotals.pelaksanaanCompleted.toLocaleString('id-ID')} / {filteredTotals.pelaksanaanTotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#F3E8FF] border-r border-purple-300">
                      {renderProgressCell(filteredTotals.pelaksanaanCompleted, filteredTotals.pelaksanaanTotal, true)}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200 font-bold">
                      {filteredTotals.silabusCompleted.toLocaleString('id-ID')} / {filteredTotals.silabusTotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-300">
                      {renderProgressCell(filteredTotals.silabusCompleted, filteredTotals.silabusTotal, true)}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#D1FAE5] border-r border-emerald-200 font-bold">
                      {filteredTotals.hadir.toLocaleString('id-ID')} / {filteredTotals.totalAbsensi.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-[#D1FAE5] border-r border-emerald-300">
                      {renderProgressCell(filteredTotals.hadir, filteredTotals.totalAbsensi, true)}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-indigo-100/70 font-extrabold text-slate-900">
                      {filteredTotals.totalSiswa.toLocaleString('id-ID')} Siswa
                    </td>
                  </tr>

                  {filteredCabangList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 text-xs font-medium">
                        Tidak ada cabang yang cocok dengan pencarian "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredCabangList.map((row, idx) => (
                      <tr key={row.cabangId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-100">
                          {row.cabangName}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-600 border-r border-slate-100">
                          {row.wilayahName}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 border-r border-slate-100">
                          {(row.jumlahRombel || 0)} Rombel
                        </td>
                        <td className="py-2 px-3 text-center bg-purple-50/30 border-r border-purple-100 font-semibold text-slate-700">
                          {(row.pelaksanaanCompleted || 0).toLocaleString('id-ID')} / {(row.pelaksanaanTotal || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center bg-purple-50/50 border-r border-purple-200">
                          {renderProgressCell(row.pelaksanaanCompleted || 0, row.pelaksanaanTotal || 0)}
                        </td>
                        <td className="py-2 px-3 text-center bg-sky-50/30 border-r border-sky-100 font-semibold text-slate-700">
                          {row.silabusCompleted.toLocaleString('id-ID')} / {row.silabusTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center bg-sky-50/50 border-r border-sky-200">
                          {renderProgressCell(row.silabusCompleted, row.silabusTotal)}
                        </td>
                        <td className="py-2 px-3 text-center bg-emerald-50/30 border-r border-emerald-100 font-semibold text-slate-700">
                          {row.hadir.toLocaleString('id-ID')} / {row.totalAbsensi.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center bg-emerald-50/50 border-r border-emerald-200">
                          {renderProgressCell(row.hadir, row.totalAbsensi)}
                        </td>
                        <td className="py-2 px-3 text-center font-extrabold text-indigo-950 bg-indigo-50/60">
                          {(row.jumlahSiswa || 0).toLocaleString('id-ID')} Siswa
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

