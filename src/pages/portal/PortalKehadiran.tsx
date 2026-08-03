import React, { useState } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetKehadiran, KehadiranStatus } from '../../features/portal/hooks/useGetKehadiran';
import { CheckCircle2, XCircle, Clock, Loader2, HeartPulse, Calendar, CalendarCheck } from 'lucide-react';

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

  const { data, isLoading: isKehadiranLoading } = useGetKehadiran(selectedStudentId, startDate, endDate);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat data presensi...
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

  const tally = data?.tally ?? { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  const records = data?.records ?? [];

  return (
    <div className="space-y-6">
      {/* ── CARD FILTER TANGGAL ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <CalendarCheck className="w-6 h-6 text-indigo-600" /> Presensi & Kehadiran Santri
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau rekapitulasi dan catatan riwayat presensi harian santri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Hadir</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{tally.hadir}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Total Sakit</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{tally.sakit}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Total Izin</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{tally.izin}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:shadow-sm transition-shadow">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Alpa</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{tally.alpa}</p>
        </div>
      </div>

      {/* ── RINCIAN CATATAN PRESENSI ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Rincian Riwayat Kehadiran</h2>

        {isKehadiranLoading ? (
          <div className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat data presensi...
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            Belum ada data catatan presensi pada rentang tanggal ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                  <th className="py-3 pr-4">Tanggal</th>
                  <th className="py-3 pr-4">Sesi / Program</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const style = STATUS_STYLES[r.status];
                  const Icon = style.icon;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-slate-800">
                        {new Date(r.program.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-slate-700">{r.program.name}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${style.className}`}
                        >
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
    </div>
  );
}
