import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { useGetCabang } from '../../core_data/hooks/useMasterData';
import Pagination from '../../../components/Pagination';
import { normalizeTurkish } from '../../../utils/text';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Wallet,
  Receipt,
  FileCheck,
  Calendar,
  Layers,
  Banknote,
  DollarSign,
  QrCode,
  Eye,
  Check,
  X,
  Edit2,
  Trash2,
  Loader2,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

export interface SyahriyahTarifItem {
  id: string;
  name: string;
  kategori: 'BULANAN' | 'TAHUNAN' | 'SANTRI_BARU' | 'LAINNYA';
  nominal: number;
  cabangId?: string | null;
  cabang?: { id: string; name: string } | null;
  tahunAjaran?: string | null;
  tingkat?: string | null;
  deskripsi?: string | null;
  isActive: boolean;
}

export interface RekeningPembayaranItem {
  id: string;
  bankName: string;
  nomorRekening: string;
  atasNama: string;
  cabangId?: string | null;
  cabang?: { id: string; name: string } | null;
  qrisUrl?: string | null;
  catatan?: string | null;
  isActive: boolean;
}

export interface TagihanSantriItem {
  id: string;
  studentId: string;
  judul: string;
  kategori: 'BULANAN' | 'TAHUNAN' | 'SANTRI_BARU' | 'LAINNYA';
  bulan?: number | null;
  tahun: number;
  nominal: number;
  sisaBayar: number;
  status: 'LUNAS' | 'PENDING' | 'BELUM_LUNAS';
  jatuhTempo?: string | null;
  keterangan?: string | null;
  createdAt: string;
  student: {
    id: string;
    biodata?: {
      fullName?: string;
      nik?: string;
      nisn?: string;
    } | null;
    cabang?: { id: string; name: string } | null;
    siswaFormal?: { kelas?: { name: string } | null } | null;
  };
  tarif?: SyahriyahTarifItem | null;
  pembayaran?: Array<{
    id: string;
    nominal: number;
    tanggalBayar: string;
    metode: string;
    buktiUrl?: string | null;
    status: string;
    catatanWali?: string | null;
    catatanAdmin?: string | null;
    waliUser?: { operatorName?: string; username: string; phone?: string } | null;
    verifiedBy?: { operatorName?: string; username: string } | null;
  }>;
}

