import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, Save, AlertCircle, CheckCircle, X, Search } from 'lucide-react';

interface AbsensiSilabusRow {
  studentId: string;
  fullName: string;
  nisLokal: string | null;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  catatan: string;
}

interface AbsensiSilabusResponse {
  mataPelajaranName: string;
  bab: string;
  section: string;
  tanggalDefault: string | null;
  students: AbsensiSilabusRow[];
}

const STATUS_OPTIONS = [
  { key: 'HADIR', label: 'Hadir', activeBg: 'bg-emerald-600 text-white border-emerald-600', hoverBg: 'hover:bg-emerald-50 text-emerald-600 border-slate-200' },
  { key: 'SAKIT', label: 'Sakit', activeBg: 'bg-blue-600 text-white border-blue-600', hoverBg: 'hover:bg-blue-50 text-blue-600 border-slate-200' },
  { key: 'IZIN', label: 'Izin', activeBg: 'bg-amber-500 text-white border-amber-500', hoverBg: 'hover:bg-amber-50 text-amber-600 border-slate-200' },
  { key: 'ALPA', label: 'Alpa', activeBg: 'bg-rose-600 text-white border-rose-600', hoverBg: 'hover:bg-rose-50 text-rose-600 border-slate-200' },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Props {
  kelasId: string;
  kelasName: string;
  silabusId: string;
  tanggal?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AbsensiSilabusModal({ kelasId, kelasName, silabusId, tanggal: propTanggal, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<AbsensiSilabusRow[]>([]);
  const [tanggal, setTanggal] = useState(propTanggal || todayStr());
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError } = useQuery<AbsensiSilabusResponse>({
    queryKey: ['absensi-silabus', kelasId, silabusId, propTanggal],
    queryFn: async () => (await apiClient.get('/pembelajaran/absensi-mapel', { params: { kelasId, silabusId, tanggal: propTanggal } })).data
  });

  useEffect(() => {
    if (data) {
      setRows(data.students);
      if (propTanggal) {
        setTanggal(propTanggal);
      } else if (data.tanggalDefault) {
        setTanggal(data.tanggalDefault.slice(0, 10));
      }
      setIsSavedSuccessfully(false);
    }
  }, [data, propTanggal]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = rows.map(r => ({ studentId: r.studentId, status: r.status, catatan: r.catatan }));
      return apiClient.post('/pembelajaran/absensi-mapel/bulk', { kelasId, silabusId, tanggal, logs });
    },
    onSuccess: () => {
      setIsSavedSuccessfully(true);
      queryClient.invalidateQueries({ queryKey: ['absensi-silabus', kelasId, silabusId, propTanggal] });
      // Dashboard & Laporan ikut disegarkan.
      queryClient.invalidateQueries({ queryKey: ['pembelajaran-ringkasan'] });
      queryClient.invalidateQueries({ queryKey: ['laporan-pembelajaran'] });
      onSaved?.();
    }
  });

  const handleStatusChange = (studentId: string, status: AbsensiSilabusRow['status']) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
    setIsSavedSuccessfully(false);
  };

  const handleCatatanChange = (studentId: string, catatan: string) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, catatan } : r));
    setIsSavedSuccessfully(false);
  };

  const markAll = (status: AbsensiSilabusRow['status']) => {
    setRows(prev => prev.map(r => ({ ...r, status })));
    setIsSavedSuccessfully(false);
  };

  const filteredRows = rows.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.fullName.toLowerCase().includes(q) ||
      (r.nisLokal && r.nisLokal.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Absensi &mdash; {data ? `${data.bab} — ${data.section}` : 'Memuat...'}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {data?.mataPelajaranName} &middot; {kelasName}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
            </div>
          ) : isError || !data ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center flex items-center justify-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> Gagal memuat data absensi.
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
              Belum ada siswa aktif yang terdaftar di kelas ini.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={e => { setTanggal(e.target.value); setIsSavedSuccessfully(false); }}
                    max={todayStr()}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                  />
                </div>

                <div className="flex-1 min-w-[200px] max-w-xs">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Cari Santri</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama santri / NIS..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                    />
                  </div>
                </div>

                {isSavedSuccessfully && (
                  <div className="self-end pb-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
                      <CheckCircle className="w-3 h-3" /> Tersimpan
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 p-2.5 rounded-lg">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mr-1">Tandai Cepat:</span>
                <button onClick={() => markAll('HADIR')} className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-300 hover:border-emerald-200 text-[11px] font-semibold rounded-full transition-all">Hadir</button>
                <button onClick={() => markAll('SAKIT')} className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-gray-300 hover:border-blue-200 text-[11px] font-semibold rounded-full transition-all">Sakit</button>
                <button onClick={() => markAll('IZIN')} className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-gray-300 hover:border-amber-200 text-[11px] font-semibold rounded-full transition-all">Izin</button>
                <button onClick={() => markAll('ALPA')} className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-gray-300 hover:border-rose-200 text-[11px] font-semibold rounded-full transition-all">Alpa</button>
                {searchQuery && (
                  <span className="ml-auto text-[11px] text-gray-500 font-medium">
                    Tampil {filteredRows.length} dari {rows.length} santri
                  </span>
                )}
              </div>

              {filteredRows.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
                  Tidak ada santri yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Mobile: compact card list */}
                  <div className="sm:hidden divide-y divide-gray-100">
                    {filteredRows.map((row, idx) => (
                      <div key={row.studentId} className="p-2.5 space-y-1.5">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          <span className="text-gray-400 font-normal mr-1.5">{idx + 1}.</span>
                          {row.fullName}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono -mt-1">NIS: {row.nisLokal || '-'}</p>
                        <div className="grid grid-cols-4 gap-1">
                          {STATUS_OPTIONS.map(opt => {
                            const active = row.status === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleStatusChange(row.studentId, opt.key)}
                                className={`py-1 text-[11px] font-semibold rounded-md border transition-all text-center ${active ? opt.activeBg : opt.hoverBg}`}
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
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Desktop: full table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left">
                          <th className="px-3 py-2 w-10 text-center">No</th>
                          <th className="px-3 py-2 w-24">NIS Lokal</th>
                          <th className="px-3 py-2">Nama Lengkap</th>
                          <th className="px-3 py-2 w-72 text-center">Kehadiran</th>
                          <th className="px-3 py-2">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredRows.map((row, idx) => (
                          <tr key={row.studentId} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-3 py-2 text-center font-medium text-gray-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-gray-600">{row.nisLokal || '-'}</td>
                            <td className="px-3 py-2 font-semibold text-gray-800">{row.fullName}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                {STATUS_OPTIONS.map(opt => {
                                  const active = row.status === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => handleStatusChange(row.studentId, opt.key)}
                                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all shrink-0 w-14 text-center ${active ? opt.activeBg : opt.hoverBg}`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Catatan (opsional)"
                                value={row.catatan}
                                onChange={e => handleCatatanChange(row.studentId, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {data && rows.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded text-white bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Simpan Absensi</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
