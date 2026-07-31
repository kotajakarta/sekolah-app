import React, { useState, useMemo } from 'react';
import {
  Users, CheckCircle2, XCircle, AlertTriangle,
  PieChart, BarChart3, ShieldAlert, FileText,
  Search, Filter, Sparkles, AlertCircle, School, BookOpen
} from 'lucide-react';
import AdvancedFilterBar, { FilterState } from '../../../components/AdvancedFilterBar';

export interface ResiduStudent {
  id: string;
  wilayahId: string | null;
  cabangId: string | null;
  biodata?: {
    fullName: string;
  };
  siswaFormal?: {
    kelasId: string;
    kelas?: {
      tingkat: string;
      lembagaMuadalah?: {
        id: string;
      };
    };
  };
  dataDaimi?: {
    grup?: {
      jenis: string;
    };
  };
  grupDaimi?: string;
  nisn: string | null;
  flags: Record<string, 'VALID' | 'EMPTY' | 'DUPLICATE'>;
}

interface ResiduDashboardTabProps {
  students: ResiduStudent[];
  isLoading: boolean;
  userScope?: string;
  userWilayahId?: string;
  userCabangId?: string;
  onRefresh?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  nisn: 'NISN',
  noGlodemy: 'ID Glodemy',
  nisLokal: 'NIS Lokal',
  nik: 'NIK',
  noKk: 'No KK',
  anakKe: 'Anak Ke',
  jumlahSaudara: 'Jml Saudara',
  tempatLahir: 'Tempat Lahir',
  tanggalLahir: 'Tanggal Lahir',
  namaAyah: 'Nama Ayah',
  pekerjaanAyah: 'Pekerjaan Ayah',
  pendidikanAyah: 'Pendidikan Ayah',
  penghasilanAyah: 'Penghasilan Ayah',
  namaIbu: 'Nama Ibu',
  pekerjaanIbu: 'Pekerjaan Ibu',
  pendidikanIbu: 'Pendidikan Ibu',
  penghasilanIbu: 'Penghasilan Ibu',
  address: 'Alamat',
  alamatProvId: 'Provinsi',
  alamatKabId: 'Kabupaten',
  alamatKecId: 'Kecamatan',
  alamatKelId: 'Kelurahan',
  alamatJalan: 'Alamat Jalan',
  phone: 'No Telepon/HP',
  fotoUrl: 'Foto Profil',
  ijazahUrl: 'Scan Ijazah',
  kkUrl: 'Scan KK'
};

