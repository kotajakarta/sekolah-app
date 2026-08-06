import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit2, Trash2, Loader2, Upload, Search, Filter, X, ShieldCheck, ShieldOff, Key } from 'lucide-react';
import Pagination from '../../components/Pagination';
import UserModal from './UserModal';
import ConfirmModal from '../../components/ConfirmModal';
import ImportUserModal from './ImportUserModal';
import { useToast } from '../../contexts/ToastContext';
import { useGetWilayah, useGetCabang } from '../../features/core_data/hooks/useMasterData';

export default function UsersWilayah() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');
  const [filterWilayahId, setFilterWilayahId] = useState('');
  const [filterCabangId, setFilterCabangId] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Master Data for Filters
  const { data: wilayahList = [] } = useGetWilayah();
  const { data: cabangList = [] } = useGetCabang();

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    }
  });

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterScope) count++;
    if (filterDivisi) count++;
    if (filterWilayahId) count++;
    if (filterCabangId) count++;
    return count;
  }, [filterScope, filterDivisi, filterWilayahId, filterCabangId]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterScope('');
    setFilterDivisi('');
    setFilterWilayahId('');
    setFilterCabangId('');
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];

    return users.filter((user: any) => {
      // 1. Search Query (username, operatorName, wilayah, cabang)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUsername = user.username?.toLowerCase().includes(q);
        const matchOperator = user.operatorName?.toLowerCase().includes(q);
        const matchWilayah = user.wilayah?.name?.toLowerCase().includes(q);
        const matchCabang = user.cabang?.name?.toLowerCase().includes(q);
        if (!matchUsername && !matchOperator && !matchWilayah && !matchCabang) {
          return false;
        }
      }

      // 2. Scope Filter
      if (filterScope && user.scope !== filterScope) {
        return false;
      }

      // 3. Divisi Filter
      if (filterDivisi && user.divisi !== filterDivisi) {
        return false;
      }

      // 4. Wilayah Filter
      if (filterWilayahId && user.wilayahId !== filterWilayahId) {
        return false;
      }

      // 5. Cabang Filter
      if (filterCabangId && user.cabangId !== filterCabangId) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, filterScope, filterDivisi, filterWilayahId, filterCabangId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterScope, filterDivisi, filterWilayahId, filterCabangId]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
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

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleEdit = (user: any) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t('admin.users_title') || 'Manajemen User'}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('admin.users_subtitle') || 'Kelola hak akses pengguna, wilayah, dan cabang'}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </button>
          <button 
            onClick={handleAdd}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah User
          </button>
        </div>
      </div>

      {/* Search & Advanced Filter Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari username, nama operator, wilayah, cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle Filter Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 border rounded-lg text-sm font-medium transition-colors shrink-0 ${
              isFilterOpen || activeFilterCount > 0
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter Lanjutan</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Scope / Role</label>
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              >
                <option value="">Semua Scope</option>
                <option value="GLOBAL">GLOBAL (Admin)</option>
                <option value="WILAYAH">WILAYAH</option>
                <option value="CABANG">CABANG</option>
                <option value="WALI">WALI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Divisi</label>
              <select
                value={filterDivisi}
                onChange={(e) => setFilterDivisi(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              >
                <option value="">Semua Divisi</option>
                <option value="ALL">ALL (Semua Divisi)</option>
                <option value="FORMAL">FORMAL</option>
                <option value="PESANTREN">PESANTREN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Wilayah</label>
              <select
                value={filterWilayahId}
                onChange={(e) => {
                  setFilterWilayahId(e.target.value);
                  setFilterCabangId('');
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              >
                <option value="">Semua Wilayah</option>
                {wilayahList.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Cabang</label>
              <select
                value={filterCabangId}
                onChange={(e) => setFilterCabangId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              >
                <option value="">Semua Cabang</option>
                {cabangList
                  .filter((c: any) => !filterWilayahId || c.wilayahId === filterWilayahId)
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>

            {(activeFilterCount > 0 || searchQuery) && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset Filter & Pencarian
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Username</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Nama Operator</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Scope</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Divisi</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Wilayah</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status 2FA</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedUsers.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{item.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.operatorName || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider ${
                          item.scope === 'GLOBAL' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          item.scope === 'AUDITOR' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          item.scope === 'WILAYAH' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          item.scope === 'WALI' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {item.scope}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.divisi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {item.scope === 'WALI' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"
                            title={
                              (item.waliSantri ?? [])
                                .map((w: any) => w.student?.biodata?.fullName)
                                .filter(Boolean)
                                .join(', ') || 'Belum ada santri terhubung'
                            }
                          >
                            {item.waliSantri?.length ?? 0} santri
                          </span>
                        ) : (
                          item.wilayah?.name || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.cabang?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            2FA Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <ShieldOff className="w-3.5 h-3.5 text-slate-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-blue-900 mr-4 cursor-pointer" title="Edit User">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDelete(item.id)} className="text-red-600 hover:text-red-900 cursor-pointer" title="Hapus User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(filteredUsers.length / itemsPerPage)} 
              onPageChange={setCurrentPage} 
              totalItems={filteredUsers.length} 
              itemsPerPage={itemsPerPage} 
            />
          </>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800">
              {searchQuery || activeFilterCount > 0 ? 'Tidak Ada User yang Cocok' : 'Belum Ada User'}
            </h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
              {searchQuery || activeFilterCount > 0
                ? 'Coba sesuaikan kata kunci pencarian atau reset filter lanjutan Anda.'
                : 'Tambahkan user baru untuk memberikan hak akses.'}
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Reset Filter & Pencarian
              </button>
            )}
          </div>
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus user ini? Aksi ini tidak dapat dibatalkan."
      />

      {isImportModalOpen && (
        <ImportUserModal
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
}
