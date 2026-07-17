import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Link } from 'react-router-dom';
import {
  Loader2, AlertCircle, CheckCircle2, Search, ChevronDown, ChevronRight,
  BookOpen, Users, Filter, ArrowLeft, Download, X, BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MAPEL_LABELS: Record<string, string> = {
  'matematika': 'Matematika',
  'bahasa indonesia': 'B. Indonesia',
  'bahasa inggris': 'B. Inggris',
  'ipa': 'IPA',
  'pkn': 'PKn',
};

const MAPEL_LIST = ['matematika', 'bahasa indonesia', 'bahasa inggris', 'ipa', 'pkn'];

interface SubjectCoverage {
  mapel: string;
  hasGuru: boolean;
  guruName: string | null;
}

interface KelasDetail {
  kelasId: string;
  kelasName: string;
  tingkat: string | null;
  subjectCoverage: SubjectCoverage[];
  missingCount: number;
  status: 'lengkap' | 'sebagian' | 'kosong';
}

interface CabangData {
  cabangId: string;
  cabangName: string;
  wilayahId: string | null;
  wilayahName: string;
  totalKelas: number;
  totalMissingSlots: number;
  status: 'hijau' | 'kuning' | 'merah';
  kelas: KelasDetail[];
}

const statusConfig = {
  hijau: { label: 'Lengkap', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  kuning: { label: 'Sebagian', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  merah: { label: 'Kosong', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  lengkap: { label: 'Lengkap', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  sebagian: { label: 'Sebagian', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  kosong: { label: 'Kosong', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
};

export default function KetersediaanGuruMapel() {
  const [searchCabang, setSearchCabang] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [expandedCabang, setExpandedCabang] = useState<Set<string>>(new Set());

  // Summary Modal States
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryStatusFilter, setSummaryStatusFilter] = useState('');

  const { data = [], isLoading, isError } = useQuery<CabangData[]>({
    queryKey: ['ketersediaan-guru-detail'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/ketersediaan-guru');
      return res.data;
    }
  });

  const wilayahOptions = useMemo(() => {
    const set = new Set(data.map(d => d.wilayahName));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter(cabang => {
      if (searchCabang && !cabang.cabangName.toLowerCase().includes(searchCabang.toLowerCase())) return false;
      if (filterWilayah && cabang.wilayahName !== filterWilayah) return false;
      if (filterStatus && cabang.status !== filterStatus) return false;
      if (filterMapel) {
        const hasMissingMapel = cabang.kelas.some(k =>
          k.subjectCoverage.some(s => s.mapel === filterMapel && !s.hasGuru)
        );
        if (!hasMissingMapel) return false;
      }
      return true;
    });
  }, [data, searchCabang, filterWilayah, filterStatus, filterMapel]);

  const summaryFiltered = useMemo(() => {
    return data.filter(cabang => {
      const matchesSearch = !summarySearch || 
        cabang.cabangName.toLowerCase().includes(summarySearch.toLowerCase()) ||
        cabang.wilayahName.toLowerCase().includes(summarySearch.toLowerCase());
      const matchesStatus = !summaryStatusFilter || cabang.status === summaryStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, summarySearch, summaryStatusFilter]);

  const toggleCabang = (id: string) => {
    setExpandedCabang(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedCabang(new Set(filtered.map(c => c.cabangId)));
  const collapseAll = () => setExpandedCabang(new Set());

  const summary = useMemo(() => ({
    total: data.length,
    hijau: data.filter(d => d.status === 'hijau').length,
    kuning: data.filter(d => d.status === 'kuning').length,
    merah: data.filter(d => d.status === 'merah').length,
  }), [data]);

  const handleExportExcel = () => {
    const rows: any[] = [];
    let no = 1;

    filtered.forEach(cabang => {
      cabang.kelas.forEach(kelas => {
        const row: any = {
          'No': no++,
          'Wilayah': cabang.wilayahName,
          'Cabang': cabang.cabangName,
          'Kelas': kelas.kelasName + (kelas.tingkat ? ` (Tk. ${kelas.tingkat})` : ''),
        };

        MAPEL_LIST.forEach(m => {
          const cov = kelas.subjectCoverage.find(s => s.mapel === m);
          const headerName = m === 'matematika' ? 'Matematika'
            : m === 'bahasa indonesia' ? 'Bahasa Indonesia'
            : m === 'bahasa inggris' ? 'Bahasa Inggris'
            : m === 'ipa' ? 'IPA'
            : m === 'pkn' ? 'PKn'
            : m;
          row[headerName] = cov?.hasGuru ? (cov.guruName || 'Ada Guru') : 'Kosong';
        });

        rows.push(row);
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ketersediaan Guru');
    
    // Auto-adjust column widths for readability
    const max_widths = [
      { wch: 6 },  // No
      { wch: 20 }, // Wilayah
      { wch: 25 }, // Cabang
      { wch: 18 }, // Kelas
      { wch: 20 }, // Matematika
      { wch: 20 }, // Bahasa Indonesia
      { wch: 20 }, // Bahasa Inggris
      { wch: 15 }, // IPA
      { wch: 15 }, // PKn
    ];
    worksheet['!cols'] = max_widths;

    XLSX.writeFile(workbook, 'Ketersediaan_Guru_Mapel.xlsx');
  };

  return (
    <div className="font-sans text-slate-800 pb-12">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-500" />
              Ketersediaan Guru Mapel Umum
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau pemenuhan guru untuk 5 mata pelajaran umum di setiap kelas per cabang.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Ringkasan
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export to XLSX
            </button>
            <Link
              to="/formal/penugasan-guru"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Atur Penugasan Guru
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Cabang', value: summary.total, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'Lengkap', value: summary.hijau, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Sebagian', value: summary.kuning, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Kosong', value: summary.merah, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border rounded-xl p-4 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          <Filter className="w-3.5 h-3.5" /> Filter
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cari Cabang</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchCabang}
                onChange={e => setSearchCabang(e.target.value)}
                placeholder="Nama cabang..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Wilayah</label>
            <select
              value={filterWilayah}
              onChange={e => setFilterWilayah(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Wilayah</option>
              {wilayahOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status Cabang</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Status</option>
              <option value="hijau">Lengkap</option>
              <option value="kuning">Sebagian</option>
              <option value="merah">Kosong</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mapel Belum Ada Guru</label>
            <select
              value={filterMapel}
              onChange={e => setFilterMapel(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Mapel</option>
              {MAPEL_LIST.map(m => <option key={m} value={m}>{MAPEL_LABELS[m]}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Menampilkan <span className="font-semibold text-slate-700">{filtered.length}</span> dari {data.length} cabang
          </p>
          <div className="flex gap-2">
            <button onClick={expandAll} className="text-xs text-indigo-600 hover:underline">Buka Semua</button>
            <span className="text-slate-300">|</span>
            <button onClick={collapseAll} className="text-xs text-slate-500 hover:underline">Tutup Semua</button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
          <AlertCircle className="w-5 h-5" /> Gagal memuat data. Coba muat ulang halaman.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          Tidak ada data yang cocok dengan filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cabang => {
            const isExpanded = expandedCabang.has(cabang.cabangId);
            const cfg = statusConfig[cabang.status];
            return (
              <div key={cabang.cabangId} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCabang(cabang.cabangId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-[14px]">{cabang.cabangName}</span>
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cabang.wilayahName} &bull; {cabang.totalKelas} kelas &bull; {cabang.totalMissingSlots} slot kosong
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {cabang.kelas.length === 0 ? (
                      <p className="px-6 py-4 text-sm text-slate-400 italic">Belum ada kelas terdaftar di cabang ini.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>
                              {MAPEL_LIST.map(m => (
                                <th key={m} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  {MAPEL_LABELS[m]}
                                </th>
                              ))}
                              <th className="px-5 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {cabang.kelas.map(kelas => {
                              const kelasCfg = statusConfig[kelas.status];
                              return (
                                <tr key={kelas.kelasId} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">
                                    {kelas.kelasName}
                                    {kelas.tingkat && <span className="ml-1.5 text-xs text-slate-400">Tk.{kelas.tingkat}</span>}
                                  </td>
                                  {MAPEL_LIST.map(m => {
                                    const cov = kelas.subjectCoverage.find(s => s.mapel === m);
                                    return (
                                      <td key={m} className="px-3 py-3 text-center">
                                        {cov?.hasGuru ? (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] text-slate-400 leading-tight max-w-[72px] truncate" title={cov.guruName || ''}>
                                              {cov.guruName || ''}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center gap-0.5">
                                            <AlertCircle className="w-4 h-4 text-rose-400" />
                                            <span className="text-[10px] text-rose-400">Kosong</span>
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-5 py-3 text-center">
                                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${kelasCfg.color}`}>
                                      {kelasCfg.label}
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
          })}
        </div>
      )}

      {/* Summary Modal */}
      {isSummaryOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Ringkasan Ketersediaan Guru Mapel
              </h2>
              <button 
                onClick={() => setIsSummaryOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Wilayah', value: new Set(data.map(d => d.wilayahName)).size, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
                  { label: 'Total Cabang', value: data.length, color: 'text-indigo-700', bg: 'bg-indigo-50/40 border-indigo-100' },
                  { label: 'Total Kelas', value: data.reduce((sum, d) => sum + d.totalKelas, 0), color: 'text-emerald-700', bg: 'bg-emerald-50/30 border-emerald-100' },
                  { label: 'Total Slot Kosong', value: data.reduce((sum, d) => sum + d.totalMissingSlots, 0), color: 'text-rose-700', bg: 'bg-rose-50/30 border-rose-100' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bg} border rounded-xl p-4 shadow-sm`}>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={summarySearch}
                    onChange={e => setSummarySearch(e.target.value)}
                    placeholder="Cari wilayah atau cabang..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
                <select
                  value={summaryStatusFilter}
                  onChange={e => setSummaryStatusFilter(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50/50"
                >
                  <option value="">Semua Status</option>
                  <option value="hijau">Lengkap</option>
                  <option value="kuning">Sebagian</option>
                  <option value="merah">Kosong</option>
                </select>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="px-5 py-3 text-center w-12 bg-slate-50">No</th>
                        <th className="px-5 py-3 bg-slate-50">Wilayah</th>
                        <th className="px-5 py-3 bg-slate-50">Cabang</th>
                        <th className="px-5 py-3 text-center bg-slate-50">Jumlah Kelas</th>
                        <th className="px-5 py-3 text-center bg-slate-50">Slot Kosong</th>
                        <th className="px-5 py-3 text-center bg-slate-50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {summaryFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                            Tidak ada data yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        summaryFiltered.map((cabang, idx) => {
                          const cfg = statusConfig[cabang.status];
                          return (
                            <tr key={cabang.cabangId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3 text-center font-medium text-slate-400">{idx + 1}</td>
                              <td className="px-5 py-3 font-semibold text-slate-800">{cabang.wilayahName}</td>
                              <td className="px-5 py-3 text-slate-600">{cabang.cabangName}</td>
                              <td className="px-5 py-3 text-center font-semibold text-slate-700">{cabang.totalKelas}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={cabang.totalMissingSlots > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-semibold"}>
                                  {cabang.totalMissingSlots}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 shrink-0">
              <span>Menampilkan <strong>{summaryFiltered.length}</strong> dari {data.length} cabang</span>
              <button
                onClick={() => setIsSummaryOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
