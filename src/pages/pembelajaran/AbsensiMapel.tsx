import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Save, AlertCircle, CheckCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
  aktifPembelajaran: boolean;
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

function RingkasanKehadiran({ rows }: { rows: AbsensiMapelRow[] }) {
  const total = rows.length;
  const counts = {
    HADIR: rows.filter(r => r.status === 'HADIR').length,
    SAKIT: rows.filter(r => r.status === 'SAKIT').length,
    IZIN: rows.filter(r => r.status === 'IZIN').length,
    ALPA: rows.filter(r => r.status === 'ALPA').length,
  };
  const pctHadir = total > 0 ? Math.round((counts.HADIR / total) * 100) : 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 h-fit lg:sticky lg:top-4">
      <h3 className="text-sm font-bold text-gray-800 mb-4">Ringkasan Kehadiran</h3>
      <div className="flex flex-col items-center py-2">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="#1E40AF" strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pctHadir / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{pctHadir}%</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase">Hadir</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hadir</span>
          <span className="font-semibold text-gray-800">{counts.HADIR}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 rounded-full bg-blue-500" /> Sakit</span>
          <span className="font-semibold text-gray-800">{counts.SAKIT}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 rounded-full bg-amber-500" /> Izin</span>
          <span className="font-semibold text-gray-800">{counts.IZIN}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-600"><span className="w-2 h-2 rounded-full bg-rose-500" /> Alpa</span>
          <span className="font-semibold text-gray-800">{counts.ALPA}</span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Siswa</span>
        <span className="text-sm font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
}

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
      <p className="text-sm text-gray-500 mb-4 sm:mb-6">
        Catat kehadiran siswa untuk sesi mata pelajaran tertentu, terpisah dari absensi harian umum.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 mb-4 sm:mb-6 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mata Pelajaran</label>
          {loadingMapel ? (
            <div className="text-gray-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
          ) : (
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
            >
              <option value="">-- Pilih Mapel --</option>
              {(mapelList || []).filter(m => m.aktifPembelajaran).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tanggal</label>
          <input
            type="date"
            value={selectedTanggal}
            onChange={e => setSelectedTanggal(e.target.value)}
            max={todayStr()}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Wilayah</label>
          <select
            value={selectedWilayah}
            onChange={e => handleWilayahChange(e.target.value)}
            disabled={!isGlobal}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 disabled:opacity-70"
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
            onChange={e => handleCabangChange(e.target.value)}
            disabled={isCabang}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 disabled:opacity-70"
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
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Kelas Formal</label>
          <select
            value={selectedKelas}
            onChange={e => setSelectedKelas(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
          >
            <option value="">-- Pilih Kelas --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} (Tingkat {c.tingkat || '-'})</option>
            ))}
          </select>
        </div>
      </div>

      {!isReady ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-8 h-8 mb-2 text-gray-300" />
          <p className="font-medium text-gray-600">Pilih Mata Pelajaran, Kelas, dan Tanggal untuk memuat daftar siswa.</p>
        </div>
      ) : loadingAbsensi ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat absensi. Pastikan koneksi server terhubung dengan baik.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
          Belum ada siswa aktif yang terdaftar di kelas ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-3 sm:space-y-4 min-w-0">
            <div className="flex flex-col gap-2.5 bg-white border border-gray-200 p-3 sm:p-4 rounded-lg">
              <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Tandai Cepat Semua</span>
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                <button onClick={() => markAll('HADIR')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-300 hover:border-emerald-200 text-[11px] sm:text-xs font-semibold rounded-full transition-all">Hadir</button>
                <button onClick={() => markAll('SAKIT')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-blue-50 text-blue-700 border border-gray-300 hover:border-blue-200 text-[11px] sm:text-xs font-semibold rounded-full transition-all">Sakit</button>
                <button onClick={() => markAll('IZIN')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-amber-50 text-amber-700 border border-gray-300 hover:border-amber-200 text-[11px] sm:text-xs font-semibold rounded-full transition-all">Izin</button>
                <button onClick={() => markAll('ALPA')} className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-rose-50 text-rose-700 border border-gray-300 hover:border-rose-200 text-[11px] sm:text-xs font-semibold rounded-full transition-all">Alpa</button>
              </div>

              {isSavedSuccessfully && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold self-start">
                  <CheckCircle className="w-3.5 h-3.5" /> Absensi Tersimpan
                </span>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
              {/* Mobile: compact card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedRows.map((row, idx) => (
                  <div key={row.studentId} className="p-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      <span className="text-gray-400 font-normal mr-1.5">{(page - 1) * limit + idx + 1}.</span>
                      {row.fullName}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono -mt-1.5">NIS: {row.nisLokal || '-'}</p>
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
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                    />
                  </div>
                ))}
              </div>

              {/* Desktop: full table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                      <th className="px-6 py-3 w-16 text-center">No</th>
                      <th className="px-6 py-3 w-32">NIS Lokal</th>
                      <th className="px-6 py-3">Nama Lengkap</th>
                      <th className="px-6 py-3 w-96 text-center">Kehadiran</th>
                      <th className="px-6 py-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedRows.map((row, idx) => (
                      <tr key={row.studentId} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4 text-center font-medium text-gray-400">{(page - 1) * limit + idx + 1}</td>
                        <td className="px-6 py-4 font-mono text-gray-600">{row.nisLokal || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{row.fullName}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {STATUS_OPTIONS.map(opt => {
                              const active = row.status === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => handleStatusChange(row.studentId, opt.key)}
                                  className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all shrink-0 w-20 text-center ${active ? opt.activeBg : opt.hoverBg}`}
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
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                {totalPages > 1 ? (
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <span className="text-xs text-gray-500 font-medium">Halaman {page} dari {totalPages}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-gray-300 bg-white rounded text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-gray-300 bg-white rounded text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : <div />}
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded text-white bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-50 w-full sm:w-auto"
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

          <RingkasanKehadiran rows={rows} />
        </div>
      )}
    </div>
  );
}
