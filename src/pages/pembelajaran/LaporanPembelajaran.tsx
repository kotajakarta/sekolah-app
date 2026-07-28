import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Search, AlertCircle, Info } from 'lucide-react';

interface Mapel {
  id: string;
  name: string;
  aktifPembelajaran: boolean;
}

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

interface LaporanResponse {
  periode: { gte: string; lte: string };
  rekap: RekapCabang[];
}

const percentColor = (pct: number) =>
  pct >= 90 ? 'text-emerald-700' : pct >= 70 ? 'text-amber-650' : 'text-rose-700';

const statusForPercent = (pct: number) =>
  pct >= 90
    ? { label: 'Optimal', cls: 'bg-emerald-100 text-emerald-800' }
    : pct >= 70
      ? { label: 'Sesuai Jalur', cls: 'bg-gray-100 text-gray-700' }
      : { label: 'Berisiko', cls: 'bg-red-100 text-red-700' };

export default function LaporanPembelajaran() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';

  const [selectedWilayah, setSelectedWilayah] = useState('');
  const [selectedCabang, setSelectedCabang] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [mode, setMode] = useState<'weekly' | 'monthly' | 'semester'>('weekly');

  const [weekStart, setWeekStart] = useState('');
  const [month, setMonth] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [semester, setSemester] = useState('Ganjil');

  useEffect(() => {
    if (isWilayah && user?.wilayahId) setSelectedWilayah(user.wilayahId);
  }, [user, isWilayah]);

  const { data: academicSetting } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => (await apiClient.get('/pengaturan/akademik')).data
  });

  useEffect(() => {
    if (academicSetting) {
      setTahunAjaran(academicSetting.tahunAjaran || '');
      // Jangan di-uppercase: SilabusMapel.semester disimpan persis seperti nilai Pengaturan
      // Akademik ("Ganjil"/"Genap") dan backend mencocokkannya secara exact-match, sehingga
      // "GANJIL" tidak akan pernah cocok dan laporan mode Semester selalu kosong.
      setSemester(academicSetting.semesterAktif || 'Ganjil');
    }
  }, [academicSetting]);

  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => (await apiClient.get('/master-data/wilayah')).data,
    enabled: isGlobal
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => (await apiClient.get('/master-data/cabang')).data
  });

  const filteredBranches = branches.filter((b: any) => {
    if (isWilayah && user?.wilayahId) return b.wilayahId === user.wilayahId;
    if (selectedWilayah) return b.wilayahId === selectedWilayah;
    return true;
  });

  const { data: mapelList = [] } = useQuery<Mapel[]>({
    queryKey: ['mapel'],
    queryFn: async () => (await apiClient.get('/formal/mapel')).data
  });

  const isFilterReady =
    (mode === 'weekly' && !!weekStart) ||
    (mode === 'monthly' && !!month) ||
    (mode === 'semester' && !!tahunAjaran && !!semester);

  const { data: laporan, isLoading, isError, refetch } = useQuery<LaporanResponse>({
    queryKey: ['laporan-pembelajaran', selectedWilayah, selectedCabang, selectedMapel, mode, weekStart, month, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/laporan', {
        params: {
          wilayahId: selectedWilayah || undefined,
          cabangId: selectedCabang || undefined,
          mataPelajaranId: selectedMapel || undefined,
          mode,
          weekStart: mode === 'weekly' ? weekStart : undefined,
          month: mode === 'monthly' ? month : undefined,
          tahunAjaran: mode === 'semester' ? tahunAjaran : undefined,
          semester: mode === 'semester' ? semester : undefined
        }
      });
      return res.data;
    },
    enabled: isFilterReady
  });

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12">
      <p className="text-xs text-gray-500 mb-3">
        Agregasi ketercapaian silabus dan kehadiran siswa per cabang — mingguan, bulanan, atau per semester.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Wilayah</label>
            <select
              value={selectedWilayah}
              onChange={e => { setSelectedWilayah(e.target.value); setSelectedCabang(''); }}
              disabled={!isGlobal}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 disabled:opacity-75"
            >
              {isGlobal ? (
                <>
                  <option value="">-- Semua Wilayah --</option>
                  {wilayahs.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </>
              ) : (
                <option value={selectedWilayah}>{user?.wilayahName || 'Wilayah Terkunci'}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Cabang</label>
            <select
              value={selectedCabang}
              onChange={e => setSelectedCabang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
            >
              <option value="">-- Semua Cabang --</option>
              {filteredBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
            >
              <option value="">-- Semua Mapel --</option>
              {mapelList.filter(m => m.aktifPembelajaran).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="w-full md:w-auto">
            <span className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Periode Laporan</span>
            <div className="flex border border-gray-300 rounded overflow-hidden w-full md:w-72">
              {(['weekly', 'monthly', 'semester'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 text-center py-1 text-xs font-semibold transition-all border-l first:border-l-0 border-gray-300 ${
                    mode === m ? 'bg-blue-800 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {m === 'weekly' ? 'Mingguan' : m === 'monthly' ? 'Bulanan' : 'Semester'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'weekly' ? (
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mulai Minggu (Senin)</label>
              <input
                type="date"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
              />
            </div>
          ) : mode === 'monthly' ? (
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Pilih Bulan</label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
              />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tahun Ajaran</label>
                <select
                  value={tahunAjaran}
                  onChange={e => setTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                >
                  <option value="">-- Pilih Tahun Ajaran --</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Semester</label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>
          )}

          {isFilterReady && (
            <div className="w-full md:w-auto">
              <button
                onClick={() => refetch()}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-semibold rounded bg-blue-800 hover:bg-blue-900 text-white transition-colors"
              >
                <Search className="w-4 h-4" />
                Segarkan Laporan
              </button>
            </div>
          )}
        </div>
      </div>

      {!isFilterReady ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-6 h-6 mb-1.5 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Lengkapi filter periode untuk memuat laporan.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> Gagal memuat laporan.
        </div>
      ) : !laporan || laporan.rekap.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
          Tidak ada data untuk filter yang dipilih.
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const avgSilabus = Math.round(laporan.rekap.reduce((s, r) => s + r.persenSilabus, 0) / laporan.rekap.length);
            const avgKehadiran = Math.round(laporan.rekap.reduce((s, r) => s + r.persenKehadiran, 0) / laporan.rekap.length);
            const best = laporan.rekap.reduce((top, r) => (r.persenSilabus > (top?.persenSilabus ?? -1) ? r : top), laporan.rekap[0]);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Rata-rata Penyelesaian Silabus</span>
                  <div className={`text-2xl font-bold mt-1 ${percentColor(avgSilabus)}`}>{avgSilabus}%</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Rata-rata Tingkat Kehadiran</span>
                  <div className={`text-2xl font-bold mt-1 ${percentColor(avgKehadiran)}`}>{avgKehadiran}%</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Cabang Performa Terbaik</span>
                  <div className="text-base font-bold text-gray-900 mt-1 truncate">{best?.cabangName || '-'}</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{best?.persenSilabus ?? 0}% Penyelesaian Silabus</p>
                </div>
              </div>
            );
          })()}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-800">Rincian Cabang</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left">
                    <th className="px-3 py-2">Cabang</th>
                    <th className="px-3 py-2">Wilayah</th>
                    <th className="px-3 py-2 text-center">Silabus Selesai</th>
                    <th className="px-3 py-2 text-center">% Silabus</th>
                    <th className="px-3 py-2 text-center">Kehadiran</th>
                    <th className="px-3 py-2 text-center">% Kehadiran</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {laporan.rekap.map(row => {
                    const status = statusForPercent(row.persenSilabus);
                    return (
                      <tr key={row.cabangId} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-3 py-2 font-semibold text-gray-800">{row.cabangName}</td>
                        <td className="px-3 py-2 text-gray-500">{row.wilayahName}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.silabusCompleted} / {row.silabusTotal}</td>
                        <td className={`px-3 py-2 text-center font-bold ${percentColor(row.persenSilabus)}`}>{row.persenSilabus}%</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.hadir} / {row.totalAbsensi}</td>
                        <td className={`px-3 py-2 text-center font-bold ${percentColor(row.persenKehadiran)}`}>{row.persenKehadiran}%</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
