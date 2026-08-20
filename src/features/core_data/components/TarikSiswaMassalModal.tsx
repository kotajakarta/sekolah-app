import React, { useState, useEffect } from 'react';
import { useGetPoolStudents, useTarikMassalSiswa } from '../hooks/usePoolStudents';
import { useAuth } from '../../../hooks/useAuth';
import { useGetCabang } from '../hooks/useMasterData';
import { X, Loader2, Search, AlertCircle, Clock, UserCheck, CheckCircle2 } from 'lucide-react';
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
  
  // Search input state and 2-second debounced state
  const [inputSearch, setInputSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (!inputSearch.trim()) {
      setDebouncedSearch('');
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(inputSearch.trim());
      setIsDebouncing(false);
    }, 2000); // 2 detik jeda ketik

    return () => {
      clearTimeout(timer);
    };
  }, [inputSearch]);

  const isSearchActive = debouncedSearch.length >= 1;
  const { data: poolStudents = [], isLoading: isLoadingPool, isFetching } = useGetPoolStudents(
    debouncedSearch,
    { enabled: isSearchActive }
  );
  const { data: cabangList, isLoading: loadingCabang } = useGetCabang();
  
  const tarikMassalMutation = useTarikMassalSiswa();

  const filteredCabang = cabangList?.filter(c => {
    if (user?.scope === 'WILAYAH') return c.wilayahId === user.wilayahId;
    return true;
  }) || [];

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (poolStudents.length === selectedStudentIds.length) {
      setSelectedStudentIds([]); // Deselect all
    } else {
      setSelectedStudentIds(poolStudents.map(s => s.id));
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
  let buttonColor = 'bg-indigo-600 hover:bg-indigo-700';
  
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

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-5xl flex flex-col max-h-[88vh] border border-slate-200">
          <div className="bg-white px-5 py-4 sm:p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Tarik Data Siswa ke Cabang
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cari siswa di database pusat/pool dan tarik ke penempatan cabang yang dipilih.
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isCabangUser ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Cabang Tujuan <span className="text-rose-500">*</span>
                  </label>
                  {loadingCabang ? (
                    <div className="flex items-center text-xs text-slate-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2 text-indigo-600" />
                      Memuat daftar cabang...
                    </div>
                  ) : (
                    <select
                      value={selectedCabangId}
                      onChange={(e) => setSelectedCabangId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all cursor-pointer"
                    >
                      <option value="">-- Pilih Cabang Tujuan --</option>
                      {filteredCabang.map((cabang) => (
                        <option key={cabang.id} value={cabang.id}>
                          {cabang.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 text-indigo-900 rounded-xl text-xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold">Cabang Penempatan</p>
                    <p className="text-[11px] text-indigo-700">Siswa yang ditarik akan langsung dialokasikan ke cabang Anda saat ini.</p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Cari Santri (Nama / NIK / NISN)
                  </label>
                  {isDebouncing && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                      <Clock className="w-3 h-3" /> Menunggu 2 detik...
                    </span>
                  )}
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={inputSearch}
                    onChange={(e) => setInputSearch(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="Ketik nama, NIK, atau NISN santri..."
                  />
                  {inputSearch && (
                    <button
                      type="button"
                      onClick={() => setInputSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 min-h-[260px]">
            {isProcessing ? (
              <div className="my-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-4 text-center">
                <div className="flex justify-between items-center text-sm font-semibold text-indigo-900">
                  <span>Memproses Penarikan Siswa...</span>
                  <span>{Math.round((progress.processed / (progress.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.processed / (progress.total || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-indigo-700 font-medium">
                  <span>{progress.processed.toLocaleString()} / {progress.total.toLocaleString()} siswa selesai</span>
                  <span>Antrean {progress.currentBatch} dari {progress.totalBatches} (200 / batch)</span>
                </div>
                <p className="text-xs text-indigo-600 animate-pulse pt-2 border-t border-indigo-200/60">
                  Harap tunggu, sistem sedang memproses penarikan secara bertahap...
                </p>
              </div>
            ) : !isSearchActive ? (
              <div className="text-center py-16 text-slate-500 space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                  <Search className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Cari Data Santri</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Data santri hanya akan dimuat setelah Anda mengetik pencarian. Sistem akan memproses pencarian secara otomatis setelah Anda berhenti mengetik selama <strong>2 detik</strong>.
                </p>
              </div>
            ) : isLoadingPool || isFetching ? (
              <div className="flex flex-col justify-center items-center py-16 space-y-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-semibold text-slate-600">Mencari santri dengan kata kunci "{debouncedSearch}"...</p>
              </div>
            ) : poolStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Tidak Ada Santri Ditemukan</h4>
                <p className="text-xs text-slate-500">
                  Tidak ditemukan santri di pool dengan kata kunci <strong>"{debouncedSearch}"</strong>.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-800">
                    Hasil Pencarian ({poolStudents.length} Santri)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {selectedStudentIds.length} dipilih
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider w-10">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={poolStudents.length > 0 && selectedStudentIds.length === poolStudents.length}
                            onChange={selectAll}
                          />
                        </th>
                        <th scope="col" className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Nama & NIK</th>
                        <th scope="col" className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Wilayah Asal</th>
                        <th scope="col" className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider">Lokasi / Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {poolStudents.map((student) => {
                        const isSelected = selectedStudentIds.includes(student.id);
                        return (
                          <tr 
                            key={student.id} 
                            onClick={() => toggleStudentSelection(student.id)}
                            className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                              isSelected ? 'bg-indigo-50/60' : ''
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={isSelected}
                                onChange={() => toggleStudentSelection(student.id)}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{student.biodata?.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">NIK: {student.biodata?.nik || '-'} {student.biodata?.nisn ? `| NISN: ${student.biodata.nisn}` : ''}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                              {student.wilayah?.name || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {student.statusPool === 'AKTIF_CABANG' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Di Cabang: {student.cabang?.name || '-'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Pool (Tersedia)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white px-5 py-3.5 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-200 gap-2">
            {!isProcessing && (
              <button
                type="button"
                disabled={!selectedCabangId || selectedStudentIds.length === 0}
                onClick={handleTarik}
                className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${buttonColor}`}
              >
                {buttonText}
              </button>
            )}
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="mt-2 sm:mt-0 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50 sm:w-auto disabled:opacity-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
