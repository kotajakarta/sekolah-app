import React, { useState } from 'react';
import { X, FileDown, CheckCircle2, FileText, CheckSquare, Sparkles } from 'lucide-react';
import { downloadBankSoalDocx } from '../hooks/useBankSoal';
import type { QuestionBank } from '../types';

interface DocxExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: QuestionBank;
}

export const DocxExportModal: React.FC<DocxExportModalProps> = ({ isOpen, onClose, bank }) => {
  const [includeKey, setIncludeKey] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const questions = bank.questions || [];
  const mcqCount = questions.filter((q) => q.type.startsWith('MCQ') || q.type === 'TRUE_FALSE').length;
  const essayCount = questions.filter((q) => q.type === 'ESSAY').length;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadBankSoalDocx(bank.id, bank.title, includeKey);
      onClose();
    } catch (err) {
      console.error('Gagal mengekspor file Word:', err);
      alert('Terjadi kesalahan saat mengunduh file DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ekspor Naskah Soal (.docx)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unduh file Microsoft Word siap cetak
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

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
              {bank.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Mapel: <strong>{bank.subject}</strong></span>
              <span>Kelas: <strong>{bank.gradeLevel}</strong></span>
              <span>Waktu: <strong>{bank.timeLimit ? `${bank.timeLimit} Menit` : 'Sesuai Jadwal'}</strong></span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-4 text-xs font-medium">
              <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{questions.length} Total Soal</span>
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {mcqCount} Pilihan Ganda
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {essayCount} Esai
              </span>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pilihan Format Dokumen
            </div>

            <div
              onClick={() => setIncludeKey(false)}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                !includeKey
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="export_type"
                checked={!includeKey}
                onChange={() => setIncludeKey(false)}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Naskah Soal Saja (Siap Ujian / Cetak)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hanya memuat kop, petunjuk pengerjaan, soal pilihan ganda, dan esai dengan kolom jawaban.
                </div>
              </div>
            </div>

            <div
              onClick={() => setIncludeKey(true)}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                includeKey
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="export_type"
                checked={includeKey}
                onChange={() => setIncludeKey(true)}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Naskah Soal + Kunci Jawaban & Rubrik</span>
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                    Lengkap
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Memuat tanda kunci pada setiap opsi pilihan ganda, rubrik penskoran esai, dan lembar tabel kunci di akhir halaman.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || questions.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExporting ? 'Memproses Word...' : 'Download File Word (.docx)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
