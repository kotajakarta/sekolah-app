import React, { useState } from 'react';
import { Student } from '../hooks/useGetStudents';
import { useTarikSiswa } from '../hooks/usePoolStudents';
import { useGetCabang } from '../hooks/useMasterData';
import { useAuth } from '../../../hooks/useAuth';
import { X, Loader2 } from 'lucide-react';

interface TarikSiswaModalProps {
  student: Student;
  onClose: () => void;
}

export default function TarikSiswaModal({ student, onClose }: TarikSiswaModalProps) {
  const { user } = useAuth();
  const { data: cabangList, isLoading: loadingCabang } = useGetCabang();
  const tarikSiswaMutation = useTarikSiswa();
  
  // If user is CABANG, use their cabangId, else allow selection
  const isCabangUser = user?.scope === 'CABANG';
  const [selectedCabangId, setSelectedCabangId] = useState(isCabangUser ? (user.cabangId || '') : '');

  // Filter cabang list based on user's wilayah if they are WILAYAH scope
  const filteredCabang = cabangList?.filter(c => {
    if (user?.scope === 'WILAYAH') return c.wilayahId === user.wilayahId;
    return true; // GLOBAL sees all
  }) || [];

  const handleTarik = () => {
    if (!selectedCabangId) {
      alert('Pilih cabang tujuan terlebih dahulu');
      return;
    }
    
    tarikSiswaMutation.mutate({ 
      studentId: student.id, 
      cabangId: selectedCabangId 
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Tarik Siswa ke Cabang
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Anda akan menarik siswa <span className="font-medium text-gray-900">{student.biodata?.fullName}</span> dari pool.
              </p>
            </div>

            {!isCabangUser && (
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700">Cabang Tujuan</label>
                {loadingCabang ? (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Memuat daftar cabang...
                  </div>
                ) : (
                  <select
                    value={selectedCabangId}
                    onChange={(e) => setSelectedCabangId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {filteredCabang.map((cabang) => (
                      <option key={cabang.id} value={cabang.id}>
                        {cabang.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            {isCabangUser && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                Siswa akan ditarik ke cabang Anda saat ini.
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={!selectedCabangId || tarikSiswaMutation.isPending}
              onClick={handleTarik}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
            >
              {tarikSiswaMutation.isPending ? 'Memproses...' : 'Tarik Siswa'}
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
