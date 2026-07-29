import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, AlertCircle, Building2, CheckCircle2, Users, BookOpen } from 'lucide-react';

interface WeekCell {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR' | null;
  guruNames: string[];
}

interface MapelWeekRow {
  mataPelajaranId: string;
  mataPelajaranName: string;
  weeks: WeekCell[];
}

interface WeekInfo {
  weekNumber: number;
  dateLabel: string;
  saturdayDate: string | null;
  dateRange: string;
}

interface RingkasanResponse {
  tahunAjaran: string;
  semester: string;
  scopeLevel: 'GLOBAL' | 'WILAYAH' | 'CABANG';
  unitLabel: string;
  selectedMonth: string;
  periodeLabel: string;
  totalSilabusCompleted: number;
  totalSilabusTarget: number;
  persenSilabus: number;
  hadir: number;
  totalAbsensi: number;
  persenKehadiran: number;
  kehadiranDelta: number;
  persenPelajaranTerlaksana: number;
  belumMulai: number;
  statusDistribution: { optimal: number; sesuaiJalur: number; berisiko: number };
  breakdownTotal: number;
  kelasOptions: Array<{ id: string; name: string }>;
  selectedKelasId: string | null;
  pemantauanMingguan: MapelWeekRow[];
  weeksInfo?: WeekInfo[];
}

const CELL_STATUS_META: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: 'Terlaksana', cls: 'bg-emerald-100 text-emerald-700' },
  PENDING: { label: 'Belum', cls: 'bg-gray-100 text-gray-500' },
  LIBUR: { label: 'Libur', cls: 'bg-blue-50 text-blue-700' }
};
const cellStatusMeta = (status: WeekCell['status']) => (status ? CELL_STATUS_META[status] : { label: '—', cls: 'bg-gray-50 text-gray-400' });

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getWeekDateLabel = (selectedMonth: string, weekIdx: number) => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const selYear = parseInt(yearStr, 10);
  const selMonthIdx = parseInt(monthStr, 10) - 1;
  if (isNaN(selYear) || isNaN(selMonthIdx)) return 'Sabtu';

  const daysInMonth = new Date(Date.UTC(selYear, selMonthIdx + 1, 0)).getUTCDate();
  const startDay = weekIdx * 7 + 1;
  const endDay = Math.min(daysInMonth, (weekIdx + 1) * 7);

  let satDay: number | null = null;
  for (let d = startDay; d <= endDay; d++) {
    const dateObj = new Date(Date.UTC(selYear, selMonthIdx, d));
    if (dateObj.getUTCDay() === 6) {
      satDay = d;
      break;
    }
  }

  const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthShort = monthShortNames[selMonthIdx] || '';

  if (satDay !== null) {
    return `Sabtu, ${satDay} ${monthShort}`;
  }
  return `${startDay}-${endDay} ${monthShort}`;
};

