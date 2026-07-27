import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Search, AlertCircle, Info } from 'lucide-react';

interface Mapel {
  id: string;
  name: string;
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
  const [semester, setSemester] = useState('GANJIL');

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
      setSemester((academicSetting.semesterAktif || 'GANJIL').toUpperCase());
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
      <p className="text-sm text-slate-500 mb-6">
        Agregasi ketercapaian silabus dan kehadiran siswa per cabang — mingguan, bulanan, atau per semester.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Wilayah</label>
            <select
              value={selectedWilayah}
              onChange={e => { setSelectedWilayah(e.target.value); setSelectedCabang(''); }}
              disabled={!isGlobal}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-75"
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Cabang</label>
            <select
              value={selectedCabang}
              onChange={e => setSelectedCabang(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
            >
              <option value="">-- Semua Cabang --</option>
              {filteredBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
            >
              <option value="">-- Semua Mapel --</option>
              {mapelList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="w-full md:w-auto">
            <span className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Periode Laporan</span>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden w-full md:w-72">
              {(['weekly', 'monthly', 'semester'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 text-center py-1.5 text-xs font-semibold transition-all border-l first:border-l-0 border-slate-200 ${
                    mode === m ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m === 'weekly' ? 'Mingguan' : m === 'monthly' ? 'Bulanan' : 'Semester'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'weekly' ? (
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mulai Minggu (Senin)</label>
              <input
                type="date"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
              />
            </div>
          ) : mode === 'monthly' ? (
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Pilih Bulan</label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
              />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tahun Ajaran</label>
                <select
                  value={tahunAjaran}
                  onChange={e => setTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
                >
                  <option value="">-- Pilih Tahun Ajaran --</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Semester</label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
                >
                  <option value="GANJIL">GANJIL</option>
                  <option value="GENAP">GENAP</option>
                </select>
              </div>
            </div>
          )}

          {isFilterReady && (
            <div className="w-full md:w-auto">
              <button
                onClick={() => refetch()}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Search className="w-4 h-4" />
                Segarkan Laporan
              </button>
            </div>
          )}
        </div>
      </div>

      {!isFilterReady ? (
        <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">Lengkapi filter periode untuk memuat laporan.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-center shadow-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat laporan.
        </div>
      ) : !laporan || laporan.rekap.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
          Tidak ada data untuk filter yang dipilih.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3">Wilayah</th>
                  <th className="px-5 py-3 text-center">Silabus Selesai</th>
                  <th className="px-5 py-3 text-center">% Silabus</th>
                  <th className="px-5 py-3 text-center">Kehadiran</th>
                  <th className="px-5 py-3 text-center">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {laporan.rekap.map(row => (
                  <tr key={row.cabangId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{row.cabangName}</td>
                    <td className="px-5 py-3.5 text-slate-500">{row.wilayahName}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{row.silabusCompleted} / {row.silabusTotal}</td>
                    <td className={`px-5 py-3.5 text-center font-bold ${percentColor(row.persenSilabus)}`}>{row.persenSilabus}%</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{row.hadir} / {row.totalAbsensi}</td>
                    <td className={`px-5 py-3.5 text-center font-bold ${percentColor(row.persenKehadiran)}`}>{row.persenKehadiran}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
