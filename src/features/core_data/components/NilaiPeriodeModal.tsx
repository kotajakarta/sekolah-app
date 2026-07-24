import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, ClipboardList } from 'lucide-react';
import apiClient from '../../../lib/apiClient';
import { useToast } from '../../../contexts/ToastContext';
import { Student } from '../hooks/useGetStudents';
import { MapelWithKeaktifan, NilaiFormalHistory, getKeteranganTanpaNilai } from '../hooks/useNilaiHistory';
import { calculatePredikat } from '../../../pages/formal/eRaporConstants';

interface Kelas {
  id: string;
  name: string;
  tingkat?: string;
  tahunAjaran?: string;
  cabangId?: string;
  lembagaMuadalah?: { name: string };
}

interface GrupDaimiOption {
  id: string;
  name: string;
  jenis?: string | null;
  cabangId?: string | null;
}

interface NilaiPeriodeModalProps {
  student: Student;
  mapelList: MapelWithKeaktifan[];
  mode: 'edit' | 'new';
  activeTahunAjaran: string;
  activeSemester: string;
  initialTahunAjaran?: string;
  initialSemester?: string;
  initialKelasId?: string;
  initialKelasName?: string;
  initialGrupDaimiId?: string | null;
  existingItems?: NilaiFormalHistory[];
  onClose: () => void;
}

interface HafalanData {
  awalPutaran: number | null;
  awalJuz: number | null;
  targetPutaran: number | null;
  targetJuz: number | null;
  akhirPutaran: number | null;
  akhirJuz: number | null;
}

const EMPTY_HAFALAN: HafalanData = {
  awalPutaran: null, awalJuz: null, targetPutaran: null, targetJuz: null, akhirPutaran: null, akhirJuz: null
};

// Sama persis dengan logika di HafalanAlQuranModal.tsx: (akhir putaran * 30 + akhir juz - 30) / 20
function calculateJumlahHafalan(akhirPutaran: number | null, akhirJuz: number | null) {
  if (akhirPutaran === null || akhirJuz === null || isNaN(akhirPutaran) || isNaN(akhirJuz)) {
    return { jumlahJuz: null as number | null, jumlahHalaman: null as number | null };
  }
  const total = (akhirPutaran * 30 + akhirJuz - 30) / 20;
  const jumlahJuz = Math.floor(total);
  const jumlahHalaman = Math.round((total - jumlahJuz) * 20);
  return { jumlahJuz, jumlahHalaman };
}

const semesterOrder = (semester: string) => {
  const normalized = semester?.toUpperCase();
  if (normalized === 'GANJIL') return 0;
  if (normalized === 'GENAP') return 1;
  return 2;
};

// Tahun ajaran diformat "YYYY/YYYY+1" - dibandingkan secara leksikal sudah sesuai urutan kronologis
const isPeriodeLampau = (tahunAjaran: string, semester: string, activeTahunAjaran: string, activeSemester: string) => {
  if (!tahunAjaran || !semester || !activeTahunAjaran || !activeSemester) return false;
  if (tahunAjaran < activeTahunAjaran) return true;
  if (tahunAjaran === activeTahunAjaran) return semesterOrder(semester) < semesterOrder(activeSemester);
  return false;
};

