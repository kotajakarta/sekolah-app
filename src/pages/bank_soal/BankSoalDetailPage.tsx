import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  FileDown,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Building,
  Clock,
  Calendar,
  Layers,
  FileText,
  HelpCircle,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useBankSoalDetail,
  useDeleteQuestionItem,
  useReorderQuestions,
} from '../../features/bank_soal/hooks/useBankSoal';
import { FormattedMathPreview } from '../../features/bank_soal/components/RichMathEditor';
import { QuestionEditorModal } from '../../features/bank_soal/components/QuestionEditorModal';
import { QuestionBankModal } from '../../features/bank_soal/components/QuestionBankModal';
import { DocxExportModal } from '../../features/bank_soal/components/DocxExportModal';
import type { QuestionItem } from '../../features/bank_soal/types';

export const BankSoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: bank, isLoading, refetch } = useBankSoalDetail(id);

  // Modals state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<QuestionItem | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Filter tab
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MCQ' | 'ESSAY'>('ALL');

  const deleteQuestionMutation = useDeleteQuestionItem();
  const reorderMutation = useReorderQuestions();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Bank Soal Tidak Ditemukan</h2>
        <button
          onClick={() => navigate('/dashboard/bank-soal')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const isOwner = bank.teacherId === user?.id || user?.scope === 'GLOBAL';
  const allQuestions = bank.questions || [];

  const filteredQuestions = allQuestions.filter((q) => {
    if (activeFilter === 'MCQ') return q.type.startsWith('MCQ') || q.type === 'TRUE_FALSE';
    if (activeFilter === 'ESSAY') return q.type === 'ESSAY';
    return true;
  });

  const mcqCount = allQuestions.filter((q) => q.type.startsWith('MCQ') || q.type === 'TRUE_FALSE').length;
  const essayCount = allQuestions.filter((q) => q.type === 'ESSAY').length;

  const handleDeleteQuestion = async (q: QuestionItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus butir soal #${q.orderIndex + 1}?`)) {
      try {
        await deleteQuestionMutation.mutateAsync({
          bankId: bank.id,
          questionId: q.id,
        });
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus butir soal');
      }
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= allQuestions.length) return;

    const newOrder = [...allQuestions];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    try {
      await reorderMutation.mutateAsync({
        bankId: bank.id,
        questionIds: newOrder.map((q) => q.id),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard/bank-soal')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Bank Soal</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition"
            >
              Edit Info Naskah
            </button>
          )}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Package Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg border border-indigo-100 dark:border-indigo-900">
                {bank.subject}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-md">
                {bank.gradeLevel}
              </span>
              {bank.institution && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{bank.institution}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {bank.title}
            </h1>
          </div>

          <button
            onClick={() => {
              setQuestionToEdit(null);
              setIsQuestionModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Butir Soal</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400">Total Soal:</span>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
              {allQuestions.length} Butir ({mcqCount} PG, {essayCount} Esai)
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400">Alokasi Waktu:</span>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{bank.timeLimit ? `${bank.timeLimit} Menit` : 'Sesuai Jadwal'}</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400">Tahun Ajaran / Sem:</span>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
              {bank.academicYear || '-'} {bank.semester ? `(${bank.semester})` : ''}
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400">Penyusun Soal:</span>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              {bank.teacher?.operatorName || bank.teacher?.username || 'Guru'}
            </div>
          </div>
        </div>

        {/* Instructions banner */}
        {bank.instructions && (
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Petunjuk Pengerjaan</span>
              <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                {bank.instructions}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({allQuestions.length})
          </button>
          <button
            onClick={() => setActiveFilter('MCQ')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeFilter === 'MCQ'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pilihan Ganda ({mcqCount})
          </button>
          <button
            onClick={() => setActiveFilter('ESSAY')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeFilter === 'ESSAY'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Esai / Uraian ({essayCount})
          </button>
        </div>

        <button
          onClick={() => {
            setQuestionToEdit(null);
            setIsQuestionModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Soal</span>
        </button>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Belum Ada Butir Soal</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Klik tombol "Tambah Butir Soal" di atas untuk mulai menyusun naskah ujian ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isEssay = q.type === 'ESSAY';
            const realIndex = allQuestions.findIndex((item) => item.id === q.id);

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
              >
                {/* Question Item Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                      {q.orderIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] uppercase tracking-wider ${
                          isEssay
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        {q.type === 'MCQ_4'
                          ? 'Pilihan Ganda (ABCD)'
                          : q.type === 'MCQ_5'
                          ? 'Pilihan Ganda (ABCDE)'
                          : 'Soal Uraian / Esai'}
                      </span>
                      {q.weight && q.weight > 1 && (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Bobot: {q.weight}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Reorder */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={realIndex === 0}
                      onClick={() => handleMoveQuestion(realIndex, 'UP')}
                      title="Geser ke Atas"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition disabled:opacity-20"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={realIndex === allQuestions.length - 1}
                      onClick={() => handleMoveQuestion(realIndex, 'DOWN')}
                      title="Geser ke Bawah"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition disabled:opacity-20"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setQuestionToEdit(q);
                            setIsQuestionModalOpen(true);
                          }}
                          title="Edit Butir Soal"
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q)}
                          title="Hapus Butir Soal"
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Question Body (Render HTML + KaTeX math) */}
                <div className="pl-11 pr-2 text-slate-800 dark:text-slate-100 text-sm leading-relaxed">
                  <FormattedMathPreview html={q.contentHtml} />
                </div>

                {/* Options Rendering (if MCQ) */}
                {!isEssay && q.options && q.options.length > 0 && (
                  <div className="pl-11 space-y-2 pt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border text-sm transition ${
                          opt.isCorrect
                            ? 'border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs shrink-0 ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <FormattedMathPreview html={opt.contentHtml} />
                        </div>
                        {opt.isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded shrink-0">
                            KUNCI JAWABAN
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rubrik Penilaian (if Essay) */}
                {isEssay && q.answerKey && (
                  <div className="pl-11 pt-2">
                    <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl space-y-1">
                      <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1 uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5" />
                        <span>Pedoman Penskoran / Rubrik</span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <FormattedMathPreview html={q.answerKey} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <QuestionEditorModal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setQuestionToEdit(null);
        }}
        bankId={bank.id}
        questionToEdit={questionToEdit}
        nextIndex={allQuestions.length + 1}
      />

      <QuestionBankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        bankToEdit={bank}
      />

      <DocxExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        bank={bank}
      />
    </div>
  );
};
