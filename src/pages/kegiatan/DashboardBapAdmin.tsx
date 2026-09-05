import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Calendar,
  ChevronLeft,
  Layers,
  X
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

  // Workspace tab: 'cabang' | 'template' | 'ranking'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'cabang' | 'template' | 'ranking'>('cabang');

  // Pagination for Cabang table
  const [cabangPage, setCabangPage] = useState(1);
  const CABANG_PER_PAGE = 8;

  const [syncSuccess, setSyncSuccess] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ['kegiatan', 'stats', selectedTemplateFilter, user?.scope],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/stats', {
        params: { templateId: selectedTemplateFilter || undefined }
      });
      return res.data;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => (await apiClient.post('/kegiatan/stats/sync', null, {
      params: { templateId: selectedTemplateFilter || undefined }
    })).data,
    onSuccess: () => {
      setSyncSuccess(true);
      refetch();
      setTimeout(() => setSyncSuccess(false), 3000);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal sinkronisasi data kegiatan');
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col justify-center items-center gap-3 shadow-xs">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-600">Memuat Dashboard Infografik BAP Kegiatan...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center flex flex-col items-center gap-2.5 shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="font-extrabold text-sm">Gagal memuat statistik dashboard BAP.</p>
        <button
          onClick={() => refetch()}
          className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
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
  const filteredTemplates = (charts.byTemplate || []).filter(t => {
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

  // Pagination Cabang
  const totalCabangPages = Math.max(1, Math.ceil(filteredCabangList.length / CABANG_PER_PAGE));
  const safeCabangPage = Math.min(cabangPage, totalCabangPages);
  const paginatedCabangList = filteredCabangList.slice(
    (safeCabangPage - 1) * CABANG_PER_PAGE,
    safeCabangPage * CABANG_PER_PAGE
  );

  // Handlers with page reset
  const handleCabangSearch = (val: string) => {
    setCabangSearchTerm(val);
    setCabangPage(1);
  };
  const handleWilayahFilter = (val: string) => {
    setSelectedWilayahFilter(val);
    setCabangPage(1);
  };
  const handleLembagaFilter = (val: string) => {
    setSelectedLembagaFilter(val);
    setCabangPage(1);
  };
  const handleStatusFilter = (val: string) => {
    setSelectedStatusFilter(val);
    setCabangPage(1);
  };
  const handleResetCabangFilters = () => {
    setCabangSearchTerm('');
    setSelectedWilayahFilter('');
    setSelectedLembagaFilter('');
    setSelectedStatusFilter('');
    setCabangPage(1);
  };

  const selectWilayahAndJump = (wilId: string) => {
    if (selectedWilayahFilter === wilId) {
      setSelectedWilayahFilter('');
    } else {
      setSelectedWilayahFilter(wilId);
      setSelectedLembagaFilter('');
    }
    setActiveWorkspaceTab('cabang');
    setCabangPage(1);
    const el = document.getElementById('workspace-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const selectLembagaAndJump = (lemId: string) => {
    if (selectedLembagaFilter === lemId) {
      setSelectedLembagaFilter('');
    } else {
      setSelectedLembagaFilter(lemId);
      setSelectedWilayahFilter('');
    }
    setActiveWorkspaceTab('cabang');
    setCabangPage(1);
    const el = document.getElementById('workspace-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const hasActiveCabangFilters = Boolean(
    cabangSearchTerm || selectedWilayahFilter || selectedLembagaFilter || selectedStatusFilter
  );

  // Calculate Donut Infographic Angles
  const totalBapOrOne = summary.totalBapSubmitted || 1;
  const confirmedPercent = Math.round((summary.totalBapConfirmed / totalBapOrOne) * 100);
  const pendingPercent = Math.round((summary.totalBapPending / totalBapOrOne) * 100);

  // Header Title
  const headerTitle = isCabangScope
    ? `Monitoring BAP Kegiatan - ${userCabangName || 'Cabang'}`
    : isWilayahScope
    ? `Monitoring BAP Kegiatan - Wilayah ${userWilayahName || ''}`
    : isAuditorScope
    ? `Executive Audit & Monitoring BAP Pusat`
    : 'Executive Dashboard BAP Kegiatan';

  const headerDesc = isCabangScope
    ? `Status pengiriman, kelengkapan berkas, dan verifikasi pelaporan BAP kegiatan ${userCabangName || 'cabang Anda'}.`
    : isWilayahScope
    ? `Progres data pelaporan BAP kegiatan cabang-cabang binaan Wilayah ${userWilayahName || ''}.`
    : 'Kepatuhan pelaporan BAP nasional, jangkauan santri & guru, serta matriks verifikasi real-time.';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. EXECUTIVE HEADER BANNER (Compact Enterprise) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl px-5 py-3.5 text-white shadow-sm relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
                  {isCabangScope ? 'Cabang Panel' : isWilayahScope ? 'Wilayah Executive' : 'Enterprise Monitoring'}
                </span>
                {activeTemplateObj && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-300" />
                    {activeTemplateObj.judul}
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                {headerTitle}
              </h1>
              <p className="text-[11px] text-slate-400 font-normal line-clamp-1 max-w-xl">
                {headerDesc}
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <select
              value={selectedTemplateFilter}
              onChange={e => setSelectedTemplateFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 text-slate-100 rounded-xl font-semibold text-xs border border-slate-700 focus:ring-1 focus:ring-indigo-400 focus:outline-none cursor-pointer max-w-[220px] sm:max-w-[260px] truncate"
            >
              <option value="">Semua Template BAP (Agregat)</option>
              {templatesOptions.map(tmpl => {
                const dateStr = tmpl.tanggalKegiatan
                  ? new Date(tmpl.tanggalKegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : tmpl.deadline
                  ? new Date(tmpl.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : '-';
                return (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.judul} ({dateStr})
                  </option>
                );
              })}
            </select>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              title="Segarkan Data"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>

            {isGlobalScope && (
              <button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                title="Hitung ulang data rekap kegiatan dari sumber data terbaru"
                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer border border-indigo-500/50 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Menyinkronkan...' : syncSuccess ? 'Data Diperbarui' : 'Sync Data'}
              </button>
            )}

            {isGlobalScope && (
              <button
                onClick={() => navigate('/dashboard/kegiatan/templates')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-500/50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Template</span>
              </button>
            )}

            {isCabangScope && (
              <>
                <button
                  onClick={() => navigate('/dashboard/kegiatan/buat')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat BAP</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard/kegiatan')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Daftar BAP</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. HIGH-DENSITY 4-KPI METRIC STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total BAP */}
        <div className="bg-white border border-slate-200/85 rounded-xl p-3 shadow-2xs hover:border-indigo-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              {isCabangScope ? 'BAP Terkirim' : isWilayahScope ? 'BAP Wilayah' : 'Laporan BAP'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalBapSubmitted}</div>
            <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {summary.completionRate}% Rate
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Target {summary.totalTemplates} Template Kegiatan
          </div>
        </div>

        {/* Card 2: Diterima Pusat */}
        <div className="bg-white border border-slate-200/85 rounded-xl p-3 shadow-2xs hover:border-emerald-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">Diterima Pusat</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">{summary.totalBapConfirmed}</div>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {confirmedPercent}% Verified
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Disetujui & diverifikasi Pusat
          </div>
        </div>

        {/* Card 3: Menunggu Review */}
        <div className="bg-white border border-slate-200/85 rounded-xl p-3 shadow-2xs hover:border-amber-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">Menunggu Review</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-600 tracking-tight">{summary.totalBapPending}</div>
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              {pendingPercent}% Antrean
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Perlu konfirmasi admin pusat
          </div>
        </div>

        {/* Card 4: Partisipasi Peserta */}
        <div className="bg-white border border-slate-200/85 rounded-xl p-3 shadow-2xs hover:border-blue-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">Partisipasi Peserta</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalPesertaTerjangkau.toLocaleString('id-ID')}</div>
            <span className="text-[10px] font-bold text-slate-500">Jiwa</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between">
            <span>Santri: <b className="text-slate-800">{summary.totalSantriTerjangkau.toLocaleString('id-ID')}</b></span>
            <span>Guru: <b className="text-slate-800">{summary.totalGuruTerjangkau.toLocaleString('id-ID')}</b></span>
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE DUAL-PANE OVERVIEW (Hidden for CABANG scope) */}
      {!isCabangScope && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* PANE A: Distribusi Kepatuhan Pemantauan (Wilayah vs Lembaga Switcher) (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    {viewGroupingMode === 'wilayah' ? <MapPin className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-tight">
                      Pemantauan per {viewGroupingMode === 'wilayah' ? 'Wilayah' : 'Lembaga Muadalah'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {viewGroupingMode === 'wilayah'
                        ? 'Distribusi tingkat kepatuhan BAP seluruh wilayah'
                        : 'Kepatuhan per Lembaga Muadalah (Multi-lembaga dihitung di tiap lembaga)'}
                    </p>
                  </div>
                </div>

                {/* Segmented Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewGroupingMode('wilayah')}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      viewGroupingMode === 'wilayah'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    Wilayah ({charts.byWilayah?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewGroupingMode('lembaga')}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      viewGroupingMode === 'lembaga'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Building className="w-3 h-3" />
                    Lembaga ({charts.byLembaga?.length || 0})
                  </button>
                </div>
              </div>

              {/* WILAYAH CARDS GRID */}
              {viewGroupingMode === 'wilayah' && (
                (!charts.byWilayah || charts.byWilayah.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">Belum ada data wilayah.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {charts.byWilayah.map(wil => {
                      const isSelected = selectedWilayahFilter === wil.wilayahId;
                      return (
                        <div
                          key={wil.wilayahId}
                          className={`border rounded-lg p-2.5 transition-all text-xs flex flex-col justify-between ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                              : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 text-xs block truncate" title={wil.wilayahName}>
                                {wil.wilayahName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {wil.activeCabangCount}/{wil.totalCabang} Cabang Aktif
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold text-indigo-700 bg-white border border-indigo-100 px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                              {wil.completionRate}%
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${wil.completionRate}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>{wil.totalBapSubmitted} Disubmit ({wil.totalBapConfirmed} Verif)</span>
                              <button
                                type="button"
                                onClick={() => selectWilayahAndJump(wil.wilayahId)}
                                className={`font-bold hover:underline cursor-pointer ${
                                  isSelected ? 'text-indigo-800 underline' : 'text-indigo-600'
                                }`}
                              >
                                {isSelected ? 'Sedang Difilter' : 'Filter Cabang'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* LEMBAGA MUADALAH CARDS GRID */}
              {viewGroupingMode === 'lembaga' && (
                (!charts.byLembaga || charts.byLembaga.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">Belum ada data lembaga muadalah.</div>
                ) : (
                  <div>
                    <div className="text-[10px] text-indigo-700 bg-indigo-50/80 border border-indigo-100 rounded-md px-2.5 py-1 mb-2">
                      💡 <strong>Aturan Multi-Lembaga:</strong> Cabang yang memiliki jenjang Wustha dan Ulya dihitung di masing-masing Lembaga Muadalah terkait.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                      {charts.byLembaga.map(lem => {
                        const isSelected = selectedLembagaFilter === lem.lembagaId;
                        return (
                          <div
                            key={lem.lembagaId}
                            className={`border rounded-lg p-2.5 transition-all text-xs flex flex-col justify-between ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-400 shadow-2xs'
                                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-extrabold text-slate-900 text-xs block truncate" title={lem.lembagaName}>
                                    {lem.lembagaName}
                                  </span>
                                  {lem.jenjang && (
                                    <span className="text-[9px] font-bold px-1 rounded bg-indigo-100 text-indigo-800 uppercase">
                                      {lem.jenjang}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {lem.activeCabangCount}/{lem.totalCabang} Cabang Terafiliasi
                                </span>
                              </div>
                              <span className="text-[10px] font-extrabold text-indigo-700 bg-white border border-indigo-100 px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                                {lem.completionRate}%
                              </span>
                            </div>

                            <div className="mt-2 space-y-1">
                              <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${lem.completionRate}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>{lem.totalBapSubmitted} Disubmit ({lem.totalBapConfirmed} Verif)</span>
                                <button
                                  type="button"
                                  onClick={() => selectLembagaAndJump(lem.lembagaId)}
                                  className={`font-bold hover:underline cursor-pointer ${
                                    isSelected ? 'text-indigo-800 underline' : 'text-indigo-600'
                                  }`}
                                >
                                  {isSelected ? 'Sedang Difilter' : 'Filter Cabang'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Klik &quot;Filter Cabang&quot; untuk memfilter matriks cabang di bawah secara instan.</span>
              {hasActiveCabangFilters && (
                <button
                  type="button"
                  onClick={handleResetCabangFilters}
                  className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Reset Filter Aktif
                </button>
              )}
            </div>
          </div>

          {/* PANE B: Status Verifikasi & Top Kategori (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
            {/* Donut Status */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-indigo-600" />
                  Status Verifikasi BAP
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {summary.totalBapSubmitted} Total BAP
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Donut Visual */}
                <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-700"
                      strokeDasharray={`${confirmedPercent}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-amber-500 transition-all duration-700"
                      strokeDasharray={`${pendingPercent}, 100`}
                      strokeDashoffset={`-${confirmedPercent}`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs font-black text-slate-900">{confirmedPercent}%</span>
                    <span className="text-[8px] font-bold text-slate-400">Verif</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-2.5 py-1 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Diterima Pusat
                    </span>
                    <span className="font-black text-emerald-800 text-[11px]">{summary.totalBapConfirmed}</span>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Menunggu Review
                    </span>
                    <span className="font-black text-amber-800 text-[11px]">{summary.totalBapPending}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Belum Lapor
                    </span>
                    <span className="font-black text-slate-700 text-[11px]">{charts.byStatus?.expectedMissing || 0} Cbg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Top Kategori Kegiatan */}
            <div className="border-t border-slate-100 pt-2.5 mt-2.5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  Kategori Kegiatan
                </h4>
                {isGlobalScope && (
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/kegiatan/jenis')}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    Kelola <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {(charts.byJenis || []).slice(0, 3).map(jenis => {
                  const maxVal = Math.max(...(charts.byJenis || []).map(j => j.bapCount), 1);
                  const barWidth = Math.min(100, Math.round((jenis.bapCount / maxVal) * 100));

                  return (
                    <div key={jenis.id} className="space-y-0.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-700 truncate max-w-[150px]">{jenis.jenisName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-600">{jenis.bapCount} BAP</span>
                          <span className="font-extrabold text-emerald-700 text-[9px] bg-emerald-50 px-1 rounded">
                            {jenis.confirmedCount} V
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. UNIFIED ENTERPRISE WORKSPACE (TABBED SECTION) */}
      <div id="workspace-section" className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        {/* Workspace Tab Header */}
        <div className="border-b border-slate-200 px-4 pt-2.5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('cabang')}
              className={`px-3 py-2 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeWorkspaceTab === 'cabang'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Progres Cabang
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {filteredCabangList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('template')}
              className={`px-3 py-2 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                activeWorkspaceTab === 'template'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Rekapitulasi Template
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                {filteredTemplates.length}
              </span>
            </button>

            {!isCabangScope && (
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('ranking')}
                className={`px-3 py-2 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeWorkspaceTab === 'ranking'
                    ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Top 10 Cabang
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-400 font-medium pb-2 sm:pb-0">
            {activeWorkspaceTab === 'cabang' && `Halaman ${safeCabangPage} dari ${totalCabangPages}`}
          </div>
        </div>

        {/* TAB 1 CONTENT: PROGRES CABANG */}
        {activeWorkspaceTab === 'cabang' && (
          <div>
            {/* Filter Toolbar */}
            <div className="p-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari cabang / wilayah..."
                    value={cabangSearchTerm}
                    onChange={e => handleCabangSearch(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-44 sm:w-56 font-medium"
                  />
                </div>

                {!isCabangScope && (
                  <>
                    <select
                      value={selectedWilayahFilter}
                      onChange={e => handleWilayahFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="">Semua Wilayah</option>
                      {(charts.byWilayah || []).map(w => (
                        <option key={w.wilayahId} value={w.wilayahId}>{w.wilayahName}</option>
                      ))}
                    </select>

                    <select
                      value={selectedLembagaFilter}
                      onChange={e => handleLembagaFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 cursor-pointer max-w-[200px] truncate"
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
                  onChange={e => handleStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  <option value="SELESAI">Selesai 100%</option>
                  <option value="SEBAGIAN">Sebagian Lapor</option>
                  <option value="BELUM_ADA">Belum Ada BAP</option>
                </select>

                {hasActiveCabangFilters && (
                  <button
                    type="button"
                    onClick={handleResetCabangFilters}
                    className="px-2 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50/80 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Cabang & Lembaga</th>
                    <th className="px-3 py-2.5">Wilayah</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-center">Progres %</th>
                    <th className="px-3 py-2.5 text-center">BAP Disubmit / Verified</th>
                    <th className="px-3 py-2.5 text-center">Partisipasi Peserta</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCabangList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                        Tidak ada data cabang yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedCabangList.map(cab => {
                      return (
                        <tr key={cab.cabangId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-extrabold text-slate-900 block text-xs">{cab.cabangName}</span>
                            {cab.lembagaList && cab.lembagaList.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {cab.lembagaList.map(lem => (
                                  <span
                                    key={lem.id}
                                    className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    title={lem.name}
                                  >
                                    {lem.jenjang || lem.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-2.5 text-slate-600 font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {cab.wilayahName}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {cab.status === 'SELESAI' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai 100%
                              </span>
                            ) : cab.status === 'SEBAGIAN' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                <Clock className="w-3 h-3 text-indigo-600" /> Sebagian
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <XCircle className="w-3 h-3 text-slate-400" /> Belum Lapor
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-2.5 text-center w-28">
                            <div className="space-y-1">
                              <span className="text-[11px] font-black text-slate-800">{cab.completionRate}%</span>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    cab.completionRate >= 100 ? 'bg-emerald-500' : cab.completionRate > 0 ? 'bg-indigo-600' : 'bg-slate-200'
                                  }`}
                                  style={{ width: `${cab.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <span className="font-bold text-slate-900">{cab.totalBapSubmitted} BAP</span>
                            <span className="block text-[10px] text-emerald-700 font-extrabold">({cab.totalBapConfirmed} Verified)</span>
                          </td>

                          <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                            <span className="font-black text-slate-900">{cab.totalPeserta.toLocaleString('id-ID')}</span>
                            <span className="block text-[10px] text-slate-400">
                              {cab.totalSantri.toLocaleString('id-ID')} S | {cab.totalGuru.toLocaleString('id-ID')} G
                            </span>
                          </td>

                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const params = new URLSearchParams();
                                if (cab.cabangName) params.set('cabang', cab.cabangName);
                                if (cab.cabangId) params.set('cabangId', cab.cabangId);
                                if (selectedTemplateFilter) params.set('templateId', selectedTemplateFilter);
                                navigate(`/dashboard/kegiatan?${params.toString()}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
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

            {/* Pagination Controls */}
            {totalCabangPages > 1 && (
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-500">
                  Menampilkan <strong>{(safeCabangPage - 1) * CABANG_PER_PAGE + 1}</strong> - <strong>{Math.min(safeCabangPage * CABANG_PER_PAGE, filteredCabangList.length)}</strong> dari <strong>{filteredCabangList.length}</strong> Cabang
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safeCabangPage <= 1}
                    onClick={() => setCabangPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalCabangPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      // Display first, last, and around current page
                      if (
                        pageNum === 1 ||
                        pageNum === totalCabangPages ||
                        (pageNum >= safeCabangPage - 1 && pageNum <= safeCabangPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCabangPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              safeCabangPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (
                        pageNum === safeCabangPage - 2 ||
                        pageNum === safeCabangPage + 2
                      ) {
                        return <span key={pageNum} className="text-slate-400 text-xs px-0.5">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={safeCabangPage >= totalCabangPages}
                    onClick={() => setCabangPage(p => Math.min(totalCabangPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2 CONTENT: REKAPITULASI TEMPLATE */}
        {activeWorkspaceTab === 'template' && (
          <div>
            {/* Filter Toolbar */}
            <div className="p-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari judul template kegiatan..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-48 sm:w-64 font-medium"
                  />
                </div>

                <select
                  value={selectedJenis}
                  onChange={e => setSelectedJenis(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 cursor-pointer"
                >
                  <option value="">Semua Kategori</option>
                  {(charts.byJenis || []).map(j => (
                    <option key={j.id} value={j.jenisName}>{j.jenisName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50/80 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Nama Template & Kategori</th>
                    <th className="px-3 py-2.5">Batas Pelaksanaan</th>
                    <th className="px-3 py-2.5 text-center">
                      {isCabangScope ? 'Status Laporan' : 'Cabang Melaporkan'}
                    </th>
                    <th className="px-3 py-2.5 text-center">Diterima Pusat</th>
                    <th className="px-3 py-2.5 text-center">Jangkauan Santri & Guru</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                        Tidak ada template kegiatan yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map(tmpl => {
                      return (
                        <tr key={tmpl.templateId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 mb-0.5">
                              {tmpl.jenisNama}
                            </span>
                            <span className="font-extrabold text-slate-900 block text-xs">{tmpl.judul}</span>
                          </td>

                          <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(tmpl.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>

                          <td className="px-3 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-[11px]">
                              <Building className="w-3 h-3 text-slate-400" />
                              {tmpl.totalReported} {isCabangScope ? 'BAP' : 'Cabang'}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center font-bold text-emerald-600 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 font-extrabold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {tmpl.totalConfirmed} Verified
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                            <span className="font-black text-slate-900">{(tmpl.totalSantri + tmpl.totalGuru).toLocaleString('id-ID')}</span>
                            <span className="block text-[10px] text-slate-400">
                              {tmpl.totalSantri.toLocaleString('id-ID')} S | {tmpl.totalGuru.toLocaleString('id-ID')} G
                            </span>
                          </td>

                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            {isCabangScope ? (
                              <button
                                onClick={() => navigate('/dashboard/kegiatan/buat', { state: { templateId: tmpl.templateId } })}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Buat BAP
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const params = new URLSearchParams();
                                  if (tmpl.templateId) params.set('templateId', tmpl.templateId);
                                  navigate(`/dashboard/kegiatan?${params.toString()}`);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
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
        )}

        {/* TAB 3 CONTENT: TOP 10 CABANG TERAKTIF */}
        {activeWorkspaceTab === 'ranking' && !isCabangScope && (
          <div className="p-3.5">
            <div className="mb-3">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Peringkat 10 Cabang Paling Aktif Melaporkan BAP
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Urutan cabang berdasarkan akumulasi laporan BAP yang berhasil diverifikasi dan total peserta.
              </p>
            </div>

            {(charts.topCabang || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Belum ada data pelaporan cabang.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {(charts.topCabang || []).map((cabang, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1.5 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`w-5 h-5 rounded-full font-black text-[10px] flex items-center justify-center ${
                        idx === 0 ? 'bg-amber-400 text-slate-950 shadow-2xs' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded shadow-2xs border border-indigo-100">
                        {cabang.totalBap} BAP
                      </span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs truncate" title={cabang.cabangName}>
                      {cabang.cabangName}
                    </h5>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{cabang.totalPeserta.toLocaleString('id-ID')} Peserta</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

