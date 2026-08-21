import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, Building, Calendar, CheckCircle2, Sparkles, Layers, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useCreateBankSoal, useUpdateBankSoal } from '../hooks/useBankSoal';
import type { QuestionBank, BankSoalAssignment } from '../types';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankToEdit?: QuestionBank | null;
  assignmentContext?: BankSoalAssignment | null;
  onSuccess?: (bank: QuestionBank) => void;
}

interface MapelOption {
  id: string;
  kodeMapel: string;
  name: string;
  grupMapel: string;
  isActive?: boolean;
}

const TINGKAT_OPTIONS = [
  'Kelas 7',
  'Kelas 8',
  'Kelas 9',
  'Kelas 10',
  'Kelas 11',
  'Kelas 12',
];

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  bankToEdit,
  assignmentContext,
  onSuccess,
}) => {
  // Query Mata Pelajaran from /formal/mapel (same as /dashboard/formal/mapel)
  const { data: mapelList = [], isLoading: isLoadingMapel } = useQuery<MapelOption[]>({
    queryKey: ['formal-mapel-list'],
    queryFn: async () => {
      const response = await apiClient.get<MapelOption[]>('/formal/mapel');
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Kelas 7');
  const [timeLimit, setTimeLimit] = useState<number | ''>(90);
  const [institution, setInstitution] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('GANJIL');
  const [instructions, setInstructions] = useState(
    '1. Berdoalah sebelum mengerjakan soal.\n2. Periksa dan bacalah setiap butir soal dengan seksama.\n3. Laporkan kepada pengawas jika terdapat tulisan yang kurang jelas atau rusak.',
  );
  const [isShared, setIsShared] = useState(false);

  const createMutation = useCreateBankSoal();
  const updateMutation = useUpdateBankSoal();

  useEffect(() => {
    if (bankToEdit) {
      setTitle(bankToEdit.title || '');
      setSubject(bankToEdit.subject || '');
      setGradeLevel(bankToEdit.gradeLevel || 'Kelas 7');
      setTimeLimit(bankToEdit.timeLimit ?? '');
      setInstitution(bankToEdit.institution || '');
      setAcademicYear(bankToEdit.academicYear || '2025/2026');
      setSemester(bankToEdit.semester || 'GANJIL');
      setInstructions(bankToEdit.instructions || '');
      setIsShared(bankToEdit.isShared || false);
    } else if (assignmentContext) {
      // Pre-fill from assigned task
      setTitle(`Naskah Ujian ${assignmentContext.subjectName} - ${assignmentContext.gradeLevel}`);
      setSubject(assignmentContext.subjectName || '');
      setGradeLevel(assignmentContext.gradeLevel || 'Kelas 7');
      setTimeLimit(assignmentContext.timeLimit || 90);
      setInstitution('');
      setAcademicYear(assignmentContext.project?.academicYear || '2025/2026');
      setSemester(assignmentContext.project?.semester || 'GANJIL');
      setInstructions(
        assignmentContext.instructions ||
          '1. Berdoalah sebelum mengerjakan soal.\n2. Periksa dan bacalah setiap butir soal dengan seksama.\n3. Laporkan kepada pengawas jika terdapat tulisan yang kurang jelas atau rusak.',
      );
      setIsShared(false);
    } else {
      setTitle('');
      setSubject(mapelList[0]?.name || '');
      setGradeLevel('Kelas 7');
      setTimeLimit(90);
      setInstitution('');
      setAcademicYear('2025/2026');
      setSemester('GANJIL');
      setInstructions(
        '1. Berdoalah sebelum mengerjakan soal.\n2. Periksa dan bacalah setiap butir soal dengan seksama.\n3. Laporkan kepada pengawas jika terdapat tulisan yang kurang jelas atau rusak.',
      );
      setIsShared(false);
    }
  }, [bankToEdit, assignmentContext, isOpen, mapelList]);

  if (!isOpen) return null;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !gradeLevel) {
      alert('Judul, Mata Pelajaran, dan Tingkat wajib diisi.');
      return;
    }

    const payload = {
      title,
      subject,
      gradeLevel,
      timeLimit: timeLimit ? Number(timeLimit) : null,
      institution: institution || null,
      academicYear: academicYear || null,
      semester: semester || null,
      instructions: instructions || null,
      isShared,
      assignmentId: assignmentContext?.id,
    };

    try {
      if (bankToEdit) {
        const res = await updateMutation.mutateAsync({
          id: bankToEdit.id,
          data: payload,
        });
        onSuccess?.(res);
      } else {
        const res = await createMutation.mutateAsync(payload);
        onSuccess?.(res);
      }
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan paket bank soal:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {bankToEdit
                  ? 'Edit Informasi Bank Soal'
                  : assignmentContext
                  ? 'Buat Paket Soal dari Tugas Proyek'
                  : 'Buat Paket Bank Soal Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                {assignmentContext
                  ? `Ditugaskan pada proyek: ${assignmentContext.project?.title}`
                  : 'Lengkapi metadata dan kop resmi naskah soal ujian'}
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* 1. Judul Naskah Soal (Custom Input) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              1. Judul Naskah Soal (Custom) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Penilaian Akhir Semester Ganjil Matematika Wajib"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* 2. Mata Pelajaran & 3. Tingkat / Kelas (Dropdowns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>2. Mata Pelajaran (Mapel Formal) <span className="text-rose-500">*</span></span>
                {isLoadingMapel && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
              </label>
              {mapelList.length > 0 ? (
                <select
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {mapelList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} {s.kodeMapel ? `(${s.kodeMapel})` : ''} {s.grupMapel ? `- ${s.grupMapel}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Nama Mata Pelajaran"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                3. Tingkat / Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                {TINGKAT_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Limit & Academic Year & Semester */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Alokasi Waktu (Menit)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : '')}
                  placeholder="90"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Tahun Ajaran
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2025/2026"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
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
              </select>
            </div>
          </div>

          {/* Institution */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nama Lembaga / Madrasah (Kop Soal)
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Contoh: Pondok Pesantren & Madrasah Aliyah Edaimi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Petunjuk Umum Pengerjaan Ujian
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none leading-relaxed"
            />
          </div>

          {/* Share Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-900">
                  Bagikan ke Cabang & Wilayah Lain (Publik / Shared)
                </p>
                <p className="text-slate-500">
                  Guru di cabang lain dapat melihat dan menggandakan (duplikasi) naskah soal ini.
                </p>
              </div>
            </label>
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{bankToEdit ? 'Simpan Perubahan' : 'Buat Naskah Soal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
