import React, { useState } from 'react';
import { Student } from '../hooks/useGetStudents';
import { useLepasSiswa } from '../hooks/usePoolStudents';
import { X } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

interface LepasSiswaModalProps {
  student: Student;
  onClose: () => void;
}

export default function LepasSiswaModal({ student, onClose }: LepasSiswaModalProps) {
  const [statusAkhir, setStatusAkhir] = useState('TERSEDIA');
  const [catatan, setCatatan] = useState('');
  const { showToast } = useToast();

  const lepasSiswaMutation = useLepasSiswa();

  const handleLepas = () => {
    lepasSiswaMutation.mutate({
      studentId: student.id,
      statusAkhir,
      catatan
    }, {
      onSuccess: () => {
        showToast('success', 'Berhasil melepas siswa');
        onClose();
      },
      onError: (error: any) => {
        showToast('error', error.response?.data?.message || 'Gagal melepas siswa');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Lepas Siswa ke Pool
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Siswa <span className="font-medium text-gray-900">{student.biodata?.fullName}</span> akan dilepas ke pool.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status Akhir di Pool</label>
                <select
                  value={statusAkhir}
                  onChange={(e) => setStatusAkhir(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                >
                  <option value="TERSEDIA">Mutasi (Kembali ke Pool)</option>
                  <option value="MUTASI">Pindah Sekolah</option>
                  <option value="DROP_OUT">Dropout</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan / Alasan</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  placeholder="Opsional, tuliskan alasan atau catatan pelepasan."
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={lepasSiswaMutation.isPending}
              onClick={handleLepas}
              className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 sm:ml-3 sm:w-auto disabled:opacity-50"
            >
              {lepasSiswaMutation.isPending ? 'Memproses...' : 'Lepas Siswa'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
