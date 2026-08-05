import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Building2, Plus, Edit2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Users, GraduationCap, Home, Send, FileText, X, Filter, Sparkles, MapPin, Download,
  UserCheck, Shield, Award, Target, FileSpreadsheet, Upload, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useGetCabang, useGetWilayah, Cabang } from '../../features/core_data/hooks/useMasterData';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import CabangModal from '../../features/core_data/components/CabangModal';
import HulasaCabangModal from '../../features/core_data/components/HulasaCabangModal';
import { ProfileCabangModal } from '../../features/core_data/components/ProfileCabangModal';
import EditTargetKuotaModal from '../../features/core_data/components/EditTargetKuotaModal';
import ImportTargetKuotaModal from '../../features/core_data/components/ImportTargetKuotaModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

import PermohonanCabangModal from '../../features/permohonan/PermohonanCabangModal';
import PermohonanCabangTab from '../../features/permohonan/PermohonanCabangTab';

type SubTab = 'identitas' | 'personel' | 'sarpras' | 'jumlah_siswa';

export default function DataCabang() {
  const [activeTab, setActiveTab] = useState<'cabang' | 'permohonan'>('cabang');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('identitas');
  const [isAjukanModalOpen, setIsAjukanModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: cabang, isLoading, isError } = useGetCabang();
  const { data: wilayahList = [] } = useGetWilayah();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHulasaModalOpen, setIsHulasaModalOpen] = useState(false);
  const [cabangToEdit, setCabangToEdit] = useState<Cabang | null>(null);
  const [profileCabangId, setProfileCabangId] = useState<string | null>(null);

  // Target Kuota Modals State
  const [targetCabangToEdit, setTargetCabangToEdit] = useState<Cabang | null>(null);
  const [isImportTargetModalOpen, setIsImportTargetModalOpen] = useState(false);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [cabangToDelete, setCabangToDelete] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'wilayah'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Advanced Filter States
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [filterStatusTanah, setFilterStatusTanah] = useState('ALL');
  const [filterStatusBangunan, setFilterStatusBangunan] = useState('ALL');
  const [filterKeterisian, setFilterKeterisian] = useState('ALL'); // ALL | HIGH (>=90%) | MED (50-89%) | LOW (<50%)
  const [filterPersonel, setFilterPersonel] = useState('ALL'); // ALL | HAS_STAFF | NO_STAFF

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

  // Summary KPI Stats
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterWilayah !== 'ALL') count++;
    if (filterStatusTanah !== 'ALL') count++;
    if (filterStatusBangunan !== 'ALL') count++;
    if (filterKeterisian !== 'ALL') count++;
    if (filterPersonel !== 'ALL') count++;
    return count;
  }, [filterWilayah, filterStatusTanah, filterStatusBangunan, filterKeterisian, filterPersonel]);

  const resetAdvancedFilters = () => {
    setFilterWilayah('ALL');
    setFilterStatusTanah('ALL');
    setFilterStatusBangunan('ALL');
    setFilterKeterisian('ALL');
    setFilterPersonel('ALL');
    setSearchQuery('');
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/master-data/cabang/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'cabang'] });
      showToast('success', t('common.delete_success'));
    },
    onError: (error: any) => {
      showToast('error', error?.response?.data?.message || 'Gagal menghapus cabang');
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/master-data/cabang/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'cabang'] });
      showToast('success', 'Seluruh data cabang berhasil dihapus');
    },
    onError: (error: any) => {
      showToast('error', error?.response?.data?.message || 'Gagal menghapus seluruh cabang');
    }
  });

  const handleDelete = (id: string) => {
    setCabangToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if (cabangToDelete) {
      deleteMutation.mutate(cabangToDelete);
      setIsConfirmModalOpen(false);
      setCabangToDelete(null);
    }
  };

  // Filter & Sort
  const filteredAndSortedCabang = useMemo(() => {
    if (!cabang || !Array.isArray(cabang)) return [];

    let result = [...cabang];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.nameGlodemy || '').toLowerCase().includes(q) ||
        (c.nameResmi || '').toLowerCase().includes(q) ||
        (c.wilayah?.name || '').toLowerCase().includes(q)
      );
    }

    // Filter Wilayah
    if (filterWilayah !== 'ALL') {
      result = result.filter(c => c.wilayah?.id === filterWilayah);
    }

    // Filter Status Tanah
    if (filterStatusTanah !== 'ALL') {
      result = result.filter(c => (c.statusTanah || '').toLowerCase().includes(filterStatusTanah.toLowerCase()));
    }

    // Filter Status Bangunan
    if (filterStatusBangunan !== 'ALL') {
      result = result.filter(c => (c.statusBangunan || '').toLowerCase().includes(filterStatusBangunan.toLowerCase()));
    }

    // Filter Personel
    if (filterPersonel !== 'ALL') {
      result = result.filter(c => {
        const totalP = (c.personel?.totalLK || 0) + (c.personel?.totalPR || 0);
        return filterPersonel === 'HAS_STAFF' ? totalP > 0 : totalP === 0;
      });
    }

    // Filter Level Keterisian Kuota
    if (filterKeterisian !== 'ALL') {
      result = result.filter(c => {
        const realisasi = c.siswaStats?.totalSiswa || c._count?.students || 0;
        const target = c.kapasitasSantri || 0;
        if (!target || target === 0) return filterKeterisian === 'LOW';
        const pct = (realisasi / target) * 100;
        if (filterKeterisian === 'HIGH') return pct >= 90;
        if (filterKeterisian === 'MED') return pct >= 50 && pct < 90;
        if (filterKeterisian === 'LOW') return pct < 50;
        return true;
      });
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
  }, [cabang, searchQuery, filterWilayah, filterStatusTanah, filterStatusBangunan, filterKeterisian, filterPersonel, sortField, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterWilayah, filterStatusTanah, filterStatusBangunan, filterKeterisian, filterPersonel, sortField, sortDirection, activeSubTab]);

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

  const renderTargetCell = (realisasi: number, target: number) => {
    if (!target || target === 0) {
      return (
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800">{realisasi}</span>
          <span className="text-[10px] text-slate-400 font-normal">/ 0</span>
        </div>
      );
    }
    const pct = Math.round((realisasi / target) * 100);
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (pct >= 90) color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    else if (pct >= 50) color = 'bg-amber-50 text-amber-800 border-amber-200';
    else color = 'bg-rose-50 text-rose-800 border-rose-200';

    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="font-semibold text-slate-800 text-xs">
          <span className="font-bold">{realisasi}</span> <span className="text-slate-400 font-normal">/ {target}</span>
        </div>
        <span className={`inline-flex px-1.5 py-0.2 text-[10px] font-bold rounded-full border ${color}`}>
          {pct}%
        </span>
      </div>
    );
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
      const t = item.targetKuota || {
        targetHazirlik: 0, targetHafizlik: 0, targetIbtidai: 0, targetIhzari: 0,
        targetTingkat7: 0, targetTingkat8: 0, targetTingkat9: 0, targetTingkat10: 0, targetTingkat11: 0, targetTingkat12: 0
      };

      return {
        'NO': idx + 1,
        'Wilayah': item.wilayah?.name || '-',
        'Nama Cabang (Glodemy)': item.nameGlodemy || item.name,
        'Nama Cabang (Resmi)': item.nameResmi || item.name,
        'Alamat': alamatFull,
        'Pimpinan Cabang': item.pimpinanCabang || '-',
        'PJ Muadalah': item.pjMuadalah || '-',
        'Total Siswa (Realisasi)': s.totalSiswa,
        'Kapasitas Santri': item.kapasitasSantri || 0,
        'Wustha - Tingkat 7 (Realisasi/Target)': `${s.tingkat.tingkat7} / ${t.targetTingkat7}`,
        'Wustha - Tingkat 8 (Realisasi/Target)': `${s.tingkat.tingkat8} / ${t.targetTingkat8}`,
        'Wustha - Tingkat 9 (Realisasi/Target)': `${s.tingkat.tingkat9} / ${t.targetTingkat9}`,
        'Ulya - Tingkat 10 (Realisasi/Target)': `${s.tingkat.tingkat10} / ${t.targetTingkat10}`,
        'Ulya - Tingkat 11 (Realisasi/Target)': `${s.tingkat.tingkat11} / ${t.targetTingkat11}`,
        'Ulya - Tingkat 12 (Realisasi/Target)': `${s.tingkat.tingkat12} / ${t.targetTingkat12}`,
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
      {/* ── HEADER HALAMAN & TAB UTAMA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" /> Data Cabang Pesantren
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manajemen data kelembagaan cabang, personel, sarana prasarana, dan target kuota santri.
          </p>
        </div>

        {user?.scope !== 'AUDITOR' && (
          <div className="flex items-center gap-2">
            {user?.scope === 'WILAYAH' && (
              <button
                onClick={() => setIsAjukanModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Ajukan Pendirian Cabang
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => { setCabangToEdit(null); setIsModalOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Cabang Baru
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MAIN TABS NAVIGATION (Data Cabang vs Permohonan Pendirian) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cabang')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'cabang'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Data Cabang Pesantren ({summaryStats.totalCabang})
        </button>

        <button
          onClick={() => setActiveTab('permohonan')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'permohonan'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Permohonan Pendirian Cabang
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      {activeTab === 'permohonan' ? (
        <PermohonanCabangTab isAdmin={isAdmin} />
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Cabang</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.totalCabang}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Santri</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.totalSantri}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Total Personel</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.totalPersonel}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Total Kapasitas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summaryStats.totalKapasitas}</p>
            </div>
          </div>

          {/* ── SUB-TABS NAVIGATION (Identitas, Personel, Sarpras, Jumlah Siswa & Target) ── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              
              {/* Sub-Tab Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
                <button
                  onClick={() => setActiveSubTab('identitas')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'identitas'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Identitas Pesantren
                </button>

                <button
                  onClick={() => setActiveSubTab('personel')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'personel'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Personel & Guru
                </button>

                <button
                  onClick={() => setActiveSubTab('sarpras')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'sarpras'
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" /> Sarana Prasarana
                </button>

                <button
                  onClick={() => setActiveSubTab('jumlah_siswa')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'jumlah_siswa'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" /> Jumlah & Target Siswa
                </button>
              </div>

              {/* Action Buttons for Export & Target Excel */}
              <div className="flex items-center gap-2 flex-wrap">
                {activeSubTab === 'jumlah_siswa' && isAdmin && (
                  <button
                    onClick={() => setIsImportTargetModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Import Target Excel
                  </button>
                )}

                <button
                  onClick={handleExportXLSX}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" /> Export Excel
                </button>
              </div>
            </div>

            {/* ── FILTER SEARCH & ADVANCED FILTER TOGGLE ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama cabang atau wilayah..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Filter Lanjutan Button */}
                <button
                  onClick={() => setIsAdvancedFilterOpen((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
                    activeFilterCount > 0
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Filter Lanjutan</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  {isAdvancedFilterOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Menampilkan <strong className="text-slate-800">{filteredAndSortedCabang.length} dari {cabang?.length || 0} cabang</strong></span>
              </div>
            </div>

            {/* ── ADVANCED FILTER COLLAPSIBLE PANEL ── */}
            {isAdvancedFilterOpen && (
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" /> Parameter Filter Lanjutan
                  </span>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetAdvancedFilters}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Filter
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  {/* Filter Wilayah */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Wilayah</label>
                    <select
                      value={filterWilayah}
                      onChange={(e) => setFilterWilayah(e.target.value)}
                      className="w-full px-3 py-1.5 font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="ALL">Semua Wilayah</option>
                      {wilayahList.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Status Tanah */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Lahan/Tanah</label>
                    <select
                      value={filterStatusTanah}
                      onChange={(e) => setFilterStatusTanah(e.target.value)}
                      className="w-full px-3 py-1.5 font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="ALL">Semua Status Tanah</option>
                      <option value="SHM">Milik Sendiri / SHM</option>
                      <option value="Wakaf">Wakaf</option>
                      <option value="Sewa">Sewa / Kontrak</option>
                      <option value="Hibah">Hibah</option>
                    </select>
                  </div>

                  {/* Filter Status Bangunan */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Bangunan</label>
                    <select
                      value={filterStatusBangunan}
                      onChange={(e) => setFilterStatusBangunan(e.target.value)}
                      className="w-full px-3 py-1.5 font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="ALL">Semua Status Bangunan</option>
                      <option value="Milik Sendiri">Milik Sendiri</option>
                      <option value="Sewa">Sewa / Pinjam</option>
                      <option value="Menumpang">Menumpang / Temporary</option>
                    </select>
                  </div>

                  {/* Filter Keterisian Kuota */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tingkat Keterisian Kuota</label>
                    <select
                      value={filterKeterisian}
                      onChange={(e) => setFilterKeterisian(e.target.value)}
                      className="w-full px-3 py-1.5 font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="ALL">Semua Level Kuota</option>
                      <option value="HIGH">🟢 Hampir Full / Full (≥90%)</option>
                      <option value="MED">🟡 Terisi Sedang (50 - 89%)</option>
                      <option value="LOW">🔴 Di Bawah Target (&lt;50%)</option>
                    </select>
                  </div>

                  {/* Filter Personel */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ketersediaan Personel</label>
                    <select
                      value={filterPersonel}
                      onChange={(e) => setFilterPersonel(e.target.value)}
                      className="w-full px-3 py-1.5 font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="ALL">Semua Status Personel</option>
                      <option value="HAS_STAFF">Sudah Ada Personel</option>
                      <option value="NO_STAFF">Belum Ada Personel</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── TABLE CONTAINER (Dynamic per SubTab) ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  {/* SUB-TAB 1: IDENTITAS PESANTREN */}
                  {activeSubTab === 'identitas' && (
                    <tr>
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('name')}>
                        Nama Cabang <SortIcon field="name" />
                      </th>
                      <th className="py-3 px-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('wilayah')}>
                        Wilayah <SortIcon field="wilayah" />
                      </th>
                      <th className="py-3 px-3">Alamat Lengkap</th>
                      <th className="py-3 px-3">Pimpinan Cabang</th>
                      <th className="py-3 px-3">PJ Muadalah</th>
                      <th className="py-3 px-3">Status Lahan & Gedung</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  )}

                  {/* SUB-TAB 2: PERSONEL & GURU */}
                  {activeSubTab === 'personel' && (
                    <tr>
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3">Nama Cabang</th>
                      <th className="py-3 px-3 text-center">Pendidik (LK/PR)</th>
                      <th className="py-3 px-3 text-center">Kependidikan (LK/PR)</th>
                      <th className="py-3 px-3 text-center">Guru Mapel (Mtk/Ind/Ing/IPA/PKn)</th>
                      <th className="py-3 px-3 text-center">Total Personel</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  )}

                  {/* SUB-TAB 3: SARANA PRASARANA */}
                  {activeSubTab === 'sarpras' && (
                    <tr>
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3">Nama Cabang</th>
                      <th className="py-3 px-3 text-center">Kapasitas Santri</th>
                      <th className="py-3 px-3 text-center">Status Bangunan</th>
                      <th className="py-3 px-3 text-center">Status Tanah</th>
                      <th className="py-3 px-3 text-center">Foto Fisik (Plang/Gedung/Mushala/Kelas)</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  )}

                  {/* SUB-TAB 4: JUMLAH SISWA & TARGET KUOTA */}
                  {activeSubTab === 'jumlah_siswa' && (
                    <>
                      <tr className="border-b border-slate-200">
                        <th rowSpan={2} className="py-2.5 px-3 text-center w-12 bg-slate-100/90 text-slate-700 font-bold border-r border-slate-200 align-middle">No</th>
                        <th rowSpan={2} className="py-2.5 px-3 bg-slate-100/90 text-slate-700 font-bold border-r border-slate-200 align-middle">Nama Cabang</th>
                        <th colSpan={3} className="py-2 px-3 text-center bg-sky-600 text-white font-bold tracking-wide border-r border-sky-500 shadow-2xs">
                          WUSTHA (TINGKAT 7 - 9)
                        </th>
                        <th colSpan={3} className="py-2 px-3 text-center bg-emerald-600 text-white font-bold tracking-wide border-r border-emerald-500 shadow-2xs">
                          ULYA (TINGKAT 10 - 12)
                        </th>
                        <th rowSpan={2} className="py-2.5 px-3 text-center bg-indigo-100/90 text-indigo-950 font-bold border-r border-indigo-200 align-middle">
                          Total Siswa / Kapasitas
                        </th>
                        <th rowSpan={2} className="py-2.5 px-3 text-right bg-slate-100/90 text-slate-700 font-bold align-middle">Aksi</th>
                      </tr>
                      <tr>
                        <th className="py-2 px-3 text-center bg-sky-100 text-sky-950 font-bold border-r border-sky-200">Tingkat 7</th>
                        <th className="py-2 px-3 text-center bg-sky-100 text-sky-950 font-bold border-r border-sky-200">Tingkat 8</th>
                        <th className="py-2 px-3 text-center bg-sky-100 text-sky-950 font-bold border-r border-sky-300">Tingkat 9</th>
                        <th className="py-2 px-3 text-center bg-emerald-100 text-emerald-950 font-bold border-r border-emerald-200">Tingkat 10</th>
                        <th className="py-2 px-3 text-center bg-emerald-100 text-emerald-950 font-bold border-r border-emerald-200">Tingkat 11</th>
                        <th className="py-2 px-3 text-center bg-emerald-100 text-emerald-950 font-bold border-r border-emerald-300">Tingkat 12</th>
                      </tr>
                    </>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                        Memuat data cabang...
                      </td>
                    </tr>
                  ) : filteredAndSortedCabang.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data cabang yang cocok dengan parameter filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedCabang
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((item, idx) => {
                        const rowNo = (currentPage - 1) * itemsPerPage + idx + 1;
                        const p = item.personel || { pendidikLK: 0, pendidikPR: 0, kependidikanLK: 0, kependidikanPR: 0, totalLK: 0, totalPR: 0, guruMatematika: 0, guruIndo: 0, guruInggris: 0, guruIpa: 0, guruPkn: 0, totalGuruMapel: 0 };
                        const s = item.siswaStats || { totalSiswa: 0, grup: { hazirlik: 0, hafizlik: 0, ibtidai: 0, ihzari: 0 }, tingkat: { tingkat7: 0, tingkat8: 0, tingkat9: 0, tingkat10: 0, tingkat11: 0, tingkat12: 0, lulus: 0, sekolahLain: 0 } };
                        const t = item.targetKuota || { targetHazirlik: 0, targetHafizlik: 0, targetIbtidai: 0, targetIhzari: 0, targetTingkat7: 0, targetTingkat8: 0, targetTingkat9: 0, targetTingkat10: 0, targetTingkat11: 0, targetTingkat12: 0 };

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3 text-center text-slate-400 font-medium">{rowNo}</td>
                            
                            {/* NAMA CABANG & WILAYAH (Always shown in first columns) */}
                            <td className="py-3.5 px-3 font-semibold text-slate-800">
                              <button
                                onClick={() => setProfileCabangId(item.id)}
                                className="hover:text-indigo-600 text-left font-bold transition-colors cursor-pointer"
                              >
                                {item.nameGlodemy || item.name}
                              </button>
                              {item.nameResmi && item.nameResmi !== item.nameGlodemy && (
                                <p className="text-[11px] font-normal text-slate-400">{item.nameResmi}</p>
                              )}
                            </td>

                            {/* ── SUB-TAB 1: IDENTITAS ── */}
                            {activeSubTab === 'identitas' && (
                              <>
                                <td className="py-3.5 px-3 text-slate-600 font-medium">{item.wilayah?.name || '-'}</td>
                                <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                                  {[item.alamatJalan, item.alamatKecName, item.alamatKabName, item.alamatProvName].filter(Boolean).join(', ') || '-'}
                                </td>
                                <td className="py-3.5 px-3 text-slate-700 font-medium">{item.pimpinanCabang || '-'}</td>
                                <td className="py-3.5 px-3 text-slate-700 font-medium">{item.pjMuadalah || '-'}</td>
                                <td className="py-3.5 px-3 text-slate-600 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                    {item.statusBangunan || 'N/A'} / {item.statusTanah || 'N/A'}
                                  </span>
                                </td>
                              </>
                            )}

                            {/* ── SUB-TAB 2: PERSONEL ── */}
                            {activeSubTab === 'personel' && (
                              <>
                                <td className="py-3.5 px-3 text-center text-slate-700 font-semibold">
                                  {p.pendidikLK} LK / {p.pendidikPR} PR
                                </td>
                                <td className="py-3.5 px-3 text-center text-slate-700 font-semibold">
                                  {p.kependidikanLK} LK / {p.kependidikanPR} PR
                                </td>
                                <td className="py-3.5 px-3 text-center text-slate-700 text-[11px]">
                                  Mtk:{p.guruMatematika} | Ind:{p.guruIndo} | Ing:{p.guruInggris} | IPA:{p.guruIpa} | PKn:{p.guruPkn}
                                </td>
                                <td className="py-3.5 px-3 text-center font-bold text-indigo-700 text-sm">
                                  {p.totalLK + p.totalPR}
                                </td>
                              </>
                            )}

                            {/* ── SUB-TAB 3: SARPRAS ── */}
                            {activeSubTab === 'sarpras' && (
                              <>
                                <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                                  {item.kapasitasSantri || 0} Santri
                                </td>
                                <td className="py-3.5 px-3 text-center text-slate-700">{item.statusBangunan || '-'}</td>
                                <td className="py-3.5 px-3 text-center text-slate-700">{item.statusTanah || '-'}</td>
                                <td className="py-3.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {[item.fotoPlang, item.fotoGedung, item.fotoKelas, item.fotoMushala].filter(Boolean).length} / 4 Foto
                                  </span>
                                </td>
                              </>
                            )}

                            {/* ── SUB-TAB 4: JUMLAH SISWA & TARGET KUOTA ── */}
                            {activeSubTab === 'jumlah_siswa' && (
                              <>
                                {/* WUSTHA (TINGKAT 7 - 9) - Sky Blue Accent */}
                                <td className="py-3 px-3 text-center bg-sky-50/40 border-r border-sky-100">
                                  {renderTargetCell(s.tingkat.tingkat7, t.targetTingkat7)}
                                </td>
                                <td className="py-3 px-3 text-center bg-sky-50/40 border-r border-sky-100">
                                  {renderTargetCell(s.tingkat.tingkat8, t.targetTingkat8)}
                                </td>
                                <td className="py-3 px-3 text-center bg-sky-50/60 border-r border-sky-200">
                                  {renderTargetCell(s.tingkat.tingkat9, t.targetTingkat9)}
                                </td>

                                {/* ULYA (TINGKAT 10 - 12) - Emerald Green Accent */}
                                <td className="py-3 px-3 text-center bg-emerald-50/40 border-r border-emerald-100">
                                  {renderTargetCell(s.tingkat.tingkat10, t.targetTingkat10)}
                                </td>
                                <td className="py-3 px-3 text-center bg-emerald-50/40 border-r border-emerald-100">
                                  {renderTargetCell(s.tingkat.tingkat11, t.targetTingkat11)}
                                </td>
                                <td className="py-3 px-3 text-center bg-emerald-50/60 border-r border-emerald-200">
                                  {renderTargetCell(s.tingkat.tingkat12, t.targetTingkat12)}
                                </td>

                                {/* TOTAL REALISASI / KAPASITAS TARGET - Indigo Accent */}
                                <td className="py-3 px-3 text-center bg-indigo-50/50 border-r border-indigo-100 font-bold">
                                  {renderTargetCell(s.totalSiswa, item.kapasitasSantri || 0)}
                                </td>
                              </>
                            )}

                            {/* ── ACTION COLUMN (Per Sub-Tab) ── */}
                            <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                              {activeSubTab === 'jumlah_siswa' && isAdmin && (
                                <button
                                  onClick={() => setTargetCabangToEdit(item)}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                                  title="Edit Target Kuota"
                                >
                                  <Target className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => setProfileCabangId(item.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Lihat Profile Cabang"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                              </button>

                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => { setCabangToEdit(item); setIsModalOpen(true); }}
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                                    title="Edit Data Cabang"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                    title="Hapus Cabang"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredAndSortedCabang.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={filteredAndSortedCabang.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <CabangModal
        isOpen={isModalOpen}
        cabangToEdit={cabangToEdit}
        onClose={() => setIsModalOpen(false)}
      />

      {profileCabangId && (
        <ProfileCabangModal
          cabangId={profileCabangId}
          onClose={() => setProfileCabangId(null)}
        />
      )}

      {targetCabangToEdit && (
        <EditTargetKuotaModal
          cabang={targetCabangToEdit}
          onClose={() => setTargetCabangToEdit(null)}
        />
      )}

      {isImportTargetModalOpen && (
        <ImportTargetKuotaModal
          cabangList={cabang || []}
          onClose={() => setIsImportTargetModalOpen(false)}
        />
      )}

      <PermohonanCabangModal
        isOpen={isAjukanModalOpen}
        onClose={() => setIsAjukanModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus Cabang"
        message="Apakah Anda yakin ingin menghapus cabang ini? Seluruh data terikat akan terhapus."
      />
    </div>
  );
}
