import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Info, AlertCircle, ChevronDown, ChevronRight, BookOpen, Download, MessageCircleQuestion } from 'lucide-react';

interface Kelas {
  id: string;
  name: string;
  tingkat: string;
  isActive: boolean;
  cabangId: string;
}

interface SilabusItem {
  silabusId: string;
  mataPelajaranId: string;
  mataPelajaranName: string;
  bab: string;
  section: string;
  tanggalTarget: string | null;
  defaultGuruId: string | null;
  defaultGuruName: string | null;
}

interface ExecutedSession {
  silabusId: string | null;
  mataPelajaranId: string;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR';
  tanggalDiajar: string;
}

type ProgStatus = 'SELESAI' | 'SEDANG_BERJALAN' | 'BELUM_MULAI';

const STATUS_META: Record<ProgStatus, { label: string; cls: string }> = {
  SELESAI: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  SEDANG_BERJALAN: { label: 'Sedang Berjalan', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  BELUM_MULAI: { label: 'Belum Mulai', cls: 'bg-gray-100 text-gray-600 border-gray-200' }
};

const formatShort = (date: string | null) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-';

function CircleProgress({ percent }: { percent: number }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e3a8a"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-900">{percent}%</div>
    </div>
  );
}

interface BabGroup {
  bab: string;
  items: SilabusItem[];
  itemStatuses: ProgStatus[];
  status: ProgStatus;
  targetLabel: string;
}

interface MapelProgress {
  mataPelajaranId: string;
  mataPelajaranName: string;
  guruName: string | null;
  babGroups: BabGroup[];
  totalBab: number;
  completedBab: number;
  percent: number;
}

