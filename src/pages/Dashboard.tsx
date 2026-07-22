import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, BookOpen, LayoutDashboard, Award, Loader2,
  Calendar, MoreHorizontal, Plus, ChevronRight, Activity,
  CheckCircle2, Copy, AlertCircle, FileText, Settings, Filter
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
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
}

export default function Dashboard() {
  const { user } = useAuth();
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
      <div className="flex justify-center items-center h-[60vh] font-mono text-sm text-slate-500 bg-[#fcfcfc]">
        <Loader2 className="w-5 h-5 animate-spin text-[#0051c3] mr-2" />
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

  return (
    <div className="font-sans text-[#1d1d1f] pb-10 bg-[#fcfcfc] min-h-screen">

      {/* Cloudflare-style Account Selector / Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">ACCOUNT</span>
          <span className="text-slate-350">/</span>
          <div className="flex items-center gap-2 bg-[#fbfbfb] border border-slate-200 px-3 py-1.5 rounded text-sm font-bold text-slate-800 select-none">
            <span>
              {user?.scope === 'CABANG'
                ? (user?.cabangName || user?.username || 'Cabang')
                : user?.scope === 'WILAYAH'
                  ? (user?.wilayahName || user?.username || 'Wilayah')
                  : 'Administrator'}
            </span>
            <span className="text-xs bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
              {user?.scope === 'GLOBAL' ? 'Pusat' : user?.scope === 'WILAYAH' ? 'Wilayah' : 'Cabang'}
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono mt-2 md:mt-0 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Last Sync: Today</span>
        </div>
      </div>

      {/* Top Cards Grid (including Incident Status) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        {/* Santri Card */}
        <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col relative group">
          <div className="px-3.5 py-2.5 border-b border-slate-200 bg-[#fbfbfb] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">Total Santri</span>
            <span className="text-xs font-mono font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-150">↗ 2.4%</span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">{statsData.totalSantri.toLocaleString()}</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Active Students</p>
            </div>

            {/* Sparkline compact bars */}
            <div className="flex items-end h-10 gap-0.5 w-full mt-4">
              {[30, 50, 40, 70, 90, 65, 80, 55, 60, 85].map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-[#0051c3]/15 hover:bg-[#0051c3]/80 transition-colors duration-150 cursor-pointer"
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Kelas Card */}
        <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col relative group">
          <div className="px-3.5 py-2.5 border-b border-slate-200 bg-[#fbfbfb] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">Kelas Aktif</span>
            <span className="text-xs font-mono text-slate-400">Stable</span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-3xl font-semibold text-[#1d1d1f] tracking-tight">{statsData.totalKelas.toLocaleString()}</div>
              <p className="text-xs text-slate-500 font-mono mt-1">Study Groups</p>
            </div>

            {/* Sparkline wave */}
            <div className="h-10 w-full mt-4 overflow-hidden relative">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M0,35 Q15,10 30,25 T60,15 T90,20 L100,25" fill="none" stroke="#0051c3" strokeWidth="1.5" />
                <path d="M0,35 Q15,10 30,25 T60,15 T90,20 L100,25 L100,40 L0,40 Z" fill="rgba(0, 81, 195, 0.05)" />
              </svg>
            </div>
          </div>
        </div>

        {/* Incident status card (Integrated Cabang Kurang Guru) */}
        <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col relative group md:col-span-2">
          <div className="px-3.5 py-2.5 border-b border-slate-200 bg-[#fbfbfb] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">System Status & Incidents</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${statsData.cabangMissingSubjectsCount && statsData.cabangMissingSubjectsCount > 0
              ? 'bg-rose-50 text-rose-750 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
              {statsData.cabangMissingSubjectsCount && statsData.cabangMissingSubjectsCount > 0
                ? `${statsData.cabangMissingSubjectsCount} Issues`
                : 'All Operational'}
            </span>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[130px] custom-scrollbar">
            {statsData.ketersediaanGuru && statsData.ketersediaanGuru.filter(k => k.status !== 'hijau').length > 0 ? (
              <div className="space-y-3">
                {statsData.ketersediaanGuru.filter(k => k.status !== 'hijau').map((cabang, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-800 font-mono">{cabang.cabangName}</span>
                        <span className="text-[10px] font-mono text-slate-400">{cabang.wilayahName}</span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-1">
                        Missing: <span className="text-rose-600 font-medium">{cabang.missingSubjects.join(', ')}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-2 text-slate-400">
                <CheckCircle2 className="w-6 h-6 mb-1 text-emerald-500" />
                <p className="text-xs font-mono">No incidents reported. All teacher slots are filled.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Distribusi Grup Daimi */}
        <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col">
          <div className="bg-[#fbfbfb] px-3.5 py-2.5 border-b border-slate-200">
            <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">Distribusi Grup Daimi</h3>
          </div>

          <div className="p-5 flex items-end justify-between gap-4 h-44 relative bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_30px] border-b border-slate-100">
            {statsData.chartGrupDaimi && statsData.chartGrupDaimi.length > 0 ? (
              statsData.chartGrupDaimi.map((item, i) => {
                const maxVal = Math.max(...statsData.chartGrupDaimi.map(d => d.value), 1);
                const percent = (item.value / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative z-10">
                    <span className="text-xs font-mono font-bold text-[#1d1d1f] bg-[#fbfbfb] px-1.5 py-0.5 rounded border border-slate-200 absolute -top-6 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none">
                      {item.value}
                    </span>
                    <span className="text-xs font-mono text-slate-400 mb-0.5">{item.value}</span>
                    <div className="w-5 h-24 bg-slate-100 rounded-[1px] flex flex-col justify-end overflow-hidden border border-slate-200/50">
                      <div
                        className="w-full bg-[#0051c3] hover:bg-[#00409c] transition-all duration-300 origin-bottom cursor-pointer rounded-[1px]"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500 text-center uppercase tracking-tight mt-2 w-full truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs font-mono text-slate-400 py-4 text-center w-full">Data tidak tersedia</div>
            )}
          </div>
        </div>

        {/* Kategori Siswa */}
        <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col">
          <div className="bg-[#fbfbfb] px-3.5 py-2.5 border-b border-slate-200">
            <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">Kategori Siswa (Formal)</h3>
          </div>

          <div className="p-5 flex items-end justify-between gap-4 h-44 relative bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:100%_30px] border-b border-slate-100">
            {statsData.chartKelas && statsData.chartKelas.length > 0 ? (
              statsData.chartKelas.map((item, i) => {
                const maxVal = Math.max(...statsData.chartKelas.map(d => d.value), 1);
                const percent = (item.value / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative z-10">
                    <span className="text-xs font-mono font-bold text-[#1d1d1f] bg-[#fbfbfb] px-1.5 py-0.5 rounded border border-slate-200 absolute -top-6 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none">
                      {item.value}
                    </span>
                    <span className="text-xs font-mono text-slate-400 mb-0.5">{item.value}</span>
                    <div className="w-5 h-24 bg-slate-100 rounded-[1px] flex flex-col justify-end overflow-hidden border border-slate-200/50">
                      <div
                        className="w-full bg-[#0051c3] hover:bg-[#00409c] transition-all duration-300 origin-bottom cursor-pointer rounded-[1px]"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500 text-center uppercase tracking-tight mt-2 w-full truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs font-mono text-slate-400 py-4 text-center w-full">Data tidak tersedia</div>
            )}
          </div>
        </div>

      </div>

      {/* Two Column Layout: Timeline and Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* Left Column: Ketersediaan Guru Mapel & Aktivitas Terbaru */}
        <div className="space-y-6">
          {/* Full Width Table: System Status (Ketersediaan Guru Mapel Umum) */}
          <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col">
            <div className="bg-[#fbfbfb] px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0051c3]" />
                <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">Ketersediaan Guru Mapel Umum</h3>
                <Link
                  to="/formal/penugasan-guru"
                  className="ml-2 text-xs bg-white text-[#0051c3] hover:text-[#00409c] hover:bg-slate-50 px-2.5 py-0.5 rounded font-mono font-bold border border-slate-200 transition-colors"
                >
                  Assign Teachers
                </Link>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-655">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Operational
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-655">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> Partial Issue
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-655">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div> Critical Issue
                </div>
              </div>
            </div>

            {/* Compact Filter Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
                </span>
                <select
                  value={selectedWilayahFilter}
                  onChange={e => { setSelectedWilayahFilter(e.target.value); setSelectedCabangFilter(''); }}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                >
                  <option value="">-- Semua Wilayah --</option>
                  {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>

                <select
                  value={selectedCabangFilter}
                  onChange={e => setSelectedCabangFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                >
                  <option value="">-- Semua Cabang --</option>
                  {cabangOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Menampilkan {filteredKetersediaanGuru.length} cabang
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-[#fbfbfb] text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3.5 w-24 text-center">Status</th>
                    <th className="px-4 py-3.5 w-60">Nama Cabang</th>
                    <th className="px-4 py-3.5 w-44">Wilayah</th>
                    <th className="px-4 py-3.5">Mapel Kurang Guru</th>
                    <th className="px-4 py-3.5 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs font-mono bg-white">
                  {paginatedKetersediaanGuru.length > 0 ? (
                    paginatedKetersediaanGuru.map((cabang) => (
                      <tr key={cabang.cabangId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex justify-center items-center">
                            {cabang.status === 'hijau' ? (
                              <div className="w-2 h-2 rounded-full bg-emerald-500" title="Operational" />
                            ) : cabang.status === 'kuning' ? (
                              <div className="w-2 h-2 rounded-full bg-amber-500" title="Partial Issue" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-rose-500" title="Critical Issue" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          {cabang.cabangName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-555">
                          {cabang.wilayahName}
                        </td>
                        <td className="px-4 py-3.5">
                          {cabang.status === 'hijau' ? (
                            <span className="text-emerald-700 text-xs font-sans font-medium">Semua 5 Mapel Terisi</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 font-sans">
                              {cabang.missingSubjects.map(sub => (
                                <span key={sub} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-rose-50 text-rose-700 border border-rose-150 capitalize font-medium">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            to="/formal/penugasan-guru"
                            className="inline-flex items-center justify-center p-1.5 rounded hover:bg-slate-100 text-[#0051c3] hover:text-[#00409c] transition-colors"
                            title="Kelola Penugasan"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        Tidak ada data cabang yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredKetersediaanGuru.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50/50">
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

          {/* Left Column: Aktivitas Terbaru */}
          <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col">
            <div className="bg-[#fbfbfb] px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">Aktivitas Terbaru</span>
                <span className="bg-slate-100 border border-slate-250 text-slate-600 text-xs px-2 py-0.5 rounded font-mono ml-1 font-bold">
                  {statsData.activities.length}
                </span>
              </div>
              <Link
                to="/core/riwayat-perubahan"
                className="text-[#0051c3] hover:text-[#00409c] hover:underline text-xs flex items-center gap-0.5"
              >
                <span className="text-xs font-mono">View logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 relative">
              {/* Vertical timeline connector */}
              <div className="absolute left-[24px] top-[26px] bottom-[26px] w-[1px] bg-slate-200 pointer-events-none"></div>

              <div className="space-y-4">
                {statsData.activities.map((activity, i) => (
                  <div key={i} className="relative flex gap-4 items-start pl-6 group">
                    <div className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0051c3] border-2 border-white ring-1 ring-slate-250 z-10"></div>
                    <div className="flex-1 bg-white hover:bg-slate-50/50 p-3 rounded border border-slate-200 transition-colors">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-xs font-semibold text-slate-800 font-mono">{activity.title}</h4>
                        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">by {activity.author}</p>
                    </div>
                  </div>
                ))}

                {statsData.activities.length === 0 && (
                  <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                    <Activity className="w-6 h-6 text-slate-350 mb-1" />
                    <p className="text-xs font-mono text-slate-500">No activity logs recorded.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Akses Cepat */}
        <div className="space-y-6">
          <div className="bg-[#fcfcfc] border border-slate-200 rounded flex flex-col">
            <div className="bg-[#fbfbfb] px-3.5 py-2.5 border-b border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">Akses Cepat</span>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              {[
                { label: 'Data Santri', path: '/core/siswa', icon: Users },
                { label: 'Kelas Formal', path: '/formal/kelas', icon: LayoutDashboard },
                { label: 'Kalender', path: '/settings/kalender', icon: Calendar },
                { label: 'Pengumuman', path: '/umum/pengumuman', icon: FileText }
              ].map((item, i) => (
                <Link
                  to={item.path}
                  key={i}
                  className="group p-3 bg-white border border-slate-250 hover:border-slate-350 rounded transition-colors flex items-center justify-between h-14"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-500 group-hover:text-[#0051c3] group-hover:border-[#0051c3]/30 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#1d1d1f] truncate group-hover:text-[#0051c3] font-mono transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
