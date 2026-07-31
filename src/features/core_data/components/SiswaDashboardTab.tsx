import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, ShieldCheck, School, BookOpen,
  PieChart, BarChart3, TrendingUp, CheckCircle2,
  FileCheck, Sparkles, Filter, Award, AlertCircle,
  Building2, MapPin
} from 'lucide-react';
import { Student } from '../hooks/useGetStudents';
import AdvancedFilterBar, { FilterState } from '../../../components/AdvancedFilterBar';

interface SiswaDashboardTabProps {
  students: Student[];
  isLoading: boolean;
  userScope?: string;
  userWilayahId?: string;
  userCabangId?: string;
}

const calculateProgress = (student: Student) => {
  if (!student || !student.biodata) return 0;
  const biodata = student.biodata;
  const fields = [
    biodata.fullName,
    biodata.nik,
    biodata.nisn,
    biodata.tempatLahir,
    biodata.tanggalLahir,
    biodata.jenisKelamin,
    biodata.namaIbu,
    biodata.namaAyah,
    biodata.phone,
    biodata.address || biodata.alamatJalan,
    biodata.fotoUrl,
    biodata.ijazahUrl,
    biodata.kkUrl
  ];
  const filled = fields.filter(val => val !== null && val !== undefined && val !== '').length;
  return Math.round((filled / fields.length) * 100);
};

const getGenderKey = (jk?: string | null) => {
  if (!jk) return 'TIDAK_DIKETAHUI';
  const u = jk.toUpperCase().trim();
  if (u.includes('LAKI') || u === 'L') return 'LAKI_LAKI';
  if (u.includes('PEREMPUAN') || u === 'P') return 'PEREMPUAN';
  return 'TIDAK_DIKETAHUI';
};

const getTingkatKey = (sf?: any) => {
  if (!sf || !sf.kelas) return 'Non Muadalah';
  const t = (sf.kelas.tingkat || sf.kelas.name || '').toUpperCase().trim();
  if (t.includes('12') || t.includes('XII')) return '12';
  if (t.includes('11') || t.includes('XI')) return '11';
  if (t.includes('10') || t.includes('X')) return '10';
  if (t.includes('9') || t.includes('IX')) return '9';
  if (t.includes('8') || t.includes('VIII')) return '8';
  if (t.includes('7') || t.includes('VII')) return '7';
  return sf.kelas.tingkat || 'Lainnya';
};

const getDaimiKey = (s: Student) => {
  const d = s.dataDaimi?.grup?.jenis || s.grupDaimi;
  if (!d) return 'Tanpa Grup';
  const u = d.toUpperCase().trim();
  if (u.includes('HAZIRLIK')) return 'HAZIRLIK';
  if (u.includes('HAFIZLIK')) return 'HAFIZLIK';
  if (u.includes('IBTIDAI')) return 'IBTIDAI';
  if (u.includes('IHZARI')) return 'IHZARI';
  return d;
};

