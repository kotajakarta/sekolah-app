import React, { useState } from 'react';
import { Student } from '../hooks/useGetStudents';
import { useLepasMassalSiswa } from '../hooks/usePoolStudents';
import { X, Search, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../contexts/ToastContext';

interface LepasSiswaMassalModalProps {
  students: Student[];
  onClose: () => void;
}

export default function LepasSiswaMassalModal({ students, onClose }: LepasSiswaMassalModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusAkhir, setStatusAkhir] = useState('TERSEDIA');
  const [catatan, setCatatan] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Only students with statusPool === 'AKTIF_CABANG' can be released
  const releasableStudents = students.filter(s => s.statusPool === 'AKTIF_CABANG');

  const filteredStudents = releasableStudents.filter(s => {
    const q = searchTerm.toLowerCase();
    return s.biodata?.fullName?.toLowerCase().includes(q) ||
      s.biodata?.nik?.toLowerCase().includes(q) ||
      s.cabang?.name?.toLowerCase().includes(q);
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const lepasMassalMutation = useLepasMassalSiswa();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, currentBatch: 0, totalBatches: 0 });

  const handleLepas = async () => {
    const validSelectedIds = selectedIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validSelectedIds.length === 0) {
      showToast('error', 'Pilih minimal satu siswa untuk dilepas');
      return;
    }

    const BATCH_SIZE = 200;
    const total = validSelectedIds.length;
    const chunks: string[][] = [];
    for (let i = 0; i < total; i += BATCH_SIZE) {
      chunks.push(validSelectedIds.slice(i, i + BATCH_SIZE));
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
        await lepasMassalMutation.mutateAsync({
          studentIds: chunk,
          statusAkhir,
          catatan
        });
        successCount += chunk.length;
      } catch (err) {
        failedCount += chunk.length;
      }
    }

    setIsProcessing(false);

    if (failedCount === 0) {
      showToast('success', `Berhasil melepas ${successCount.toLocaleString()} siswa ke pool.`);
      onClose();
    } else {
      showToast('warning', `Selesai: ${successCount.toLocaleString()} siswa berhasil dilepas, ${failedCount.toLocaleString()} siswa gagal.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={isProcessing ? undefined : onClose} />

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-slate-900">
                  Lepas Siswa Massal ke Pool
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih siswa aktif cabang untuk dikembalikan ke pool atau dikeluarkan.
                </p>
              </div>
              {!isProcessing && (
                <button onClick={onClose} className="text-slate-400 hover:text-slate-500 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {isProcessing ? (
              <div className="my-6 p-6 bg-amber-50 rounded-xl border border-amber-200 space-y-4 text-center">
                <div className="flex justify-between items-center text-sm font-semibold text-amber-900">
                  <span>Memproses Pelepasan Siswa...</span>
                  <span>{Math.round((progress.processed / (progress.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-amber-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.processed / (progress.total || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-amber-700 font-medium">
                  <span>{progress.processed.toLocaleString()} / {progress.total.toLocaleString()} siswa selesai</span>
                  <span>Antrean {progress.currentBatch} dari {progress.totalBatches} (200 / batch)</span>
                </div>
                <p className="text-xs text-amber-600 animate-pulse pt-2 border-t border-amber-200/60">
                  Harap tunggu, sistem sedang melepas siswa secara bertahap...
                </p>
              </div>
            ) : releasableStudents.length === 0 ? (
              <div className="my-6 p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">Tidak Ada Siswa Aktif Cabang</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Semua siswa dalam daftar filter saat ini sudah berada di pool atau status non-aktif.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari santri dalam daftar ini..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                  />
                </div>

                {/* List Container */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {/* Select All Header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                    <span>Pilih Semua ({filteredStudents.length} siswa)</span>
                  </div>

                  {/* Student list */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Tidak ada siswa yang cocok dengan pencarian
                      </div>
                    ) : (
                      filteredStudents.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => handleToggleSelect(s.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{s.biodata?.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">
                              NIK: {s.biodata?.nik || '-'} | Cabang: {s.cabang?.name || '-'}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected count info */}
                <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-lg border border-slate-150 text-slate-600">
                  <span>Terpilih untuk dilepas:</span>
                  <span className="font-bold text-slate-800">{selectedIds.length} Siswa</span>
                </div>

                {/* Status Pelepasan & Catatan */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status Akhir di Pool</label>
                    <select
                      value={statusAkhir}
                      onChange={(e) => setStatusAkhir(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="TERSEDIA">Mutasi (Kembali ke Pool)</option>
                      <option value="MUTASI">Pindah Sekolah</option>
                      <option value="DROP_OUT">Dropout</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Catatan / Alasan Pelepasan</label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={2}
                      className="mt-1.5 block w-full rounded-xl border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                      placeholder="Tuliskan catatan atau alasan pelepasan massal ini..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            {releasableStudents.length > 0 && !isProcessing && (
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleLepas}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Lepas {selectedIds.length} Siswa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
