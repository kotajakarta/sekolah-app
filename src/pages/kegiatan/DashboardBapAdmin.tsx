import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  FileText,
  CheckCircle2,
  Clock,
  Building,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Award,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Loader2,
  AlertCircle,
  FolderPlus,
  BookOpen,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface StatsSummary {
  totalTemplates: number;
  totalCabang: number;
  totalBapSubmitted: number;
  totalBapConfirmed: number;
  totalBapPending: number;
  totalSantriTerjangkau: number;
  totalGuruTerjangkau: number;
  totalPesertaTerjangkau: number;
  completionRate: number;
}

interface JenisStat {
  id: string;
  jenisName: string;
  templateCount: number;
  bapCount: number;
  confirmedCount: number;
}

interface TopCabangStat {
  cabangName: string;
  totalBap: number;
  totalPeserta: number;
}

interface TemplateStat {
  templateId: string;
  judul: string;
  jenisNama: string;
  deadline: string;
  totalReported: number;
  totalConfirmed: number;
  totalSantri: number;
  totalGuru: number;
}

interface WilayahStat {
  wilayahId: string;
  wilayahName: string;
  totalCabang: number;
  activeCabangCount: number;
  totalBapSubmitted: number;
  totalBapConfirmed: number;
  totalSantri: number;
  totalGuru: number;
  totalPeserta: number;
  completionRate: number;
}

interface CabangProgressStat {
  cabangId: string;
  cabangName: string;
  wilayahId: string;
  wilayahName: string;
  totalBapSubmitted: number;
  totalBapConfirmed: number;
  totalSantri: number;
  totalGuru: number;
  totalPeserta: number;
  completionRate: number;
  status: string; // SELESAI, SEBAGIAN, BELUM_ADA
}

interface DashboardData {
  summary: StatsSummary;
  charts: {
    byJenis: JenisStat[];
    topCabang: TopCabangStat[];
    byTemplate: TemplateStat[];
    byWilayah: WilayahStat[];
    byCabangProgress: CabangProgressStat[];
    byStatus: {
      confirmed: number;
      pending: number;
      expectedMissing: number;
    };
  };
}

