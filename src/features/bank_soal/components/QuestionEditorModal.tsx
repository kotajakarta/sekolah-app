import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, HelpCircle, FileText, CheckCircle, Award } from 'lucide-react';
import { RichMathEditor } from './RichMathEditor';
import { useCreateQuestionItem, useUpdateQuestionItem } from '../hooks/useBankSoal';
import type { QuestionItem, QuestionOption, QuestionType } from '../types';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  questionToEdit?: QuestionItem | null;
  nextIndex?: number;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  bankId,
  questionToEdit,
  nextIndex = 1,
}) => {
  const [type, setType] = useState<QuestionType>('MCQ_4');
  const [contentHtml, setContentHtml] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [weight, setWeight] = useState<number>(1);
  const [options, setOptions] = useState<QuestionOption[]>([
    { label: 'A', contentHtml: '', isCorrect: true, orderIndex: 0 },
    { label: 'B', contentHtml: '', isCorrect: false, orderIndex: 1 },
    { label: 'C', contentHtml: '', isCorrect: false, orderIndex: 2 },
    { label: 'D', contentHtml: '', isCorrect: false, orderIndex: 3 },
  ]);

  const createMutation = useCreateQuestionItem();
  const updateMutation = useUpdateQuestionItem();

  useEffect(() => {
    if (questionToEdit) {
      setType(questionToEdit.type || 'MCQ_4');
      setContentHtml(questionToEdit.contentHtml || '');
      setAnswerKey(questionToEdit.answerKey || '');
      setWeight(questionToEdit.weight ?? 1);

      if (questionToEdit.options && questionToEdit.options.length > 0) {
        setOptions(questionToEdit.options);
      } else if (questionToEdit.type === 'MCQ_5') {
        setOptions([
          { label: 'A', contentHtml: '', isCorrect: true, orderIndex: 0 },
          { label: 'B', contentHtml: '', isCorrect: false, orderIndex: 1 },
          { label: 'C', contentHtml: '', isCorrect: false, orderIndex: 2 },
          { label: 'D', contentHtml: '', isCorrect: false, orderIndex: 3 },
          { label: 'E', contentHtml: '', isCorrect: false, orderIndex: 4 },
        ]);
      } else {
        setOptions([
          { label: 'A', contentHtml: '', isCorrect: true, orderIndex: 0 },
          { label: 'B', contentHtml: '', isCorrect: false, orderIndex: 1 },
          { label: 'C', contentHtml: '', isCorrect: false, orderIndex: 2 },
          { label: 'D', contentHtml: '', isCorrect: false, orderIndex: 3 },
        ]);
      }
    } else {
      setType('MCQ_4');
      setContentHtml('');
      setAnswerKey('');
      setWeight(1);
      setOptions([
        { label: 'A', contentHtml: '', isCorrect: true, orderIndex: 0 },
        { label: 'B', contentHtml: '', isCorrect: false, orderIndex: 1 },
        { label: 'C', contentHtml: '', isCorrect: false, orderIndex: 2 },
        { label: 'D', contentHtml: '', isCorrect: false, orderIndex: 3 },
      ]);
    }
  }, [questionToEdit, isOpen]);

  // Handle Type Change (MCQ_4, MCQ_5, ESSAY)
  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === 'MCQ_4') {
      const current = options.slice(0, 4);
      while (current.length < 4) {
        current.push({
          label: String.fromCharCode(65 + current.length),
          contentHtml: '',
          isCorrect: false,
          orderIndex: current.length,
        });
      }
      if (!current.some((o) => o.isCorrect)) {
        current[0].isCorrect = true;
      }
      setOptions(current);
    } else if (newType === 'MCQ_5') {
      const current = [...options];
      while (current.length < 5) {
        current.push({
          label: String.fromCharCode(65 + current.length),
          contentHtml: '',
          isCorrect: false,
          orderIndex: current.length,
        });
      }
      if (!current.some((o) => o.isCorrect)) {
        current[0].isCorrect = true;
      }
      setOptions(current.slice(0, 5));
    }
  };

  const handleCorrectOptionSelect = (index: number) => {
    setOptions(
      options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      })),
    );
  };

  const handleOptionContentChange = (index: number, val: string) => {
    setOptions(
      options.map((opt, i) => (i === index ? { ...opt, contentHtml: val } : opt)),
    );
  };

  if (!isOpen) return null;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentHtml.trim()) {
      alert('Isi pertanyaan tidak boleh kosong');
      return;
    }

    const payload = {
      type,
      contentHtml,
      answerKey: type === 'ESSAY' ? answerKey : null,
      weight: Number(weight) || 1,
      options: type !== 'ESSAY' ? options : [],
    };

    try {
      if (questionToEdit) {
        await updateMutation.mutateAsync({
          bankId,
          questionId: questionToEdit.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync({
          bankId,
          data: payload,
        });
      }
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan butir soal:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {questionToEdit ? `Edit Butir Soal #${questionToEdit.orderIndex + 1}` : `Tambah Butir Soal Baru #${nextIndex}`}
              </h2>
              <p className="text-xs text-slate-500">
                Pilih format soal (Pilihan Ganda atau Esai) dan atur kunci jawaban
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Tipe Soal Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Tipe Butir Soal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('MCQ_4')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  type === 'MCQ_4'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>Pilihan Ganda (ABCD)</span>
                  {type === 'MCQ_4' && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className="text-[11px] text-slate-500">4 Pilihan Opsi (A, B, C, D)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('MCQ_5')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  type === 'MCQ_5'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>Pilihan Ganda (ABCDE)</span>
                  {type === 'MCQ_5' && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className="text-[11px] text-slate-500">5 Pilihan Opsi (A, B, C, D, E)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('ESSAY')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  type === 'ESSAY'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>Soal Uraian / Esai</span>
                  {type === 'ESSAY' && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className="text-[11px] text-slate-500">Jawaban bebas dengan rubrik</span>
              </button>
            </div>
          </div>

          {/* Isi Pertanyaan (RichMathEditor) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Isi Pertanyaan / Stimulus Soal <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Bobot Nilai:</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-xs text-center border border-slate-200 rounded-xl bg-slate-50/60 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            <RichMathEditor
              value={contentHtml}
              onChange={setContentHtml}
              placeholder="Tuliskan pertanyaan soal, narasi stimulus, tabel, gambar, atau rumus matematika di sini..."
              minHeight="140px"
            />
          </div>

          {/* Opsi Pilihan Ganda */}
          {type !== 'ESSAY' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilihan Jawaban & Penanda Kunci
                </label>
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Klik tombol huruf untuk menandai kunci yang benar</span>
                </span>
              </div>

              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div
                    key={opt.label}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition ${
                      opt.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/60 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    {/* Radio Kunci */}
                    <button
                      type="button"
                      onClick={() => handleCorrectOptionSelect(idx)}
                      title={`Tandai Opsi ${opt.label} sebagai KUNCI JAWABAN`}
                      className={`flex items-center justify-center w-8 h-8 rounded-xl font-extrabold text-xs transition cursor-pointer shrink-0 mt-0.5 ${
                        opt.isCorrect
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      {opt.label}
                    </button>

                    {/* Input Opsi */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={opt.contentHtml}
                        onChange={(e) => handleOptionContentChange(idx, e.target.value)}
                        placeholder={`Ketik teks opsi ${opt.label} (misal: 14 cm² atau $\\sqrt{2}$)...`}
                        className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                    </div>

                    {opt.isCorrect && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg shrink-0 self-center">
                        KUNCI
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rubrik / Pedoman Penskoran Esai */}
          {type === 'ESSAY' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Pedoman Penskoran / Kunci Jawaban Esai</span>
              </label>
              <RichMathEditor
                value={answerKey}
                onChange={setAnswerKey}
                placeholder="Tuliskan poin-poin kunci jawaban dan kriteria rubrik penskoran esai..."
                minHeight="100px"
              />
            </div>
          )}

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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : questionToEdit ? 'Simpan Perubahan' : 'Tambahkan Butir Soal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
