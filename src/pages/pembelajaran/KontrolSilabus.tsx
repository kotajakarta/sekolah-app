import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Save, AlertCircle, CheckCircle, Info, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import AbsensiSilabusModal from './AbsensiSilabusModal';

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
  tanggalTarget: string;
  defaultGuruId: string | null;
  defaultGuruName: string | null;
}

interface ExecutedSession {
  id?: string;
  silabusId: string | null;
  mataPelajaranId: string;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR';
  tanggalDiajar: string;
  catatan: string;
  guruId: string | null;
  guruName: string | null;
  hasAbsensi: boolean;
}

interface GuruOption {
  id: string;
  name: string;
  position: string;
}

interface LiburMarker {
  id: string;
  mataPelajaranId: string;
  tanggalDiajar: string;
}

const STATUS_OPTIONS = [
  { key: 'COMPLETED', label: 'Dikerjakan', activeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300', hoverBg: 'hover:bg-emerald-50 text-gray-600 border-gray-300' },
  { key: 'PENDING', label: 'Belum Dikerjakan', activeBg: 'bg-amber-100 text-amber-800 border-amber-300', hoverBg: 'hover:bg-amber-50 text-gray-600 border-gray-300' },
  { key: 'LIBUR', label: 'Libur', activeBg: 'bg-gray-200 text-gray-700 border-gray-300', hoverBg: 'hover:bg-gray-100 text-gray-600 border-gray-300' },
] as const;

function getSaturdaysInMonth(year: number, month: number): string[] {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month, day).getDay() === 6) {
      dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
  }
  return dates;
}

const formatTanggal = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

const formatTanggalShort = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

const todayStr = () => new Date().toISOString().slice(0, 10);
const isFutureDate = (date: string) => date > todayStr();

export const PEMBELAJARAN_DEPENDENT_KEYS = [['pembelajaran-ringkasan'], ['laporan-pembelajaran']];

