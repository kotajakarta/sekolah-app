import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useGetCabang } from '../../features/core_data/hooks/useMasterData';
import { Plus, Edit2, CheckCircle, XCircle, Loader2, Upload, Download, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import Papa from 'papaparse';
import ImportKelasModal from './ImportKelasModal';
import ConfirmModal from '../../components/ConfirmModal';

interface Cabang {
  id: string;
  name: string;
  wilayah?: { name: string };
}

interface Kelas {
  id: string;
  name: string;
  tingkat?: string;
  isActive: boolean;
  cabangId?: string;
  cabang?: Cabang;
}

export default function ManajemenKelas() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.scope === 'GLOBAL';
  const isWilayahOrAdmin = user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH';
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({ name: '', tingkat: 'Non Muadalah', isActive: true, cabangId: '' });
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [kelasToDelete, setKelasToDelete] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const { data: kelasList, isLoading } = useQuery<Kelas[]>({
    queryKey: ['kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      return res.data;
    }
  });

  const { data: cabangList, isLoading: loadingCabang } = useGetCabang();

  const handleExport = () => {
    if (!kelasList || kelasList.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    const exportData = kelasList.map((kelas) => ({
      nama_kelas: kelas.name,
      tingkat: kelas.tingkat || '',
      is_active: kelas.isActive ? 'true' : 'false',
      cabang: kelas.cabang?.name || '',
      wilayah: kelas.cabang?.wilayah?.name || '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_kelas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createMutation = useMutation({
    mutationFn: async (data: { name: string, tingkat: string, isActive: boolean, cabangId: string }) => {
      await apiClient.post('/formal/kelas', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string, name: string, tingkat: string, cabangId: string }) => {
      await apiClient.put(`/formal/kelas/${data.id}`, { name: data.name, tingkat: data.tingkat, cabangId: data.cabangId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      setIsModalOpen(false);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (data: { id: string, isActive: boolean }) => {
      await apiClient.patch(`/formal/kelas/${data.id}/status`, { isActive: data.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/formal/kelas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      alert(t('common.delete_success') || 'Berhasil dihapus');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t('common.delete_failed') || 'Gagal menghapus');
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/formal/kelas/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
      alert(t('common.delete_success') || 'Berhasil menghapus semua kelas');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t('common.delete_failed') || 'Gagal menghapus semua kelas');
    }
  });

  const confirmDelete = (id: string) => {
    setKelasToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteAll = () => {
    setIsConfirmDeleteAllOpen(true);
  };

  const executeDelete = () => {
    if (kelasToDelete) {
      deleteMutation.mutate(kelasToDelete);
      setIsConfirmModalOpen(false);
      setKelasToDelete(null);
    }
  };

  const executeDeleteAll = () => {
    deleteAllMutation.mutate();
    setIsConfirmDeleteAllOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKelas) {
      updateMutation.mutate({ id: editingKelas.id, name: formData.name, tingkat: formData.tingkat, cabangId: formData.cabangId });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddModal = () => {
    setEditingKelas(null);
    setFormData({ name: '', tingkat: 'Non Muadalah', isActive: true, cabangId: user?.scope === 'CABANG' ? (user.cabangId || '') : '' });
    setIsModalOpen(true);
  };

  const openEditModal = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setFormData({ name: kelas.name, tingkat: kelas.tingkat || 'Non Muadalah', isActive: kelas.isActive, cabangId: kelas.cabangId || '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t('formal.kelas_title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('formal.kelas_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button 
              onClick={confirmDeleteAll}
              className="inline-flex items-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </button>
          )}
          {isWilayahOrAdmin && (
            <>
              <button 
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </button>
              <button 
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('common.add')} Kelas
              </button>
            </>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Tingkat</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('cabang.branch_name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(Array.isArray(kelasList) ? kelasList : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((kelas) => (
                <tr key={kelas.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                    {kelas.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {kelas.tingkat || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {kelas.cabang ? `${kelas.cabang.name} ${kelas.cabang.wilayah ? `(${kelas.cabang.wilayah.name})` : ''}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${kelas.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {kelas.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {isWilayahOrAdmin && (
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: kelas.id, isActive: !kelas.isActive })}
                        className={`inline-flex items-center px-2 py-1 border rounded text-xs font-medium ${kelas.isActive ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'}`}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {kelas.isActive ? <XCircle className="w-3.5 h-3.5 mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                        {kelas.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}
                    {isWilayahOrAdmin && (
                      <button
                        onClick={() => openEditModal(kelas)}
                        className="inline-flex items-center px-2 py-1 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        {t('common.edit')}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => confirmDelete(kelas.id)}
                        className="inline-flex items-center px-2 py-1 border border-red-200 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {kelasList?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {t('common.no_data')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((kelasList?.length || 0) / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={kelasList?.length || 0} 
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
                  {editingKelas ? `${t('common.edit')} Kelas` : `${t('common.add')} Kelas`}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {user?.scope !== 'CABANG' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('cabang.branch_name')}</label>
                    {loadingCabang ? (
                      <div className="text-sm text-slate-500 flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-1"/> {t('common.loading')}</div>
                    ) : (
                      <select
                        required
                        value={formData.cabangId}
                        onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">-- {t('common.select')} --</option>
                        {cabangList?.filter(c => user?.scope === 'WILAYAH' ? c.wilayahId === user.wilayahId : true).map(cabang => (
                          <option key={cabang.id} value={cabang.id}>
                            {cabang.name} {cabang.wilayah ? `(${cabang.wilayah.name})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none"
                    placeholder="Contoh: 1A, 2B..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat</label>
                  <select
                    value={formData.tingkat}
                    onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Non Muadalah">Non Muadalah</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                </div>
                {!editingKelas && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-slate-700">
                      Aktif
                    </label>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <ImportKelasModal onClose={() => setIsImportModalOpen(false)} />
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title={t('common.delete_confirm') || "Konfirmasi Hapus"}
        message="Apakah Anda yakin ingin menghapus kelas ini? Aksi ini tidak dapat dibatalkan."
      />

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={executeDeleteAll}
        title="Konfirmasi Hapus Semua Kelas"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data kelas? Aksi ini akan menghapus seluruh data kelas secara permanen dan tidak dapat dibatalkan."
      />
    </div>
  );
}
