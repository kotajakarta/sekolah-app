import React, { useState } from 'react';
import { useGetPoolStudents, useTarikMassalSiswa } from '../hooks/usePoolStudents';
import { useAuth } from '../../../hooks/useAuth';
import { useGetCabang } from '../hooks/useMasterData';
import { X, Loader2, Search } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

interface TarikSiswaMassalModalProps {
  onClose: () => void;
}

export default function TarikSiswaMassalModal({ onClose }: TarikSiswaMassalModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const isCabangUser = user?.scope === 'CABANG';
  const [selectedCabangId, setSelectedCabangId] = useState(isCabangUser ? (user.cabangId || '') : '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: poolStudents, isLoading: isLoadingPool } = useGetPoolStudents(searchQuery);
  const { data: cabangList, isLoading: loadingCabang } = useGetCabang();
  
  const tarikMassalMutation = useTarikMassalSiswa();

  const filteredCabang = cabangList?.filter(c => {
    if (user?.scope === 'WILAYAH') return c.wilayahId === user.wilayahId;
    return true;
  }) || [];

  const filteredStudents = poolStudents?.filter(student => {
    const fullName = student.biodata?.fullName || '';
    const nik = student.biodata?.nik || '';
    const q = searchQuery.toLowerCase();
    return fullName.toLowerCase().includes(q) || nik.toLowerCase().includes(q);
  }) || [];

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (filteredStudents.length === selectedStudentIds.length) {
      setSelectedStudentIds([]); // Deselect all
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, currentBatch: 0, totalBatches: 0 });

  const handleTarik = async () => {
    if (!selectedCabangId) {
      showToast('error', 'Pilih cabang tujuan terlebih dahulu');
      return;
    }
    const validStudentIds = selectedStudentIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validStudentIds.length === 0) {
      showToast('error', 'Pilih setidaknya satu siswa');
      return;
    }
    
    const BATCH_SIZE = 200;
    const total = validStudentIds.length;
    const chunks: string[][] = [];
    for (let i = 0; i < total; i += BATCH_SIZE) {
      chunks.push(validStudentIds.slice(i, i + BATCH_SIZE));
    }

    setIsProcessing(true);
    setProgress({ processed: 0, total, currentBatch: 1, totalBatches: chunks.length });

    let successCount = 0;
    let failedCount = 0;

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      setProgress({
        processed: successCount,
        total,
        currentBatch: index + 1,
        totalBatches: chunks.length
      });

      try {
        await tarikMassalMutation.mutateAsync({
          studentIds: chunk,
          cabangId: selectedCabangId
        });
        successCount += chunk.length;
      } catch (err) {
        failedCount += chunk.length;
      }
    }

    setIsProcessing(false);

    if (failedCount === 0) {
      showToast('success', `Berhasil memproses penarikan ${successCount.toLocaleString()} siswa.`);
      onClose();
    } else {
      showToast('warning', `Selesai: ${successCount.toLocaleString()} siswa berhasil diproses, ${failedCount.toLocaleString()} gagal.`);
      onClose();
    }
  };

  const selectedStudentsData = poolStudents?.filter(s => selectedStudentIds.includes(s.id)) || [];
  const activeCount = selectedStudentsData.filter(s => s.statusPool === 'AKTIF_CABANG').length;
  const availableCount = selectedStudentsData.filter(s => s.statusPool === 'TERSEDIA').length;

  let buttonText = `Tarik ${selectedStudentIds.length} Siswa`;
  let buttonColor = 'bg-blue-600 hover:bg-blue-500';
  
  if (selectedStudentIds.length > 0) {
    if (activeCount > 0 && availableCount === 0) {
      buttonText = `Minta ke Pusat (${selectedStudentIds.length} Siswa)`;
      buttonColor = 'bg-amber-600 hover:bg-amber-500';
    } else if (activeCount > 0 && availableCount > 0) {
      buttonText = `Proses Tarik & Minta (${selectedStudentIds.length} Siswa)`;
      buttonColor = 'bg-indigo-600 hover:bg-indigo-500';
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl flex flex-col max-h-[85vh]">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Tarik Data Siswa
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isCabangUser && (
                <div>
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
                <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm flex items-center">
                  Siswa akan ditarik ke cabang Anda saat ini.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Cari Siswa</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                    placeholder="Nama siswa..."
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {isProcessing ? (
              <div className="my-6 p-6 bg-blue-50 rounded-xl border border-blue-200 space-y-4 text-center">
                <div className="flex justify-between items-center text-sm font-semibold text-blue-900">
                  <span>Memproses Penarikan Siswa...</span>
                  <span>{Math.round((progress.processed / (progress.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.processed / (progress.total || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-blue-700 font-medium">
                  <span>{progress.processed.toLocaleString()} / {progress.total.toLocaleString()} siswa selesai</span>
                  <span>Antrean {progress.currentBatch} dari {progress.totalBatches} (200 / batch)</span>
                </div>
                <p className="text-xs text-blue-600 animate-pulse pt-2 border-t border-blue-200/60">
                  Harap tunggu, sistem sedang memproses penarikan secara bertahap...
                </p>
              </div>
            ) : isLoadingPool ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Tidak ada siswa yang ditemukan.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                          onChange={selectAll}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah Asal</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi / Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.biodata?.fullName}</div>
                          <div className="text-xs text-gray-500">NIK: {student.biodata?.nik || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.wilayah?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.statusPool === 'AKTIF_CABANG' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              Di Cabang: {student.cabang?.name || '-'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Pool (Tersedia)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
            {!isProcessing && (
              <button
                type="button"
                disabled={!selectedCabangId || selectedStudentIds.length === 0}
                onClick={handleTarik}
                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50 ${buttonColor}`}
              >
                {buttonText}
              </button>
            )}
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
