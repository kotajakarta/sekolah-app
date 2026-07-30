import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, LayoutDashboard, Loader2,
  Calendar, ChevronRight, Activity,
  CheckCircle2, AlertCircle, FileText, Filter, Pencil, ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import Pagination from '../components/Pagination';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

interface DashboardStats {
  totalSantri: number;
  totalKelas: number;
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
  kelengkapanEntities?: { name: string; total: number; lengkap: number; percent: number; }[];
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
    <div className="font-sans text-slate-900 pb-10">

      {/* Global Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
            <Filter className="w-4 h-4 text-brand" /> {t('dashboard.filters') || 'Filter Global'}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={globalJenisRegion}
              onChange={e => {
                setGlobalJenisRegion(e.target.value);
                setGlobalWilayah('');
                setGlobalLembagaMuadalah('');
                setGlobalCabang('');
              }}
              disabled={user?.scope !== 'GLOBAL'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
            >
              <option value="wilayah">Wilayah</option>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
              >
                {user?.scope === 'GLOBAL' ? (
                  <>
                    <option value="">-- {t('penugasan.semua_wilayah')} --</option>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
            >
              {user?.scope === 'CABANG' ? (
                <option value={globalCabang}>{user?.cabangName || 'Cabang Terkunci'}</option>
              ) : (
                <>
                  <option value="">-- {t('penugasan.semua_cabang')} --</option>
                  {filteredBranches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </>
              )}
            </select>

            <select
              value={globalJenisKelamin}
              onChange={e => setGlobalJenisKelamin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand focus:outline-none text-sm bg-slate-50/50"
            >
              <option value="">-- Semua Jenis Kelamin --</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Grid: stat cards + System Status (spans both rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Total Santri */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('dashboard.stats_total_santri')}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> 2.4%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{statsData.totalSantri.toLocaleString()}</div>
          <div className="flex items-end h-10 gap-0.5 w-full mt-4">
            {[30, 50, 40, 70, 90, 65, 80, 55, 60, 85].map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-brand/15 hover:bg-brand/70 transition-colors duration-150 cursor-pointer rounded-sm"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>

        {/* Kelas Aktif */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('dashboard.stats_kelas_aktif')}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Stable
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{statsData.totalKelas.toLocaleString()}</div>
          <div className="h-10 w-full mt-4 overflow-hidden relative">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0,35 Q15,10 30,25 T60,15 T90,20 L100,25" fill="none" stroke="#2563eb" strokeWidth="1.5" />
              <path d="M0,35 Q15,10 30,25 T60,15 T90,20 L100,25 L100,40 L0,40 Z" fill="rgba(37, 99, 235, 0.08)" />
            </svg>
          </div>
        </div>

        {/* System Status & Incidents — spans both rows on the right */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:row-span-2">
          {/* Progres Cetak Rapor — TA/Semester aktif */}
          {statsData.raporCetakProgress && (
            <div className="pb-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('dashboard.progres_cetak')}</span>
                <span className="text-[11px] font-medium text-slate-400">
                  {statsData.raporCetakProgress.semester} {statsData.raporCetakProgress.tahunAjaran}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{statsData.raporCetakProgress.percent}%</span>
                <span className="text-xs text-slate-400">
                  {statsData.raporCetakProgress.sudahCetak} / {statsData.raporCetakProgress.total} santri
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${statsData.raporCetakProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Progres Kelengkapan Data */}
          {statsData.kelengkapanEntities && statsData.kelengkapanEntities.length > 0 && (
            <div className={`pt-4 ${statsData.raporCetakProgress ? 'border-t border-slate-100 mt-4' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Progres Kelengkapan Data {user?.scope === 'GLOBAL' ? '(Per Wilayah)' : user?.scope === 'WILAYAH' ? '(Per Cabang)' : '(Per Kelas)'}
                </span>
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {statsData.kelengkapanEntities.map((entity: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-slate-600 truncate max-w-[180px]" title={entity.name}>
                        {entity.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-900">{entity.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${entity.percent === 100 ? 'bg-emerald-500' : entity.percent >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${entity.percent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      {entity.lengkap} / {entity.total} Lengkap
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Distribusi Grup Daimi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">{t('dashboard.dist_grup_daimi')}</h3>
          <div className="flex items-end justify-between gap-3 h-40">
            {statsData.chartGrupDaimi && statsData.chartGrupDaimi.length > 0 ? (
              statsData.chartGrupDaimi.map((item, i) => {
                const maxVal = Math.max(...statsData.chartGrupDaimi.map(d => d.value), 1);
                const percent = (item.value / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                    <span className="text-xs font-semibold text-slate-500 mb-1">{item.value}</span>
                    <div className="w-full max-w-6 bg-slate-100 rounded-t-md flex flex-col justify-end overflow-hidden" style={{ height: '5.5rem' }}>
                      <div
                        className="w-full bg-brand rounded-t-md transition-all duration-300"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 text-center uppercase tracking-tight mt-2 w-full truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center w-full">{t('common.no_data')}</div>
            )}
          </div>
        </div>

        {/* Kategori Siswa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">{t('dashboard.kategori_siswa')}</h3>
          <div className="flex items-end justify-between gap-3 h-40">
            {statsData.chartKelas && statsData.chartKelas.length > 0 ? (
              statsData.chartKelas.map((item, i) => {
                const maxVal = Math.max(...statsData.chartKelas.map(d => d.value), 1);
                const percent = (item.value / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                    <span className="text-xs font-semibold text-slate-500 mb-1">{item.value}</span>
                    <div className="w-full max-w-6 bg-slate-100 rounded-t-md flex flex-col justify-end overflow-hidden" style={{ height: '5.5rem' }}>
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          ['7', '8', '9'].includes(item.name) ? 'bg-blue-500' :
                          ['10', '11', '12'].includes(item.name) ? 'bg-emerald-500' :
                          'bg-slate-400'
                        }`}
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 text-center uppercase tracking-tight mt-2 w-full truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center w-full">{t('common.no_data')}</div>
            )}
          </div>
        </div>

      </div>

      {/* Ketersediaan Guru Mapel + Akses Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 mb-4">

        {/* Ketersediaan Guru Mapel Umum */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-800">{t('dashboard.ketersediaan_guru')}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> {t('dashboard.filters')}
              </span>
              <select
                value={selectedWilayahFilter}
                onChange={e => { setSelectedWilayahFilter(e.target.value); setSelectedCabangFilter(''); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t('penugasan.semua_wilayah')}</option>
                {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select
                value={selectedCabangFilter}
                onChange={e => setSelectedCabangFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t('penugasan.semua_cabang')}</option>
                {cabangOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3 w-20 text-center">{t('dashboard.status')}</th>
                  <th className="px-5 py-3">{t('dashboard.nama_cabang')}</th>
                  <th className="px-5 py-3">{t('dashboard.wilayah')}</th>
                  <th className="px-5 py-3">{t('dashboard.mapel_kurang')}</th>
                  <th className="px-5 py-3 w-16 text-center">{t('dashboard.aksi')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedKetersediaanGuru.length > 0 ? (
                  paginatedKetersediaanGuru.map((cabang) => (
                    <tr key={cabang.cabangId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block w-7 h-1.5 rounded-full ${cabang.status === 'hijau' ? 'bg-emerald-500' : cabang.status === 'kuning' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          title={cabang.status === 'hijau' ? t('dashboard.operational') : cabang.status === 'kuning' ? t('dashboard.partial_issue') : t('dashboard.critical_issue')}
                        />
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{cabang.cabangName}</td>
                      <td className="px-5 py-3.5 text-slate-500">{cabang.wilayahName}</td>
                      <td className="px-5 py-3.5">
                        {cabang.status === 'hijau' ? (
                          <span className="text-emerald-700 text-xs font-medium">{t('dashboard.all_mapel_filled')}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {cabang.missingSubjects.map(sub => (
                              <span key={sub} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-rose-50 text-rose-700 border border-rose-100 capitalize font-medium">
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link
                          to="/dashboard/formal/penugasan-guru"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-brand transition-colors"
                          title={t('dashboard.kelola_penugasan')}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                      {t('dashboard.no_data_cabang')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredKetersediaanGuru.length > 0 && (
            <div className="p-3 border-t border-slate-100">
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

        {/* Akses Cepat */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t('dashboard.akses_cepat')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((item, i) => (
              <Link
                to={item.path}
                key={i}
                className="group flex flex-col items-start gap-2 p-3 bg-slate-50 hover:bg-white border border-transparent hover:border-brand/30 rounded-xl transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-brand group-hover:border-brand/30 transition-colors">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-brand transition-colors leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Aktivitas Terbaru — full width */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">{t('dashboard.aktivitas_terbaru')}</h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              {statsData.activities.length}
            </span>
          </div>
          <Link
            to="/dashboard/core/riwayat-perubahan"
            className="text-brand hover:text-brand-hover text-xs font-medium flex items-center gap-0.5"
          >
            {t('dashboard.lihat_log')} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {statsData.activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
            {statsData.activities.map((activity, i) => {
              const Icon = getActivityIcon(activity.title);
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">
                      <span className="text-slate-400">{activity.time}:</span> {activity.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t('dashboard.by')} {activity.author}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <Activity className="w-6 h-6 text-slate-300 mb-1" />
            <p className="text-xs text-slate-500">{t('dashboard.no_activity')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
