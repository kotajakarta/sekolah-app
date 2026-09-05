import React, { useState, useMemo } from 'react';
import {
  BookOpen, Users, UserCheck, AlertTriangle, CheckCircle2,
  BarChart3, Building2, MapPin, ShieldAlert, Sparkles, Filter,
  School, HelpCircle, AlertCircle
} from 'lucide-react';

interface PenugasanDashboardTabProps {
  assignments: any[];
  guruList: any[];
  kelasList: any[];
  mapelList: any[];
  wilayahs: any[];
  cabangList: any[];
  isLoading: boolean;
  userScope?: string;
  userWilayahId?: string;
  userCabangId?: string;
}

export default function PenugasanDashboardTab({
  assignments,
  guruList,
  kelasList,
  mapelList,
  wilayahs,
  cabangList,
  isLoading,
  userScope = '',
  userWilayahId = '',
  userCabangId = ''
}: PenugasanDashboardTabProps) {
  const [filterWilayah, setFilterWilayah] = useState(
    userScope === 'WILAYAH' || userScope === 'CABANG' ? userWilayahId : ''
  );
  const [filterCabang, setFilterCabang] = useState(
    userScope === 'CABANG' ? userCabangId : ''
  );

  const cabangById = useMemo(() => new Map((cabangList || []).map((c: any) => [c.id, c])), [cabangList]);

  const filteredBranches = useMemo(() => {
    if (userScope === 'WILAYAH') {
      return cabangList.filter((c: any) => c.wilayahId === userWilayahId);
    }
    if (filterWilayah) {
      return cabangList.filter((c: any) => c.wilayahId === filterWilayah);
    }
    return cabangList;
  }, [cabangList, filterWilayah, userScope, userWilayahId]);

  // Filter assignments based on regional selection
  const filteredAssignments = useMemo(() => {
    return (assignments || []).filter((asg: any) => {
      const matchWilayah = !filterWilayah || cabangById.get(asg.cabangId)?.wilayahId === filterWilayah;
      const matchCabang = !filterCabang || asg.cabangId === filterCabang;
      return matchWilayah && matchCabang;
    });
  }, [assignments, filterWilayah, filterCabang, cabangById]);

  // Required core subjects
  const requiredNames = ['matematika', 'bahasa indonesia', 'bahasa inggris', 'ipa', 'pkn'];
  const requiredMapel = useMemo(() => {
    return (mapelList || []).filter((m: any) => {
      const nameLower = m.name?.toLowerCase().trim() || '';
      return requiredNames.some(req =>
        nameLower === req ||
        nameLower.includes(req) ||
        (req === 'pkn' && (nameLower.includes('pancasila') || nameLower.includes('kewarganegaraan')))
      );
    });
  }, [mapelList]);

  // Missing subjects per class calculation
  const missingCoverageList = useMemo(() => {
    if (!mapelList.length || !kelasList.length) return [];

    const activeClasses = kelasList.filter((k: any) => {
      if (filterCabang) return k.cabangId === filterCabang;
      if (filterWilayah) {
        const branch = cabangList.find((c: any) => c.id === k.cabangId);
        return branch?.wilayahId === filterWilayah;
      }
      return true;
    });

    const result: Array<{ mapel: any; missingClasses: any[] }> = [];

    requiredMapel.forEach((mapel: any) => {
      const missingClassesForMapel: any[] = [];
      activeClasses.forEach((kelas: any) => {
        const hasAssignment = (assignments || []).some(
          (asg: any) => asg.mataPelajaranId === mapel.id && asg.kelasId === kelas.id
        );
        if (!hasAssignment) {
          missingClassesForMapel.push(kelas);
        }
      });

      if (missingClassesForMapel.length > 0) {
        result.push({
          mapel,
          missingClasses: missingClassesForMapel,
        });
      }
    });

    return result.sort((a, b) => b.missingClasses.length - a.missingClasses.length);
  }, [assignments, mapelList, kelasList, requiredMapel, filterWilayah, filterCabang, cabangList]);

  // Regional progress statistics
  const progressStats = useMemo(() => {
    if (!mapelList.length || !kelasList.length) {
      return { cabangProgress: [], totalSlots: 0, filledSlots: 0 };
    }

    const requiredMapelIds = new Set(requiredMapel.map((m: any) => m.id));

    let totalSlots = 0;
    let filledSlots = 0;

    const cabangProgress = filteredBranches.map((cabang: any) => {
      const classesInCabang = kelasList.filter((k: any) => k.cabangId === cabang.id);
      const totalNeeded = classesInCabang.length * requiredMapelIds.size;
      
      let assignedCount = 0;
      classesInCabang.forEach((kelas: any) => {
        (assignments || []).forEach((asg: any) => {
          if (asg.kelasId === kelas.id && requiredMapelIds.has(asg.mataPelajaranId)) {
            assignedCount++;
          }
        });
      });

      totalSlots += totalNeeded;
      filledSlots += assignedCount;

      const percent = totalNeeded > 0 ? Math.round((assignedCount / totalNeeded) * 100) : 0;
      return {
        id: cabang.id,
        name: cabang.name,
        totalNeeded,
        assignedCount,
        percent,
        kelasCount: classesInCabang.length
      };
    }).sort((a, b) => b.percent - a.percent);

    return { cabangProgress, totalSlots, filledSlots };
  }, [filteredBranches, kelasList, mapelList, requiredMapel, assignments]);

  // Teacher teaching load breakdown
  const teacherLoadStats = useMemo(() => {
    const teacherMap = new Map<string, { guruName: string; position: string; count: number }>();

    (guruList || []).forEach((g: any) => {
      teacherMap.set(g.id, {
        guruName: g.name,
        position: g.position || 'Guru Mapel',
        count: 0
      });
    });

    (filteredAssignments || []).forEach((asg: any) => {
      const staffId = asg.staffId || asg.staff?.id;
      if (staffId && teacherMap.has(staffId)) {
        teacherMap.get(staffId)!.count++;
      }
    });

    const teacherList = Array.from(teacherMap.values());
    const assignedTeachers = teacherList.filter(t => t.count > 0).length;
    const unassignedTeachers = teacherList.filter(t => t.count === 0).length;

    return {
      teacherList: teacherList.sort((a, b) => b.count - a.count),
      assignedTeachers,
      unassignedTeachers
    };
  }, [guruList, filteredAssignments]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Memuat statistik & analisis penugasan guru...</p>
      </div>
    );
  }

  const overallCoveragePercent = progressStats.totalSlots > 0 
    ? Math.round((progressStats.filledSlots / progressStats.totalSlots) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Scope Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-bold text-slate-800">Filter Analisis Penugasan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Wilayah Filter */}
          {userScope === 'GLOBAL' && (
            <select
              value={filterWilayah}
              onChange={(e) => {
                setFilterWilayah(e.target.value);
                setFilterCabang('');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Wilayah</option>
              {(wilayahs || []).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}

          {/* Cabang Filter */}
          {(userScope === 'GLOBAL' || userScope === 'WILAYAH') && (
            <select
              value={filterCabang}
              onChange={(e) => setFilterCabang(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Cabang</option>
              {filteredBranches.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Penugasan Aktif */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-900/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Total Penugasan</span>
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-extrabold mt-3 tracking-tight text-white">
              {filteredAssignments.length.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-800/40 flex items-center justify-between text-xs text-indigo-200">
            <span>Rata-rata / Guru</span>
            <strong className="text-emerald-400">
              {teacherLoadStats.assignedTeachers > 0 
                ? (filteredAssignments.length / teacherLoadStats.assignedTeachers).toFixed(1) 
                : 0} Mapel
            </strong>
          </div>
        </div>

        {/* Card 2: Pemenuhan Mapel Utama */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pemenuhan Mapel Utama</span>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {overallCoveragePercent}%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Slot Terisi</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {progressStats.filledSlots} / {progressStats.totalSlots}
            </span>
          </div>
        </div>

        {/* Card 3: Kekurangan Pengampu */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-rose-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kekurangan Pengampu</span>
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {missingCoverageList.reduce((acc, curr) => acc + curr.missingClasses.length, 0)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Mapel Terdampak</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              {missingCoverageList.length} Mapel Utama
            </span>
          </div>
        </div>

        {/* Card 4: Guru Mengajar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Guru Aktif Mengajar</span>
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {teacherLoadStats.assignedTeachers}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Belum Ada Tugas</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {teacherLoadStats.unassignedTeachers} Guru
            </span>
          </div>
        </div>
      </div>

      {/* Main Infographic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 1: Pemenuhan Guru Mapel Utama Per Cabang (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Ketersediaan Guru Mapel Utama Per Cabang
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cakupan pengampu 5 mapel utama (Matematika, B. Indonesia, B. Inggris, IPA, PKN) per cabang
                </p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {progressStats.cabangProgress.length > 0 ? (
                progressStats.cabangProgress.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-[11px] text-slate-400">({item.kelasCount} Kelas)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{item.assignedCount} / {item.totalNeeded} Slot</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.percent >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.percent >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {item.percent}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.percent >= 100 ? 'bg-emerald-500' :
                          item.percent >= 70 ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`}
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada data cabang untuk ditampilkan.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rasio Mapel Utama: <strong>{overallCoveragePercent}% Terpenuhi</strong></span>
            <span>Total Slot Dibutuhkan: <strong>{progressStats.totalSlots} Slot</strong></span>
          </div>
        </div>

        {/* CHART 2: Warning Infographic - Mapel & Kelas Kekurangan Guru (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Kelas Kekurangan Guru Mapel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar kelas formal yang belum memiliki pengampu mapel utama
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {missingCoverageList.length > 0 ? (
                missingCoverageList.map(({ mapel, missingClasses }) => (
                  <div key={mapel.id} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                        {mapel.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        {missingClasses.length} Kelas Belum Memiliki Guru
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {missingClasses.slice(0, 6).map((k: any) => (
                        <span key={k.id} className="px-2 py-0.5 bg-white border border-rose-200 text-slate-700 rounded text-[10px] font-semibold">
                          {k.name}
                        </span>
                      ))}
                      {missingClasses.length > 6 && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                          +{missingClasses.length - 6} Lainnya
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-emerald-600 text-xs font-semibold flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span>Semua mata pelajaran utama telah memiliki pengampu di seluruh kelas!</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Rekomendasi Penugasan:
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-800">
              Gunakan tab <strong>Matriks & Data Penugasan</strong> untuk menugaskan guru ke kelas-kelas yang masih mengalami kekurangan pengampu di atas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
