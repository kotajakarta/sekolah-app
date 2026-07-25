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
}

const getActivityIcon = (title: string) => {
  const t = title.toLowerCase();
  return (t.includes('nilai') || t.includes('rapor')) ? FileText : Pencil;
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ketersediaan Guru Mapel Umum filter & pagination states
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState('');
  const [selectedCabangFilter, setSelectedCabangFilter] = useState('');
  const [kgPage, setKgPage] = useState(1);
  const kgLimit = 10;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get<DashboardStats>('/dashboard/stats');
        setStatsData(res.data);
      } catch (err: any) {
        setError(t('common.failed') || 'Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [t]);

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
        <Loader2 className="w-5 h-5 animate-spin text-glacier-accent mr-2" />
        <span>Loading Dashboard statistics...</span>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="bg-rose-50 text-rose-700 p-3.5 rounded border border-rose-200 text-sm font-mono mt-6 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <span>{error || 'Failed to load data'}</span>
      </div>
    );
  }

  const quickLinks = [
    { label: 'Data Santri', path: '/dashboard/core/siswa', icon: Users },
    { label: 'Kelas Formal', path: '/dashboard/formal/kelas', icon: LayoutDashboard },
    { label: 'Kalender', path: '/dashboard/settings/kalender', icon: Calendar },
    { label: 'Pengumuman', path: '/dashboard/umum/pengumuman', icon: FileText }
  ];

  const hasIncidents = !!statsData.cabangMissingSubjectsCount && statsData.cabangMissingSubjectsCount > 0;

  return (
    <div className="font-sans text-slate-900 pb-10">

      {/* Top Grid: stat cards + System Status (spans both rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Total Santri */}
        <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Santri</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> 2.4%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{statsData.totalSantri.toLocaleString()}</div>
          <div className="flex items-end h-10 gap-0.5 w-full mt-4">
            {[30, 50, 40, 70, 90, 65, 80, 55, 60, 85].map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-glacier-accent/15 hover:bg-glacier-accent/70 transition-colors duration-150 cursor-pointer rounded-sm"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>

        {/* Kelas Aktif */}
        <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kelas Aktif</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Stable
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{statsData.totalKelas.toLocaleString()}</div>
          <div className="h-10 w-full mt-4 overflow-hidden relative">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0,35 Q15,10 30,25 T60,15 T90,20 L100,25" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
              <path d="M0,35 Q15,10 30,25 T60,15 T90,20 L100,25 L100,40 L0,40 Z" fill="rgba(14, 165, 233, 0.08)" />
            </svg>
          </div>
        </div>

        {/* System Status & Incidents — spans both rows on the right */}
        <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl p-5 shadow-sm flex flex-col lg:row-span-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">System Status &amp; Incidents</span>
          {hasIncidents ? (
            <>
              <div className="text-3xl font-bold text-rose-600 tracking-tight">
                {statsData.cabangMissingSubjectsCount} Issue{statsData.cabangMissingSubjectsCount! > 1 ? 's' : ''}
              </div>
              <div className="max-h-40 overflow-y-auto custom-scrollbar mt-3 space-y-3">
                {statsData.ketersediaanGuru!.filter(k => k.status !== 'hijau').map((cabang, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <p className="text-sm font-bold text-slate-800">{cabang.cabangName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Missing: <span className="text-rose-600 font-medium">{cabang.missingSubjects.join(', ')}</span>
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-6">
              <CheckCircle2 className="w-7 h-7 mb-1.5 text-emerald-500" />
              <p className="text-xs text-center">Semua slot guru terisi, tidak ada kendala.</p>
            </div>
          )}

          {/* Progres Cetak Rapor — TA/Semester aktif */}
          {statsData.raporCetakProgress && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Progres Cetak Rapor</span>
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
                  className="h-full bg-glacier-accent rounded-full transition-all duration-300"
                  style={{ width: `${statsData.raporCetakProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Distribusi Grup Daimi */}
        <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Distribusi Grup Daimi</h3>
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
                        className="w-full bg-glacier-accent rounded-t-md transition-all duration-300"
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
              <div className="text-xs text-slate-400 py-4 text-center w-full">Data tidak tersedia</div>
            )}
          </div>
        </div>

        {/* Kategori Siswa */}
        <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Kategori Siswa (Formal)</h3>
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
                        className="w-full bg-glacier-accent rounded-t-md transition-all duration-300"
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
              <div className="text-xs text-slate-400 py-4 text-center w-full">Data tidak tersedia</div>
            )}
          </div>
        </div>

      </div>

      {/* Ketersediaan Guru Mapel + Akses Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 mb-4">

        {/* Ketersediaan Guru Mapel Umum */}
        <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-glacier-accent" />
              <h3 className="text-sm font-bold text-slate-800">Ketersediaan Guru Mapel Umum</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filters
              </span>
              <select
                value={selectedWilayahFilter}
                onChange={e => { setSelectedWilayahFilter(e.target.value); setSelectedCabangFilter(''); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Wilayah</option>
                {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select
                value={selectedCabangFilter}
                onChange={e => setSelectedCabangFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Cabang</option>
                {cabangOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3 w-20 text-center">Status</th>
                  <th className="px-5 py-3">Nama Cabang</th>
                  <th className="px-5 py-3">Wilayah</th>
                  <th className="px-5 py-3">Mapel Kurang Guru</th>
                  <th className="px-5 py-3 w-16 text-center">Aksi</th>
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
                          title={cabang.status === 'hijau' ? 'Operational' : cabang.status === 'kuning' ? 'Partial Issue' : 'Critical Issue'}
                        />
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{cabang.cabangName}</td>
                      <td className="px-5 py-3.5 text-slate-500">{cabang.wilayahName}</td>
                      <td className="px-5 py-3.5">
                        {cabang.status === 'hijau' ? (
                          <span className="text-emerald-700 text-xs font-medium">Semua 5 Mapel Terisi</span>
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
                          className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-glacier-accent transition-colors"
                          title="Kelola Penugasan"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                      Tidak ada data cabang yang sesuai filter.
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
        <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Akses Cepat</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((item, i) => (
              <Link
                to={item.path}
                key={i}
                className="group flex flex-col items-start gap-2 p-3 bg-slate-50 hover:bg-white border border-transparent hover:border-glacier-accent/30 rounded-xl transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-glacier-accent group-hover:border-glacier-accent/30 transition-colors">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-glacier-accent transition-colors leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Aktivitas Terbaru — full width */}
      <div className="bg-white/70 backdrop-blur-xl border border-glacier-primary/25 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              {statsData.activities.length}
            </span>
          </div>
          <Link
            to="/dashboard/core/riwayat-perubahan"
            className="text-glacier-accent hover:text-glacier-accent-dark text-xs font-medium flex items-center gap-0.5"
          >
            Lihat log <ChevronRight className="w-3.5 h-3.5" />
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
                    <p className="text-[11px] text-slate-400 mt-0.5">by {activity.author}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <Activity className="w-6 h-6 text-slate-300 mb-1" />
            <p className="text-xs text-slate-500">Belum ada aktivitas tercatat.</p>
          </div>
        )}
      </div>

    </div>
  );
}
