import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, LayoutDashboard, Loader2,
  Calendar, ChevronRight, Activity,
  CheckCircle2, AlertCircle, FileText, Filter, Pencil, ArrowUpRight,
  ShieldCheck, Phone, GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import Pagination from '../components/Pagination';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

interface DashboardStats {
  totalSantri: number;
  totalKelas: number;
  totalGuru?: number;
  rbacIdentity?: {
    operatorName: string;
    scope: string;
    wilayahName: string | null;
    cabangName: string | null;
    ketuaCabangName: string | null;
    ketuaCabangPhone: string | null;
    ketuaMuadalahName: string | null;
    ketuaMuadalahPhone: string | null;
  };
  cabangMissingSubjectsCount?: number;
  ketersediaanGuru?: {
    cabangId: string;
    cabangName: string;
    wilayahName: string;
    missingSubjects: string[];
    status: 'hijau' | 'kuning' | 'merah';
  }[];
  chartGrupDaimi: { name: string; value: number }[];
  chartKelas: { name: string; value: number }[];
  activities: { title: string; time: string; author: string }[];
  raporCetakProgress: {
    tahunAjaran: string;
    semester: string;
    sudahCetak: number;
    total: number;
    percent: number;
  } | null;
  kelengkapanSiswa?: { total: number; lengkap: number; percent: number; };
  kelengkapanGuru?: { total: number; lengkap: number; percent: number; };
  kelengkapanEntities?: { 
    name: string; 
    siswa: { total: number; lengkap: number; percent: number; }; 
    guru?: { total: number; lengkap: number; percent: number; }; 
  }[];
}

