import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Target, CheckCircle2, Layers } from 'lucide-react';
import { useCreateBankSoalProject, useFormalMetadata, useHierarchyMetadata } from '../hooks/useBankSoal';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AssignmentRow {
  subjectName: string;
  gradeLevel: string;
  targetMcqCount: number;
  targetEssayCount: number;
  timeLimit: number;
  wilayahId?: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { data: formalMeta } = useFormalMetadata();
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

  const subjects = formalMeta?.subjects || [];
  const gradeLevels = formalMeta?.gradeLevels || [];
  const wilayahList = hierarchyMeta?.wilayahList || [];

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        subjectName: subjects[0]?.name || '',
        gradeLevel: gradeLevels[0] || 'Kelas 7',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Buat Proyek Penugasan Bank Soal (Admin Pusat)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instruksikan pembuatan naskah ujian berjenjang ke Wilayah, Cabang, dan Guru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Judul Proyek Penugasan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Penyusunan Naskah Penilaian Akhir Semester Ganjil"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Batas Waktu Pengumpulan (Deadline)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025/2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="GANJIL">Ganjil</option>
                <option value="GENAP">Genap</option>
                <option value="TAHUNAN">Tahunan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Deskripsi / Petunjuk Umum Proyek
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruksi umum naskah soal..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Assignment Table Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Daftar Target Mapel & Penugasan ke Wilayah</span>
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Mapel</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Mata Pelajaran</th>
                      <th className="p-3">Tingkat / Kelas</th>
                      <th className="p-3 w-20 text-center">Target PG</th>
                      <th className="p-3 w-20 text-center">Target Esai</th>
                      <th className="p-3">Ditugaskan ke Wilayah</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="bg-white dark:bg-slate-900 hover:bg-slate-50/50 transition">
                        <td className="p-2.5">
                          {subjects.length > 0 ? (
                            <select
                              value={row.subjectName}
                              onChange={(e) => handleRowChange(idx, 'subjectName', e.target.value)}
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            >
                              <option value="">-- Pilih Mapel --</option>
                              {subjects.map((s) => (
                                <option key={s.id} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={row.subjectName}
                              onChange={(e) => handleRowChange(idx, 'subjectName', e.target.value)}
                              placeholder="Ketik Mapel..."
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            />
                          )}
                        </td>
                        <td className="p-2.5">
                          {gradeLevels.length > 0 ? (
                            <select
                              value={row.gradeLevel}
                              onChange={(e) => handleRowChange(idx, 'gradeLevel', e.target.value)}
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            >
                              {gradeLevels.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={row.gradeLevel}
                              onChange={(e) => handleRowChange(idx, 'gradeLevel', e.target.value)}
                              placeholder="Tingkat..."
                              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium"
                            />
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.targetMcqCount}
                            onChange={(e) => handleRowChange(idx, 'targetMcqCount', e.target.value)}
                            className="w-16 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs text-center font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.targetEssayCount}
                            onChange={(e) => handleRowChange(idx, 'targetEssayCount', e.target.value)}
                            className="w-16 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs text-center font-bold"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={row.wilayahId || ''}
                            onChange={(e) => handleRowChange(idx, 'wilayahId', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                          >
                            <option value="">-- Belum Ditugaskan --</option>
                            {wilayahList.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            disabled={rows.length === 1}
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition disabled:opacity-20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Membuat Proyek...' : 'Terbitkan Proyek Penugasan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
