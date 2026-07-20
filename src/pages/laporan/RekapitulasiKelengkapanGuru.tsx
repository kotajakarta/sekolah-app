import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useGetGuru } from '../../features/core_data/hooks/useMasterData';
import {
  Activity,
  Loader2,
  Printer,
  Search,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Filter,
  User,
  X
} from 'lucide-react';

interface GuruStaff {
  id: string;
  name: string;
  position: string;
  phone?: string | null;
  ifadahUrl?: string | null;
  ktpUrl?: string | null;
  wilayahId?: string | null;
  cabangId?: string | null;
  wilayah?: { id: string; name: string };
  cabang?: { id: string; name: string };
}

export default function RekapitulasiKelengkapanGuru() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  // Filters State
  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGuru, setSelectedGuru] = useState<GuruStaff | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Initialize locked scope values based on user role
  useEffect(() => {
    if (isWilayah && user?.wilayahId) {
      setSelectedWilayah(user.wilayahId);
    }
    if (isCabang) {
      if (user?.wilayahId) setSelectedWilayah(user.wilayahId);
      if (user?.cabangId) setSelectedCabang(user.cabangId);
    }
  }, [user, isWilayah, isCabang]);

  // Reset current page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWilayah, selectedCabang, searchQuery]);

  // Load Wilayah list
  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    },
    enabled: isGlobal
  });

  // Load Cabang list
  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    },
    enabled: isGlobal || isWilayah
  });

  // Filter branches based on selected Wilayah
  const filteredBranches = branches.filter((b: any) => {
    if (isWilayah && user?.wilayahId) {
      return b.wilayahId === user.wilayahId;
    }
    if (selectedWilayah) {
      return b.wilayahId === selectedWilayah;
    }
    return true;
  });

  // Load Guru data
  const { data: rawGurus = [], isLoading: isLoadingGuru } = useGetGuru();
  const gurus = rawGurus as GuruStaff[];

  // Helper to calculate guru completeness details
  const getCompletenessDetails = (guru: GuruStaff) => {
    const fields = [
      { key: 'name', label: 'Nama Lengkap', value: guru.name },
      { key: 'position', label: 'Jabatan / Posisi', value: guru.position },
      { key: 'phone', label: 'No. Telepon', value: guru.phone },
      { key: 'ifadahUrl', label: 'Upload Berkas Ifadah', value: guru.ifadahUrl, isFile: true },
      { key: 'ktpUrl', label: 'Upload Kartu Tanda Penduduk (KTP)', value: guru.ktpUrl, isFile: true },
    ];

    const completed = fields.filter(
      (f) => f.value !== null && f.value !== undefined && f.value !== ''
    );
    const missing = fields.filter(
      (f) => f.value === null || f.value === undefined || f.value === ''
    );
    const percentage = Math.round((completed.length / fields.length) * 100);

    return {
      percentage,
      completedCount: completed.length,
      totalCount: fields.length,
      missingFields: missing
    };
  };

  // Filter and process gurus
  const processedGurus = gurus
    .filter((g) => {
      // Filter by Wilayah
      if (selectedWilayah && g.wilayahId !== selectedWilayah) return false;

      // Filter by Cabang
      if (selectedCabang && g.cabangId !== selectedCabang) return false;

      // Filter by Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = g.name?.toLowerCase().includes(query);
        const posMatch = g.position?.toLowerCase().includes(query);
        const phoneMatch = g.phone?.includes(query);
        return nameMatch || posMatch || phoneMatch;
      }

      return true;
    })
    .map((g) => {
      const stats = getCompletenessDetails(g);
      return {
        ...g,
        stats
      };
    });

  // Aggregate statistics
  const totalProcessed = processedGurus.length;
  const averageProgress = totalProcessed > 0
    ? Math.round(processedGurus.reduce((sum, g) => sum + g.stats.percentage, 0) / totalProcessed)
    : 0;
  const completeCount = processedGurus.filter(g => g.stats.percentage === 100).length;
  const incompleteCount = totalProcessed - completeCount;

  // Pagination calculations
  const itemsPerPage = 10;
  const totalPages = Math.ceil(processedGurus.length / itemsPerPage);
  const paginatedGurus = processedGurus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Get active wilayah list for summaries
  const activeWilayahs = (() => {
    if (isGlobal) {
      const wMap = new Map();
      wilayahs.forEach((w: any) => wMap.set(w.id, w.name));
      gurus.forEach((g) => {
        if (g.wilayah?.id && !wMap.has(g.wilayah.id)) {
          wMap.set(g.wilayah.id, g.wilayah.name);
        }
      });
      return Array.from(wMap.entries()).map(([id, name]) => ({ id, name }));
    } else {
      return user?.wilayahId ? [{ id: user.wilayahId, name: user.wilayahName }] : [];
    }
  })();

  const wilayahSummaries = activeWilayahs.map((w: any) => {
    const wGurus = gurus.filter(g => g.wilayahId === w.id);
    const total = wGurus.length;

    let sumPercentage = 0;
    let complete = 0;

    wGurus.forEach(g => {
      const stats = getCompletenessDetails(g);
      sumPercentage += stats.percentage;
      if (stats.percentage === 100) {
        complete += 1;
      }
    });

    const avg = total > 0 ? Math.round(sumPercentage / total) : 0;
    const incomplete = total - complete;

    return {
      id: w.id,
      name: w.name,
      averageProgress: avg,
      completeCount: complete,
      incompleteCount: incomplete,
      totalActive: total
    };
  }).filter(w => w.totalActive > 0 || isGlobal);

  const showCabangSummary = !!selectedWilayah || isWilayah || isCabang;

  const cabangSummaries = filteredBranches.map((c: any) => {
    const cGurus = gurus.filter(g => g.cabangId === c.id);
    const total = cGurus.length;

    let sumPercentage = 0;
    let complete = 0;

    cGurus.forEach(g => {
      const stats = getCompletenessDetails(g);
      sumPercentage += stats.percentage;
      if (stats.percentage === 100) {
        complete += 1;
      }
    });

    const avg = total > 0 ? Math.round(sumPercentage / total) : 0;
    const incomplete = total - complete;

    return {
      id: c.id,
      name: c.name,
      averageProgress: avg,
      completeCount: complete,
      incompleteCount: incomplete,
      totalActive: total
    };
  }).filter(c => c.totalActive > 0 || (isGlobal || isWilayah));

  return (
    <div className="space-y-6 p-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rekapitulasi Kelengkapan Data Guru/Ustadz</h1>
          <p className="text-slate-500 text-sm mt-1">Laporan dan persentase kelengkapan data pribadi dan dokumen berkas ustadz aktif.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            disabled={totalProcessed === 0}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 shadow-sm text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-2 text-slate-500" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Kelengkapan</span>
            <span className="text-2xl font-bold text-slate-900">{averageProgress}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Lengkap (100%)</span>
            <span className="text-2xl font-bold text-slate-900">{completeCount} <span className="text-xs text-slate-500 font-medium">Ustadz</span></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Belum Lengkap (&lt;100%)</span>
            <span className="text-2xl font-bold text-slate-900">{incompleteCount} <span className="text-xs text-slate-500 font-medium">Ustadz</span></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ustadz Aktif</span>
            <span className="text-2xl font-bold text-slate-900">{totalProcessed} <span className="text-xs text-slate-500 font-medium">Ustadz</span></span>
          </div>
        </div>
      </div>

      {/* Filters and Search Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-indigo-500" />
          Panel Filter Data
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filter Wilayah */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Wilayah</label>
            <select
              disabled={!isGlobal}
              value={selectedWilayah}
              onChange={(e) => {
                setSelectedWilayah(e.target.value);
                setSelectedCabang('');
              }}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
            >
              {isGlobal && <option value="">Semua Wilayah</option>}
              {isGlobal ? (
                wilayahs.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)
              ) : (
                user?.wilayahName && <option value={user.wilayahId}>{user.wilayahName}</option>
              )}
            </select>
          </div>

          {/* Filter Cabang */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cabang</label>
            <select
              disabled={isCabang}
              value={selectedCabang}
              onChange={(e) => setSelectedCabang(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
            >
              {!isCabang && <option value="">Semua Cabang</option>}
              {isCabang ? (
                user?.cabangName && <option value={user.cabangId}>{user.cabangName}</option>
              ) : (
                filteredBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)
              )}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cari Ustadz</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama, posisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table (Wilayah or Cabang) */}
      {!showCabangSummary ? (
        wilayahSummaries.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Activity className="w-4 h-4 text-indigo-500" />
              Ringkasan Kelengkapan per Wilayah
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Nama Wilayah</th>
                    <th className="py-3 px-6 text-center">Rata-rata Kelengkapan</th>
                    <th className="py-3 px-6 text-center">Data Lengkap (100%)</th>
                    <th className="py-3 px-6 text-center">Belum Lengkap (&lt;100%)</th>
                    <th className="py-3 px-6 text-center">Total Ustadz Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wilayahSummaries.map((w) => {
                    let progressColor = 'text-rose-600 bg-rose-50 border-rose-100';
                    if (w.averageProgress === 100) {
                      progressColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                    } else if (w.averageProgress >= 75) {
                      progressColor = 'text-indigo-700 bg-indigo-50 border-indigo-100';
                    } else if (w.averageProgress >= 50) {
                      progressColor = 'text-amber-700 bg-amber-50 border-amber-100';
                    }

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-850 text-sm">{w.name}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${progressColor}`}>
                            {w.averageProgress}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-medium text-slate-700">{w.completeCount}</td>
                        <td className="py-4 px-6 text-center text-sm font-medium text-slate-700">{w.incompleteCount}</td>
                        <td className="py-4 px-6 text-center text-sm font-bold text-slate-850">{w.totalActive}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        cabangSummaries.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Activity className="w-4 h-4 text-indigo-500" />
              Ringkasan Kelengkapan per Cabang
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Nama Cabang</th>
                    <th className="py-3 px-6 text-center">Rata-rata Kelengkapan</th>
                    <th className="py-3 px-6 text-center">Data Lengkap (100%)</th>
                    <th className="py-3 px-6 text-center">Belum Lengkap (&lt;100%)</th>
                    <th className="py-3 px-6 text-center">Total Ustadz Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cabangSummaries.map((c) => {
                    let progressColor = 'text-rose-600 bg-rose-50 border-rose-100';
                    if (c.averageProgress === 100) {
                      progressColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                    } else if (c.averageProgress >= 75) {
                      progressColor = 'text-indigo-700 bg-indigo-50 border-indigo-100';
                    } else if (c.averageProgress >= 50) {
                      progressColor = 'text-amber-700 bg-amber-50 border-amber-100';
                    }

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-850 text-sm">{c.name}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${progressColor}`}>
                            {c.averageProgress}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-medium text-slate-700">{c.completeCount}</td>
                        <td className="py-4 px-6 text-center text-sm font-medium text-slate-700">{c.incompleteCount}</td>
                        <td className="py-4 px-6 text-center text-sm font-bold text-slate-850">{c.totalActive}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoadingGuru ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-sm font-semibold">Memuat data kelengkapan...</span>
          </div>
        ) : processedGurus.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-55 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">No</th>
                    <th className="py-4 px-6">Nama Guru</th>
                    <th className="py-4 px-6">Wilayah & Cabang</th>
                    <th className="py-4 px-6 text-center">Berkas</th>
                    <th className="py-4 px-6">Progress Kelengkapan</th>
                    <th className="py-4 px-6 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedGurus.map((g, idx) => {
                    const percent = g.stats.percentage;
                    let barColor = 'bg-rose-500';
                    let textColor = 'text-rose-600 bg-rose-50 border-rose-100';

                    if (percent === 100) {
                      barColor = 'bg-emerald-500';
                      textColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                    } else if (percent >= 75) {
                      barColor = 'bg-indigo-500';
                      textColor = 'text-indigo-700 bg-indigo-50 border-indigo-100';
                    } else if (percent >= 50) {
                      barColor = 'bg-amber-500';
                      textColor = 'text-amber-700 bg-amber-50 border-amber-100';
                    }

                    const hasIfadah = !!g.ifadahUrl;
                    const hasKTP = !!g.ktpUrl;

                    return (
                      <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-center text-sm font-semibold text-slate-500">{((currentPage - 1) * itemsPerPage) + idx + 1}</td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 text-sm">{g.name}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">{g.position}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-slate-700">{g.wilayah?.name || 'Tanpa Wilayah'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{g.cabang?.name || 'Tanpa Cabang'}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span title="Ifadah" className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${hasIfadah ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>IFADAH</span>
                            <span title="KTP" className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${hasKTP ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>KTP</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/40">
                              <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${textColor} min-w-[50px] text-center`}>
                              {percent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setSelectedGuru(g)}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5 mr-1" />
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, processedGurus.length)} dari {processedGurus.length} ustadz
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (totalPages > 6 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                      if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="text-slate-400 text-xs px-1">...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg border transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
            <XCircle className="w-12 h-12 text-slate-300" />
            <span className="text-sm font-semibold">Tidak ada data ustadz ditemukan</span>
            <span className="text-xs text-slate-400">Coba ubah filter pencarian Anda</span>
          </div>
        )}
      </div>

      {/* Local Guru Detail Modal */}
      {selectedGuru && (() => {
        const stats = getCompletenessDetails(selectedGuru);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedGuru(null)} />
              <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    Kelengkapan Data Guru
                  </h3>
                  <button onClick={() => setSelectedGuru(null)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-slate-500">Berikut adalah daftar data/berkas ustadz yang kurang/belum lengkap:</p>
                    <p className="text-base font-semibold text-slate-800 mt-1">{selectedGuru.name}</p>
                  </div>
                  {stats.missingFields.length > 0 ? (
                    <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                      {stats.missingFields.map((field) => (
                        <div key={field.key} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50/50 border border-rose-100/80 text-rose-900 text-sm font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          <span>{field.label}</span>
                          {field.isFile && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-semibold ml-auto uppercase tracking-wider">Berkas</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Semua Data Lengkap</p>
                      <p className="text-xs text-slate-500 mt-1">Tidak ada data atau dokumen yang kurang.</p>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end">
                  <button onClick={() => setSelectedGuru(null)} className="inline-flex justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
