import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Building2, Plus, Edit2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Users, GraduationCap, Home, Send, FileText, X, Filter, Sparkles, MapPin, Download
} from 'lucide-react';
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

  // Overall Summary KPI Stats
  const summaryStats = useMemo(() => {
    if (!cabang || !Array.isArray(cabang)) return { totalCabang: 0, totalSantri: 0, totalPersonel: 0, totalKapasitas: 0 };
    
    let totalSantri = 0;
    let totalPersonel = 0;
    let totalKapasitas = 0;

    cabang.forEach(c => {
      totalSantri += c.siswaStats?.totalSiswa || c._count?.students || 0;
      totalPersonel += (c.personel?.totalLK || 0) + (c.personel?.totalPR || 0);
      totalKapasitas += c.kapasitasSantri || 0;
    });

    return {
      totalCabang: cabang.length,
      totalSantri,
      totalPersonel,
      totalKapasitas
    };
  }, [cabang]);

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
        (c.nameGlodemy || '').toLowerCase().includes(q) ||
        (c.nameResmi || '').toLowerCase().includes(q) ||
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
        aVal = (a.nameGlodemy || a.name).toLowerCase();
        bVal = (b.nameGlodemy || b.name).toLowerCase();
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
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 ml-1 inline opacity-60" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3.5 h-3.5 text-emerald-700 ml-1 inline font-bold" /> : 
      <ArrowDown className="w-3.5 h-3.5 text-emerald-700 ml-1 inline font-bold" />;
  };

  const renderVal = (val: number | undefined, isHighlight: boolean = false) => {
    if (!val || val === 0) return <span className="text-slate-300 font-normal">0</span>;
    return <span className={`font-semibold ${isHighlight ? 'text-indigo-900' : 'text-slate-800'}`}>{val}</span>;
  };

  const handleExportXLSX = () => {
    if (!filteredAndSortedCabang || filteredAndSortedCabang.length === 0) {
      showToast('error', 'Tidak ada data cabang untuk di-export');
      return;
    }

    const exportData = filteredAndSortedCabang.map((item, idx) => {
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

      return {
        'NO': idx + 1,
        'Wilayah': item.wilayah?.name || '-',
        'Nama Cabang (Glodemy)': item.nameGlodemy || item.name,
        'Nama Cabang (Resmi)': item.nameResmi || item.name,
        'Jenis': 'Muadalah',
        'Alamat': alamatFull,
        'Pimpinan Cabang': item.pimpinanCabang || '-',
        'PJ. Muadalah': item.pjMuadalah || '-',
        'Pendidik LK': p.pendidikLK,
        'Pendidik PR': p.pendidikPR,
        'Kependidikan LK': p.kependidikanLK,
        'Kependidikan PR': p.kependidikanPR,
        'Total Personel LK': p.totalLK,
        'Total Personel PR': p.totalPR,
        'Guru Matematika': p.guruMatematika,
        'Guru B. Indonesia': p.guruIndo,
        'Guru B. Inggris': p.guruInggris,
        'Guru IPA': p.guruIpa,
        'Guru PKN': p.guruPkn,
        'Total Guru Mapel': p.totalGuruMapel,
        'Status Tanah': item.statusTanah || '-',
        'Status Bangunan': item.statusBangunan || '-',
        'Kapasitas': item.kapasitasSantri || 0,
        'Total Siswa': s.totalSiswa,
        'Hazirlik': s.grup.hazirlik,
        'Hafizlik': s.grup.hafizlik,
        'Ibtidai': s.grup.ibtidai,
        'Ihzari': s.grup.ihzari,
        'Tingkat 7': s.tingkat.tingkat7,
        'Tingkat 8': s.tingkat.tingkat8,
        'Tingkat 9': s.tingkat.tingkat9,
        'Tingkat 10': s.tingkat.tingkat10,
        'Tingkat 11': s.tingkat.tingkat11,
        'Tingkat 12': s.tingkat.tingkat12,
        'Lulus': s.tingkat.lulus,
        'Sekolah Lain': s.tingkat.sekolahLain,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Cabang');
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    XLSX.writeFile(workbook, `Data_Cabang_Pesantren_${dateStr}.xlsx`);
    showToast('success', 'Data Cabang berhasil di-export ke XLSX');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            {t('cabang.title') || 'Data Cabang Pesantren'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Rekapitulasi komprehensif identitas, personel, sarana prasarana, dan jumlah siswa per cabang</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleExportXLSX}
            className="inline-flex items-center justify-center px-4 py-2 border border-emerald-300 shadow-sm text-sm font-semibold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <Download className="w-4 h-4 mr-2 text-emerald-600" />
            Export XLSX
          </button>
          <button 
            onClick={() => setIsHulasaModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
            {t('cabang.hulasa') || 'Hulasa Rekap'}
          </button>
          {user?.scope === 'WILAYAH' && (
            <button 
              onClick={() => setIsAjukanModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {t('permohonan.ajukan_cabang') || 'Ajukan Cabang Baru'}
            </button>
          )}
          {isAdmin && (
            <>
              <button 
                onClick={confirmDeleteAll}
                className="inline-flex items-center justify-center px-4 py-2 border border-rose-200 shadow-sm text-sm font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete_all') || 'Hapus Semua'}
              </button>
              <button 
                onClick={handleAdd}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-indigo-200 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('cabang.add_button') || 'Tambah Cabang'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cabang</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.totalCabang}</div>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Santri</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{summaryStats.totalSantri.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Personel</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{summaryStats.totalPersonel.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kapasitas Daya Tampung</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{summaryStats.totalKapasitas.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Home className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tab */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('cabang')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'cabang'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" /> {t('cabang.tab_data') || 'Data Cabang Lengkap'}
          </button>
          <button
            onClick={() => setActiveTab('permohonan')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'permohonan'
                ? 'border-indigo-600 text-indigo-600'
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar: Search & Filter */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('cabang.search_placeholder') || 'Cari nama cabang, wilayah, atau alamat...'}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {isAdmin && (
              <div className="w-full sm:w-auto flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter Wilayah:
                </span>
                <select
                  className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
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

          {/* Premium Modern Table */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              {t('common.loading')}
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-rose-500 text-sm font-medium">{t('common.error_loading')}</div>
          ) : filteredAndSortedCabang.length > 0 ? (
            <>
              <div className="overflow-x-auto relative">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="sticky top-0 z-10 bg-white font-bold uppercase tracking-wider text-slate-800 text-center select-none shadow-xs">
                    {/* Row 1: Category Header Badges */}
                    <tr className="border-b border-slate-200">
                      <th rowSpan={3} className="px-3 py-2.5 bg-slate-100 text-slate-600 w-12 sticky left-0 z-20 shadow-xs">NO</th>
                      
                      <th colSpan={5} className="px-3 py-2.5 bg-emerald-50 text-emerald-950 font-bold tracking-wide">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/90 text-emerald-950 border border-emerald-200/80">
                          <Building2 className="w-3.5 h-3.5" /> IDENTITAS PESANTREN
                        </span>
                      </th>
                      
                      <th colSpan={14} className="px-3 py-2.5 bg-purple-50 text-purple-950 font-bold tracking-wide">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100/90 text-purple-950 border border-purple-200/80">
                          <Users className="w-3.5 h-3.5" /> PERSONEL
                        </span>
                      </th>
                      
                      <th colSpan={3} className="px-3 py-2.5 bg-amber-50 text-amber-950 font-bold tracking-wide">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/90 text-amber-950 border border-amber-200/80">
                          <Home className="w-3.5 h-3.5" /> SARANA - PRASARANA
                        </span>
                      </th>
                      
                      <th colSpan={13} className="px-3 py-2.5 bg-sky-50 text-sky-950 font-bold tracking-wide">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-100/90 text-sky-950 border border-sky-200/80">
                          <GraduationCap className="w-3.5 h-3.5" /> JUMLAH SISWA
                        </span>
                      </th>
                      
                      <th rowSpan={3} className="px-4 py-2.5 bg-slate-100 text-slate-600 w-24">AKSI</th>
                    </tr>

                    {/* Row 2: Sub-group Headers */}
                    <tr className="border-b border-slate-200 text-[11px]">
                      {/* Identitas Pesantren */}
                      <th rowSpan={2} className="px-3 py-2 bg-emerald-50/60 text-emerald-900 cursor-pointer hover:bg-emerald-100/70 transition-colors" onClick={() => toggleSort('wilayah')}>
                        Wilayah <SortIcon field="wilayah" />
                      </th>
                      <th rowSpan={2} className="px-3 py-2 bg-emerald-50/60 text-emerald-900 cursor-pointer hover:bg-emerald-100/70 transition-colors" onClick={() => toggleSort('name')}>
                        Nama Cabang (Glodemy) <SortIcon field="name" />
                      </th>
                      <th rowSpan={2} className="px-3 py-2 bg-emerald-50/60 text-emerald-900">Nama Cabang (Resmi)</th>
                      <th rowSpan={2} className="px-3 py-2 bg-emerald-50/60 text-emerald-900">Jenis</th>
                      <th rowSpan={2} className="px-3 py-2 bg-emerald-50/60 text-emerald-900 min-w-[200px]">Alamat</th>

                      {/* Personel */}
                      <th rowSpan={2} className="px-3 py-2 bg-purple-50/60 text-purple-900">Pimpinan Cabang</th>
                      <th rowSpan={2} className="px-3 py-2 bg-purple-50/60 text-purple-900">PJ. Muadalah</th>
                      <th colSpan={2} className="px-2 py-1.5 bg-purple-50/60 text-purple-900">Jumlah Tenaga Pendidik</th>
                      <th colSpan={2} className="px-2 py-1.5 bg-purple-50/60 text-purple-900">Jumlah Tenaga Kependidikan</th>
                      <th colSpan={2} className="px-2 py-1.5 bg-purple-50/60 text-purple-900">TOTAL</th>
                      <th colSpan={6} className="px-2 py-1.5 bg-purple-50/60 text-purple-900">Guru Pelajaran Umum</th>

                      {/* Sarana Prasarana */}
                      <th rowSpan={2} className="px-3 py-2 bg-amber-50/60 text-amber-900">Status Tanah</th>
                      <th rowSpan={2} className="px-3 py-2 bg-amber-50/60 text-amber-900">Status Bangunan</th>
                      <th rowSpan={2} className="px-3 py-2 bg-amber-50/60 text-amber-900">Kapasitas</th>

                      {/* Jumlah Siswa */}
                      <th rowSpan={2} className="px-3 py-2 bg-sky-50/60 text-sky-900">Total Siswa</th>
                      <th colSpan={4} className="px-2 py-1.5 bg-sky-50/60 text-sky-900">BERDASARKAN GRUP</th>
                      <th colSpan={8} className="px-2 py-1.5 bg-sky-50/60 text-sky-900">BERDASARKAN TINGKAT</th>
                    </tr>

                    {/* Row 3: Detail Column Headers */}
                    <tr className="border-b border-slate-200 text-[10px] bg-slate-50">
                      {/* Personel subheaders */}
                      <th className="px-2 py-1 bg-purple-50/30">LK</th>
                      <th className="px-2 py-1 bg-purple-50/30">PR</th>
                      <th className="px-2 py-1 bg-purple-50/30">LK</th>
                      <th className="px-2 py-1 bg-purple-50/30">PR</th>
                      <th className="px-2 py-1 bg-purple-50/30 font-bold">LK</th>
                      <th className="px-2 py-1 bg-purple-50/30 font-bold">PR</th>
                      <th className="px-2 py-1 bg-purple-50/30">MATEMATIKA</th>
                      <th className="px-2 py-1 bg-purple-50/30">B. INDONESIA</th>
                      <th className="px-2 py-1 bg-purple-50/30">B. INGGRIS</th>
                      <th className="px-2 py-1 bg-purple-50/30">IPA</th>
                      <th className="px-2 py-1 bg-purple-50/30">PKN</th>
                      <th className="px-2 py-1 bg-purple-50/30 font-bold">TOTAL</th>

                      {/* Siswa Grup subheaders */}
                      <th className="px-2 py-1 bg-sky-50/30">HAZIRLIK</th>
                      <th className="px-2 py-1 bg-sky-50/30">HAFIZLIK</th>
                      <th className="px-2 py-1 bg-sky-50/30">IBTIDAI</th>
                      <th className="px-2 py-1 bg-sky-50/30">IHZARI</th>

                      {/* Siswa Tingkat subheaders */}
                      <th className="px-2 py-1 bg-sky-50/30">7</th>
                      <th className="px-2 py-1 bg-sky-50/30">8</th>
                      <th className="px-2 py-1 bg-sky-50/30">9</th>
                      <th className="px-2 py-1 bg-sky-50/30">10</th>
                      <th className="px-2 py-1 bg-sky-50/30">11</th>
                      <th className="px-2 py-1 bg-sky-50/30">12</th>
                      <th className="px-2 py-1 bg-sky-50/30">LULUS</th>
                      <th className="px-2 py-1 bg-sky-50/30">SEKOLAH LAIN</th>
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
                        <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="px-3 py-2.5 text-center font-medium text-slate-400 bg-slate-50/40 sticky left-0 z-10 shadow-xs">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          {/* Identitas Pesantren */}
                          <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">{item.wilayah?.name || '-'}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">{item.nameGlodemy || item.name}</td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{item.nameResmi || item.name}</td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                              Muadalah
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate" title={alamatFull}>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {alamatFull}
                            </span>
                          </td>

                          {/* Personel */}
                          <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap font-medium">{item.pimpinanCabang || '-'}</td>
                          <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap font-medium">{item.pjMuadalah || '-'}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.pendidikLK)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.pendidikPR)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.kependidikanLK)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.kependidikanPR)}</td>
                          <td className="px-2 py-2.5 text-center bg-purple-50/60">{renderVal(p.totalLK, true)}</td>
                          <td className="px-2 py-2.5 text-center bg-purple-50/60">{renderVal(p.totalPR, true)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.guruMatematika)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.guruIndo)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.guruInggris)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.guruIpa)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(p.guruPkn)}</td>
                          <td className="px-2 py-2.5 text-center bg-slate-100/70 font-bold">{renderVal(p.totalGuruMapel, true)}</td>

                          {/* Sarana Prasarana */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">{item.statusTanah || '-'}</td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">{item.statusBangunan || '-'}</td>
                          <td className="px-3 py-2.5 text-center font-semibold text-slate-800">{item.kapasitasSantri || 0}</td>

                          {/* Jumlah Siswa */}
                          <td className="px-3 py-2.5 text-center bg-blue-50/60">{renderVal(s.totalSiswa, true)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.grup.hazirlik)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.grup.hafizlik)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.grup.ibtidai)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.grup.ihzari)}</td>

                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.tingkat7)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.tingkat8)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.tingkat9)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.tingkat10)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.tingkat11)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.tingkat12)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.lulus)}</td>
                          <td className="px-2 py-2.5 text-center">{renderVal(s.tingkat.sekolahLain)}</td>

                          {/* Aksi */}
                          <td className="px-3 py-2.5 text-center font-medium whitespace-nowrap">
                            <button 
                              onClick={() => setProfileCabangId(item.id)} 
                              className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-all inline-flex items-center gap-1 shadow-2xs"
                            >
                              {t('cabang.profile') || 'Profil'}
                            </button>
                            {isAdmin && (
                              <div className="inline-flex items-center ml-2 space-x-1">
                                <button onClick={() => handleEdit(item)} title="Edit Cabang" className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => confirmDelete(item.id)} title="Hapus Cabang" className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors">
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
              <h3 className="text-sm font-medium text-slate-800">{t('cabang.no_data') || 'Belum Ada Data Cabang'}</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
                {t('cabang.no_data_desc') || 'Data cabang belum ditambahkan atau tidak sesuai dengan kata kunci pencarian.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CabangModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cabangToEdit={cabangToEdit}
      />

      {isHulasaModalOpen && (
        <HulasaCabangModal 
          isOpen={isHulasaModalOpen}
          onClose={() => setIsHulasaModalOpen(false)}
          cabangList={cabang}
        />
      )}

      {profileCabangId && (
        <ProfileCabangModal
          cabangId={profileCabangId}
          onClose={() => setProfileCabangId(null)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title={t('cabang.confirm_delete_title') || 'Konfirmasi Hapus Cabang'}
        message={t('cabang.confirm_delete_message') || 'Apakah Anda yakin ingin menghapus cabang ini?'}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={executeDeleteAll}
        title={t('common.confirm_delete_all_title') || 'Konfirmasi Hapus Semua Cabang'}
        message={t('common.confirm_delete_all_message') || 'Apakah Anda yakin ingin menghapus SEMUA data cabang? Aksi ini tidak dapat dibatalkan.'}
      />

      {isAjukanModalOpen && (
        <PermohonanCabangModal
          isOpen={isAjukanModalOpen}
          onClose={() => setIsAjukanModalOpen(false)}
        />
      )}
    </div>
  );
}
