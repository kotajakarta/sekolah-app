import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { Student } from '../hooks/useGetStudents';
import { useGetRiwayatKelas, useDeleteRiwayatKelas, RiwayatKelasFormal } from '../hooks/useRiwayatKelas';
import FormRiwayatKelasModal from './FormRiwayatKelasModal';
import ConfirmModal from '../../../components/ConfirmModal';
import { useToast } from '../../../contexts/ToastContext';

interface StudentClassHistoryModalProps {
  student: Student;
  onClose: () => void;
}

export default function StudentClassHistoryModal({ student, onClose }: StudentClassHistoryModalProps) {
  const { data: histories, isLoading } = useGetRiwayatKelas(student.id);
  const { showToast } = useToast();
  const deleteMutation = useDeleteRiwayatKelas();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<RiwayatKelasFormal | undefined>();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [historyIdToDelete, setHistoryIdToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setHistoryIdToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!historyIdToDelete) return;
    deleteMutation.mutate({ id: historyIdToDelete, studentId: student.id });
    setHistoryIdToDelete(null);
  };

  const openForm = (history?: RiwayatKelasFormal) => {
    setSelectedHistory(history);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Riwayat Kelas Formal
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {student.biodata?.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => openForm()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Riwayat
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">Memuat data riwayat kelas...</p>
              </div>
            ) : histories?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-sm text-slate-500">Belum ada riwayat kelas formal untuk siswa ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {histories?.map((riwayat) => (
                  <div key={riwayat.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-slate-900">{riwayat.kelas?.name || 'Kelas Tidak Diketahui'}</h4>
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {riwayat.semester} {riwayat.tahunAjaran}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Wali Kelas:</span> {riwayat.waliKelas?.name || '-'}
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Status Akhir:</span> {riwayat.statusAkhir || '-'}
                          </p>
                          {riwayat.catatan && (
                            <p className="text-sm text-slate-500 italic mt-2">
                              "{riwayat.catatan}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openForm(riwayat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(riwayat.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <FormRiwayatKelasModal
          studentId={student.id}
          initialData={selectedHistory}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => { setIsConfirmDeleteOpen(false); setHistoryIdToDelete(null); }}
        onConfirm={confirmDelete}
        title="Hapus Riwayat Kelas"
        message="Apakah Anda yakin ingin menghapus riwayat kelas ini?"
      />
    </>
  );
}
