import React, { useMemo, useState } from 'react';
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

interface NilaiPeriodeModalProps {
  student: Student;
  mapelList: MapelWithKeaktifan[];
  mode: 'edit' | 'new';
  initialTahunAjaran?: string;
  initialSemester?: string;
  initialKelasId?: string;
  initialKelasName?: string;
  existingItems?: NilaiFormalHistory[];
  onClose: () => void;
}

export default function NilaiPeriodeModal({
  student, mapelList, mode, initialTahunAjaran, initialSemester, initialKelasId, initialKelasName, existingItems, onClose
}: NilaiPeriodeModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [tahunAjaran, setTahunAjaran] = useState(initialTahunAjaran || '');
  const [semester, setSemester] = useState(initialSemester || '');
  const [kelasId, setKelasId] = useState(initialKelasId || '');

  const existingMap = useMemo(
    () => new Map((existingItems || []).map(item => [item.mataPelajaranId, item])),
    [existingItems]
  );

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

  const kelasCabangList = useMemo(
    () => kelasList.filter(k => !student.cabangId || k.cabangId === student.cabangId),
    [kelasList, student.cabangId]
  );

  const tahunAjaranOptions = useMemo(() => {
    const set = new Set<string>();
    kelasCabangList.forEach(k => { if (k.tahunAjaran) set.add(k.tahunAjaran); });
    return Array.from(set).sort().reverse();
  }, [kelasCabangList]);

  const kelasOptions = useMemo(
    () => kelasCabangList.filter(k => !tahunAjaran || k.tahunAjaran === tahunAjaran),
    [kelasCabangList, tahunAjaran]
  );

  const grupDaimiId = student.dataDaimi?.grupId ?? null;
  const grupDaimiName = student.dataDaimi?.grup?.jenis || student.dataDaimi?.grup?.name || null;

  const isMapelActive = (mapel: MapelWithKeaktifan) => {
    if (mapel.isActive === false) return false;
    if (!grupDaimiId) return false;
    const entry = mapel.keaktifanGrup?.find(k => k.grupDaimiId === grupDaimiId);
    return entry ? entry.isActive : false;
  };

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
        data
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nilai-history', student.id] });
      showToast('success', 'Nilai rapor berhasil disimpan');
      onClose();
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || 'Gagal menyimpan nilai');
    }
  });

  const canSave = !!tahunAjaran && !!semester && !!kelasId && !saveMutation.isPending;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">{mode === 'new' ? 'Tambah Periode & Input Nilai' : 'Input/Edit Nilai Rapor'}</h3>
              <p className="text-xs text-indigo-100">{student.biodata?.fullName}</p>
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
                  onChange={(e) => { setTahunAjaran(e.target.value); setKelasId(''); }}
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
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Pilih --</option>
                  <option value="Ganjil">Ganjil (1)</option>
                  <option value="Genap">Genap (2)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Kelas / Rombel</label>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  disabled={!tahunAjaran}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="">-- Pilih --</option>
                  {kelasOptions.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
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

          {mode === 'new' && !canSave && (
            <p className="text-xs text-amber-600 italic">Pilih Tahun Ajaran, Semester, dan Kelas terlebih dahulu untuk mulai input nilai.</p>
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
