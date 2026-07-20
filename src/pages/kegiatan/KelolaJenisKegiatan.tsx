import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { FileText, Plus, Trash2, Edit, Save, X, Loader2, AlertCircle } from 'lucide-react';

interface JenisKegiatan {
  id: string;
  nama: string;
  createdAt: string;
}

export default function KelolaJenisKegiatan() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [newJenis, setNewJenis] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Fetch list of jenis kegiatan
  const { data: jenisList = [], isLoading, isError } = useQuery<JenisKegiatan[]>({
    queryKey: ['jenis-kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/jenis');
      return res.data;
    }
  });

  // Mutation to create jenis kegiatan
  const createMutation = useMutation({
    mutationFn: async (nama: string) => {
      return apiClient.post('/kegiatan/jenis', { nama });
    },
    onSuccess: () => {
      showToast('success', 'Jenis kegiatan berhasil ditambahkan!');
      setNewJenis('');
      queryClient.invalidateQueries({ queryKey: ['jenis-kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal menambahkan jenis kegiatan.');
    }
  });

  // Mutation to update jenis kegiatan
  const updateMutation = useMutation({
    mutationFn: async ({ id, nama }: { id: string; nama: string }) => {
      return apiClient.put(`/kegiatan/jenis/${id}`, { nama });
    },
    onSuccess: () => {
      showToast('success', 'Jenis kegiatan berhasil diubah!');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['jenis-kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal mengubah jenis kegiatan.');
    }
  });

  // Mutation to delete jenis kegiatan
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/kegiatan/jenis/${id}`);
    },
    onSuccess: () => {
      showToast('success', 'Jenis kegiatan berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['jenis-kegiatan'] });
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal menghapus jenis kegiatan.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJenis.trim()) return;
    createMutation.mutate(newJenis.trim());
  };

  const startEdit = (jenis: JenisKegiatan) => {
    setEditingId(jenis.id);
    setEditingName(jenis.nama);
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) return;
    updateMutation.mutate({ id, nama: editingName.trim() });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jenis kegiatan ini?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          Kelola Jenis Kegiatan
        </h1>
        <p className="text-sm text-slate-500 mt-1">Daftar kategori / jenis kegiatan yang dapat dideklarasikan dalam template oleh Pusat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Add */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Tambah Jenis Kegiatan</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Nama Kategori</label>
              <input
                type="text"
                placeholder="Contoh: HUT RI, Hari Besar Islam, dll"
                value={newJenis}
                onChange={(e) => setNewJenis(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 focus:outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending || !newJenis.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-650 hover:bg-indigo-750 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tambah Kategori
            </button>
          </form>
        </div>

        {/* List Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm md:col-span-2 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-rose-600 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" /> Gagal memuat kategori kegiatan.
            </div>
          ) : jenisList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Belum ada jenis kegiatan yang dibuat.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jenisList.map((jenis) => (
                <div key={jenis.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  {editingId === jenis.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-650"
                      />
                      <button
                        onClick={() => handleUpdate(jenis.id)}
                        disabled={updateMutation.isPending || !editingName.trim()}
                        className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-150 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        title="Simpan"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-800 text-sm block truncate">{jenis.nama}</span>
                        <span className="text-[10px] text-slate-400">
                          Dibuat pada: {new Date(jenis.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(jenis)}
                          className="p-2 text-slate-500 hover:text-indigo-650 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Kategori"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(jenis.id)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
