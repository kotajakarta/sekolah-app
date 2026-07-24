import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Users, AlertTriangle, Filter } from 'lucide-react';
import { useKenaikanKelasMassal } from '../../features/core_data/hooks/useRiwayatKelas';
import apiClient from '../../lib/apiClient';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { useGetWilayah, useGetCabang } from '../../features/core_data/hooks/useMasterData';

interface Kelas {
  id: string;
  name: string;
  tingkat?: string;
  cabangId?: string;
  cabang?: { id?: string; name: string; wilayahId?: string; wilayah?: { id?: string; name: string } };
}

interface KenaikanKelasModalProps {
  kelasList: Kelas[];
  onClose: () => void;
}

export default function KenaikanKelasModal({ kelasList, onClose }: KenaikanKelasModalProps) {
  const mutation = useKenaikanKelasMassal();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const { data: wilayahs = [] } = useGetWilayah();
  const { data: cabangs = [] } = useGetCabang();

  const currentYear = new Date().getFullYear();
  const tahunAjaranOptions = Array.from({ length: 11 }, (_, i) => {
    const startYear = currentYear - 5 + i;
    return `${startYear}/${startYear + 1}`;
  });

  const [asalWilayahId, setAsalWilayahId] = useState(user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user?.wilayahId || '' : '');
  const [asalCabangId, setAsalCabangId] = useState(user?.scope === 'CABANG' ? user?.cabangId || '' : '');

  const [formData, setFormData] = useState({
    kelasAsalId: '',
    tahunAjaranLama: tahunAjaranOptions[5],
    semesterLama: 'GENAP',
    tahunAjaranBaru: tahunAjaranOptions[6],
    semesterBaru: 'GANJIL',
  });

  const [students, setStudents] = useState<any[]>([]);
  const [studentSettings, setStudentSettings] = useState<Record<string, { statusAkhir: string }>>({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  // Bulk settings
  const [bulkStatus, setBulkStatus] = useState('NAIK_TINGKAT');

  const filteredCabangsAsal = asalWilayahId ? cabangs.filter((c: any) => c.wilayahId === asalWilayahId) : cabangs;

  const filteredKelasAsal = useMemo(() => {
    return kelasList.filter(k => {
      // Check using string inclusion on nested objects if ids are unavailable or use ids if available
      if (asalWilayahId && k.cabang?.wilayahId !== asalWilayahId) return false;
      if (asalCabangId && k.cabangId !== asalCabangId && k.cabang?.id !== asalCabangId) return false;
      return true;
    });
  }, [kelasList, asalWilayahId, asalCabangId]);

  useEffect(() => {
    if (formData.kelasAsalId && formData.kelasAsalId !== 'ALL') {
      setIsLoadingStudents(true);
      apiClient.get(`/formal/kelas/${formData.kelasAsalId}/students`)
        .then(res => {
          setStudents(res.data);
          const initialSettings: Record<string, { statusAkhir: string }> = {};
          res.data.forEach((s: any) => {
            initialSettings[s.id] = { statusAkhir: 'NAIK_TINGKAT' };
          });
          setStudentSettings(initialSettings);
        })
        .catch(console.error)
        .finally(() => setIsLoadingStudents(false));
    } else {
      setStudents([]);
      setStudentSettings({});
    }
  }, [formData.kelasAsalId]);

  const applyBulk = () => {
    const newSettings = { ...studentSettings };
    students.forEach(s => {
      newSettings[s.id] = { statusAkhir: bulkStatus };
    });
    setStudentSettings(newSettings);
  };

  const handleStudentChange = (studentId: string, value: string) => {
    setStudentSettings(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        statusAkhir: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelasAsalId) return showToast('error', 'Pilih kelas asal');
    
    if (formData.kelasAsalId === 'ALL') {
      if (filteredKelasAsal.length === 0) return showToast('error', 'Tidak ada kelas untuk diproses');
      const payload = {
        kelasAsalIds: filteredKelasAsal.map(k => k.id),
        tahunAjaranLama: formData.tahunAjaranLama,
        semesterLama: formData.semesterLama,
        tahunAjaranBaru: formData.tahunAjaranBaru,
        semesterBaru: formData.semesterBaru
      };
      setPendingPayload({ type: 'BULK', data: payload });
      setIsConfirmOpen(true);
      return;
    }

    // Validate
    const payloadStudents = students.map(s => {
      const setting = studentSettings[s.id];
      return {
        studentId: s.id,
        statusAkhir: setting.statusAkhir
      };
    });

    setPendingPayload({ type: 'SINGLE', data: { ...formData, students: payloadStudents } });
    setIsConfirmOpen(true);
  };

  const confirmSubmit = () => {
    if (!pendingPayload) return;
    
    let request;
    if (pendingPayload.type === 'BULK') {
      request = apiClient.post('/formal/kelas/naik-kelas-bulk', pendingPayload.data);
    } else {
      request = mutation.mutateAsync(pendingPayload.data);
    }
    
    if (pendingPayload.type === 'BULK') {
      request.then((res: any) => {
        const warnCount = res?.data?.tingkatTidakDikenali?.length || 0;
        if (warnCount > 0) {
          showToast('error', `${warnCount} siswa tingkatnya TIDAK berubah (format tingkat tidak dikenali, cek data siswa terkait)`);
        } else {
          showToast('success', 'Berhasil memproses kenaikan semua kelas massal');
        }
        onClose();
      }).catch((err: any) => {
        showToast('error', 'Terjadi kesalahan: ' + (err.response?.data?.message || err.message));
      }).finally(() => {
        setPendingPayload(null);
      });
    } else {
      // mutation logic already handles toast in KenaikanKelasModal outside if we used mutate instead of mutateAsync, but let's just do it here
      mutation.mutate(pendingPayload.data, {
        onSuccess: (res: any) => {
          const warnCount = res?.tingkatTidakDikenali?.length || 0;
          if (warnCount > 0) {
            showToast('error', `${warnCount} siswa tingkatnya TIDAK berubah (format tingkat tidak dikenali, cek data siswa terkait)`);
          } else {
            showToast('success', 'Berhasil memproses kenaikan kelas massal');
          }
          onClose();
        },
        onError: (err: any) => {
          showToast('error', 'Terjadi kesalahan: ' + (err.response?.data?.message || err.message));
        }
      });
      setPendingPayload(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Proses Kenaikan Kelas Massal
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">Pindahkan rombongan belajar ke tahun ajaran baru sekaligus catat riwayat</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <form id="kenaikan-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Konfigurasi Awal */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Wilayah Asal</label>
                <select
                  value={asalWilayahId}
                  onChange={(e) => {
                    setAsalWilayahId(e.target.value);
                    setAsalCabangId('');
                    setFormData(p => ({ ...p, kelasAsalId: '' }));
                  }}
                  disabled={user?.scope === 'WILAYAH' || user?.scope === 'CABANG'}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-slate-50 disabled:bg-slate-100"
                >
                  <option value="">Semua Wilayah</option>
                  {wilayahs.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cabang Asal</label>
                <select
                  value={asalCabangId}
                  onChange={(e) => {
                    setAsalCabangId(e.target.value);
                    setFormData(p => ({ ...p, kelasAsalId: '' }));
                  }}
                  disabled={user?.scope === 'CABANG'}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-slate-50 disabled:bg-slate-100"
                >
                  <option value="">Semua Cabang</option>
                  {filteredCabangsAsal.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Kelas Asal</label>
                <select
                  value={formData.kelasAsalId}
                  onChange={(e) => setFormData(p => ({ ...p, kelasAsalId: e.target.value }))}
                  required
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {filteredKelasAsal.length > 0 && <option value="ALL" className="font-bold text-indigo-600">-- PROSES SEMUA KELAS ({filteredKelasAsal.length}) --</option>}
                  {filteredKelasAsal.map(k => (
                    <option key={k.id} value={k.id}>{k.name} {k.cabang ? `(${k.cabang.name})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">T.A. Lama (Saat ini)</label>
                <select
                  required
                  value={formData.tahunAjaranLama}
                  onChange={(e) => setFormData(p => ({ ...p, tahunAjaranLama: e.target.value }))}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-slate-50"
                >
                  {tahunAjaranOptions.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Semester Lama</label>
                <select
                  value={formData.semesterLama}
                  onChange={(e) => setFormData(p => ({ ...p, semesterLama: e.target.value }))}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-slate-50"
                >
                  <option value="GANJIL">Ganjil</option>
                  <option value="GENAP">Genap</option>
                </select>
              </div>
            </div>

            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-indigo-900 mb-1">T.A. Baru (Tujuan)</label>
                <select
                  required
                  value={formData.tahunAjaranBaru}
                  onChange={(e) => setFormData(p => ({ ...p, tahunAjaranBaru: e.target.value }))}
                  className="w-full rounded-lg border-indigo-200 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {tahunAjaranOptions.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-900 mb-1">Semester Baru</label>
                <select
                  value={formData.semesterBaru}
                  onChange={(e) => setFormData(p => ({ ...p, semesterBaru: e.target.value }))}
                  className="w-full rounded-lg border-indigo-200 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="GANJIL">Ganjil</option>
                  <option value="GENAP">Genap</option>
                </select>
              </div>
            </div>

            {formData.kelasAsalId === 'ALL' ? (
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm p-8 text-center">
                <Users className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-indigo-900 mb-2">Proses Semua Kelas</h3>
                <p className="text-indigo-700 max-w-lg mx-auto">
                  Anda akan memproses kenaikan tingkat untuk <strong>seluruh siswa</strong> yang ada di dalam <strong>{filteredKelasAsal.length} kelas</strong> yang telah difilter. Semua siswa tersebut akan otomatis mendapatkan status <strong>Naik Tingkat</strong> (atau Lulus jika kelas 12).
                </p>
              </div>
            ) : formData.kelasAsalId ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-end justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">Daftar Siswa ({students.length})</h4>
                    <p className="text-xs text-slate-500">Tentukan status akhir dan kelas tujuan untuk setiap siswa.</p>
                  </div>
                  
                  {/* Bulk Actions */}
                  <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 px-1 uppercase tracking-wider">Set Massal:</span>
                      <select
                        value={bulkStatus}
                        onChange={e => setBulkStatus(e.target.value)}
                        className="text-sm border-slate-300 rounded py-1 px-2"
                      >
                        <option value="NAIK_TINGKAT">Naik Tingkat</option>
                        <option value="TINGGAL_TINGKAT">Tinggal Tingkat</option>
                        <option value="LULUS">Lulus</option>
                        <option value="PINDAH">Pindah / Keluar</option>
                      </select>
                      <button
                        type="button"
                        onClick={applyBulk}
                        className="px-3 py-1 bg-slate-800 text-white text-xs font-medium rounded hover:bg-slate-700 transition-colors"
                      >
                        Terapkan ke Semua
                      </button>
                    </div>
                  </div>
                </div>

                {isLoadingStudents ? (
                  <div className="p-12 text-center text-slate-500">Memuat siswa...</div>
                ) : students.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                    <AlertTriangle className="w-8 h-8 mb-2 text-amber-500" />
                    Tidak ada siswa di kelas ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nama Siswa</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">NISN</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status Kenaikan</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {students.map(s => {
                          const setting = studentSettings[s.id] || { statusAkhir: 'NAIK_TINGKAT' };
                          const isTerminal = setting.statusAkhir === 'LULUS' || setting.statusAkhir === 'PINDAH';
                          
                          return (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                {s.biodata?.fullName}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                                {s.biodata?.nisn || '-'}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap">
                                <select
                                  value={setting.statusAkhir}
                                  onChange={e => handleStudentChange(s.id, e.target.value)}
                                  className={`text-sm border-slate-300 rounded-lg py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${
                                    setting.statusAkhir === 'LULUS' ? 'bg-green-50 text-green-700 border-green-200' :
                                    setting.statusAkhir === 'TINGGAL_TINGKAT' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''
                                  }`}
                                >
                                  <option value="NAIK_TINGKAT">Naik Tingkat</option>
                                  <option value="TINGGAL_TINGKAT">Tinggal Tingkat</option>
                                  <option value="LULUS">Lulus</option>
                                  <option value="PINDAH">Pindah / Keluar</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="kenaikan-form"
            disabled={mutation.isPending || !formData.kelasAsalId || (formData.kelasAsalId !== 'ALL' && students.length === 0) || (formData.kelasAsalId === 'ALL' && filteredKelasAsal.length === 0)}
            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {mutation.isPending ? 'Memproses...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Proses Sekarang
              </>
            )}
          </button>
        </div>
      </div>
      </div>

    <ConfirmModal
      isOpen={isConfirmOpen}
      onClose={() => { setIsConfirmOpen(false); setPendingPayload(null); }}
      onConfirm={confirmSubmit}
      title="Konfirmasi Proses Kenaikan Kelas"
      message={pendingPayload?.type === 'BULK' ? `Apakah Anda yakin ingin memproses kenaikan kelas untuk seluruh siswa di ${filteredKelasAsal.length} kelas ini? Proses ini akan mengubah status mereka secara massal.` : `Apakah Anda yakin ingin memproses ${students.length} siswa ini? Proses ini akan mengubah data kelas aktif dan mencatat riwayat kelas.`}
      confirmText="Proses Kenaikan"
      variant="primary"
    />
    </>
  );
}
