import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw,
  Layers, Download, ShieldAlert, Sparkles, Users, Eye, X,
  Building2, School
} from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '../../../lib/apiClient';
import Pagination from '../../../components/Pagination';

export interface ReconciledStudentItem {
  id: string;
  nama: string;
  cabangId?: string;
  cabangName: string;
  wilayahName: string;
  lembagaMuadalahName: string;
  tingkat: string;
  kelasName: string;
  nisnEsantri: string;
  nikEsantri: string;
  tempatLahirEsantri: string;
  tanggalLahirEsantri: string;
  jenisKelaminEsantri: string;

  statusEmis: 'TERDAFTAR' | 'BELUM_TERDAFTAR' | 'DISKREPANSI';
  emisId?: string;
  nisnEmis: string;
  rombelEmis: string;

  statusVerval: 'VERVAL_OK' | 'RESIDU_VERVAL' | 'BELUM_TERDAFTAR';
  vervalPdId?: string;
  nisnVerval: string;
  residuDetail?: Record<string, any>;

  butuhTindakan: boolean;
  discrepancies: string[];
  rekomendasiTindakan: string;
}

export interface ReconciliationSummary {
  batchId: string;
  executedAt: string;
  totalSantriEsantri: number;
  totalTerdaftarEmis: number;
  totalBelumEmis: number;
  totalVervalOk: number;
  totalResiduVerval: number;
  totalBelumVerval: number;
  totalDiskrepansi: number;
  totalButuhTindakan: number;
  cabangBreakdown: any[];
  students: ReconciledStudentItem[];
}

interface ResiduEmisVervalSubTabProps {
  userScope?: string;
  userCabangId?: string;
  userWilayahId?: string;
  selectedCabangId?: string;
  selectedWilayahId?: string;
}

