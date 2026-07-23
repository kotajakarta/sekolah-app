import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useGetWilayah, useGetCabang } from '../../features/core_data/hooks/useMasterData';
import { 
  BookOpen, Save, Printer, UserCheck, 
  Layers, Sparkles, Filter, Building2, MapPin
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Kelas {
  id: string;
  name: string;
  tingkat?: string;
  tahunAjaran?: string;
  cabangId?: string;
  lembagaMuadalah?: { name: string };
}

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
  grupMapel: string;
}

interface NilaiSiswaRow {
  studentId: string;
  nisn: string;
  nis: string;
  fullName: string;
  jenisGrupDaimi: string;
  nilaiAkhir: number | null;
  predikat: string;
}

interface PresensiCatatanRow {
  studentId: string;
  nisn: string;
  fullName: string;
  jenisGrupDaimi: string;
  sakit: number;
  izin: number;
  alpa: number;
  catatanWaliKelas: string;
  sikapSpiritual: string;
  sikapSosial: string;
  statusAkhir: string;
}

function calculatePredikat(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) return '';
  if (score >= 90) return 'A';
  if (score >= 81) return 'B+';
  if (score >= 76) return 'B';
  return 'C+';
}

export const ERaporPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'nilai' | 'presensi' | 'leger' | 'cetak'>('nilai');

  // Master Data Wilayah & Cabang
  const { data: wilayahList = [] } = useGetWilayah();
  const { data: cabangList = [] } = useGetCabang();

  // Filter State
  const [tahunAjaran, setTahunAjaran] = useState<string>('2025/2026');
  const [semester, setSemester] = useState<string>('Ganjil');
  const [selectedWilayahId, setSelectedWilayahId] = useState<string>('');
  const [selectedCabangId, setSelectedCabangId] = useState<string>('');
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // 1. Fetch Master Kelas
  const { data: kelasList = [] } = useQuery<Kelas[]>({
    queryKey: ['kelas-list'],
    queryFn: async () => {
      const res = await apiClient.get<Kelas[]>('/formal/kelas');
      return res.data;
    }
  });

  // Filter Cabang & Kelas berjenjang (Wilayah -> Cabang -> Kelas)
  const filteredCabangList = selectedWilayahId
    ? cabangList.filter(c => c.wilayahId === selectedWilayahId)
    : (user?.scope === 'WILAYAH' ? cabangList.filter(c => c.wilayahId === user?.wilayahId) : cabangList);

  const filteredKelasList = selectedCabangId
    ? kelasList.filter(k => k.cabangId === selectedCabangId)
    : (user?.scope === 'CABANG' ? kelasList.filter(k => k.cabangId === user?.cabangId) : kelasList);

  // Auto Select first class if none selected or if selection out of bounds
  useEffect(() => {
    if (filteredKelasList.length > 0) {
      if (!selectedKelasId || !filteredKelasList.some(k => k.id === selectedKelasId)) {
        setSelectedKelasId(filteredKelasList[0].id);
      }
    } else {
      setSelectedKelasId('');
    }
  }, [filteredKelasList, selectedKelasId]);

  // 2. Fetch Master Mapel
  const { data: mapelList = [] } = useQuery<Mapel[]>({
    queryKey: ['mapel-list'],
    queryFn: async () => {
      const res = await apiClient.get<Mapel[]>('/formal/mapel');
      if (res.data.length > 0 && !selectedMapelId) {
        setSelectedMapelId(res.data[0].id);
      }
      return res.data;
    }
  });

  // 3. Fetch Data Nilai Mapel
  const { data: nilaiRows = [], isLoading: isLoadingNilai, refetch: refetchNilai } = useQuery<NilaiSiswaRow[]>({
    queryKey: ['erapor-nilai', selectedKelasId, selectedMapelId, tahunAjaran, semester],
    queryFn: async () => {
      if (!selectedKelasId || !selectedMapelId) return [];
      const res = await apiClient.get<NilaiSiswaRow[]>('/formal/erapor/nilai', {
        params: { kelasId: selectedKelasId, mataPelajaranId: selectedMapelId, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: !!selectedKelasId && !!selectedMapelId && activeTab === 'nilai'
  });

  // Local state untuk form batch nilai
  const [localNilai, setLocalNilai] = useState<Record<string, Partial<NilaiSiswaRow>>>({});

  useEffect(() => {
    if (nilaiRows.length > 0) {
      const initial: Record<string, Partial<NilaiSiswaRow>> = {};
      nilaiRows.forEach(r => {
        initial[r.studentId] = {
          nilaiAkhir: r.nilaiAkhir,
          predikat: r.predikat || calculatePredikat(r.nilaiAkhir)
        };
      });
      setLocalNilai(initial);
    }
  }, [nilaiRows]);

  // Save Batch Nilai
  const saveNilaiMutation = useMutation({
    mutationFn: async () => {
      const payloadData = Object.entries(localNilai).map(([studentId, val]) => ({
        studentId,
        nilaiAkhir: val.nilaiAkhir !== undefined && val.nilaiAkhir !== null ? Number(val.nilaiAkhir) : null,
        predikat: val.predikat || calculatePredikat(val.nilaiAkhir ? Number(val.nilaiAkhir) : null)
      }));

      await apiClient.post('/formal/erapor/nilai/batch', {
        kelasId: selectedKelasId,
        mataPelajaranId: selectedMapelId,
        tahunAjaran,
        semester,
        data: payloadData
      });
    },
    onSuccess: () => {
      showToast('success', 'Nilai Rapor berhasil disimpan secara permanen!');
      refetchNilai();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan nilai');
    }
  });

  // 4. Fetch Data Presensi & Catatan
  const { data: presensiRows = [], isLoading: isLoadingPresensi, refetch: refetchPresensi } = useQuery<PresensiCatatanRow[]>({
    queryKey: ['erapor-presensi', selectedKelasId, tahunAjaran, semester],
    queryFn: async () => {
      if (!selectedKelasId) return [];
      const res = await apiClient.get<PresensiCatatanRow[]>('/formal/erapor/presensi-catatan', {
        params: { kelasId: selectedKelasId, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: !!selectedKelasId && activeTab === 'presensi'
  });

  const [localPresensi, setLocalPresensi] = useState<Record<string, Partial<PresensiCatatanRow>>>({});

  useEffect(() => {
    if (presensiRows.length > 0) {
      const initial: Record<string, Partial<PresensiCatatanRow>> = {};
      presensiRows.forEach(r => {
        initial[r.studentId] = {
          sakit: r.sakit,
          izin: r.izin,
          alpa: r.alpa,
          catatanWaliKelas: r.catatanWaliKelas,
          sikapSpiritual: r.sikapSpiritual,
          sikapSosial: r.sikapSosial,
          statusAkhir: r.statusAkhir
        };
      });
      setLocalPresensi(initial);
    }
  }, [presensiRows]);

  const savePresensiMutation = useMutation({
    mutationFn: async () => {
      const payloadData = Object.entries(localPresensi).map(([studentId, val]) => ({
        studentId,
        sakit: val.sakit ? Number(val.sakit) : 0,
        izin: val.izin ? Number(val.izin) : 0,
        alpa: val.alpa ? Number(val.alpa) : 0,
        catatanWaliKelas: val.catatanWaliKelas || '',
        sikapSpiritual: val.sikapSpiritual || 'Sangat Baik',
        sikapSosial: val.sikapSosial || 'Baik',
        statusAkhir: val.statusAkhir || ''
      }));

      await apiClient.post('/formal/erapor/presensi-catatan/batch', {
        kelasId: selectedKelasId,
        tahunAjaran,
        semester,
        data: payloadData
      });
    },
    onSuccess: () => {
      showToast('success', 'Presensi & Catatan Wali Kelas berhasil disimpan!');
      refetchPresensi();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan presensi');
    }
  });

  // 5. Fetch Leger Nilai
  const { data: legerData, isLoading: isLoadingLeger } = useQuery<any>({
    queryKey: ['erapor-leger', selectedKelasId, tahunAjaran, semester],
    queryFn: async () => {
      if (!selectedKelasId) return null;
      const res = await apiClient.get('/formal/erapor/leger', {
        params: { kelasId: selectedKelasId, tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: !!selectedKelasId && activeTab === 'leger'
  });

  // 6. Fetch Cetak Rapor Data
  const { data: cetakData, isLoading: isLoadingCetak } = useQuery<any>({
    queryKey: ['erapor-cetak', selectedStudentId, tahunAjaran, semester],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await apiClient.get(`/formal/erapor/cetak/${selectedStudentId}`, {
        params: { tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: !!selectedStudentId && activeTab === 'cetak'
  });

  // Hitung Rata-Rata Kelas untuk Input Nilai
  const validScores = nilaiRows
    .map(r => localNilai[r.studentId]?.nilaiAkhir)
    .filter((v): v is number => v !== undefined && v !== null && !isNaN(v));

  const rataRataKelasInput = validScores.length > 0
    ? (validScores.reduce((a, b) => a + Number(b), 0) / validScores.length).toFixed(2)
    : '-';

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-200 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Standar e-Rapor Kemenag Madrasah Indonesia</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Evaluasi Nilai Rapor (e-Rapor)</h1>
            <p className="text-emerald-100/80 text-sm max-w-2xl">
              Pengelolaan nilai akhir Rapor, predikat hasil belajar, presensi, leger kelas, dan cetak lembar Rapor resmi Madrasah.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
            <div className="text-center px-4 py-1">
              <p className="text-[11px] text-emerald-200 uppercase font-semibold">Tahun Ajaran</p>
              <p className="text-lg font-bold text-white">{tahunAjaran}</p>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-center px-4 py-1">
              <p className="text-[11px] text-emerald-200 uppercase font-semibold">Semester</p>
              <p className="text-lg font-bold text-white">{semester}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multidropdown Filter Bar (Wilayah -> Cabang -> Kelas) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Akademik & Kelembagaan</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Dropdown Wilayah (Admin Global) */}
          {(user?.scope === 'GLOBAL') && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-medium text-slate-700">Wilayah:</label>
              <select
                value={selectedWilayahId}
                onChange={(e) => {
                  setSelectedWilayahId(e.target.value);
                  setSelectedCabangId('');
                  setSelectedKelasId('');
                }}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[160px]"
              >
                <option value="">Semua Wilayah</option>
                {wilayahList.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dropdown Cabang (Admin / Wilayah) */}
          {(user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-medium text-slate-700">Cabang:</label>
              <select
                value={selectedCabangId}
                onChange={(e) => {
                  setSelectedCabangId(e.target.value);
                  setSelectedKelasId('');
                }}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[180px]"
              >
                <option value="">Semua Cabang</option>
                {filteredCabangList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dropdown Kelas */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-700">Kelas / Rombel:</label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[180px]"
            >
              {filteredKelasList.map(k => (
                <option key={k.id} value={k.id}>
                  {k.name} {k.lembagaMuadalah ? `(${k.lembagaMuadalah.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun Ajaran */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-700">Tahun Ajaran:</label>
            <select
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
            </select>
          </div>

          {/* Semester */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-700">Semester:</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          {/* Mata Pelajaran (Khusus Tab 1) */}
          {activeTab === 'nilai' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-700">Mata Pelajaran:</label>
              <select
                value={selectedMapelId}
                onChange={(e) => setSelectedMapelId(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[200px]"
              >
                {mapelList.map(m => (
                  <option key={m.id} value={m.id}>
                    [{m.kodeMapel}] {m.name} ({m.grupMapel})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 pt-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('nilai')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'nilai'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Input Nilai Mapel</span>
          </button>

          <button
            onClick={() => setActiveTab('presensi')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'presensi'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>2. Presensi & Catatan Wali</span>
          </button>

          <button
            onClick={() => setActiveTab('leger')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'leger'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Leger Nilai Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('cetak')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'cetak'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>4. Cetak Rapor Madrasah</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INPUT NILAI MATA PELAJARAN */}
      {activeTab === 'nilai' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Form Entry Nilai Akhir Rapor</h2>
              <p className="text-xs text-slate-500">
                Predikat otomatis dikalkulasi berdasarkan skala: 0–75 = C+, 76–80 = B, 81–89 = B+, 90–100 = A.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-lg text-center">
                <span className="text-[11px] font-medium text-emerald-700 block">Rata-Rata Kelas</span>
                <span className="text-lg font-extrabold text-emerald-900">{rataRataKelasInput}</span>
              </div>

              <button
                onClick={() => saveNilaiMutation.mutate()}
                disabled={saveNilaiMutation.isPending || nilaiRows.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saveNilaiMutation.isPending ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
              </button>
            </div>
          </div>

          {isLoadingNilai ? (
            <div className="p-12 text-center text-xs text-slate-500">Memuat daftar siswa & nilai...</div>
          ) : nilaiRows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tidak ada siswa di kelas ini atau pilih Filter Kelas & Mata Pelajaran.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                    <th className="py-3 px-4 min-w-[140px] text-center bg-teal-50 text-teal-900">Jenis Grup Daimi</th>
                    <th className="py-3 px-4 w-32 text-center">NISN / NIS</th>
                    <th className="py-3 px-4 w-36 text-center">Nilai Akhir (0 - 100)</th>
                    <th className="py-3 px-4 w-28 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nilaiRows.map((row, idx) => {
                    const current = localNilai[row.studentId] || {};
                    const score = current.nilaiAkhir;
                    const autoPredikat = calculatePredikat(score !== undefined && score !== null ? Number(score) : null);

                    return (
                      <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{row.fullName}</td>
                        
                        {/* Kolom Jenis Grup Daimi */}
                        <td className="py-2.5 px-4 text-center font-semibold text-teal-800 bg-teal-50/40">
                          {row.jenisGrupDaimi || '-'}
                        </td>

                        <td className="py-2.5 px-4 text-center text-slate-500">{row.nisn || row.nis || '-'}</td>

                        {/* Input Nilai Akhir */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={score ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              setLocalNilai(prev => ({
                                ...prev,
                                [row.studentId]: {
                                  ...prev[row.studentId],
                                  nilaiAkhir: val,
                                  predikat: calculatePredikat(val)
                                }
                              }));
                            }}
                            className="w-24 text-center py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
                            placeholder="0-100"
                          />
                        </td>

                        {/* Output Predikat (0-75 C+, 76-80 B, 81-89 B+, 90-100 A) */}
                        <td className="py-2 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            autoPredikat === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            autoPredikat === 'B+' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            autoPredikat === 'B' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' :
                            autoPredikat === 'C+' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {autoPredikat || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESENSI & CATATAN WALI KELAS */}
      {activeTab === 'presensi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catatan Wali Kelas & Rekapitulasi Presensi</h2>
              <p className="text-xs text-slate-500">
                Catat ketidakhadiran (Sakit, Izin, Alpa), Sikap Spiritual & Sosial, serta Catatan Kenaikan Kelas.
              </p>
            </div>
            <button
              onClick={() => savePresensiMutation.mutate()}
              disabled={savePresensiMutation.isPending || presensiRows.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savePresensiMutation.isPending ? 'Menyimpan...' : 'Simpan Presensi & Catatan'}</span>
            </button>
          </div>

          {isLoadingPresensi ? (
            <div className="p-12 text-center text-xs text-slate-500">Memuat presensi siswa...</div>
          ) : presensiRows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tidak ada siswa di kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[180px]">Nama Siswa</th>
                    <th className="py-3 px-4 min-w-[140px] text-center bg-teal-50 text-teal-900">Jenis Grup Daimi</th>
                    <th className="py-3 px-2 text-center w-16">Sakit</th>
                    <th className="py-3 px-2 text-center w-16">Izin</th>
                    <th className="py-3 px-2 text-center w-16">Alpa</th>
                    <th className="py-3 px-3 w-32">Sikap Spiritual</th>
                    <th className="py-3 px-3 w-32">Sikap Sosial</th>
                    <th className="py-3 px-4 min-w-[260px]">Catatan Wali Kelas</th>
                    <th className="py-3 px-3 w-36">Status Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {presensiRows.map((row, idx) => {
                    const current = localPresensi[row.studentId] || {};

                    return (
                      <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{row.fullName}</td>

                        {/* Kolom Jenis Grup Daimi */}
                        <td className="py-2.5 px-4 text-center font-semibold text-teal-800 bg-teal-50/40">
                          {row.jenisGrupDaimi || '-'}
                        </td>

                        {/* Sakit */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={current.sakit ?? 0}
                            onChange={(e) => setLocalPresensi(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], sakit: Number(e.target.value) }
                            }))}
                            className="w-12 text-center py-1.5 px-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold"
                          />
                        </td>

                        {/* Izin */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={current.izin ?? 0}
                            onChange={(e) => setLocalPresensi(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], izin: Number(e.target.value) }
                            }))}
                            className="w-12 text-center py-1.5 px-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold"
                          />
                        </td>

                        {/* Alpa */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min="0"
                            value={current.alpa ?? 0}
                            onChange={(e) => setLocalPresensi(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], alpa: Number(e.target.value) }
                            }))}
                            className="w-12 text-center py-1.5 px-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-semibold"
                          />
                        </td>

                        {/* Sikap Spiritual */}
                        <td className="py-2 px-2">
                          <select
                            value={current.sikapSpiritual || 'Sangat Baik'}
                            onChange={(e) => setLocalPresensi(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], sikapSpiritual: e.target.value }
                            }))}
                            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
                          >
                            <option value="Sangat Baik">Sangat Baik</option>
                            <option value="Baik">Baik</option>
                            <option value="Cukup">Cukup</option>
                          </select>
                        </td>

                        {/* Sikap Sosial */}
                        <td className="py-2 px-2">
                          <select
                            value={current.sikapSosial || 'Baik'}
                            onChange={(e) => setLocalPresensi(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], sikapSosial: e.target.value }
                            }))}
                            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-xs"
                          >
                            <option value="Sangat Baik">Sangat Baik</option>
                            <option value="Baik">Baik</option>
                            <option value="Cukup">Cukup</option>
                          </select>
                        </td>

                        {/* Catatan Wali Kelas */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={current.catatanWaliKelas || ''}
                            onChange={(e) => setLocalPresensi(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], catatanWaliKelas: e.target.value }
                            }))}
                            className="w-full py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-700"
                            placeholder="Tingkatkan kedisiplinan dan keaktifan..."
                          />
                        </td>

                        {/* Status Kenaikan */}
                        <td className="py-2 px-2">
                          <select
                            value={current.statusAkhir || ''}
                            onChange={(e) => setLocalPresensi(prev => ({
                              ...prev,
                              [row.studentId]: { ...prev[row.studentId], statusAkhir: e.target.value }
                            }))}
                            className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium"
                          >
                            <option value="">- Pilihan -</option>
                            <option value="NAIK_KELAS">Naik Kelas</option>
                            <option value="NAIK_TINGKAT">Naik Tingkat</option>
                            <option value="LULUS">Lulus</option>
                            <option value="TINGGAL_KELAS">Tinggal Kelas</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEGER NILAI KELAS */}
      {activeTab === 'leger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Rekapitulasi Leger Nilai Kelas</h2>
              <p className="text-xs text-slate-500">
                Matriks perolehan nilai seluruh mata pelajaran, total nilai, rata-rata, dan peringkat siswa.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {legerData && (
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-lg text-center">
                  <span className="text-[11px] font-medium text-emerald-700 block">Rata-Rata Kelas (Semua Mapel)</span>
                  <span className="text-lg font-extrabold text-emerald-900">{legerData.rataRataKelas || '-'}</span>
                </div>
              )}

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF Leger</span>
              </button>
            </div>
          </div>

          {isLoadingLeger ? (
            <div className="p-12 text-center text-xs text-slate-500">Memuat Leger Nilai...</div>
          ) : !legerData || legerData.siswa.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tidak ada data leger untuk kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-3 border-r border-slate-200 text-center w-12">Rank</th>
                    <th className="py-3 px-4 border-r border-slate-200 min-w-[180px]">Nama Siswa</th>
                    <th className="py-3 px-3 border-r border-slate-200 text-center bg-teal-50 text-teal-900 min-w-[130px]">Jenis Grup Daimi</th>
                    <th className="py-3 px-3 border-r border-slate-200 text-center w-24">NISN</th>
                    {legerData.mapelList.map((m: any) => (
                      <th key={m.id} className="py-3 px-2 border-r border-slate-200 text-center w-16 uppercase" title={m.name}>
                        {m.kodeMapel}
                      </th>
                    ))}
                    <th className="py-3 px-3 border-r border-slate-200 text-center bg-emerald-50 text-emerald-900 w-20">Total</th>
                    <th className="py-3 px-3 border-r border-slate-200 text-center bg-emerald-100 text-emerald-950 w-20">Rata-Rata</th>
                    <th className="py-3 px-2 text-center w-12">S</th>
                    <th className="py-3 px-2 text-center w-12">I</th>
                    <th className="py-3 px-2 text-center w-12">A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {legerData.siswa.map((row: any) => (
                    <tr key={row.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold text-amber-600 bg-amber-50/30">
                        {row.ranking}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 border-r border-slate-200">{row.fullName}</td>

                      {/* Kolom Jenis Grup Daimi */}
                      <td className="py-2.5 px-3 text-center font-semibold text-teal-800 bg-teal-50/40 border-r border-slate-200">
                        {row.jenisGrupDaimi || '-'}
                      </td>

                      <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200">{row.nisn || '-'}</td>
                      {legerData.mapelList.map((m: any) => {
                        const score = row.scores[m.id];
                        return (
                          <td key={m.id} className={`py-2.5 px-2 text-center border-r border-slate-200 font-medium ${
                            score !== undefined && score !== null && score < 76 ? 'text-red-600 bg-red-50' : 'text-slate-800'
                          }`}>
                            {score !== undefined && score !== null ? score : '-'}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold text-emerald-800 bg-emerald-50/60">
                        {row.totalNilai}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-extrabold text-emerald-900 bg-emerald-100/60">
                        {row.rataRata}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{row.sakit}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{row.izin}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{row.alpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CETAK RAPOR MADRASAH */}
      {activeTab === 'cetak' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Pilih Siswa untuk Dicetak:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[240px]"
              >
                <option value="">-- Pilih Siswa --</option>
                {presensiRows.map(s => (
                  <option key={s.studentId} value={s.studentId}>{s.fullName} ({s.jenisGrupDaimi !== '-' ? s.jenisGrupDaimi : (s.nisn || 'No NISN')})</option>
                ))}
              </select>
            </div>

            {cetakData && (
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Rapor</span>
              </button>
            )}
          </div>

          {!selectedStudentId ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              Silakan pilih siswa dari dropdown di atas untuk melihat pratinjau Rapor Madrasah.
            </div>
          ) : isLoadingCetak ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              Memuat data Rapor Madrasah...
            </div>
          ) : !cetakData ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              Data Rapor tidak ditemukan.
            </div>
          ) : (
            /* DOKUMEN RAPOR MADRASAH (READY FOR PRINT) */
            <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-xl max-w-4xl mx-auto space-y-6 text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
              {/* Kop Rapor */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-900">{cetakData.sekolah.namaLembaga}</h2>
                <p className="text-xs font-medium text-slate-700">
                  NPSN: {cetakData.sekolah.npsn} | NSPP: {cetakData.sekolah.nspp} | Cabang: {cetakData.sekolah.cabangName}
                </p>
                <p className="text-sm font-bold tracking-widest text-emerald-800 uppercase mt-2">
                  LAPORAN HASIL BELAJAR (RAPOR MADRASAH)
                </p>
              </div>

              {/* Identitas Siswa & Kelas */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex"><span className="w-32 font-semibold text-slate-600">Nama Siswa</span>: <span className="font-bold ml-1">{cetakData.siswa.fullName}</span></div>
                  <div className="flex"><span className="w-32 font-semibold text-slate-600">Jenis Grup Daimi</span>: <span className="font-bold ml-1 text-teal-800">{cetakData.siswa.jenisGrupDaimi || '-'}</span></div>
                  <div className="flex"><span className="w-32 font-semibold text-slate-600">NISN / NIS</span>: <span className="font-medium ml-1">{cetakData.siswa.nisn || '-'} / {cetakData.siswa.nis || '-'}</span></div>
                  <div className="flex"><span className="w-32 font-semibold text-slate-600">Tempat, Tgl Lahir</span>: <span className="font-medium ml-1">{cetakData.siswa.tempatLahir}, {cetakData.siswa.tanggalLahir ? new Date(cetakData.siswa.tanggalLahir).toLocaleDateString('id-ID') : '-'}</span></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex"><span className="w-32 font-semibold text-slate-600">Kelas / Tingkat</span>: <span className="font-bold ml-1">{cetakData.akademik.kelasName} (Tingkat {cetakData.akademik.tingkat})</span></div>
                  <div className="flex"><span className="w-32 font-semibold text-slate-600">Tahun Ajaran</span>: <span className="font-medium ml-1">{cetakData.akademik.tahunAjaran}</span></div>
                  <div className="flex"><span className="w-32 font-semibold text-slate-600">Semester</span>: <span className="font-medium ml-1">{cetakData.akademik.semester}</span></div>
                </div>
              </div>

              {/* Tabel Nilai Hasil Belajar */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">A. Capaian Hasil Belajar</h3>
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-bold">
                    <tr>
                      <th className="border border-slate-300 p-2 text-center w-12">No</th>
                      <th className="border border-slate-300 p-2 text-left">Mata Pelajaran</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Nilai Akhir</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cetakData.nilai.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="border border-slate-300 p-4 text-center text-slate-500">Belum ada nilai yang di-input.</td>
                      </tr>
                    ) : (
                      cetakData.nilai.map((n: any, idx: number) => (
                        <tr key={n.mataPelajaranId}>
                          <td className="border border-slate-300 p-2 text-center font-medium">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-semibold">{n.namaMapel}</td>
                          <td className="border border-slate-300 p-2 text-center font-bold">{n.nilaiAkhir ?? '-'}</td>
                          <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">{n.predikat || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sikap & Presensi */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Catatan Presensi */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                  <h4 className="font-bold text-slate-900 uppercase">B. Ketidakhadiran</h4>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between border-b border-slate-100 pb-1"><span>Sakit</span><span className="font-bold">{cetakData.presensi.sakit} hari</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1"><span>Izin</span><span className="font-bold">{cetakData.presensi.izin} hari</span></div>
                    <div className="flex justify-between"><span>Tanpa Keterangan (Alpa)</span><span className="font-bold">{cetakData.presensi.alpa} hari</span></div>
                  </div>
                </div>

                {/* Sikap */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                  <h4 className="font-bold text-slate-900 uppercase">C. Sikap & Perilaku</h4>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between border-b border-slate-100 pb-1"><span>Sikap Spiritual</span><span className="font-bold text-emerald-700">{cetakData.presensi.sikapSpiritual}</span></div>
                    <div className="flex justify-between"><span>Sikap Sosial</span><span className="font-bold text-emerald-700">{cetakData.presensi.sikapSosial}</span></div>
                  </div>
                </div>
              </div>

              {/* Catatan Wali Kelas */}
              <div className="border border-slate-300 rounded-lg p-3 space-y-1 text-xs">
                <h4 className="font-bold text-slate-900 uppercase">D. Catatan Wali Kelas</h4>
                <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                  "{cetakData.presensi.catatanWaliKelas}"
                </p>
              </div>

              {/* Box Tanda Tangan */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
                <div className="space-y-12">
                  <p>Orang Tua / Wali Siswa</p>
                  <p className="font-bold underline">( ............................................ )</p>
                </div>
                <div className="space-y-12">
                  <p>Wali Kelas</p>
                  <p className="font-bold underline">{cetakData.akademik.waliKelasName}</p>
                </div>
              </div>

              <div className="pt-4 text-center text-xs space-y-12">
                <p>Mengetahui,<br /><span className="font-semibold">{cetakData.sekolah.namaKetua}</span></p>
                <p className="font-bold underline">( ............................................ )</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ERaporPage;
