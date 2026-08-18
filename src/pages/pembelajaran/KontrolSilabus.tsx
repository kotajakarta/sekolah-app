import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  Loader2, Save, AlertCircle, CheckCircle, Info, ClipboardList, ChevronLeft, ChevronRight,
  Calendar, Layers, CheckCircle2, UserCheck, Zap, Sparkles
} from 'lucide-react';
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

// ── Interfaces for Daily Batch Mode ──

interface SilabusOption {
  silabusId: string;
  bab: string;
  section: string;
}

interface DailyMapelItem {
  mataPelajaranId: string;
  mataPelajaranName: string;
  silabusId: string | null;
  silabusOptions?: SilabusOption[];
  bab: string;
  section: string;
  defaultGuruId: string | null;
  defaultGuruName: string | null;
  executionId: string | null;
  status: 'PENDING' | 'COMPLETED' | 'LIBUR';
  guruId: string | null;
  guruName: string | null;
  catatan: string;
  absensiSummary: { hadir: number; izin: number; sakit: number; alpa: number; total: number } | null;
}

interface DailyClassGroup {
  kelasId: string;
  kelasName: string;
  tingkat: string;
  totalSiswa: number;
  mapels: DailyMapelItem[];
}

interface DailyPelaksanaanResponse {
  tanggal: string;
  cabangId: string;
  guruOptions: GuruOption[];
  classes: DailyClassGroup[];
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

const formatYYYYMMDD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = () => formatYYYYMMDD(new Date());
const isFutureDate = (date: string) => date > todayStr();

// Ensure any date string or Date object snaps to the Saturday of that week (YYYY-MM-DD)
const toSaturdayStr = (dateInput?: string | Date) => {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    const parts = dateInput.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = new Date(dateInput.getTime());
  }

  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  return formatYYYYMMDD(d);
};

const shiftSaturday = (dateStr: string, weeksDelta: number) => {
  const currentSat = toSaturdayStr(dateStr);
  const parts = currentSat.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] + weeksDelta * 7);
  return formatYYYYMMDD(d);
};

export const PEMBELAJARAN_DEPENDENT_KEYS = [['pembelajaran-ringkasan'], ['laporan-pembelajaran']];

