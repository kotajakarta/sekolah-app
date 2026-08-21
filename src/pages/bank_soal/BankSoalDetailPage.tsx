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
  Building,
  Clock,
  Calendar,
  Layers,
  FileText,
  HelpCircle,
  Award,
  Sparkles,
  Info,
  CheckCircle2,
  BookOpen,
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
      <div className="space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Bank Soal Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Paket naskah soal ini mungkin telah dihapus atau Anda tidak memiliki hak akses untuk membukanya.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/bank-soal')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Koleksi Bank Soal</span>
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
    <div className="space-y-6">
      {/* ── TOP ACTION BAR (PORTAL WALSAN STYLE) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard/bank-soal')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-2xs transition-all cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Bank Soal</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Info Naskah</span>
            </button>
          )}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* ── PACKAGE DETAIL BANNER CARD (PORTAL WALSAN STYLE) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-200 shadow-2xs">
                {bank.subject}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">
                {bank.gradeLevel}
              </span>
              {bank.institution && (
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{bank.institution}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {bank.title}
            </h1>
          </div>

          <button
            onClick={() => {
              setQuestionToEdit(null);
              setIsQuestionModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Butir Soal</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
            <span className="text-slate-400 font-medium">Total Soal:</span>
            <div className="font-extrabold text-sm text-slate-900 mt-0.5">
              {allQuestions.length} Butir ({mcqCount} PG, {essayCount} Esai)
            </div>
          </div>
          <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
            <span className="text-slate-400 font-medium">Alokasi Waktu:</span>
            <div className="font-extrabold text-sm text-slate-900 mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{bank.timeLimit ? `${bank.timeLimit} Menit` : 'Sesuai Jadwal'}</span>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
            <span className="text-slate-400 font-medium">Tahun Ajaran / Sem:</span>
            <div className="font-extrabold text-sm text-slate-900 mt-0.5">
              {bank.academicYear || '-'} {bank.semester ? `(${bank.semester})` : ''}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
            <span className="text-slate-400 font-medium">Penyusun Soal:</span>
            <div className="font-extrabold text-sm text-slate-900 mt-0.5 truncate">
              {bank.teacher?.operatorName || bank.teacher?.username || 'Guru'}
            </div>
          </div>
        </div>

        {/* Instructions banner */}
        {bank.instructions && (
          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">Petunjuk Pengerjaan</span>
              <p className="whitespace-pre-line text-slate-700 leading-relaxed">
                {bank.instructions}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── QUESTION FILTER TABS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-1 shadow-2xs flex flex-wrap gap-1">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            Semua ({allQuestions.length})
          </button>
          <button
            onClick={() => setActiveFilter('MCQ')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'MCQ'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            Pilihan Ganda ({mcqCount})
          </button>
          <button
            onClick={() => setActiveFilter('ESSAY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ESSAY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-2xl shadow-2xs transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Soal</span>
        </button>
      </div>

      {/* ── QUESTIONS LIST ── */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-slate-400 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Belum Ada Butir Soal</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Klik tombol "Tambah Butir Soal" di atas untuk mulai menyusun naskah ujian ini.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isEssay = q.type === 'ESSAY';
            const realIndex = allQuestions.findIndex((item) => item.id === q.id);

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 hover:border-indigo-300 transition-all"
              >
                {/* Question Item Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 font-extrabold text-xs text-indigo-700 shadow-2xs">
                      {q.orderIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider border ${
                          isEssay
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
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
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-20"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={realIndex === allQuestions.length - 1}
                      onClick={() => handleMoveQuestion(realIndex, 'DOWN')}
                      title="Geser ke Bawah"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-20"
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
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q)}
                          title="Hapus Butir Soal"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Question Body (Render HTML + KaTeX math) */}
                <div className="pl-11 pr-2 text-slate-900 text-sm leading-relaxed font-normal">
                  <FormattedMathPreview html={q.contentHtml} />
                </div>

                {/* Options Rendering (if MCQ) */}
                {!isEssay && q.options && q.options.length > 0 && (
                  <div className="pl-11 space-y-2 pt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-start gap-3 p-3 rounded-2xl border text-sm transition ${
                          opt.isCorrect
                            ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950 font-semibold shadow-2xs'
                            : 'border-slate-100 bg-slate-50/60 text-slate-800'
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-lg font-extrabold text-xs shrink-0 ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <FormattedMathPreview html={opt.contentHtml} />
                        </div>
                        {opt.isCorrect && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
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
                    <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-1.5">
                      <div className="text-[11px] font-extrabold text-blue-700 flex items-center gap-1 uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5" />
                        <span>Pedoman Penskoran / Rubrik</span>
                      </div>
                      <div className="text-xs text-slate-800 leading-relaxed font-medium">
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

      {/* ── MODALS ── */}
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
