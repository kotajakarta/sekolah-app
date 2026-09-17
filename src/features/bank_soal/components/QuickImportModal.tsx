import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, FileText, HelpCircle, Check, Loader2 } from 'lucide-react';
import { useCreateBatchQuestions } from '../hooks/useBankSoal';
import type { QuestionType } from '../types';

interface QuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  nextIndex?: number;
}

interface ParsedOption {
  label: string;
  contentHtml: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface ParsedQuestion {
  type: QuestionType;
  contentHtml: string;
  answerKey?: string | null;
  weight: number;
  options: ParsedOption[];
}

export const QuickImportModal: React.FC<QuickImportModalProps> = ({
  isOpen,
  onClose,
  bankId,
  nextIndex = 1,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [isProcessing, setIsProcessing] = useState(false);

  const batchMutation = useCreateBatchQuestions();

  if (!isOpen) return null;

  // Fungsi parser teks soal
  const parseQuestionsFromText = (text: string): ParsedQuestion[] => {
    if (!text.trim()) return [];

    // Pisahkan teks per butir soal (misal berdasarkan "1. ", "2. ", atau baris kosong ganda)
    // Pola regex pemisah: baris baru diikuti angka dan tanda titik/kurung, misal "\n1. " atau "\n1) "
    const lines = text.split('\n');
    const blocks: string[] = [];
    let currentBlock: string[] = [];

    const isQuestionStart = (line: string) => {
      const trimmed = line.trim();
      return /^\d+[\.\)]\s+/.test(trimmed);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isQuestionStart(line)) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n').trim());
          currentBlock = [];
        }
      }
      currentBlock.push(line);
    }
    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n').trim());
    }

    // Jika tidak terdeteksi pola angka, coba pisah per double newline (\n\n+)
    const finalBlocks = blocks.length > 0 ? blocks : text.split(/\n\s*\n+/).filter((b) => b.trim());

    const results: ParsedQuestion[] = [];

    for (const block of finalBlocks) {
      const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (blockLines.length === 0) continue;

      let questionContent = '';
      const options: ParsedOption[] = [];
      let detectedKey = '';
      let isReadingQuestion = true;

      // Bersihkan awalan angka (misal "1. ")
      const firstLineClean = blockLines[0].replace(/^\d+[\.\)]\s*/, '');
      const questionParts = [firstLineClean];

      for (let i = 1; i < blockLines.length; i++) {
        const line = blockLines[i];

        // Cek baris Kunci Jawaban (misal: "Kunci: A" atau "Jawaban: B" atau "Key: C")
        const keyMatch = line.match(/^(?:kunci|jawaban|key|ans)\s*(?:jawaban)?\s*[:=]\s*([A-Ea-e])/i);
        const essayKeyMatch = line.match(/^(?:kunci|jawaban|rubrik|penskoran)\s*[:=]\s*(.+)/i);

        if (keyMatch) {
          detectedKey = keyMatch[1].toUpperCase();
          isReadingQuestion = false;
          continue;
        } else if (essayKeyMatch && options.length === 0) {
          detectedKey = essayKeyMatch[1].trim();
          isReadingQuestion = false;
          continue;
        }

        // Cek opsi PG (misal: "A. Pilihan" atau "A) Pilihan")
        const optMatch = line.match(/^([A-Ea-e])[\.\)]\s*(.+)/);
        if (optMatch) {
          isReadingQuestion = false;
          const label = optMatch[1].toUpperCase();
          const optContent = optMatch[2].trim();
          options.push({
            label,
            contentHtml: optContent,
            isCorrect: false, // akan diset sesuai detectedKey
            orderIndex: options.length,
          });
          continue;
        }

        if (isReadingQuestion) {
          questionParts.push(line);
        } else if (options.length > 0) {
          // Lanjutan opsi terakhir jika multiline
          options[options.length - 1].contentHtml += ` ${line}`;
        }
      }

      questionContent = questionParts.join(' ').trim();
      if (!questionContent) continue;

      // Jika ada opsi jawaban (PG)
      if (options.length >= 2) {
        // Tentukan correct answer
        if (detectedKey) {
          options.forEach((opt) => {
            opt.isCorrect = opt.label === detectedKey;
          });
        } else {
          // Default opsi A benar jika tidak dicantumkan kunci
          options[0].isCorrect = true;
        }

        const qType: QuestionType = options.length >= 5 ? 'MCQ_5' : 'MCQ_4';
        results.push({
          type: qType,
          contentHtml: questionContent,
          answerKey: null,
          weight: 1,
          options,
        });
      } else {
        // Esai / Uraian
        results.push({
          type: 'ESSAY',
          contentHtml: questionContent,
          answerKey: detectedKey || null,
          weight: 2,
          options: [],
        });
      }
    }

    return results;
  };

  const handleProcessText = () => {
    setIsProcessing(true);
    try {
      const parsed = parseQuestionsFromText(rawText);
      setParsedQuestions(parsed);
      setStep('preview');
    } catch (err) {
      alert('Terjadi kesalahan saat memproses format naskah soal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;

    try {
      await batchMutation.mutateAsync({
        bankId,
        questions: parsedQuestions,
      });
      onClose();
    } catch (err) {
      console.error('Gagal mengimpor soal:', err);
      alert('Gagal mengimpor butir soal');
    }
  };

  const mcqCount = parsedQuestions.filter((q) => q.type.startsWith('MCQ')).length;
  const essayCount = parsedQuestions.filter((q) => q.type === 'ESSAY').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Impor & Tempel Teks Soal Cepat (Quick Batch Import)
              </h2>
              <p className="text-xs text-slate-500">
                Salin draft naskah soal dari Word atau Notepad dan sistem otomatis mendeteksi butir & kunci jawaban
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 'input' ? (
            <div className="space-y-4">
              {/* Petunjuk Format */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs space-y-2 text-indigo-950">
                <span className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-indigo-800">
                  <HelpCircle className="w-4 h-4" /> Contoh Format Teks yang Didukung:
                </span>
                <pre className="bg-white/80 p-3 rounded-xl border border-indigo-200 text-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto">
{`1. Siapakah penemu bola lampu listrik?
A. Thomas Alva Edison
B. Nikola Tesla
C. Alexander Graham Bell
D. Albert Einstein
Kunci: A

2. Sebutkan ibu kota negara Indonesia saat ini!
Kunci: DKI Jakarta`}
                </pre>
                <p className="text-[11px] text-indigo-900 leading-normal">
                  Sistem otomatis mendeteksi nomor soal (1., 2., dst), opsi (A., B., C., D., E.), serta kunci jawaban (Kunci: A).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Tempelkan Naskah Soal Anda di Bawah:
                </label>
                <textarea
                  rows={14}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Tempel teks soal di sini..."
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ringkasan Hasil Parsing */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    Berhasil Mendeteksi {parsedQuestions.length} Butir Soal
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {mcqCount} Pilihan Ganda, {essayCount} Soal Esai/Uraian
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100/50 transition cursor-pointer"
                >
                  Ubah Teks Input
                </button>
              </div>

              {/* Daftar Pratinjau Soal */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-slate-200/80 rounded-2xl text-xs space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                        #{nextIndex + idx} ({q.type})
                      </span>
                      {q.type !== 'ESSAY' && (
                        <span className="text-slate-500 font-medium">
                          Kunci:{' '}
                          <strong className="text-emerald-700 font-bold">
                            {q.options.find((o) => o.isCorrect)?.label || '-'}
                          </strong>
                        </span>
                      )}
                    </div>

                    <p className="text-slate-900 font-semibold">{q.contentHtml}</p>

                    {q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt) => (
                          <div
                            key={opt.label}
                            className={`p-2 rounded-xl border flex items-center gap-2 ${
                              opt.isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="truncate">{opt.contentHtml}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'ESSAY' && q.answerKey && (
                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                        <span className="font-bold block mb-0.5">Kunci/Rubrik Esai:</span>
                        {q.answerKey}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>

          {step === 'input' ? (
            <button
              type="button"
              disabled={!rawText.trim() || isProcessing}
              onClick={handleProcessText}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses Teks...' : 'Pratinjau Hasil Parsing'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={batchMutation.isPending || parsedQuestions.length === 0}
              onClick={handleImport}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {batchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {batchMutation.isPending
                  ? 'Mengimpor...'
                  : `Impor Semua (${parsedQuestions.length} Butir)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
