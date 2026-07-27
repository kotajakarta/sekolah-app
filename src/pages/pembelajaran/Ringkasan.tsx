import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, AlertCircle, CheckCheck, Users, Building2, AlertTriangle, CalendarCheck, ListTree } from 'lucide-react';

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

interface MapelBreakdownItem {
  mataPelajaranId: string;
  mataPelajaranName: string;
  persenSilabus: number;
  silabusCompleted: number;
  silabusTotal: number;
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
  mapelBreakdown: MapelBreakdownItem[];
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
  PENDING: { label: 'Belum Dikerjakan', dot: 'bg-amber-500' },
  LIBUR: { label: 'Libur', dot: 'bg-gray-400' }
};
const statusDikerjakanMeta = (status: WeekCell['status']) => status ? STATUS_DIKERJAKAN_META[status] : { label: 'Belum ada sesi', dot: 'bg-gray-200' };

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
  const { data, isLoading, isError } = useQuery<RingkasanResponse>({
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

  const { optimal, sesuaiJalur, berisiko } = data.statusDistribution;
  const unitTotal = optimal + sesuaiJalur + berisiko;
  const showPemantauanAbsensi = data.scopeLevel === 'CABANG' && data.pemantauanAbsensi.length > 0;

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12 space-y-3 sm:space-y-4">
      <p className="text-xs text-gray-500">
        Cuplikan progres silabus &amp; kehadiran periode {data.semester} {data.tahunAjaran} — dipecah per {data.unitLabel.toLowerCase()}, diperbarui langsung dari data yang diinput.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Silabus Selesai</span>
            <CheckCheck className="w-4 h-4 text-blue-800" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.totalSilabusCompleted.toLocaleString('id-ID')}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            dari {data.totalSilabusTarget.toLocaleString('id-ID')} section (
            <span className={`font-semibold ${percentColor(data.persenSilabus)}`}>{data.persenSilabus}%</span>)
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Tingkat Kehadiran</span>
            <Users className="w-4 h-4 text-blue-800" />
          </div>
          <div className={`text-2xl font-bold mt-1 ${percentColor(data.persenKehadiran)}`}>{data.persenKehadiran}%</div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {data.hadir.toLocaleString('id-ID')} dari {data.totalAbsensi.toLocaleString('id-ID')} catatan hadir
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{data.unitLabel} Terpantau</span>
            <Building2 className="w-4 h-4 text-blue-800" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.breakdownTotal.toLocaleString('id-ID')}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">melaporkan progres pembelajaran periode ini</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Belum Mulai</span>
            <AlertTriangle className={`w-4 h-4 ${data.belumMulai > 0 ? 'text-amber-600' : 'text-gray-300'}`} />
          </div>
          <div className={`text-2xl font-bold mt-1 ${data.belumMulai > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{data.belumMulai.toLocaleString('id-ID')}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">kelas belum ada progres tercatat sama sekali</p>
        </div>
      </div>

      {unitTotal > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status {data.unitLabel}:</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {optimal} Optimal
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> {sesuaiJalur} Sesuai Jalur
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {berisiko} Berisiko
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {showPemantauanAbsensi ? (
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-gray-800">Pemantauan Absensi</h3>
                <p className="text-[11px] text-gray-400">{data.periodeAbsensiMingguan}</p>
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
                <div key={kelas.kelasId} className="p-3 space-y-2">
                  <p className="text-sm font-bold text-gray-800">{kelas.kelasName}</p>
                  {kelas.mapel.map(m => (
                    <div key={m.mataPelajaranId} className="border border-gray-200 rounded overflow-hidden">
                      <div className="px-2 py-1.5 bg-blue-50 border-b border-blue-100">
                        <span className="text-[11px] font-bold text-blue-800">{m.mataPelajaranName}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="flex divide-x divide-gray-100 min-w-max">
                          {m.weeks.map((cell, idx) => {
                            const meta = statusDikerjakanMeta(cell.status);
                            return (
                              <div key={idx} className="w-28 shrink-0 p-1.5">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} title={meta.label} />
                                  <span className="text-[10px] font-semibold text-gray-500 truncate">Minggu {idx + 1}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-0.5 text-center">
                                  <div>
                                    <p className="text-[9px] font-bold text-emerald-600">H</p>
                                    <p className="text-xs font-semibold text-emerald-700">{cell.hadir}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-amber-600">I</p>
                                    <p className="text-xs font-semibold text-amber-700">{cell.izin}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-blue-600">S</p>
                                    <p className="text-xs font-semibold text-blue-700">{cell.sakit}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold text-rose-600">A</p>
                                    <p className="text-xs font-semibold text-rose-700">{cell.alpa}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                    <div className="space-y-2">
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

        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <ListTree className="w-3.5 h-3.5 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-800">Progres Silabus Mapel</h3>
            </div>
            {data.mapelBreakdown.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">Belum ada data silabus.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.mapelBreakdown.map(m => (
                  <div key={m.mataPelajaranId} className="px-3 py-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 truncate">{m.mataPelajaranName}</span>
                      <span className={`font-bold ${percentColor(m.persenSilabus)}`}>{m.persenSilabus}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor(m.persenSilabus)}`} style={{ width: `${m.persenSilabus}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-800">Aktivitas Terbaru</h3>
            </div>
            {data.aktivitasTerbaru.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">Belum ada silabus yang ditandai selesai.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.aktivitasTerbaru.map(item => (
                  <div key={item.id} className="p-3 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.kelasName} &middot; {item.mataPelajaranName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{item.bab} — {item.section}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {item.guruName ? `oleh ${item.guruName} · ` : ''}{timeAgo(item.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