export default function Ringkasan() {
  const [monthFilter, setMonthFilter] = useState(currentMonthValue());
  const [kelasFilter, setKelasFilter] = useState('');

  const { data, isLoading, isError } = useQuery<RingkasanResponse>({
    queryKey: ['pembelajaran-ringkasan', monthFilter, kelasFilter],
    queryFn: async () => (await apiClient.get('/pembelajaran/ringkasan', { params: { month: monthFilter, kelasId: kelasFilter || undefined } })).data
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
        <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center flex items-center justify-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4" /> Gagal memuat ringkasan.
      </div>
    );
  }

  if (!data.tahunAjaran || !data.semester) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-400">
        Tahun ajaran &amp; semester aktif belum diatur. Atur di menu Pengaturan Akademik terlebih dahulu.
      </div>
    );
  }

  const { berisiko } = data.statusDistribution;
  const weekCount = data.pemantauanMingguan[0]?.weeks.length || 0;
  const deltaLabel = data.kehadiranDelta > 0 ? `+${data.kehadiranDelta}% dari bulan lalu`
    : data.kehadiranDelta < 0 ? `${data.kehadiranDelta}% dari bulan lalu`
      : 'Sama dengan bulan lalu';
  const deltaCls = data.kehadiranDelta > 0 ? 'text-emerald-700' : data.kehadiranDelta < 0 ? 'text-rose-700' : 'text-gray-500';

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12 space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Cuplikan progres silabus &amp; kehadiran periode {data.semester} {data.tahunAjaran} — diperbarui langsung dari data yang diinput.
        </p>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filter Bulan:</label>
          <input
            type="month"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value || currentMonthValue())}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total {data.unitLabel}</span>
            <Building2 className="w-4 h-4 text-blue-800 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.breakdownTotal.toLocaleString('id-ID')}</div>
          <p className="text-[11px] text-blue-700 font-semibold mt-2">Aktif Semester Ini</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pelajaran Terlaksana</span>
            <CheckCircle2 className="w-4 h-4 text-blue-800 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{data.persenPelajaranTerlaksana}%</div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-blue-800 rounded-full" style={{ width: `${data.persenPelajaranTerlaksana}%` }} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{data.unitLabel} Berisiko</span>
            <AlertCircle className={`w-4 h-4 shrink-0 ${berisiko > 0 ? 'text-rose-600' : 'text-gray-300'}`} />
          </div>
          <div className={`text-2xl font-bold mt-1 ${berisiko > 0 ? 'text-rose-700' : 'text-gray-900'}`}>{berisiko}</div>
          <p className={`text-[11px] font-semibold mt-2 ${berisiko > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {berisiko > 0 ? 'Perlu perhatian' : 'Semua aman'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Kehadiran Siswa</span>
            <Users className="w-4 h-4 text-blue-800 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{data.persenKehadiran}%</div>
          <p className={`text-[11px] font-semibold mt-2 ${deltaCls}`}>{deltaLabel}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Progres Silabus</span>
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{data.persenSilabus}%</div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${data.persenSilabus}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-bold text-gray-800">Pemantauan Mingguan &mdash; {data.periodeLabel}</h3>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Kelas:</label>
            <select
              value={kelasFilter}
              onChange={e => setKelasFilter(e.target.value)}
              className="px-2.5 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
            >
              <option value="">-- Semua Kelas --</option>
              {data.kelasOptions.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
        </div>
        {data.pemantauanMingguan.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">Belum ada data untuk periode ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-max pb-1">
              {Array.from({ length: weekCount }).map((_, weekIdx) => (
                <div key={weekIdx} className="w-56 shrink-0 space-y-2">
                  <div className="bg-blue-900 text-white text-center py-2 px-1.5 rounded-lg">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200 truncate">
                      {data.weeksInfo?.[weekIdx]?.dateLabel || getWeekDateLabel(data.selectedMonth || monthFilter, weekIdx)}
                    </p>
                    <p className="text-sm font-bold">Minggu {weekIdx + 1}</p>
                  </div>
                  {data.pemantauanMingguan.map(mapel => {
                    const cell = mapel.weeks[weekIdx];
                    const meta = cellStatusMeta(cell.status);
                    const guruLabel = cell.guruNames.length === 1
                      ? cell.guruNames[0]
                      : cell.guruNames.length > 1 ? `${cell.guruNames.length} pengajar` : null;
                    return (
                      <div key={mapel.mataPelajaranId} className="bg-white border border-gray-200 rounded-lg p-2.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-gray-800 truncate">{mapel.mataPelajaranName}</p>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${meta.cls}`}>{meta.label}</span>
                        </div>
                        {guruLabel && <p className="text-[11px] text-gray-500 truncate mt-0.5">{guruLabel}</p>}
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">H: {cell.hadir}</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold">A: {cell.alpa}</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold">I: {cell.izin}</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">S: {cell.sakit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
