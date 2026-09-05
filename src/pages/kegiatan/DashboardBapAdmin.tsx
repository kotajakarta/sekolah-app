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
  XCircle,
  Calendar
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

interface LembagaStat {
  lembagaId: string;
  lembagaName: string;
  code: string;
  jenjang?: string | null;
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
  lembagaList?: { id: string; name: string; code: string; jenjang?: string | null }[];
  totalBapSubmitted: number;
  totalBapConfirmed: number;
  totalSantri: number;
  totalGuru: number;
  totalPeserta: number;
  completionRate: number;
  status: string; // SELESAI, SEBAGIAN, BELUM_ADA
}

interface TemplateOption {
  id: string;
  judul: string;
  tanggalKegiatan?: string | null;
  deadline?: string | null;
  jenis?: { nama: string };
}

interface DashboardData {
  summary: StatsSummary;
  userScope?: string;
  userWilayahName?: string | null;
  userCabangName?: string | null;
  templatesOptions?: TemplateOption[];
  charts: {
    byJenis: JenisStat[];
    topCabang: TopCabangStat[];
    byTemplate: TemplateStat[];
    byWilayah: WilayahStat[];
    byLembaga?: LembagaStat[];
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

  // Switcher grouping mode: 'wilayah' | 'lembaga'
  const [viewGroupingMode, setViewGroupingMode] = useState<'wilayah' | 'lembaga'>('wilayah');

  // Filter Spesifik BAP Template (Termasuk Tanggal Dilaksanakan)
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState('');

  // Search & Filter for Cabang Table
  const [cabangSearchTerm, setCabangSearchTerm] = useState('');
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState('');
  const [selectedLembagaFilter, setSelectedLembagaFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ['kegiatan', 'stats', selectedTemplateFilter, user?.scope],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/stats', {
        params: { templateId: selectedTemplateFilter || undefined }
      });
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col justify-center items-center gap-3 shadow-xs">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">Memuat Dashboard Infografik BAP Kegiatan...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-8 text-center flex flex-col items-center gap-3 shadow-xs">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="font-extrabold text-base">Gagal memuat statistik dashboard BAP.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { summary, charts, templatesOptions = [], userScope = user?.scope, userWilayahName, userCabangName } = data;

  const isCabangScope = userScope === 'CABANG';
  const isWilayahScope = userScope === 'WILAYAH';
  const isAuditorScope = userScope === 'AUDITOR';
  const isGlobalScope = userScope === 'GLOBAL' || (!isCabangScope && !isWilayahScope && !isAuditorScope);

  // Selected template item object
  const activeTemplateObj = templatesOptions.find(t => t.id === selectedTemplateFilter);

  // Filter templates list for bottom table
  const filteredTemplates = charts.byTemplate.filter(t => {
    const matchSearch = t.judul.toLowerCase().includes(searchTerm.toLowerCase()) || t.jenisNama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis = selectedJenis ? t.jenisNama === selectedJenis : true;
    return matchSearch && matchJenis;
  });

  // Filter Cabang progress
  const filteredCabangList = (charts.byCabangProgress || []).filter(c => {
    const matchSearch = c.cabangName.toLowerCase().includes(cabangSearchTerm.toLowerCase()) || c.wilayahName.toLowerCase().includes(cabangSearchTerm.toLowerCase());
    const matchWilayah = selectedWilayahFilter ? c.wilayahId === selectedWilayahFilter : true;
    const matchLembaga = selectedLembagaFilter ? c.lembagaList?.some(l => l.id === selectedLembagaFilter) : true;
    const matchStatus = selectedStatusFilter ? c.status === selectedStatusFilter : true;
    return matchSearch && matchWilayah && matchLembaga && matchStatus;
  });

  // Calculate Donut Infographic Angles
  const totalBapOrOne = summary.totalBapSubmitted || 1;
  const confirmedPercent = Math.round((summary.totalBapConfirmed / totalBapOrOne) * 100);
  const pendingPercent = Math.round((summary.totalBapPending / totalBapOrOne) * 100);