export default function SiswaDashboardTab({
  students,
  isLoading,
  userScope = '',
  userWilayahId = '',
  userCabangId = ''
}: SiswaDashboardTabProps) {
  const [filters, setFilters] = useState<FilterState>({
    wilayahId: userScope === 'WILAYAH' || userScope === 'CABANG' ? userWilayahId : '',
    cabangId: userScope === 'CABANG' ? userCabangId : '',
    kelasId: '',
    lembagaMuadalahId: '',
    jenisDaimi: '',
    tingkat: ''
  });

  // Filter students dynamically based on selected filters
  const filteredStudents = useMemo(() => {
    return (Array.isArray(students) ? students : []).filter((s: Student) => {
      if (filters.wilayahId && s.wilayahId !== filters.wilayahId) return false;
      if (filters.cabangId && s.cabangId !== filters.cabangId) return false;
      if (filters.kelasId && s.siswaFormal?.kelasId !== filters.kelasId) return false;
      if (filters.lembagaMuadalahId && s.siswaFormal?.kelas?.lembagaMuadalah?.id !== filters.lembagaMuadalahId) return false;
      if (filters.jenisDaimi && s.dataDaimi?.grup?.jenis !== filters.jenisDaimi) return false;
      if (filters.tingkat && s.siswaFormal?.kelas?.tingkat !== filters.tingkat) return false;
      return true;
    });
  }, [students, filters]);

  // Analytical Calculations
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) {
      return {
        total: 0,
        aktif: 0,
        nonAktif: 0,
        laki: 0,
        perempuan: 0,
        tidakDiketahuiJk: 0,
        formalCount: 0,
        nonFormalCount: 0,
        daimiCount: 0,
        tanpaDaimiCount: 0,
        lengkapCount: 0,
        tingkatMap: { '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0, 'Non Muadalah': 0 },
        wusthaTotal: 0,
        ulyaTotal: 0,
        daimiMap: { HAZIRLIK: 0, HAFIZLIK: 0, IBTIDAI: 0, IHZARI: 0, 'Tanpa Grup': 0 },
        poolMap: { AKTIF_CABANG: 0, TERSEDIA: 0, MUTASI: 0, LAINNYA: 0 },
        docCompleteness: {
          foto: 0,
          nik: 0,
          nisn: 0,
          kk: 0,
          ijazah: 0,
          akte: 0
        }
      };
    }

    let aktif = 0;
    let laki = 0;
    let perempuan = 0;
    let tidakDiketahuiJk = 0;
    let formalCount = 0;
    let daimiCount = 0;
    let lengkapCount = 0;

    const tingkatMap: Record<string, number> = {
      '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0, 'Non Muadalah': 0
    };

    const daimiMap: Record<string, number> = {
      HAZIRLIK: 0, HAFIZLIK: 0, IBTIDAI: 0, IHZARI: 0, 'Tanpa Grup': 0
    };

    const poolMap: Record<string, number> = {
      AKTIF_CABANG: 0, TERSEDIA: 0, MUTASI: 0, LAINNYA: 0
    };

    const docCompleteness = {
      foto: 0,
      nik: 0,
      nisn: 0,
      kk: 0,
      ijazah: 0,
      akte: 0
    };

    filteredStudents.forEach((s) => {
      if (s.isActive !== false) aktif++;

      const jk = getGenderKey(s.biodata?.jenisKelamin);
      if (jk === 'LAKI_LAKI') laki++;
      else if (jk === 'PEREMPUAN') perempuan++;
      else tidakDiketahuiJk++;

      if (s.siswaFormal?.kelas) formalCount++;

      const dKey = getDaimiKey(s);
      if (daimiMap[dKey] !== undefined) {
        daimiMap[dKey]++;
      } else {
        daimiMap[dKey] = 1;
      }
      if (dKey !== 'Tanpa Grup') daimiCount++;

      const tKey = getTingkatKey(s.siswaFormal);
      if (tingkatMap[tKey] !== undefined) {
        tingkatMap[tKey]++;
      } else {
        tingkatMap['Non Muadalah']++;
      }

      const poolKey = s.statusPool || 'LAINNYA';
      if (poolMap[poolKey] !== undefined) {
        poolMap[poolKey]++;
      } else {
        poolMap.LAINNYA++;
      }

      if (calculateProgress(s) >= 80) lengkapCount++;

      if (s.biodata?.fotoUrl) docCompleteness.foto++;
      if (s.biodata?.nik) docCompleteness.nik++;
      if (s.biodata?.nisn) docCompleteness.nisn++;
      if (s.biodata?.kkUrl) docCompleteness.kk++;
      if (s.biodata?.ijazahUrl) docCompleteness.ijazah++;
      if (s.biodata?.akteUrl) docCompleteness.akte++;
    });

    const wusthaTotal = (tingkatMap['7'] || 0) + (tingkatMap['8'] || 0) + (tingkatMap['9'] || 0);
    const ulyaTotal = (tingkatMap['10'] || 0) + (tingkatMap['11'] || 0) + (tingkatMap['12'] || 0);

    return {
      total,
      aktif,
      nonAktif: total - aktif,
      laki,
      perempuan,
      tidakDiketahuiJk,
      formalCount,
      nonFormalCount: total - formalCount,
      daimiCount,
      tanpaDaimiCount: total - daimiCount,
      lengkapCount,
      tingkatMap,
      wusthaTotal,
      ulyaTotal,
      daimiMap,
      poolMap,
      docCompleteness
    };
  }, [filteredStudents]);

  const maxTingkatVal = Math.max(...Object.values(stats.tingkatMap), 1);
  const maxDaimiVal = Math.max(...Object.values(stats.daimiMap), 1);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Memuat data analisis & statistik santri...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <AdvancedFilterBar
        onFilterChange={setFilters}
        userScope={userScope}
        userWilayahId={userWilayahId}
        userCabangId={userCabangId}
        showDaimiFilter={true}
        showTingkatFilter={true}
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Santri */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-900/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Total Santri</span>
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-extrabold mt-3 tracking-tight text-white">
              {stats.total.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-800/40 flex items-center justify-between text-xs text-indigo-200">
            <span>Aktif: <strong className="text-emerald-400">{stats.aktif}</strong></span>
            <span>Non-Aktif: <strong className="text-slate-400">{stats.nonAktif}</strong></span>
          </div>
        </div>

        {/* Card 2: Laki-laki */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Santri Laki-Laki</span>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.laki.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Persentase</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {stats.total > 0 ? Math.round((stats.laki / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Perempuan */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-pink-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Santri Perempuan</span>
              <div className="p-2 bg-pink-50 rounded-xl text-pink-600 border border-pink-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.perempuan.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Persentase</span>
            <span className="font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
              {stats.total > 0 ? Math.round((stats.perempuan / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Formal / Muadalah */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Siswa Muadalah</span>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <School className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.formalCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Non-Muadalah</span>
            <span className="font-semibold text-slate-600">{stats.nonFormalCount}</span>
          </div>
        </div>

        {/* Card 5: Kelengkapan Profil */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-amber-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Berkas Lengkap ≥80%</span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.lengkapCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Ketercapaian</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {stats.total > 0 ? Math.round((stats.lengkapCount / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Grafik & Distribusi Tingkat (Grade Level) - 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Grafik & Distribusi Tingkat Santri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sebaran jumlah santri per tingkat kelas muadalah (Wustha 7-9 & Ulya 10-12)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Wustha: {stats.wusthaTotal}
                </span>
                <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Ulya: {stats.ulyaTotal}
                </span>
              </div>
            </div>

            {/* Tingkat Bars */}
            <div className="space-y-4">
              {[
                { label: 'Tingkat 7 (VII Wustha)', key: '7', color: 'from-blue-500 to-indigo-600', badgeBg: 'bg-blue-50 text-blue-700' },
                { label: 'Tingkat 8 (VIII Wustha)', key: '8', color: 'from-blue-600 to-indigo-700', badgeBg: 'bg-blue-50 text-blue-700' },
                { label: 'Tingkat 9 (IX Wustha)', key: '9', color: 'from-indigo-500 to-indigo-700', badgeBg: 'bg-indigo-50 text-indigo-700' },
                { label: 'Tingkat 10 (X Ulya)', key: '10', color: 'from-emerald-500 to-teal-600', badgeBg: 'bg-emerald-50 text-emerald-700' },
                { label: 'Tingkat 11 (XI Ulya)', key: '11', color: 'from-emerald-600 to-teal-700', badgeBg: 'bg-emerald-50 text-emerald-700' },
                { label: 'Tingkat 12 (XII Ulya)', key: '12', color: 'from-teal-500 to-teal-700', badgeBg: 'bg-teal-50 text-teal-700' },
                { label: 'Non Muadalah / Lainnya', key: 'Non Muadalah', color: 'from-slate-400 to-slate-500', badgeBg: 'bg-slate-100 text-slate-700' },
              ].map((item) => {
                const count = stats.tingkatMap[item.key] || 0;
                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                const widthPercent = Math.max(Math.round((count / maxTingkatVal) * 100), count > 0 ? 4 : 0);

                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{count} Santri</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.badgeBg}`}>
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rata-rata Santri per Tingkat: <strong>{Math.round(stats.total / 7)} Santri</strong></span>
            <span>Total Muadalah: <strong>{stats.wusthaTotal + stats.ulyaTotal} ({stats.total > 0 ? Math.round(((stats.wusthaTotal + stats.ulyaTotal) / stats.total) * 100) : 0}%)</strong></span>
          </div>
        </div>

        {/* CHART 2: Grafik & Distribusi Grup Daimi - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Grup Daimi (Pesantren)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi kelompok bimbingan & program daimi santri
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {stats.daimiCount} Terdaftar
              </span>
            </div>

            <div className="space-y-4">
              {[
                { name: 'HAZIRLIK', desc: 'Program Persiapan', color: 'bg-emerald-500', barColor: 'from-emerald-500 to-green-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { name: 'HAFIZLIK', desc: 'Program Tahfidz Al-Qur\'an', color: 'bg-blue-500', barColor: 'from-blue-500 to-indigo-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
                { name: 'IBTIDAI', desc: 'Program Tingkat Ibtidai', color: 'bg-purple-500', barColor: 'from-purple-500 to-violet-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
                { name: 'IHZARI', desc: 'Program Matrikulasi Ihzari', color: 'bg-amber-500', barColor: 'from-amber-500 to-orange-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
                { name: 'Tanpa Grup', desc: 'Belum Terdaftar Grup Daimi', color: 'bg-slate-400', barColor: 'from-slate-400 to-slate-500', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
              ].map((g) => {
                const count = stats.daimiMap[g.name] || 0;
                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                const widthPercent = Math.max(Math.round((count / maxDaimiVal) * 100), count > 0 ? 4 : 0);

                return (
                  <div key={g.name} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${g.color}`}></div>
                        <div>
                          <span className="text-xs font-bold text-slate-800">{g.name}</span>
                          <span className="text-[11px] text-slate-400 block leading-tight">{g.desc}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-800">{count} Santri</span>
                        <span className={`block text-[10px] font-bold px-1.5 py-0.2 rounded border text-center mt-0.5 ${g.badge}`}>
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${g.barColor} transition-all duration-500`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Rasio Daimi: <strong>{stats.total > 0 ? Math.round((stats.daimiCount / stats.total) * 100) : 0}% Santri</strong></span>
            <span>Tanpa Grup: <strong>{stats.tanpaDaimiCount} Santri</strong></span>
          </div>
        </div>

      </div>

      {/* SECONDARY VISUALIZATIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 3: Jenis Kelamin (Gender Ratio & Breakdown) - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Rasio & Jenis Kelamin
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Komposisi santri Laki-laki vs Perempuan
                </p>
              </div>
            </div>

            {/* Gender Donut/Visual Bar */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
              <div className="flex items-center justify-around text-center py-2">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg mx-auto shadow-inner">
                    L
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mt-2">Laki-Laki</span>
                  <span className="text-sm font-extrabold text-blue-600">{stats.laki}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {stats.total > 0 ? Math.round((stats.laki / stats.total) * 100) : 0}%
                  </span>
                </div>

                <div className="text-slate-300 font-light text-2xl">:</div>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-lg mx-auto shadow-inner">
                    P
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mt-2">Perempuan</span>
                  <span className="text-sm font-extrabold text-pink-600">{stats.perempuan}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {stats.total > 0 ? Math.round((stats.perempuan / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Combined Progress Bar */}
              <div className="space-y-1">
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-l-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.laki / stats.total) * 100 : 0}%` }}
                    title={`Laki-laki: ${stats.laki}`}
                  ></div>
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-r-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.perempuan / stats.total) * 100 : 0}%` }}
                    title={`Perempuan: ${stats.perempuan}`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 px-1">
                  <span>Laki-Laki ({stats.total > 0 ? Math.round((stats.laki / stats.total) * 100) : 0}%)</span>
                  <span>Perempuan ({stats.total > 0 ? Math.round((stats.perempuan / stats.total) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            {stats.tidakDiketahuiJk > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Ada <strong>{stats.tidakDiketahuiJk}</strong> santri belum mengisi data jenis kelamin.</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Rasio L : P</span>
            <strong className="text-slate-800">
              {stats.perempuan > 0 ? (stats.laki / stats.perempuan).toFixed(1) : stats.laki} : 1
            </strong>
          </div>
        </div>

        {/* CHART 4: Status Pool Santri - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Status Pool Santri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status alokasi santri di cabang, pool, atau mutasi
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Aktif di Cabang', key: 'AKTIF_CABANG', count: stats.poolMap['AKTIF_CABANG'] || 0, badge: 'bg-green-100 text-green-800 border-green-200', iconBg: 'bg-green-50 text-green-600' },
                { title: 'Tersedia di Pool', key: 'TERSEDIA', count: stats.poolMap['TERSEDIA'] || 0, badge: 'bg-blue-100 text-blue-800 border-blue-200', iconBg: 'bg-blue-50 text-blue-600' },
                { title: 'Status Mutasi / Lepas', key: 'MUTASI', count: stats.poolMap['MUTASI'] || 0, badge: 'bg-amber-100 text-amber-800 border-amber-200', iconBg: 'bg-amber-50 text-amber-600' },
                { title: 'Lainnya / Residu', key: 'LAINNYA', count: stats.poolMap['LAINNYA'] || 0, badge: 'bg-slate-100 text-slate-800 border-slate-200', iconBg: 'bg-slate-50 text-slate-600' }
              ].map((p) => {
                const percent = stats.total > 0 ? Math.round((p.count / stats.total) * 100) : 0;
                return (
                  <div key={p.key} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${p.iconBg}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{p.title}</span>
                        <span className="text-[10px] text-slate-500">{p.key.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-800">{p.count}</span>
                      <span className={`block text-[10px] font-bold px-1.5 py-0.2 rounded border ${p.badge}`}>
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Santri Aktif Cabang:</span>
            <strong className="text-emerald-600">{stats.poolMap['AKTIF_CABANG'] || 0} Santri</strong>
          </div>
        </div>

        {/* CHART 5: Kelengkapan Berkas / Dokumen Santri - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Kelengkapan Berkas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Persentase ketersediaan dokumen utama santri
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Nomor NIK (KTP/KK)', count: stats.docCompleteness.nik },
                { label: 'Nomor NISN Nasional', count: stats.docCompleteness.nisn },
                { label: 'Foto Profil Santri', count: stats.docCompleteness.foto },
                { label: 'Scan Kartu Keluarga (KK)', count: stats.docCompleteness.kk },
                { label: 'Scan Ijazah Terakhir', count: stats.docCompleteness.ijazah },
                { label: 'Scan Akte Kelahiran', count: stats.docCompleteness.akte },
              ].map((doc) => {
                const percent = stats.total > 0 ? Math.round((doc.count / stats.total) * 100) : 0;
                return (
                  <div key={doc.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">{doc.label}</span>
                      <span className="font-bold text-slate-800">{doc.count} ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Verifikasi Berkas:</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 text-[11px]">
              {stats.lengkapCount} Santri Terverifikasi
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
