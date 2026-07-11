import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

interface GrupDaimi {
  id: string;
  name: string;
}

export default function GrupDaimiTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrup, setEditingGrup] = useState<GrupDaimi | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [grupToDelete, setGrupToDelete] = useState<string | null>(null);

  const { data: grupList, isLoading } = useQuery<GrupDaimi[]>({
    queryKey: ['grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/grup-daimi');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      await apiClient.post('/pesantren/grup-daimi', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string, name: string }) => {
      await apiClient.put(`/pesantren/grup-daimi/${data.id}`, { name: data.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/pesantren/grup-daimi/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grup-daimi'] });
      alert('Berhasil dihapus');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Gagal menghapus. Kemungkinan grup ini masih digunakan oleh data santri atau mapel.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGrup) {
      updateMutation.mutate({ id: editingGrup.id, name: formData.name });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddModal = () => {
    setEditingGrup(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (grup: GrupDaimi) => {
    setEditingGrup(grup);
    setFormData({ name: grup.name });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setGrupToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = () => {
    if (grupToDelete) {
      deleteMutation.mutate(grupToDelete);
      setIsConfirmModalOpen(false);
      setGrupToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-800">Manajemen Grup Daimi</h2>
          <p className="text-sm text-slate-500">Kelola master data Grup Daimi yang digunakan pada penempatan santri dan mapel.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Grup
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Grup Daimi</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(grupList || []).map((grup) => (
                <tr key={grup.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {grup.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(grup)}
                      className="inline-flex items-center px-2 py-1 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(grup.id)}
                      className="inline-flex items-center px-2 py-1 border border-red-200 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {grupList?.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data Grup Daimi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingGrup ? 'Edit Grup Daimi' : 'Tambah Grup Daimi'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Grup</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none"
                    placeholder="Contoh: Endonezya, Muadalah..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus Grup Daimi ini? Aksi ini tidak dapat dibatalkan dan akan ditolak sistem jika masih ada santri/mapel yang terikat."
      />
    </div>
  );
}