export default function ProgresSilabus() {
  const { user } = useAuth();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const [selectedWilayah, setSelectedWilayah] = useState('');
  const [selectedCabang, setSelectedCabang] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [expandedMapel, setExpandedMapel] = useState('');
  const [expandedBab, setExpandedBab] = useState<Record<string, boolean>>({});

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

  const { data: pengaturanAkademik } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => (await apiClient.get('/pengaturan/akademik')).data
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
    queryKey: ['progres-silabus-classes', selectedWilayah, selectedCabang],
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

  const { data: pelaksanaanData, isLoading, isError } = useQuery<{ items: SilabusItem[]; executions: ExecutedSession[] }>({
    queryKey: ['pelaksanaan-silabus', selectedKelas, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/pelaksanaan', {
        params: { kelasId: selectedKelas, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: isReady
  });

  const mapelProgress: MapelProgress[] = useMemo(() => {
    const items = pelaksanaanData?.items || [];
    const execs = pelaksanaanData?.executions || [];

    const itemStatus = (item: SilabusItem): ProgStatus => {
      const rel = execs.filter(e => e.silabusId === item.silabusId);
      if (rel.some(e => e.status === 'COMPLETED')) return 'SELESAI';
      if (rel.length > 0) return 'SEDANG_BERJALAN';
      return 'BELUM_MULAI';
    };

    const mapelOrder: string[] = [];
    const byMapel = new Map<string, SilabusItem[]>();
    items.forEach(item => {
      if (!byMapel.has(item.mataPelajaranId)) {
        byMapel.set(item.mataPelajaranId, []);
        mapelOrder.push(item.mataPelajaranId);
      }
      byMapel.get(item.mataPelajaranId)!.push(item);
    });

    return mapelOrder.map(mapelId => {
      const mapelItems = byMapel.get(mapelId)!;
      const babOrder: string[] = [];
      const byBab = new Map<string, SilabusItem[]>();
      mapelItems.forEach(item => {
        if (!byBab.has(item.bab)) {
          byBab.set(item.bab, []);
          babOrder.push(item.bab);
        }
        byBab.get(item.bab)!.push(item);
      });

      const babGroups: BabGroup[] = babOrder.map(bab => {
        const babItems = byBab.get(bab)!;
        const statuses = babItems.map(itemStatus);
        const status: ProgStatus = statuses.every(s => s === 'SELESAI')
          ? 'SELESAI'
          : statuses.some(s => s !== 'BELUM_MULAI') ? 'SEDANG_BERJALAN' : 'BELUM_MULAI';
        const dates = babItems.map(i => i.tanggalTarget).filter((d): d is string => !!d).sort();
        const targetLabel = dates.length === 0
          ? '-'
          : dates[0] === dates[dates.length - 1]
            ? formatShort(dates[0])
            : `${formatShort(dates[0])} - ${formatShort(dates[dates.length - 1])}`;
        return { bab, items: babItems, itemStatuses: statuses, status, targetLabel };
      });

      const completedBab = babGroups.filter(b => b.status === 'SELESAI').length;
      const totalBab = babGroups.length;
      const percent = totalBab > 0 ? Math.round((completedBab / totalBab) * 100) : 0;

      return {
        mataPelajaranId: mapelId,
        mataPelajaranName: mapelItems[0].mataPelajaranName,
        guruName: mapelItems.find(i => i.defaultGuruName)?.defaultGuruName || null,
        babGroups,
        totalBab,
        completedBab,
        percent
      };
    });
  }, [pelaksanaanData]);

  useEffect(() => {
    if (mapelProgress.length === 0) {
      setExpandedMapel('');
      return;
    }
    if (!mapelProgress.some(m => m.mataPelajaranId === expandedMapel)) {
      setExpandedMapel(mapelProgress[0].mataPelajaranId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapelProgress]);

  const toggleBab = (key: string) => setExpandedBab(prev => ({ ...prev, [key]: !prev[key] }));

  const handleDownload = () => {
    const rows = [['Mata Pelajaran', 'Bab', 'Target Waktu', 'Status']];
    mapelProgress.forEach(m => {
      m.babGroups.forEach(b => {
        rows.push([m.mataPelajaranName, b.bab, b.targetLabel, STATUS_META[b.status].label]);
      });
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const kelasName = classes.find(c => c.id === selectedKelas)?.name || 'kelas';
    const a = document.createElement('a');
    a.href = url;
    a.download = `progres-silabus-${kelasName}-${tahunAjaran}-${semester}.csv`.replace(/\s+/g, '-');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12">
      <p className="text-xs text-gray-500 mb-3 sm:mb-4">Pantau capaian kurikulum akademik semester ini.</p>

      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 sm:mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
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
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Kelas</label>
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
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-6 h-6 mb-1.5 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Pilih Kelas untuk memuat progres silabus.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> Gagal memuat progres silabus.
        </div>
      ) : mapelProgress.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
          Belum ada silabus yang diinput Admin Pusat untuk tingkat kelas ini pada periode aktif.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {mapelProgress.map(m => (
              <button
                key={m.mataPelajaranId}
                type="button"
                onClick={() => setExpandedMapel(m.mataPelajaranId)}
                className={`bg-white border rounded-lg p-3 flex flex-col items-center gap-1.5 transition-all ${
                  expandedMapel === m.mataPelajaranId ? 'border-blue-800 ring-2 ring-blue-800/10' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CircleProgress percent={m.percent} />
                <p className="text-xs font-bold text-gray-800 text-center truncate w-full">{m.mataPelajaranName}</p>
                <p className="text-[10px] text-gray-400">{m.completedBab}/{m.totalBab} Bab Selesai</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {mapelProgress.map(m => {
              const isOpen = expandedMapel === m.mataPelajaranId;
              return (
                <div key={m.mataPelajaranId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedMapel(isOpen ? '' : m.mataPelajaranId)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50/60 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${isOpen ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate">{m.mataPelajaranName}</p>
                      {m.guruName && <p className="text-[11px] text-gray-500 truncate">Guru: {m.guruName}</p>}
                    </div>
                    {!isOpen && (
                      <div className="hidden sm:block w-40 shrink-0">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-800 rounded-full" style={{ width: `${m.percent}%` }} />
                        </div>
                      </div>
                    )}
                    <span className="text-sm font-bold text-blue-900 shrink-0 w-12 text-right">{m.percent}%</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left">
                            <th className="px-3 py-2">Struktur Kurikulum</th>
                            <th className="px-3 py-2">Target Waktu</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {m.babGroups.map(b => {
                            const key = `${m.mataPelajaranId}__${b.bab}`;
                            const babOpen = !!expandedBab[key];
                            return (
                              <React.Fragment key={key}>
                                <tr className="hover:bg-gray-50/60 transition-colors">
                                  <td className="px-3 py-2">
                                    <p className="font-semibold text-blue-900">{b.bab}</p>
                                    <p className="text-[11px] text-gray-400">{b.items.length} sub-bab</p>
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{b.targetLabel}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_META[b.status].cls}`}>
                                      {STATUS_META[b.status].label}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => toggleBab(key)}
                                      className="text-xs font-semibold text-blue-800 hover:text-blue-900 hover:underline"
                                    >
                                      {babOpen ? 'Sembunyikan' : 'Lihat Materi'}
                                    </button>
                                  </td>
                                </tr>
                                {babOpen && (
                                  <tr>
                                    <td colSpan={4} className="px-3 pb-3 bg-gray-50/60">
                                      <div className="space-y-1 pt-1">
                                        {b.items.map((item, idx) => (
                                          <div key={item.silabusId} className="flex items-center justify-between gap-2 text-xs bg-white border border-gray-100 rounded px-2.5 py-1.5">
                                            <span className="text-gray-700 truncate">{item.section}</span>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${STATUS_META[b.itemStatuses[idx]].cls}`}>
                                              {STATUS_META[b.itemStatuses[idx]].label}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-800 text-white rounded-lg p-3.5 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Catatan Akademik</p>
                <p className="text-[11px] text-blue-100 mt-0.5">
                  Progres silabus diperbarui langsung setiap kali Kontrol Silabus disimpan oleh koordinator mata pelajaran masing-masing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center gap-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-800 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Unduh Silabus</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Format CSV (buka di Excel)</p>
              </div>
            </button>
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center gap-2.5">
              <MessageCircleQuestion className="w-4 h-4 text-blue-800 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Bantuan Teknis</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Hubungi Admin IT cabang Anda.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
