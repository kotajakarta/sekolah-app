import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Edit2, CheckCircle, XCircle, Loader2, Trash2, Settings } from 'lucide-react';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import KeaktifanMapelModal from './KeaktifanMapelModal';

interface Mapel {
  id: string;
  kodeMapel: string;
  name: string;
  grupMapel: string;
  isActive: boolean;
  keaktifanGrup?: { grupDaimiId: string, isActive: boolean }[];
}

interface GrupDaimi {
  id: string;
  name: string;
}

export default function ManajemenMapel() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';
  const isWilayahOrAdmin = user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<Mapel | null>(null);
  const [formData, setFormData] = useState<{ kodeMapel: string, name: string, grupMapel: string, isActive: boolean, activeGrupIds: string[] }>({ 
    kodeMapel: '', name: '', grupMapel: 'Umum', isActive: true, activeGrupIds: [] 
  });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [mapelToDelete, setMapelToDelete] = useState<string | null>(null);
  const [isKeaktifanModalOpen, setIsKeaktifanModalOpen] = useState(false);
  const [selectedMapelForKeaktifan, setSelectedMapelForKeaktifan] = useState<Mapel | null>(null);

  const { data: mapelList, isLoading } = useQuery<Mapel[]>({
    queryKey: ['mapel'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/mapel');
      return res.data;
    }
  });

  const { data: grupDaimiList = [] } = useQuery<GrupDaimi[]>({
    queryKey: ['grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/grup-daimi');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/formal/mapel', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapel'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal menyimpan data');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put(`/formal/mapel/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapel'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal mengubah data');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/formal/mapel/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapel'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Gagal menghapus data');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMapel) {
      updateMutation.mutate({ id: editingMapel.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddModal = () => {
    setEditingMapel(null);
    setFormData({ kodeMapel: '', name: '', grupMapel: 'Umum', isActive: true, activeGrupIds: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (mapel: Mapel) => {
    setEditingMapel(mapel);
    setFormData({ 
      kodeMapel: mapel.kodeMapel, 
      name: mapel.name, 
      grupMapel: mapel.grupMapel, 
      isActive: mapel.isActive,
      activeGrupIds: mapel.keaktifanGrup?.filter(k => k.isActive).map(k => k.grupDaimiId) || []
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setMapelToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = () => {
    if (mapelToDelete) {
      deleteMutation.mutate(mapelToDelete);
      setIsConfirmModalOpen(false);
      setMapelToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Mata Pelajaran</h1>
          <p className="text-sm text-slate-500 mt-1.5">Kelola data mata pelajaran formal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isWilayahOrAdmin && (
            <button 
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Mapel
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (<>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Kode Mapel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Mapel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Grup Mapel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(Array.isArray(mapelList) ? mapelList : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((mapel, idx) => (
                <tr key={mapel.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {mapel.kodeMapel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {mapel.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {mapel.grupMapel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${mapel.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {mapel.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {isWilayahOrAdmin && (
                      <>
                        <button
                          onClick={() => { setSelectedMapelForKeaktifan(mapel); setIsKeaktifanModalOpen(true); }}
                          className="inline-flex items-center px-2 py-1 border border-blue-200 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          <Settings className="w-3.5 h-3.5 mr-1" />
                          Keaktifan
                        </button>
                        <button
                          onClick={() => openEditModal(mapel)}
                          className="inline-flex items-center px-2 py-1 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => confirmDelete(mapel.id)}
                        className="inline-flex items-center px-2 py-1 border border-red-200 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {mapelList?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data mata pelajaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((mapelList?.length || 0) / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={mapelList?.length || 0} 
            itemsPerPage={itemsPerPage} 
          />
        </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingMapel ? 'Edit Mapel' : 'Tambah Mapel'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kode Mapel</label>
                  <input
                    type="text"
                    required
                    value={formData.kodeMapel}
                    onChange={(e) => setFormData({ ...formData, kodeMapel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none"
                    placeholder="Contoh: BIG, MAT..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mapel</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none"
                    placeholder="Contoh: Bahasa Inggris..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grup Mapel</label>
                  <select
                    value={formData.grupMapel}
                    onChange={(e) => setFormData({ ...formData, grupMapel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Agama Islam">Agama Islam</option>
                    <option value="Umum">Umum</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
                <div className="flex items-center pb-2 border-b border-slate-100">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-slate-700">
                    Aktif Secara Umum
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Aktif Khusus Untuk Grup Daimi:</label>
                  <div className="space-y-2">
                    {grupDaimiList.map((grup) => (
                      <div key={grup.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`grup-${grup.id}`}
                          checked={formData.activeGrupIds.includes(grup.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, activeGrupIds: [...formData.activeGrupIds, grup.id] });
                            } else {
                              setFormData({ ...formData, activeGrupIds: formData.activeGrupIds.filter(id => id !== grup.id) });
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`grup-${grup.id}`} className="ml-2 block text-sm text-slate-700">
                          {grup.name}
                        </label>
                      </div>
                    ))}
                  </div>
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
        message="Apakah Anda yakin ingin menghapus mapel ini? Aksi ini tidak dapat dibatalkan."
      />

      {isKeaktifanModalOpen && selectedMapelForKeaktifan && (
        <KeaktifanMapelModal 
          mapel={selectedMapelForKeaktifan} 
          onClose={() => { setIsKeaktifanModalOpen(false); setSelectedMapelForKeaktifan(null); }} 
        />
      )}
    </div>
  );
}
