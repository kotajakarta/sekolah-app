import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, AlertCircle, CheckCheck, Users, Building2, CalendarCheck } from 'lucide-react';

interface RekapCabang {
  cabangId: string;
  cabangName: string;
  wilayahName: string;
  persenSilabus: number;
  silabusCompleted: number;
  silabusTotal: number;
  persenKehadiran: number;
  hadir: number;
  totalAbsensi: number;
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
  totalSilabusCompleted: number;
  totalSilabusTarget: number;
  persenSilabus: number;
  hadir: number;
  totalAbsensi: number;
  persenKehadiran: number;
  cabangCount: number;
  rekap: RekapCabang[];
  aktivitasTerbaru: AktivitasItem[];
}

const barColor = (pct: number) => (pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500');
const percentColor = (pct: number) => (pct >= 90 ? 'text-emerald-700' : pct >= 70 ? 'text-amber-650' : 'text-rose-700');

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

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12 space-y-3 sm:space-y-4">
      <p className="text-xs text-gray-500">
        Cuplikan progres silabus &amp; kehadiran periode {data.semester} {data.tahunAjaran} — diperbarui langsung dari data yang diinput.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Cabang Terpantau</span>
            <Building2 className="w-4 h-4 text-blue-800" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{data.cabangCount.toLocaleString('id-ID')}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">melaporkan progres pembelajaran periode ini</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800">Pemantauan Regional</h3>
          </div>
          {data.rekap.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Belum ada data cabang untuk periode ini.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.rekap.map(row => (
                <div key={row.cabangId} className="p-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-800">{row.cabangName}</p>
                    <p className="text-[11px] text-gray-400">{row.wilayahName}</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        <span>Cakupan Silabus</span>
                        <span className={percentColor(row.persenSilabus)}>{row.persenSilabus}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(row.persenSilabus)}`} style={{ width: `${row.persenSilabus}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        <span>Tingkat Kehadiran</span>
                        <span className={percentColor(row.persenKehadiran)}>{row.persenKehadiran}%</span>
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

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800">Aktivitas Terbaru</h3>
          </div>
          {data.aktivitasTerbaru.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 flex-1 flex items-center justify-center">
              Belum ada silabus yang ditandai selesai.
            </div>
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
  );
}
