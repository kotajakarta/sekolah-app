import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  Loader2, AlertCircle, CheckCheck, Users, Building2, CalendarCheck,
  CheckCircle2, Circle, AlertTriangle, RefreshCw
} from 'lucide-react';

interface BreakdownItem {
  id: string;
  name: string;
  subtitle: string;
  persenSilabus: number;
  silabusCompleted: number;
  silabusTotal: number;
  persenKehadiran: number;
  hadir: number;
  totalAbsensi: number;
  status: 'Optimal' | 'Sesuai Jalur' | 'Berisiko';
}

interface KelasMapelBreakdownItem {
  kelasId: string;
  kelasName: string;
  mataPelajaranId: string;
  mataPelajaranName: string;
  persenSilabus: number;
  silabusCompleted: number;
  silabusTotal: number;
  status: 'Optimal' | 'Sesuai Jalur' | 'Berisiko';
}

interface WeekCell {
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR' | null;
}

interface MapelWeekRow {
  mataPelajaranId: string;
  mataPelajaranName: string;
  weeks: WeekCell[];
}

interface PemantauanAbsensiKelas {
  kelasId: string;
  kelasName: string;
  ruangName: string | null;
  mapel: MapelWeekRow[];
}

interface AktivitasItem {
  id: string;
  kelasName: string;
  mataPelajaranName: string;
  bab: string;
  section: string;
  guruName: string | null;
  updatedAt: string;
}

interface RingkasanResponse {
  tahunAjaran: string;
  semester: string;
  scopeLevel: 'GLOBAL' | 'WILAYAH' | 'CABANG';
  unitLabel: string;
  totalSilabusCompleted: number;
  totalSilabusTarget: number;
  persenSilabus: number;
  hadir: number;
  totalAbsensi: number;
  persenKehadiran: number;
  belumMulai: number;
  statusDistribution: { optimal: number; sesuaiJalur: number; berisiko: number };
  breakdown: BreakdownItem[];
  breakdownTotal: number;
  kelasMapelBreakdown: KelasMapelBreakdownItem[];
  pemantauanAbsensi: PemantauanAbsensiKelas[];
  periodeAbsensiMingguan: string;
  aktivitasTerbaru: AktivitasItem[];
}