const getActivityIcon = (title: string) => {
  const t = title.toLowerCase();
  return (t.includes('nilai') || t.includes('rapor')) ? FileText : Pencil;
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters
  const [globalJenisRegion, setGlobalJenisRegion] = useState('wilayah');
  const [globalWilayah, setGlobalWilayah] = useState('');
  const [globalLembagaMuadalah, setGlobalLembagaMuadalah] = useState('');
  const [globalCabang, setGlobalCabang] = useState('');
  const [globalJenisKelamin, setGlobalJenisKelamin] = useState('');

  // Ketersediaan Guru Mapel Umum filter & pagination states
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState('');
  const [selectedCabangFilter, setSelectedCabangFilter] = useState('');
  const [kgPage, setKgPage] = useState(1);
  const kgLimit = 10;

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (globalJenisRegion === 'wilayah' && globalWilayah) params.append('wilayahId', globalWilayah);
        if (globalJenisRegion === 'lembaga' && globalLembagaMuadalah) params.append('lembagaMuadalahId', globalLembagaMuadalah);
        if (globalCabang) params.append('cabangId', globalCabang);
        if (globalJenisKelamin) params.append('jenisKelamin', globalJenisKelamin);

        const res = await apiClient.get<DashboardStats>(`/dashboard/stats?${params.toString()}`);
        setStatsData(res.data);
      } catch (err: any) {
        setError(t('common.failed') || 'Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [t, globalJenisRegion, globalWilayah, globalLembagaMuadalah, globalCabang, globalJenisKelamin]);

  // Fetch Master Data for global filters
  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL' && globalJenisRegion === 'wilayah'
  });

  const { data: muadalahs = [] } = useQuery({
    queryKey: ['master-data', 'lembaga-muadalah'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/muadalah');
      return res.data.filter((m: any) => m.isActive);
    },
    enabled: user?.scope === 'GLOBAL' && globalJenisRegion === 'lembaga'
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH'
  });

  const filteredBranches = useMemo(() => {
    if (user?.scope === 'WILAYAH') {
      return branches.filter((b: any) => b.wilayahId === user.wilayahId);
    }
    if (globalWilayah) {
      return branches.filter((b: any) => b.wilayahId === globalWilayah);
    }
    return branches;
  }, [branches, globalWilayah, user]);

  // Extract unique Wilayah options
  const wilayahOptions = useMemo(() => {
    if (!statsData?.ketersediaanGuru) return [];
    const set = new Set(statsData.ketersediaanGuru.map(k => k.wilayahName));
    return Array.from(set).sort();
  }, [statsData]);

  // Extract unique Cabang options (filtered by selectedWilayahFilter if any)
  const cabangOptions = useMemo(() => {
    if (!statsData?.ketersediaanGuru) return [];
    const items = selectedWilayahFilter
      ? statsData.ketersediaanGuru.filter(k => k.wilayahName === selectedWilayahFilter)
      : statsData.ketersediaanGuru;
    const set = new Set(items.map(k => k.cabangName));
    return Array.from(set).sort();
  }, [statsData, selectedWilayahFilter]);

  // Filtered ketersediaanGuru
  const filteredKetersediaanGuru = useMemo(() => {
    if (!statsData?.ketersediaanGuru) return [];
    return statsData.ketersediaanGuru.filter(cabang => {
      if (selectedWilayahFilter && cabang.wilayahName !== selectedWilayahFilter) return false;
      if (selectedCabangFilter && cabang.cabangName !== selectedCabangFilter) return false;
      return true;
    });
  }, [statsData, selectedWilayahFilter, selectedCabangFilter]);

  const totalKgPages = Math.ceil(filteredKetersediaanGuru.length / kgLimit) || 1;
  const paginatedKetersediaanGuru = useMemo(() => {
    return filteredKetersediaanGuru.slice((kgPage - 1) * kgLimit, kgPage * kgLimit);
  }, [filteredKetersediaanGuru, kgPage]);

  // Reset page when filters change
  useEffect(() => {
    setKgPage(1);
  }, [selectedWilayahFilter, selectedCabangFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh] font-mono text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand mr-2" />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="bg-rose-50 text-rose-700 p-3.5 rounded border border-rose-200 text-sm font-mono mt-6 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <span>{error || t('common.error_loading')}</span>
      </div>
    );
  }

  const quickLinks = [
    { label: t('dashboard.data_santri'), path: '/dashboard/core/siswa', icon: Users },
    { label: t('dashboard.kelas_formal'), path: '/dashboard/formal/kelas', icon: LayoutDashboard },
    { label: t('dashboard.kalender'), path: '/dashboard/settings/kalender', icon: Calendar },
    { label: t('dashboard.pengumuman'), path: '/dashboard/umum/pengumuman', icon: FileText }
  ];

  const hasIncidents = !!statsData.cabangMissingSubjectsCount && statsData.cabangMissingSubjectsCount > 0;

  return (
    <div className="font-sans text-slate-900 space-y-3.5 pb-8">
      {/* 1. RBAC Identity Banner & Incident Warning Strip */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm space-y-3">
        {/* Top Strip: Scope & Identity */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg font-bold uppercase text-[10px] tracking-wider border border-indigo-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{statsData.rbacIdentity?.scope || 'USER'}</span>
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-slate-400 text-[11px]">Operator:</span>
              <span className="font-bold text-slate-800 text-[11px]">{statsData.rbacIdentity?.operatorName || '-'}</span>
            </div>

            {statsData.rbacIdentity?.wilayahName && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-slate-400 text-[11px]">Wilayah:</span>
                <span className="font-semibold text-slate-800 text-[11px]">{statsData.rbacIdentity.wilayahName}</span>
              </div>
            )}

            {statsData.rbacIdentity?.cabangName && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-slate-400 text-[11px]">Cabang:</span>
                <span className="font-semibold text-slate-800 text-[11px]">{statsData.rbacIdentity.cabangName}</span>
              </div>
            )}
          </div>

          {/* Leaders Contact Info */}
          <div className="flex items-center gap-2 flex-wrap">
            {statsData.rbacIdentity?.ketuaCabangName && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ketua Cabang:</span>
                <span className="font-semibold text-slate-800">{statsData.rbacIdentity.ketuaCabangName}</span>
                {statsData.rbacIdentity.ketuaCabangPhone && (
                  <a href={`tel:${statsData.rbacIdentity.ketuaCabangPhone}`} className="text-blue-600 hover:underline font-medium text-[10px] flex items-center gap-0.5 ml-1">
                    <Phone className="w-2.5 h-2.5" />
                    {statsData.rbacIdentity.ketuaCabangPhone}
                  </a>
                )}
              </div>
            )}

            {statsData.rbacIdentity?.ketuaMuadalahName && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Kepala Muadalah:</span>
                <span className="font-semibold text-slate-800">{statsData.rbacIdentity.ketuaMuadalahName}</span>
                {statsData.rbacIdentity.ketuaMuadalahPhone && (
                  <a href={`tel:${statsData.rbacIdentity.ketuaMuadalahPhone}`} className="text-blue-600 hover:underline font-medium text-[10px] flex items-center gap-0.5 ml-1">
                    <Phone className="w-2.5 h-2.5" />
                    {statsData.rbacIdentity.ketuaMuadalahPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Missing Teachers Alert Strip (If Any) */}
        {hasIncidents && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Perhatian: Terdapat <strong className="font-extrabold text-amber-900">{statsData.cabangMissingSubjectsCount} cabang</strong> yang memerlukan pemenuhan guru mata pelajaran umum!
              </span>
            </div>
            <Link to="/dashboard/formal/penugasan-guru" className="font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-0.5 shrink-0 text-[11px]">
              Kelola Penugasan <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Global Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center pt-0.5">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Dashboard:</span>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={globalJenisRegion}
              onChange={e => {
                setGlobalJenisRegion(e.target.value);
                setGlobalWilayah('');
                setGlobalLembagaMuadalah('');
                setGlobalCabang('');
              }}
              disabled={user?.scope !== 'GLOBAL'}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-75 font-medium text-slate-700"
            >
              <option value="wilayah">Tingkat Wilayah</option>
              <option value="lembaga">Lembaga Muadalah</option>
            </select>

            {globalJenisRegion === 'wilayah' ? (
              <select
                value={globalWilayah}
                onChange={e => {
                  setGlobalWilayah(e.target.value);
                  setGlobalCabang('');
                }}
                disabled={user?.scope !== 'GLOBAL'}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-75 font-medium text-slate-700"
              >
                {user?.scope === 'GLOBAL' ? (
                  <>
                    <option value="">-- Semua Wilayah --</option>
                    {wilayahs.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </>
                ) : (
                  <option value={globalWilayah}>{user?.wilayahName || 'Wilayah Terkunci'}</option>
                )}
              </select>
            ) : (
              <select
                value={globalLembagaMuadalah}
                onChange={e => {
                  setGlobalLembagaMuadalah(e.target.value);
                  setGlobalCabang('');
                }}
                disabled={user?.scope !== 'GLOBAL'}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-75 font-medium text-slate-700"
              >
                <option value="">-- Semua Lembaga --</option>
                {muadalahs.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}

            <select
              value={globalCabang}
              onChange={e => setGlobalCabang(e.target.value)}
              disabled={user?.scope === 'CABANG'}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-75 font-medium text-slate-700"
            >
              {user?.scope === 'CABANG' ? (
                <option value={globalCabang}>{user?.cabangName || 'Cabang Terkunci'}</option>
              ) : (
                <>
                  <option value="">-- Semua Cabang --</option>
                  {filteredBranches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </>
              )}
            </select>

            <select
              value={globalJenisKelamin}
              onChange={e => setGlobalJenisKelamin(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium text-slate-700"
            >
              <option value="">-- Semua Gender --</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards (5 Compact Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Santri */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 shadow-sm border border-indigo-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Total Santri</span>
              <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-400/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-white mt-1.5">{statsData.totalSantri.toLocaleString('id-ID')}</div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-indigo-800/40 flex items-center justify-between text-[11px] text-indigo-200">
            <span>Berkas Lengkap:</span>
            <strong className="text-emerald-400">{statsData.kelengkapanSiswa?.percent || 0}%</strong>
          </div>
        </div>

        {/* Card 2: Total Guru & Staf */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Guru</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              {statsData.totalGuru?.toLocaleString('id-ID') || 0}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Berkas Lengkap:</span>
            <strong className="text-blue-600">{statsData.kelengkapanGuru?.percent || 0}%</strong>
          </div>
        </div>

        {/* Card 3: Total Kelas Formal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kelas Formal</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                <LayoutDashboard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">{statsData.totalKelas.toLocaleString('id-ID')}</div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status Rombel:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">Berjalan</span>
          </div>
        </div>

        {/* Card 4: Cetak Rapor Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cetak Rapor</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                {statsData.raporCetakProgress?.semester || 'Semester'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{statsData.raporCetakProgress?.percent || 0}%</div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                ({statsData.raporCetakProgress?.sudahCetak || 0}/{statsData.raporCetakProgress?.total || 0})
              </span>
            </div>
          </div>
          <div className="mt-2.5 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${statsData.raporCetakProgress?.percent || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Ketersediaan Guru Warning Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kebutuhan Guru</span>
              <div className={`p-1.5 rounded-lg border ${hasIncidents ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {hasIncidents ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              {statsData.cabangMissingSubjectsCount || 0}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Cabang Perlu Guru:</span>
            <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded border ${hasIncidents ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {hasIncidents ? 'Perlu Guru' : 'Lengkap'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Visualizations Row: Distribusi Grup Daimi & Sebaran Tingkat Kelas (6:6 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Distribusi Grup Daimi (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                Distribusi Grup Daimi (Pesantren)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Jumlah santri per kelompok daimi</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              {(statsData.chartGrupDaimi || []).filter(i => i.value > 0).length} Jenis
            </span>
          </div>

          <div className="pt-1">
            {(() => {
              const daimiItems = (statsData.chartGrupDaimi || []).filter(item => item.value > 0);
              if (daimiItems.length === 0) {
                return <div className="text-xs text-slate-400 py-6 text-center">Belum ada data grup daimi</div>;
              }
              const maxVal = Math.max(...daimiItems.map(d => d.value), 1);
              return (
                <div className="h-44 flex items-end justify-around gap-2 pb-1 border-b border-slate-200 overflow-x-auto">
                  {daimiItems.map((item, i) => {
                    const heightPercent = Math.max(Math.round((item.value / maxVal) * 100), 10);
                    const isNoGrup = item.name === 'No. Grup';
                    return (
                      <div key={i} className="group relative flex-1 flex flex-col items-center h-full justify-end min-w-[40px] max-w-[65px]">
                        <span className="text-[10px] font-bold text-slate-700 mb-1 group-hover:text-indigo-600 transition-colors">
                          {item.value.toLocaleString('id-ID')}
                        </span>
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 shadow-sm cursor-pointer ${
                            isNoGrup
                              ? 'bg-gradient-to-t from-slate-400 to-slate-300 group-hover:from-slate-500 group-hover:to-slate-400'
                              : 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300'
                          }`}
                        />
                        <span className="mt-1 text-[10px] font-semibold text-slate-600 truncate max-w-full text-center group-hover:text-indigo-600 transition-colors" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sebaran Tingkat Siswa Muadalah (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                Sebaran Tingkat Siswa Muadalah
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Wustha (7-9), Ulya (10-12), & Lainnya</p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
              Wustha & Ulya
            </span>
          </div>

          <div className="pt-1">
            {statsData.chartKelas && statsData.chartKelas.length > 0 ? (
              (() => {
                const maxVal = Math.max(...statsData.chartKelas.map(d => d.value), 1);
                const nonMuadalahItem = statsData.chartKelas.find(i => i.name === 'Non Muadalah' || i.name.toLowerCase().includes('non')) || { name: 'Non Muadalah', value: 0 };
                const heightPercentNonM = Math.max(Math.round((nonMuadalahItem.value / maxVal) * 100), 10);

                return (
                  <div className="flex gap-2.5 h-44 items-end">
                    {/* Wustha */}
                    <div className="flex-[5] min-w-0 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase">Wustha (7-9)</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {statsData.chartKelas.filter(i => ['7','8','9'].includes(i.name)).reduce((a, b) => a + b.value, 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-end justify-around gap-1.5 h-28 mt-2">
                        {statsData.chartKelas.filter(item => ['7','8','9'].includes(item.name)).map((item, i) => {
                          const heightPercent = Math.max(Math.round((item.value / maxVal) * 100), 10);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                              <span className="text-[9px] font-bold text-slate-600 mb-1">{item.value.toLocaleString('id-ID')}</span>
                              <div style={{ height: `${heightPercent}%` }} className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all shadow-2xs" />
                              <span className="text-[9px] font-semibold text-slate-500 mt-1.5">Tkg {item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ulya */}
                    <div className="flex-[5] min-w-0 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Ulya (10-12)</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {statsData.chartKelas.filter(i => ['10','11','12'].includes(i.name)).reduce((a, b) => a + b.value, 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-end justify-around gap-1.5 h-28 mt-2">
                        {statsData.chartKelas.filter(item => ['10','11','12'].includes(item.name)).map((item, i) => {
                          const heightPercent = Math.max(Math.round((item.value / maxVal) * 100), 10);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                              <span className="text-[9px] font-bold text-slate-600 mb-1">{item.value.toLocaleString('id-ID')}</span>
                              <div style={{ height: `${heightPercent}%` }} className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-all shadow-2xs" />
                              <span className="text-[9px] font-semibold text-slate-500 mt-1.5">Tkg {item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Non Muadalah */}
                    <div className="flex-[2] min-w-[50px] bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between h-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded uppercase truncate" title="Non Muadalah">Non-M</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {nonMuadalahItem.value.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-end justify-center gap-1 h-28 mt-2">
                        <div className="w-full max-w-[36px] flex flex-col items-center h-full justify-end">
                          <span className="text-[9px] font-bold text-slate-600 mb-1">{nonMuadalahItem.value.toLocaleString('id-ID')}</span>
                          <div 
                            style={{ height: `${heightPercentNonM}%` }} 
                            className="w-full bg-slate-400 hover:bg-slate-500 rounded-t-md transition-all shadow-2xs" 
                          />
                          <span className="text-[9px] font-semibold text-slate-500 mt-1.5 truncate" title="Non Muadalah">Non-M</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">Belum ada data tingkat kelas</div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Complete Status & Availability Grid: Entity Completeness (6 cols) & Ketersediaan Guru (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Progres Kelengkapan Data per Unit (Complete List, No Slice) - 6 cols */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Progres Kelengkapan Data {user?.scope === 'GLOBAL' ? '(Per Wilayah)' : user?.scope === 'WILAYAH' ? '(Per Cabang)' : '(Per Kelas)'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Persentase kelengkapan data berkas santri &amp; guru</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
              {statsData.kelengkapanEntities?.length || 0} Unit Total
            </span>
          </div>

          <div className="max-h-[260px] overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
            {statsData.kelengkapanEntities && statsData.kelengkapanEntities.length > 0 ? (
              statsData.kelengkapanEntities.map((entity: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50/70 hover:bg-slate-100/70 transition-all rounded-xl p-3 border border-slate-200/80 space-y-2"
                >
                  {/* Unit Name Header & Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 tracking-tight" title={entity.name}>
                      {entity.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Siswa: {entity.siswa?.percent || 0}%
                      </span>
                      {entity.guru && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          Guru: {entity.guru?.percent || 0}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bars Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    {/* Siswa Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-600 shrink-0" /> Siswa:
                        </span>
                        <span className="font-bold text-slate-700">{entity.siswa?.lengkap || 0}/{entity.siswa?.total || 0}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            (entity.siswa?.percent || 0) === 100 ? 'bg-emerald-500' :
                            (entity.siswa?.percent || 0) >= 50 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-amber-500'
                          }`}
                          style={{ width: `${entity.siswa?.percent || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Guru Bar */}
                    {entity.guru && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-500 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-indigo-600 shrink-0" /> Guru:
                          </span>
                          <span className="font-bold text-slate-700">{entity.guru?.lengkap || 0}/{entity.guru?.total || 0}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (entity.guru?.percent || 0) === 100 ? 'bg-emerald-500' :
                              (entity.guru?.percent || 0) >= 50 ? 'bg-gradient-to-r from-indigo-500 to-purple-400' : 'bg-amber-500'
                            }`}
                            style={{ width: `${entity.guru?.percent || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center italic bg-slate-50 border border-slate-200 rounded-xl">
                Tidak ada unit kelengkapan data.
              </div>
            )}
          </div>
        </div>

        {/* Ketersediaan Guru Mapel Umum (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('dashboard.ketersediaan_guru')}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={selectedWilayahFilter}
                onChange={e => { setSelectedWilayahFilter(e.target.value); setSelectedCabangFilter(''); }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="">{t('penugasan.semua_wilayah')}</option>
                {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select
                value={selectedCabangFilter}
                onChange={e => setSelectedCabangFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="">{t('penugasan.semua_cabang')}</option>
                {cabangOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[220px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50/70">
                  <th className="px-3 py-2 w-14 text-center">{t('dashboard.status')}</th>
                  <th className="px-3 py-2">{t('dashboard.nama_cabang')}</th>
                  <th className="px-3 py-2">{t('dashboard.mapel_kurang')}</th>
                  <th className="px-3 py-2 w-12 text-center">{t('dashboard.aksi')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedKetersediaanGuru.length > 0 ? (
                  paginatedKetersediaanGuru.map((cabang) => (
                    <tr key={cabang.cabangId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block w-5 h-1.5 rounded-full ${cabang.status === 'hijau' ? 'bg-emerald-500' : cabang.status === 'kuning' ? 'bg-amber-500' : 'bg-rose-500'}`}
                          title={cabang.status === 'hijau' ? t('dashboard.operational') : cabang.status === 'kuning' ? t('dashboard.partial_issue') : t('dashboard.critical_issue')}
                        />
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-800">
                        <div>{cabang.cabangName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{cabang.wilayahName}</div>
                      </td>
                      <td className="px-3 py-2">
                        {cabang.status === 'hijau' ? (
                          <span className="text-emerald-700 text-[11px] font-semibold">{t('dashboard.all_mapel_filled')}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {cabang.missingSubjects.map(sub => (
                              <span key={sub} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-100 font-medium">
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Link
                          to="/dashboard/formal/penugasan-guru"
                          className="inline-flex items-center justify-center p-1 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                          title={t('dashboard.kelola_penugasan')}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-xs">
                      {t('dashboard.no_data_cabang')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredKetersediaanGuru.length > 0 && (
            <div className="p-2 border-t border-slate-100">
              <Pagination
                currentPage={kgPage}
                totalPages={totalKgPages}
                onPageChange={setKgPage}
                totalItems={filteredKetersediaanGuru.length}
                itemsPerPage={kgLimit}
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Grid: Akses Cepat (4 cols) & Full Activity Feed (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Akses Cepat (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">{t('dashboard.akses_cepat')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((item, i) => (
                <Link
                  to={item.path}
                  key={i}
                  className="group flex flex-col items-start gap-1.5 p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all"
                >
                  <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 transition-colors leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru / Log Audit (8 cols - Complete Feed) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('dashboard.aktivitas_terbaru')}</h3>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                {statsData.activities.length} Aktivitas
              </span>
            </div>
            <Link
              to="/dashboard/core/riwayat-perubahan"
              className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-0.5"
            >
              {t('dashboard.lihat_log')} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {statsData.activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {statsData.activities.map((activity, i) => {
                const Icon = getActivityIcon(activity.title);
                return (
                  <div key={i} className="flex items-start gap-2 bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                    <div className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 leading-snug truncate" title={activity.title}>
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{activity.author}</span>
                        <span>•</span>
                        <span>{activity.time ? new Date(activity.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center flex flex-col items-center justify-center">
              <Activity className="w-5 h-5 text-slate-300 mb-1" />
              <p className="text-xs text-slate-400">{t('dashboard.no_activity')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