  // Header Title & Description
  const headerTitle = isCabangScope
    ? `Dashboard BAP Kegiatan - ${userCabangName || 'Cabang Anda'}`
    : isWilayahScope
    ? `Dashboard BAP Kegiatan - Wilayah ${userWilayahName || ''}`
    : isAuditorScope
    ? `Dashboard BAP Kegiatan - Audit & Inspeksi Pusat`
    : 'Dashboard Berita Acara Pelaksanaan (BAP)';

  const headerDesc = isCabangScope
    ? `Pantau status pengiriman, kelengkapan berkas, serta verifikasi laporan BAP kegiatan milik ${userCabangName || 'cabang Anda'} ke Pusat.`
    : isWilayahScope
    ? `Pantau progres data pelaporan BAP kegiatan dari cabang-cabang di bawah naungan ${userWilayahName || 'Wilayah Anda'}.`
    : isAuditorScope
    ? `Pengawasan & audit real-time tingkat nasional terhadap kepatuhan pelaporan BAP seluruh wilayah dan cabang.`
    : 'Pantau kepatuhan pelaporan BAP seluruh wilayah & cabang, jangkauan partisipasi santri & ustadz, serta status verifikasi laporan secara komprehensif.';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner - Sleek High-Contrast Design */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-700/40">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <BarChart3 className="w-96 h-96 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-indigo-500/25 border border-indigo-400/40 text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                {isCabangScope ? 'Panel Pelaporan BAP Cabang' : isWilayahScope ? 'Monitoring Wilayah Real-Time' : 'Infografik & Analisis Real-Time'}
              </span>
              {activeTemplateObj && (
                <span className="bg-amber-400 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  Filter: {activeTemplateObj.judul}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {headerTitle}
            </h1>
            <p className="text-sm text-indigo-100 font-normal leading-relaxed opacity-90">
              {headerDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Main Template Filter Dropdown in Header */}
            <div className="relative">
              <select
                value={selectedTemplateFilter}
                onChange={e => setSelectedTemplateFilter(e.target.value)}
                className="px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-md border-2 border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer max-w-xs truncate"
              >
                <option value="">Semua Template BAP (Agregat)</option>
                {templatesOptions.map(tmpl => {
                  const dateStr = tmpl.tanggalKegiatan
                    ? new Date(tmpl.tanggalKegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : tmpl.deadline
                    ? new Date(tmpl.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-';
                  return (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.judul} - ({dateStr})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-xs border border-white/30 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Segarkan Data
            </button>

            {isGlobalScope && (
              <button
                onClick={() => navigate('/dashboard/kegiatan/templates')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-indigo-400/50"
              >
                <Plus className="w-4 h-4" />
                Buat Template
              </button>
            )}

            {isCabangScope && (
              <>
                <button
                  onClick={() => navigate('/dashboard/kegiatan/buat')}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/50"
                >
                  <Plus className="w-4 h-4" />
                  Buat Laporan BAP
                </button>
                <button
                  onClick={() => navigate('/dashboard/kegiatan')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Daftar BAP Saya
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total BAP Reported */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isCabangScope ? 'BAP Terkirim Cabang' : isWilayahScope ? 'BAP Cabang se-Wilayah' : 'Laporan BAP Masuk'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{summary.totalBapSubmitted}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="font-medium text-slate-600">Dari {summary.totalTemplates} Template Target</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">{summary.completionRate}% Rate</span>
            </div>
          </div>
        </div>

        {/* Card 2: Diterima Pusat */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Diterima Pusat</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-600">{summary.totalBapConfirmed}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="font-medium text-slate-600">Disetujui Verifikasi</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">{confirmedPercent}% Verified</span>
            </div>
          </div>
        </div>

        {/* Card 3: Menunggu Verifikasi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isCabangScope ? 'Menunggu Review' : 'Menunggu Verifikasi'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-600">{summary.totalBapPending}</div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="font-medium text-slate-600">Perlu Review Pusat</span>
              <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">{pendingPercent}% Antrean</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Peserta Terjangkau */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isCabangScope ? 'Peserta Kegiatan Cabang' : isWilayahScope ? 'Partisipasi Peserta Wilayah' : 'Total Partisipasi Peserta'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{summary.totalPesertaTerjangkau.toLocaleString('id-ID')}</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Santri: <strong className="text-slate-900">{summary.totalSantriTerjangkau.toLocaleString('id-ID')}</strong></span>
              <span>Guru: <strong className="text-slate-900">{summary.totalGuruTerjangkau.toLocaleString('id-ID')}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: PROGRES DATA MASUK PER WILAYAH / LEMBAGA MUADALAH (Hidden for CABANG scope) */}
      {!isCabangScope && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                {viewGroupingMode === 'wilayah' ? (
                  <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                ) : (
                  <Building className="w-5 h-5 text-indigo-600 shrink-0" />
                )}
                Progres Data BAP Masuk per {viewGroupingMode === 'wilayah' ? 'Wilayah' : 'Lembaga Muadalah'}
                {activeTemplateObj && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    Filter: {activeTemplateObj.judul}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {viewGroupingMode === 'wilayah'
                  ? 'Ringkasan tingkat kepatuhan pelaporan BAP dan partisipasi peserta di tingkat Wilayah.'
                  : 'Ringkasan kepatuhan BAP per Lembaga Muadalah (Cabang terafiliasi multi-lembaga dihitung di masing-masing lembaga terkait).'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              {/* Segmented Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewGroupingMode('wilayah')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewGroupingMode === 'wilayah'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Wilayah
                </button>
                <button
                  type="button"
                  onClick={() => setViewGroupingMode('lembaga')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewGroupingMode === 'lembaga'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  Lembaga Muadalah
                </button>
              </div>

              <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                {viewGroupingMode === 'wilayah'
                  ? `${charts.byWilayah?.length || 0} Wilayah Terdaftar`
                  : `${charts.byLembaga?.length || 0} Lembaga Terdaftar`}
              </span>
            </div>
          </div>

          {/* MODE WILAYAH */}
          {viewGroupingMode === 'wilayah' && (
            (!charts.byWilayah || charts.byWilayah.length === 0) ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">Belum ada data wilayah.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {charts.byWilayah.map(wil => (
                  <div key={wil.wilayahId} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                          {wil.wilayahName}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                          {wil.activeCabangCount} dari {wil.totalCabang} Cabang Aktif Lapor
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-white bg-indigo-600 shadow-2xs px-2.5 py-1 rounded-xl shrink-0">
                        {wil.completionRate}% Rate
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${wil.completionRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold">
                        <span>{wil.totalBapSubmitted} BAP Disubmit</span>
                        <span className="text-emerald-600">{wil.totalBapConfirmed} Verified</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1 text-[11px] font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <strong className="text-slate-900">{wil.totalPeserta.toLocaleString('id-ID')}</strong> Peserta
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWilayahFilter(wil.wilayahId);
                          setSelectedLembagaFilter('');
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
            )
          )}

          {/* MODE LEMBAGA MUADALAH */}
          {viewGroupingMode === 'lembaga' && (
            (!charts.byLembaga || charts.byLembaga.length === 0) ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">Belum ada data lembaga muadalah.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {charts.byLembaga.map(lem => (
                  <div key={lem.lembagaId} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5 truncate">
                            <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                            {lem.lembagaName}
                          </h4>
                          {lem.jenjang && (
                            <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase">
                              {lem.jenjang}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                          {lem.activeCabangCount} dari {lem.totalCabang} Cabang Terafiliasi Aktif Lapor
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-white bg-indigo-600 shadow-2xs px-2.5 py-1 rounded-xl shrink-0">
                        {lem.completionRate}% Rate
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${lem.completionRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold">
                        <span>{lem.totalBapSubmitted} BAP Disubmit</span>
                        <span className="text-emerald-600">{lem.totalBapConfirmed} Verified</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1 text-[11px] font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <strong className="text-slate-900">{lem.totalPeserta.toLocaleString('id-ID')}</strong> Peserta
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLembagaFilter(lem.lembagaId);
                          setSelectedWilayahFilter('');
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
            )
          )}
        </div>
      )}

      {/* Main Infographics Row (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Distribusi Pelaporan per Jenis Kegiatan (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
                  Distribusi Pelaporan per Jenis Kegiatan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Analisis jumlah template dan realisasi laporan BAP per kategori.</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                {charts.byJenis.length} Kategori
              </span>
            </div>

            <div className="space-y-4">
              {charts.byJenis.length === 0 ? (
                <div className="p-8 text-center text-xs font-medium text-slate-400">Belum ada data jenis kegiatan.</div>
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
                          <span className="text-slate-600 font-semibold">{jenis.bapCount} Laporan</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
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

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kategori terpopuler dihitung berdasarkan akumulasi BAP disubmit.</span>
            {isGlobalScope && (
              <button
                onClick={() => navigate('/dashboard/kegiatan/jenis')}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                Kelola Jenis <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* CHART 2: Infografik Status Verifikasi BAP (Donut Infographic) (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600 shrink-0" />
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
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">Diterima Pusat</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800">{summary.totalBapConfirmed} ({confirmedPercent}%)</span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">Menunggu Verifikasi</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-800">{summary.totalBapPending} ({pendingPercent}%)</span>
                </div>

                {!isCabangScope && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800">Estimasi Belum Melaporkan</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">{charts.byStatus.expectedMissing} Cabang</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">Verifikasi BAP diperbarui secara real-time dari data Pusat.</p>
          </div>
        </div>
      </div>

      {/* SECTION: TABEL MATRIKS DETAIL PROGRES PELAPORAN PER CABANG */}
      <div id="tabel-progres-cabang" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600 shrink-0" />
              {isCabangScope ? 'Status Progres Pelaporan Cabang' : 'Matriks Progres Data Pelaporan per Cabang'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCabangScope ? 'Status penyelesaian pelaporan BAP cabang Anda terhadap seluruh template rilis Pusat.' : 'Daftar lengkap status penyelesaian BAP, persentase progress, dan total partisipan per Cabang.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Pilih Laporan BAP (Termasuk Tgl Dilaksanakan) */}
            <select
              value={selectedTemplateFilter}
              onChange={e => setSelectedTemplateFilter(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50 text-indigo-950 max-w-xs truncate cursor-pointer shadow-2xs"
            >
              <option value="">Semua Template BAP (Agregat)</option>
              {templatesOptions.map(tmpl => {
                const dateStr = tmpl.tanggalKegiatan
                  ? new Date(tmpl.tanggalKegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : tmpl.deadline
                  ? new Date(tmpl.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-';
                return (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.judul} - ({dateStr})
                  </option>
                );
              })}
            </select>

            {!isCabangScope && (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari cabang / wilayah..."
                    value={cabangSearchTerm}
                    onChange={e => setCabangSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none w-48 sm:w-56 font-medium"
                  />
                </div>

                {isGlobalScope && (
                  <>
                    <select
                      value={selectedWilayahFilter}
                      onChange={e => setSelectedWilayahFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none bg-white text-slate-800"
                    >
                      <option value="">Semua Wilayah</option>
                      {(charts.byWilayah || []).map(w => (
                        <option key={w.wilayahId} value={w.wilayahId}>{w.wilayahName}</option>
                      ))}
                    </select>

                    <select
                      value={selectedLembagaFilter}
                      onChange={e => setSelectedLembagaFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none bg-white text-slate-800"
                    >
                      <option value="">Semua Lembaga Muadalah</option>
                      {(charts.byLembaga || []).map(l => (
                        <option key={l.lembagaId} value={l.lembagaId}>
                          {l.lembagaName} {l.jenjang ? `(${l.jenjang})` : ''}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none bg-white text-slate-800"
                >
                  <option value="">Semua Status</option>
                  <option value="SELESAI">Selesai 100%</option>
                  <option value="SEBAGIAN">Sebagian Lapor</option>
                  <option value="BELUM_ADA">Belum Ada BAP</option>
                </select>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider">
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
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Tidak ada data cabang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredCabangList.map(cab => {
                  return (
                    <tr key={cab.cabangId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 block text-sm">{cab.cabangName}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {cab.wilayahName}
                          </span>
                          {cab.lembagaList && cab.lembagaList.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              {cab.lembagaList.map(lem => (
                                <span
                                  key={lem.id}
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  title={lem.name}
                                >
                                  {lem.jenjang || lem.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {cab.status === 'SELESAI' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Selesai 100%
                          </span>
                        ) : cab.status === 'SEBAGIAN' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-2xs">
                            <Clock className="w-3 h-3 text-indigo-600 shrink-0" /> Sebagian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <XCircle className="w-3 h-3 text-slate-400 shrink-0" /> Belum Lapor
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-800">
                            <span>{cab.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cab.completionRate >= 100 ? 'bg-emerald-500' : cab.completionRate > 0 ? 'bg-indigo-600' : 'bg-slate-200'
                              }`}
                              style={{ width: `${cab.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        <div className="space-y-0.5">
                          <span>{cab.totalBapSubmitted} BAP Disubmit</span>
                          <span className="block text-[10px] text-emerald-700 font-extrabold">({cab.totalBapConfirmed} Verified)</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-slate-600">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900">{cab.totalPeserta.toLocaleString('id-ID')} Total</span>
                          <span className="block text-[10px] text-slate-500 font-medium">
                            {cab.totalSantri.toLocaleString('id-ID')} Santri | {cab.totalGuru.toLocaleString('id-ID')} Guru
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const params = new URLSearchParams();
                            if (cab.cabangName) params.set('cabang', cab.cabangName);
                            if (cab.cabangId) params.set('cabangId', cab.cabangId);
                            if (selectedTemplateFilter) params.set('templateId', selectedTemplateFilter);
                            navigate(`/dashboard/kegiatan?${params.toString()}`);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          Lihat Laporan
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

      {/* CHART 3: Top Cabang Teraktif (Performance Ranking - Hidden for CABANG scope) */}
      {!isCabangScope && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600 shrink-0" />
                Peringkat Top Cabang Teraktif Melaporkan BAP
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Urutan cabang berdasarkan akumulasi laporan BAP yang dikirim dan jumlah partisipan.</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg self-start sm:self-auto">
              10 Cabang Teratas
            </span>
          </div>

          {charts.topCabang.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-400">Belum ada data pelaporan cabang.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {charts.topCabang.map((cabang, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-2 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-6 h-6 rounded-full font-extrabold text-[11px] flex items-center justify-center ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow-sm' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded-lg shadow-2xs border border-indigo-100">
                      {cabang.totalBap} BAP
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                    {cabang.cabangName}
                  </h4>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cabang.totalPeserta.toLocaleString('id-ID')} Total Peserta</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHART 4: Matriks Rekapitulasi per Template Kegiatan */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
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
                className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none w-48 sm:w-64 font-medium"
              />
            </div>

            <select
              value={selectedJenis}
              onChange={e => setSelectedJenis(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none bg-white text-slate-800"
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
            <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Nama Template & Kategori</th>
                <th className="px-6 py-3.5">Deadline</th>
                <th className="px-6 py-3.5 text-center">
                  {isCabangScope ? 'Status Laporan Cabang' : 'Jumlah Cabang Melaporkan'}
                </th>
                <th className="px-6 py-3.5 text-center">Diterima Pusat</th>
                <th className="px-6 py-3.5 text-center">Jangkauan Santri & Guru</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Tidak ada template kegiatan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map(tmpl => {
                  return (
                    <tr key={tmpl.templateId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 mb-1">
                          {tmpl.jenisNama}
                        </span>
                        <span className="font-extrabold text-slate-900 block text-sm">{tmpl.judul}</span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px] font-medium">
                        {new Date(tmpl.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {tmpl.totalReported} {isCabangScope ? 'BAP Terkirim' : 'Cabang'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-emerald-600">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-800 font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {tmpl.totalConfirmed} Verified
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center text-slate-600">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900">{(tmpl.totalSantri + tmpl.totalGuru).toLocaleString('id-ID')} Total</span>
                          <span className="block text-[10px] text-slate-500 font-medium">
                            {tmpl.totalSantri.toLocaleString('id-ID')} Santri | {tmpl.totalGuru.toLocaleString('id-ID')} Guru
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isCabangScope ? (
                          <button
                            onClick={() => navigate('/dashboard/kegiatan/buat', { state: { templateId: tmpl.templateId } })}
                            className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Buat BAP
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const params = new URLSearchParams();
                              if (tmpl.templateId) params.set('templateId', tmpl.templateId);
                              navigate(`/dashboard/kegiatan?${params.toString()}`);
                            }}
                            className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            Lihat Laporan
                          </button>
                        )}
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
