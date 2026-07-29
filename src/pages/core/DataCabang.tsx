import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useGetCabang, Cabang } from '../../features/core_data/hooks/useMasterData';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import CabangModal from '../../features/core_data/components/CabangModal';
import HulasaCabangModal from '../../features/core_data/components/HulasaCabangModal';
import { ProfileCabangModal } from '../../features/core_data/components/ProfileCabangModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

import PermohonanCabangModal from '../../features/permohonan/PermohonanCabangModal';
import PermohonanCabangTab from '../../features/permohonan/PermohonanCabangTab';
import { Send, FileText } from 'lucide-react';

export default function DataCabang() {
  const [activeTab, setActiveTab] = useState<'cabang' | 'permohonan'>('cabang');
  const [isAjukanModalOpen, setIsAjukanModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: cabang, isLoading, isError } = useGetCabang();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHulasaModalOpen, setIsHulasaModalOpen] = useState(false);
  const [cabangToEdit, setCabangToEdit] = useState<Cabang | null>(null);
  const [profileCabangId, setProfileCabangId] = useState<string | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [cabangToDelete, setCabangToDelete] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'wilayah'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'permohonan') {
      setActiveTab('permohonan');
    }
    if (cabang && cabang.length > 0) {
      const viewId = searchParams.get('viewId');
      if (viewId) {
        setProfileCabangId(viewId);
        searchParams.delete('viewId');
        navigate({ search: searchParams.toString() }, { replace: true });
      }
    }
  }, [cabang, location.search, navigate]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/master-data/cabang/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'cabang'] });
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
      return apiClient.delete('/master-data/cabang/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'cabang'] });
      showToast('success', t('common.delete_success'));
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || t('common.delete_failed'));
    }
  });

  const confirmDelete = (id: string) => {
    setCabangToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteAll = () => {
    setIsConfirmDeleteAllOpen(true);
  };

  const executeDelete = () => {
    if (cabangToDelete) {
      deleteMutation.mutate(cabangToDelete);
      setCabangToDelete(null);
    }
  };

  const executeDeleteAll = () => {
    deleteAllMutation.mutate();
    setIsConfirmDeleteAllOpen(false);
  };

  const handleEdit = (item: Cabang) => {
    setCabangToEdit(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setCabangToEdit(null);
    setIsModalOpen(true);
  };

  const uniqueWilayah = useMemo(() => {
    if (!cabang) return [];
    const wil = cabang.map(c => c.wilayah).filter(Boolean);
    const unique = new Map();
    wil.forEach(w => {
      if (w && !unique.has(w.id)) {
        unique.set(w.id, w);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [cabang]);

  const filteredAndSortedCabang = useMemo(() => {
    if (!cabang) return [];
    
    let result = [...cabang];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.wilayah?.name || '').toLowerCase().includes(q)
      );
    }

    // Filter by wilayah
    if (filterWilayah !== 'ALL') {
      result = result.filter(c => c.wilayah?.id === filterWilayah);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = '', bVal = '';
      if (sortField === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === 'wilayah') {
        aVal = (a.wilayah?.name || '').toLowerCase();
        bVal = (b.wilayah?.name || '').toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [cabang, searchQuery, filterWilayah, sortField, sortDirection]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterWilayah, sortField, sortDirection]);

  const toggleSort = (field: 'name' | 'wilayah') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'wilayah' }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-slate-400 ml-1 inline" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-indigo-600 ml-1 inline" /> : 
      <ArrowDown className="w-4 h-4 text-indigo-600 ml-1 inline" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{t('cabang.title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('cabang.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsHulasaModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            {t('cabang.hulasa') || 'Hulasa'}
          </button>
          {user?.scope === 'WILAYAH' && (
            <button 
              onClick={() => setIsAjukanModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {t('permohonan.ajukan_cabang') || 'Ajukan Cabang Baru'}
            </button>
          )}
          {isAdmin && (
            <>
              <button 
                onClick={confirmDeleteAll}
                className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete_all') || 'Hapus Semua'}
              </button>
              <button 
                onClick={handleAdd}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('cabang.add_button')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('cabang')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'cabang'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" /> {t('cabang.tab_data') || 'Data Cabang'}
          </button>
          <button
            onClick={() => setActiveTab('permohonan')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'permohonan'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" /> {t('permohonan.cabang_title') || 'Permohonan Cabang Baru'}
          </button>
        </nav>
      </div>

      {activeTab === 'permohonan' ? (
        <PermohonanCabangTab isAdmin={isAdmin} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar: Search & Filter */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('cabang.search_placeholder') || 'Cari cabang...'}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-blue-500 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {isAdmin && (
              <div className="w-full sm:w-auto">
                <select
                  className="w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-blue-500 bg-white"
                  value={filterWilayah}
                  onChange={(e) => setFilterWilayah(e.target.value)}
                >
                  <option value="ALL">{t('cabang.all_regions') || 'Semua Wilayah'}</option>
                  {uniqueWilayah.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">{t('common.loading')}</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500 text-sm">{t('common.error_loading')}</div>
          ) : filteredAndSortedCabang.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/50">
                      <th className="px-6 py-3 cursor-pointer select-none hover:text-slate-700" onClick={() => toggleSort('name')}>
                        {t('cabang.table.name')} <SortIcon field="name" />
                      </th>
                      <th className="px-6 py-3 cursor-pointer select-none hover:text-slate-700" onClick={() => toggleSort('wilayah')}>
                        {t('cabang.table.wilayah')} <SortIcon field="wilayah" />
                      </th>
                      <th className="px-6 py-3 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm font-sans">
                    {filteredAndSortedCabang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                        <td className="px-6 py-4 text-slate-600">{item.wilayah?.name || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setProfileCabangId(item.id)} 
                            className="text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg mr-2 transition-colors inline-flex items-center gap-1"
                          >
                            {t('cabang.profile') || 'Profil'}
                          </button>
                          {isAdmin && (
                            <>
                              <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-blue-900 mr-4">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => confirmDelete(item.id)} className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination 
                currentPage={currentPage} 
                totalPages={Math.ceil(filteredAndSortedCabang.length / itemsPerPage)} 
                onPageChange={setCurrentPage} 
                totalItems={filteredAndSortedCabang.length} 
                itemsPerPage={itemsPerPage} 
              />
            </>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
                <Building2 className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-800">{t('cabang.empty_title') || 'Tidak ada data cabang yang sesuai'}</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
                {t('cabang.empty_desc') || 'Coba sesuaikan kata kunci pencarian atau filter wilayah.'}
              </p>
            </div>
          )}
        </div>
      )}

      <PermohonanCabangModal
        isOpen={isAjukanModalOpen}
        onClose={() => setIsAjukanModalOpen(false)}
        wilayahId={user?.wilayahId}
      />

      <CabangModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cabangToEdit={cabangToEdit}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title={t('common.delete_confirm') || "Konfirmasi Hapus"}
        message={t('cabang.delete_warning') || "Apakah Anda yakin ingin menghapus data cabang ini? Aksi ini tidak dapat dibatalkan."}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={executeDeleteAll}
        title={t('cabang.confirm_delete_all_title') || "Konfirmasi Hapus Semua Cabang"}
        message={t('cabang.confirm_delete_all_msg') || "PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data cabang? Aksi ini akan menghapus seluruh data cabang secara permanen dan tidak dapat dibatalkan."}
      />

      <HulasaCabangModal 
        isOpen={isHulasaModalOpen} 
        onClose={() => setIsHulasaModalOpen(false)} 
        cabangList={cabang} 
      />

      {profileCabangId && (
        <ProfileCabangModal 
          cabangId={profileCabangId} 
          onClose={() => setProfileCabangId(null)} 
        />
      )}
    </div>
  );
}

