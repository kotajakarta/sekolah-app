import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Building2, Plus, Edit2, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Users, GraduationCap, Home, Send, FileText, X, Filter, Sparkles, MapPin, Download,
  UserCheck, Shield, Award, Target, FileSpreadsheet, Upload, RotateCcw, ChevronDown, ChevronUp,
  Copy, Check, ExternalLink
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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

import PermohonanCabangModal from '../../features/permohonan/PermohonanCabangModal';
import PermohonanCabangTab from '../../features/permohonan/PermohonanCabangTab';

type SubTab = 'identitas' | 'personel' | 'sarpras' | 'jumlah_siswa' | 'kelas_x_daimi';

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
  const [filterJenisDaimi, setFilterJenisDaimi] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'wilayah'>('wilayah');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch Master Jenis Grup Daimi
  const { data: jenisGrupDaimiList = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['jenis-grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/jenis-grup-daimi');
      return res.data;
    }
  });

  // Advanced Filter States
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

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

  // Helper to extract student stats per cabang based on selected Jenis Daimi filter
  const getSiswaStatsForCabang = (item: Cabang, selectedJenis: string) => {
    const base = item.siswaStats || {
      totalSiswa: item._count?.students || 0,
      grup: { hazirlik: 0, hafizlik: 0, ibtidai: 0, ihzari: 0 },
      tingkat: { tingkat7: 0, tingkat8: 0, tingkat9: 0, tingkat10: 0, tingkat11: 0, tingkat12: 0, lulus: 0, sekolahLain: 0 }
    };

    if (selectedJenis === 'ALL') {
      return base;
    }

    const byGrup = base.byGrup || {};
    const upperSel = selectedJenis.toUpperCase().trim();

    let matchedStats = byGrup[upperSel];
    if (!matchedStats) {
      const matchKey = Object.keys(byGrup).find(k => k.includes(upperSel) || upperSel.includes(k));
      if (matchKey) {
        matchedStats = byGrup[matchKey];
      }
    }

    if (matchedStats) {
      return {
        totalSiswa: matchedStats.totalSiswa,
        grup: base.grup,
        tingkat: matchedStats.tingkat
      };
    }

    return {
      totalSiswa: 0,
      grup: base.grup,
      tingkat: { tingkat7: 0, tingkat8: 0, tingkat9: 0, tingkat10: 0, tingkat11: 0, tingkat12: 0, lulus: 0, sekolahLain: 0 }
    };
  };

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
    if (filterJenisDaimi !== 'ALL') count++;
    return count;
  }, [filterWilayah, filterJenisDaimi]);

  const resetAdvancedFilters = () => {
    setFilterWilayah('ALL');
    setFilterJenisDaimi('ALL');
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

    // Filter Jenis Daimi (Hide cabangs that do not have students in the selected group when filter is active)
    if (filterJenisDaimi !== 'ALL') {
      result = result.filter(c => {
        const s = getSiswaStatsForCabang(c, filterJenisDaimi);
        const rowSum = (s.tingkat?.tingkat7 || 0) +
                       (s.tingkat?.tingkat8 || 0) +
                       (s.tingkat?.tingkat9 || 0) +
                       (s.tingkat?.tingkat10 || 0) +
                       (s.tingkat?.tingkat11 || 0) +
                       (s.tingkat?.tingkat12 || 0) +
                       (s.tingkat?.sekolahLain || 0);
        return rowSum > 0;
      });
    }

    // Sort bertingkat: Prioritas Wilayah -> kemudian Nama Cabang
    result.sort((a, b) => {
      const aWil = (a.wilayah?.name || 'Tanpa Wilayah').toLowerCase();
      const bWil = (b.wilayah?.name || 'Tanpa Wilayah').toLowerCase();

      const aName = (a.nameGlodemy || a.name).toLowerCase();
      const bName = (b.nameGlodemy || b.name).toLowerCase();

      if (sortField === 'wilayah') {
        if (aWil !== bWil) {
          const comp = aWil.localeCompare(bWil, 'id');
          return sortDirection === 'asc' ? comp : -comp;
        }
        return aName.localeCompare(bName, 'id');
      }

      if (sortField === 'name') {
        // Tetap kelompokkan berdasarkan wilayah terlebih dahulu agar cabang tidak loncat-loncat wilayah
        if (aWil !== bWil) {
          return aWil.localeCompare(bWil, 'id');
        }
        const comp = aName.localeCompare(bName, 'id');
        return sortDirection === 'asc' ? comp : -comp;
      }

      // Default: Urutkan Wilayah lalu Nama Cabang
      if (aWil !== bWil) {
        return aWil.localeCompare(bWil, 'id');
      }
      return aName.localeCompare(bName, 'id');
    });

    return result;
  }, [cabang, searchQuery, filterWilayah, filterJenisDaimi, sortField, sortDirection]);

  // Aggregated totals per Wilayah (For Rekapitulasi Per Wilayah Table)
  const wilayahSummaryList = useMemo(() => {
    if (!filteredAndSortedCabang || filteredAndSortedCabang.length === 0) return [];

    const map = new Map<string, {
      wilayahId: string;
      wilayahName: string;
      totalCabang: number;
      t7: number; targetT7: number;
      t8: number; targetT8: number;
      t9: number; targetT9: number;
      t10: number; targetT10: number;
      t11: number; targetT11: number;
      t12: number; targetT12: number;
      nonMuadalah: number;
      totalSiswaMuadalah: number;
      totalSiswa: number;
      totalKapasitas: number;
    }>();

    filteredAndSortedCabang.forEach((item) => {
      const wId = item.wilayah?.id || 'NO_WILAYAH';
      const wName = item.wilayah?.name || 'Tanpa Wilayah';

      if (!map.has(wId)) {
        map.set(wId, {
          wilayahId: wId,
          wilayahName: wName,
          totalCabang: 0,
          t7: 0, targetT7: 0,
          t8: 0, targetT8: 0,
          t9: 0, targetT9: 0,
          t10: 0, targetT10: 0,
          t11: 0, targetT11: 0,
          t12: 0, targetT12: 0,
          nonMuadalah: 0,
          totalSiswaMuadalah: 0,
          totalSiswa: 0,
          totalKapasitas: 0,
        });
      }

      const entry = map.get(wId)!;
      entry.totalCabang += 1;

      const s = getSiswaStatsForCabang(item, filterJenisDaimi);
      const t = item.targetKuota || {
        targetTingkat7: 0, targetTingkat8: 0, targetTingkat9: 0, targetTingkat10: 0, targetTingkat11: 0, targetTingkat12: 0
      };

      const t7 = s.tingkat?.tingkat7 || 0;
      const targetT7 = t.targetTingkat7 || 0;
      const t8 = s.tingkat?.tingkat8 || 0;
      const targetT8 = t.targetTingkat8 || 0;
      const t9 = s.tingkat?.tingkat9 || 0;
      const targetT9 = t.targetTingkat9 || 0;
      const t10 = s.tingkat?.tingkat10 || 0;
      const targetT10 = t.targetTingkat10 || 0;
      const t11 = s.tingkat?.tingkat11 || 0;
      const targetT11 = t.targetTingkat11 || 0;
      const t12 = s.tingkat?.tingkat12 || 0;
      const targetT12 = t.targetTingkat12 || 0;
      const nonM = s.tingkat?.sekolahLain || 0;

      entry.t7 += t7; entry.targetT7 += targetT7;
      entry.t8 += t8; entry.targetT8 += targetT8;
      entry.t9 += t9; entry.targetT9 += targetT9;
      entry.t10 += t10; entry.targetT10 += targetT10;
      entry.t11 += t11; entry.targetT11 += targetT11;
      entry.t12 += t12; entry.targetT12 += targetT12;
      entry.nonMuadalah += nonM;

      const rowSumMuadalah = t7 + t8 + t9 + t10 + t11 + t12;
      const rowSumSiswa = rowSumMuadalah + nonM;
      const rowSumTarget = targetT7 + targetT8 + targetT9 + targetT10 + targetT11 + targetT12;

      entry.totalSiswaMuadalah += rowSumMuadalah;
      entry.totalSiswa += rowSumSiswa;
      entry.totalKapasitas += rowSumTarget > 0 ? rowSumTarget : (item.kapasitasSantri || 0);
    });

    return Array.from(map.values()).sort((a, b) => a.wilayahName.localeCompare(b.wilayahName));
  }, [filteredAndSortedCabang, filterJenisDaimi]);

  // Aggregated Totals based on filtered & sorted cabangs
  const filteredTotals = useMemo(() => {
    if (!filteredAndSortedCabang || filteredAndSortedCabang.length === 0) {
      return {
        t7: 0, targetT7: 0,
        t8: 0, targetT8: 0,
        t9: 0, targetT9: 0,
        t10: 0, targetT10: 0,
        t11: 0, targetT11: 0,
        t12: 0, targetT12: 0,
        nonMuadalah: 0,
        totalSiswaMuadalah: 0,
        totalSiswa: 0,
        totalKapasitas: 0,
      };
    }

    let t7 = 0, targetT7 = 0;
    let t8 = 0, targetT8 = 0;
    let t9 = 0, targetT9 = 0;
    let t10 = 0, targetT10 = 0;
    let t11 = 0, targetT11 = 0;
    let t12 = 0, targetT12 = 0;
    let nonMuadalah = 0;
    let totalSiswaMuadalah = 0;
    let totalSiswa = 0;
    let totalKapasitas = 0;

    filteredAndSortedCabang.forEach((item) => {
      const s = getSiswaStatsForCabang(item, filterJenisDaimi);
      const t = item.targetKuota || {
        targetTingkat7: 0, targetTingkat8: 0, targetTingkat9: 0, targetTingkat10: 0, targetTingkat11: 0, targetTingkat12: 0
      };

      const nonM = s.tingkat?.sekolahLain || 0;
      nonMuadalah += nonM;

      const itemT7 = s.tingkat?.tingkat7 || 0;
      const itemT8 = s.tingkat?.tingkat8 || 0;
      const itemT9 = s.tingkat?.tingkat9 || 0;
      const itemT10 = s.tingkat?.tingkat10 || 0;
      const itemT11 = s.tingkat?.tingkat11 || 0;
      const itemT12 = s.tingkat?.tingkat12 || 0;

      t7 += itemT7;
      targetT7 += t.targetTingkat7 || 0;

      t8 += itemT8;
      targetT8 += t.targetTingkat8 || 0;

      t9 += itemT9;
      targetT9 += t.targetTingkat9 || 0;

      t10 += itemT10;
      targetT10 += t.targetTingkat10 || 0;

      t11 += itemT11;
      targetT11 += t.targetTingkat11 || 0;

      t12 += itemT12;
      targetT12 += t.targetTingkat12 || 0;

      const rowSumMuadalah = itemT7 + itemT8 + itemT9 + itemT10 + itemT11 + itemT12;
      const rowSumSiswa = rowSumMuadalah + nonM;
      const rowSumTarget = (t.targetTingkat7 || 0) + (t.targetTingkat8 || 0) + (t.targetTingkat9 || 0) + (t.targetTingkat10 || 0) + (t.targetTingkat11 || 0) + (t.targetTingkat12 || 0);

      totalSiswaMuadalah += rowSumMuadalah;
      totalSiswa += rowSumSiswa;
      totalKapasitas += rowSumTarget > 0 ? rowSumTarget : (item.kapasitasSantri || 0);
    });

    return {
      t7, targetT7, t8, targetT8, t9, targetT9,
      t10, targetT10, t11, targetT11, t12, targetT12,
      nonMuadalah,
      totalSiswaMuadalah,
      totalSiswa, totalKapasitas
    };
  }, [filteredAndSortedCabang, filterJenisDaimi]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterWilayah, filterJenisDaimi, sortField, sortDirection, activeSubTab]);

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

  const renderCountCell = (count: number, isTotalCell: boolean = false) => {
    const isZero = count === 0;

    let colorClass = "font-extrabold text-slate-800 text-xs";
    if (isZero) {
      colorClass = "font-medium text-slate-300 text-xs";
    } else if (isTotalCell) {
      colorClass = "font-black text-indigo-950 text-xs";
    }

    return (
      <div className="flex flex-col items-center justify-center py-1">
        <span className={colorClass}>
          {count.toLocaleString('id-ID')}
        </span>
      </div>
    );
  };

  const renderTargetCell = (realisasi: number, target: number, isTotalCell: boolean = false) => {
    if (!target && !realisasi) {
      return (
        <div className="flex flex-col items-center justify-center py-0.5">
          <div className="text-[11px] font-medium text-slate-300">
            0 <span className="font-normal text-slate-300">/ 0</span>
          </div>
        </div>
      );
    }

    const pct = target > 0 ? Math.round((realisasi / target) * 100) : (realisasi > 0 ? 100 : 0);
    const clampedPct = Math.min(pct, 100);

    let textColor = 'text-emerald-600 font-bold';
    let barColor = 'bg-emerald-500';
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (pct < 50) {
      textColor = 'text-rose-600 font-bold';
      barColor = 'bg-rose-500';
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    } else if (pct < 80) {
      textColor = 'text-amber-600 font-bold';
      barColor = 'bg-amber-500';
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    }

    if (isTotalCell) {
      return (
        <div className="flex flex-col items-center justify-center py-0.5 max-w-[105px] mx-auto">
          <div className="text-xs font-extrabold text-slate-900">
            {realisasi.toLocaleString('id-ID')} <span className="text-slate-400 font-normal text-[10px]">/ {target.toLocaleString('id-ID')}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-1 shadow-2xs">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${clampedPct}%` }}
            />
          </div>
          <div className="mt-1">
            <span className={`inline-flex px-2 py-0.2 text-[10px] font-extrabold rounded-full border shadow-2xs ${badgeColor}`}>
              {pct}%
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-0.5 max-w-[95px] mx-auto">
        <div className="flex items-baseline justify-center gap-0.5 w-full text-[11px]">
          <span className="font-extrabold text-slate-900 text-xs">{realisasi.toLocaleString('id-ID')}</span>
          <span className="text-slate-400 font-normal text-[10px]">/{target.toLocaleString('id-ID')}</span>
        </div>
        <div className="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden mt-0.5 shadow-2xs">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        <div className="text-center mt-0.5 leading-none">
          <span className={`text-[10px] font-extrabold ${textColor}`}>{pct}%</span>
        </div>
      </div>
    );
  };

  const handleExportXLSX = () => {
    if (!filteredAndSortedCabang || filteredAndSortedCabang.length === 0) {
      showToast('error', 'Tidak ada data cabang untuk di-export');
      return;
    }

    const exportData = filteredAndSortedCabang.map((item, idx) => {
      const alamatFull = [
        item.alamatJalan,
        item.alamatKelName ? `KEL. ${item.alamatKelName}` : '',
        item.alamatKecName ? `KEC. ${item.alamatKecName}` : '',
        item.alamatKabName,
        item.alamatProvName
      ].filter(Boolean).join(', ') || '-';

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
        'WILAYAH': (item.wilayah?.name || '-').toUpperCase(),
        'NAMA CABANG (GLODEMY)': (item.nameGlodemy || item.name || '-').toUpperCase(),
        'NAMA CABANG (RESMI)': (item.nameResmi || item.name || '-').toUpperCase(),
        'ALAMAT JALAN': (item.alamatJalan || '-').toUpperCase(),
        'KELURAHAN / DESA': (item.alamatKelName || '-').toUpperCase(),
        'KECAMATAN': (item.alamatKecName || '-').toUpperCase(),
        'KABUPATEN / KOTA': (item.alamatKabName || '-').toUpperCase(),
        'PROVINSI': (item.alamatProvName || '-').toUpperCase(),
        'ALAMAT LENGKAP': alamatFull.toUpperCase(),
        'URL GOOGLE MAPS': item.urlGoogleMaps || '-',
        'PIMPINAN CABANG': (item.pimpinanCabang || '-').toUpperCase(),
        'PJ MUADALAH': (item.pjMuadalah || '-').toUpperCase(),
        'STATUS BANGUNAN': (item.statusBangunan || '-').toUpperCase(),
        'STATUS TANAH': (item.statusTanah || '-').toUpperCase(),
        'TOTAL SISWA (REALISASI)': s.totalSiswa,
        'KAPASITAS SANTRI': item.kapasitasSantri || 0,
        'WUSTHA - TINGKAT 7 (REALISASI/TARGET)': `${s.tingkat.tingkat7} / ${t.targetTingkat7}`,
        'WUSTHA - TINGKAT 8 (REALISASI/TARGET)': `${s.tingkat.tingkat8} / ${t.targetTingkat8}`,
        'WUSTHA - TINGKAT 9 (REALISASI/TARGET)': `${s.tingkat.tingkat9} / ${t.targetTingkat9}`,
        'ULYA - TINGKAT 10 (REALISASI/TARGET)': `${s.tingkat.tingkat10} / ${t.targetTingkat10}`,
        'ULYA - TINGKAT 11 (REALISASI/TARGET)': `${s.tingkat.tingkat11} / ${t.targetTingkat11}`,
        'ULYA - TINGKAT 12 (REALISASI/TARGET)': `${s.tingkat.tingkat12} / ${t.targetTingkat12}`,
        'NON MUADALAH': s.tingkat.sekolahLain || 0,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 6 },  // NO
      { wch: 20 }, // WILAYAH
      { wch: 30 }, // NAMA CABANG (GLODEMY)
      { wch: 30 }, // NAMA CABANG (RESMI)
      { wch: 35 }, // ALAMAT JALAN
      { wch: 22 }, // KELURAHAN / DESA
      { wch: 22 }, // KECAMATAN
      { wch: 24 }, // KABUPATEN / KOTA
      { wch: 22 }, // PROVINSI
      { wch: 50 }, // ALAMAT LENGKAP
      { wch: 35 }, // URL GOOGLE MAPS
      { wch: 26 }, // PIMPINAN CABANG
      { wch: 26 }, // PJ MUADALAH
      { wch: 20 }, // STATUS BANGUNAN
      { wch: 20 }, // STATUS TANAH
      { wch: 24 }, // TOTAL SISWA (REALISASI)
      { wch: 18 }, // KAPASITAS SANTRI
      { wch: 26 }, // WUSTHA - TINGKAT 7 (REALISASI/TARGET)
      { wch: 26 }, // WUSTHA - TINGKAT 8 (REALISASI/TARGET)
      { wch: 26 }, // WUSTHA - TINGKAT 9 (REALISASI/TARGET)
      { wch: 26 }, // ULYA - TINGKAT 10 (REALISASI/TARGET)
      { wch: 26 }, // ULYA - TINGKAT 11 (REALISASI/TARGET)
      { wch: 26 }, // ULYA - TINGKAT 12 (REALISASI/TARGET)
      { wch: 16 }, // NON MUADALAH
    ];
    worksheet['!cols'] = colWidths;

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

                <button
                  onClick={() => setActiveSubTab('kelas_x_daimi')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'kelas_x_daimi'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Kelas X Daimi
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
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama cabang atau wilayah..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                {(activeSubTab === 'jumlah_siswa' || activeSubTab === 'kelas_x_daimi') && (
                  <div className="w-full sm:w-52">
                    <select
                      value={filterJenisDaimi}
                      onChange={(e) => setFilterJenisDaimi(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50/90 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">-- Semua Jenis Daimi --</option>
                      {jenisGrupDaimiList.map((j) => (
                        <option key={j.id} value={j.name}>{j.name}</option>
                      ))}
                      <option value="NO_GRUP">Tanpa Grup Daimi</option>
                    </select>
                  </div>
                )}

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {/* Filter Wilayah */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Wilayah</label>
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

                  {/* Filter Jenis Grup Daimi */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Jenis Grup Daimi</label>
                    <select
                      value={filterJenisDaimi}
                      onChange={(e) => setFilterJenisDaimi(e.target.value)}
                      className="w-full px-3 py-1.5 font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="ALL">Semua Jenis Grup Daimi</option>
                      {jenisGrupDaimiList.map((j) => (
                        <option key={j.id} value={j.name}>{j.name}</option>
                      ))}
                      <option value="NO_GRUP">Tanpa Grup Daimi</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── REKAPITULASI PER WILAYAH TABLE (SubTab: Jumlah & Target Siswa / Kelas X Daimi, Hanya saat Semua Wilayah) ── */}
            {(activeSubTab === 'jumlah_siswa' || activeSubTab === 'kelas_x_daimi') && filterWilayah === 'ALL' && wilayahSummaryList.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-6">
                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                      Rekapitulasi Data Per Wilayah ({wilayahSummaryList.length} Wilayah)
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300">
                    {activeSubTab === 'kelas_x_daimi' ? 'Akumulasi Realisasi Jumlah Siswa per Wilayah' : 'Akumulasi Kuota & Realisasi per Wilayah'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr className="border-b border-slate-200">
                        <th rowSpan={2} className="py-2.5 px-3 text-center w-12 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">No</th>
                        <th rowSpan={2} className="py-2.5 px-3 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">Nama Wilayah</th>
                        <th colSpan={3} className="py-2.5 px-3 text-center bg-[#0073B7] text-white font-extrabold tracking-wide border-r border-sky-600 shadow-2xs">
                          WUSTHA (TINGKAT 7 - 9)
                        </th>
                        <th colSpan={3} className="py-2.5 px-3 text-center bg-[#7FFFD4] text-emerald-950 font-extrabold tracking-wide border-r border-emerald-300 shadow-2xs">
                          ULYA (TINGKAT 10 - 12)
                        </th>
                        {activeSubTab === 'kelas_x_daimi' && (
                          <th rowSpan={2} className="py-2.5 px-3 text-center bg-purple-100 text-purple-900 font-extrabold border-r border-purple-200 align-middle">
                            NON MUADALAH
                          </th>
                        )}
                        <th rowSpan={2} className="py-2.5 px-3 text-center bg-slate-100/90 text-slate-800 font-extrabold border-r border-slate-200 align-middle">
                          {activeSubTab === 'kelas_x_daimi' ? 'TOTAL SISWA' : 'TOTAL SISWA MUADALAH / KAPASITAS'}
                        </th>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TINGKAT 7</th>
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TINGKAT 8</th>
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-300 text-[11px]">TINGKAT 9</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">TINGKAT 10</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">TINGKAT 11</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-300 text-[11px]">TINGKAT 12</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Top Summary Row for All Wilayahs */}
                      <tr className="bg-blue-50/90 font-extrabold text-slate-900 border-b-2 border-blue-200 shadow-2xs">
                        <td colSpan={2} className="py-2.5 px-3 text-center bg-blue-100/80 text-blue-950 font-black border-r border-blue-200 text-xs">
                          TOTAL ({wilayahSummaryList.length} WILAYAH):
                        </td>
                        {activeSubTab === 'kelas_x_daimi' ? (
                          <>
                            <td className="py-2 px-2 text-center bg-blue-50 border-r border-sky-200">{renderCountCell(filteredTotals.t7)}</td>
                            <td className="py-2 px-2 text-center bg-blue-50 border-r border-sky-200">{renderCountCell(filteredTotals.t8)}</td>
                            <td className="py-2 px-2 text-center bg-blue-50/90 border-r border-sky-300">{renderCountCell(filteredTotals.t9)}</td>
                            <td className="py-2 px-2 text-center bg-emerald-50 border-r border-emerald-200">{renderCountCell(filteredTotals.t10)}</td>
                            <td className="py-2 px-2 text-center bg-emerald-50 border-r border-emerald-200">{renderCountCell(filteredTotals.t11)}</td>
                            <td className="py-2 px-2 text-center bg-emerald-50/90 border-r border-emerald-300">{renderCountCell(filteredTotals.t12)}</td>
                            <td className="py-2 px-2 text-center bg-purple-50 border-r border-purple-200">{renderCountCell(filteredTotals.nonMuadalah)}</td>
                            <td className="py-2 px-2 text-center bg-indigo-100/70 border-r border-indigo-200 font-extrabold">{renderCountCell(filteredTotals.totalSiswa, true)}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-2 text-center bg-blue-50 border-r border-sky-200">
                              {renderTargetCell(filteredTotals.t7, filteredTotals.targetT7, false)}
                            </td>
                            <td className="py-2 px-2 text-center bg-blue-50 border-r border-sky-200">
                              {renderTargetCell(filteredTotals.t8, filteredTotals.targetT8, false)}
                            </td>
                            <td className="py-2 px-2 text-center bg-blue-50/90 border-r border-sky-300">
                              {renderTargetCell(filteredTotals.t9, filteredTotals.targetT9, false)}
                            </td>
                            <td className="py-2 px-2 text-center bg-emerald-50 border-r border-emerald-200">
                              {renderTargetCell(filteredTotals.t10, filteredTotals.targetT10, false)}
                            </td>
                            <td className="py-2 px-2 text-center bg-emerald-50 border-r border-emerald-200">
                              {renderTargetCell(filteredTotals.t11, filteredTotals.targetT11, false)}
                            </td>
                            <td className="py-2 px-2 text-center bg-emerald-50/90 border-r border-emerald-300">
                              {renderTargetCell(filteredTotals.t12, filteredTotals.targetT12, false)}
                            </td>
                            <td className="py-2 px-2 text-center bg-indigo-100/70 border-r border-indigo-200 font-extrabold">
                              {renderTargetCell(filteredTotals.totalSiswaMuadalah, filteredTotals.totalKapasitas, true)}
                            </td>
                          </>
                        )}
                      </tr>

                      {wilayahSummaryList.map((w, idx) => (
                        <tr key={w.wilayahId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            <div>{w.wilayahName}</div>
                            <span className="text-[10px] font-normal text-slate-400">{w.totalCabang} Cabang Pesantren</span>
                          </td>
                          {activeSubTab === 'kelas_x_daimi' ? (
                            <>
                              <td className="py-2 px-2 text-center bg-sky-50/30 border-r border-sky-100">{renderCountCell(w.t7)}</td>
                              <td className="py-2 px-2 text-center bg-sky-50/30 border-r border-sky-100">{renderCountCell(w.t8)}</td>
                              <td className="py-2 px-2 text-center bg-sky-50/50 border-r border-sky-200">{renderCountCell(w.t9)}</td>
                              <td className="py-2 px-2 text-center bg-emerald-50/30 border-r border-emerald-100">{renderCountCell(w.t10)}</td>
                              <td className="py-2 px-2 text-center bg-emerald-50/30 border-r border-emerald-100">{renderCountCell(w.t11)}</td>
                              <td className="py-2 px-2 text-center bg-emerald-50/50 border-r border-emerald-200">{renderCountCell(w.t12)}</td>
                              <td className="py-2 px-2 text-center bg-purple-50/30 border-r border-purple-100">{renderCountCell(w.nonMuadalah)}</td>
                              <td className="py-2 px-2 text-center bg-indigo-50/40 border-r border-indigo-100 font-bold">{renderCountCell(w.totalSiswa, true)}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-2 text-center bg-sky-50/30 border-r border-sky-100">
                                {renderTargetCell(w.t7, w.targetT7)}
                              </td>
                              <td className="py-2 px-2 text-center bg-sky-50/30 border-r border-sky-100">
                                {renderTargetCell(w.t8, w.targetT8)}
                              </td>
                              <td className="py-2 px-2 text-center bg-sky-50/50 border-r border-sky-200">
                                {renderTargetCell(w.t9, w.targetT9)}
                              </td>
                              <td className="py-2 px-2 text-center bg-emerald-50/30 border-r border-emerald-100">
                                {renderTargetCell(w.t10, w.targetT10)}
                              </td>
                              <td className="py-2 px-2 text-center bg-emerald-50/30 border-r border-emerald-100">
                                {renderTargetCell(w.t11, w.targetT11)}
                              </td>
                              <td className="py-2 px-2 text-center bg-emerald-50/50 border-r border-emerald-200">
                                {renderTargetCell(w.t12, w.targetT12)}
                              </td>
                              <td className="py-2 px-2 text-center bg-indigo-50/40 border-r border-indigo-100 font-bold">
                                {renderTargetCell(w.totalSiswaMuadalah, w.totalKapasitas, true)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        <th rowSpan={2} className="py-2.5 px-3 text-center w-12 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">No</th>
                        <th rowSpan={2} className="py-2.5 px-3 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle cursor-pointer hover:bg-slate-200/80 transition-colors" onClick={() => toggleSort('name')}>
                          Nama Cabang <SortIcon field="name" />
                        </th>
                        <th colSpan={3} className="py-2.5 px-3 text-center bg-[#0073B7] text-white font-extrabold tracking-wide border-r border-sky-600 shadow-2xs">
                          WUSTHA (TINGKAT 7 - 9)
                        </th>
                        <th colSpan={3} className="py-2.5 px-3 text-center bg-[#7FFFD4] text-emerald-950 font-extrabold tracking-wide border-r border-emerald-300 shadow-2xs">
                          ULYA (TINGKAT 10 - 12)
                        </th>
                        <th rowSpan={2} className="py-2.5 px-3 text-center bg-slate-100/90 text-slate-800 font-extrabold border-r border-slate-200 align-middle">
                          TOTAL SISWA MUADALAH / KAPASITAS
                        </th>
                        <th rowSpan={2} className="py-2.5 px-3 text-right bg-slate-100/90 text-slate-700 font-extrabold align-middle">Aksi</th>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TINGKAT 7</th>
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TINGKAT 8</th>
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-300 text-[11px]">TINGKAT 9</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">TINGKAT 10</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">TINGKAT 11</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-300 text-[11px]">TINGKAT 12</th>
                      </tr>

                      {/* ── TOP TOTAL SUMMARY ROW ── */}
                      <tr className="bg-[#DCEBFB] border-b-2 border-sky-300 text-xs font-bold shadow-2xs">
                        <td colSpan={2} className="py-3 px-3 text-right font-extrabold text-slate-800 bg-[#CFE2F9] border-r border-sky-300 uppercase tracking-wider">
                          TOTAL ({filteredAndSortedCabang.length} CABANG):
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderTargetCell(filteredTotals.t7, filteredTotals.targetT7)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderTargetCell(filteredTotals.t8, filteredTotals.targetT8)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-300">
                          {renderTargetCell(filteredTotals.t9, filteredTotals.targetT9)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderTargetCell(filteredTotals.t10, filteredTotals.targetT10)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderTargetCell(filteredTotals.t11, filteredTotals.targetT11)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-300">
                          {renderTargetCell(filteredTotals.t12, filteredTotals.targetT12)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#D4E5FA] border-r border-sky-300 font-extrabold">
                          {renderTargetCell(filteredTotals.totalSiswaMuadalah, filteredTotals.totalKapasitas, true)}
                        </td>
                        <td className="py-2.5 px-3 bg-[#DCEBFB]"></td>
                      </tr>
                    </>
                  )}

                  {/* SUB-TAB 5: KELAS X DAIMI */}
                  {activeSubTab === 'kelas_x_daimi' && (
                    <>
                      <tr className="border-b border-slate-200">
                        <th rowSpan={2} className="py-2.5 px-3 text-center w-12 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle">No</th>
                        <th rowSpan={2} className="py-2.5 px-3 bg-slate-100/90 text-slate-700 font-extrabold border-r border-slate-200 align-middle cursor-pointer hover:bg-slate-200/80 transition-colors" onClick={() => toggleSort('name')}>
                          Nama Cabang <SortIcon field="name" />
                        </th>
                        <th colSpan={3} className="py-2.5 px-3 text-center bg-[#0073B7] text-white font-extrabold tracking-wide border-r border-sky-600 shadow-2xs">
                          WUSTHA (TINGKAT 7 - 9)
                        </th>
                        <th colSpan={3} className="py-2.5 px-3 text-center bg-[#7FFFD4] text-emerald-950 font-extrabold tracking-wide border-r border-emerald-300 shadow-2xs">
                          ULYA (TINGKAT 10 - 12)
                        </th>
                        <th rowSpan={2} className="py-2.5 px-3 text-center bg-purple-100 text-purple-900 font-extrabold border-r border-purple-200 align-middle">
                          NON MUADALAH
                        </th>
                        <th rowSpan={2} className="py-2.5 px-3 text-center bg-slate-100/90 text-slate-800 font-extrabold border-r border-slate-200 align-middle">
                          TOTAL SISWA
                        </th>
                        <th rowSpan={2} className="py-2.5 px-3 text-right bg-slate-100/90 text-slate-700 font-extrabold align-middle">Aksi</th>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TINGKAT 7</th>
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-200 text-[11px]">TINGKAT 8</th>
                        <th className="py-2 px-3 text-center bg-sky-50 text-sky-900 font-bold border-r border-sky-300 text-[11px]">TINGKAT 9</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">TINGKAT 10</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-200 text-[11px]">TINGKAT 11</th>
                        <th className="py-2 px-3 text-center bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-300 text-[11px]">TINGKAT 12</th>
                      </tr>

                      {/* ── TOP TOTAL SUMMARY ROW ── */}
                      <tr className="bg-[#DCEBFB] border-b-2 border-sky-300 text-xs font-bold shadow-2xs">
                        <td colSpan={2} className="py-3 px-3 text-right font-extrabold text-slate-800 bg-[#CFE2F9] border-r border-sky-300 uppercase tracking-wider">
                          TOTAL ({filteredAndSortedCabang.length} CABANG):
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderCountCell(filteredTotals.t7)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderCountCell(filteredTotals.t8)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-300">
                          {renderCountCell(filteredTotals.t9)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderCountCell(filteredTotals.t10)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-200">
                          {renderCountCell(filteredTotals.t11)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#DCEBFB] border-r border-sky-300">
                          {renderCountCell(filteredTotals.t12)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-purple-100/70 border-r border-purple-200">
                          {renderCountCell(filteredTotals.nonMuadalah)}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-[#D4E5FA] border-r border-sky-300 font-extrabold">
                          {renderCountCell(filteredTotals.totalSiswa, true)}
                        </td>
                        <td className="py-2.5 px-3 bg-[#DCEBFB]"></td>
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
                    ((activeSubTab === 'jumlah_siswa' || activeSubTab === 'kelas_x_daimi')
                      ? filteredAndSortedCabang
                      : filteredAndSortedCabang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    ).map((item, idx) => {
                      const rowNo = (activeSubTab === 'jumlah_siswa' || activeSubTab === 'kelas_x_daimi') ? idx + 1 : (currentPage - 1) * itemsPerPage + idx + 1;
                      const p = item.personel || { pendidikLK: 0, pendidikPR: 0, kependidikanLK: 0, kependidikanPR: 0, totalLK: 0, totalPR: 0, guruMatematika: 0, guruIndo: 0, guruInggris: 0, guruIpa: 0, guruPkn: 0, totalGuruMapel: 0 };
                      const s = getSiswaStatsForCabang(item, filterJenisDaimi);
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
                            {(activeSubTab === 'jumlah_siswa' || activeSubTab === 'kelas_x_daimi') && item.wilayah?.name && (
                              <p className="text-[10px] font-semibold text-indigo-600/80">{item.wilayah.name}</p>
                            )}
                            {item.nameResmi && item.nameResmi !== item.nameGlodemy && (
                              <p className="text-[11px] font-normal text-slate-400">{item.nameResmi}</p>
                            )}
                          </td>

                          {/* ── SUB-TAB 1: IDENTITAS ── */}
                          {activeSubTab === 'identitas' && (
                            <>
                              <td className="py-3.5 px-3 text-slate-600 font-medium">{item.wilayah?.name || '-'}</td>
                              <td className="py-3.5 px-3 text-slate-600 max-w-sm">
                                {(() => {
                                  const parts = [
                                    item.alamatJalan,
                                    item.alamatKelName ? `KEL. ${item.alamatKelName}` : '',
                                    item.alamatKecName ? `KEC. ${item.alamatKecName}` : '',
                                    item.alamatKabName,
                                    item.alamatProvName
                                  ].filter(Boolean);
                                  const addressStr = parts.join(', ').toUpperCase();
                                  const cabangName = (item.nameGlodemy || item.name || '').toUpperCase();

                                  const handleCopy = (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    const lines = [
                                      cabangName,
                                      addressStr,
                                      item.urlGoogleMaps ? `Google Maps: ${item.urlGoogleMaps}` : ''
                                    ].filter(Boolean);
                                    const textToCopy = lines.join('\n');
                                    navigator.clipboard.writeText(textToCopy);
                                    showToast('success', 'Nama dan alamat cabang berhasil disalin!');
                                  };

                                  return (
                                    <div className="space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="text-xs text-slate-700 font-medium leading-relaxed uppercase">
                                          {addressStr || '-'}
                                        </span>
                                        {(cabangName || addressStr) && (
                                          <button
                                            type="button"
                                            onClick={handleCopy}
                                            title="Salin nama & alamat cabang ke clipboard"
                                            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      {item.urlGoogleMaps && (
                                        <a
                                          href={item.urlGoogleMaps}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          <MapPin className="w-3 h-3 text-rose-500" />
                                          <span>Google Maps</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  );
                                })()}
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
                              <td className="py-1.5 px-2 text-center bg-sky-50/40 border-r border-sky-100">
                                {renderTargetCell(s.tingkat.tingkat7, t.targetTingkat7)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-sky-50/40 border-r border-sky-100">
                                {renderTargetCell(s.tingkat.tingkat8, t.targetTingkat8)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-sky-50/60 border-r border-sky-200">
                                {renderTargetCell(s.tingkat.tingkat9, t.targetTingkat9)}
                              </td>

                              {/* ULYA (TINGKAT 10 - 12) - Emerald Green Accent */}
                              <td className="py-1.5 px-2 text-center bg-emerald-50/40 border-r border-emerald-100">
                                {renderTargetCell(s.tingkat.tingkat10, t.targetTingkat10)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-emerald-50/40 border-r border-emerald-100">
                                {renderTargetCell(s.tingkat.tingkat11, t.targetTingkat11)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-emerald-50/60 border-r border-emerald-200">
                                {renderTargetCell(s.tingkat.tingkat12, t.targetTingkat12)}
                              </td>

                              {/* TOTAL REALISASI SISWA MUADALAH / KAPASITAS TARGET - Indigo Accent */}
                              {(() => {
                                const rowTotalSiswaMuadalah = (s.tingkat?.tingkat7 || 0) + (s.tingkat?.tingkat8 || 0) + (s.tingkat?.tingkat9 || 0) + (s.tingkat?.tingkat10 || 0) + (s.tingkat?.tingkat11 || 0) + (s.tingkat?.tingkat12 || 0);
                                const rowSumTarget = (t.targetTingkat7 || 0) + (t.targetTingkat8 || 0) + (t.targetTingkat9 || 0) + (t.targetTingkat10 || 0) + (t.targetTingkat11 || 0) + (t.targetTingkat12 || 0);
                                const rowTotalTarget = rowSumTarget > 0 ? rowSumTarget : (item.kapasitasSantri || 0);

                                return (
                                  <td className="py-1.5 px-2 text-center bg-indigo-50/50 border-r border-indigo-100 font-bold">
                                    {renderTargetCell(rowTotalSiswaMuadalah, rowTotalTarget, true)}
                                  </td>
                                );
                              })()}
                            </>
                          )}

                          {/* ── SUB-TAB 5: KELAS X DAIMI ── */}
                          {activeSubTab === 'kelas_x_daimi' && (
                            <>
                              {/* WUSTHA (TINGKAT 7 - 9) - Sky Blue Accent */}
                              <td className="py-1.5 px-2 text-center bg-sky-50/40 border-r border-sky-100">
                                {renderCountCell(s.tingkat.tingkat7)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-sky-50/40 border-r border-sky-100">
                                {renderCountCell(s.tingkat.tingkat8)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-sky-50/60 border-r border-sky-200">
                                {renderCountCell(s.tingkat.tingkat9)}
                              </td>

                              {/* ULYA (TINGKAT 10 - 12) - Emerald Green Accent */}
                              <td className="py-1.5 px-2 text-center bg-emerald-50/40 border-r border-emerald-100">
                                {renderCountCell(s.tingkat.tingkat10)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-emerald-50/40 border-r border-emerald-100">
                                {renderCountCell(s.tingkat.tingkat11)}
                              </td>
                              <td className="py-1.5 px-2 text-center bg-emerald-50/60 border-r border-emerald-200">
                                {renderCountCell(s.tingkat.tingkat12)}
                              </td>

                              {/* NON MUADALAH */}
                              <td className="py-1.5 px-2 text-center bg-purple-50/40 border-r border-purple-100">
                                {renderCountCell(s.tingkat.sekolahLain || 0)}
                              </td>

                              {/* TOTAL REALISASI SISWA - Indigo Accent */}
                              {(() => {
                                const nonM = s.tingkat.sekolahLain || 0;
                                const rowTotalSiswa = (s.tingkat?.tingkat7 || 0) + (s.tingkat?.tingkat8 || 0) + (s.tingkat?.tingkat9 || 0) + (s.tingkat?.tingkat10 || 0) + (s.tingkat?.tingkat11 || 0) + (s.tingkat?.tingkat12 || 0) + nonM;

                                return (
                                  <td className="py-1.5 px-2 text-center bg-indigo-50/50 border-r border-indigo-100 font-bold">
                                    {renderCountCell(rowTotalSiswa, true)}
                                  </td>
                                );
                              })()}
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

            {/* Pagination (Hidden for jumlah_siswa & kelas_x_daimi subtabs as requested to view all) */}
            {activeSubTab !== 'jumlah_siswa' && activeSubTab !== 'kelas_x_daimi' && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredAndSortedCabang.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                totalItems={filteredAndSortedCabang.length}
                itemsPerPage={itemsPerPage}
              />
            )}
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