export default function ResiduEmisVervalSubTab({
  userScope,
  userCabangId,
  userWilayahId,
  selectedCabangId,
  selectedWilayahId,
}: ResiduEmisVervalSubTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTION' | 'BELUM_EMIS' | 'RESIDU_VERVAL' | 'DISKREPANSI' | 'VALID'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<ReconciledStudentItem | null>(null);
  const itemsPerPage = 10;

  // Tentukan parameter cabang & wilayah yang dikirim ke backend
  const effectiveCabangId = userScope === 'CABANG' ? userCabangId : (selectedCabangId || undefined);
  const effectiveWilayahId = userScope === 'WILAYAH' ? userWilayahId : (selectedWilayahId || undefined);

  const {
    data: reconcileData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<ReconciliationSummary | null>({
    queryKey: ['formal-emis-latest', effectiveCabangId, effectiveWilayahId],
    queryFn: async () => {
      const res = await apiClient.get('/formal/emis/latest', {
        params: {
          cabangId: effectiveCabangId,
          wilayahId: effectiveWilayahId,
        },
      });
      return res.data?.data || null;
    },
    staleTime: 1000 * 60 * 5, // 5 menit
  });

  const rawStudents = useMemo(() => reconcileData?.students || [], [reconcileData]);

  // Filter santri berdasarkan search query dan tab status filter
  const filteredStudents = useMemo(() => {
    return rawStudents.filter((s) => {
      // Search query (nama, NIK, NISN, rombel, cabang)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchNama = s.nama?.toLowerCase().includes(q);
        const matchNik = s.nikEsantri?.toLowerCase().includes(q);
        const matchNisn = s.nisnEsantri?.toLowerCase().includes(q);
        const matchRombel = s.kelasName?.toLowerCase().includes(q) || s.rombelEmis?.toLowerCase().includes(q);
        const matchCabang = s.cabangName?.toLowerCase().includes(q);
        if (!matchNama && !matchNik && !matchNisn && !matchRombel && !matchCabang) {
          return false;
        }
      }

      // Quick status filter
      if (statusFilter === 'ACTION') return s.butuhTindakan;
      if (statusFilter === 'BELUM_EMIS') return s.statusEmis === 'BELUM_TERDAFTAR';
      if (statusFilter === 'RESIDU_VERVAL') return s.statusVerval === 'RESIDU_VERVAL';
      if (statusFilter === 'DISKREPANSI') return s.discrepancies && s.discrepancies.length > 0;
      if (statusFilter === 'VALID') return !s.butuhTindakan && s.statusEmis === 'TERDAFTAR' && s.statusVerval === 'VERVAL_OK';

      return true;
    });
  }, [rawStudents, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const validCurrentPage = totalPages > 0 ? Math.min(Math.max(1, currentPage), totalPages) : 1;
  const currentStudents = filteredStudents.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const handleExportExcel = () => {
    if (!filteredStudents.length) return;
    const exportData = filteredStudents.map((s, idx) => ({
      No: idx + 1,
      'Nama Santri': s.nama,
      Cabang: s.cabangName,
      Wilayah: s.wilayahName,
      Tingkat: s.tingkat,
      Kelas: s.kelasName,
      'NIK eSantri': s.nikEsantri,
      'NISN eSantri': s.nisnEsantri,
      'Tempat Lahir': s.tempatLahirEsantri,
      'Tanggal Lahir': s.tanggalLahirEsantri,
      'Status EMIS': s.statusEmis === 'TERDAFTAR' ? 'TERDAFTAR' : s.statusEmis === 'BELUM_TERDAFTAR' ? 'BELUM TERDAFTAR' : 'DISKREPANSI',
      'NISN EMIS': s.nisnEmis,
      'Rombel EMIS': s.rombelEmis,
      'Status Verval': s.statusVerval === 'VERVAL_OK' ? 'VALID (OK)' : s.statusVerval === 'RESIDU_VERVAL' ? 'RESIDU VERVAL' : 'BELUM TERDAFTAR',
      'NISN Verval': s.nisnVerval,
      'Detail Residu Verval': s.residuDetail ? Object.keys(s.residuDetail).join(', ') : '-',
      'Diskrepansi Data': s.discrepancies?.length ? s.discrepancies.join(' | ') : 'Sesuai',
      'Perlu Tindakan Cabang': s.butuhTindakan ? 'YA' : 'TIDAK',
      'Rekomendasi Tindakan': s.rekomendasiTindakan,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Residu EMIS VERVAL');
    const timestamp = new Date().toISOString().slice(0, 10);
    const branchLabel = effectiveCabangId ? `Cabang_${effectiveCabangId}` : 'Semua_Cabang';
    XLSX.writeFile(wb, `Audit_Residu_EMIS_VERVAL_${branchLabel}_${timestamp}.xlsx`);
  };

  const formattedExecutionDate = useMemo(() => {
    if (!reconcileData?.executedAt) return null;
    try {
      const d = new Date(reconcileData.executedAt);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return reconcileData.executedAt;
    }
  }, [reconcileData?.executedAt]);

  return (
    <div className="space-y-6">
      {/* Header Banner & Metadata Snapshot */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Snapshot Audit Terpusat
              </span>
              {reconcileData && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                  Tersimpan di Database
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight">Hasil Komparasi EMIS 4.0 & Verval PD</h2>
            <p className="text-sm text-indigo-200/80 mt-1 max-w-2xl">
              Data audit pembanding antara pangkalan data eSantri dengan EMIS Kemenag & Verval PD Kemendikbud.
              {formattedExecutionDate && (
                <span className="block mt-1 font-medium text-amber-300">
                  📅 Waktu Penyelarasan Terakhir: {formattedExecutionDate} WIB
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all shadow-sm text-sm font-medium backdrop-blur-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Menyegarkan...' : 'Perbarui'}</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!filteredStudents.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/30 text-sm font-semibold disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200/60 shadow-sm text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <h3 className="text-base font-semibold text-slate-800">Memuat Data Residu Komparasi...</h3>
          <p className="text-sm text-slate-500 mt-1">Mengambil snapshot audit EMIS & Verval untuk cabang Anda.</p>
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900">Gagal Memuat Hasil Komparasi</h3>
          <p className="text-sm text-rose-700 mt-1">Terjadi kendala saat menghubungkan ke database komparasi EMIS.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : !reconcileData || rawStudents.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Riwayat Komparasi Tersimpan</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Audit EMIS & Verval dilakukan secara berkala oleh Administrator Pusat melalui menu Sinkronisasi EMIS & Verval.
            Hasil komparasi santri cabang akan otomatis muncul di sini setelah sesi audit selesai dijalankan.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Total Santri</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{reconcileData.totalSantriEsantri}</p>
              <p className="text-xs text-slate-400 mt-0.5">Basis eSantri</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Di EMIS</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">{reconcileData.totalTerdaftarEmis}</p>
              <p className="text-xs text-slate-400 mt-0.5">Terdaftar Kemenag</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-rose-700">Belum EMIS</span>
                <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <XCircle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-rose-600 mt-2">{reconcileData.totalBelumEmis}</p>
              <p className="text-xs text-rose-500 mt-0.5 font-medium">Perlu Didaftarkan</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Verval Valid</span>
                <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-teal-600 mt-2">{reconcileData.totalVervalOk}</p>
              <p className="text-xs text-slate-400 mt-0.5">Kemendikbud OK</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-amber-700">Residu Verval</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-amber-600 mt-2">{reconcileData.totalResiduVerval}</p>
              <p className="text-xs text-amber-600 mt-0.5 font-medium">Perbaikan Identitas</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-purple-700">Butuh Tindakan</span>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-purple-700 mt-2">{reconcileData.totalButuhTindakan}</p>
              <p className="text-xs text-purple-600 mt-0.5 font-bold">Total Tugas Cabang</p>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Quick Status Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({rawStudents.length})
              </button>
              <button
                onClick={() => { setStatusFilter('ACTION'); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'ACTION'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Butuh Tindakan ({reconcileData.totalButuhTindakan})
              </button>
              <button
                onClick={() => { setStatusFilter('BELUM_EMIS'); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'BELUM_EMIS'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Belum di EMIS ({reconcileData.totalBelumEmis})
              </button>
              <button
                onClick={() => { setStatusFilter('RESIDU_VERVAL'); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'RESIDU_VERVAL'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Residu Verval ({reconcileData.totalResiduVerval})
              </button>
              <button
                onClick={() => { setStatusFilter('DISKREPANSI'); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'DISKREPANSI'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Selisih Data ({reconcileData.totalDiskrepansi})
              </button>
              <button
                onClick={() => { setStatusFilter('VALID'); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'VALID'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sesuai & Valid
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIK, NISN, rombel..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Table Data Residu Komparasi */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto relative">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-600 uppercase bg-slate-50/90 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-4 font-bold text-center w-12 sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">
                      No
                    </th>
                    <th className="px-4 py-4 font-bold min-w-[220px] sticky left-[48px] bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">
                      Santri eSantri
                    </th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap">
                      Cabang / Kelas
                    </th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap">
                      Status EMIS (Kemenag)
                    </th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap">
                      Status Verval (Kemendikbud)
                    </th>
                    <th className="px-4 py-4 font-bold min-w-[280px] max-w-[340px]">
                      Diskrepansi / Catatan
                    </th>
                    <th className="px-4 py-4 font-bold min-w-[320px] max-w-[420px]">
                      Rekomendasi Tindakan Cabang
                    </th>
                    <th className="px-4 py-4 font-bold text-center w-16 whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentStudents.length > 0 ? (
                    currentStudents.map((s, idx) => {
                      const rowNum = (validCurrentPage - 1) * itemsPerPage + idx + 1;
                      const hasDiscrepancy = s.discrepancies && s.discrepancies.length > 0;

                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50/80 transition-colors group ${
                            s.butuhTindakan ? 'bg-amber-50/15' : ''
                          }`}
                        >
                          {/* No */}
                          <td className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 align-top sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                            {rowNum}
                          </td>

                          {/* Santri eSantri */}
                          <td className="px-4 py-3.5 align-top sticky left-[48px] bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                            <div className="font-bold text-slate-900 text-sm">{s.nama}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                              <span>NIK: <strong className="text-slate-700">{s.nikEsantri || '-'}</strong></span>
                              <span>•</span>
                              <span>NISN: <strong className="text-slate-700">{s.nisnEsantri || '-'}</strong></span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {s.tempatLahirEsantri}, {s.tanggalLahirEsantri} ({s.jenisKelaminEsantri})
                            </div>
                          </td>

                          {/* Cabang & Kelas */}
                          <td className="px-4 py-3.5 align-top whitespace-nowrap">
                            <div className="font-semibold text-slate-800 text-xs">{s.cabangName}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {s.tingkat ? `Tingkat ${s.tingkat}` : ''} {s.kelasName ? `• ${s.kelasName}` : ''}
                            </div>
                          </td>

                          {/* Status EMIS */}
                          <td className="px-4 py-3.5 align-top whitespace-nowrap">
                            {s.statusEmis === 'TERDAFTAR' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Terdaftar EMIS
                                </span>
                                <div className="text-[11px] text-slate-600 font-mono">
                                  NISN: {s.nisnEmis}
                                </div>
                                {s.rombelEmis && s.rombelEmis !== '-' && (
                                  <div className="text-[11px] text-slate-500">
                                    Rombel: {s.rombelEmis}
                                  </div>
                                )}
                              </div>
                            ) : s.statusEmis === 'BELUM_TERDAFTAR' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                                <XCircle className="w-3.5 h-3.5" />
                                Belum di EMIS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Diskrepansi EMIS
                              </span>
                            )}
                          </td>

                          {/* Status Verval */}
                          <td className="px-4 py-3.5 align-top whitespace-nowrap">
                            {s.statusVerval === 'VERVAL_OK' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200/60 rounded-lg text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Valid (OK)
                                </span>
                                {s.nisnVerval && s.nisnVerval !== '-' && (
                                  <div className="text-[11px] text-slate-600 font-mono">
                                    NISN: {s.nisnVerval}
                                  </div>
                                )}
                              </div>
                            ) : s.statusVerval === 'RESIDU_VERVAL' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Residu Verval PD
                                </span>
                                {s.residuDetail && Object.keys(s.residuDetail).length > 0 && (
                                  <div className="text-[11px] text-rose-600 font-medium">
                                    {Object.keys(s.residuDetail).join(', ')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                                Belum Terdaftar
                              </span>
                            )}
                          </td>

                          {/* Diskrepansi / Temuan */}
                          <td className="px-4 py-3.5 align-top min-w-[280px] max-w-[340px] whitespace-normal">
                            {hasDiscrepancy ? (
                              <div className="space-y-1.5">
                                {s.discrepancies.map((disc, dIdx) => (
                                  <div
                                    key={dIdx}
                                    className="p-2 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-snug flex items-start gap-1.5 shadow-2xs"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <span className="break-words font-medium">{disc}</span>
                                  </div>
                                ))}
                              </div>
                            ) : s.statusEmis === 'BELUM_TERDAFTAR' && s.statusVerval === 'BELUM_TERDAFTAR' ? (
                              <span className="text-xs text-slate-400 italic">Belum terdaftar di eksternal</span>
                            ) : s.statusEmis === 'BELUM_TERDAFTAR' ? (
                              <span className="text-xs text-slate-400 italic">Belum terdaftar di EMIS</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Data Sesuai
                              </span>
                            )}
                          </td>

                          {/* Rekomendasi Tindakan Cabang */}
                          <td className="px-4 py-3.5 align-top min-w-[320px] max-w-[420px] whitespace-normal">
                            {s.butuhTindakan ? (
                              <div className="p-2.5 rounded-xl text-xs leading-relaxed bg-rose-50/90 border border-rose-200/90 text-rose-950 shadow-2xs space-y-1">
                                <div className="flex items-start gap-1.5 font-semibold text-rose-900">
                                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                  <span>Instruksi Cabang:</span>
                                </div>
                                <div className="text-rose-800 break-words font-medium leading-relaxed pl-5">
                                  {s.rekomendasiTindakan}
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl text-xs leading-relaxed bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{s.rekomendasiTindakan || 'Data sudah sesuai & aman.'}</span>
                              </div>
                            )}
                          </td>

                          {/* Aksi / Detail */}
                          <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                              title="Lihat Detail Komparasi"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        Tidak ada data santri yang sesuai kriteria pencarian / filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={validCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredStudents.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}

      {/* Modal Detail Santri Komparasi */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                  Detail Komparasi Santri
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedStudent.nama}</h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Identitas eSantri vs EMIS vs Verval */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kolom 1: eSantri */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Database eSantri
                </h4>
                <div className="space-y-2 text-xs">
                  <div><span className="text-slate-400">NIK:</span> <strong className="text-slate-800 font-mono block">{selectedStudent.nikEsantri}</strong></div>
                  <div><span className="text-slate-400">NISN:</span> <strong className="text-slate-800 font-mono block">{selectedStudent.nisnEsantri}</strong></div>
                  <div><span className="text-slate-400">Tempat Lahir:</span> <strong className="text-slate-800 block">{selectedStudent.tempatLahirEsantri}</strong></div>
                  <div><span className="text-slate-400">Tanggal Lahir:</span> <strong className="text-slate-800 block">{selectedStudent.tanggalLahirEsantri}</strong></div>
                  <div><span className="text-slate-400">Cabang:</span> <strong className="text-slate-800 block">{selectedStudent.cabangName}</strong></div>
                  <div><span className="text-slate-400">Kelas:</span> <strong className="text-slate-800 block">{selectedStudent.kelasName}</strong></div>
                </div>
              </div>

              {/* Kolom 2: EMIS 4.0 */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-600" />
                  EMIS 4.0 Kemenag
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <strong className="block text-emerald-700 font-bold">{selectedStudent.statusEmis}</strong>
                  </div>
                  <div><span className="text-slate-400">NISN EMIS:</span> <strong className="text-slate-800 font-mono block">{selectedStudent.nisnEmis || '-'}</strong></div>
                  <div><span className="text-slate-400">Rombel EMIS:</span> <strong className="text-slate-800 block">{selectedStudent.rombelEmis || '-'}</strong></div>
                  <div><span className="text-slate-400">ID EMIS:</span> <strong className="text-slate-800 font-mono text-[10px] block truncate">{selectedStudent.emisId || '-'}</strong></div>
                </div>
              </div>

              {/* Kolom 3: Verval PD */}
              <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Verval PD Kemendikbud
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <strong className="block text-teal-700 font-bold">{selectedStudent.statusVerval}</strong>
                  </div>
                  <div><span className="text-slate-400">NISN Verval:</span> <strong className="text-slate-800 font-mono block">{selectedStudent.nisnVerval || '-'}</strong></div>
                  <div>
                    <span className="text-slate-400">Residu:</span>
                    <span className="block text-slate-700">
                      {selectedStudent.residuDetail ? Object.keys(selectedStudent.residuDetail).join(', ') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rekomendasi & Diskrepansi */}
            <div className="space-y-3 bg-amber-50/50 border border-amber-200/80 p-4 rounded-2xl">
              <h4 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Rekomendasi Tindakan untuk Cabang
              </h4>
              <p className="text-sm font-semibold text-slate-800">{selectedStudent.rekomendasiTindakan}</p>

              {selectedStudent.discrepancies && selectedStudent.discrepancies.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200/60">
                  <span className="text-xs font-semibold text-slate-600 block mb-1">Daftar Diskrepansi Terdeteksi:</span>
                  <ul className="list-disc list-inside text-xs text-rose-700 space-y-1">
                    {selectedStudent.discrepancies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
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
