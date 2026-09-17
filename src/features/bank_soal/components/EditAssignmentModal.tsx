import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, Target, CheckCircle2 } from 'lucide-react';
import { useUpdateAssignment, useFormalMetadata } from '../hooks/useBankSoal';
import type { BankSoalAssignment } from '../types';

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: BankSoalAssignment | null;
}

const TINGKAT_OPTIONS = [
  'Kelas 7',
  'Kelas 8',
  'Kelas 9',
  'Kelas 10',
  'Kelas 11',
  'Kelas 12',
  'Ula 1',
  'Ula 2',
  'Wustha 1',
  'Wustha 2',
  'Wustha 3',
  'Ulya 1',
  'Ulya 2',
  'Ulya 3',
];

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
}) => {
  const { data: formalMeta } = useFormalMetadata();
  const updateMutation = useUpdateAssignment();

  const [subjectName, setSubjectName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Kelas 7');
  const [targetMcqCount, setTargetMcqCount] = useState(40);
  const [targetEssayCount, setTargetEssayCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(90);
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (assignment) {
      setSubjectName(assignment.subjectName || '');
      setGradeLevel(assignment.gradeLevel || 'Kelas 7');
      setTargetMcqCount(assignment.targetMcqCount ?? 40);
      setTargetEssayCount(assignment.targetEssayCount ?? 5);
      setTimeLimit(assignment.timeLimit ?? 90);
      setInstructions(assignment.instructions || '');
      setNotes(assignment.notes || '');
    }
  }, [assignment, isOpen]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      alert('Nama mata pelajaran wajib diisi');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: assignment.id,
        data: {
          subjectName: subjectName.trim(),
          gradeLevel,
          targetMcqCount: Number(targetMcqCount) || 0,
          targetEssayCount: Number(targetEssayCount) || 0,
          timeLimit: Number(timeLimit) || 90,
          instructions: instructions.trim() || null,
          notes: notes.trim() || null,
        },
      });
      onClose();
    } catch (err) {
      console.error('Gagal memperbarui penugasan:', err);
      alert('Terjadi kesalahan saat memperbarui penugasan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Rincian Penugasan Mapel</h2>
              <p className="text-xs text-slate-500">Atur target soal, tingkat, dan alokasi waktu ujian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="mapel-options"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Pilih atau ketik mapel..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
              <datalist id="mapel-options">
                {formalMeta?.subjects?.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Tingkat / Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {Array.from(new Set([...TINGKAT_OPTIONS, ...(formalMeta?.gradeLevels || [])])).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Target PG
              </label>
              <input
                type="number"
                min={0}
                value={targetMcqCount}
                onChange={(e) => setTargetMcqCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Target Esai
              </label>
              <input
                type="number"
                min={0}
                value={targetEssayCount}
                onChange={(e) => setTargetEssayCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Waktu (Menit)
              </label>
              <input
                type="number"
                min={15}
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Instruksi Khusus Mapel
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Contoh: Gunakan format pilihan ganda 5 opsi (A-E) untuk tingkat ini..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer */}
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
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Penugasan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
