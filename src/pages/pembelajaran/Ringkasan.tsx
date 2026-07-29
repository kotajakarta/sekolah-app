import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  Loader2, AlertCircle, Building2, CheckCircle2, Users, BookOpen,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  BarChart3, Shield, AlertTriangle, Layers, GraduationCap, Activity
} from 'lucide-react';

interface WeekCell {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR' | null;
  guruNames: string[];
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
  return { year: y, month: m };
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

const CELL_STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  COMPLETED: { label: 'Terlaksana', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PENDING:   { label: 'Belum',      bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  LIBUR:     { label: 'Libur',      bg: 'bg-sky-50',     text: 'text-sky-700',      dot: 'bg-sky-400' }
};
const cellMeta = (s: WeekCell['status']) =>
  s ? CELL_STATUS_META[s] : { label: '—', bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-300' };

// ── Circular Progress (SVG) ──

function CircularProgress({ value, size = 80, stroke = 7, color = '#2563eb', trackColor = '#e2e8f0', label, sublabel }: {
  value: number; size?: number; stroke?: number; color?: string; trackColor?: string; label?: string; sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(value, 100) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-extrabold" style={{ color }}>{value}%</span>
      </div>
      {label && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{label}</span>}
      {sublabel && <span className="text-[10px] text-gray-400">{sublabel}</span>}
    </div>
  );
}

// ── Animated Counter ──

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const dur = 800;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display.toLocaleString('id-ID')}{suffix}</>;
}

// ── Main Component ──

export default function Ringkasan() {
  const [monthFilter, setMonthFilter] = useState(currentMonthValue());
  const [kelasFilter, setKelasFilter] = useState('');

  const { data, isLoading, isError } = useQuery<RingkasanResponse>({
    queryKey: ['pembelajaran-ringkasan', monthFilter, kelasFilter],
    queryFn: async () => (await apiClient.get('/pembelajaran/ringkasan', { params: { month: monthFilter, kelasId: kelasFilter || undefined } })).data
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          </div>
          <span className="text-sm font-medium text-gray-400">Memuat dashboard…</span>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center flex flex-col items-center gap-2 max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-semibold">Gagal memuat dashboard</p>
          <p className="text-xs text-red-500">Pastikan server berjalan dan coba lagi.</p>
        </div>
      </div>
    );
  }

  // ── Empty State ──
  if (!data.tahunAjaran || !data.semester) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center max-w-md">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">Tahun Ajaran Belum Diatur</p>
          <p className="text-xs text-gray-400 mt-1">Atur tahun ajaran & semester aktif di menu Pengaturan Akademik terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  const { optimal, sesuaiJalur, berisiko } = data.statusDistribution;
  const distTotal = optimal + sesuaiJalur + berisiko;
  const weekCount = data.pemantauanMingguan[0]?.weeks.length || 0;

  const deltaIcon = data.kehadiranDelta > 0 ? TrendingUp : data.kehadiranDelta < 0 ? TrendingDown : Minus;
  const DeltaIcon = deltaIcon;
  const deltaCls = data.kehadiranDelta > 0 ? 'text-emerald-600' : data.kehadiranDelta < 0 ? 'text-rose-600' : 'text-gray-400';
  const deltaLabel = data.kehadiranDelta > 0 ? `+${data.kehadiranDelta}%` : data.kehadiranDelta < 0 ? `${data.kehadiranDelta}%` : '0%';

  return (
    <div className="font-sans text-gray-900 pb-12 space-y-5" style={{ animation: 'fadeSlideIn .4s ease-out both' }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes growWidth { from { width:0; } }
        @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:.7} }
        .card-hover { transition: all .2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,.08); }
        .stat-card { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); }
        .glass-header { background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%); }
        .weekly-header { background: linear-gradient(135deg, #1e293b 0%, #1e3a5f 100%); }
      `}</style>

      {/* ═══════════════════ HERO HEADER ═══════════════════ */}
      <div className="glass-header rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-4 right-8 w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
        <div className="absolute bottom-6 right-24 w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" style={{ animationDelay: '.5s' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">Dashboard Kontrol Pembelajaran</h1>
            </div>
            <p className="text-blue-200 text-xs sm:text-sm font-medium">
              Monitoring real-time kurikulum & ketercapaian — {data.semester} {data.tahunAjaran}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Month navigator */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur rounded-xl px-1 py-1">
              <button
                onClick={() => setMonthFilter(shiftMonth(monthFilter, -1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-bold min-w-[120px] text-center">
                {formatMonthLabel(monthFilter)}
              </span>
              <button
                onClick={() => setMonthFilter(shiftMonth(monthFilter, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Kelas filter */}
            {data.kelasOptions.length > 0 && (
              <select
                value={kelasFilter}
                onChange={e => setKelasFilter(e.target.value)}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/30 max-w-[160px]"
              >
                <option value="" className="text-gray-900">Semua Kelas</option>
                {data.kelasOptions.map(k => <option key={k.id} value={k.id} className="text-gray-900">{k.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════ STAT CARDS ═══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Unit */}
        <div className="stat-card border border-gray-100 rounded-2xl p-4 card-hover relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-blue-50 -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{data.unitLabel}</span>
            </div>
            <div className="text-3xl font-extrabold text-gray-900">
              <AnimatedNumber value={data.breakdownTotal} />
            </div>
            <p className="text-[11px] font-semibold text-blue-600 mt-1.5 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Aktif Semester Ini
            </p>
          </div>
        </div>

        {/* Pelajaran Terlaksana */}
        <div className="stat-card border border-gray-100 rounded-2xl p-4 card-hover relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-50 -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terlaksana</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">
              <AnimatedNumber value={data.persenPelajaranTerlaksana} suffix="%" />
            </div>
            <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                style={{ width: `${data.persenPelajaranTerlaksana}%`, animation: 'growWidth .8s ease-out' }}
              />
            </div>
          </div>
        </div>

        {/* Berisiko */}
        <div className={`stat-card border rounded-2xl p-4 card-hover relative overflow-hidden ${berisiko > 0 ? 'border-rose-200 bg-gradient-to-br from-white to-rose-50/50' : 'border-gray-100'}`}>
          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 ${berisiko > 0 ? 'bg-rose-50' : 'bg-gray-50'}`} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${berisiko > 0 ? 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-200' : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-200'}`}>
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Berisiko</span>
            </div>
            <div className={`text-3xl font-extrabold ${berisiko > 0 ? 'text-rose-700' : 'text-gray-900'}`}>
              <AnimatedNumber value={berisiko} />
            </div>
            <p className={`text-[11px] font-semibold mt-1.5 ${berisiko > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {berisiko > 0 ? `${berisiko} ${data.unitLabel} perlu perhatian` : 'Semua dalam kondisi baik'}
            </p>
          </div>
        </div>

        {/* Kehadiran */}
        <div className="stat-card border border-gray-100 rounded-2xl p-4 card-hover relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-violet-50 -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-200">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kehadiran</span>
            </div>
            <div className="text-3xl font-extrabold text-violet-700">
              <AnimatedNumber value={data.persenKehadiran} suffix="%" />
            </div>
            <div className={`flex items-center gap-1 mt-1.5 ${deltaCls}`}>
              <DeltaIcon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">{deltaLabel}</span>
              <span className="text-[10px] text-gray-400 font-medium">vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* Progres Silabus */}
        <div className="stat-card border border-gray-100 rounded-2xl p-4 card-hover col-span-2 lg:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-amber-50 -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <CircularProgress value={data.persenSilabus} size={72} stroke={6} color="#d97706" trackColor="#fef3c7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progres Silabus</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                <span className="font-bold text-gray-800">{data.totalSilabusCompleted.toLocaleString('id-ID')}</span>
                {' / '}
                {data.totalSilabusTarget.toLocaleString('id-ID')} selesai
              </p>
              {data.belumMulai > 0 && (
                <p className="text-[10px] text-amber-600 font-semibold mt-1">
                  {data.belumMulai} kelas belum mulai
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ STATUS DISTRIBUTION ═══════════════════ */}
      {distTotal > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 card-hover" style={{ animation: 'fadeIn .5s ease-out .2s both' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-gray-800">Distribusi Status {data.unitLabel}</h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">{distTotal} total {data.unitLabel.toLowerCase()}</span>
          </div>

          {/* Stacked Bar */}
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-gray-100 mb-4" style={{ animation: 'fadeIn .6s ease-out .3s both' }}>
            {optimal > 0 && (
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${(optimal / distTotal) * 100}%` }}
                title={`Optimal: ${optimal}`}
              />
            )}
            {sesuaiJalur > 0 && (
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-700"
                style={{ width: `${(sesuaiJalur / distTotal) * 100}%` }}
                title={`Sesuai Jalur: ${sesuaiJalur}`}
              />
            )}
            {berisiko > 0 && (
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700"
                style={{ width: `${(berisiko / distTotal) * 100}%` }}
                title={`Berisiko: ${berisiko}`}
              />
            )}
          </div>

          {/* Legends */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 bg-emerald-50/60 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-emerald-700">{optimal}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Optimal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-blue-50/60 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-blue-700">{sesuaiJalur}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Sesuai Jalur</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-rose-50/60 rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-rose-700">{berisiko}</p>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Berisiko</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ KEHADIRAN + SILABUS DETAIL ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ animation: 'fadeIn .5s ease-out .3s both' }}>
        {/* Kehadiran Detail */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Kehadiran Rata-Rata</h3>
          </div>
          <div className="text-center py-3">
            <span className="text-4xl font-extrabold text-violet-700">{data.persenKehadiran}%</span>
            <div className={`flex items-center justify-center gap-1.5 mt-2 ${deltaCls}`}>
              <DeltaIcon className="w-4 h-4" />
              <span className="text-sm font-bold">{deltaLabel}</span>
              <span className="text-xs text-gray-400">dari bulan lalu</span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Hadir</span>
              <span className="font-bold text-emerald-600">{data.hadir.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Total Record</span>
              <span className="font-bold text-gray-700">{data.totalAbsensi.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Progres Silabus Detail */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Progres Silabus</h3>
          </div>
          <div className="flex justify-center py-2">
            <CircularProgress value={data.persenSilabus} size={100} stroke={8} color="#d97706" trackColor="#fef3c7" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Selesai</span>
              <span className="font-bold text-amber-600">{data.totalSilabusCompleted.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Target</span>
              <span className="font-bold text-gray-700">{data.totalSilabusTarget.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 card-hover">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Ringkasan Cepat</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
              <span className="text-xs font-medium text-gray-600">Total {data.unitLabel}</span>
              <span className="text-lg font-extrabold text-blue-700">{data.breakdownTotal}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
              <span className="text-xs font-medium text-gray-600">Pelajaran Terlaksana</span>
              <span className="text-lg font-extrabold text-emerald-700">{data.persenPelajaranTerlaksana}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl">
              <span className="text-xs font-medium text-gray-600">Belum Mulai</span>
              <span className={`text-lg font-extrabold ${data.belumMulai > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{data.belumMulai}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl">
              <span className="text-xs font-medium text-gray-600">Berisiko</span>
              <span className={`text-lg font-extrabold ${berisiko > 0 ? 'text-rose-600' : 'text-gray-400'}`}>{berisiko}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ PEMANTAUAN MINGGUAN ═══════════════════ */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden" style={{ animation: 'fadeIn .5s ease-out .4s both' }}>
        <div className="weekly-header px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pemantauan Mingguan</h3>
              <p className="text-[11px] text-blue-200 font-medium">{data.periodeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {Object.entries(CELL_STATUS_META).map(([key, meta]) => (
                <span key={key} className="flex items-center gap-1 text-[10px] text-blue-200 font-medium">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {data.pemantauanMingguan.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Belum ada data untuk periode ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar p-4">
            <div className="flex gap-4 min-w-max pb-2">
              {Array.from({ length: weekCount }).map((_, weekIdx) => (
                <div key={weekIdx} className="w-60 shrink-0 space-y-2.5" style={{ animation: `fadeIn .4s ease-out ${.1 * weekIdx}s both` }}>
                  {/* Week Header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl px-4 py-3 shadow-lg">
                    <p className="text-lg font-extrabold">Minggu {weekIdx + 1}</p>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      {data.weeksInfo?.[weekIdx]?.dateLabel || `Minggu ke-${weekIdx + 1}`}
                    </p>
                  </div>

                  {/* Mapel Cards */}
                  {data.pemantauanMingguan.map(mapel => {
                    const cell = mapel.weeks[weekIdx];
                    const meta = cellMeta(cell.status);
                    const guruLabel = cell.guruNames.length === 1
                      ? cell.guruNames[0]
                      : cell.guruNames.length > 1 ? `${cell.guruNames.length} pengajar` : null;

                    return (
                      <div
                        key={mapel.mataPelajaranId}
                        className="bg-white border border-gray-100 rounded-xl p-3.5 card-hover group"
                      >
                        {/* Title + Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-bold text-gray-800 truncate leading-tight">{mapel.mataPelajaranName}</p>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${meta.bg} ${meta.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </div>

                        {/* Guru */}
                        {guruLabel && (
                          <p className="text-[11px] text-gray-400 truncate mb-2 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 shrink-0" />
                            {guruLabel}
                          </p>
                        )}

                        {/* Attendance chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            H {cell.hadir}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            A {cell.alpa}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            I {cell.izin}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            S {cell.sakit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════ FOOTER NOTE ═══════════════════ */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Data diperbarui secara real-time dari input cabang · {data.semester} {data.tahunAjaran}</span>
      </div>
    </div>
  );
}
