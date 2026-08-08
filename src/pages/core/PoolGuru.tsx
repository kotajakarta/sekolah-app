import React, { useState } from 'react';
import { useGetPoolGuru } from '../../features/core_data/hooks/usePoolGuru';
import { Database, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../hooks/useAuth';
import ConfirmModal from '../../components/ConfirmModal';
import AdvancedFilterBar, { FilterState } from '../../components/AdvancedFilterBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';

export default function PoolGuru() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const { data: guruPool, isLoading, isError } = useGetPoolGuru();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';
  const queryClient = useQueryClient();

  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    wilayahId: user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user?.wilayahId || '' : '',
    cabangId: user?.scope === 'CABANG' ? user?.cabangId || '' : '',
    kelasId: '',
    lembagaMuadalahId: ''
  });

  const filteredPoolGuru = (Array.isArray(guruPool) ? guruPool : []).filter((g: any) => {
    // Advanced filters
    if (advancedFilters.wilayahId && g.wilayahId !== advancedFilters.wilayahId) return false;
    if (advancedFilters.cabangId && g.cabangId !== advancedFilters.cabangId) return false;
    
    // Guru is connected to Kelas via guruMapelKelas
    if (advancedFilters.kelasId) {
      const hasKelas = g.guruMapelKelas?.some((asg: any) => asg.kelasId === advancedFilters.kelasId);
      if (!hasKelas) return false;
    }

    if (advancedFilters.lembagaMuadalahId) {
      const hasMuadalah = g.guruMapelKelas?.some((asg: any) => asg.kelas?.lembagaMuadalahId === advancedFilters.lembagaMuadalahId);
      if (!hasMuadalah) return false;
    }

    return true;
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/master-data/pool-guru/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pool-guru'] });
      showToast('success', t('common.delete_success') || 'Berhasil menghapus semua data pool guru');
      setIsConfirmDeleteAllOpen(false);
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || t('common.delete_failed') || 'Gagal menghapus data pool guru');
      setIsConfirmDeleteAllOpen(false);
    }
  });

  const confirmDeleteAll = () => {
    setIsConfirmDeleteAllOpen(true);
  };

  const executeDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t('pool_guru.title') || 'Data Pool Guru'}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('pool_guru.subtitle') || 'Daftar guru yang tersedia di pool untuk ditarik atau ditugaskan antar cabang.'}</p>
        </div>
        {isAdmin && guruPool && guruPool.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={confirmDeleteAll}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </button>
          </div>
        )}
      </div>
      
      <AdvancedFilterBar 
        onFilterChange={setAdvancedFilters} 
        userScope={user?.scope || ''} 
        userWilayahId={user?.wilayahId} 
        userCabangId={user?.cabangId} 
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
        ) : guruPool && guruPool.length > 0 ? (<>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('guru.name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Jabatan / Posisi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('wilayah.region_name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPoolGuru.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {item.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {item.wilayah?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {item.cabang?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        item.statusPool === 'TERSEDIA' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.statusPool}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(filteredPoolGuru.length / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={filteredPoolGuru.length} 
            itemsPerPage={itemsPerPage} 
          />
        </>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
              <Database className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800">{t('common.no_data')}</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
              Tidak ada guru di dalam pool saat ini.
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={executeDeleteAll}
        title="Konfirmasi Hapus Semua Guru di Pool"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data guru yang ada di dalam pool? Aksi ini akan menghapus data guru secara permanen dan tidak dapat dibatalkan."
      />
    </div>
  );
}
