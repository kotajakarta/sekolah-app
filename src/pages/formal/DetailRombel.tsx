import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useGetStudents, Student } from '../../features/core_data/hooks/useGetStudents';
import { ArrowLeft, Edit3, Trash2, UserPlus, UserMinus, Loader2, Printer, X, Search } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Cabang {
  id: string;
  name: string;
  wilayahId?: string;
  wilayah?: { name: string };
}

interface LembagaMuadalah {
  id: string;
  name: string;
  code: string;
  isActive?: boolean;
}

interface Staff {
  id: string;
  name: string;
}

interface Ruang {
  id: string;
  nama: string;
}

interface Kelas {
  id: string;
  name: string;
  tingkat?: string;
  isActive: boolean;
  cabangId?: string;
  cabang?: Cabang;
  lembagaMuadalahId?: string;
  lembagaMuadalah?: LembagaMuadalah;
  tahunAjaran?: string;
  waliKelasId?: string;
  waliKelas?: Staff;
  ruangId?: string;
  ruang?: Ruang;
  kurikulum?: string;
  jurusan?: string;
  jenisRombel?: string;
  kapasitas?: number;
}

interface DetailRombelProps {
  kelas: Kelas;
  onClose: () => void;
  onEdit: (kelas: Kelas) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export default function DetailRombel({ kelas, onClose, onEdit, onDelete, isAdmin }: DetailRombelProps) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const { showToast } = useToast();
  
  // Fetch specific class detail to ensure fresh data
  const { data: kelasDetail, isLoading: isLoadingKelas } = useQuery<Kelas>({
    queryKey: ['kelas', kelas.id],
    queryFn: async () => {
      const res = await apiClient.get(`/formal/kelas/${kelas.id}`);
      return res.data;
    },
    initialData: kelas
  });

  // Fetch students currently assigned to this class
  const { data: studentsInKelas = [], isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery<Student[]>({
    queryKey: ['kelas', kelas.id, 'students'],
    queryFn: async () => {
      const res = await apiClient.get(`/formal/kelas/${kelas.id}/students`);
      return res.data;
    }
  });

  // Fetch all students to identify candidates to add
  const { data: allStudents = [] } = useGetStudents();

  // Filter candidates: same branch, active, and not in this or any other class
  const studentCandidates = allStudents.filter(s => {
    const isSameBranch = s.cabangId === kelasDetail?.cabangId;
    const isActive = s.statusPool === 'AKTIF_CABANG' || s.statusPool === 'TERSEDIA'; // might be TERSEDIA if pulled from pool
    const hasNoClass = !s.siswaFormal || !s.siswaFormal.kelas || !(s.siswaFormal as any).kelasId;
    // Check tingkat match (allow if they don't have a tingkat yet)
    const sTingkat = (s.siswaFormal as any)?.tingkat;
    const isSameTingkat = !sTingkat || sTingkat === kelasDetail?.tingkat;
    
    return isSameBranch && isActive && hasNoClass && isSameTingkat;
  });

  const filteredCandidates = studentCandidates.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = (s.biodata?.fullName || '').toLowerCase();
    const nisn = (s.biodata?.nisn || '').toLowerCase();
    return fullName.includes(query) || nisn.includes(query);
  });

  const addStudentsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      await Promise.all(
        studentIds.map(studentId =>
          apiClient.post(`/formal/kelas/${kelas.id}/students`, { studentId })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas', kelas.id, 'students'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setSelectedStudentIds([]);
      setSearchQuery('');
      setIsAddModalOpen(false);
      refetchStudents();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menambahkan beberapa santri');
    }
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return apiClient.delete(`/formal/kelas/${kelas.id}/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas', kelas.id, 'students'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      refetchStudents();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mengeluarkan santri');
    }
  });

  const kapasitas = kelasDetail?.kapasitas || 80;
  const currentCount = studentsInKelas.length;

  return (
    <div className="space-y-6">
      {/* Back & Actions header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <button
          onClick={onClose}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Rombel
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors mr-2"
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak Daftar
          </button>
          
          <button
            onClick={() => onEdit(kelasDetail!)}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            EDIT ROMBEL
          </button>

          {isAdmin && (
            <button
              onClick={() => onDelete(kelas.id)}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              HAPUS ROMBEL
            </button>
          )}
        </div>
      </div>

      {/* Detail Rombel Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Detail Rombongan Belajar</h2>
          <p className="text-sm text-slate-500 mt-1">Cabang: {kelasDetail?.cabang?.name || '-'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tahun Ajaran</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">{kelasDetail?.tahunAjaran || '-'}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tingkat Kelas</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">Kelas {kelasDetail?.tingkat || '-'}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Rombel</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">{kelasDetail?.name || '-'}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Wali Kelas</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">{kelasDetail?.waliKelas?.name || '-'}</span>
          </div>
        </div>
      </div>

      {/* Santri List & Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
              TOTAL SANTRI {currentCount}
            </h3>
          </div>
          {/* Tambah Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedStudentIds([]);
              setSearchQuery('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors print:hidden"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah
          </button>
        </div>

        {/* Students Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {isLoadingStudents ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-20">NO</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">NAMA SANTRI</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">NISN</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-36">NOMOR ABSEN</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest w-28 print:hidden">AKSI</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {studentsInKelas.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                      {student.biodata?.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {student.biodata?.nisn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-800">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin mengeluarkan ${student.biodata?.fullName} dari rombel ini?`)) {
                            removeStudentMutation.mutate(student.id);
                          }
                        }}
                        disabled={removeStudentMutation.isPending}
                        className="inline-flex items-center px-2 py-1.5 border border-rose-200 rounded text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <UserMinus className="w-3.5 h-3.5 mr-1" />
                        Keluarkan
                      </button>
                    </td>
                  </tr>
                ))}
                {studentsInKelas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">
                      Belum ada santri di rombel ini. Gunakan tombol Tambah di atas untuk menambahkan santri.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                Tambah Santri
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1 shadow transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Selection List */}
            <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-11 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50/50"
                  placeholder="Cari Nama / NISN"
                />
              </div>

              {/* Table/List */}
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/2">
                        NAMA SANTRI
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                        NISN
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                        <span className="mr-2 inline-block">PILIH SEMUA</span>
                        <input
                          type="checkbox"
                          checked={
                            filteredCandidates.length > 0 &&
                            filteredCandidates.every((c) => selectedStudentIds.includes(c.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelections = [
                                ...selectedStudentIds,
                                ...filteredCandidates.map((c) => c.id).filter(id => !selectedStudentIds.includes(id))
                              ];
                              setSelectedStudentIds(newSelections);
                            } else {
                              const filteredIds = filteredCandidates.map((c) => c.id);
                              setSelectedStudentIds(
                                selectedStudentIds.filter((id) => !filteredIds.includes(id))
                              );
                            }
                          }}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer align-middle"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredCandidates.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 truncate">
                          {student.biodata?.fullName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 truncate">
                          {student.biodata?.nisn || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds([...selectedStudentIds, student.id]);
                              } else {
                                setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id));
                              }
                            }}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mr-1 align-middle"
                          />
                        </td>
                      </tr>
                    ))}
                    {filteredCandidates.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center text-slate-500 text-sm font-medium">
                          {`{Pencarian santri tidak ditemukan}`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-transparent hover:bg-slate-100 rounded-lg transition-colors"
              >
                BATAL
              </button>
              <button
                type="button"
                disabled={selectedStudentIds.length === 0 || addStudentsMutation.isPending}
                onClick={() => addStudentsMutation.mutate(selectedStudentIds)}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {addStudentsMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                TAMBAH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
