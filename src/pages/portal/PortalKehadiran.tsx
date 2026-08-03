import { useState } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetKehadiran, KehadiranStatus } from '../../features/portal/hooks/useGetKehadiran';
import { CheckCircle2, XCircle, Clock, Loader2, HeartPulse } from 'lucide-react';

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
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
  const { selectedStudentId, isLoading } = usePortalStudent();
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(todayStr());

  const { data, isLoading: isKehadiranLoading } = useGetKehadiran(selectedStudentId, startDate, endDate);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  const tally = data?.tally ?? { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  const records = data?.records ?? [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h1 className="text-lg font-bold text-slate-800">Kehadiran</h1>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Hadir</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{tally.hadir}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Sakit</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{tally.sakit}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Izin</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{tally.izin}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Alpa</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{tally.alpa}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        {isKehadiranLoading ? (
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
          </p>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada data kehadiran pada rentang tanggal ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 pr-4">Tanggal</th>
                  <th className="py-2 pr-4">Program</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const style = STATUS_STYLES[r.status];
                  const Icon = style.icon;
                  return (
                    <tr key={r.id}>
                      <td className="py-2 pr-4 text-slate-700">
                        {new Date(r.program.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{r.program.name}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${style.className}`}
                        >
                          <Icon className="w-3 h-3" /> {style.label}
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
