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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Ekspor Naskah Soal (.docx)</h2>
              <p className="text-xs text-slate-500">
                Unduh file Microsoft Word siap cetak
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

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="font-bold text-sm text-slate-900 line-clamp-1">
              {bank.title}
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Mapel: <strong className="text-slate-800">{bank.subject}</strong></span>
              <span>Kelas: <strong className="text-slate-800">{bank.gradeLevel}</strong></span>
              <span>Waktu: <strong className="text-slate-800">{bank.timeLimit ? `${bank.timeLimit} Menit` : 'Sesuai Jadwal'}</strong></span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-4 text-xs font-semibold">
              <span className="text-indigo-600 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{questions.length} Total Soal</span>
              </span>
              <span className="text-slate-600">
                {mcqCount} Pilihan Ganda
              </span>
              <span className="text-slate-600">
                {essayCount} Esai
              </span>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pilihan Format Dokumen
            </div>

            <div
              onClick={() => setIncludeKey(false)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                !includeKey
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="export_type"
                checked={!includeKey}
                onChange={() => setIncludeKey(false)}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Naskah Soal Saja (Siap Ujian / Cetak)
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Hanya memuat kop, petunjuk pengerjaan, soal pilihan ganda, dan esai dengan kolom jawaban.
                </div>
              </div>
            </div>

            <div
              onClick={() => setIncludeKey(true)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                includeKey
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="export_type"
                checked={includeKey}
                onChange={() => setIncludeKey(true)}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Naskah Soal + Kunci Jawaban & Rubrik</span>
                  <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Lengkap
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Memuat tanda kunci pada setiap opsi pilihan ganda, rubrik penskoran esai, dan lembar tabel kunci di akhir halaman.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || questions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExporting ? 'Memproses Word...' : 'Download File Word (.docx)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
