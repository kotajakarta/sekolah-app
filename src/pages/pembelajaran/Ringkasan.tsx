import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  Loader2, AlertCircle, Building2, CheckCircle2, Users, BookOpen,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  Filter, CheckCircle, AlertTriangle, ChevronRight as ChevronRightIcon,
  Search, ArrowUpRight, Calendar
} from 'lucide-react';
import Pagination from '../../components/Pagination';

interface ClassWeekDetail {
  kelasId: string;
  kelasName: string;
  guruName?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR' | null;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
}

interface WeekCell {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR' | null;
  guruNames: string[];
  kelasNames?: string[];
  details?: ClassWeekDetail[];
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

interface UnitBreakdownItem {
  id: string;
  name: string;
  parentName: string;
  silabusCompleted: number;
  silabusTotal: number;
  persenSilabus: number;
  hadir: number;
  totalAbsensi: number;
  persenKehadiran: number;
  status: 'Optimal' | 'Sesuai Jalur' | 'Berisiko';
}

interface FilterOptions {
  wilayahList: Array<{ id: string; name: string }>;
  cabangList: Array<{ id: string; name: string; wilayahId: string | null }>;
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
  unitBreakdown: UnitBreakdownItem[];
  filterOptions: FilterOptions;
  kelasOptions: Array<{ id: string; name: string }>;
  selectedKelasId: string | null;
  pemantauanMingguan: MapelWeekRow[];
  weeksInfo?: WeekInfo[];
}

// ── Helpers ──

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseMonth = (v: string) => {
  const [y, m] = v.split('-').map(Number);
  return { year: y, month: m };
};

const shiftMonth = (v: string, delta: number) => {
  const { year, month } = parseMonth(v);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (v: string) => {
  const { year, month } = parseMonth(v);
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const CELL_STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  COMPLETED: { label: 'Terlaksana', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  PENDING:   { label: 'Belum',      bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700' },
  LIBUR:     { label: 'Libur',      bg: 'bg-sky-50 border-sky-200',         text: 'text-sky-700' }
};
const cellMeta = (s: WeekCell['status']) =>
  s ? CELL_STATUS_META[s] : { label: '—', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-400' };

export default function Ringkasan() {
  const [monthFilter, setMonthFilter] = useState(currentMonthValue());
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState('');
  const [selectedCabangFilter, setSelectedCabangFilter] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination for Unit Breakdown Table
  const [tablePage, setTablePage] = useState(1);
  const tableLimit = 8;

  const { data, isLoading, isError } = useQuery<RingkasanResponse>({
    queryKey: ['pembelajaran-ringkasan', monthFilter, kelasFilter, selectedWilayahFilter, selectedCabangFilter],
    queryFn: async () => (await apiClient.get('/pembelajaran/ringkasan', {
      params: {
        month: monthFilter,
        kelasId: kelasFilter || undefined,
        wilayahId: selectedWilayahFilter || undefined,
        cabangId: selectedCabangFilter || undefined,
      }
    })).data
  });

  // Filtered cabang list based on selected Wilayah
  const availableCabangList = useMemo(() => {
    if (!data?.filterOptions?.cabangList) return [];
    if (!selectedWilayahFilter) return data.filterOptions.cabangList;
    return data.filterOptions.cabangList.filter(c => c.wilayahId === selectedWilayahFilter);
  }, [data?.filterOptions?.cabangList, selectedWilayahFilter]);

  // Filtered unit breakdown items
  const filteredUnitBreakdown = useMemo(() => {
    if (!data?.unitBreakdown) return [];
    return data.unitBreakdown.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(term) || item.parentName.toLowerCase().includes(term);
    });
  }, [data?.unitBreakdown, searchTerm]);

  const totalTablePages = Math.ceil(filteredUnitBreakdown.length / tableLimit) || 1;
  const paginatedUnitBreakdown = useMemo(() => {
    return filteredUnitBreakdown.slice((tablePage - 1) * tableLimit, tablePage * tableLimit);
  }, [filteredUnitBreakdown, tablePage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh] font-sans text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand mr-2" />
        <span>Memuat data kontrol pembelajaran...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 text-sm font-sans flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        <span>Gagal memuat ringkasan pembelajaran. Pastikan koneksi ke server stabil.</span>
      </div>
    );
  }

  if (!data.tahunAjaran || !data.semester) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
        Tahun ajaran &amp; semester aktif belum diatur. Atur di menu Pengaturan Akademik terlebih dahulu.
      </div>
    );
  }