export default function NilaiPeriodeModal({
  student, mapelList, mode, activeTahunAjaran, activeSemester,
  initialTahunAjaran, initialSemester, initialKelasId, initialKelasName, initialGrupDaimiId, existingItems, onClose
}: NilaiPeriodeModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [tahunAjaran, setTahunAjaran] = useState(initialTahunAjaran || '');
  const [semester, setSemester] = useState(initialSemester || '');
  const [kelasId, setKelasId] = useState(initialKelasId || '');
  // Mode edit: pakai grup daimi yang TERSIMPAN untuk periode ini (bisa beda dari grup siswa
  // saat ini kalau dulu berbeda) - jangan default ke grup aktif siswa sekarang, supaya nilai
  // yang sudah dipilih sebelumnya tidak "hilang"/keliru tertimpa saat dibuka ulang.
  // Mode new (backfill periode baru): belum ada riwayat tersimpan, jadi tebakan awal yang
  // masuk akal adalah grup daimi siswa saat ini.
  const [grupDaimiId, setGrupDaimiId] = useState<string>(
    mode === 'edit' ? (initialGrupDaimiId || '') : (student.dataDaimi?.grupId || '')
  );
  const [hafalan, setHafalan] = useState<HafalanData>(EMPTY_HAFALAN);

  const [localNilai, setLocalNilai] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {};
    (existingItems || []).forEach(item => {
      initial[item.mataPelajaranId] = item.nilaiAkhir ?? null;
    });
    return initial;
  });

  const { data: kelasList = [] } = useQuery<Kelas[]>({
    queryKey: ['kelas-list'],
    queryFn: async () => {
      const res = await apiClient.get<Kelas[]>('/formal/kelas');
      return res.data;
    },
    enabled: mode === 'new'
  });

  const { data: grupDaimiList = [] } = useQuery<GrupDaimiOption[]>({
    queryKey: ['grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get<GrupDaimiOption[]>('/pesantren/grup-daimi');
      return res.data;
    }
  });

  const grupDaimiCabangList = useMemo(
    () => grupDaimiList.filter(g => !student.cabangId || !g.cabangId || g.cabangId === student.cabangId),
    [grupDaimiList, student.cabangId]
  );

  // Kelas/rombel untuk backfill hanya boleh dari cabang siswa & tingkat DI BAWAH tingkat aktifnya saat ini,
  // supaya modal ini tidak dipakai untuk menyentuh data kelas yang sedang berjalan
  const currentTingkat = parseInt(student.siswaFormal?.kelas?.tingkat || '', 10);

  const kelasCabangList = useMemo(
    () => kelasList.filter(k => !student.cabangId || k.cabangId === student.cabangId),
    [kelasList, student.cabangId]
  );

  // Tahun ajaran yang bisa dipilih untuk backfill: tahun ajaran aktif & beberapa tahun sebelumnya,
  // digenerate dari tahun ajaran aktif (bukan hanya dari Kelas yang sudah ada) supaya tetap muncul
  // walau Kelas untuk tahun itu belum pernah dibuat
  const tahunAjaranOptions = useMemo(() => {
    const startYear = parseInt((activeTahunAjaran || '').split('/')[0], 10);
    if (isNaN(startYear)) return [];
    const options: string[] = [];
    for (let i = 0; i < 6; i++) {
      const y = startYear - i;
      options.push(`${y}/${y + 1}`);
    }
    return options;
  }, [activeTahunAjaran]);

  // Semester yang boleh dipilih: kalau tahun ajarannya sama dengan yang aktif, hanya semester
  // SEBELUM semester aktif yang boleh (mis. aktif Genap -> hanya Ganjil tahun itu yang tampil).
  // Ini memastikan periode yang dipilih selalu lampau, tidak pernah menyentuh periode aktif sekarang.
  const semesterOptions = useMemo(() => {
    const all = [{ value: 'Ganjil', label: 'Ganjil (1)' }, { value: 'Genap', label: 'Genap (2)' }];
    if (tahunAjaran === activeTahunAjaran) {
      return all.filter(s => semesterOrder(s.value) < semesterOrder(activeSemester));
    }
    return all;
  }, [tahunAjaran, activeTahunAjaran, activeSemester]);

  // Semua kelas terdaftar di cabang siswa, tidak difilter berdasarkan tahun_ajaran kelas
  // (banyak kelas lama tidak konsisten diisi tahun ajarannya) - cukup batasi tingkat yang
  // setingkat atau di bawah tingkat aktif siswa saat ini.
  const kelasOptions = useMemo(
    () => kelasCabangList.filter(k => {
      const tingkat = parseInt(k.tingkat || '', 10);
      if (!isNaN(currentTingkat) && !isNaN(tingkat) && tingkat > currentTingkat) return false;
      return true;
    }),
    [kelasCabangList, currentTingkat]
  );

  const grupDaimiName = useMemo(
    () => grupDaimiCabangList.find(g => g.id === grupDaimiId)?.jenis
      || grupDaimiCabangList.find(g => g.id === grupDaimiId)?.name
      || null,
    [grupDaimiCabangList, grupDaimiId]
  );

  const isMapelActive = (mapel: MapelWithKeaktifan) => {
    if (mapel.isActive === false) return false;
    if (!grupDaimiId) return false;
    const entry = mapel.keaktifanGrup?.find(k => k.grupDaimiId === grupDaimiId);
    return entry ? entry.isActive : false;
  };

  // Kalau jenis grup daimi yang dipilih untuk periode ini HAFIZLIK, tampilkan juga input
  // Capaian Hafalan Al-Qur'an (sama seperti tab Input Nilai Mapel untuk periode aktif)
  const isHafizlikSelected = grupDaimiCabangList.find(g => g.id === grupDaimiId)?.jenis === 'HAFIZLIK';

  const { data: existingHafalan } = useQuery({
    queryKey: ['hafalan-al-quran', student.id, tahunAjaran, semester],
    queryFn: async () => {
      const res = await apiClient.get(`/formal/erapor/hafalan/${student.id}`, {
        params: { tahunAjaran, semester }
      });
      return res.data;
    },
    enabled: isHafizlikSelected && !!tahunAjaran && !!semester
  });

  useEffect(() => {
    if (existingHafalan) {
      setHafalan({
        awalPutaran: existingHafalan.awalPutaran ?? null,
        awalJuz: existingHafalan.awalJuz ?? null,
        targetPutaran: existingHafalan.targetPutaran ?? null,
        targetJuz: existingHafalan.targetJuz ?? null,
        akhirPutaran: existingHafalan.akhirPutaran ?? null,
        akhirJuz: existingHafalan.akhirJuz ?? null,
      });
    } else {
      setHafalan(EMPTY_HAFALAN);
    }
  }, [existingHafalan]);

  const { jumlahJuz, jumlahHalaman } = calculateJumlahHafalan(hafalan.akhirPutaran, hafalan.akhirJuz);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = mapelList
        .filter(m => isMapelActive(m))
        .map(m => ({ mataPelajaranId: m.id, nilaiAkhir: localNilai[m.id] ?? null }));

      const res = await apiClient.post('/formal/erapor/nilai/student-period', {
        studentId: student.id,
        kelasId,
        tahunAjaran,
        semester,
        grupDaimiId,
        data
      });

      if (isHafizlikSelected) {
        await apiClient.post('/formal/erapor/hafalan', {
          studentId: student.id,
          kelasId,
          tahunAjaran,
          semester,
          ...hafalan
        });
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nilai-history', student.id] });
      queryClient.invalidateQueries({ queryKey: ['hafalan-al-quran', student.id, tahunAjaran, semester] });
      showToast('success', 'Nilai rapor berhasil disimpan');
      onClose();
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan nilai');
    }
  });

  const isLampau = isPeriodeLampau(tahunAjaran, semester, activeTahunAjaran, activeSemester);
  const canSave = !!tahunAjaran && !!semester && !!kelasId && !!grupDaimiId && isLampau && !saveMutation.isPending;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">{mode === 'new' ? 'Tambah Periode & Input Nilai' : 'Input/Edit Nilai Rapor'}</h3>
              <p className="text-xs text-indigo-100">{student.biodata?.fullName} &middot; khusus periode lampau, tidak mengubah data aktif saat ini</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mode === 'new' ? (
            <div className="grid grid-cols-3 gap-3 pb-4 border-b border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tahun Ajaran</label>
                <select
                  value={tahunAjaran}
                  onChange={(e) => { setTahunAjaran(e.target.value); setSemester(''); setKelasId(''); }}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Pilih --</option>
                  {tahunAjaranOptions.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={!tahunAjaran || semesterOptions.length === 0}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="">-- Pilih --</option>
                  {semesterOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {tahunAjaran === activeTahunAjaran && semesterOptions.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">Tahun ajaran ini tidak punya semester lampau, pilih tahun sebelumnya.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kelas / Rombel</label>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  disabled={!semester}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="">-- Pilih --</option>
                  {kelasOptions.map(k => (
                    <option key={k.id} value={k.id}>{k.name}{k.tahunAjaran ? ` (TA ${k.tahunAjaran})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-100 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700">TA {tahunAjaran}</span>
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 font-semibold text-indigo-700">{semester}</span>
              <span className="px-2.5 py-1 rounded-md bg-teal-50 font-semibold text-teal-800">Kelas {initialKelasName || '-'}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Jenis Grup Daimi (saat periode ini)</label>
            <select
              value={grupDaimiId}
              onChange={(e) => setGrupDaimiId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Pilih --</option>
              {grupDaimiCabangList.map(g => (
                <option key={g.id} value={g.id}>{g.name}{g.jenis ? ` (${g.jenis})` : ''}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Menentukan mapel mana yang aktif/bisa diisi untuk periode ini. Boleh berbeda dari grup daimi siswa saat ini kalau dulu berbeda.
            </p>
          </div>

          {isHafizlikSelected && (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Capaian Hafalan Al-Qur'an (HAFIZLIK)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Awal Putaran</label>
                  <input
                    type="number"
                    value={hafalan.awalPutaran ?? ''}
                    onChange={(e) => setHafalan(prev => ({ ...prev, awalPutaran: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Awal Juz</label>
                  <input
                    type="number"
                    value={hafalan.awalJuz ?? ''}
                    onChange={(e) => setHafalan(prev => ({ ...prev, awalJuz: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Target Putaran</label>
                  <input
                    type="number"
                    value={hafalan.targetPutaran ?? ''}
                    onChange={(e) => setHafalan(prev => ({ ...prev, targetPutaran: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Target Juz</label>
                  <input
                    type="number"
                    value={hafalan.targetJuz ?? ''}
                    onChange={(e) => setHafalan(prev => ({ ...prev, targetJuz: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Akhir Putaran</label>
                  <input
                    type="number"
                    value={hafalan.akhirPutaran ?? ''}
                    onChange={(e) => setHafalan(prev => ({ ...prev, akhirPutaran: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Akhir Juz</label>
                  <input
                    type="number"
                    value={hafalan.akhirJuz ?? ''}
                    onChange={(e) => setHafalan(prev => ({ ...prev, akhirJuz: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-1 text-xs">
                <span className="text-slate-500">Total Capaian:</span>
                <span className="font-bold text-emerald-700">{jumlahJuz ?? '-'} Juz {jumlahHalaman ?? '-'} Halaman</span>
              </div>
            </div>
          )}

          {mode === 'new' && !canSave && (
            <p className="text-xs text-amber-600 italic">Lengkapi Tahun Ajaran, Semester, Kelas, dan Jenis Grup Daimi (harus periode lampau) untuk mulai input nilai.</p>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Mata Pelajaran</th>
                  <th className="py-2.5 px-3 w-28 text-center">Nilai Akhir</th>
                  <th className="py-2.5 px-3 w-20 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mapelList.map(mapel => {
                  const active = isMapelActive(mapel);
                  const score = localNilai[mapel.id];
                  const predikat = calculatePredikat(score ?? null);
                  const keterangan = !active ? getKeteranganTanpaNilai(mapel, grupDaimiId, grupDaimiName) : null;
                  return (
                    <tr key={mapel.id} className={!active ? 'bg-slate-50/60' : ''}>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {mapel.name}
                        <span className="ml-1.5 text-[11px] font-normal text-slate-400">({mapel.kodeMapel})</span>
                        {keterangan && <span className="block text-[10px] font-normal text-slate-400 italic">{keterangan}</span>}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={score ?? ''}
                          disabled={!active || !kelasId}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            setLocalNilai(prev => ({ ...prev, [mapel.id]: val }));
                          }}
                          className="w-20 text-center py-1 px-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-700">{predikat || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>
        </div>
      </div>
    </div>
  );
}
