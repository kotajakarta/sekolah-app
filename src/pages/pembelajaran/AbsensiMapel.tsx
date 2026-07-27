import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen, Loader2, Save, AlertCircle, CheckCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
}

interface Kelas {
  id: string;
  name: string;
  tingkat: string;
  isActive: boolean;
  cabangId: string;
}

interface AbsensiMapelRow {
  studentId: string;
  fullName: string;
  nisLokal: string | null;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  catatan: string;
}

const STATUS_OPTIONS = [
  { key: 'HADIR', label: 'Hadir', activeBg: 'bg-emerald-600 text-white border-emerald-600', hoverBg: 'hover:bg-emerald-50 text-emerald-600 border-slate-200' },
  { key: 'SAKIT', label: 'Sakit', activeBg: 'bg-blue-600 text-white border-blue-600', hoverBg: 'hover:bg-blue-50 text-blue-600 border-slate-200' },
  { key: 'IZIN', label: 'Izin', activeBg: 'bg-amber-500 text-white border-amber-500', hoverBg: 'hover:bg-amber-50 text-amber-600 border-slate-200' },
  { key: 'ALPA', label: 'Alpa', activeBg: 'bg-rose-600 text-white border-rose-600', hoverBg: 'hover:bg-rose-50 text-rose-600 border-slate-200' },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AbsensiMapel() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [selectedTanggal, setSelectedTanggal] = useState<string>(todayStr());
  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');

  const [page, setPage] = useState(1);
  const limit = 10;

  const [rows, setRows] = useState<AbsensiMapelRow[]>([]);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  useEffect(() => {
    if (isWilayah && user?.wilayahId) {
      setSelectedWilayah(user.wilayahId);
    }
    if (isCabang) {
      if (user?.wilayahId) setSelectedWilayah(user.wilayahId);
      if (user?.cabangId) setSelectedCabang(user.cabangId);
    }
  }, [user, isWilayah, isCabang]);

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

  const { data: mapelList, isLoading: loadingMapel } = useQuery<Mapel[]>({
    queryKey: ['mapel'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/mapel');
      return res.data;
    }
  });

  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/wilayah');
      return res.data;
    },
    enabled: isGlobal
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang');
      return res.data;
    },
    enabled: isGlobal || isWilayah
  });

  const filteredBranches = branches.filter((b: any) => {
    if (isWilayah && user?.wilayahId) return b.wilayahId === user.wilayahId;
    if (selectedWilayah) return b.wilayahId === selectedWilayah;
    return true;
  });

  const { data: classes = [] } = useQuery<Kelas[]>({
    queryKey: ['absensi-mapel-classes', selectedWilayah, selectedCabang],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      if (selectedCabang) {
        return res.data.filter((c: any) => c.cabangId === selectedCabang && c.isActive);
      } else if (selectedWilayah) {
        const branchIds = filteredBranches.map((b: any) => b.id);
        return res.data.filter((c: any) => branchIds.includes(c.cabangId) && c.isActive);
      }
      return res.data.filter((c: any) => c.isActive);
    }
  });

  const isReady = !!selectedMapel && !!selectedKelas && !!selectedTanggal;

  const { data: fetchedAbsensi, isLoading: loadingAbsensi, refetch, isError } = useQuery<AbsensiMapelRow[]>({
    queryKey: ['absensi-mapel-list', selectedMapel, selectedKelas, selectedTanggal],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/absensi-mapel', {
        params: { kelasId: selectedKelas, mataPelajaranId: selectedMapel, tanggal: selectedTanggal }
      });
      return res.data;
    },
    enabled: isReady
  });

  useEffect(() => {
    if (fetchedAbsensi) {
      setRows(fetchedAbsensi);
      setIsSavedSuccessfully(false);
      setPage(1);
    }
  }, [fetchedAbsensi]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = rows.map(r => ({ studentId: r.studentId, status: r.status, catatan: r.catatan }));
      return apiClient.post('/pembelajaran/absensi-mapel/bulk', {
        kelasId: selectedKelas,
        mataPelajaranId: selectedMapel,
        tanggal: selectedTanggal,
        logs
      });
    },
    onSuccess: () => {
      setIsSavedSuccessfully(true);
      refetch();
    }
  });

  const handleStatusChange = (studentId: string, status: AbsensiMapelRow['status']) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
    setIsSavedSuccessfully(false);
  };

  const handleCatatanChange = (studentId: string, catatan: string) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, catatan } : r));
    setIsSavedSuccessfully(false);
  };

  const markAll = (status: AbsensiMapelRow['status']) => {
    setRows(prev => prev.map(r => ({ ...r, status })));
    setIsSavedSuccessfully(false);
  };

  const totalPages = Math.ceil(rows.length / limit) || 1;
  const paginatedRows = rows.slice((page - 1) * limit, page * limit);

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          Absensi Siswa per Mata Pelajaran
        </h1>
        <p className="hidden sm:block text-sm text-slate-500 mt-1">
          Catat kehadiran siswa untuk sesi mata pelajaran tertentu, terpisah dari absensi harian umum.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-sm mb-4 sm:mb-6 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mata Pelajaran</label>
          {loadingMapel ? (
            <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
          ) : (
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
            >
              <option value="">-- Pilih Mapel --</option>
              {(mapelList || []).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tanggal</label>
          <input
            type="date"
            value={selectedTanggal}
            onChange={e => setSelectedTanggal(e.target.value)}
            max={todayStr()}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Wilayah</label>
          <select
            value={selectedWilayah}
            onChange={e => handleWilayahChange(e.target.value)}
            disabled={!isGlobal}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-70"
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
            onChange={e => handleCabangChange(e.target.value)}
            disabled={isCabang}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 disabled:opacity-70"
          >
            {isCabang ? (
              <option value={selectedCabang}>{user?.cabangName || 'Cabang Terkunci'}</option>
            ) : (
              <>
                <option value="">-- Semua Cabang --</option>
                {filteredBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Kelas Formal</label>
          <select
            value={selectedKelas}
            onChange={e => setSelectedKelas(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
          >
            <option value="">-- Pilih Kelas --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} (Tingkat {c.tingkat || '-'})</option>
            ))}
          </select>
        </div>
      </div>

      {!isReady ? (
        <div className="bg-slate-50 border border-dashed border-slate-300/80 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-slate-300" />
          <p className="font-medium text-slate-600">Pilih Mata Pelajaran, Kelas, dan Tanggal untuk memuat daftar siswa.</p>
        </div>
      ) : loadingAbsensi ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-center shadow-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat absensi. Pastikan koneksi server terhubung dengan baik.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
          Belum ada siswa aktif yang terdaftar di kelas ini.
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tandai Cepat Semua</span>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              <button onClick={() => markAll('HADIR')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-all">Hadir</button>
              <button onClick={() => markAll('SAKIT')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-all">Sakit</button>
              <button onClick={() => markAll('IZIN')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 hover:border-amber-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-all">Izin</button>
              <button onClick={() => markAll('ALPA')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-all">Alpa</button>
            </div>

            {isSavedSuccessfully && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold animate-pulse self-start">
                <CheckCircle className="w-3.5 h-3.5" /> Absensi Tersimpan
              </span>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Mobile: compact card list */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedRows.map((row, idx) => (
                <div key={row.studentId} className="p-3 space-y-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    <span className="text-slate-400 font-normal mr-1.5">{(page - 1) * limit + idx + 1}.</span>
                    {row.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono -mt-1.5">NIS: {row.nisLokal || '-'}</p>
                  <div className="grid grid-cols-4 gap-1">
                    {STATUS_OPTIONS.map(opt => {
                      const active = row.status === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleStatusChange(row.studentId, opt.key)}
                          className={`py-1.5 text-[11px] font-semibold rounded-md border transition-all text-center ${active ? opt.activeBg : opt.hoverBg}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Catatan (opsional)"
                    value={row.catatan}
                    onChange={e => handleCatatanChange(row.studentId, e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs bg-slate-50/30"
                  />
                </div>
              ))}
            </div>

            {/* Desktop: full table */}
            <div className="hidden md:block overflow-x-auto">
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
                      <td className="px-6 py-4 text-center font-medium text-slate-400">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{row.nisLokal || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{row.fullName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {STATUS_OPTIONS.map(opt => {
                            const active = row.status === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleStatusChange(row.studentId, opt.key)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 w-20 text-center ${active ? opt.activeBg : opt.hoverBg}`}
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

            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              {totalPages > 1 ? (
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <span className="text-xs text-slate-500 font-medium">Halaman {page} dari {totalPages}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-xs">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-xs">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : <div />}
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Simpan Absensi Mapel</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