const BULAN_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const KATEGORI_LABEL: Record<string, { label: string; color: string }> = {
  BULANAN: { label: 'Iuran Syahriyah Bulanan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TAHUNAN: { label: 'Biaya Tahunan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  SANTRI_BARU: { label: 'Biaya Santri Baru', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  LAINNYA: { label: 'Biaya Lainnya', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function SyahriyahTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: cabangList = [] } = useGetCabang();

  const [activeSubTab, setActiveSubTab] = useState<'tagihan' | 'tarif' | 'rekening' | 'generate'>('tagihan');

  // Filters & Pagination for tagihan
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());
  const [filterCabangId, setFilterCabangId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modals state
  const [selectedTagihanForDirectPay, setSelectedTagihanForDirectPay] = useState<TagihanSantriItem | null>(null);
  const [selectedPembayaranForVerify, setSelectedPembayaranForVerify] = useState<{
    pembayaran: any;
    tagihan: TagihanSantriItem;
  } | null>(null);
  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [editingTarif, setEditingTarif] = useState<SyahriyahTarifItem | null>(null);
  const [isRekeningModalOpen, setIsRekeningModalOpen] = useState(false);
  const [editingRekening, setEditingRekening] = useState<RekeningPembayaranItem | null>(null);
  const [isManualTagihanModalOpen, setIsManualTagihanModalOpen] = useState(false);

  // Form states
  const [directPayNominal, setDirectPayNominal] = useState<number>(0);
  const [directPayMetode, setDirectPayMetode] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [directPayCatatan, setDirectPayCatatan] = useState('');

  const [verifyCatatan, setVerifyCatatan] = useState('');

  // Generate form state
  const [genBulan, setGenBulan] = useState<number>(new Date().getMonth() + 1);
  const [genTahun, setGenTahun] = useState<number>(new Date().getFullYear());
  const [genCabangId, setGenCabangId] = useState<string>(user?.cabangId || '');
  const [genNominal, setGenNominal] = useState<string>('');
  const [genJatuhTempo, setGenJatuhTempo] = useState<string>('');

  // Tarif form state
  const [tarifName, setTarifName] = useState('');
  const [tarifKategori, setTarifKategori] = useState<'BULANAN' | 'TAHUNAN' | 'SANTRI_BARU' | 'LAINNYA'>('BULANAN');
  const [tarifNominal, setTarifNominal] = useState<number>(0);
  const [tarifCabangId, setTarifCabangId] = useState<string>('');
  const [tarifTahunAjaran, setTarifTahunAjaran] = useState('2026/2027');
  const [tarifDeskripsi, setTarifDeskripsi] = useState('');

  // Rekening form state
  const [rekBankName, setRekBankName] = useState('');
  const [rekNomor, setRekNomor] = useState('');
  const [rekAtasNama, setRekAtasNama] = useState('');
  const [rekCabangId, setRekCabangId] = useState<string>('');
  const [rekQrisUrl, setRekQrisUrl] = useState('');
  const [rekCatatan, setRekCatatan] = useState('');

  // Manual Tagihan form state
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualJudul, setManualJudul] = useState('');
  const [manualKategori, setManualKategori] = useState<'BULANAN' | 'TAHUNAN' | 'SANTRI_BARU' | 'LAINNYA'>('BULANAN');
  const [manualBulan, setManualBulan] = useState<string>('');
  const [manualTahun, setManualTahun] = useState<string>(new Date().getFullYear().toString());
  const [manualNominal, setManualNominal] = useState<number>(0);
  const [manualJatuhTempo, setManualJatuhTempo] = useState<string>('');
  const [manualKeterangan, setManualKeterangan] = useState('');

  // ═══════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['syahriyah-admin-stats', filterKategori, filterStatus, filterBulan, filterTahun, filterCabangId, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterKategori) params.append('kategori', filterKategori);
      if (filterStatus) params.append('status', filterStatus);
      if (filterBulan) params.append('bulan', filterBulan);
      if (filterTahun) params.append('tahun', filterTahun);
      if (filterCabangId) params.append('cabangId', filterCabangId);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiClient.get(`/syahriyah-admin/stats?${params.toString()}`);
      return res.data;
    }
  });

  interface TagihanPaginationResponse {
    data: TagihanSantriItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }

  const { data: tagihanResponse, isLoading: isLoadingTagihan, refetch: refetchTagihan } = useQuery<TagihanPaginationResponse>({
    queryKey: ['syahriyah-admin-tagihan', filterKategori, filterStatus, filterBulan, filterTahun, filterCabangId, searchQuery, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterKategori) params.append('kategori', filterKategori);
      if (filterStatus) params.append('status', filterStatus);
      if (filterBulan) params.append('bulan', filterBulan);
      if (filterTahun) params.append('tahun', filterTahun);
      if (filterCabangId) params.append('cabangId', filterCabangId);
      if (searchQuery) params.append('search', normalizeTurkish(searchQuery));
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const res = await apiClient.get(`/syahriyah-admin/tagihan?${params.toString()}`);
      return res.data;
    }
  });

  const tagihanList = tagihanResponse?.data || [];
  const totalItems = tagihanResponse?.total || 0;
  const totalPages = tagihanResponse?.totalPages || 1;

  const { data: tarifList = [], isLoading: isLoadingTarif, refetch: refetchTarif } = useQuery<SyahriyahTarifItem[]>({
    queryKey: ['syahriyah-admin-tarif'],
    queryFn: async () => {
      const res = await apiClient.get('/syahriyah-admin/tarif');
      return res.data;
    }
  });

  const { data: rekeningList = [], isLoading: isLoadingRekening, refetch: refetchRekening } = useQuery<RekeningPembayaranItem[]>({
    queryKey: ['syahriyah-admin-rekening'],
    queryFn: async () => {
      const res = await apiClient.get('/syahriyah-admin/rekening');
      return res.data;
    }
  });

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════

  const directPayMutation = useMutation({
    mutationFn: async ({ tagihanId, payload }: { tagihanId: string; payload: any }) => {
      const res = await apiClient.post(`/syahriyah-admin/tagihan/${tagihanId}/bayar-langsung`, payload);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', 'Pembayaran kasir berhasil dicatat. Status tagihan lunas!');
      setSelectedTagihanForDirectPay(null);
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mencatat pembayaran');
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ pembayaranId, action, catatanAdmin }: { pembayaranId: string; action: 'APPROVE' | 'REJECT'; catatanAdmin?: string }) => {
      const res = await apiClient.put(`/syahriyah-admin/pembayaran/${pembayaranId}/verifikasi`, { action, catatanAdmin });
      return res.data;
    },
    onSuccess: (_, vars) => {
      if (vars.action === 'APPROVE') {
        showToast('success', 'Pembayaran disetujui! Status tagihan otomatis menjadi Lunas.');
      } else {
        showToast('warning', 'Pembayaran ditolak. Status tagihan dikembalikan ke Belum Lunas.');
      }
      setSelectedPembayaranForVerify(null);
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal memproses verifikasi');
    }
  });

  const generateBulananMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/syahriyah-admin/tagihan/generate-bulanan', payload);
      return res.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Tagihan bulanan berhasil di-generate!');
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
      setActiveSubTab('tagihan');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal men-generate tagihan bulanan');
    }
  });

  const saveTarifMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingTarif) {
        const res = await apiClient.put(`/syahriyah-admin/tarif/${editingTarif.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post('/syahriyah-admin/tarif', payload);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', editingTarif ? 'Tarif berhasil diperbarui!' : 'Tarif biaya baru berhasil ditambahkan!');
      setIsTarifModalOpen(false);
      setEditingTarif(null);
      refetchTarif();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan tarif biaya');
    }
  });

  const deleteTarifMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/syahriyah-admin/tarif/${id}`);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', 'Tarif biaya berhasil dihapus');
      refetchTarif();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus tarif');
    }
  });

  const saveRekeningMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingRekening) {
        const res = await apiClient.put(`/syahriyah-admin/rekening/${editingRekening.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post('/syahriyah-admin/rekening', payload);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', editingRekening ? 'Rekening berhasil diperbarui!' : 'Rekening pembayaran baru berhasil disimpan!');
      setIsRekeningModalOpen(false);
      setEditingRekening(null);
      refetchRekening();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan rekening');
    }
  });

  const deleteRekeningMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/syahriyah-admin/rekening/${id}`);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', 'Rekening pembayaran berhasil dihapus');
      refetchRekening();
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus rekening');
    }
  });

  const createManualTagihanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/syahriyah-admin/tagihan', payload);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', 'Tagihan santri berhasil dibuat!');
      setIsManualTagihanModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal membuat tagihan');
    }
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Tagihan ({stats?.totalCount || 0})</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {formatRupiah(stats?.totalNominal || 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Terbayar Lunas ({stats?.lunasCount || 0})</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5">
              {formatRupiah(stats?.lunasNominal || 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Menunggu Verifikasi ({stats?.pendingCount || 0})</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-amber-700 mt-0.5">
              {formatRupiah(stats?.pendingNominal || 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Belum Lunas ({stats?.belumLunasCount || 0})</span>
            <h3 className="text-lg sm:text-xl font-extrabold text-rose-700 mt-0.5">
              {formatRupiah(stats?.belumLunasNominal || 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('tagihan')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'tagihan'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Status Pembayaran Santri
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tarif')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'tarif'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Setting Biaya & Tarif
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rekening')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'rekening'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Setting Rekening Bank
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('generate')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'generate'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Generate Tagihan Massal
          </button>
        </div>

        {activeSubTab === 'tagihan' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setManualStudentId('');
                setManualJudul('');
                setManualNominal(0);
                setManualKategori('BULANAN');
                setManualBulan((new Date().getMonth() + 1).toString());
                setManualTahun(new Date().getFullYear().toString());
                setIsManualTagihanModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Tagihan Manual
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: STATUS PEMBAYARAN SANTRI ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'tagihan' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari santri, NIK, NISN, atau judul..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Kategori Filter */}
            <select
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">Semua Kategori</option>
              <option value="BULANAN">Iuran Syahriyah Bulanan</option>
              <option value="TAHUNAN">Biaya Tahunan</option>
              <option value="SANTRI_BARU">Biaya Santri Baru</option>
              <option value="LAINNYA">Biaya Lainnya</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="LUNAS">LUNAS</option>
              <option value="PENDING">PENDING (Menunggu Verifikasi)</option>
              <option value="BELUM_LUNAS">BELUM LUNAS</option>
            </select>

            {/* Bulan Filter */}
            <select
              value={filterBulan}
              onChange={(e) => {
                setFilterBulan(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">Semua Bulan</option>
              {BULAN_LABELS.map((b, idx) => (
                <option key={idx + 1} value={idx + 1}>{b}</option>
              ))}
            </select>

            {/* Tahun Filter */}
            <select
              value={filterTahun}
              onChange={(e) => {
                setFilterTahun(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* Cabang Filter for Global Admin */}
            {user?.scope !== 'CABANG' && (
              <select
                value={filterCabangId}
                onChange={(e) => {
                  setFilterCabangId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="">Semua Cabang</option>
                {cabangList.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {(filterKategori || filterStatus || filterBulan || filterCabangId || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterKategori('');
                  setFilterStatus('');
                  setFilterBulan('');
                  setFilterCabangId('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Tagihan Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoadingTagihan ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> Memuat data tagihan santri...
              </div>
            ) : tagihanList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Tidak ada data tagihan yang sesuai filter.</p>
                <p className="text-slate-400">Gunakan tombol "Generate Tagihan Massal" untuk membuat tagihan iuran bulanan santri.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 backdrop-blur-xs text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Santri</th>
                      <th className="py-3 px-4">Cabang / Kelas</th>
                      <th className="py-3 px-4">Judul Tagihan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Bukti Bayar</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tagihanList.map((t) => {
                      const latestPembayaran = t.pembayaran && t.pembayaran.length > 0 ? t.pembayaran[0] : null;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Santri */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{t.student.biodata?.fullName || 'Tanpa Nama'}</div>
                            <div className="text-[10px] text-slate-400 font-normal font-mono">
                              NIK: {t.student.biodata?.nik || '-'} {t.student.biodata?.nisn ? `• NISN: ${t.student.biodata.nisn}` : ''}
                            </div>
                          </td>

                          {/* Cabang & Kelas */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="font-semibold text-slate-800">{t.student.cabang?.name || '-'}</div>
                            <div className="text-[10px] text-slate-500">{t.student.siswaFormal?.kelas?.name || 'Belum Ada Kelas'}</div>
                          </td>

                          {/* Judul Tagihan */}
                          <td className="py-3.5 px-4 text-slate-800 font-medium">
                            <div>{t.judul}</div>
                            {t.jatuhTempo && (
                              <div className="text-[10px] text-slate-400">
                                Jatuh Tempo: {new Date(t.jatuhTempo).toLocaleDateString('id-ID')}
                              </div>
                            )}
                          </td>

                          {/* Kategori */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${KATEGORI_LABEL[t.kategori]?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {KATEGORI_LABEL[t.kategori]?.label || t.kategori}
                            </span>
                          </td>

                          {/* Nominal */}
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                            {formatRupiah(t.nominal)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            {t.status === 'LUNAS' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> LUNAS
                              </span>
                            ) : t.status === 'PENDING' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" /> PENDING
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> BELUM LUNAS
                              </span>
                            )}
                          </td>

                          {/* Bukti Bayar */}
                          <td className="py-3.5 px-4 text-center">
                            {latestPembayaran ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPembayaranForVerify({ pembayaran: latestPembayaran, tagihan: t })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                {latestPembayaran.buktiUrl ? 'Lihat Bukti' : 'Detail'}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {t.status !== 'LUNAS' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTagihanForDirectPay(t);
                                  setDirectPayNominal(t.nominal);
                                  setDirectPayMetode('TUNAI');
                                  setDirectPayCatatan('');
                                }}
                                className="px-3 py-1 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <Banknote className="w-3 h-3" />
                                Bayar Kasir
                              </button>
                            )}

                            {t.status === 'PENDING' && latestPembayaran && (
                              <button
                                type="button"
                                onClick={() => setSelectedPembayaranForVerify({ pembayaran: latestPembayaran, tagihan: t })}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Verifikasi
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan <span className="font-bold text-slate-800">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> data tagihan
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Baris:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={(p) => setCurrentPage(p)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: SETTING BIAYA (MASTER TARIF) ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'tarif' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                Master Tarif & Komponen Biaya Santri
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur nominal standar biaya Syahriyah bulanan, biaya tahunan, dan biaya santri baru.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTarif(null);
                setTarifName('');
                setTarifKategori('BULANAN');
                setTarifNominal(0);
                setTarifCabangId(user?.cabangId || '');
                setTarifTahunAjaran('2026/2027');
                setTarifDeskripsi('');
                setIsTarifModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Tarif Biaya
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoadingTarif ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> Memuat tarif...
              </div>
            ) : tarifList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Belum ada tarif biaya yang dikonfigurasi. Klik tombol di atas untuk menambah tarif.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Tarif</th>
                      <th className="py-3 px-4">Kategori Biaya</th>
                      <th className="py-3 px-4">Cabang</th>
                      <th className="py-3 px-4">Tahun Ajaran</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tarifList.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{tr.name}</div>
                          {tr.deskripsi && <div className="text-[10px] text-slate-400 font-normal">{tr.deskripsi}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${KATEGORI_LABEL[tr.kategori]?.color || 'bg-slate-100 text-slate-600'}`}>
                            {KATEGORI_LABEL[tr.kategori]?.label || tr.kategori}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {tr.cabang?.name ? (
                            <span className="inline-flex items-center gap-1 text-slate-800">
                              <Building2 className="w-3 h-3 text-indigo-500" /> {tr.cabang.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">Semua Cabang (Global)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{tr.tahunAjaran || '-'}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          {formatRupiah(tr.nominal)}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTarif(tr);
                              setTarifName(tr.name);
                              setTarifKategori(tr.kategori);
                              setTarifNominal(tr.nominal);
                              setTarifCabangId(tr.cabangId || '');
                              setTarifTahunAjaran(tr.tahunAjaran || '2026/2027');
                              setTarifDeskripsi(tr.deskripsi || '');
                              setIsTarifModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus tarif ${tr.name}?`)) {
                                deleteTarifMutation.mutate(tr.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: SETTING REKENING BANK ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'rekening' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Rekening Pembayaran Resmi Pesantren
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekening tujuan transfer yang akan ditampilkan kepada wali santri saat membayar Syahriyah di portal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingRekening(null);
                setRekBankName('');
                setRekNomor('');
                setRekAtasNama('');
                setRekCabangId(user?.cabangId || '');
                setRekQrisUrl('');
                setRekCatatan('');
                setIsRekeningModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Rekening Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingRekening ? (
              <div className="col-span-full p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> Memuat data rekening...
              </div>
            ) : rekeningList.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-xs text-slate-500">
                Belum ada rekening pembayaran yang didaftarkan.
              </div>
            ) : (
              rekeningList.map((rk) => (
                <div key={rk.id} className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-900/60 relative overflow-hidden flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                        {rk.cabang?.name ? `Cabang: ${rk.cabang.name}` : 'Semua Cabang (Pusat)'}
                      </span>
                      <h4 className="text-lg font-extrabold text-white mt-1">{rk.bankName}</h4>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-300 font-medium">Nomor Rekening:</span>
                    <div className="text-xl font-mono font-bold tracking-wider text-amber-300 select-all">
                      {rk.nomorRekening}
                    </div>
                    <div className="text-xs text-slate-200">
                      a.n. <strong className="text-white">{rk.atasNama}</strong>
                    </div>
                  </div>

                  {rk.catatan && (
                    <div className="text-[11px] text-indigo-200/80 bg-white/5 p-2.5 rounded-xl border border-white/10">
                      {rk.catatan}
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRekening(rk);
                        setRekBankName(rk.bankName);
                        setRekNomor(rk.nomorRekening);
                        setRekAtasNama(rk.atasNama);
                        setRekCabangId(rk.cabangId || '');
                        setRekQrisUrl(rk.qrisUrl || '');
                        setRekCatatan(rk.catatan || '');
                        setIsRekeningModalOpen(true);
                      }}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus rekening ${rk.bankName} - ${rk.nomorRekening}?`)) {
                          deleteRekeningMutation.mutate(rk.id);
                        }
                      }}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: GENERATE TAGIHAN MASSAL ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'generate' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Generate Tagihan Syahriyah Bulanan Massal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sistem akan secara otomatis membuat tagihan Syahriyah bulanan kepada seluruh santri aktif yang belum memiliki tagihan pada bulan & tahun yang dipilih.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              generateBulananMutation.mutate({
                bulan: genBulan,
                tahun: genTahun,
                cabangId: genCabangId || undefined,
                nominal: genNominal ? Number(genNominal) : undefined,
                jatuhTempo: genJatuhTempo || undefined
              });
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Bulan *</label>
                <select
                  value={genBulan}
                  onChange={(e) => setGenBulan(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {BULAN_LABELS.map((b, idx) => (
                    <option key={idx + 1} value={idx + 1}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Pilih Tahun *</label>
                <select
                  value={genTahun}
                  onChange={(e) => setGenTahun(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            {user?.scope !== 'CABANG' && (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Target Cabang</label>
                <select
                  value={genCabangId}
                  onChange={(e) => setGenCabangId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Semua Cabang Aktif</option>
                  {cabangList.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nominal Tagihan (Opsional)</label>
                <input
                  type="number"
                  placeholder="Kosongkan untuk pakai tarif master"
                  value={genNominal}
                  onChange={(e) => setGenNominal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400">Jika dikosongkan, nominal akan otomatis mengambil dari Setting Tarif Biaya Syahriyah.</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={genJatuhTempo}
                  onChange={(e) => setGenJatuhTempo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400">Default: Tanggal 10 pada bulan tersebut.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={generateBulananMutation.isPending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generateBulananMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Men-generate Tagihan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Proses Generate Tagihan {BULAN_LABELS[genBulan - 1]} {genTahun}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: BAYAR LANGSUNG KASIR ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedTagihanForDirectPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Bayar Langsung / Kasir
              </h3>
              <button
                onClick={() => setSelectedTagihanForDirectPay(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
              <div className="text-slate-500">Santri:</div>
              <div className="font-bold text-slate-900 text-sm">
                {selectedTagihanForDirectPay.student.biodata?.fullName}
              </div>
              <div className="text-slate-600 font-medium">
                {selectedTagihanForDirectPay.judul} ({KATEGORI_LABEL[selectedTagihanForDirectPay.kategori]?.label})
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                directPayMutation.mutate({
                  tagihanId: selectedTagihanForDirectPay.id,
                  payload: {
                    nominal: directPayNominal,
                    metode: directPayMetode,
                    catatan: directPayCatatan
                  }
                });
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nominal Pembayaran (Rp) *</label>
                <input
                  type="number"
                  required
                  value={directPayNominal}
                  onChange={(e) => setDirectPayNominal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Metode Pembayaran *</label>
                <select
                  value={directPayMetode}
                  onChange={(e) => setDirectPayMetode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="TUNAI">Tunai di Kantor Cabang / Kasir</option>
                  <option value="TRANSFER">Transfer Bank / Setor Tunai</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Catatan / Keterangan Kasir</label>
                <input
                  type="text"
                  placeholder="Misal: Diterima oleh Ustadz Admin Cabang"
                  value={directPayCatatan}
                  onChange={(e) => setDirectPayCatatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTagihanForDirectPay(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={directPayMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {directPayMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: VERIFIKASI BUKTI TRANSFER WALSAN ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedPembayaranForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Verifikasi Bukti Pembayaran Walsan
              </h3>
              <button
                onClick={() => setSelectedPembayaranForVerify(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Santri</span>
                  <span className="font-bold text-slate-900">{selectedPembayaranForVerify.tagihan.student.biodata?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tagihan</span>
                  <span className="font-bold text-slate-900">{selectedPembayaranForVerify.tagihan.judul}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nominal Dibayar</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">{formatRupiah(selectedPembayaranForVerify.pembayaran.nominal)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Bayar</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedPembayaranForVerify.pembayaran.tanggalBayar).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              {selectedPembayaranForVerify.pembayaran.catatanWali && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block text-[10px] uppercase tracking-wide text-amber-700">Catatan dari Wali Santri:</span>
                  {selectedPembayaranForVerify.pembayaran.catatanWali}
                </div>
              )}

              {/* Bukti Transfer Image Preview */}
              {selectedPembayaranForVerify.pembayaran.buktiUrl ? (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">Bukti Transfer yang Diunggah:</span>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-64 bg-slate-100 flex items-center justify-center">
                    <img
                      src={selectedPembayaranForVerify.pembayaran.buktiUrl}
                      alt="Bukti Transfer"
                      className="max-h-64 object-contain w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-2xl">
                  Tidak ada file bukti transfer dilampirkan.
                </div>
              )}

              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 block">Catatan Verifikator (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Mutasi masuk di rekening BSI terkonfirmasi"
                  value={verifyCatatan}
                  onChange={(e) => setVerifyCatatan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={verifyPaymentMutation.isPending}
                onClick={() => {
                  verifyPaymentMutation.mutate({
                    pembayaranId: selectedPembayaranForVerify.pembayaran.id,
                    action: 'REJECT',
                    catatanAdmin: verifyCatatan || 'Bukti transfer tidak valid'
                  });
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Tolak Pembayaran
              </button>

              <button
                type="button"
                disabled={verifyPaymentMutation.isPending}
                onClick={() => {
                  verifyPaymentMutation.mutate({
                    pembayaranId: selectedPembayaranForVerify.pembayaran.id,
                    action: 'APPROVE',
                    catatanAdmin: verifyCatatan || 'Terkonfirmasi valid'
                  });
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {verifyPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Verifikasi & Tandai Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: TAMBAH / EDIT TARIF BIAYA ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isTarifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                {editingTarif ? 'Edit Tarif Biaya' : 'Tambah Tarif Biaya Baru'}
              </h3>
              <button
                onClick={() => setIsTarifModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveTarifMutation.mutate({
                  name: tarifName,
                  kategori: tarifKategori,
                  nominal: tarifNominal,
                  cabangId: tarifCabangId || null,
                  tahunAjaran: tarifTahunAjaran || null,
                  deskripsi: tarifDeskripsi || null
                });
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Tarif / Biaya *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Iuran Syahriyah Bulanan, Uang Pangkal"
                  value={tarifName}
                  onChange={(e) => setTarifName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Kategori Biaya *</label>
                <select
                  value={tarifKategori}
                  onChange={(e) => setTarifKategori(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="BULANAN">Iuran Syahriyah Bulanan (SPP)</option>
                  <option value="TAHUNAN">Biaya Tahunan (Daftar Ulang, Gedung)</option>
                  <option value="SANTRI_BARU">Biaya Santri Baru (Pangkal, Seragam)</option>
                  <option value="LAINNYA">Biaya Lainnya (Ujian, Kegiatan)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nominal Biaya (Rp) *</label>
                <input
                  type="number"
                  required
                  value={tarifNominal}
                  onChange={(e) => setTarifNominal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {user?.scope !== 'CABANG' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Cabang Khusus (Opsional)</label>
                  <select
                    value={tarifCabangId}
                    onChange={(e) => setTarifCabangId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Semua Cabang (Global Default)</option>
                    {cabangList.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tahun Ajaran</label>
                <input
                  type="text"
                  placeholder="Misal: 2026/2027"
                  value={tarifTahunAjaran}
                  onChange={(e) => setTarifTahunAjaran(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Deskripsi / Penjelasan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan komponen biaya..."
                  value={tarifDeskripsi}
                  onChange={(e) => setTarifDeskripsi(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTarifModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveTarifMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saveTarifMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Tarif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: TAMBAH / EDIT REKENING BANK ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isRekeningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                {editingRekening ? 'Edit Rekening Pembayaran' : 'Tambah Rekening Pembayaran Baru'}
              </h3>
              <button
                onClick={() => setIsRekeningModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveRekeningMutation.mutate({
                  bankName: rekBankName,
                  nomorRekening: rekNomor,
                  atasNama: rekAtasNama,
                  cabangId: rekCabangId || null,
                  qrisUrl: rekQrisUrl || null,
                  catatan: rekCatatan || null
                });
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Bank *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bank Syariah Indonesia (BSI), BCA, Mandiri"
                  value={rekBankName}
                  onChange={(e) => setRekBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nomor Rekening *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 7123456789"
                  value={rekNomor}
                  onChange={(e) => setRekNomor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Atas Nama Rekening *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pesantren Pusat / Cabang A"
                  value={rekAtasNama}
                  onChange={(e) => setRekAtasNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {user?.scope !== 'CABANG' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Cabang Khusus (Opsional)</label>
                  <select
                    value={rekCabangId}
                    onChange={(e) => setRekCabangId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Semua Cabang (Pusat)</option>
                    {cabangList.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Catatan / Instruksi Transfer</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Mohon cantumkan nama santri pada berita transfer..."
                  value={rekCatatan}
                  onChange={(e) => setRekCatatan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRekeningModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveRekeningMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saveRekeningMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: BUAT TAGIHAN MANUAL SATUAN ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isManualTagihanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Buat Tagihan Manual Santri
              </h3>
              <button
                onClick={() => setIsManualTagihanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createManualTagihanMutation.mutate({
                  studentId: manualStudentId,
                  judul: manualJudul,
                  kategori: manualKategori,
                  bulan: manualBulan ? Number(manualBulan) : null,
                  tahun: Number(manualTahun),
                  nominal: manualNominal,
                  jatuhTempo: manualJatuhTempo || null,
                  keterangan: manualKeterangan || null
                });
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ID Santri *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan UUID Santri..."
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Judul Tagihan *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Biaya Seragam Santri Baru, Daftar Ulang"
                  value={manualJudul}
                  onChange={(e) => setManualJudul(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Kategori</label>
                  <select
                    value={manualKategori}
                    onChange={(e) => setManualKategori(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="BULANAN">Bulanan</option>
                    <option value="TAHUNAN">Tahunan</option>
                    <option value="SANTRI_BARU">Santri Baru</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={manualNominal}
                    onChange={(e) => setManualNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Bulan (Jika Bulanan)</label>
                  <select
                    value={manualBulan}
                    onChange={(e) => setManualBulan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">- Tanpa Bulan -</option>
                    {BULAN_LABELS.map((b, idx) => (
                      <option key={idx + 1} value={idx + 1}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Tahun</label>
                  <input
                    type="number"
                    value={manualTahun}
                    onChange={(e) => setManualTahun(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={manualJatuhTempo}
                  onChange={(e) => setManualJatuhTempo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualTagihanModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createManualTagihanMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createManualTagihanMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