export default function DashboardBapAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');

  // Search & Filter for Cabang Table
  const [cabangSearchTerm, setCabangSearchTerm] = useState('');
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ['kegiatan', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/stats');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Memuat Dashboard Infografik BAP Kegiatan...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="font-bold text-base">Gagal memuat statistik dashboard BAP.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { summary, charts } = data;

  // Filter templates
  const filteredTemplates = charts.byTemplate.filter(t => {
    const matchSearch = t.judul.toLowerCase().includes(searchTerm.toLowerCase()) || t.jenisNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis = selectedJenis ? t.jenisNama === selectedJenis : true;
    return matchSearch && matchJenis;
  });

  // Filter Cabang progress
  const filteredCabangList = (charts.byCabangProgress || []).filter(c => {
    const matchSearch = c.cabangName.toLowerCase().includes(cabangSearchTerm.toLowerCase()) || c.wilayahName.toLowerCase().includes(cabangSearchTerm.toLowerCase());
    const matchWilayah = selectedWilayahFilter ? c.wilayahId === selectedWilayahFilter : true;
    const matchStatus = selectedStatusFilter ? c.status === selectedStatusFilter : true;
    return matchSearch && matchWilayah && matchStatus;
  });

  // Calculate Donut Infographic Angles
  const totalBapOrOne = summary.totalBapSubmitted || 1;
  const confirmedPercent = Math.round((summary.totalBapConfirmed / totalBapOrOne) * 100);
  const pendingPercent = Math.round((summary.totalBapPending / totalBapOrOne) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <BarChart3 className="w-96 h-96 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Infografik & Analisis Real-Time
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Berita Acara Pelaksanaan (BAP)
            </h1>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              Pantau kepatuhan pelaporan BAP seluruh wilayah & cabang, jangkauan partisipasi santri & ustadz, serta status verifikasi laporan secara komprehensif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs border border-white/15 backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Segarkan Data
            </button>

            {user?.scope === 'GLOBAL' && (
              <>
                <button
                  onClick={() => navigate('/dashboard/kegiatan/templates')}
                  className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Buat Template Kegiatan
                </button>
                <button
                  onClick={() => navigate('/dashboard/kegiatan')}
                  className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Daftar BAP Laporan
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total BAP Reported */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Laporan BAP Masuk</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{summary.totalBapSubmitted}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Dari {summary.totalTemplates} Template Rilis</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{summary.completionRate}% Rate</span>
            </div>
          </div>
        </div>

        {/* Card 2: Diterima Pusat */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Diterima Pusat</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-600">{summary.totalBapConfirmed}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Disetujui Verifikasi</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{confirmedPercent}% Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* Card 3: Menunggu Verifikasi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menunggu Verifikasi</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-600">{summary.totalBapPending}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Perlu Review Pusat</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{pendingPercent}% Antrean</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Peserta Terjangkau */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Partisipasi Peserta</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{summary.totalPesertaTerjangkau.toLocaleString('id-ID')}</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Santri: <strong className="text-slate-800">{summary.totalSantriTerjangkau.toLocaleString('id-ID')}</strong></span>
              <span>Guru: <strong className="text-slate-800">{summary.totalGuruTerjangkau.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: PROGRES DATA MASUK PER WILAYAH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Progres Data BAP Masuk per Wilayah
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Ringkasan tingkat kepatuhan pelaporan BAP dan partisipasi peserta di tingkat Wilayah.</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
            {charts.byWilayah?.length || 0} Wilayah Terdaftar
          </span>
        </div>

        {(!charts.byWilayah || charts.byWilayah.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400">Belum ada data wilayah.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {charts.byWilayah.map(wil => (
              <div key={wil.wilayahId} className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-3 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      {wil.wilayahName}
                    </h4>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {wil.activeCabangCount} dari {wil.totalCabang} Cabang Aktif Lapor
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    {wil.completionRate}% Rate
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${wil.completionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                    <span>{wil.totalBapSubmitted} BAP Disubmit</span>
                    <span className="text-emerald-600 font-bold">{wil.totalBapConfirmed} Verified</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{wil.totalPeserta.toLocaleString('id-ID')}</strong> Peserta
                  </span>
                  <button
                    onClick={() => {
                      setSelectedWilayahFilter(wil.wilayahId);
                      const el = document.getElementById('tabel-progres-cabang');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Detail Cabang <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Infographics Row (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Distribusi Pelaporan per Jenis Kegiatan (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Distribusi Pelaporan per Jenis Kegiatan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Analisis jumlah template dan realisasi laporan BAP per kategori.</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {charts.byJenis.length} Kategori
              </span>
            </div>

            <div className="space-y-4">
              {charts.byJenis.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Belum ada data jenis kegiatan.</div>
              ) : (
                charts.byJenis.map(jenis => {
                  const maxVal = Math.max(...charts.byJenis.map(j => j.bapCount), 1);
                  const barWidthPercent = Math.min(100, Math.round((jenis.bapCount / maxVal) * 100));

                  return (
                    <div key={jenis.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          {jenis.jenisName}
                          <span className="text-[10px] text-slate-400 font-normal">({jenis.templateCount} Template)</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">{jenis.bapCount} Laporan</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                            {jenis.confirmedCount} Verified
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kategori terpopuler dihitung berdasarkan akumulasi BAP disubmit.</span>
            <button
              onClick={() => navigate('/dashboard/kegiatan/jenis')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              Kelola Jenis <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CHART 2: Infografik Status Verifikasi BAP (Donut Infographic) (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                Status Verifikasi Laporan BAP
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Proporsi persentase laporan BAP yang diterima vs belum dikonfirmasi.</p>
            </div>

            {/* Donut Infographic Visual */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Confirmed Segment (Emerald) */}
                  <path
                    className="text-emerald-500 transition-all duration-700"
                    strokeDasharray={`${confirmedPercent}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Pending Segment (Amber) */}
                  <path
                    className="text-amber-500 transition-all duration-700"
                    strokeDasharray={`${pendingPercent}, 100`}
                    strokeDashoffset={`-${confirmedPercent}`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900">{summary.totalBapSubmitted}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total BAP</span>
                </div>
              </div>

              {/* Legend & Percentages */}
              <div className="space-y-3 w-full sm:w-auto">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Diterima Pusat</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800">{summary.totalBapConfirmed} ({confirmedPercent}%)</span>
                </div>

                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Menunggu Verifikasi</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-800">{summary.totalBapPending} ({pendingPercent}%)</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Estimasi Belum Melaporkan</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-700">{charts.byStatus.expectedMissing} Cabang</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Verifikasi BAP diperbarui secara real-time dari data Pusat.</p>
          </div>
        </div>
      </div>

      {/* SECTION: TABEL MATRIKS DETAIL PROGRES PELAPORAN PER CABANG */}
      <div id="tabel-progres-cabang" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Matriks Progres Data Pelaporan per Cabang
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Daftar lengkap status penyelesaian BAP, persentase progress, dan total partisipan per Cabang.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari cabang / wilayah..."
                value={cabangSearchTerm}
                onChange={e => setCabangSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none w-48 sm:w-60"
              />
            </div>

            <select
              value={selectedWilayahFilter}
              onChange={e => setSelectedWilayahFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none bg-white"
            >
              <option value="">Semua Wilayah</option>
              {(charts.byWilayah || []).map(w => (
                <option key={w.wilayahId} value={w.wilayahId}>{w.wilayahName}</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none bg-white"
            >
              <option value="">Semua Status</option>
              <option value="SELESAI">Selesai 100%</option>
              <option value="SEBAGIAN">Sebagian Lapor</option>
              <option value="BELUM_ADA">Belum Ada BAP</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-6 py-3.5">Nama Cabang & Wilayah</th>
                <th className="px-6 py-3.5 text-center">Status Pelaporan</th>
                <th className="px-6 py-3.5 text-center">Progres %</th>
                <th className="px-6 py-3.5 text-center">BAP Disubmit / Verified</th>
                <th className="px-6 py-3.5 text-center">Partisipasi Peserta</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCabangList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada data cabang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredCabangList.map(cab => {
                  return (
                    <tr key={cab.cabangId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block text-sm">{cab.cabangName}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {cab.wilayahName}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {cab.status === 'SELESAI' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai 100%
                          </span>
                        ) : cab.status === 'SEBAGIAN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Clock className="w-3 h-3 text-indigo-600" /> Sebagian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" /> Belum Lapor
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                            <span>{cab.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cab.completionRate >= 100 ? 'bg-emerald-500' : cab.completionRate > 0 ? 'bg-indigo-600' : 'bg-slate-200'
                              }`}
                              style={{ width: `${cab.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        <div className="space-y-0.5">
                          <span>{cab.totalBapSubmitted} BAP Disubmit</span>
                          <span className="block text-[10px] text-emerald-600 font-semibold">({cab.totalBapConfirmed} Verified)</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-slate-600">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">{cab.totalPeserta.toLocaleString('id-ID')} Total</span>
                          <span className="block text-[10px] text-slate-400">
                            {cab.totalSantri.toLocaleString('id-ID')} Santri | {cab.totalGuru.toLocaleString('id-ID')} Guru
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/dashboard/kegiatan')}
                          className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          Lihat Laporan BAP
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHART 3: Top Cabang Teraktif (Performance Ranking) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Peringkat Top Cabang Teraktif Melaporkan BAP
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Urutan cabang berdasarkan akumulasi laporan BAP yang dikirim dan jumlah partisipan.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg self-start sm:self-auto">
            10 Cabang Teratas
          </span>
        </div>

        {charts.topCabang.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Belum ada data pelaporan cabang.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {charts.topCabang.map((cabang, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 rounded-full font-extrabold text-[11px] flex items-center justify-center ${
                    idx === 0 ? 'bg-amber-400 text-amber-950 shadow-sm' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-extrabold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-2xs border border-indigo-100">
                    {cabang.totalBap} BAP
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                  {cabang.cabangName}
                </h4>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{cabang.totalPeserta.toLocaleString('id-ID')} Total Peserta</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHART 4: Matriks Rekapitulasi per Template Kegiatan */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Matriks Kepatuhan & Rekapitulasi Template BAP
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Rincian status penyelesaian dan partisipasi peserta untuk setiap template kegiatan rilis Pusat.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul template..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none w-48 sm:w-64"
              />
            </div>

            <select
              value={selectedJenis}
              onChange={e => setSelectedJenis(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none bg-white"
            >
              <option value="">Semua Kategori</option>
              {charts.byJenis.map(j => (
                <option key={j.id} value={j.jenisName}>{j.jenisName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-6 py-3.5">Nama Template & Kategori</th>
                <th className="px-6 py-3.5">Deadline</th>
                <th className="px-6 py-3.5 text-center">Jumlah Cabang Melaporkan</th>
                <th className="px-6 py-3.5 text-center">Diterima Pusat</th>
                <th className="px-6 py-3.5 text-center">Jangkauan Santri & Guru</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada template kegiatan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map(tmpl => {
                  return (
                    <tr key={tmpl.templateId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 mb-1">
                          {tmpl.jenisNama}
                        </span>
                        <span className="font-bold text-slate-800 block text-sm">{tmpl.judul}</span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                        {new Date(tmpl.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {tmpl.totalReported} Cabang
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-emerald-600">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {tmpl.totalConfirmed} Verified
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center text-slate-600">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">{(tmpl.totalSantri + tmpl.totalGuru).toLocaleString('id-ID')} Total</span>
                          <span className="block text-[10px] text-slate-400">
                            {tmpl.totalSantri.toLocaleString('id-ID')} Santri | {tmpl.totalGuru.toLocaleString('id-ID')} Guru
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate('/dashboard/kegiatan')}
                          className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          Lihat Laporan BAP
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
