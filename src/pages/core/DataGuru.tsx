import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCheck, Plus, UserMinus, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { useGetGuru, useDeleteGuru } from '../../features/core_data/hooks/useMasterData';
import { Guru } from '../../features/core_data/hooks/usePoolGuru';
import LepasGuruModal from '../../features/core_data/components/LepasGuruModal';
import TarikGuruMassalModal from '../../features/core_data/components/TarikGuruMassalModal';
import GuruModal from '../../features/core_data/components/GuruModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

export default function DataGuru() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';
  const queryClient = useQueryClient();

  const { data: guru, isLoading, isError } = useGetGuru();
  const deleteMutation = useDeleteGuru();
  const [guruToLepas, setGuruToLepas] = useState<Guru | null>(null);
  const [isTarikModalOpen, setIsTarikModalOpen] = useState(false);
  const [isGuruModalOpen, setIsGuruModalOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [guruToEdit, setGuruToEdit] = useState<Guru | null>(null);
  const { t } = useTranslation();
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (guru && guru.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const viewId = searchParams.get('viewId');
      if (viewId) {
        const item = guru.find((g: any) => g.id === viewId);
        if (item) {
          setGuruToEdit(item as Guru);
          setIsGuruModalOpen(true);
          searchParams.delete('viewId');
          navigate({ search: searchParams.toString() }, { replace: true });
        }
      }
    }
  }, [guru, location.search, navigate]);

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/master-data/guru/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      alert('Berhasil menghapus semua data guru');
      setIsConfirmDeleteAllOpen(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Gagal menghapus semua data guru');
      setIsConfirmDeleteAllOpen(false);
    }
  });

  const handleCreate = () => {
    setGuruToEdit(null);
    setIsGuruModalOpen(true);
  };

  const handleEdit = (item: Guru) => {
    setGuruToEdit(item);
    setIsGuruModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data guru ini secara permanen?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => alert(t('common.delete_success')),
        onError: (error: any) => {
          if (error.response?.status === 400 || error.response?.data?.code?.startsWith('P2')) {
            alert(t('common.delete_constraint_failed'));
          } else {
            alert(error.response?.data?.message || t('common.delete_failed'));
          }
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{t('guru.title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('guru.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && guru && guru.length > 0 && (
            <button 
              onClick={() => setIsConfirmDeleteAllOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </button>
          )}
          {(user?.scope === 'CABANG' || user?.scope === 'WILAYAH') && (
            <button 
              onClick={() => setIsTarikModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t('guru.tarik_btn')}
            </button>
          )}
          <button onClick={handleCreate} className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            {t('guru.add_button')}
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
        ) : guru && guru.length > 0 ? (<>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('guru.name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('guru.form.jabatan')}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {(Array.isArray(guru) ? guru : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        item.position === 'Kepala Cabang' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.position || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 shadow-sm text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mr-2"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        {t('guru.form.edit_btn')}
                      </button>
                      <button
                        onClick={() => setGuruToLepas(item)}
                        className="inline-flex items-center px-3 py-1.5 border border-amber-200 shadow-sm text-xs font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors mr-2"
                      >
                        <UserMinus className="h-3.5 w-3.5 mr-1" />
                        {t('guru.form.lepas_btn')}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-200 shadow-sm text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((guru?.length || 0) / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={guru?.length || 0} 
            itemsPerPage={itemsPerPage} 
          />
        </>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
              <UserCheck className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800">{t('guru.no_data_title')}</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
              {t('guru.no_data_desc')}
            </p>
          </div>
        )}
      </div>

      {guruToLepas && (
        <LepasGuruModal
          guru={guruToLepas}
          onClose={() => setGuruToLepas(null)}
        />
      )}

      {isTarikModalOpen && (
        <TarikGuruMassalModal
          onClose={() => setIsTarikModalOpen(false)}
        />
      )}

      {isGuruModalOpen && (
        <GuruModal
          guru={guruToEdit}
          onClose={() => setIsGuruModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={() => deleteAllMutation.mutate()}
        title="Konfirmasi Hapus Semua Guru"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data guru? Aksi ini akan menghapus data guru secara permanen."
      />
    </div>
  );
}
