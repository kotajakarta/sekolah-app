import React, { useState } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetKehadiran, KehadiranStatus } from '../../features/portal/hooks/useGetKehadiran';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  HeartPulse,
  CalendarCheck,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Percent,
  Sparkles
} from 'lucide-react';

function toDateInput(d: Date) {
  return d.toLocaleDateString('sv-SE');
}

function firstDayOfMonth() {
  const now = new Date();
  return toDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
}

function todayStr() {
  return toDateInput(new Date());
}

const STATUS_STYLES: Record<KehadiranStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  HADIR: { label: 'Hadir', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  SAKIT: { label: 'Sakit', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: HeartPulse },
  IZIN: { label: 'Izin', className: 'bg-sky-50 text-sky-700 border-sky-200', icon: Clock },
  ALPA: { label: 'Alpa', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

export default function PortalKehadiran() {
  const { selectedStudentId, isLoading, isError } = usePortalStudent();
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(todayStr());
  const [activeTab, setActiveTab] = useState<'harian' | 'silabus'>('harian');

  const { data, isLoading: isKehadiranLoading } = useGetKehadiran(selectedStudentId, startDate, endDate);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Memuat data presensi...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-rose-600 text-center font-medium">
        Gagal memuat data presensi. Silakan muat ulang.
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  const harianRecords = data?.harian?.records ?? data?.records ?? [];
  const harianTally = data?.harian?.tally ?? data?.tally ?? { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  const totalHarian = harianTally.hadir + harianTally.sakit + harianTally.izin + harianTally.alpa;
  const persenHarian = totalHarian > 0 ? Math.round((harianTally.hadir / totalHarian) * 100) : 100;

  const silabusRecords = data?.silabus?.records ?? [];
  const silabusTally = data?.silabus?.tally ?? { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  const totalSilabus = silabusTally.hadir + silabusTally.sakit + silabusTally.izin + silabusTally.alpa;
  const persenSilabus = totalSilabus > 0 ? Math.round((silabusTally.hadir / totalSilabus) * 100) : 100;

  const currentTally = activeTab === 'harian' ? harianTally : silabusTally;
  const currentPersen = activeTab === 'harian' ? persenHarian : persenSilabus;

  return (
    <div className="space-y-6">
      {/* ── CARD HEADER & FILTER TANGGAL ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Presensi & Kehadiran Santri
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Rekapitulasi absensi kegiatan harian pesantren dan absensi tatap muka silabus pembelajaran.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 px-1">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 px-1">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* ── TAB SELECTOR (HARIAN VS SILABUS) ── */}
        <div className="mt-8 flex items-center gap-3 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('harian')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'harian'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Absensi Harian & Program ({harianRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('silabus')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'silabus'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Absensi Pembelajaran & Silabus ({silabusRecords.length})
          </button>
        </div>
      </div>

      {/* ── STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Persentase Card */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md shadow-emerald-600/15 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
              Tingkat Kehadiran
            </span>
            <Percent className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="my-2">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">{currentPersen}%</p>
            <p className="text-[11px] text-emerald-100 mt-1">
              {activeTab === 'harian' ? 'Kehadiran Program Harian' : 'Kehadiran Tatap Muka Mapel'}
            </p>
          </div>
          <div className="w-full bg-emerald-800/40 rounded-full h-1.5 overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${currentPersen}%` }}></div>
          </div>
        </div>

        {/* Total Hadir */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Hadir</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{currentTally.hadir}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sesi Kehadiran</p>
        </div>

        {/* Total Sakit */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Sakit</p>
            <HeartPulse className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{currentTally.sakit}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sesi Sakit</p>
        </div>

        {/* Total Izin */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Izin</p>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{currentTally.izin}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sesi Izin</p>
        </div>

        {/* Total Alpa */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Alpa</p>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{currentTally.alpa}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tanpa Keterangan</p>
        </div>
      </div>

      {/* ── RINCIAN TAB 1: ABSENSI HARIAN ── */}
      {activeTab === 'harian' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Riwayat Presensi Harian & Program Pesantren
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              Total {harianRecords.length} Catatan
            </span>
          </div>

          {isKehadiranLoading ? (
            <div className="p-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Memuat data presensi harian...
            </div>
          ) : harianRecords.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Belum ada catatan presensi harian pada rentang tanggal ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                    <th className="py-3 pr-4">Tanggal</th>
                    <th className="py-3 pr-4">Program / Sesi</th>
                    <th className="py-3 pr-4">Catatan</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {harianRecords.map((r) => {
                    const style = STATUS_STYLES[r.status] || STATUS_STYLES.HADIR;
                    const Icon = style.icon;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-4 font-semibold text-slate-800 whitespace-nowrap">
                          {new Date(r.program.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 pr-4 font-medium text-slate-700">
                          {r.program.name}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-500">
                          {r.catatan || '-'}
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${style.className}`}>
                            <Icon className="w-3.5 h-3.5" /> {style.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RINCIAN TAB 2: ABSENSI PEMBELAJARAN & SILABUS ── */}
      {activeTab === 'silabus' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Riwayat Absensi Pembelajaran & Kontrol Silabus
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Catatan kehadiran per mata pelajaran dan materi pembelajaran yang diajarkan di kelas.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 shrink-0">
              Total {silabusRecords.length} Pertemuan
            </span>
          </div>

          {isKehadiranLoading ? (
            <div className="p-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Memuat data presensi silabus...
            </div>
          ) : silabusRecords.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Belum ada catatan presensi pembelajaran/silabus pada rentang tanggal ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                    <th className="py-3 pr-4">Tanggal</th>
                    <th className="py-3 pr-4">Mata Pelajaran</th>
                    <th className="py-3 pr-4">Bab & Materi (Silabus)</th>
                    <th className="py-3 pr-4">Kelas</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {silabusRecords.map((r) => {
                    const style = STATUS_STYLES[r.status] || STATUS_STYLES.HADIR;
                    const Icon = style.icon;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pr-4 font-semibold text-slate-800 whitespace-nowrap">
                          {new Date(r.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 pr-4 font-bold text-slate-800">
                          {r.mataPelajaran?.name || 'Mata Pelajaran'}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-600">
                          {r.silabus ? (
                            <div>
                              <span className="font-semibold text-slate-800">{r.silabus.bab}</span>
                              <p className="text-slate-500 text-[11px] mt-0.5">{r.silabus.section}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Pertemuan Reguler</span>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-xs font-semibold text-slate-600">
                          {r.kelas?.name || '-'}
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${style.className}`}>
                            <Icon className="w-3.5 h-3.5" /> {style.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
