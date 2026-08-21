import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Target, CheckCircle2, Layers, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useCreateBankSoalProject, useHierarchyMetadata } from '../hooks/useBankSoal';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MapelOption {
  id: string;
  kodeMapel: string;
  name: string;
  grupMapel: string;
  isActive?: boolean;
}

interface AssignmentRow {
  subjectName: string;
  gradeLevel: string;
  targetMcqCount: number;
  targetEssayCount: number;
  timeLimit: number;
  wilayahId?: string;
}

const TINGKAT_OPTIONS = [
  'Kelas 7',
  'Kelas 8',
  'Kelas 9',
  'Kelas 10',
  'Kelas 11',
  'Kelas 12',
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  // Query Mata Pelajaran from /formal/mapel
  const { data: mapelList = [], isLoading: isLoadingMapel } = useQuery<MapelOption[]>({
    queryKey: ['formal-mapel-list'],
    queryFn: async () => {
      const response = await apiClient.get<MapelOption[]>('/formal/mapel');
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: hierarchyMeta } = useHierarchyMetadata();
  const createMutation = useCreateBankSoalProject();

  const [title, setTitle] = useState('Penyusunan Naskah Penilaian Akhir Semester Ganjil');
  const [description, setDescription] = useState(
    'Proyek penugasan penyusunan naskah soal ujian dari Pusat ke Wilayah, Cabang, dan Guru Pengampu.',
  );
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('GANJIL');
  const [deadline, setDeadline] = useState('');

  const [rows, setRows] = useState<AssignmentRow[]>([
    {
      subjectName: '',
      gradeLevel: 'Kelas 7',
      targetMcqCount: 40,
      targetEssayCount: 5,
      timeLimit: 90,
      wilayahId: '',
    },
  ]);

  if (!isOpen) return null;

  const wilayahList = hierarchyMeta?.wilayahList || [];

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        subjectName: mapelList[0]?.name || '',
        gradeLevel: 'Kelas 7',
        targetMcqCount: 40,
        targetEssayCount: 5,
        timeLimit: 90,
        wilayahId: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof AssignmentRow, value: any) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Judul proyek wajib diisi.');
      return;
    }

    const validAssignments = rows.filter((r) => r.subjectName.trim() !== '');
    if (validAssignments.length === 0) {
      alert('Minimal masukkan 1 mata pelajaran dan tingkat target penugasan.');
      return;
    }

    const payload = {
      title,
      description,
      academicYear,
      semester,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      assignments: validAssignments.map((r) => ({
        subjectName: r.subjectName,
        gradeLevel: r.gradeLevel,
        targetMcqCount: Number(r.targetMcqCount) || 40,
        targetEssayCount: Number(r.targetEssayCount) || 5,
        timeLimit: Number(r.timeLimit) || 90,
        wilayahId: r.wilayahId || null,
      })),
    };

    try {
      await createMutation.mutateAsync(payload);
      onClose();
    } catch (err) {
      console.error('Gagal membuat proyek:', err);
      alert('Terjadi kesalahan saat membuat proyek penugasan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Buat Proyek Penugasan Bank Soal (Admin Pusat)
              </h2>
              <p className="text-xs text-slate-500">
                Instruksikan pembuatan naskah ujian berjenjang ke Wilayah, Cabang, dan Guru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Judul Proyek Penugasan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Penyusunan Naskah Penilaian Akhir Semester Ganjil"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Batas Waktu Pengumpulan (Deadline)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025/2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
                <option value="TAHUNAN">Tahunan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Deskripsi / Petunjuk Umum Proyek
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruksi umum naskah soal..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Assignment Table Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Daftar Target Mapel & Penugasan ke Wilayah</span>
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Mapel</span>
              </button>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Mata Pelajaran (Mapel Formal)</th>
                      <th className="p-3.5">Tingkat / Kelas (7 - 12)</th>
                      <th className="p-3.5 w-24 text-center">Target PG</th>
                      <th className="p-3.5 w-24 text-center">Target Esai</th>
                      <th className="p-3.5">Ditugaskan ke Wilayah</th>
                      <th className="p-3.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="bg-white hover:bg-slate-50/50 transition">
                        <td className="p-3">
                          {mapelList.length > 0 ? (
                            <select
                              value={row.subjectName}
                              onChange={(e) => handleRowChange(idx, 'subjectName', e.target.value)}
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                              <option value="">-- Pilih Mapel --</option>
                              {mapelList.map((s) => (
                                <option key={s.id} value={s.name}>
                                  {s.name} {s.kodeMapel ? `(${s.kodeMapel})` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={row.subjectName}
                              onChange={(e) => handleRowChange(idx, 'subjectName', e.target.value)}
                              placeholder="Ketik Mapel..."
                              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={row.gradeLevel}
                            onChange={(e) => handleRowChange(idx, 'gradeLevel', e.target.value)}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            {TINGKAT_OPTIONS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={row.targetMcqCount}
                            onChange={(e) =>
                              handleRowChange(idx, 'targetMcqCount', Number(e.target.value))
                            }
                            className="w-full p-2 text-center rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={row.targetEssayCount}
                            onChange={(e) =>
                              handleRowChange(idx, 'targetEssayCount', Number(e.target.value))
                            }
                            className="w-full p-2 text-center rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={row.wilayahId || ''}
                            onChange={(e) => handleRowChange(idx, 'wilayahId', e.target.value)}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            <option value="">-- Belum Ditugaskan --</option>
                            {wilayahList.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Membuat Proyek...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Buat & Luncurkan Proyek</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