const barColor = (pct: number) => (pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500');
const percentColor = (pct: number) => (pct >= 90 ? 'text-emerald-700' : pct >= 70 ? 'text-amber-650' : 'text-rose-700');
const statusChipCls = (status: BreakdownItem['status']) =>
  status === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : status === 'Sesuai Jalur' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700';

const STATUS_DIKERJAKAN_META: Record<string, { label: string; dot: string }> = {
  COMPLETED: { label: 'Dikerjakan', dot: 'bg-emerald-500' },
  PENDING: { label: 'Terjadwal', dot: 'bg-blue-500' },
  LIBUR: { label: 'Libur', dot: 'bg-gray-400' }
};
const statusDikerjakanMeta = (status: WeekCell['status']) => status ? STATUS_DIKERJAKAN_META[status] : { label: 'Belum Terjadwal', dot: 'bg-gray-200' };
const emptyWeekChipCls = (status: WeekCell['status']) =>
  status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700'
    : status === 'PENDING' ? 'bg-blue-50 text-blue-700'
      : status === 'LIBUR' ? 'bg-gray-100 text-gray-500'
        : 'bg-gray-50 text-gray-400';

const KELAS_MAPEL_STATUS_META: Record<KelasMapelBreakdownItem['status'], { label: string; icon: any; textCls: string; barCls: string }> = {
  Optimal: { label: 'Optimal', icon: CheckCircle2, textCls: 'text-blue-700', barCls: 'bg-blue-800' },
  'Sesuai Jalur': { label: 'Sesuai Jalur', icon: Circle, textCls: 'text-gray-500', barCls: 'bg-gray-400' },
  Berisiko: { label: 'Berisiko Terlambat', icon: AlertTriangle, textCls: 'text-red-600', barCls: 'bg-red-500' }
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

export default function Ringkasan() {
  const [showAllProgres, setShowAllProgres] = useState(false);
  const [showAllAktivitas, setShowAllAktivitas] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<RingkasanResponse>({
    queryKey: ['pembelajaran-ringkasan'],
    queryFn: async () => (await apiClient.get('/pembelajaran/ringkasan')).data
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
  const showPemantauanAbsensi = data.scopeLevel === 'CABANG' && data.pemantauanAbsensi.length > 0;
  const progresVisible = showAllProgres ? data.kelasMapelBreakdown : data.kelasMapelBreakdown.slice(0, 4);
  const aktivitasVisible = showAllAktivitas ? data.aktivitasTerbaru : data.aktivitasTerbaru.slice(0, 3);

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12 space-y-3 sm:space-y-4">
      <p className="text-xs text-gray-500">
        Cuplikan progres silabus &amp; kehadiran periode {data.semester} {data.tahunAjaran} — diperbarui langsung dari data yang diinput.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-blue-800 rounded-lg p-3.5 text-white">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-blue-100 uppercase tracking-wide">Silabus Selesai</span>
            <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <CheckCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold mt-1">
            {data.totalSilabusCompleted.toLocaleString('id-ID')}
            <span className="text-sm font-semibold text-blue-200"> / {data.totalSilabusTarget.toLocaleString('id-ID')} Sesi</span>
          </div>
          <div className="mt-2.5">
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-white rounded-full" style={{ width: `${data.persenSilabus}%` }} />
            </div>
            <span className="text-[11px] text-blue-100">{data.persenSilabus}% Progres Keseluruhan</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Tingkat Kehadiran</span>
            <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${percentColor(data.persenKehadiran)}`}>{data.persenKehadiran}%</div>
          <p className="text-[11px] text-gray-500 mt-2">
            {data.hadir.toLocaleString('id-ID')} dari {data.totalAbsensi.toLocaleString('id-ID')} catatan hadir terverifikasi
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{data.unitLabel} Terpantau</span>
            <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.breakdownTotal.toLocaleString('id-ID')}</div>
          <p className={`text-[11px] mt-2 ${berisiko > 0 ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>
            {berisiko > 0
              ? `${berisiko} ${data.unitLabel.toLowerCase()} memerlukan perhatian segera`
              : `Semua ${data.unitLabel.toLowerCase()} dalam jalur aman`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800">Progres Silabus Per Mapel</h3>
            {data.kelasMapelBreakdown.length > 4 && (
              <button type="button" onClick={() => setShowAllProgres(v => !v)} className="text-[11px] font-semibold text-blue-800 hover:underline">
                {showAllProgres ? 'Sembunyikan' : `Lihat Semua (${data.kelasMapelBreakdown.length})`}
              </button>
            )}
          </div>
          {data.kelasMapelBreakdown.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Belum ada data silabus untuk periode ini.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {progresVisible.map(m => {
                const meta = KELAS_MAPEL_STATUS_META[m.status];
                const StatusIcon = meta.icon;
                return (
                  <div key={`${m.kelasId}__${m.mataPelajaranId}`} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{m.mataPelajaranName} - {m.kelasName}</p>
                        <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${meta.textCls}`}>
                          <StatusIcon className="w-3 h-3" /> {meta.label}
                        </p>
                      </div>
                      <span className={`text-lg font-bold shrink-0 ${meta.textCls}`}>{m.persenSilabus}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${meta.barCls}`} style={{ width: `${m.persenSilabus}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800">Aktivitas Terbaru</h3>
            <button
              type="button"
              onClick={() => refetch()}
              title="Segarkan"
              className="p-1 text-gray-400 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {data.aktivitasTerbaru.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 flex-1 flex items-center justify-center">Belum ada silabus yang ditandai selesai.</div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {aktivitasVisible.map(item => (
                  <div key={item.id} className="p-3 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gray-800 truncate">Sesi Selesai: {item.mataPelajaranName}</p>
                        <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(item.updatedAt)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {item.guruName || 'Pengajar'} menyelesaikan <span className="font-medium text-gray-700">{item.bab} — {item.section}</span> di {item.kelasName}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {data.aktivitasTerbaru.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllAktivitas(v => !v)}
                  className="w-full py-2 text-[11px] font-semibold text-blue-800 border-t border-gray-100 hover:bg-blue-50 transition-colors"
                >
                  {showAllAktivitas ? 'Sembunyikan' : `Tampilkan Lebih (${data.aktivitasTerbaru.length - 3})`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showPemantauanAbsensi ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-gray-800">Pemantauan Absensi Mingguan</h3>
              <p className="text-[11px] text-gray-400">Periode {data.periodeAbsensiMingguan}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(STATUS_DIKERJAKAN_META).map(([key, meta]) => (
                <span key={key} className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                </span>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {data.pemantauanAbsensi.map(kelas => (
              <div key={kelas.kelasId} className="p-3">
                <p className="text-sm font-bold text-gray-800 mb-2">
                  {kelas.kelasName}
                  {kelas.ruangName && <span className="text-[11px] font-normal text-gray-400"> &middot; {kelas.ruangName}</span>}
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-left">
                        <th className="py-1.5 pr-3 w-40">Mata Pelajaran</th>
                        {kelas.mapel[0]?.weeks.map((_, idx) => (
                          <th key={idx} className="py-1.5 px-2 text-center w-24">Minggu {idx + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {kelas.mapel.map(m => (
                        <tr key={m.mataPelajaranId}>
                          <td className="py-2 pr-3 text-xs font-semibold text-gray-700 align-top">{m.mataPelajaranName}</td>
                          {m.weeks.map((cell, idx) => {
                            const meta = statusDikerjakanMeta(cell.status);
                            return (
                              <td key={idx} className="py-2 px-2 text-center align-top">
                                {cell.total > 0 ? (
                                  <div>
                                    <span className={`inline-block w-1.5 h-1.5 rounded-full mb-1 ${meta.dot}`} title={meta.label} />
                                    <div className="grid grid-cols-4 gap-0.5">
                                      <div>
                                        <p className="text-[8px] font-bold text-emerald-600">H</p>
                                        <p className="text-[11px] font-semibold text-emerald-700">{cell.hadir}</p>
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-bold text-blue-600">S</p>
                                        <p className="text-[11px] font-semibold text-blue-700">{cell.sakit}</p>
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-bold text-amber-600">I</p>
                                        <p className="text-[11px] font-semibold text-amber-700">{cell.izin}</p>
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-bold text-rose-600">A</p>
                                        <p className="text-[11px] font-semibold text-rose-700">{cell.alpa}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${emptyWeekChipCls(cell.status)}`}>
                                    {meta.label}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800">Pemantauan per {data.unitLabel}</h3>
            {data.breakdownTotal > data.breakdown.length && (
              <span className="text-[10px] text-gray-400">Menampilkan {data.breakdown.length} dari {data.breakdownTotal}, diurutkan paling berisiko</span>
            )}
          </div>
          {data.breakdown.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Belum ada data untuk periode ini.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.breakdown.map(row => (
                <div key={row.id} className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{row.name}</p>
                      <p className="text-[11px] text-gray-400">{row.subtitle}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusChipCls(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        <span>Cakupan Silabus</span>
                        <span className={percentColor(row.persenSilabus)}>{row.persenSilabus}% ({row.silabusCompleted}/{row.silabusTotal})</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(row.persenSilabus)}`} style={{ width: `${row.persenSilabus}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        <span>Tingkat Kehadiran</span>
                        <span className={percentColor(row.persenKehadiran)}>{row.persenKehadiran}% ({row.hadir}/{row.totalAbsensi})</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(row.persenKehadiran)}`} style={{ width: `${row.persenKehadiran}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
