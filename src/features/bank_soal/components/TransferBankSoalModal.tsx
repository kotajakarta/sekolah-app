import React, { useState } from 'react';
import { X, FolderInput, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useBankSoalProjects, useTransferBankSoalProject } from '../hooks/useBankSoal';
import type { QuestionBank } from '../types';

interface TransferBankSoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: QuestionBank | null;
  onSuccess?: () => void;
}

export const TransferBankSoalModal: React.FC<TransferBankSoalModalProps> = ({
  isOpen,
  onClose,
  bank,
  onSuccess,
}) => {
  const { data: projects = [], isLoading: isLoadingProjects } = useBankSoalProjects();
  const transferMutation = useTransferBankSoalProject();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !bank) return null;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const assignments = selectedProject?.assignments || [];

  const handleTransfer = async () => {
    if (!selectedProjectId) {
      setErrorMsg('Pilih proyek tujuan terlebih dahulu.');
      return;
    }

    try {
      setErrorMsg('');
      await transferMutation.mutateAsync({
        bankId: bank.id,
        targetProjectId: selectedProjectId,
        targetAssignmentId: selectedAssignmentId || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal memindahkan bank soal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pindahkan ke Proyek Lain</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Tautkan naskah soal ini ke proyek penugasan aktif
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Soal */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
            <span className="font-bold text-slate-700">Bank Soal Terpilih:</span>
            <p className="font-bold text-indigo-700">{bank.title}</p>
            <p className="text-slate-500 text-[11px]">
              {bank.subject} • {bank.gradeLevel} ({bank._count?.questions || 0} Butir Soal)
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Proyek Tujuan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Proyek Target *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedAssignmentId('');
              }}
              disabled={isLoadingProjects}
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">-- Pilih Proyek Penugasan --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title} ({proj.academicYear || '-'} • {proj.semester || '-'})
                </option>
              ))}
            </select>
          </div>

          {/* Slot Penugasan di Dalam Proyek (Opsional) */}
          {selectedProjectId && assignments.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tautkan ke Slot Penugasan Tertentu (Opsional)
              </label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Buat Penugasan Baru di Proyek Tersebut --</option>
                {assignments.map((ass) => (
                  <option key={ass.id} value={ass.id}>
                    {ass.subjectName} ({ass.gradeLevel}) - {ass.cabang?.name || 'Cabang Belum Ditentukan'}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Jika tidak memilih slot, sistem akan otomatis membuat baris penugasan baru di dalam proyek tersebut.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={transferMutation.isPending || !selectedProjectId}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {transferMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Pindahkan Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