export default function ResiduDashboardTab({
  students,
  isLoading,
  userScope = '',
  userWilayahId = '',
  userCabangId = ''
}: ResiduDashboardTabProps) {
  const [filters, setFilters] = useState<FilterState>({
    wilayahId: userScope === 'WILAYAH' || userScope === 'CABANG' ? userWilayahId : '',
    cabangId: userScope === 'CABANG' ? userCabangId : '',
    kelasId: '',
    lembagaMuadalahId: '',
    jenisDaimi: '',
    tingkat: ''
  });

  // Filter students based on scope
  const filteredStudents = useMemo(() => {
    return (Array.isArray(students) ? students : []).filter((s: ResiduStudent) => {
      if (filters.wilayahId && s.wilayahId !== filters.wilayahId) return false;
      if (filters.cabangId && s.cabangId !== filters.cabangId) return false;
      if (filters.kelasId && s.siswaFormal?.kelasId !== filters.kelasId) return false;
      if (filters.lembagaMuadalahId && s.siswaFormal?.kelas?.lembagaMuadalah?.id !== filters.lembagaMuadalahId) return false;
      if (filters.jenisDaimi && s.dataDaimi?.grup?.jenis !== filters.jenisDaimi) return false;
      if (filters.tingkat && s.siswaFormal?.kelas?.tingkat !== filters.tingkat) return false;
      return true;
    });
  }, [students, filters]);

  // Comprehensive analytics calculation
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    if (total === 0) {
      return {
        total: 0,
        fullyValidCount: 0,
        hasEmptyCount: 0,
        hasDuplicateCount: 0,
        avgCompleteness: 0,
        fieldStats: [],
        criticalDocs: {
          nik: { valid: 0, empty: 0, duplicate: 0 },
          nisn: { valid: 0, empty: 0, duplicate: 0 },
          fotoUrl: { valid: 0, empty: 0, duplicate: 0 },
          kkUrl: { valid: 0, empty: 0, duplicate: 0 },
          ijazahUrl: { valid: 0, empty: 0, duplicate: 0 }
        }
      };
    }

    let fullyValidCount = 0;
    let hasEmptyCount = 0;
    let hasDuplicateCount = 0;
    let totalValidFields = 0;
    const totalPossibleFields = total * Object.keys(FIELD_LABELS).length;

    const fieldMap: Record<string, { valid: number; empty: number; duplicate: number }> = {};
    Object.keys(FIELD_LABELS).forEach(k => {
      fieldMap[k] = { valid: 0, empty: 0, duplicate: 0 };
    });

    filteredStudents.forEach(s => {
      const flags = s.flags || {};
      const flagValues = Object.values(flags);
      const hasEmpty = flagValues.includes('EMPTY');
      const hasDuplicate = flagValues.includes('DUPLICATE');

      if (!hasEmpty && !hasDuplicate) fullyValidCount++;
      if (hasEmpty) hasEmptyCount++;
      if (hasDuplicate) hasDuplicateCount++;

      Object.keys(FIELD_LABELS).forEach(key => {
        const flag = flags[key] || 'EMPTY';
        if (flag === 'VALID') {
          fieldMap[key].valid++;
          totalValidFields++;
        } else if (flag === 'DUPLICATE') {
          fieldMap[key].duplicate++;
        } else {
          fieldMap[key].empty++;
        }
      });
    });

    const avgCompleteness = Math.round((totalValidFields / (totalPossibleFields || 1)) * 100);

    const fieldStats = Object.keys(FIELD_LABELS).map(key => ({
      key,
      label: FIELD_LABELS[key],
      valid: fieldMap[key]?.valid || 0,
      empty: fieldMap[key]?.empty || 0,
      duplicate: fieldMap[key]?.duplicate || 0,
      validPercent: Math.round(((fieldMap[key]?.valid || 0) / total) * 100),
      emptyPercent: Math.round(((fieldMap[key]?.empty || 0) / total) * 100),
      duplicatePercent: Math.round(((fieldMap[key]?.duplicate || 0) / total) * 100)
    })).sort((a, b) => (b.empty + b.duplicate) - (a.empty + a.duplicate)); // sorted by highest residu/missing

    return {
      total,
      fullyValidCount,
      hasEmptyCount,
      hasDuplicateCount,
      avgCompleteness,
      fieldStats,
      criticalDocs: {
        nik: fieldMap['nik'] || { valid: 0, empty: 0, duplicate: 0 },
        nisn: fieldMap['nisn'] || { valid: 0, empty: 0, duplicate: 0 },
        fotoUrl: fieldMap['fotoUrl'] || { valid: 0, empty: 0, duplicate: 0 },
        kkUrl: fieldMap['kkUrl'] || { valid: 0, empty: 0, duplicate: 0 },
        ijazahUrl: fieldMap['ijazahUrl'] || { valid: 0, empty: 0, duplicate: 0 }
      }
    };
  }, [filteredStudents]);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Memuat statistik residu & validitas santri...</p>
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
        showDaimiFilter={true}
        showTingkatFilter={true}
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Santri Residu */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-900/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Total Santri Evaluasi</span>
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-extrabold mt-3 tracking-tight text-white">
              {stats.total.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-800/40 flex items-center justify-between text-xs text-indigo-200">
            <span>Rata-rata Kelengkapan</span>
            <strong className="text-emerald-400">{stats.avgCompleteness}%</strong>
          </div>
        </div>

        {/* Card 2: 100% Valid */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Santri 100% Valid</span>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.fullyValidCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Persentase</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {stats.total > 0 ? Math.round((stats.fullyValidCount / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 3: Data Kosong (EMPTY) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-rose-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Memiliki Data Kosong</span>
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.hasEmptyCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Persentase</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              {stats.total > 0 ? Math.round((stats.hasEmptyCount / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Data Duplikat (DUPLICATE) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-amber-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Memiliki Duplikat</span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.hasDuplicateCount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Persentase</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {stats.total > 0 ? Math.round((stats.hasDuplicateCount / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 5: Skor Kualitas Residu */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skor Kelengkapan</span>
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold mt-3 text-slate-800 tracking-tight">
              {stats.avgCompleteness}%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Status Data</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border ${stats.avgCompleteness >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
              {stats.avgCompleteness >= 80 ? 'Baik' : 'Perlu Perbaikan'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 1: Grafik Kelengkapan & Residu per Field (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Peringkat Field Paling Banyak Residu (Kosong / Duplikat)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top field data santri yang memerlukan pengisian atau perbaikan duplikasi
                </p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              {stats.fieldStats.slice(0, 12).map((item) => {
                return (
                  <div key={item.key} className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-emerald-700 font-semibold">{item.valid} Valid ({item.validPercent}%)</span>
                        {item.empty > 0 && <span className="text-rose-600 font-semibold">• {item.empty} Kosong</span>}
                        {item.duplicate > 0 && <span className="text-amber-600 font-semibold">• {item.duplicate} Duplikat</span>}
                      </div>
                    </div>

                    {/* Combined Stacked Bar */}
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                      <div
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                        style={{ width: `${item.validPercent}%` }}
                        title={`Valid: ${item.valid}`}
                      ></div>
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${item.emptyPercent}%` }}
                        title={`Kosong: ${item.empty}`}
                      ></div>
                      <div
                        className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
                        style={{ width: `${item.duplicatePercent}%` }}
                        title={`Duplikat: ${item.duplicate}`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Valid
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Kosong
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Duplikat
            </span>
            <span>Diurutkan berdasarkan residu tertinggi</span>
          </div>
        </div>

        {/* CHART 2: Dokumen Penting & Ringkasan Validasi (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Status Dokumen & Berkas Utama
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validitas berkas kependudukan & foto profil
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Nomor NIK', data: stats.criticalDocs.nik },
                { label: 'Nomor NISN', data: stats.criticalDocs.nisn },
                { label: 'Foto Profil Santri', data: stats.criticalDocs.fotoUrl },
                { label: 'Scan KK', data: stats.criticalDocs.kkUrl },
                { label: 'Scan Ijazah', data: stats.criticalDocs.ijazahUrl },
              ].map((doc) => {
                const total = stats.total || 1;
                const vPct = Math.round((doc.data.valid / total) * 100);
                const ePct = Math.round((doc.data.empty / total) * 100);
                const dPct = Math.round((doc.data.duplicate / total) * 100);

                return (
                  <div key={doc.label} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{doc.label}</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {vPct}% Valid
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${vPct}%` }}></div>
                      <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${ePct}%` }}></div>
                      <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${dPct}%` }}></div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span className="text-emerald-700">{doc.data.valid} Valid</span>
                      <span className="text-rose-600">{doc.data.empty} Belum Diunggah</span>
                      <span className="text-amber-600">{doc.data.duplicate} Duplikat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Tindak Lanjut Residu Data:
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Gunakan tab <strong>Data Residu Santri</strong> untuk menyaring data yang terindikasi Kosong atau Duplikat dan perbarui biodata santri secara berkala.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
