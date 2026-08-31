import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import {
  Database, Check, X, Search, Filter, RotateCcw,
  MessageCircle, ExternalLink, Copy, Building, Calendar,
  Clock, CheckCircle2, XCircle, Phone, ArrowRight, UserCheck, AlertCircle,
  User, Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import { useToast } from '../../contexts/ToastContext';

interface UserContact {
  id?: string;
  operatorName?: string | null;
  phone?: string | null;
  username?: string;
}

interface StaffContact {
  id: string;
  name: string;
  phone?: string | null;
  position?: string | null;
}

interface CabangInfo {
  id: string;
  name: string;
  ketuaMuadalahId?: string | null;
  ketuaMuadalah?: StaffContact | null;
  users?: UserContact[];
  staff?: StaffContact[];
}

interface PermintaanTarikItem {
  id: string;
  studentId: string;
  requestingCabangId: string;
  targetCabangId?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  alasan?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    biodata?: {
      fullName: string;
      nik?: string | null;
      nisn?: string | null;
      noGlodemy?: string | null;
      phone?: string | null;
    };
  };
  requestingCabang?: CabangInfo;
  targetCabang?: CabangInfo | null;
}

/**
 * Format & sanitasi nomor telepon menjadi format internasional (misal: 6281356522125)
 */
export function sanitizeWaNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  } else if (cleaned.startsWith('62')) {
    // already 62 prefix
  } else if (cleaned.length >= 7 && !cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Mengambil kontak Ketua Muadalah dari data cabang
 */
export function getKetuaMuadalahContact(cabang?: CabangInfo | null): { name: string; phone: string } {
  if (!cabang) return { name: 'Ketua Muadalah', phone: '' };

  // 1. Prioritas utama: Relasi ketuaMuadalah hasil join backend
  if (cabang.ketuaMuadalah) {
    return {
      name: cabang.ketuaMuadalah.name || 'Ketua Muadalah',
      phone: sanitizeWaNumber(cabang.ketuaMuadalah.phone)
    };
  }

  // 2. Cari di daftar staff cabang berdasarkan ketuaMuadalahId
  if (cabang.ketuaMuadalahId && Array.isArray(cabang.staff)) {
    const match = cabang.staff.find(s => s.id === cabang.ketuaMuadalahId);
    if (match) {
      return {
        name: match.name || 'Ketua Muadalah',
        phone: sanitizeWaNumber(match.phone)
      };
    }
  }

  // 3. Cari staff dengan posisi Muadalah
  if (Array.isArray(cabang.staff)) {
    const muadalahStaff = cabang.staff.find(s => s.position?.toLowerCase().includes('muadalah'));
    if (muadalahStaff) {
      return {
        name: muadalahStaff.name || 'Ketua Muadalah',
        phone: sanitizeWaNumber(muadalahStaff.phone)
      };
    }
  }

  // 4. Fallback ke user operator dengan nomor HP
  const userWithPhone = cabang.users?.find(u => u.phone && u.phone.trim() !== '');
  if (userWithPhone) {
    return {
      name: userWithPhone.operatorName || 'Operator Cabang',
      phone: sanitizeWaNumber(userWithPhone.phone)
    };
  }

  return { name: 'Ketua Muadalah', phone: '' };
}

/**
 * Mengelompokkan seluruh santri dari cabang pemohon & cabang asal yang sama
 */
export function getRelatedStudentsForCabangPair(
  currentReq: PermintaanTarikItem,
  allRequests: PermintaanTarikItem[] = []
): PermintaanTarikItem[] {
  const reqCabangId = currentReq.requestingCabangId;
  const reqCabangName = currentReq.requestingCabang?.name;
  const targetCabangId = currentReq.targetCabangId;
  const targetCabangName = currentReq.targetCabang?.name;

  // Temukan seluruh permohonan yang memiliki cabang pemohon dan cabang asal yang sama
  const matched = (allRequests || []).filter(r => {
    const isSameRequesting = Boolean(
      (reqCabangId && r.requestingCabangId === reqCabangId) ||
      (reqCabangName && r.requestingCabang?.name && r.requestingCabang.name === reqCabangName)
    );

    const isSameTarget = Boolean(
      (targetCabangId && r.targetCabangId === targetCabangId) ||
      (targetCabangName && r.targetCabang?.name && r.targetCabang.name === targetCabangName)
    );

    return isSameRequesting && isSameTarget;
  });

  return matched.length > 0 ? matched : [currentReq];
}

/**
 * Membuat template pesan WhatsApp permohonan tarik data siswa lengkap dengan daftar SEMUA siswa cabang pemohon
 */
export function buildTarikDataWaMessage(
  currentReq: PermintaanTarikItem,
  allRequests: PermintaanTarikItem[] = []
): string {
  const requestingCabangName = currentReq.requestingCabang?.name || 'Cabang Pemohon';
  const targetCabangName = currentReq.targetCabang?.name || 'Cabang Asal';
  const targetKetua = getKetuaMuadalahContact(currentReq.targetCabang);
  const ketuaName = targetKetua.name || 'Ustadz / Ketua Muadalah';

  const studentsToList = getRelatedStudentsForCabangPair(currentReq, allRequests);

  const studentListText = studentsToList.map((r, idx) => {
    const sName = r.student?.biodata?.fullName || 'Siswa';
    const sNik = r.student?.biodata?.nik ? `NIK: ${r.student.biodata.nik}` : null;
    const sNisn = r.student?.biodata?.nisn ? `NISN: ${r.student.biodata.nisn}` : null;
    const sStatus = r.status === 'PENDING' ? 'Menunggu Konfirmasi' : r.status === 'APPROVED' ? 'Disetujui' : 'Ditolak';
    const sAlasan = r.alasan ? ` | Alasan/Catatan: ${r.alasan}` : '';
    const idInfo = [sNik, sNisn].filter(Boolean).join(', ');
    return `${idx + 1}. *${sName}* [${sStatus}] ${idInfo ? `(${idInfo})` : ''}${sAlasan}`;
  }).join('\n');

  const tanggal = new Date(currentReq.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. Ustadz *${ketuaName}* (Ketua Muadalah *${targetCabangName}*),

Kami dari *eSantri Pusat* sedang meninjau dan memverifikasi permohonan *Tarik Data Siswa* yang diajukan oleh Cabang *${requestingCabangName}* dari cabang antum (*${targetCabangName}*).

Berikut rincian seluruh santri (*${studentsToList.length} Santri*) yang diajukan untuk ditarik ke *${requestingCabangName}*:

📋 *Daftar Seluruh Siswa*:
${studentListText}

🏢 *Cabang Asal*: ${targetCabangName}
🎯 *Cabang Pemohon (Tujuan)*: ${requestingCabangName}
📅 *Tanggal Peninjauan*: ${tanggal}

Apakah data permohonan tarik untuk seluruh santri tersebut di atas *sudah betul & disetujui* oleh pihak cabang antum?

Mohon konfirmasi dan informasinya agar permohonan ini dapat kami proses/setujui lebih lanjut pada sistem eSantri:
👉 https://esantri.yts.sch.id/dashboard/core/permintaan-tarik

Jazakumullah Khairan Katsiran atas perhatian dan kerja samanya.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.`
  );
}

export default function PermintaanTarikData() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedRequestingCabang, setSelectedRequestingCabang] = useState('ALL');
  const [selectedTargetCabang, setSelectedTargetCabang] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // WhatsApp Custom Dialog Modal State
  const [waModalData, setWaModalData] = useState<{
    req: PermintaanTarikItem;
    targetName: string;
    customPhone: string;
    customMessage: string;
  } | null>(null);

  const { data: requests = [], isLoading } = useQuery<PermintaanTarikItem[]>({
    queryKey: ['permintaan-tarik'],
    queryFn: async () => {
      const { data } = await apiClient.get('/students/permintaan-tarik');
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Extract distinct cabang options for dropdowns
  const requestingCabangList = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => {
      if (r.requestingCabang?.name) set.add(r.requestingCabang.name);
    });
    return Array.from(set).sort();
  }, [requests]);

  const targetCabangList = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => {
      if (r.targetCabang?.name) set.add(r.targetCabang.name);
    });
    return Array.from(set).sort();
  }, [requests]);

  // Filter logic
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // 1. Keyword search (Siswa, NIK, NISN, Cabang Peminta, Cabang Asal, Alasan, Nama Ketua)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentName = req.student?.biodata?.fullName?.toLowerCase() || '';
        const nik = req.student?.biodata?.nik || '';
        const nisn = req.student?.biodata?.nisn || '';
        const reqCabang = req.requestingCabang?.name?.toLowerCase() || '';
        const targetCabang = req.targetCabang?.name?.toLowerCase() || '';
        const alasan = req.alasan?.toLowerCase() || '';
        const ketuaName = req.targetCabang?.ketuaMuadalah?.name?.toLowerCase() || '';

        const match = studentName.includes(q) ||
          nik.includes(q) ||
          nisn.includes(q) ||
          reqCabang.includes(q) ||
          targetCabang.includes(q) ||
          alasan.includes(q) ||
          ketuaName.includes(q);

        if (!match) return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'ALL' && req.status !== selectedStatus) {
        return false;
      }

      // 3. Requesting Cabang filter
      if (selectedRequestingCabang !== 'ALL' && req.requestingCabang?.name !== selectedRequestingCabang) {
        return false;
      }

      // 4. Target Cabang filter
      if (selectedTargetCabang !== 'ALL' && req.targetCabang?.name !== selectedTargetCabang) {
        return false;
      }

      // 5. Date Range
      if (startDate) {
        const d = new Date(req.createdAt);
        const start = new Date(startDate);
        if (d < start) return false;
      }
      if (endDate) {
        const d = new Date(req.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }

      return true;
    });
  }, [requests, searchQuery, selectedStatus, selectedRequestingCabang, selectedTargetCabang, startDate, endDate]);

  // Metric counts
  const totalCount = requests.length;
  const pendingCount = useMemo(() => requests.filter(r => r.status === 'PENDING').length, [requests]);
  const approvedCount = useMemo(() => requests.filter(r => r.status === 'APPROVED').length, [requests]);
  const rejectedCount = useMemo(() => requests.filter(r => r.status === 'REJECTED').length, [requests]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedRequestingCabang !== 'ALL') count++;
    if (selectedTargetCabang !== 'ALL') count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  }, [searchQuery, selectedStatus, selectedRequestingCabang, selectedTargetCabang, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedRequestingCabang('ALL');
    setSelectedTargetCabang('ALL');
    setStartDate('');
    setEndDate('');
  };

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/students/permintaan-tarik/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan-tarik'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showToast('success', 'Permintaan tarik data berhasil disetujui');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyetujui permintaan');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/students/permintaan-tarik/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan-tarik'] });
      showToast('info', 'Permintaan tarik data berhasil ditolak');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menolak permintaan');
    }
  });

  const handleOpenWaModal = (req: PermintaanTarikItem) => {
    const ketuaContact = getKetuaMuadalahContact(req.targetCabang);
    const message = buildTarikDataWaMessage(req, requests);

    setWaModalData({
      req,
      targetName: ketuaContact.name,
      customPhone: ketuaContact.phone,
      customMessage: message
    });
  };

  const handleCopyWaMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    showToast('success', 'Pesan WhatsApp berhasil disalin ke clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-600" />
            Permintaan Tarik Data Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola dan konfirmasi permohonan penarikan data santri antar cabang via WhatsApp Ketua Muadalah
          </p>
        </div>
      </div>

      {/* Summary KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Permintaan</span>
            <span className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
              <Database className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">{totalCount}</span>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu (Pending)</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-amber-900 mt-2 block">{pendingCount}</span>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Disetujui (Approved)</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-900 mt-2 block">{approvedCount}</span>
        </div>

        <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Ditolak (Rejected)</span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-800 border border-rose-200">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <span className="text-2xl font-black text-rose-900 mt-2 block">{rejectedCount}</span>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, NIK, NISN, cabang pemohon, cabang asal, ketua muadalah..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${isFilterExpanded || activeFiltersCount > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Advanced Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status Permintaan
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu (Pending)</option>
                <option value="APPROVED">Disetujui (Approved)</option>
                <option value="REJECTED">Ditolak (Rejected)</option>
              </select>
            </div>

            {/* Cabang Peminta */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cabang Pemohon (Tujuan)
              </label>
              <select
                value={selectedRequestingCabang}
                onChange={(e) => setSelectedRequestingCabang(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Cabang Pemohon</option>
                {requestingCabangList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Cabang Asal */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cabang Asal (Target)
              </label>
              <select
                value={selectedTargetCabang}
                onChange={(e) => setSelectedTargetCabang(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Cabang Asal</option>
                {targetCabangList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Rentang Tanggal
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all"
                  title="Dari Tanggal"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 focus:bg-white focus:border-indigo-600 transition-all"
                  title="Sampai Tanggal"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Indicators */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl animate-in fade-in duration-200">
          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter Aktif ({filteredRequests.length} data):
          </span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
              Pencarian: "{searchQuery}"
              <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-rose-600 ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStatus !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
              Status: {selectedStatus}
              <button type="button" onClick={() => setSelectedStatus('ALL')} className="text-slate-400 hover:text-rose-600 ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedRequestingCabang !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
              Pemohon: {selectedRequestingCabang}
              <button type="button" onClick={() => setSelectedRequestingCabang('ALL')} className="text-slate-400 hover:text-rose-600 ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTargetCabang !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
              Asal: {selectedTargetCabang}
              <button type="button" onClick={() => setSelectedTargetCabang('ALL')} className="text-slate-400 hover:text-rose-600 ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-auto cursor-pointer"
          >
            Hapus Semua Filter
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Memuat data permintaan tarik data...</div>
        ) : filteredRequests && filteredRequests.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50/90 font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Siswa</th>
                    <th className="px-5 py-3.5">Cabang Pemohon (Tujuan)</th>
                    <th className="px-5 py-3.5">Cabang Asal</th>
                    <th className="px-5 py-3.5">Ketua Muadalah & WhatsApp</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Tanggal</th>
                    {user?.scope === 'GLOBAL' && (
                      <th className="px-5 py-3.5 text-right">Aksi Pusat</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 font-medium">
                  {filteredRequests
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((req) => {
                      const relatedStudents = getRelatedStudentsForCabangPair(req, requests);
                      const ketuaContact = getKetuaMuadalahContact(req.targetCabang);
                      const sanitizedPhone = ketuaContact.phone;
                      const messageText = buildTarikDataWaMessage(req, requests);
                      const waUrl = sanitizedPhone ? `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(messageText)}` : '';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Kolom Siswa */}
                          <td className="px-5 py-4">
                            <div className="font-extrabold text-slate-900 text-sm">
                              {req.student?.biodata?.fullName || 'Tanpa Nama'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                              {req.student?.biodata?.nik && (
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                  NIK: {req.student.biodata.nik}
                                </span>
                              )}
                              {req.student?.biodata?.nisn && (
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                  NISN: {req.student.biodata.nisn}
                                </span>
                              )}
                            </div>
                            {req.alasan && (
                              <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200/70 px-2 py-1 rounded-lg mt-1.5 max-w-xs">
                                <strong>Alasan:</strong> {req.alasan}
                              </div>
                            )}
                          </td>

                          {/* Kolom Cabang Pemohon */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{req.requestingCabang?.name || '-'}</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-1">
                              Tujuan Tarik
                            </span>
                          </td>

                          {/* Kolom Cabang Asal */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{req.targetCabang?.name || '-'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                              Asal Siswa
                            </span>
                          </td>

                          {/* Kolom Ketua Muadalah & WhatsApp (wa.me/kodenegara-nomor) */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5">
                              <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>{ketuaContact.name}</span>
                              </div>

                              {sanitizedPhone ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold text-xs shadow-2xs transition-all group"
                                    title={`Klik untuk mengirim pesan WA verifikasi ke ${ketuaContact.name} (${relatedStudents.length} santri sekaligus)`}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                    <span className="font-mono">wa.me/{sanitizedPhone}</span>
                                    {relatedStudents.length > 1 && (
                                      <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-black ml-0.5">
                                        {relatedStudents.length} Santri
                                      </span>
                                    )}
                                    <ExternalLink className="w-3 h-3 text-emerald-600 opacity-70" />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenWaModal(req)}
                                    className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                                    title="Sesuaikan nomor atau edit isi pesan"
                                  >
                                    Edit Pesan
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWaModal(req)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Kirim WhatsApp</span>
                                  </button>
                                  <span className="text-[10px] text-slate-400 italic">
                                    No HP belum diisi
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Kolom Status */}
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${req.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                                  : req.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                                }`}
                            >
                              {req.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-700 shrink-0" />}
                              {req.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />}
                              {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-rose-700 shrink-0" />}
                              {req.status === 'PENDING' ? 'Menunggu' : req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </td>

                          {/* Kolom Tanggal */}
                          <td className="px-5 py-4 text-center text-slate-600 whitespace-nowrap text-[11px]">
                            <div className="font-semibold text-slate-800">
                              {new Date(req.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(req.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          {/* Kolom Aksi Pusat (GLOBAL Scope) */}
                          {user?.scope === 'GLOBAL' && (
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              {req.status === 'PENDING' ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Setujui permintaan penarikan siswa ${req.student?.biodata?.fullName || ''} ke ${req.requestingCabang?.name || ''}?`)) {
                                        approveMutation.mutate(req.id);
                                      }
                                    }}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="inline-flex items-center px-3 py-1.5 border border-emerald-300 text-xs font-bold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Setujui
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Tolak permintaan penarikan siswa ${req.student?.biodata?.fullName || ''}?`)) {
                                        rejectMutation.mutate(req.id);
                                      }
                                    }}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="inline-flex items-center px-3 py-1.5 border border-rose-300 text-xs font-bold rounded-xl text-rose-800 bg-rose-50 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5 mr-1 text-rose-600" /> Tolak
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-semibold italic">
                                  Selesai diproses
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={filteredRequests.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {requests.length === 0 ? 'Belum ada permintaan penarikan data siswa.' : 'Tidak ada data permintaan yang sesuai filter.'}
            </h3>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog WhatsApp Custom Message */}
      {waModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-5 h-5" />
                <div>
                  <h3 className="font-extrabold text-sm">Kirim Konfirmasi WhatsApp ke Ketua Muadalah</h3>
                  <span className="text-[11px] text-emerald-100 block">
                    Tujuan: {waModalData.targetName} ({waModalData.req.targetCabang?.name || 'Cabang Asal'})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaModalData(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Ketua Muadalah (Format Sanitasi: 628xxxxxxxxxx)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={waModalData.customPhone}
                    onChange={(e) => {
                      const sanitized = sanitizeWaNumber(e.target.value);
                      setWaModalData({ ...waModalData, customPhone: sanitized });
                    }}
                    placeholder="Contoh: 6281356522125"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Format tautan: <strong className="text-emerald-700 font-mono">wa.me/{waModalData.customPhone || '6281356522125'}</strong>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Isi Pesan Konfirmasi Permintaan Tarik Data (Otomatis Memuat Daftar Siswa Cabang Pemohon)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyWaMessage(waModalData.customMessage)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Salin Teks
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={waModalData.customMessage}
                  onChange={(e) => setWaModalData({ ...waModalData, customMessage: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-xl font-sans text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setWaModalData(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleCopyWaMessage(waModalData.customMessage)}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Salin Pesan
              </button>
              <a
                href={
                  waModalData.customPhone
                    ? `https://wa.me/${waModalData.customPhone}?text=${encodeURIComponent(waModalData.customMessage)}`
                    : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!waModalData.customPhone) {
                    e.preventDefault();
                    showToast('error', 'Silakan masukkan nomor WhatsApp tujuan terlebih dahulu.');
                  }
                }}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${waModalData.customPhone
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-slate-400 cursor-not-allowed'
                  }`}
              >
                <MessageCircle className="w-4 h-4" /> Buka WhatsApp (wa.me)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
