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
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-700 text-center select-none">
                    {/* Row 1: Main Group Headers */}
                    <tr className="border-b border-slate-200">
                      <th rowSpan={3} className="px-3 py-2 border-r border-slate-200 bg-slate-100 w-12">NO</th>
                      <th colSpan={5} className="px-3 py-2 border-r border-slate-200 bg-emerald-100/90 text-emerald-950 font-bold">
                        IDENTITAS PESANTREN
                      </th>
                      <th colSpan={13} className="px-3 py-2 border-r border-slate-200 bg-purple-100/90 text-purple-950 font-bold">
                        PERSONEL
                      </th>
                      <th colSpan={3} className="px-3 py-2 border-r border-slate-200 bg-amber-100/90 text-amber-950 font-bold">
                        SARANA - PRASARANA
                      </th>
                      <th colSpan={13} className="px-3 py-2 border-r border-slate-200 bg-sky-100/90 text-sky-950 font-bold">
                        JUMLAH SISWA
                      </th>
                      <th rowSpan={3} className="px-4 py-2 border-slate-200 bg-slate-100 w-24">AKSI</th>
                    </tr>

                    {/* Row 2: Sub-group Headers */}
                    <tr className="border-b border-slate-200 text-[11px]">
                      {/* Identitas Pesantren */}
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-emerald-50 text-emerald-900 cursor-pointer hover:bg-emerald-100" onClick={() => toggleSort('wilayah')}>
                        Wilayah <SortIcon field="wilayah" />
                      </th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-emerald-50 text-emerald-900 cursor-pointer hover:bg-emerald-100" onClick={() => toggleSort('name')}>
                        Nama Cabang (Glodemy) <SortIcon field="name" />
                      </th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-emerald-50 text-emerald-900">Nama Cabang (Resmi)</th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-emerald-50 text-emerald-900">Jenis</th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-emerald-50 text-emerald-900 min-w-[180px]">Alamat</th>

                      {/* Personel */}
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-purple-50 text-purple-900">Pimpinan Cabang</th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-purple-50 text-purple-900">PJ. Muadalah</th>
                      <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 bg-purple-50 text-purple-900">Jumlah Tenaga Pendidik</th>
                      <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 bg-purple-50 text-purple-900">Jumlah Tenaga Kependidikan</th>
                      <th colSpan={2} className="px-2 py-1.5 border-r border-slate-200 bg-purple-50 text-purple-900">TOTAL</th>
                      <th colSpan={6} className="px-2 py-1.5 border-r border-slate-200 bg-purple-50 text-purple-900">Guru Pelajaran Umum</th>

                      {/* Sarana Prasarana */}
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-amber-50 text-amber-900">Status Tanah</th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-amber-50 text-amber-900">Status Bangunan</th>
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-amber-50 text-amber-900">Kapasitas</th>

                      {/* Jumlah Siswa */}
                      <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 bg-sky-50 text-sky-900">Total Siswa</th>
                      <th colSpan={4} className="px-2 py-1.5 border-r border-slate-200 bg-sky-50 text-sky-900">BERDASARKAN GRUP</th>
                      <th colSpan={8} className="px-2 py-1.5 border-r border-slate-200 bg-sky-50 text-sky-900">BERDASARKAN TINGKAT</th>
                    </tr>

                    {/* Row 3: Detail Column Headers */}
                    <tr className="border-b border-slate-200 text-[10px] bg-slate-50">
                      {/* Personel subheaders */}
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">LK</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">PR</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">LK</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">PR</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">LK</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">PR</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">MATEMATIKA</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">B. INDONESIA</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">B. INGGRIS</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">IPA</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50">PKN</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-purple-50/50 font-bold">TOTAL</th>

                      {/* Siswa Grup subheaders */}
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">HQ/TAHFIZ</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">TAHFIZ</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">IBTIDAI</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">IHZARI</th>

                      {/* Siswa Tingkat subheaders */}
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">7</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">8</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">9</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">10</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">11</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">12</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">LULUS</th>
                      <th className="px-2 py-1 border-r border-slate-200 bg-sky-50/50">SEKOLAH LAIN</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 text-xs font-sans">
                    {filteredAndSortedCabang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => {
                      const alamatFull = [item.alamatJalan, item.alamatKecName, item.alamatKabName, item.alamatProvName].filter(Boolean).join(', ') || '-';
                      const p = item.personel || {
                        pendidikLK: 0, pendidikPR: 0, kependidikanLK: 0, kependidikanPR: 0,
                        totalLK: 0, totalPR: 0, guruMatematika: 0, guruIndo: 0, guruInggris: 0,
                        guruIpa: 0, guruPkn: 0, totalGuruMapel: 0
                      };
                      const s = item.siswaStats || {
                        totalSiswa: item._count?.students || 0,
                        grup: { hazirlik: 0, hafizlik: 0, ibtidai: 0, ihzari: 0 },
                        tingkat: { tingkat7: 0, tingkat8: 0, tingkat9: 0, tingkat10: 0, tingkat11: 0, tingkat12: 0, lulus: 0, sekolahLain: 0 }
                      };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-center font-medium text-slate-400 border-r border-slate-200">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          {/* Identitas Pesantren */}
                          <td className="px-3 py-2.5 font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap">{item.wilayah?.name || '-'}</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">{item.nameGlodemy || item.name}</td>
                          <td className="px-3 py-2.5 text-slate-600 border-r border-slate-200 whitespace-nowrap">{item.nameResmi || item.name}</td>
                          <td className="px-3 py-2.5 text-center border-r border-slate-200 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Muadalah</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 border-r border-slate-200 max-w-xs truncate" title={alamatFull}>{alamatFull}</td>

                          {/* Personel */}
                          <td className="px-3 py-2.5 text-slate-700 border-r border-slate-200 whitespace-nowrap">{item.pimpinanCabang || '-'}</td>
                          <td className="px-3 py-2.5 text-slate-700 border-r border-slate-200 whitespace-nowrap">{item.pjMuadalah || '-'}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 font-medium">{p.pendidikLK}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 font-medium">{p.pendidikPR}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 font-medium">{p.kependidikanLK}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 font-medium">{p.kependidikanPR}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 font-bold text-purple-700 bg-purple-50/40">{p.totalLK}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 font-bold text-purple-700 bg-purple-50/40">{p.totalPR}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{p.guruMatematika}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{p.guruIndo}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{p.guruInggris}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{p.guruIpa}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{p.guruPkn}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200 font-bold text-slate-800 bg-slate-50">{p.totalGuruMapel}</td>

                          {/* Sarana Prasarana */}
                          <td className="px-3 py-2.5 text-center border-r border-slate-200 whitespace-nowrap">{item.statusTanah || '-'}</td>
                          <td className="px-3 py-2.5 text-center border-r border-slate-200 whitespace-nowrap">{item.statusBangunan || '-'}</td>
                          <td className="px-3 py-2.5 text-center border-r border-slate-200 font-medium">{item.kapasitasSantri || 0}</td>

                          {/* Jumlah Siswa */}
                          <td className="px-3 py-2.5 text-center border-r border-slate-200 font-bold text-blue-700 bg-blue-50/40">{s.totalSiswa}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.grup.hazirlik}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.grup.hafizlik}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.grup.ibtidai}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.grup.ihzari}</td>

                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.tingkat7}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.tingkat8}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.tingkat9}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.tingkat10}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.tingkat11}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.tingkat12}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.lulus}</td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-200">{s.tingkat.sekolahLain}</td>

                          {/* Aksi */}
                          <td className="px-3 py-2.5 text-center font-medium whitespace-nowrap">
                            <button 
                              onClick={() => setProfileCabangId(item.id)} 
                              className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 transition-colors inline-flex items-center gap-1"
                            >
                              {t('cabang.profile') || 'Profil'}
                            </button>
                            {isAdmin && (
                              <div className="inline-flex items-center ml-2">
                                <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 p-1">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => confirmDelete(item.id)} className="text-red-600 hover:text-red-900 p-1">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

