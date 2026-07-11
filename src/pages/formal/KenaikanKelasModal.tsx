import React, { useState, useEffect } from 'react';
import { X, Save, Users, AlertTriangle } from 'lucide-react';
import { useKenaikanKelasMassal } from '../../features/core_data/hooks/useRiwayatKelas';
import apiClient from '../../lib/apiClient';

interface Kelas {
  id: string;
  name: string;
  tingkat?: string;
  cabang?: { name: string; wilayah?: { name: string } };
}

interface KenaikanKelasModalProps {
  kelasList: Kelas[];
  onClose: () => void;
}

export default function KenaikanKelasModal({ kelasList, onClose }: KenaikanKelasModalProps) {
  const mutation = useKenaikanKelasMassal();
  
  const [formData, setFormData] = useState({
    kelasAsalId: '',
    tahunAjaranLama: '2024/2025',
    semesterLama: 'GENAP',
    tahunAjaranBaru: '2025/2026',
    semesterBaru: 'GANJIL',
  });

  const [students, setStudents] = useState<any[]>([]);
  const [studentSettings, setStudentSettings] = useState<Record<string, { statusAkhir: string; kelasTujuanId: string }>>({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Bulk settings
  const [bulkStatus, setBulkStatus] = useState('NAIK_KELAS');
  const [bulkKelasTujuan, setBulkKelasTujuan] = useState('');

  useEffect(() => {
    if (formData.kelasAsalId) {
      setIsLoadingStudents(true);
      apiClient.get(`/formal/kelas/${formData.kelasAsalId}/students`)
        .then(res => {
          setStudents(res.data);
          const initialSettings: Record<string, { statusAkhir: string; kelasTujuanId: string }> = {};
          res.data.forEach((s: any) => {
            initialSettings[s.id] = { statusAkhir: 'NAIK_KELAS', kelasTujuanId: '' };
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
      newSettings[s.id] = { statusAkhir: bulkStatus, kelasTujuanId: bulkKelasTujuan };
    });
    setStudentSettings(newSettings);
  };

  const handleStudentChange = (studentId: string, field: 'statusAkhir' | 'kelasTujuanId', value: string) => {
    setStudentSettings(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelasAsalId) return alert('Pilih kelas asal');
    
    // Validate
    const payloadStudents = students.map(s => {
      const setting = studentSettings[s.id];
      return {
        studentId: s.id,
        statusAkhir: setting.statusAkhir,
        kelasTujuanId: setting.kelasTujuanId || undefined
      };
    });

    const hasInvalid = payloadStudents.some(s => (s.statusAkhir === 'NAIK_KELAS' || s.statusAkhir === 'TINGGAL_KELAS') && !s.kelasTujuanId);
    if (hasInvalid) {
      return alert('Siswa yang naik/tinggal kelas harus memiliki kelas tujuan yang dipilih.');
    }

    if (window.confirm(`Apakah Anda yakin ingin memproses ${students.length} siswa ini?\nProses ini akan mengubah data kelas aktif dan mencatat riwayat kelas.`)) {
      mutation.mutate({
        ...formData,
        students: payloadStudents
      }, {
        onSuccess: () => {
          alert('Berhasil memproses kenaikan kelas massal');
          onClose();
        },
        onError: (err: any) => {
          alert('Terjadi kesalahan: ' + (err.response?.data?.message || err.message));
        }
      });
    }
  };

  return (
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
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Kelas Asal</label>
                <select
                  value={formData.kelasAsalId}
                  onChange={(e) => setFormData(p => ({ ...p, kelasAsalId: e.target.value }))}
                  required
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>{k.name} {k.cabang ? `(${k.cabang.name})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">T.A. Lama (Saat ini)</label>
                <input
                  type="text"
                  required
                  value={formData.tahunAjaranLama}
                  onChange={(e) => setFormData(p => ({ ...p, tahunAjaranLama: e.target.value }))}
                  className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-slate-50"
                />
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
                <input
                  type="text"
                  required
                  value={formData.tahunAjaranBaru}
                  onChange={(e) => setFormData(p => ({ ...p, tahunAjaranBaru: e.target.value }))}
                  className="w-full rounded-lg border-indigo-200 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
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

            {formData.kelasAsalId && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-end justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">Daftar Siswa ({students.length})</h4>
                    <p className="text-xs text-slate-500">Tentukan status akhir dan kelas tujuan untuk setiap siswa.</p>
                  </div>
                  
                  {/* Bulk Actions */}
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 px-2 uppercase tracking-wider">Set Massal:</span>
                    <select
                      value={bulkStatus}
                      onChange={e => setBulkStatus(e.target.value)}
                      className="text-sm border-slate-300 rounded py-1 px-2"
                    >
                      <option value="NAIK_KELAS">Naik Kelas</option>
                      <option value="TINGGAL_KELAS">Tinggal Kelas</option>
                      <option value="LULUS">Lulus</option>
                      <option value="PINDAH">Pindah</option>
                    </select>
                    <select
                      value={bulkKelasTujuan}
                      onChange={e => setBulkKelasTujuan(e.target.value)}
                      className="text-sm border-slate-300 rounded py-1 px-2 w-32"
                    >
                      <option value="">-- Tujuan --</option>
                      {kelasList.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
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
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Kelas Tujuan (Smt Depan)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {students.map(s => {
                          const setting = studentSettings[s.id] || { statusAkhir: 'NAIK_KELAS', kelasTujuanId: '' };
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
                                  onChange={e => handleStudentChange(s.id, 'statusAkhir', e.target.value)}
                                  className={`text-sm border-slate-300 rounded-lg py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 ${
                                    setting.statusAkhir === 'LULUS' ? 'bg-green-50 text-green-700 border-green-200' :
                                    setting.statusAkhir === 'TINGGAL_KELAS' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''
                                  }`}
                                >
                                  <option value="NAIK_KELAS">Naik Kelas</option>
                                  <option value="TINGGAL_KELAS">Tinggal Kelas</option>
                                  <option value="LULUS">Lulus</option>
                                  <option value="PINDAH">Pindah / Keluar</option>
                                </select>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap">
                                <select
                                  value={setting.kelasTujuanId}
                                  onChange={e => handleStudentChange(s.id, 'kelasTujuanId', e.target.value)}
                                  disabled={isTerminal}
                                  className={`text-sm rounded-lg py-1.5 px-3 w-full focus:ring-indigo-500 focus:border-indigo-500 ${
                                    isTerminal ? 'bg-slate-100 border-transparent text-slate-400 cursor-not-allowed' : 
                                    !setting.kelasTujuanId ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                  }`}
                                >
                                  <option value="">{isTerminal ? '-- (Tidak Perlu Kelas) --' : '-- Pilih Kelas Tujuan --'}</option>
                                  {kelasList.map(k => (
                                    <option key={k.id} value={k.id}>{k.name}</option>
                                  ))}
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
            )}
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
            disabled={mutation.isPending || !formData.kelasAsalId || students.length === 0}
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
  );
}
