import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Loader2, X, Save } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import ConfirmModal from '../../components/ConfirmModal';

interface JenisGrupDaimi {
  id: string;
  name: string;
}

export default function JenisGrupDaimiManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const canManage = user?.scope === 'GLOBAL';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<JenisGrupDaimi | null>(null);
  const [name, setName] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useQuery<JenisGrupDaimi[]>({
    queryKey: ['jenis-grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/jenis-grup-daimi');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await apiClient.put(`/pesantren/jenis-grup-daimi/${editing.id}`, { name });
      } else {
        await apiClient.post('/pesantren/jenis-grup-daimi', { name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-grup-daimi'] });
      showToast('success', editing ? 'Jenis grup berhasil diubah' : 'Jenis grup berhasil ditambahkan');
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan jenis grup (mungkin sudah ada nama yang sama)');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/pesantren/jenis-grup-daimi/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jenis-grup-daimi'] });
      showToast('success', 'Jenis grup berhasil dihapus');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus jenis grup');
    }
  });

  const openAddModal = () => {
    setEditing(null);
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: JenisGrupDaimi) => {
    setEditing(item);
    setName(item.name);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = () => {
    if (toDeleteId) deleteMutation.mutate(toDeleteId);
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-800">Jenis Grup Daimi</h2>
          <p className="text-sm text-slate-500">
            Daftar terkelola untuk field "Jenis" pada Grup Daimi, supaya nilainya konsisten (bukan teks bebas).
            {!canManage && ' Hanya admin pusat yang bisa menambah/mengubah/menghapus.'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jenis
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Belum ada jenis grup yang terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Jenis Grup</th>
                {canManage && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Aksi</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {list.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{item.name}</td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-800 mr-3">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => handleDeleteClick(item.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editing ? 'Ubah Jenis Grup' : 'Tambah Jenis Grup'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Jenis Grup *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Contoh: HAFIZLIK, ULYA, WUSTHO..."
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
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={!name.trim() || saveMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus jenis grup ini? Grup Daimi yang sudah memakai jenis ini tidak akan berubah datanya, tapi jenis ini tidak akan muncul lagi di pilihan dropdown."
      />
    </div>
  );
}
