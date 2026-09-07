import React, { useMemo, useState } from 'react';
import { Map, Plus, Edit2, Trash2 } from 'lucide-react';
import { useGetWilayah, useToggleWilayahActive, Wilayah } from '../../features/core_data/hooks/useMasterData';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import WilayahModal from '../../features/core_data/components/WilayahModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

export default function DataWilayah() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';
  const { data: wilayah, isLoading, isError } = useGetWilayah(isAdmin);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const toggleActiveMutation = useToggleWilayahActive();

  const filteredWilayah = useMemo(() => {
    const list = Array.isArray(wilayah) ? wilayah : [];
    if (statusFilter === 'ACTIVE') return list.filter(w => w.isActive !== false);
    if (statusFilter === 'INACTIVE') return list.filter(w => w.isActive === false);
    return list;
  }, [wilayah, statusFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wilayahToEdit, setWilayahToEdit] = useState<Wilayah | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [wilayahToDelete, setWilayahToDelete] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/master-data/wilayah/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wilayah'] });
      showToast('success', t('common.delete_success'));
    },
    onError: (error: any) => {
      if (error.response?.status === 400 || error.response?.data?.code?.startsWith('P2')) {
        showToast('error', t('common.delete_constraint_failed'));
      } else {
        showToast('error', error.response?.data?.message || t('common.delete_failed'));
      }
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/master-data/wilayah/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'wilayah'] });
      showToast('success', t('common.delete_success'));
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || t('common.delete_failed'));
    }
  });

  const confirmDelete = (id: string) => {
    setWilayahToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteAll = () => {
    setIsConfirmDeleteAllOpen(true);
  };

  const executeDelete = () => {
    if (wilayahToDelete) {
      deleteMutation.mutate(wilayahToDelete);
      setWilayahToDelete(null);
    }
  };

  const executeDeleteAll = () => {
    deleteAllMutation.mutate();
    setIsConfirmDeleteAllOpen(false);
  };

  const handleEdit = (item: Wilayah) => {
    setWilayahToEdit(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setWilayahToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{t('wilayah.title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('wilayah.subtitle')}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button 
              onClick={confirmDeleteAll}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </button>
            <button 
              onClick={handleAdd}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('wilayah.add_button')}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE'); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
        ) : filteredWilayah.length > 0 ? (<>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('wilayah.region_name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">ID</th>
                  {isAdmin && <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>}
                  {isAdmin && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredWilayah.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.isActive === false ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {item.id}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: item.id, isActive: !(item.isActive !== false) })}
                          disabled={toggleActiveMutation.isPending}
                          title={item.isActive === false ? 'Aktifkan wilayah' : 'Nonaktifkan wilayah'}
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                            item.isActive === false
                              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {item.isActive === false ? 'Nonaktif' : 'Aktif'}
                        </button>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-blue-900 mr-4">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDelete(item.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredWilayah.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            totalItems={filteredWilayah.length}
            itemsPerPage={itemsPerPage}
          />
        </>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
              <Map className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800">{t('wilayah.no_data_title')}</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
              {t('wilayah.no_data_desc')}
            </p>
          </div>
        )}
      </div>

      <WilayahModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wilayahToEdit={wilayahToEdit}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title={t('common.delete_confirm') || "Konfirmasi Hapus"}
        message={t('wilayah.delete_warning') || "Apakah Anda yakin ingin menghapus data wilayah ini? Aksi ini tidak dapat dibatalkan."}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={executeDeleteAll}
        title="Konfirmasi Hapus Semua Wilayah"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data wilayah? Aksi ini akan menghapus seluruh data wilayah secara permanen, dan mengosongkan relasi cabang ke wilayah tersebut. Aksi ini tidak dapat dibatalkan."
      />
    </div>
  );
}
