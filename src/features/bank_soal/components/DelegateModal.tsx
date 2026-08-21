import React, { useState } from 'react';
import { X, UserPlus, Building, Building2, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useHierarchyMetadata, useDelegateAssignment } from '../hooks/useBankSoal';
import type { BankSoalAssignment } from '../types';

interface DelegateModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: BankSoalAssignment;
}

export const DelegateModal: React.FC<DelegateModalProps> = ({ isOpen, onClose, assignment }) => {
  const { user } = useAuth();
  const delegateMutation = useDelegateAssignment();

  const [selectedWilayah, setSelectedWilayah] = useState(assignment.wilayahId || '');
  const [selectedCabang, setSelectedCabang] = useState(assignment.cabangId || '');
  const [selectedTeacher, setSelectedTeacher] = useState(assignment.teacherId || '');
  const [notes, setNotes] = useState(assignment.notes || '');

  const effectiveWilayah = user?.scope === 'WILAYAH' ? user.wilayahId || '' : selectedWilayah;
  const effectiveCabang = user?.scope === 'CABANG' ? user.cabangId || '' : selectedCabang;

  const { data: hierarchyMeta, isLoading } = useHierarchyMetadata(
    effectiveWilayah || undefined,
    effectiveCabang || undefined,
  );

  if (!isOpen) return null;

  const wilayahList = hierarchyMeta?.wilayahList || [];
  const branchList = hierarchyMeta?.branches || [];
  const teacherList = hierarchyMeta?.teachers || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      notes,
    };

    if (user?.scope === 'GLOBAL') {
      payload.wilayahId = selectedWilayah || null;
      payload.cabangId = selectedCabang || null;
      payload.teacherId = selectedTeacher || null;
    } else if (user?.scope === 'WILAYAH') {
      payload.cabangId = selectedCabang || null;
    } else if (user?.scope === 'CABANG') {
      payload.teacherId = selectedTeacher || null;
    }

    try {
      await delegateMutation.mutateAsync({
        id: assignment.id,
        data: payload,
      });
      onClose();
    } catch (err) {
      console.error('Gagal mendelegasikan tugas:', err);
      alert('Gagal memperbarui penugasan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Delegasikan Tugas Pembuatan Soal
              </h2>
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

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Target Info Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
            <div className="font-bold text-slate-900">
              Proyek: {assignment.project?.title}
            </div>
            <div className="text-slate-500 flex items-center gap-3">
              <span>Target: <strong className="text-slate-800">{assignment.targetMcqCount} PG</strong> & <strong className="text-slate-800">{assignment.targetEssayCount} Esai</strong></span>
              {assignment.timeLimit && <span>Waktu: <strong className="text-slate-800">{assignment.timeLimit} Menit</strong></span>}
            </div>
          </div>

          {/* 1. Wilayah Selector (Jika Admin Global) */}
          {user?.scope === 'GLOBAL' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Pilih Wilayah</span>
              </label>
              <select
                value={selectedWilayah}
                onChange={(e) => {
                  setSelectedWilayah(e.target.value);
                  setSelectedCabang('');
                  setSelectedTeacher('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Pilih Wilayah --</option>
                {wilayahList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Cabang Selector (Jika Global atau Wilayah) */}
          {(user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Pilih Cabang Pelaksana</span>
              </label>
              <select
                value={selectedCabang}
                onChange={(e) => {
                  setSelectedCabang(e.target.value);
                  setSelectedTeacher('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Pilih Cabang --</option>
                {branchList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Guru Selector (Jika Cabang atau Global) */}
          {(user?.scope === 'CABANG' || user?.scope === 'GLOBAL') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Tugaskan ke Guru / Ustadz</span>
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Pilih Guru Pengampu --</option>
                {teacherList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.operatorName || t.username} ({t.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Catatan / Catatan Instruksi Khusus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Catatan / Instruksi Khusus
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan untuk pelaksana..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
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
              disabled={delegateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{delegateMutation.isPending ? 'Menyimpan...' : 'Simpan Delegasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
