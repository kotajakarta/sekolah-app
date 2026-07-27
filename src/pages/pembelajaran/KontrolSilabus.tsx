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
  guruId: string | null;
  guruName: string | null;
}

interface GuruOption {
  id: string;
  name: string;
  position: string;
}

const STATUS_OPTIONS = [
  { key: 'COMPLETED', label: 'Dikerjakan', activeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300', hoverBg: 'hover:bg-emerald-50 text-gray-600 border-gray-300' },
  { key: 'PENDING', label: 'Belum Dikerjakan', activeBg: 'bg-amber-100 text-amber-800 border-amber-300', hoverBg: 'hover:bg-amber-50 text-gray-600 border-gray-300' },
  { key: 'LIBUR', label: 'Libur', activeBg: 'bg-gray-200 text-gray-700 border-gray-300', hoverBg: 'hover:bg-gray-100 text-gray-600 border-gray-300' },
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

  const { data: pelaksanaanData, isLoading, refetch, isError } = useQuery<{ items: PelaksanaanRow[]; guruOptions: GuruOption[] }>({
    queryKey: ['pelaksanaan-silabus', selectedKelas, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/pelaksanaan', {
        params: { kelasId: selectedKelas, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: isReady
  });
  const guruOptions = pelaksanaanData?.guruOptions || [];

  useEffect(() => {
    if (pelaksanaanData) {
      setRows(pelaksanaanData.items.map(r => ({ ...r, tanggalDiajar: r.tanggalDiajar || todayStr() })));
      setIsSavedSuccessfully(false);
    }
  }, [pelaksanaanData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = rows.map(r => ({
        silabusId: r.silabusId,
        status: r.status,
        tanggalDiajar: r.tanggalDiajar || null,
        catatan: r.catatan,
        guruId: r.guruId || null
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

  const handleTanggalChange = (silabusId: string, tanggalDiajar: string) => {
    setRows(prev => prev.map(r => r.silabusId === silabusId ? { ...r, tanggalDiajar } : r));
    setIsSavedSuccessfully(false);
  };

  const handleGuruChange = (silabusId: string, guruId: string) => {
    setRows(prev => prev.map(r => r.silabusId === silabusId ? { ...r, guruId: guruId || null } : r));
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
      <p className="text-sm text-gray-500 mb-4 sm:mb-6">
        Tandai status ketercapaian silabus per bab/section untuk kelas ini pada periode {semester || '-'} {tahunAjaran || ''}.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 mb-4 sm:mb-6 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
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
          <p className="font-medium text-gray-600">Pilih Kelas untuk memuat daftar silabus.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> Gagal memuat silabus.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
          Belum ada silabus yang diinput Admin Pusat untuk tingkat kelas ini pada periode aktif.
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-2.5 bg-white border border-gray-200 p-3 sm:p-4 rounded-lg">
            <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Tandai Cepat Semua</span>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => markAll(opt.key)}
                  className="px-2 sm:px-3 py-1.5 sm:py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[11px] sm:text-xs font-semibold rounded-full transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {isSavedSuccessfully && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold self-start">
                <CheckCircle className="w-3.5 h-3.5" /> Progres Silabus Tersimpan
              </span>
            )}
          </div>

          {Object.entries(grouped).map(([mapelName, mapelRows]) => (
            <div key={mapelName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-800">{mapelName}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {mapelRows.map(row => (
                  <div key={row.silabusId} className="p-3 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{row.bab} — {row.section}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
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
                              className={`px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-full border transition-all text-center ${active ? opt.activeBg : opt.hoverBg}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Tanggal Pelaksanaan</label>
                        <input
                          type="date"
                          value={row.tanggalDiajar || ''}
                          onChange={e => handleTanggalChange(row.silabusId, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Pengajar</label>
                        <select
                          value={row.guruId || ''}
                          onChange={e => handleGuruChange(row.silabusId, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                        >
                          <option value="">-- Pilih Pengajar --</option>
                          {row.guruId && !guruOptions.some(g => g.id === row.guruId) && (
                            <option value={row.guruId}>{row.guruName || 'Guru (tidak dikenal)'}</option>
                          )}
                          {guruOptions.map(g => (
                            <option key={g.id} value={g.id}>{g.name}{g.position ? ` — ${g.position}` : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 flex justify-end">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded text-white bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-50 w-full sm:w-auto"
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
