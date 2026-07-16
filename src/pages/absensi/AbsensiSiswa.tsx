import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Activity, Loader2, Save, AlertCircle, CheckCircle, Search, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  type: string;
  date: string;
  isActive: boolean;
}

interface Kelas {
  id: string;
  name: string;
  tingkat: string;
  isActive: boolean;
  cabangId: string;
}

interface KehadiranRow {
  studentId: string;
  fullName: string;
  nisLokal: string | null;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  catatan: string;
}

export default function AbsensiSiswa() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 10;

  // Local state for the attendance grid
  const [rows, setRows] = useState<KehadiranRow[]>([]);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

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

  // Reset dependent fields when parent fields change
  const handleWilayahChange = (wilayahId: string) => {
    setSelectedWilayah(wilayahId);
    setSelectedCabang('');
    setSelectedKelas('');
    setPage(1);
  };

  const handleCabangChange = (cabangId: string) => {
    setSelectedCabang(cabangId);
    setSelectedKelas('');
    setPage(1);
  };

  // 1. Get Active Programs
  const { data: programs, isLoading: loadingPrograms } = useQuery<Program[]>({
    queryKey: ['absensi-programs-active'],
    queryFn: async () => {
      const res = await apiClient.get('/absensi/programs?activeOnly=true');
      return res.data;
    }
  });

  // 2. Get Wilayah list (Admin / Wilayah only)
  const { data: wilayahs = [], isLoading: loadingWilayahs } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    },
    enabled: isGlobal
  });

  // 3. Get Cabang list
  const { data: branches = [], isLoading: loadingBranches } = useQuery({
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

  // 4. Get Kelas options filtered by selected Cabang
  const { data: classes = [], isLoading: loadingClasses } = useQuery<Kelas[]>({
    queryKey: ['absensi-classes', selectedCabang],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      if (selectedCabang) {
        return res.data.filter((c: any) => c.cabangId === selectedCabang && c.isActive);
      }
      return [];
    },
    enabled: !!selectedCabang
  });

  // Automatically select the first active program when loaded
  useEffect(() => {
    if (programs && programs.length > 0 && !selectedProgram) {
      setSelectedProgram(programs[0].id);
    }
  }, [programs, selectedProgram]);

  // 5. Load attendance list of students when filters change
  const { data: fetchedKehadiran, isLoading: loadingKehadiran, refetch, isError } = useQuery<KehadiranRow[]>({
    queryKey: ['absensi-kehadiran-list', selectedProgram, selectedKelas, selectedCabang],
    queryFn: async () => {
      const res = await apiClient.get(
        `/absensi/kehadiran?programId=${selectedProgram}&kelasId=${selectedKelas}&cabangId=${selectedCabang}`
      );
      return res.data;
    },
    enabled: !!selectedProgram && !!selectedKelas && !!selectedCabang
  });

  // Sync fetched logs to local state
  useEffect(() => {
    if (fetchedKehadiran) {
      setRows(fetchedKehadiran);
      setIsSavedSuccessfully(false);
      setPage(1);
    }
  }, [fetchedKehadiran]);

  // Bulk Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = rows.map(r => ({
        studentId: r.studentId,
        status: r.status,
        catatan: r.catatan
      }));
      return apiClient.post('/absensi/kehadiran/bulk', {
        programId: selectedProgram,
        cabangId: selectedCabang,
        logs
      });
    },
    onSuccess: () => {
      setIsSavedSuccessfully(true);
      refetch();
    }
  });

  const handleStatusChange = (studentId: string, status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA') => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
    setIsSavedSuccessfully(false);
  };

  const handleCatatanChange = (studentId: string, catatan: string) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, catatan } : r));
    setIsSavedSuccessfully(false);
  };

  const markAll = (status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA') => {
    setRows(prev => prev.map(r => ({ ...r, status })));
    setIsSavedSuccessfully(false);
  };

  // Local pagination helper
  const totalPages = Math.ceil(rows.length / limit);
  const paginatedRows = rows.slice((page - 1) * limit, page * limit);

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-300 pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-500" />
          Absensi Kehadiran Siswa
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pilih wilayah, cabang, program absensi, dan kelas untuk mulai mengisi kehadiran siswa pekanan.
        </p>
      </div>

      {/* Filter Selector Section: Wilayah -> Cabang -> Kelas */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Program Absensi</label>
          {loadingPrograms ? (
            <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
          ) : (
            <select
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
            >
              <option value="">-- Pilih Program --</option>
              {(programs || []).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })})</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Wilayah</label>
          <select
            value={selectedWilayah}
            onChange={e => handleWilayahChange(e.target.value)}
            disabled={!isGlobal}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-70"
          >
            {isGlobal ? (
              <>
                <option value="">-- Pilih Wilayah --</option>
                {wilayahs.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
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
            onChange={e => handleCabangChange(e.target.value)}
            disabled={isCabang || (!isGlobal && !selectedWilayah)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-70"
          >
            {isCabang ? (
              <option value={selectedCabang}>{user?.cabangName || 'Cabang Terkunci'}</option>
            ) : (
              <>
                <option value="">-- Pilih Cabang --</option>
                {filteredBranches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Kelas Formal</label>
          <select
            value={selectedKelas}
            onChange={e => setSelectedKelas(e.target.value)}
            disabled={!selectedCabang}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-70"
          >
            <option value="">-- Pilih Kelas --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} (Tingkat {c.tingkat || '-'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Student Attendance Grid */}
      {!selectedProgram || !selectedKelas || !selectedCabang ? (
        <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">Silakan lengkapi pemilihan Wilayah, Cabang, Program Absensi, dan Kelas untuk memuat data siswa.</p>
        </div>
      ) : loadingKehadiran ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-center shadow-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat absensi. Pastikan koneksi server terhubung dengan baik.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
          Belum ada siswa aktif yang terdaftar di kelas ini untuk cabang terpilih.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick Actions Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Tandai Cepat Semua:</span>
              <button
                onClick={() => markAll('HADIR')}
                className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold rounded-lg transition-all"
              >
                Hadir Semua
              </button>
              <button
                onClick={() => markAll('SAKIT')}
                className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-semibold rounded-lg transition-all"
              >
                Sakit Semua
              </button>
              <button
                onClick={() => markAll('IZIN')}
                className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 hover:border-amber-200 text-xs font-semibold rounded-lg transition-all"
              >
                Izin Semua
              </button>
              <button
                onClick={() => markAll('ALPA')}
                className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-semibold rounded-lg transition-all"
              >
                Alpa Semua
              </button>
            </div>
            
            {isSavedSuccessfully && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold animate-pulse">
                <CheckCircle className="w-3.5 h-3.5" /> Absensi Tersimpan
              </span>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    <th className="px-6 py-3 w-16 text-center">No</th>
                    <th className="px-6 py-3 w-32">NIS Lokal</th>
                    <th className="px-6 py-3">Nama Lengkap</th>
                    <th className="px-6 py-3 w-96 text-center">Kehadiran</th>
                    <th className="px-6 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedRows.map((row, idx) => (
                    <tr key={row.studentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-slate-400">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{row.nisLokal || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{row.fullName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {[
                            { key: 'HADIR', label: 'Hadir', activeBg: 'bg-emerald-600 text-white border-emerald-600', hoverBg: 'hover:bg-emerald-50 text-emerald-600 border-slate-200' },
                            { key: 'SAKIT', label: 'Sakit', activeBg: 'bg-blue-600 text-white border-blue-600', hoverBg: 'hover:bg-blue-50 text-blue-600 border-slate-200' },
                            { key: 'IZIN', label: 'Izin', activeBg: 'bg-amber-500 text-white border-amber-500', hoverBg: 'hover:bg-amber-50 text-amber-600 border-slate-200' },
                            { key: 'ALPA', label: 'Alpa', activeBg: 'bg-rose-600 text-white border-rose-600', hoverBg: 'hover:bg-rose-50 text-rose-600 border-slate-200' }
                          ].map(opt => {
                            const active = row.status === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleStatusChange(row.studentId, opt.key as any)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 w-20 text-center ${
                                  active ? opt.activeBg : opt.hoverBg
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Tambahkan catatan (opsional)"
                          value={row.catatan}
                          onChange={e => handleCatatanChange(row.studentId, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs bg-slate-50/30"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination & Save footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              {totalPages > 1 ? (
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <span className="text-xs text-slate-500 font-medium">
                    Halaman {page} dari {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Simpan Absensi Kelas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