export default function KontrolSilabus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isGlobal = user?.scope === 'GLOBAL';
  const isWilayah = user?.scope === 'WILAYAH';
  const isCabang = user?.scope === 'CABANG';

  // Mode Switch: 'daily' (Batch Harian) vs 'single' (Per Kelas & Mapel)
  const [viewMode, setViewMode] = useState<'daily' | 'single'>('daily');

  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const [selectedCabang, setSelectedCabang] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');

  // Daily Mode State (defaults to Saturday of current week)
  const [selectedDate, setSelectedDate] = useState(() => toSaturdayStr());
  const [dailyFormState, setDailyFormState] = useState<Record<string, {
    status: 'PENDING' | 'COMPLETED' | 'LIBUR';
    guruId: string | null;
    catatan: string;
    silabusId: string | null;
  }>>({});
  const [dailySavedSuccess, setDailySavedSuccess] = useState(false);

  // Single Class & Mapel Mode State
  const [silabusItems, setSilabusItems] = useState<SilabusItem[]>([]);
  const [executions, setExecutions] = useState<Record<string, ExecutedSession>>({});
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [absensiTarget, setAbsensiTarget] = useState<{ kelasId: string; kelasName?: string; silabusId: string; tanggal: string } | null>(null);
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

  const invalidateDependents = () => {
    PEMBELAJARAN_DEPENDENT_KEYS.forEach(queryKey => queryClient.invalidateQueries({ queryKey }));
  };

  // ── Daily Batch Mode Data Fetching & State Sync ──

  const { data: dailyData, isLoading: dailyLoading, refetch: refetchDaily, isError: dailyError } = useQuery<DailyPelaksanaanResponse>({
    queryKey: ['pelaksanaan-silabus-daily', selectedCabang || user?.cabangId, selectedDate, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get('/pembelajaran/pelaksanaan/daily', {
        params: {
          cabangId: selectedCabang || user?.cabangId || undefined,
          tanggal: selectedDate,
          tahunAjaran,
          semester
        }
      });
      return res.data;
    },
    enabled: !!(selectedCabang || user?.cabangId) && !!tahunAjaran && !!semester
  });

  useEffect(() => {
    if (dailyData?.classes) {
      const initial: Record<string, { status: 'PENDING' | 'COMPLETED' | 'LIBUR'; guruId: string | null; catatan: string; silabusId: string | null }> = {};
      dailyData.classes.forEach(c => {
        c.mapels.forEach(m => {
          const key = `${c.kelasId}__${m.mataPelajaranId}`;
          initial[key] = {
            status: m.status,
            guruId: m.guruId || m.defaultGuruId,
            catatan: m.catatan || '',
            silabusId: m.silabusId
          };
        });
      });
      setDailyFormState(initial);
      setDailySavedSuccess(false);
    }
  }, [dailyData]);

  const dailySaveMutation = useMutation({
    mutationFn: async () => {
      const logs = Object.entries(dailyFormState).map(([key, form]) => {
        const [kelasId, mataPelajaranId] = key.split('__');
        return {
          kelasId,
          mataPelajaranId,
          silabusId: form.silabusId,
          status: form.status,
          guruId: form.guruId,
          catatan: form.catatan
        };
      });

      return apiClient.post('/pembelajaran/pelaksanaan/daily-bulk', {
        cabangId: selectedCabang || user?.cabangId,
        tanggal: selectedDate,
        logs
      });
    },
    onSuccess: () => {
      setDailySavedSuccess(true);
      refetchDaily();
      invalidateDependents();
    }
  });

  const handleDailyStatusChange = (kelasId: string, mapelId: string, status: 'PENDING' | 'COMPLETED' | 'LIBUR') => {
    if (isFutureDate(selectedDate)) return;
    const key = `${kelasId}__${mapelId}`;
    setDailyFormState(prev => ({
      ...prev,
      [key]: { ...prev[key], status }
    }));
    setDailySavedSuccess(false);
  };

  const handleDailySilabusChange = (kelasId: string, mapelId: string, silabusId: string) => {
    if (isFutureDate(selectedDate)) return;
    const key = `${kelasId}__${mapelId}`;
    setDailyFormState(prev => ({
      ...prev,
      [key]: { ...prev[key], silabusId: silabusId || null }
    }));
    setDailySavedSuccess(false);
  };

  const handleDailyGuruChange = (kelasId: string, mapelId: string, guruId: string) => {
    if (isFutureDate(selectedDate)) return;
    const key = `${kelasId}__${mapelId}`;
    setDailyFormState(prev => ({
      ...prev,
      [key]: { ...prev[key], guruId: guruId || null }
    }));
    setDailySavedSuccess(false);
  };

  const markDailyAll = (status: 'COMPLETED' | 'LIBUR') => {
    if (isFutureDate(selectedDate)) return;
    setDailyFormState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        next[key] = { ...next[key], status };
      });
      return next;
    });
    setDailySavedSuccess(false);
  };

  // ── Single Class & Mapel Mode Fetching ──

  const isSingleReady = !!selectedKelas && !!tahunAjaran && !!semester;

  const { data: pelaksanaanData, isLoading: singleLoading, refetch: refetchSingle, isError: singleError } = useQuery<{
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
    enabled: viewMode === 'single' && isSingleReady
  });

  const guruOptions = dailyData?.guruOptions || pelaksanaanData?.guruOptions || [];
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
      refetchSingle();
      invalidateDependents();
    }
  });

  const handleAssign = (date: string, silabusId: string) => {
    if (!selectedMapel) return;
    if (silabusId && isFutureDate(date)) return;
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
    <div className="font-sans text-slate-900 pb-16 space-y-4">
      {/* Top Header & View Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Kontrol Pelaksanaan Silabus</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand border border-blue-100">
              TA {tahunAjaran} &middot; {semester}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengisian status pelaksanaan materi silabus &amp; absensi siswa untuk seluruh rombel cabang.
          </p>
        </div>

        {/* Mode Switcher Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-brand shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Mode Per Tanggal (Efisien)</span>
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'single'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Mode Per Kelas &amp; Mapel</span>
          </button>
        </div>
      </div>

      {/* Wilayah & Cabang Selector (Global/Wilayah scope) */}
      {(isGlobal || isWilayah) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Wilayah</label>
            <select
              value={selectedWilayah}
              onChange={e => handleWilayahChange(e.target.value)}
              disabled={!isGlobal}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-70"
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
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Cabang</label>
            <select
              value={selectedCabang}
              onChange={e => handleCabangChange(e.target.value)}
              disabled={isCabang}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-70"
            >
              {isCabang ? (
                <option value={selectedCabang}>{user?.cabangName || 'Cabang Terkunci'}</option>
              ) : (
                <>
                  <option value="">-- Pilih Cabang --</option>
                  {filteredBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE A: BATCH PER TANGGAL PELAKSANAAN (DEFAULT & EFISIEN)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {/* Date Stepper Header Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tanggal Pelaksanaan</span>
                <div className="text-sm font-extrabold text-slate-900 capitalize flex items-center gap-2">
                  <span>{formatTanggal(selectedDate)}</span>
                  {isFutureDate(selectedDate) && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded border border-slate-200">Masa Mendatang</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Buttons, Quick Actions & Datepicker */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Quick Action Buttons */}
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  onClick={() => markDailyAll('COMPLETED')}
                  disabled={isFutureDate(selectedDate)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-xl transition-all flex items-center gap-1 disabled:opacity-40"
                  title="Tandai seluruh mapel di semua kelas Dikerjakan"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dikerjakan Semua</span>
                </button>

                <button
                  type="button"
                  onClick={() => markDailyAll('LIBUR')}
                  disabled={isFutureDate(selectedDate)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 rounded-xl transition-all flex items-center gap-1 disabled:opacity-40"
                  title="Tandai seluruh mapel di semua kelas Libur"
                >
                  <span>Libur Semua</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedDate(shiftSaturday(selectedDate, -1))}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl transition-all flex items-center gap-1"
                title="Sabtu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sabtu Lalu</span>
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(toSaturdayStr(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-brand"
              />

              <button
                onClick={() => setSelectedDate(shiftSaturday(selectedDate, 1))}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl transition-all flex items-center gap-1"
                title="Sabtu Berikutnya"
              >
                <span className="hidden sm:inline">Sabtu Depan</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Save All Button */}
              <button
                onClick={() => dailySaveMutation.mutate()}
                disabled={dailySaveMutation.isPending || isFutureDate(selectedDate)}
                className="px-4 py-1.5 bg-brand hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 ml-auto sm:ml-2 text-xs"
              >
                {dailySaveMutation.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Simpan Semua Data</>
                )}
              </button>
            </div>
          </div>

          {dailySavedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Berhasil menyimpan seluruh progres pelaksanaan &amp; pengajar tanggal {formatTanggal(selectedDate)}!</span>
              </div>
              <span className="text-[10px] text-emerald-600">Terintegrasi otomatis ke Kontrol Pembelajaran</span>
            </div>
          )}

          {dailyLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 flex justify-center items-center font-sans text-sm text-slate-500">
              <Loader2 className="w-5 h-5 text-brand animate-spin mr-2" />
              <span>Memuat data rombel &amp; mapel tanggal {formatTanggal(selectedDate)}...</span>
            </div>
          ) : dailyError || !dailyData ? (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 text-sm font-sans flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>Gagal memuat data pelaksanaan harian. Pastikan cabang sudah dipilih.</span>
            </div>
          ) : dailyData.classes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
              Tidak ada kelas formal aktif yang ditemukan di cabang ini.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cards Grouped by Class */}
              {dailyData.classes.map((cls) => (
                <div key={cls.kelasId} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  {/* Class Group Header */}
                  <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-lg bg-brand/10 text-brand border border-blue-100">
                        {cls.kelasName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Tingkat: <strong>{cls.tingkat || '-'}</strong></span>
                      <span>&bull;</span>
                      <span className="text-xs text-slate-500 font-medium">Jumlah Siswa: <strong>{cls.totalSiswa} Siswa</strong></span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {cls.mapels.length} Mapel Terdaftar
                    </span>
                  </div>

                  {/* Mapel List Table inside Class Card */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/40 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                          <th className="px-4 py-2.5 w-1/4">Mata Pelajaran &amp; Materi Target</th>
                          <th className="px-4 py-2.5 w-1/4">Guru Pengajar</th>
                          <th className="px-4 py-2.5 w-1/4 text-center">Status Pelaksanaan</th>
                          <th className="px-4 py-2.5 w-1/4 text-center">Absensi Siswa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {cls.mapels.length > 0 ? (
                          cls.mapels.map((m) => {
                            const formKey = `${cls.kelasId}__${m.mataPelajaranId}`;
                            const currentForm = dailyFormState[formKey] || { status: m.status, guruId: m.guruId || m.defaultGuruId, silabusId: m.silabusId };
                            const isFuture = isFutureDate(selectedDate);

                            return (
                              <tr key={m.mataPelajaranId} className="hover:bg-slate-50/60 transition-colors">
                                {/* Mapel & Selectable Silabus Target */}
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900 text-xs">{m.mataPelajaranName}</div>
                                  {m.silabusOptions && m.silabusOptions.length > 0 ? (
                                    <select
                                      value={currentForm.silabusId || ''}
                                      onChange={e => handleDailySilabusChange(cls.kelasId, m.mataPelajaranId, e.target.value)}
                                      disabled={isFuture || currentForm.status === 'LIBUR'}
                                      className="mt-1 w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
                                    >
                                      <option value="">-- Pilih Materi Target --</option>
                                      {m.silabusOptions.map(opt => (
                                        <option key={opt.silabusId} value={opt.silabusId}>
                                          {opt.bab} — {opt.section}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium italic">
                                      {m.bab ? `${m.bab} — ${m.section}` : 'Materi silabus belum diset'}
                                    </div>
                                  )}
                                </td>

                                {/* Guru Selection Dropdown */}
                                <td className="px-4 py-3">
                                  <select
                                    value={currentForm.guruId || ''}
                                    onChange={e => handleDailyGuruChange(cls.kelasId, m.mataPelajaranId, e.target.value)}
                                    disabled={isFuture}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
                                  >
                                    <option value="">-- Pilih Guru --</option>
                                    {guruOptions.map(g => (
                                      <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Status Execution Buttons */}
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {STATUS_OPTIONS.map(opt => {
                                      const active = currentForm.status === opt.key;
                                      return (
                                        <button
                                          key={opt.key}
                                          type="button"
                                          disabled={isFuture}
                                          onClick={() => handleDailyStatusChange(cls.kelasId, m.mataPelajaranId, opt.key)}
                                          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all disabled:opacity-40 ${
                                            active ? opt.activeBg : opt.hoverBg
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>

                                {/* Absensi Siswa Action Button */}
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setAbsensiTarget({
                                        kelasId: cls.kelasId,
                                        kelasName: cls.kelasName,
                                        silabusId: currentForm.silabusId || m.silabusId || '',
                                        tanggal: selectedDate
                                      })}
                                      disabled={(!currentForm.silabusId && !m.silabusId) || currentForm.status === 'LIBUR'}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all disabled:opacity-40 ${
                                        m.absensiSummary && m.absensiSummary.total > 0
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-xs'
                                          : 'bg-blue-50 text-brand border-blue-100 hover:bg-blue-100'
                                      }`}
                                      title={
                                        m.absensiSummary && m.absensiSummary.total > 0
                                          ? `Absensi Terisi: ${m.absensiSummary.hadir} Hadir, ${m.absensiSummary.sakit} Sakit, ${m.absensiSummary.izin} Izin, ${m.absensiSummary.alpa} Alpa`
                                          : 'Input Absensi Siswa'
                                      }
                                    >
                                      <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                                      {m.absensiSummary && m.absensiSummary.total > 0 ? (
                                        <span>
                                          H: {m.absensiSummary.hadir}, S: {m.absensiSummary.sakit}, I: {m.absensiSummary.izin}, A: {m.absensiSummary.alpa}
                                        </span>
                                      ) : (
                                        <span>Input Absensi</span>
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-slate-400 italic">
                              Tidak ada mapel terdaftar untuk kelas ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Bottom Sticky Action Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                <div className="text-xs text-slate-600 font-medium hidden sm:block">
                  Simpan seluruh perubahan status pelaksanaan &amp; pengajar untuk tanggal <strong>{formatTanggal(selectedDate)}</strong>.
                </div>
                <button
                  onClick={() => dailySaveMutation.mutate()}
                  disabled={dailySaveMutation.isPending || isFutureDate(selectedDate)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {dailySaveMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Seluruh Kelas...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Simpan Semua Data Tanggal Ini</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE B: PER KELAS & MAPEL (SINGLE CLASS / MONTHLY MATRIX)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'single' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Kelas Formal</label>
              <select
                value={selectedKelas}
                onChange={e => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Tingkat {c.tingkat || '-'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Mata Pelajaran</label>
              <select
                value={selectedMapel}
                onChange={e => setSelectedMapel(e.target.value)}
                disabled={mapelOptions.length === 0}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-70"
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {!isSingleReady ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <Info className="w-6 h-6 mb-1.5 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Pilih Kelas untuk memuat daftar silabus.</p>
            </div>
          ) : singleLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex justify-center items-center">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
            </div>
          ) : singleError ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-center flex items-center justify-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> Gagal memuat silabus.
            </div>
          ) : silabusItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
              Belum ada silabus yang diinput Admin Pusat untuk tingkat kelas ini pada periode aktif.
            </div>
          ) : !selectedMapel ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <Info className="w-6 h-6 mb-1.5 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Pilih Mata Pelajaran untuk memuat jadwal sesi Sabtu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
                <div className="flex items-center gap-1 mr-2">
                  <button type="button" onClick={goPrevMonth} className="p-1 border border-slate-300 bg-white rounded-lg text-slate-500 hover:bg-slate-50 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 w-32 text-center capitalize">{monthLabel}</span>
                  <button type="button" onClick={goNextMonth} className="p-1 border border-slate-300 bg-white rounded-lg text-slate-500 hover:bg-slate-50 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mr-1">Tandai Cepat:</span>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => markAll(opt.key)}
                    disabled={assignedInView.length === 0}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-semibold rounded-full transition-all disabled:opacity-40"
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
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800">
                  <span className="font-semibold">{unassignedSections.length} materi belum dijadwalkan ke sesi Sabtu manapun:</span>{' '}
                  {unassignedSections.map(s => `${s.bab} — ${s.section}`).join(', ')}
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {datesInView.map(date => {
                    const key = `${selectedMapel}__${date}`;
                    const assigned = executions[key];
                    const bareLibur = !assigned ? liburByDate.get(date) : undefined;
                    const liburPending = (markLiburMutation.isPending && markLiburMutation.variables === date)
                      || (clearLiburMutation.isPending && clearLiburMutation.variables === date);
                    const future = isFutureDate(date);
                    return (
                      <div key={date} className="p-3 flex flex-col lg:flex-row lg:items-center gap-2">
                        <div className="lg:w-44 shrink-0">
                          <p className="text-sm font-semibold text-slate-800 capitalize">{formatTanggal(date)}</p>
                          {future && (
                            <p className="text-[10px] text-slate-400 font-medium">Tanggal mendatang</p>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-stretch gap-1.5">
                          <button
                            type="button"
                            onClick={() => assigned?.silabusId && setAbsensiTarget({ kelasId: selectedKelas, silabusId: assigned.silabusId, tanggal: date })}
                            disabled={!assigned || !assigned.silabusId || assigned.status === 'LIBUR'}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-brand hover:bg-blue-700 transition-colors disabled:opacity-40"
                          >
                            <ClipboardList className="w-3.5 h-3.5" /> Absensi
                          </button>
                          {assigned && assigned.silabusId && assigned.status !== 'LIBUR' && (
                            <span
                              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-center ${
                                assigned.hasAbsensi ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {assigned.hasAbsensi ? 'Sudah Absensi' : 'Belum Absensi'}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {bareLibur ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                              Libur (Tanpa Materi)
                            </div>
                          ) : (
                            <select
                              value={assigned?.silabusId || ''}
                              onChange={e => handleAssign(date, e.target.value)}
                              disabled={future && !assigned}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
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
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
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
                                onClick={handleClick}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all text-center disabled:opacity-40 ${active ? opt.activeBg : opt.hoverBg}`}
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

              <div className="bg-white border border-slate-200 rounded-2xl p-3 flex justify-end shadow-sm">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-brand hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto shadow-sm"
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
      )}

      {/* Modal Input Absensi Siswa */}
      {absensiTarget && (
        <AbsensiSilabusModal
          kelasId={absensiTarget.kelasId}
          kelasName={absensiTarget.kelasName || classes.find(c => c.id === absensiTarget.kelasId)?.name || ''}
          silabusId={absensiTarget.silabusId}
          tanggal={absensiTarget.tanggal}
          onClose={() => setAbsensiTarget(null)}
          onSaved={() => {
            if (viewMode === 'daily') {
              refetchDaily();
            } else {
              const key = `${selectedMapel}__${absensiTarget.tanggal}`;
              setExecutions(prev => prev[key] ? { ...prev, [key]: { ...prev[key], hasAbsensi: true } } : prev);
            }
          }}
        />
      )}
    </div>
  );
}
