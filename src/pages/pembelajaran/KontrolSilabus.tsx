import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Kelas {
  id: string;
  name: string;
  tingkat: string;
  isActive: boolean;
  cabangId: string;
}

interface PelaksanaanRow {
  silabusId: string;
  mataPelajaranId: string;
  mataPelajaranName: string;
  bab: string;
  section: string;
  tanggalTarget: string;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR';
  tanggalDiajar: string | null;
  catatan: string;
}

const STATUS_OPTIONS = [
  { key: 'COMPLETED', label: 'Dikerjakan', activeBg: 'bg-emerald-600 text-white border-emerald-600', hoverBg: 'hover:bg-emerald-50 text-emerald-600 border-slate-200' },
  { key: 'PENDING', label: 'Belum Dikerjakan', activeBg: 'bg-amber-500 text-white border-amber-500', hoverBg: 'hover:bg-amber-50 text-amber-600 border-slate-200' },
  { key: 'LIBUR', label: 'Libur', activeBg: 'bg-slate-500 text-white border-slate-500', hoverBg: 'hover:bg-slate-100 text-slate-600 border-slate-200' },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function KontrolSilabus() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');

  const [rows, setRows] = useState<PelaksanaanRow[]>([]);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  useEffect(() => {
    if (isWilayah && user?.wilayahId) setSelectedWilayah(user.wilayahId);
    if (isCabang) {
      if (user?.wilayahId) setSelectedWilayah(user.wilayahId);
      if (user?.cabangId) setSelectedCabang(user.cabangId);
    }
  }, [user, isWilayah, isCabang]);

  const handleWilayahChange = (wilayahId: string) => {
    setSelectedWilayah(wilayahId);
    setSelectedCabang('');
    setSelectedKelas('');
  };

  const handleCabangChange = (cabangId: string) => {
    setSelectedCabang(cabangId);
    setSelectedKelas('');
  };

  // Tahun Ajaran & Semester mengikuti Pengaturan Akademik aktif (tidak bisa dipilih bebas)
  const { data: pengaturanAkademik } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/akademik');
      return res.data;
    }
  });
  const tahunAjaran = pengaturanAkademik?.tahunAjaran || '';
  const semester = pengaturanAkademik?.semesterAktif || '';

  const { data: wilayahs = [] } = useQuery({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => (await apiClient.get('/master-data/wilayah')).data,
    enabled: isGlobal
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => (await apiClient.get('/master-data/cabang')).data,
    enabled: isGlobal || isWilayah
  });

  const filteredBranches = branches.filter((b: any) => {
    if (isWilayah && user?.wilayahId) return b.wilayahId === user.wilayahId;
    if (selectedWilayah) return b.wilayahId === selectedWilayah;
    return true;
  });

  const { data: classes = [] } = useQuery<Kelas[]>({
    queryKey: ['kontrol-silabus-classes', selectedWilayah, selectedCabang],
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

  const isReady = !!selectedKelas && !!tahunAjaran && !!semester;

  const { data: fetchedPelaksanaan, isLoading, refetch, isError } = useQuery<PelaksanaanRow[]>({
    queryKey: ['pelaksanaan-silabus', selectedKelas, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/pelaksanaan', {
        params: { kelasId: selectedKelas, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: isReady
  });

  useEffect(() => {
    if (fetchedPelaksanaan) {
      setRows(fetchedPelaksanaan.map(r => ({ ...r, tanggalDiajar: r.tanggalDiajar || todayStr() })));
      setIsSavedSuccessfully(false);
    }
  }, [fetchedPelaksanaan]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = rows.map(r => ({
        silabusId: r.silabusId,
        status: r.status,
        tanggalDiajar: r.status === 'COMPLETED' ? r.tanggalDiajar : null,
        catatan: r.catatan
      }));
      return apiClient.post('/pembelajaran/pelaksanaan/bulk', { kelasId: selectedKelas, logs });
    },
    onSuccess: () => {
      setIsSavedSuccessfully(true);
      refetch();
    }
  });

  const handleStatusChange = (silabusId: string, status: PelaksanaanRow['status']) => {
    setRows(prev => prev.map(r => r.silabusId === silabusId ? { ...r, status } : r));
    setIsSavedSuccessfully(false);
  };

  const markAll = (status: PelaksanaanRow['status']) => {
    setRows(prev => prev.map(r => ({ ...r, status })));
    setIsSavedSuccessfully(false);
  };

  // Group rows by mata pelajaran untuk keterbacaan (satu kelas bisa punya banyak mapel aktif)
  const grouped = rows.reduce<Record<string, PelaksanaanRow[]>>((acc, row) => {
    (acc[row.mataPelajaranName] = acc[row.mataPelajaranName] || []).push(row);
    return acc;
  }, {});

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12">
      <p className="text-sm text-slate-500 mb-4 sm:mb-6">
        Tandai status ketercapaian silabus per bab/section untuk kelas ini pada periode {semester || '-'} {tahunAjaran || ''}.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 shadow-sm mb-4 sm:mb-6 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
          <p className="font-medium text-slate-600">Pilih Kelas untuk memuat daftar silabus.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center items-center shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-center shadow-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat silabus.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-sm">
          Belum ada silabus yang diinput Admin Pusat untuk tingkat kelas ini pada periode aktif.
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2.5 bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tandai Cepat Semua</span>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => markAll(opt.key)}
                  className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] sm:text-xs font-semibold rounded-lg transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {isSavedSuccessfully && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold animate-pulse self-start">
                <CheckCircle className="w-3.5 h-3.5" /> Progres Silabus Tersimpan
              </span>
            )}
          </div>

          {Object.entries(grouped).map(([mapelName, mapelRows]) => (
            <div key={mapelName} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">{mapelName}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {mapelRows.map(row => (
                  <div key={row.silabusId} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{row.bab} — {row.section}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Target: {new Date(row.tanggalTarget).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 sm:flex sm:gap-2 shrink-0">
                      {STATUS_OPTIONS.map(opt => {
                        const active = row.status === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleStatusChange(row.silabusId, opt.key)}
                            className={`px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg border transition-all text-center ${active ? opt.activeBg : opt.hoverBg}`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4 flex justify-end">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Simpan Progres Silabus</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
