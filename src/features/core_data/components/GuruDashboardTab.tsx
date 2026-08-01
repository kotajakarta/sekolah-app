import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, ShieldCheck, GraduationCap,
  BookOpen, Award, PieChart, BarChart3, TrendingUp,
  Building2, CheckCircle2, AlertCircle, FileText, Briefcase
} from 'lucide-react';
import AdvancedFilterBar, { FilterState } from '../../../components/AdvancedFilterBar';
import { useGetWilayah } from '../hooks/useMasterData';
import { useTranslation } from 'react-i18next';

interface GuruDashboardTabProps {
  guru: any[];
  assignments: any[];
  isLoading: boolean;
  userScope?: string;
  userWilayahId?: string;
  userCabangId?: string;
}

export default function GuruDashboardTab({
  guru,
  assignments,
  isLoading,
  userScope = '',
  userWilayahId = '',
  userCabangId = ''
}: GuruDashboardTabProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>({
    wilayahId: userScope === 'WILAYAH' || userScope === 'CABANG' ? userWilayahId : '',
    cabangId: userScope === 'CABANG' ? userCabangId : '',
    kelasId: '',
    lembagaMuadalahId: ''
  });

  const { data: masterWilayah = [] } = useGetWilayah();

  const wilayahLookup = useMemo(() => {
    const map = new Map<string, string>();
    (masterWilayah || []).forEach(w => {
      if (w.id && w.name) map.set(w.id, w.name);
    });
    return map;
  }, [masterWilayah]);

  // Filter teachers based on scope
  const filteredGuru = useMemo(() => {
    return (Array.isArray(guru) ? guru : []).filter((g: any) => {
      if (filters.wilayahId && g.wilayahId !== filters.wilayahId) return false;
      if (filters.cabangId && g.cabangId !== filters.cabangId) return false;
      
      if (filters.kelasId) {
        const hasKelas = g.guruMapelKelas?.some((asg: any) => asg.kelasId === filters.kelasId);
        if (!hasKelas) return false;
      }

      if (filters.lembagaMuadalahId) {
        const hasMuadalah = g.guruMapelKelas?.some((asg: any) => asg.kelas?.lembagaMuadalahId === filters.lembagaMuadalahId);
        if (!hasMuadalah) return false;
      }

      return true;
    });
  }, [guru, filters]);

  // Comprehensive analytics calculation
  const stats = useMemo(() => {
    const total = filteredGuru.length;
    if (total === 0) {
      return {
        total: 0,
        assignedCount: 0,
        unassignedCount: 0,
        pimpinanCount: 0,
        positionStats: [],
        subjectStats: [],
        wilayahStats: []
      };
    }

    let assignedCount = 0;
    let pimpinanCount = 0;
    const positionMap: Record<string, number> = {};
    const subjectMap: Record<string, number> = {};
    const wilayahMap: Record<string, {
      wilayahName: string;
      total: number;
      assigned: number;
      unassigned: number;
    }> = {};

    filteredGuru.forEach(g => {
      // Position breakdown
      const pos = g.position || t('guru.dashboard.fallback_pengajar');
      positionMap[pos] = (positionMap[pos] || 0) + 1;

      if (pos.toLowerCase().includes('kepala') || pos.toLowerCase().includes('pimpinan')) {
        pimpinanCount++;
      }

      // Assignments
      const teacherAssignments = (assignments || []).filter((asg: any) => asg.staffId === g.id);
      const isAssigned = teacherAssignments.length > 0;
      if (isAssigned) {
        assignedCount++;
        teacherAssignments.forEach((asg: any) => {
          const mapelName = asg.mataPelajaran?.name || t('guru.dashboard.fallback_lainnya');
          subjectMap[mapelName] = (subjectMap[mapelName] || 0) + 1;
        });
      }

      // Wilayah Breakdown
      const wId = g.wilayahId || (g.wilayah?.id) || (g.cabang?.wilayahId);
      const wName = g.wilayah?.name || g.cabang?.wilayah?.name || (wId ? wilayahLookup.get(wId) : null) || t('guru.dashboard.fallback_wilayah_belum_diset');

      if (!wilayahMap[wName]) {
        wilayahMap[wName] = {
          wilayahName: wName,
          total: 0,
          assigned: 0,
          unassigned: 0
        };
      }

      wilayahMap[wName].total++;
      if (isAssigned) {
        wilayahMap[wName].assigned++;
      } else {
        wilayahMap[wName].unassigned++;
      }
    });

    const positionStats = Object.keys(positionMap).map(k => ({
      name: k,
      count: positionMap[k],
      percent: Math.round((positionMap[k] / total) * 100)
    })).sort((a, b) => b.count - a.count);

    const subjectStats = Object.keys(subjectMap).map(k => ({
      name: k,
      count: subjectMap[k],
      percent: Math.round((subjectMap[k] / (assignedCount || 1)) * 100)
    })).sort((a, b) => b.count - a.count);

    const wilayahStats = Object.values(wilayahMap).map(w => ({
      ...w,
      assignedPercent: Math.round((w.assigned / (w.total || 1)) * 100)
    })).sort((a, b) => b.total - a.total);

    return {
      total,
      assignedCount,
      unassignedCount: total - assignedCount,
      pimpinanCount,
      positionStats,
      subjectStats,
      wilayahStats
    };
  }, [filteredGuru, assignments, wilayahLookup, t]);

  const maxPosVal = Math.max(...stats.positionStats.map(p => p.count), 1);
  const maxSubjectVal = Math.max(...stats.subjectStats.map(s => s.count), 1);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">{t('guru.dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope Filter Bar */}
      <AdvancedFilterBar
        onFilterChange={setFilters}
        userScope={userScope}
        userWilayahId={userWilayahId}
        userCabangId={userCabangId}
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Guru */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-900/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">{t('guru.dashboard.total_tenaga_pendidik')}</span>
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-extrabold mt-3 tracking-tight text-white">
              {stats.total.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-800/40 flex items-center justify-between text-xs text-indigo-200">
            <span>{t('guru.dashboard.terpenugasi')}: <strong className="text-emerald-400">{stats.assignedCount}</strong></span>
            <span>{t('guru.dashboard.belum_tugas')}: <strong className="text-amber-300">{stats.unassignedCount}</strong></span>
          </div>
        </div>

        {/* Card 2: Guru Terpenugasi */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('guru.dashboard.guru_terpenugasi')}</span>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.assignedCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('guru.dashboard.rasio_penugasan')}</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {stats.total > 0 ? Math.round((stats.assignedCount / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Belum Ada Penugasan */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-amber-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('guru.dashboard.belum_ada_tugas')}</span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.unassignedCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('guru.dashboard.persentase')}</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {stats.total > 0 ? Math.round((stats.unassignedCount / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Pimpinan / Kepala Cabang */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('guru.dashboard.pimpinan_kepala')}</span>
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.pimpinanCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{t('guru.dashboard.staff_manajemen')}</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {stats.total > 0 ? Math.round((stats.pimpinanCount / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Infographic Section: Wilayah Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              {t('guru.dashboard.infografik_wilayah_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('guru.dashboard.infografik_wilayah_desc')}
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-full text-xs border border-indigo-100">
            {stats.wilayahStats.length} {t('guru.dashboard.wilayah_terdaftar')}
          </span>
        </div>

        {stats.wilayahStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{t('guru.dashboard.table_wilayah')}</th>
                  <th className="px-4 py-3 text-center">{t('guru.dashboard.table_total_guru')}</th>
                  <th className="px-4 py-3 text-center">{t('guru.dashboard.table_terpenugasi')}</th>
                  <th className="px-4 py-3 text-center">{t('guru.dashboard.table_belum_tugas')}</th>
                  <th className="px-4 py-3 text-center">{t('guru.dashboard.table_persentase')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.wilayahStats.map((w) => (
                  <tr key={w.wilayahName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span>{w.wilayahName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">
                      {w.total} {t('guru.dashboard.guru_unit')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {w.assigned} {t('guru.dashboard.guru_unit')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        {w.unassigned} {t('guru.dashboard.guru_unit')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center min-w-[140px]">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${w.assignedPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-extrabold text-slate-700">{w.assignedPercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-sm">
            {t('guru.dashboard.no_wilayah_data')}
          </div>
        )}
      </div>

      {/* Main Infographics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 1: Distribusi Jabatan Guru (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  {t('guru.dashboard.infografik_jabatan_title')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('guru.dashboard.infografik_jabatan_desc')}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {stats.positionStats.map((p) => {
                const widthPercent = Math.max(Math.round((p.count / maxPosVal) * 100), p.count > 0 ? 4 : 0);
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{p.count} {t('guru.dashboard.personel_unit')}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t('guru.dashboard.total_jabatan')}: <strong>{stats.positionStats.length} {t('guru.dashboard.kategori_unit')}</strong></span>
            <span>{t('guru.dashboard.total_staff')}: <strong>{stats.total} {t('guru.dashboard.orang_unit')}</strong></span>
          </div>
        </div>

        {/* CHART 2: Sebaran Mata Pelajaran Diajar (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  {t('guru.dashboard.sebaran_mapel_title')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('guru.dashboard.sebaran_mapel_desc')}
                </p>
              </div>
            </div>

            {stats.subjectStats.length > 0 ? (
              <div className="space-y-3">
                {stats.subjectStats.slice(0, 7).map((s) => {
                  const widthPercent = Math.max(Math.round((s.count / maxSubjectVal) * 100), s.count > 0 ? 4 : 0);
                  return (
                    <div key={s.name} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{s.name}</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {s.count} {t('guru.dashboard.pengampu_unit')}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                {t('guru.dashboard.no_mapel_data')}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>{t('guru.dashboard.total_mapel_aktif')}:</span>
            <strong className="text-slate-800">{stats.subjectStats.length} {t('guru.dashboard.mapel_unit')}</strong>
          </div>
        </div>

      </div>
    </div>
  );
}
