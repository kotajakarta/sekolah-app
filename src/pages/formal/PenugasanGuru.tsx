import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useGetGuru } from '../../features/core_data/hooks/useMasterData';
import { Plus, Trash2, Loader2, BookOpen, UserCheck, AlertCircle } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

interface Assignment {
  id: string;
  staffId: string;
  staff: {
    id: string;
    name: string;
    position: string;
  };
  mataPelajaranId: string;
  mataPelajaran: {
    id: string;
    kodeMapel: string;
    name: string;
  };
  kelasId: string;
  kelas: {
    id: string;
    name: string;
    cabang?: {
      name: string;
      wilayah?: {
        name: string;
      };
    };
  };
}

export default function PenugasanGuru() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ staffId: '', mataPelajaranId: '', kelasId: '' });
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  // Filter States
  const [filterGuru, setFilterGuru] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  // Queries
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ['guru-mapel-kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/guru-mapel-kelas');
      return res.data;
    }
  });

  const { data: guruList = [], isLoading: loadingGuru } = useGetGuru();

  const { data: kelasList = [], isLoading: loadingKelas } = useQuery<any[]>({
    queryKey: ['kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      return res.data;
    }
  });

  const { data: mapelList = [], isLoading: loadingMapel } = useQuery<any[]>({
    queryKey: ['mapel'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/mapel');
      return res.data.filter((m: any) => m.isActive);
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiClient.post('/formal/guru-mapel-kelas', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru-mapel-kelas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsModalOpen(false);
      setFormData({ staffId: '', mataPelajaranId: '', kelasId: '' });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal menyimpan penugasan');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/formal/guru-mapel-kelas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru-mapel-kelas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsConfirmDeleteOpen(false);
      setAssignmentToDelete(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal menghapus penugasan');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || !formData.mataPelajaranId || !formData.kelasId) {
      alert('Harap isi semua kolom pilihan');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleOpenDelete = (id: string) => {
    setAssignmentToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const filteredAssignments = assignments.filter((asg) => {
    const matchGuru = asg.staff?.name?.toLowerCase().includes(filterGuru.toLowerCase());
    const matchMapel = asg.mataPelajaran?.name?.toLowerCase().includes(filterMapel.toLowerCase());
    const matchKelas = asg.kelas?.name?.toLowerCase().includes(filterKelas.toLowerCase());
    return matchGuru && matchMapel && matchKelas;
  });

  const isLoading = loadingAssignments || loadingGuru || loadingKelas || loadingMapel;

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-500 pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Penugasan Mengajar Guru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola pembagian tugas mengajar guru per mata pelajaran dan kelas yang spesifik.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Tambah Penugasan
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cari Guru</label>
          <input
            type="text"
            value={filterGuru}
            onChange={(e) => setFilterGuru(e.target.value)}
            placeholder="Ketik nama guru..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cari Mata Pelajaran</label>
          <input
            type="text"
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            placeholder="Ketik nama mapel..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cari Kelas</label>
          <input
            type="text"
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            placeholder="Ketik nama kelas..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nama Guru</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Cabang</th>
                  <th className="px-6 py-4">Wilayah</th>
                  <th className="px-6 py-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {asg.staff?.name || 'Staf tidak ditemukan'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[13px] text-slate-700 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          {asg.mataPelajaran?.name || 'Mapel tidak ditemukan'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-100">
                          {asg.kelas?.name || 'Kelas tidak ditemukan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {asg.kelas?.cabang?.name || 'Pusat'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {asg.kelas?.cabang?.wilayah?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDelete(asg.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Belum ada penugasan guru yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Tambah Penugasan Guru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Select Guru */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Guru Pengajar
                  </label>
                  <select
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Pilih Guru --</option>
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.position})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Kelas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Kelas Penempatan
                  </label>
                  <select
                    required
                    value={formData.kelasId}
                    onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} {k.cabang?.name ? `(${k.cabang.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    required
                    value={formData.mataPelajaranId}
                    onChange={(e) => setFormData({ ...formData, mataPelajaranId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} [{m.grupMapel}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => assignmentToDelete && deleteMutation.mutate(assignmentToDelete)}
        title="Batalkan Penugasan Guru"
        message="Apakah Anda yakin ingin membatalkan/menghapus tugas mengajar guru ini? Aksi ini bersifat permanen."
      />
    </div>
  );
}
