import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReviewAssignment } from '../hooks/useBankSoal';
import type { BankSoalAssignment } from '../types';

interface ReviewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: BankSoalAssignment | null;
}

export const ReviewAssignmentModal: React.FC<ReviewAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
}) => {
  const navigate = useNavigate();
  const reviewMutation = useReviewAssignment();
  const [notes, setNotes] = useState('');

  if (!isOpen || !assignment) return null;

  const handleReview = async (action: 'APPROVE' | 'REVISE') => {
    if (action === 'REVISE' && !notes.trim()) {
      alert('Mohon masukkan catatan revisi agar guru mengetahui bagian mana yang perlu diperbaiki.');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: assignment.id,
        action,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Gagal memproses review naskah:', err);
      alert('Terjadi kesalahan saat memproses review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Review & Verifikasi Naskah Soal</h2>
              <p className="text-xs text-slate-500">
                {assignment.subjectName} ({assignment.gradeLevel})
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
        <div className="p-6 space-y-4">
          {/* Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Guru Penyusun:</span>
              <strong className="text-slate-900">
                {assignment.teacher?.operatorName || assignment.teacher?.username || 'Guru'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Cabang Pelaksana:</span>
              <strong className="text-slate-900">{assignment.cabang?.name || '-'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Butir Soal:</span>
              <span className="font-bold text-slate-800">
                {assignment.targetMcqCount} PG & {assignment.targetEssayCount} Esai
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-slate-500">Naskah Dikerjakan:</span>
              <span className="font-bold text-indigo-700">
                {assignment.questionBank?._count?.questions || 0} Butir Soal
              </span>
            </div>
          </div>

          {/* Quick Preview Button */}
          {assignment.questionBankId && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/dashboard/bank-soal/${assignment.questionBankId}`);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka & Periksa Seluruh Butir Naskah Soal</span>
            </button>
          )}

          {/* Review Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Catatan Koreksi / Feedback (Opsional jika disetujui, Wajib jika minta revisi)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mohon perbaiki butir nomor 12 dan kunci jawaban nomor 5..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={reviewMutation.isPending}
              onClick={() => handleReview('REVISE')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-2xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Minta Revisi</span>
            </button>

            <button
              type="button"
              disabled={reviewMutation.isPending}
              onClick={() => handleReview('APPROVE')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {reviewMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Setujui Naskah</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