  const { optimal, sesuaiJalur, berisiko } = data.statusDistribution;
  const distTotal = optimal + sesuaiJalur + berisiko;
  const weekCount = data.pemantauanMingguan[0]?.weeks.length || 0;

  const deltaCls = data.kehadiranDelta > 0 ? 'text-emerald-700 bg-emerald-50' : data.kehadiranDelta < 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-500 bg-slate-100';
  const deltaLabel = data.kehadiranDelta > 0 ? `+${data.kehadiranDelta}%` : data.kehadiranDelta < 0 ? `${data.kehadiranDelta}%` : '0%';

  return (
    <div className="font-sans text-slate-900 pb-10 space-y-4">
      {/* Top Header & Filter Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Monitoring Kontrol Pembelajaran</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand border border-blue-100">
              TA {data.tahunAjaran} &middot; {data.semester}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring real-time kurikulum &amp; ketercapaian silabus tingkat {data.unitLabel.toLowerCase()}
          </p>
        </div>

        {/* Global / Regional / Branch Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Periode Month Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <button
              onClick={() => setMonthFilter(shiftMonth(monthFilter, -1))}
              className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-700 min-w-[100px] text-center">
              {formatMonthLabel(monthFilter)}
            </span>
            <button
              onClick={() => setMonthFilter(shiftMonth(monthFilter, 1))}
              className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Wilayah Filter (if available) */}
          {data.filterOptions?.wilayahList?.length > 0 && (
            <select
              value={selectedWilayahFilter}
              onChange={e => {
                setSelectedWilayahFilter(e.target.value);
                setSelectedCabangFilter('');
                setTablePage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Semua Wilayah</option>
              {data.filterOptions.wilayahList.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}

          {/* Cabang Filter (if available) */}
          {availableCabangList.length > 0 && (
            <select
              value={selectedCabangFilter}
              onChange={e => {
                setSelectedCabangFilter(e.target.value);
                setTablePage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Semua Cabang</option>
              {availableCabangList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Reset Filters button */}
          {(selectedWilayahFilter || selectedCabangFilter) && (
            <button
              onClick={() => {
                setSelectedWilayahFilter('');
                setSelectedCabangFilter('');
                setTablePage(1);
              }}
              className="px-2.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Top Cards Grid (4 columns layout matching /dashboard style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Unit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total {data.unitLabel}</span>
            <div className="p-2 rounded-xl bg-blue-50 text-brand">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.breakdownTotal.toLocaleString('id-ID')}</div>
          <p className="text-xs text-brand font-medium mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif Terintegrasi
          </p>
        </div>

        {/* Pelajaran Terlaksana */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pelajaran Terlaksana</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.persenPelajaranTerlaksana}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${data.persenPelajaranTerlaksana}%` }} />
          </div>
        </div>

        {/* Kehadiran Siswa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kehadiran Siswa</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.persenKehadiran}%</div>
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${deltaCls}`}>
              {data.kehadiranDelta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {deltaLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-3">
            {data.hadir.toLocaleString('id-ID')} / {data.totalAbsensi.toLocaleString('id-ID')} sesi hadir
          </p>
        </div>

        {/* Progres Silabus */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Progres Kurikulum</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.persenSilabus}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${data.persenSilabus}%` }} />
          </div>
        </div>
      </div>

      {/* Main Monitoring Section: Unit Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Ringkasan Ketercapaian per {data.unitLabel}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ketercapaian silabus &amp; absensi per {data.unitLabel.toLowerCase()} untuk pengambilan keputusan cepat
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Cari ${data.unitLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setTablePage(1); }}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 w-16 text-center">Status</th>
                <th className="px-5 py-3">Nama {data.unitLabel}</th>
                {data.scopeLevel !== 'GLOBAL' && <th className="px-5 py-3">Induk / Wilayah</th>}
                <th className="px-5 py-3">Ketercapaian Silabus</th>
                <th className="px-5 py-3">Tingkat Kehadiran</th>
                <th className="px-5 py-3 text-center">Status Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedUnitBreakdown.length > 0 ? (
                paginatedUnitBreakdown.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          item.status === 'Optimal' ? 'bg-emerald-500 ring-4 ring-emerald-50' :
                          item.status === 'Sesuai Jalur' ? 'bg-blue-500 ring-4 ring-blue-50' :
                          'bg-rose-500 ring-4 ring-rose-50'
                        }`}
                        title={item.status}
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{item.name}</td>
                    {data.scopeLevel !== 'GLOBAL' && (
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">{item.parentName || '-'}</td>
                    )}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              item.persenSilabus >= 85 ? 'bg-emerald-500' :
                              item.persenSilabus >= 70 ? 'bg-brand' : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.persenSilabus}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 text-xs">{item.persenSilabus}%</span>
                        <span className="text-[11px] text-slate-400 font-normal">({item.silabusCompleted}/{item.silabusTotal})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                          item.persenKehadiran >= 85 ? 'bg-emerald-50 text-emerald-700' :
                          item.persenKehadiran >= 70 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.persenKehadiran}%
                        </span>
                        <span className="text-[11px] text-slate-400">({item.hadir}/{item.totalAbsensi} sesi)</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        item.status === 'Optimal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === 'Sesuai Jalur' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Tidak ada data {data.unitLabel.toLowerCase()} yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {filteredUnitBreakdown.length > 0 && (
          <div className="p-3 border-t border-slate-100">
            <Pagination
              currentPage={tablePage}
              totalPages={totalTablePages}
              onPageChange={setTablePage}
              totalItems={filteredUnitBreakdown.length}
              itemsPerPage={tableLimit}
            />
          </div>
        )}
      </div>

      {/* Pemantauan Mingguan Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Pemantauan Pelaksanaan Mingguan — {data.periodeLabel}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Progress mingguan mata pelajaran di seluruh kelas yang dipantau</p>
          </div>

          {/* Kelas Dropdown Filter for Pemantauan Mingguan */}
          {data.kelasOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter Kelas:</span>
              <select
                value={kelasFilter}
                onChange={e => setKelasFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">Semua Kelas</option>
                {data.kelasOptions.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {data.pemantauanMingguan.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada record pelaksanaan pembelajaran pada bulan {data.periodeLabel}.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="flex gap-3 min-w-max">
              {Array.from({ length: weekCount }).map((_, weekIdx) => (
                <div key={weekIdx} className="w-56 shrink-0 space-y-2">
                  <div className="bg-slate-900 text-white rounded-xl py-2 px-3 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      {data.weeksInfo?.[weekIdx]?.dateLabel || `Minggu ${weekIdx + 1}`}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Minggu {weekIdx + 1}</p>
                  </div>

                  {data.pemantauanMingguan.map(mapel => {
                    const cell = mapel.weeks[weekIdx];
                    const hasDetails = cell.details && cell.details.length > 0;
                    return (
                      <div key={mapel.mataPelajaranId} className="bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors space-y-2">
                        <div className="flex items-center justify-between gap-1 border-b border-slate-200/60 pb-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate" title={mapel.mataPelajaranName}>
                            {mapel.mataPelajaranName}
                          </span>
                          {hasDetails && cell.details!.length > 1 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-700 rounded-full shrink-0">
                              {cell.details!.length} kelas
                            </span>
                          )}
                        </div>

                        {hasDetails ? (
                          <div className="space-y-2 divide-y divide-slate-200/60 pt-0.5">
                            {cell.details!.map((detail, dIdx) => {
                              const detailMeta = cellMeta(detail.status);
                              return (
                                <div key={detail.kelasId || dIdx} className={dIdx > 0 ? 'pt-2' : ''}>
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="text-[11px] font-bold text-brand truncate" title={detail.kelasName}>
                                      {detail.kelasName}
                                    </span>
                                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border shrink-0 ${detailMeta.bg} ${detailMeta.text}`}>
                                      {detailMeta.label}
                                    </span>
                                  </div>

                                  {detail.guruName && (
                                    <p className="text-[10px] text-slate-500 truncate mb-1" title={detail.guruName}>
                                      {detail.guruName}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-600">
                                    <span className="px-1.5 py-0.5 bg-emerald-150 text-emerald-800 bg-emerald-100 rounded">H: {detail.hadir}</span>
                                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">A: {detail.alpa}</span>
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">I: {detail.izin}</span>
                                    <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded">S: {detail.sakit}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic py-1">Belum ada data</div>
                        )}
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
