import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useGetStudents, Student } from '../../features/core_data/hooks/useGetStudents';
import {
  Activity,
  Loader2,
  FileSpreadsheet,
  Printer,
  Search,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Filter,
  User
} from 'lucide-react';
import KelengkapanSiswaModal from '../../features/core_data/components/KelengkapanSiswaModal';

export default function RekapitulasiKelengkapanData() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  // Filters State
  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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

  // Load Students data
  const { data: students = [], isLoading: isLoadingStudents } = useGetStudents();

  // Helper to calculate student data completeness percentage and details
  const getCompletenessDetails = (student: Student) => {
    const b = student.biodata;
    const fields = [
      { key: 'fullName', label: 'Nama Lengkap', value: b?.fullName },
      { key: 'nik', label: 'NIK', value: b?.nik },
      { key: 'noKk', label: 'Nomor KK', value: (b as any)?.noKk },
      { key: 'anakKe', label: 'Anak Ke-', value: (b as any)?.anakKe },
      { key: 'jumlahSaudara', label: 'Jumlah Saudara', value: (b as any)?.jumlahSaudara },
      { key: 'nisn', label: 'NISN', value: b?.nisn },
      { key: 'tempatLahir', label: 'Tempat Lahir', value: b?.tempatLahir },
      { key: 'tanggalLahir', label: 'Tanggal Lahir', value: b?.tanggalLahir },
      { key: 'jenisKelamin', label: 'Jenis Kelamin', value: b?.jenisKelamin },
      { key: 'namaIbu', label: 'Nama Ibu', value: b?.namaIbu },
      { key: 'namaAyah', label: 'Nama Ayah', value: b?.namaAyah },
      { key: 'phone', label: 'No. Telepon', value: b?.phone },
      { key: 'address', label: 'Alamat', value: b?.address || b?.alamatJalan },
      { key: 'fotoBase64', label: 'Foto', value: b?.fotoBase64, isFile: true },
      { key: 'ijazahBase64', label: 'Ijazah', value: b?.ijazahBase64, isFile: true },
      { key: 'kkBase64', label: 'Kartu Keluarga (KK) File', value: b?.kkBase64, isFile: true },
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

  // Filter students based on selection
  const processedStudents = students
    .filter((s) => {
      // Exclude students in pool (without active cabang placement)
      if (s.statusPool === 'TERSEDIA') return false;

      // Filter by Wilayah
      if (selectedWilayah && s.wilayahId !== selectedWilayah) return false;

      // Filter by Cabang
      if (selectedCabang && s.cabangId !== selectedCabang) return false;

      // Filter by Search Query (Name or NIK or NISN)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = s.biodata?.fullName?.toLowerCase().includes(query);
        const nikMatch = s.biodata?.nik?.includes(query);
        const nisnMatch = s.biodata?.nisn?.includes(query);
        return nameMatch || nikMatch || nisnMatch;
      }

      return true;
    })
    .map((s) => {
      const stats = getCompletenessDetails(s);
      return {
        ...s,
        stats
      };
    });

  // Aggregate statistics
  const totalProcessed = processedStudents.length;
  const averageProgress = totalProcessed > 0
    ? Math.round(processedStudents.reduce((sum, s) => sum + s.stats.percentage, 0) / totalProcessed)
    : 0;
  const completeCount = processedStudents.filter(s => s.stats.percentage === 100).length;
  const incompleteCount = totalProcessed - completeCount;

  return (
    <div className="space-y-6 p-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rekapitulasi Kelengkapan Data Santri</h1>
          <p className="text-slate-500 text-sm mt-1">Laporan dan persentase kelengkapan data pribadi, dokumen, dan berkas santri aktif.</p>
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
            <span className="text-2xl font-bold text-slate-900">{completeCount} <span className="text-xs text-slate-500 font-medium">Santri</span></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Belum Lengkap (&lt;100%)</span>
            <span className="text-2xl font-bold text-slate-900">{incompleteCount} <span className="text-xs text-slate-500 font-medium">Santri</span></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Santri Aktif</span>
            <span className="text-2xl font-bold text-slate-900">{totalProcessed} <span className="text-xs text-slate-500 font-medium">Santri</span></span>
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
                setSelectedCabang(''); // Reset cabang on wilayah change
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
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cari Santri</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama, NIK, atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoadingStudents ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-sm font-semibold">Memuat data kelengkapan...</span>
          </div>
        ) : processedStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">No</th>
                  <th className="py-4 px-6">Nama Lengkap</th>
                  <th className="py-4 px-6">Wilayah & Cabang</th>
                  <th className="py-4 px-6 text-center">Berkas & Ortu</th>
                  <th className="py-4 px-6">Progress Kelengkapan</th>
                  <th className="py-4 px-6 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedStudents.map((s, idx) => {
                  const percent = s.stats.percentage;
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

                  const b = s.biodata;
                  const hasFoto = !!b?.fotoBase64;
                  const hasIjazah = !!b?.ijazahBase64;
                  const hasKK = !!b?.kkBase64;
                  const hasParent = !!b?.namaAyah && !!b?.namaIbu;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-center text-sm font-semibold text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 text-sm">{b?.fullName}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">NIK: {b?.nik || '-'} • NISN: {b?.nisn || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-slate-700">{s.wilayah?.name || 'Tanpa Wilayah'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.cabang?.name || 'Tanpa Cabang'}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span title="Foto" className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${hasFoto ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>FOTO</span>
                          <span title="Ijazah" className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${hasIjazah ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>IJZ</span>
                          <span title="KK" className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${hasKK ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>KK</span>
                          <span title="Ortu" className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${hasParent ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>ORTU</span>
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
                          onClick={() => setSelectedStudent(s)}
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
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
            <XCircle className="w-12 h-12 text-slate-300" />
            <span className="text-sm font-semibold">Tidak ada data santri ditemukan</span>
            <span className="text-xs text-slate-400">Coba ubah filter pencarian Anda</span>
          </div>
        )}
      </div>

      {/* Kelengkapan Detail Modal */}
      {selectedStudent && (
        <KelengkapanSiswaModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