export default function KontrolSilabus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');

  const [silabusItems, setSilabusItems] = useState<SilabusItem[]>([]);
  const [executions, setExecutions] = useState<Record<string, ExecutedSession>>({});
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [absensiTarget, setAbsensiTarget] = useState<{ silabusId: string; tanggal: string } | null>(null);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

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
    queryKey: ['kontrol-silabus-classes', selectedWilayah, selectedCabang],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      let filtered = res.data.filter((c: any) => c.isActive && (c._count?.siswaFormal ?? 0) > 0);
      if (selectedCabang) {
        return filtered.filter((c: any) => c.cabangId === selectedCabang);
      } else if (selectedWilayah) {
        const branchIds = filteredBranches.map((b: any) => b.id);
        return filtered.filter((c: any) => branchIds.includes(c.cabangId));
      }
      return filtered;
    }
  });

  const isReady = !!selectedKelas && !!tahunAjaran && !!semester;

  const { data: pelaksanaanData, isLoading, refetch, isError } = useQuery<{
    items: SilabusItem[];
    executions: ExecutedSession[];
    guruOptions: GuruOption[];
    liburMarkers: LiburMarker[];
  }>({
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
  const [liburRows, setLiburRows] = useState<LiburMarker[]>([]);

  useEffect(() => {
    if (pelaksanaanData) {
      const items = pelaksanaanData.items || [];
      const execsRaw = pelaksanaanData.executions || [];
      setSilabusItems(items);

      const map: Record<string, ExecutedSession> = {};
      execsRaw.forEach(e => {
        if (e.tanggalDiajar) {
          const tgl = e.tanggalDiajar.slice(0, 10);
          map[`${e.mataPelajaranId}__${tgl}`] = {
            ...e,
            tanggalDiajar: tgl
          };
        }
      });
      setExecutions(map);
      setLiburRows((pelaksanaanData.liburMarkers || []).map(l => ({ ...l, tanggalDiajar: l.tanggalDiajar.slice(0, 10) })));

      setSelectedMapel(prev => (prev && items.some(i => i.mataPelajaranId === prev) ? prev : ''));
    }
  }, [pelaksanaanData]);

  const invalidateDependents = () => {
    PEMBELAJARAN_DEPENDENT_KEYS.forEach(queryKey => queryClient.invalidateQueries({ queryKey }));
  };

  useEffect(() => {
    setIsSavedSuccessfully(false);
  }, [selectedKelas]);

  const markLiburMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await apiClient.post('/pembelajaran/pelaksanaan/libur', { kelasId: selectedKelas, mataPelajaranId: selectedMapel, tanggal: date });
      return res.data;
    },
    onSuccess: (data, date) => {
      setLiburRows(prev => [...prev.filter(l => !(l.mataPelajaranId === selectedMapel && l.tanggalDiajar === date)), { id: data.id, mataPelajaranId: selectedMapel, tanggalDiajar: date }]);
      invalidateDependents();
    }
  });

  const clearLiburMutation = useMutation({
    mutationFn: async (date: string) => {
      await apiClient.post('/pembelajaran/pelaksanaan/libur/clear', { kelasId: selectedKelas, mataPelajaranId: selectedMapel, tanggal: date });
    },
    onSuccess: (_data, date) => {
      setLiburRows(prev => prev.filter(l => !(l.mataPelajaranId === selectedMapel && l.tanggalDiajar === date)));
      invalidateDependents();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const logs = Object.entries(executions).map(([key, sess]) => {
        const [mataPelajaranId, tanggalDiajar] = key.split('__');
        return {
          silabusId: sess.silabusId,
          mataPelajaranId,
          tanggalDiajar,
          status: sess.status,
          catatan: sess.catatan,
          guruId: sess.guruId || null
        };
      });
      return apiClient.post('/pembelajaran/pelaksanaan/bulk', { kelasId: selectedKelas, logs });
    },
    onSuccess: () => {
      setIsSavedSuccessfully(true);
      refetch();
      invalidateDependents();
    }
  });

  const handleAssign = (date: string, silabusId: string) => {
    if (!selectedMapel) return;
    if (silabusId && isFutureDate(date)) return; // hanya boleh mengisi materi untuk hari ini atau sebelumnya
    const key = `${selectedMapel}__${date}`;
    if (!silabusId) {
      setExecutions(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      const item = silabusItems.find(i => i.silabusId === silabusId);
      setExecutions(prev => ({
        ...prev,
        [key]: {
          silabusId,
          mataPelajaranId: selectedMapel,
          tanggalDiajar: date,
          status: prev[key]?.status || 'PENDING',
          catatan: prev[key]?.catatan || '',
          guruId: prev[key]?.guruId || item?.defaultGuruId || null,
          guruName: prev[key]?.guruName || item?.defaultGuruName || null,
          hasAbsensi: prev[key]?.hasAbsensi || false
        }
      }));
    }
    setIsSavedSuccessfully(false);
  };

  const handleStatusChange = (date: string, status: ExecutedSession['status']) => {
    if (!selectedMapel || isFutureDate(date)) return;
    const key = `${selectedMapel}__${date}`;
    setExecutions(prev => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: { ...prev[key], status }
      };
    });
    setIsSavedSuccessfully(false);
  };

  const handleGuruChange = (date: string, guruId: string) => {
    if (!selectedMapel || isFutureDate(date)) return;
    const key = `${selectedMapel}__${date}`;
    const selectedGuru = guruOptions.find(g => g.id === guruId);
    setExecutions(prev => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: { ...prev[key], guruId: guruId || null, guruName: selectedGuru?.name || null }
      };
    });
    setIsSavedSuccessfully(false);
  };

  const mapelOptions = Array.from(
    new Map(silabusItems.map(i => [i.mataPelajaranId, i.mataPelajaranName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const mapelSilabusList = selectedMapel ? silabusItems.filter(i => i.mataPelajaranId === selectedMapel) : [];

  const assignedSilabusIds = new Set(
    Object.entries(executions)
      .filter(([k, v]) => k.startsWith(selectedMapel + '__') && !!v.silabusId)
      .map(([, v]) => v.silabusId as string)
  );
  const unassignedSections = mapelSilabusList.filter(i => !assignedSilabusIds.has(i.silabusId));

  const mapelLiburRows = selectedMapel ? liburRows.filter(l => l.mataPelajaranId === selectedMapel) : [];
  const liburByDate = new Map(mapelLiburRows.map(l => [l.tanggalDiajar, l]));

  const saturdays = getSaturdaysInMonth(viewDate.year, viewDate.month);
  const monthPrefix = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}`;
  
  const mapelExecDates = Object.keys(executions)
    .filter(k => k.startsWith(selectedMapel + '__'))
    .map(k => k.split('__')[1])
    .filter(d => d.startsWith(monthPrefix) && !saturdays.includes(d));

  const extraDates = Array.from(
    new Set([
      ...mapelExecDates,
      ...mapelLiburRows
        .filter(l => l.tanggalDiajar.startsWith(monthPrefix) && !saturdays.includes(l.tanggalDiajar))
        .map(l => l.tanggalDiajar)
    ])
  );
  const datesInView = [...saturdays, ...extraDates].sort();
  const monthLabel = new Date(viewDate.year, viewDate.month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const goPrevMonth = () => setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
  const goNextMonth = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

  const assignedInView = datesInView
    .map(d => executions[`${selectedMapel}__${d}`])
    .filter((e): e is ExecutedSession => !!e && !!e.silabusId);

  const markAll = (status: ExecutedSession['status']) => {
    setExecutions(prev => {
      const next = { ...prev };
      datesInView.forEach(d => {
        if (isFutureDate(d)) return;
        const key = `${selectedMapel}__${d}`;
        if (next[key] && next[key].silabusId) {
          next[key] = { ...next[key], status };
        }
      });
      return next;
    });
    setIsSavedSuccessfully(false);
  };

  return (
    <div className="font-sans text-[#1d1d1f] animate-in fade-in duration-300 pb-12">
      <p className="text-xs text-gray-500 mb-3 sm:mb-4">
        Tandai status ketercapaian silabus per sesi Sabtu untuk kelas ini pada periode {semester || '-'} {tahunAjaran || ''}.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 sm:mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
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

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mapel</label>
          <select
            value={selectedMapel}
            onChange={e => setSelectedMapel(e.target.value)}
            disabled={mapelOptions.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 disabled:opacity-70"
          >
            <option value="">-- Pilih Mapel --</option>
            {mapelOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {!isReady ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-6 h-6 mb-1.5 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Pilih Kelas untuk memuat daftar silabus.</p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center flex items-center justify-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> Gagal memuat silabus.
        </div>
      ) : silabusItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
          Belum ada silabus yang diinput Admin Pusat untuk tingkat kelas ini pada periode aktif.
        </div>
      ) : !selectedMapel ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400 flex flex-col items-center justify-center">
          <Info className="w-6 h-6 mb-1.5 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Pilih Mata Pelajaran untuk memuat jadwal sesi Sabtu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 p-2.5 rounded-lg">
            <div className="flex items-center gap-1 mr-2">
              <button type="button" onClick={goPrevMonth} className="p-1 border border-gray-300 bg-white rounded text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-800 w-32 text-center capitalize">{monthLabel}</span>
              <button type="button" onClick={goNextMonth} className="p-1 border border-gray-300 bg-white rounded text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mr-1">Tandai Cepat:</span>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => markAll(opt.key)}
                disabled={assignedInView.length === 0}
                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[11px] font-semibold rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {opt.label}
              </button>
            ))}
            {isSavedSuccessfully && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold ml-auto">
                <CheckCircle className="w-3 h-3" /> Tersimpan
              </span>
            )}
          </div>

          {unassignedSections.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
              <span className="font-semibold">{unassignedSections.length} materi belum dijadwalkan ke sesi Sabtu manapun:</span>{' '}
              {unassignedSections.map(s => `${s.bab} — ${s.section}`).join(', ')}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              {datesInView.map(date => {
                const key = `${selectedMapel}__${date}`;
                const assigned = executions[key];
                const bareLibur = !assigned ? liburByDate.get(date) : undefined;
                const liburPending = (markLiburMutation.isPending && markLiburMutation.variables === date)
                  || (clearLiburMutation.isPending && clearLiburMutation.variables === date);
                const future = isFutureDate(date);
                return (
                  <div key={date} className="p-2.5 flex flex-col lg:flex-row lg:items-center gap-2">
                    <div className="lg:w-44 shrink-0">
                      <p className="text-sm font-semibold text-gray-800 capitalize">{formatTanggal(date)}</p>
                      {future && (
                        <p className="text-[10px] text-gray-400 font-medium">Tanggal mendatang</p>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-stretch gap-1.5">
                      <button
                        type="button"
                        onClick={() => assigned?.silabusId && setAbsensiTarget({ silabusId: assigned.silabusId, tanggal: date })}
                        disabled={!assigned || !assigned.silabusId || assigned.status === 'LIBUR'}
                        title={!assigned || !assigned.silabusId ? 'Pilih materi dahulu' : assigned.status === 'LIBUR' ? 'Libur — tidak ada sesi' : 'Isi absensi untuk materi ini'}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded text-white bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Absensi
                      </button>
                      {assigned && assigned.silabusId && assigned.status !== 'LIBUR' && (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-center ${
                            assigned.hasAbsensi ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {assigned.hasAbsensi ? 'Sudah Absensi' : 'Belum Absensi'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {bareLibur ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-semibold text-gray-600">
                          Libur (Tanpa Materi)
                        </div>
                      ) : (
                        <select
                          value={assigned?.silabusId || ''}
                          onChange={e => handleAssign(date, e.target.value)}
                          disabled={future && !assigned}
                          title={future && !assigned ? 'Tidak dapat mengisi materi untuk tanggal mendatang' : 'Materi Silabus'}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 disabled:opacity-50 disabled:bg-gray-50"
                        >
                          <option value="">-- Pilih Materi --</option>
                          {mapelSilabusList.map(o => {
                            const otherDates = Object.entries(executions)
                              .filter(([k, v]) => k.startsWith(selectedMapel + '__') && !k.endsWith('__' + date) && v.silabusId === o.silabusId)
                              .map(([k]) => formatTanggalShort(k.split('__')[1]));

                            const hasCompleted = Object.values(executions).some(v => v.silabusId === o.silabusId && v.status === 'COMPLETED');
                            const doneMark = hasCompleted ? ' ✓' : '';

                            return (
                              <option key={o.silabusId} value={o.silabusId}>
                                {o.bab} — {o.section}{doneMark}{otherDates.length > 0 ? ` (Sudah di ${otherDates.join(', ')})` : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>

                    <div className="shrink-0 w-full lg:w-40">
                      <select
                        value={assigned?.guruId || ''}
                        onChange={e => handleGuruChange(date, e.target.value)}
                        disabled={!assigned || !assigned.silabusId || future}
                        title="Pengajar"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-800/15 disabled:opacity-50"
                      >
                        <option value="">-- Pengajar --</option>
                        {assigned?.guruId && !guruOptions.some(g => g.id === assigned.guruId) && (
                          <option value={assigned.guruId}>{assigned.guruName || 'Guru (tidak dikenal)'}</option>
                        )}
                        {guruOptions.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 lg:flex lg:gap-1.5 shrink-0">
                      {STATUS_OPTIONS.map(opt => {
                        const isLiburOption = opt.key === 'LIBUR';
                        const active = assigned ? assigned.status === opt.key : (isLiburOption && !!bareLibur);
                        const disabled = assigned
                          ? future
                          : (!isLiburOption || liburPending || (future && !bareLibur));
                        const handleClick = () => {
                          if (assigned) {
                            handleStatusChange(date, opt.key);
                            return;
                          }
                          if (!isLiburOption) return;
                          if (bareLibur) clearLiburMutation.mutate(date);
                          else markLiburMutation.mutate(date);
                        };
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={disabled}
                            title={
                              future && !bareLibur
                                ? 'Tidak dapat diisi untuk tanggal mendatang'
                                : (!assigned && isLiburOption ? (bareLibur ? 'Batalkan penanda Libur' : 'Tandai tanggal ini Libur tanpa memilih materi') : undefined)
                            }
                            onClick={handleClick}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed ${active ? opt.activeBg : opt.hoverBg}`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex justify-end">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded text-white bg-blue-800 hover:bg-blue-900 transition-colors disabled:opacity-50 w-full sm:w-auto"
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

      {absensiTarget && (
        <AbsensiSilabusModal
          kelasId={selectedKelas}
          kelasName={classes.find(c => c.id === selectedKelas)?.name || ''}
          silabusId={absensiTarget.silabusId}
          tanggal={absensiTarget.tanggal}
          onClose={() => setAbsensiTarget(null)}
          onSaved={() => {
            const key = `${selectedMapel}__${absensiTarget.tanggal}`;
            setExecutions(prev => prev[key] ? { ...prev, [key]: { ...prev[key], hasAbsensi: true } } : prev);
          }}
        />
      )}
    </div>
  );
}
