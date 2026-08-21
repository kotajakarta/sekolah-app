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
  Info,
  Users,
  UserCheck,
  GraduationCap,
  CheckSquare,
  Square,
  User,
  Phone,
  MapPin
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

export interface SantriSyahriyahItem {
  id: string;
  biodata?: {
    fullName?: string;
    nisn?: string;
    nik?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    jenisKelamin?: string;
    fotoSantri?: string;
    namaAyah?: string;
    namaIbu?: string;
    nomorHp?: string;
    nomorHpWali?: string;
  } | null;
  cabang?: { id: string; name: string } | null;
  kelasName?: string;
  daimiName?: string;
  daimiKetua?: string;
  tagihanSummary: {
    totalCount: number;
    lunasCount: number;
    pendingCount: number;
    belumLunasCount: number;
    totalNominal: number;
    totalTerbayar: number;
    totalSisaBayar: number;
    statusBadge: 'NO_TAGIHAN' | 'SEMUA_LUNAS' | 'ADA_PENDING' | 'ADA_TUNGGAKAN';
  };
  tagihan: Array<{
    id: string;
    judul: string;
    kategori: string;
    bulan?: number | null;
    tahun: number;
    nominal: number;
    sisaBayar: number;
    status: string;
  }>;
}

export default function SyahriyahTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: cabangList = [] } = useGetCabang();

  const [activeSubTab, setActiveSubTab] = useState<'tagihan' | 'santri' | 'tarif' | 'rekening' | 'generate'>('tagihan');

  // Filters & Pagination for tagihan
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());
  const [filterCabangId, setFilterCabangId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Bulk Payment Modal State
  const [isBulkPayModalOpen, setIsBulkPayModalOpen] = useState<boolean>(false);
  const [bulkFilterCabangId, setBulkFilterCabangId] = useState<string>(user?.scope === 'CABANG' ? user.cabangId || '' : '');
  const [bulkFilterKategori, setBulkFilterKategori] = useState<string>('BULANAN');
  const [bulkFilterBulan, setBulkFilterBulan] = useState<string>((new Date().getMonth() + 1).toString());
  const [bulkFilterTahun, setBulkFilterTahun] = useState<string>(new Date().getFullYear().toString());
  const [bulkSearch, setBulkSearch] = useState<string>('');
  const [bulkSelectedTagihanIds, setBulkSelectedTagihanIds] = useState<string[]>([]);
  const [bulkPayMetode, setBulkPayMetode] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [bulkPayCatatan, setBulkPayCatatan] = useState<string>('Pembayaran langsung di Kasir / Kantor Cabang');

  // Santri Subtab State
  const [santriPage, setSantriPage] = useState<number>(1);
  const [santriLimit, setSantriLimit] = useState<number>(10);
  const [santriSearch, setSantriSearch] = useState<string>('');
  const [santriCabangId, setSantriCabangId] = useState<string>(user?.scope === 'CABANG' ? user.cabangId || '' : '');
  const [santriStatusTagihan, setSantriStatusTagihan] = useState<string>('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<string | null>(null);

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
  const [isDeleteMassalModalOpen, setIsDeleteMassalModalOpen] = useState(false);
  const [deleteMassalBulan, setDeleteMassalBulan] = useState<string>((new Date().getMonth() + 1).toString());
  const [deleteMassalTahun, setDeleteMassalTahun] = useState<string>(new Date().getFullYear().toString());
  const [deleteMassalCabangId, setDeleteMassalCabangId] = useState<string>(user?.scope === 'CABANG' ? user.cabangId || '' : '');
  const [deleteMassalKategori, setDeleteMassalKategori] = useState<string>('BULANAN');
  const [deleteMassalOnlyBelumLunas, setDeleteMassalOnlyBelumLunas] = useState<boolean>(true);

  // Form states
  const [directPayNominal, setDirectPayNominal] = useState<number>(0);
  const [directPayMetode, setDirectPayMetode] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [directPayCatatan, setDirectPayCatatan] = useState('');

  const [verifyCatatan, setVerifyCatatan] = useState('');

  // Generate form state
  const [genKategori, setGenKategori] = useState<'BULANAN' | 'TAHUNAN' | 'SANTRI_BARU' | 'LAINNYA'>('BULANAN');
  const [genTarifId, setGenTarifId] = useState<string>('');
  const [genJudul, setGenJudul] = useState<string>('');
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

  // Santri Tab Query
  const { data: santriSyahriyahResponse, isLoading: isLoadingSantri, refetch: refetchSantri } = useQuery<{
    data: SantriSyahriyahItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ['syahriyah-admin-santri', santriPage, santriLimit, santriSearch, santriCabangId, santriStatusTagihan],
    queryFn: async () => {
      const res = await apiClient.get('/syahriyah-admin/santri', {
        params: {
          page: santriPage,
          limit: santriLimit,
          search: santriSearch || undefined,
          cabangId: santriCabangId || undefined,
          statusTagihan: santriStatusTagihan || undefined
        }
      });
      return res.data;
    }
  });

  const santriList = santriSyahriyahResponse?.data || [];
  const totalSantriItems = santriSyahriyahResponse?.total || 0;
  const totalSantriPages = santriSyahriyahResponse?.totalPages || 1;

  // Student Detail Query
  const { data: studentDetailData, isLoading: isLoadingStudentDetail, refetch: refetchStudentDetail } = useQuery<any>({
    queryKey: ['syahriyah-admin-santri-detail', selectedStudentForDetail],
    queryFn: async () => {
      if (!selectedStudentForDetail) return null;
      const res = await apiClient.get(`/syahriyah-admin/santri/${selectedStudentForDetail}/detail`);
      return res.data;
    },
    enabled: Boolean(selectedStudentForDetail)
  });

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

  // Bulk Candidates Query (Fetch All Unpaid Students & Bills in Branch)
  const { data: bulkCandidates = [], isLoading: isLoadingBulkCandidates } = useQuery<any[]>({
    queryKey: ['syahriyah-admin-unpaid-bulk', bulkFilterCabangId, bulkFilterKategori, bulkFilterBulan, bulkFilterTahun, bulkSearch],
    queryFn: async () => {
      const res = await apiClient.get('/syahriyah-admin/tagihan/unpaid-bulk-candidates', {
        params: {
          cabangId: bulkFilterCabangId || undefined,
          kategori: bulkFilterKategori && bulkFilterKategori !== 'ALL' ? bulkFilterKategori : undefined,
          bulan: (bulkFilterKategori === 'BULANAN' || bulkFilterKategori === 'ALL') && bulkFilterBulan ? bulkFilterBulan : undefined,
          tahun: bulkFilterTahun || undefined,
          search: bulkSearch ? normalizeTurkish(bulkSearch) : undefined
        }
      });
      return res.data;
    },
    enabled: isBulkPayModalOpen
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
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-santri'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-unpaid-bulk'] });
      if (selectedStudentForDetail) {
        queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-santri-detail', selectedStudentForDetail] });
      }
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mencatat pembayaran');
    }
  });

  const bayarMassalKasirMutation = useMutation({
    mutationFn: async (payload: { tagihanIds: string[]; metode?: 'TUNAI' | 'TRANSFER'; catatan?: string }) => {
      const res = await apiClient.post('/syahriyah-admin/tagihan/bayar-massal', payload);
      return res.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Pembayaran massal kasir berhasil dicatat!');
      setBulkSelectedTagihanIds([]);
      setIsBulkPayModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-santri'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-unpaid-bulk'] });
      if (selectedStudentForDetail) {
        queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-santri-detail', selectedStudentForDetail] });
      }
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal memproses pembayaran massal');
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

  const deleteTagihanMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/syahriyah-admin/tagihan/${id}`);
      return res.data;
    },
    onSuccess: () => {
      showToast('success', 'Tagihan santri berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus tagihan');
    }
  });

  const deleteMassalMutation = useMutation({
    mutationFn: async (params: any) => {
      const res = await apiClient.delete('/syahriyah-admin/tagihan/massal', { params });
      return res.data;
    },
    onSuccess: (data) => {
      showToast('success', data?.message || 'Tagihan massal berhasil dihapus');
      setIsDeleteMassalModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menghapus tagihan massal');
    }
  });

  const generateMassalMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/syahriyah-admin/tagihan/generate-massal', payload);
      return res.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Tagihan massal berhasil di-generate!');
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-tagihan'] });
      queryClient.invalidateQueries({ queryKey: ['syahriyah-admin-stats'] });
      setActiveSubTab('tagihan');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal men-generate tagihan');
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
            onClick={() => {
              setActiveSubTab('santri');
              setSantriPage(1);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'santri'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Daftar Santri
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setBulkFilterCabangId(user?.scope === 'CABANG' ? user.cabangId || '' : filterCabangId || '');
                setBulkFilterKategori(filterKategori || 'BULANAN');
                setBulkFilterBulan(filterBulan || (new Date().getMonth() + 1).toString());
                setBulkFilterTahun(filterTahun || new Date().getFullYear().toString());
                setBulkSearch('');
                setBulkSelectedTagihanIds([]);
                setIsBulkPayModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              Bayar Kasir Massal (Bulk)
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteMassalBulan(filterBulan || (new Date().getMonth() + 1).toString());
                setDeleteMassalTahun(filterTahun || new Date().getFullYear().toString());
                setDeleteMassalCabangId(user?.scope === 'CABANG' ? user.cabangId || '' : filterCabangId || '');
                setDeleteMassalKategori(filterKategori || 'BULANAN');
                setDeleteMassalOnlyBelumLunas(true);
                setIsDeleteMassalModalOpen(true);
              }}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              Hapus Tagihan Massal
            </button>
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
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                            <div>{normalizeTurkish(t.student.biodata?.fullName || 'Tanpa Nama')}</div>
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

                            {t.status !== 'LUNAS' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus tagihan "${t.judul}" untuk ${t.student.biodata?.fullName || 'santri'}?`)) {
                                    deleteTagihanMutation.mutate(t.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Hapus Tagihan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      {/* ── TAB 2: DAFTAR SANTRI (SYAHRIYAH & STATUS KELAS/DAIMI) ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'santri' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama santri, NISN, NIK, atau grup daimi..."
                value={santriSearch}
                onChange={(e) => {
                  setSantriSearch(e.target.value);
                  setSantriPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Filter Status Tagihan */}
            <select
              value={santriStatusTagihan}
              onChange={(e) => {
                setSantriStatusTagihan(e.target.value);
                setSantriPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">Semua Status Tagihan</option>
              <option value="BELUM_LUNAS">Ada Tunggakan Belum Lunas</option>
              <option value="LUNAS">Semua Tagihan Lunas</option>
            </select>

            {/* Cabang Filter for Global Admin */}
            {user?.scope !== 'CABANG' && (
              <select
                value={santriCabangId}
                onChange={(e) => {
                  setSantriCabangId(e.target.value);
                  setSantriPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="">Semua Cabang</option>
                {cabangList.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {(santriSearch || santriStatusTagihan || (user?.scope !== 'CABANG' && santriCabangId)) && (
              <button
                type="button"
                onClick={() => {
                  setSantriSearch('');
                  setSantriStatusTagihan('');
                  setSantriCabangId(user?.scope === 'CABANG' ? user.cabangId || '' : '');
                  setSantriPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Table Daftar Santri */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoadingSantri ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> Memuat data santri...
              </div>
            ) : santriList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Tidak ada santri yang sesuai kriteria filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 backdrop-blur-xs text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Santri</th>
                      <th className="py-3 px-4">Cabang / Kelas</th>
                      <th className="py-3 px-4">Grup Daimi</th>
                      <th className="py-3 px-4 text-center">Status Syahriyah</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {santriList.map((s) => {
                      const summary = s.tagihanSummary;
                      const rawName = s.biodata?.fullName ? normalizeTurkish(s.biodata.fullName) : 'Tanpa Nama';
                      const initial = rawName.charAt(0).toUpperCase() || 'S';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Santri Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {s.biodata?.fotoSantri ? (
                                <img
                                  src={s.biodata.fotoSantri}
                                  alt={rawName}
                                  className="w-9 h-9 rounded-2xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {initial}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{rawName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  NIK: {s.biodata?.nik || '-'} {s.biodata?.nisn ? `• NISN: ${s.biodata.nisn}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Cabang & Kelas */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-semibold text-slate-900">{s.cabang?.name || '-'}</div>
                            <div className="text-[10px] text-indigo-600 font-medium">
                              {s.kelasName && s.kelasName !== '-' ? `Kelas: ${s.kelasName}` : 'Belum Terdaftar Kelas'}
                            </div>
                          </td>

                          {/* Grup Daimi */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                              {s.daimiName}
                            </div>
                            {s.daimiKetua && s.daimiKetua !== '-' && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Ketua: <span className="font-medium text-slate-700">{s.daimiKetua}</span>
                              </div>
                            )}
                          </td>

                          {/* Status Ringkas Syahriyah */}
                          <td className="py-3.5 px-4 text-center">
                            {summary.statusBadge === 'SEMUA_LUNAS' ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Lunas Semua ({summary.lunasCount})
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {formatRupiah(summary.totalTerbayar)}
                                </span>
                              </div>
                            ) : summary.statusBadge === 'ADA_TUNGGAKAN' ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" /> {summary.belumLunasCount} Tunggakan
                                </span>
                                <span className="text-[10px] text-rose-600 font-bold mt-0.5 font-mono">
                                  Sisa: {formatRupiah(summary.totalSisaBayar)}
                                </span>
                              </div>
                            ) : summary.statusBadge === 'ADA_PENDING' ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" /> {summary.pendingCount} Pending
                                </span>
                                <span className="text-[10px] text-slate-500 mt-0.5">
                                  Menunggu Verifikasi
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                Belum Ada Tagihan
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForDetail(s.id)}
                              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Detail Riwayat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan <span className="font-bold text-slate-800">{totalSantriItems > 0 ? (santriPage - 1) * santriLimit + 1 : 0}</span> - <span className="font-bold text-slate-800">{Math.min(santriPage * santriLimit, totalSantriItems)}</span> dari <span className="font-bold text-slate-800">{totalSantriItems}</span> santri
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Baris:</span>
                      <select
                        value={santriLimit}
                        onChange={(e) => {
                          setSantriLimit(Number(e.target.value));
                          setSantriPage(1);
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
                      currentPage={santriPage}
                      totalPages={totalSantriPages}
                      totalItems={totalSantriItems}
                      itemsPerPage={santriLimit}
                      onPageChange={(p) => setSantriPage(p)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: SETTING BIAYA (MASTER TARIF) ── */}
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
      {activeSubTab === 'generate' && (() => {
        const targetCabangForGen = user?.scope === 'CABANG' ? user?.cabangId : (genCabangId || '');
        const matchingTarifs = tarifList.filter(t =>
          t.kategori === genKategori &&
          t.isActive &&
          (t.cabangId === targetCabangForGen || !t.cabangId)
        );
        const selectedTarifObj = genTarifId ? tarifList.find(t => t.id === genTarifId) : matchingTarifs[0];
        const isTarifAvailable = Boolean((matchingTarifs.length > 0 && selectedTarifObj && selectedTarifObj.nominal > 0) || (genNominal && Number(genNominal) > 0));

        const namaBulan = genKategori === 'BULANAN' ? BULAN_LABELS[genBulan - 1] : '';
        const previewJudul = genJudul.trim() || (
          genKategori === 'BULANAN'
            ? `Syahriyah ${namaBulan} ${genTahun}`
            : selectedTarifObj
              ? `${selectedTarifObj.name} ${genTahun}`
              : `${KATEGORI_LABEL[genKategori]?.label || genKategori} ${genTahun}`
        );
        const previewNominal = genNominal && Number(genNominal) > 0 ? Number(genNominal) : (selectedTarifObj?.nominal || 0);

        return (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Generate Tagihan Massal Santri
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sistem akan secara otomatis membuat tagihan kepada seluruh santri aktif yang belum memiliki tagihan pada kategori dan periode yang dipilih.
              </p>
            </div>

            {/* Selector Kategori Tagihan */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800 text-xs block">
                Pilih Kategori Tagihan *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'BULANAN', label: 'Iuran Bulanan', icon: '🗓️' },
                  { key: 'TAHUNAN', label: 'Biaya Tahunan', icon: '🎓' },
                  { key: 'SANTRI_BARU', label: 'Santri Baru', icon: '🎒' },
                  { key: 'LAINNYA', label: 'Biaya Lainnya', icon: '📦' }
                ].map((k) => (
                  <button
                    key={k.key}
                    type="button"
                    onClick={() => {
                      setGenKategori(k.key as any);
                      setGenTarifId('');
                      setGenNominal('');
                      setGenJudul('');
                    }}
                    className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                      genKategori === k.key
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{k.icon}</span>
                    <span className="text-center">{k.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Alert Jika Master Tarif Belum Diisi */}
            {!isTarifAvailable && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-sm text-amber-900">
                    Master Tarif {KATEGORI_LABEL[genKategori]?.label || genKategori} Belum Diatur
                  </h4>
                  <p className="text-amber-700 mt-1">
                    Belum ada tarif aktif untuk kategori <strong>{KATEGORI_LABEL[genKategori]?.label || genKategori}</strong> di master data (atau nominalnya masih Rp 0).
                    Tombol generate dinonaktifkan sampai master tarif dibuat di tab <strong>Setting Biaya & Tarif</strong> atau Anda memasukkan nominal manual.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('tarif');
                      setEditingTarif(null);
                      setTarifName(
                        genKategori === 'BULANAN'
                          ? 'Iuran Syahriyah Bulanan'
                          : genKategori === 'TAHUNAN'
                            ? 'Daftar Ulang / Biaya Tahunan'
                            : genKategori === 'SANTRI_BARU'
                              ? 'Uang Pangkal / Masuk Santri Baru'
                              : 'Biaya Lainnya'
                      );
                      setTarifKategori(genKategori);
                      setTarifNominal(0);
                      setTarifCabangId(user?.cabangId || genCabangId || '');
                      setTarifTahunAjaran('2026/2027');
                      setIsTarifModalOpen(true);
                    }}
                    className="mt-2.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Atur Master Tarif {KATEGORI_LABEL[genKategori]?.label || genKategori} Sekarang
                  </button>
                </div>
              </div>
            )}

            {/* Success Preview Card Jika Tarif Tersedia */}
            {isTarifAvailable && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-medium text-emerald-900 block">
                      Target Tagihan: <strong>{previewJudul}</strong>
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Nominal: <strong>{formatRupiah(previewNominal)}</strong> {selectedTarifObj && !genNominal ? `(Master Tarif: ${selectedTarifObj.name})` : ''}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  Siap Digenerate
                </span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isTarifAvailable) {
                  showToast('error', `Tarif untuk kategori ${KATEGORI_LABEL[genKategori]?.label || genKategori} belum diatur. Harap buat master tarif terlebih dahulu.`);
                  return;
                }
                generateMassalMutation.mutate({
                  kategori: genKategori,
                  tarifId: selectedTarifObj?.id || undefined,
                  judul: genJudul.trim() || undefined,
                  bulan: genKategori === 'BULANAN' ? genBulan : undefined,
                  tahun: genTahun,
                  cabangId: genCabangId || undefined,
                  nominal: genNominal ? Number(genNominal) : undefined,
                  jatuhTempo: genJatuhTempo || undefined
                });
              }}
              className="space-y-4 text-xs"
            >
              {/* Dropdown Master Tarif Jika Lebih Dari Satu */}
              {matchingTarifs.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Pilih Master Tarif</label>
                  <select
                    value={genTarifId || (matchingTarifs[0]?.id || '')}
                    onChange={(e) => setGenTarifId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {matchingTarifs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} - {formatRupiah(t.nominal)} {t.cabang?.name ? `(${t.cabang.name})` : '(Semua Cabang)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Periode: Bulan & Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {genKategori === 'BULANAN' && (
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
                )}

                <div className={`space-y-1.5 ${genKategori !== 'BULANAN' ? 'sm:col-span-2' : ''}`}>
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

              {/* Custom Judul (Opsional jika non-bulanan) */}
              {genKategori !== 'BULANAN' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Judul Tagihan (Opsional)</label>
                  <input
                    type="text"
                    placeholder={`Contoh: ${selectedTarifObj?.name || 'Biaya'} ${genTahun}`}
                    value={genJudul}
                    onChange={(e) => setGenJudul(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">
                    Kosongkan untuk otomatis menggunakan nama master tarif.
                  </span>
                </div>
              )}

              {/* Target Cabang (Untuk Global Scope) */}
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

              {/* Nominal & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Nominal Tagihan (Opsional Override)</label>
                  <input
                    type="number"
                    placeholder={selectedTarifObj ? `Default: ${formatRupiah(selectedTarifObj.nominal)}` : 'Kosongkan untuk pakai tarif master'}
                    value={genNominal}
                    onChange={(e) => setGenNominal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">
                    Jika dikosongkan, nominal akan otomatis mengambil dari Master Tarif yang dipilih.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    value={genJatuhTempo}
                    onChange={(e) => setGenJatuhTempo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">
                    Default: {genKategori === 'BULANAN' ? 'Tanggal 10 pada bulan tersebut' : 'Akhir tahun'}.
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={generateMassalMutation.isPending || !isTarifAvailable}
                  className={`w-full py-3.5 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                    isTarifAvailable
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  } disabled:opacity-50`}
                >
                  {generateMassalMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Men-generate Tagihan...
                    </>
                  ) : !isTarifAvailable ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Generate Dinonaktifkan (Tarif {KATEGORI_LABEL[genKategori]?.label || genKategori} Belum Diatur)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Proses Generate Tagihan {previewJudul}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
      })()}

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
                  <span className="font-bold text-slate-900">{normalizeTurkish(selectedPembayaranForVerify.tagihan.student.biodata?.fullName || 'Santri')}</span>
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
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: HAPUS TAGIHAN MASSAL ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isDeleteMassalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-rose-700 text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                Hapus Tagihan Massal
              </h3>
              <button
                onClick={() => setIsDeleteMassalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Perhatian:
              </p>
              <p>
                Tindakan ini akan menghapus data tagihan santri secara massal pada periode bulan dan tahun yang Anda pilih.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const namaBulan = deleteMassalBulan ? BULAN_LABELS[Number(deleteMassalBulan) - 1] : 'Semua Bulan';
                if (confirm(`Apakah Anda yakin ingin menghapus massal tagihan santri periode ${namaBulan} ${deleteMassalTahun}?`)) {
                  deleteMassalMutation.mutate({
                    bulan: deleteMassalBulan || undefined,
                    tahun: deleteMassalTahun || undefined,
                    cabangId: deleteMassalCabangId || undefined,
                    kategori: deleteMassalKategori || undefined,
                    onlyBelumLunas: deleteMassalOnlyBelumLunas
                  });
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Pilih Bulan *</label>
                  <select
                    value={deleteMassalBulan}
                    onChange={(e) => setDeleteMassalBulan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Semua Bulan</option>
                    {BULAN_LABELS.map((b, idx) => (
                      <option key={idx + 1} value={idx + 1}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Pilih Tahun *</label>
                  <select
                    value={deleteMassalTahun}
                    onChange={(e) => setDeleteMassalTahun(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              {user?.scope !== 'CABANG' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Target Cabang</label>
                  <select
                    value={deleteMassalCabangId}
                    onChange={(e) => setDeleteMassalCabangId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Semua Cabang</option>
                    {cabangList.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Kategori Biaya</label>
                <select
                  value={deleteMassalKategori}
                  onChange={(e) => setDeleteMassalKategori(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Semua Kategori</option>
                  <option value="BULANAN">Iuran Syahriyah Bulanan</option>
                  <option value="TAHUNAN">Biaya Tahunan</option>
                  <option value="SANTRI_BARU">Biaya Santri Baru</option>
                  <option value="LAINNYA">Biaya Lainnya</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteMassalOnlyBelumLunas}
                    onChange={(e) => setDeleteMassalOnlyBelumLunas(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Hanya Hapus Tagihan BELUM LUNAS</span>
                    <span className="text-[11px] text-slate-500 block">
                      (Direkomendasikan agar tagihan yang sudah lunas atau menunggu verifikasi tidak terhapus)
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteMassalModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deleteMassalMutation.isPending}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deleteMassalMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Tagihan Massal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: BAYAR KASIR MASSAL (BULK PAYMENT) ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isBulkPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-5 animate-scale-up max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Bayar Kasir Massal (Bulk Payment)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih cabang, jenis tagihan, dan bulan untuk melunasi tagihan santri secara massal sekaligus.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkPayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Filter Controls Row */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Target Cabang */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Cabang Santri</label>
                    {user?.scope === 'CABANG' ? (
                      <input
                        type="text"
                        disabled
                        value={cabangList.find((c: any) => c.id === user.cabangId)?.name || 'Cabang Saya'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 text-xs"
                      />
                    ) : (
                      <select
                        value={bulkFilterCabangId}
                        onChange={(e) => {
                          setBulkFilterCabangId(e.target.value);
                          setBulkSelectedTagihanIds([]);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="">Semua Cabang</option>
                        {cabangList.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Jenis Tagihan */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Jenis Tagihan</label>
                    <select
                      value={bulkFilterKategori}
                      onChange={(e) => {
                        setBulkFilterKategori(e.target.value);
                        setBulkSelectedTagihanIds([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="BULANAN">🗓️ Iuran Syahriyah Bulanan</option>
                      <option value="TAHUNAN">🎓 Biaya Tahunan</option>
                      <option value="SANTRI_BARU">🎒 Biaya Santri Baru</option>
                      <option value="LAINNYA">📦 Biaya Lainnya</option>
                      <option value="ALL">📑 Semua Jenis Tagihan</option>
                    </select>
                  </div>

                  {/* Pilihan Bulan */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      Pilihan Bulan {bulkFilterKategori === 'BULANAN' ? '*' : ''}
                    </label>
                    <select
                      value={bulkFilterBulan}
                      onChange={(e) => {
                        setBulkFilterBulan(e.target.value);
                        setBulkSelectedTagihanIds([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="">Semua Bulan</option>
                      {BULAN_LABELS.map((b, idx) => (
                        <option key={idx + 1} value={idx + 1}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Tahun */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Tahun</label>
                    <select
                      value={bulkFilterTahun}
                      onChange={(e) => {
                        setBulkFilterTahun(e.target.value);
                        setBulkSelectedTagihanIds([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    placeholder="Saring nama santri, NIK, NISN, atau grup daimi..."
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Selection Summary & Action Bar */}
              {(() => {
                const selectedItems = bulkCandidates.filter((t: any) => bulkSelectedTagihanIds.includes(t.id));
                const totalNominalSelected = selectedItems.reduce((sum: number, t: any) => sum + (t.sisaBayar > 0 ? t.sisaBayar : t.nominal || 0), 0);
                const isAllSelected = bulkCandidates.length > 0 && bulkCandidates.every((t: any) => bulkSelectedTagihanIds.includes(t.id));

                return (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isAllSelected) {
                              setBulkSelectedTagihanIds([]);
                            } else {
                              setBulkSelectedTagihanIds(bulkCandidates.map((t: any) => t.id));
                            }
                          }}
                          disabled={bulkCandidates.length === 0}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          {isAllSelected ? 'Hapus Semua Centang' : `Centang Semua Santri (${bulkCandidates.length})`}
                        </button>
                        {bulkSelectedTagihanIds.length > 0 && !isAllSelected && (
                          <button
                            type="button"
                            onClick={() => setBulkSelectedTagihanIds([])}
                            className="px-2.5 py-1.5 text-slate-300 hover:text-white text-xs cursor-pointer"
                          >
                            Batal Pilih
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">Santri Dipilih:</span>{' '}
                          <strong className="text-emerald-400 text-sm font-bold">{bulkSelectedTagihanIds.length}</strong> / {bulkCandidates.length}
                        </div>
                        <div className="border-l border-slate-700 pl-4">
                          <span className="text-slate-400">Total Nominal:</span>{' '}
                          <strong className="text-emerald-400 text-sm font-mono font-extrabold">{formatRupiah(totalNominalSelected)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Table / List */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      {isLoadingBulkCandidates ? (
                        <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Memuat data santri belum lunas di cabang...
                        </div>
                      ) : bulkCandidates.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 space-y-1">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                          <p className="font-bold text-slate-700">Tidak ada data tagihan yang belum lunas sesuai filter terpilih.</p>
                          <p className="text-slate-400 text-[11px]">Pastikan cabang dan periode bulan tagihan sudah sesuai.</p>
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {bulkCandidates.map((t: any) => {
                            const isChecked = bulkSelectedTagihanIds.includes(t.id);
                            const rawName = t.student.biodata?.fullName ? normalizeTurkish(t.student.biodata.fullName) : 'Tanpa Nama';
                            const initial = rawName.charAt(0).toUpperCase() || 'S';

                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setBulkSelectedTagihanIds(bulkSelectedTagihanIds.filter((id) => id !== t.id));
                                  } else {
                                    setBulkSelectedTagihanIds([...bulkSelectedTagihanIds, t.id]);
                                  }
                                }}
                                className={`p-3 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                                  isChecked ? 'bg-emerald-50/70' : 'hover:bg-slate-50/80'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (e.target.checked) {
                                        setBulkSelectedTagihanIds([...bulkSelectedTagihanIds, t.id]);
                                      } else {
                                        setBulkSelectedTagihanIds(bulkSelectedTagihanIds.filter((id) => id !== t.id));
                                      }
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
                                  />
                                  {t.student.biodata?.fotoSantri ? (
                                    <img
                                      src={t.student.biodata.fotoSantri}
                                      alt={rawName}
                                      className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                      {initial}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 truncate">{rawName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      NIK: {t.student.biodata?.nik || '-'} {t.student.biodata?.nisn ? `• NISN: ${t.student.biodata.nisn}` : ''}
                                    </div>
                                  </div>
                                </div>

                                <div className="hidden sm:block text-slate-600 text-[11px] shrink-0">
                                  <div className="font-semibold text-slate-800">{t.student.cabang?.name || '-'}</div>
                                  <div className="text-[10px] text-indigo-600">
                                    {t.student.siswaFormal?.kelas?.name ? `Kelas: ${t.student.siswaFormal.kelas.name}` : 'Belum Ada Kelas'}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="font-bold font-mono text-emerald-700 text-xs">
                                    {formatRupiah(t.sisaBayar > 0 ? t.sisaBayar : t.nominal)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {t.judul}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Payment Form Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Metode Pembayaran *</label>
                        <select
                          value={bulkPayMetode}
                          onChange={(e) => setBulkPayMetode(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          <option value="TUNAI">💵 Tunai (Kasir / Kantor Cabang)</option>
                          <option value="TRANSFER">💳 Transfer Bank / QRIS</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Catatan Kasir / Bendahara</label>
                        <input
                          type="text"
                          value={bulkPayCatatan}
                          onChange={(e) => setBulkPayCatatan(e.target.value)}
                          placeholder="Misal: Pembayaran langsung di kasir kantor cabang..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkPayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={bulkSelectedTagihanIds.length === 0 || bayarMassalKasirMutation.isPending}
                onClick={() => {
                  if (bulkSelectedTagihanIds.length === 0) return;
                  if (confirm(`Konfirmasi pembayaran kasir massal untuk ${bulkSelectedTagihanIds.length} santri terpilih?`)) {
                    bayarMassalKasirMutation.mutate({
                      tagihanIds: bulkSelectedTagihanIds,
                      metode: bulkPayMetode,
                      catatan: bulkPayCatatan
                    });
                  }
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50 text-xs"
              >
                {bayarMassalKasirMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Bayar & Tandai Lunas ({bulkSelectedTagihanIds.length} Santri)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── MODAL: DETAIL RIWAYAT PEMBAYARAN SANTRI SELAMA MONDOK ── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-5 animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Riwayat Pembayaran Santri Selama Mondok
                  </h3>
                  <p className="text-xs text-slate-500">
                    Laporan lengkap status seluruh tagihan dan histori pembayaran per siswa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {isLoadingStudentDetail ? (
                <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat data riwayat santri...
                </div>
              ) : !studentDetailData ? (
                <div className="p-12 text-center text-slate-500">Data santri tidak ditemukan</div>
              ) : (
                <>
                  {/* Student Profile Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {studentDetailData.biodata?.fotoSantri ? (
                        <img
                          src={studentDetailData.biodata.fotoSantri}
                          alt={normalizeTurkish(studentDetailData.biodata.fullName || 'Santri')}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-800 text-white font-bold text-xl flex items-center justify-center shadow-xs">
                          {studentDetailData.biodata?.fullName ? normalizeTurkish(studentDetailData.biodata.fullName).charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {normalizeTurkish(studentDetailData.biodata?.fullName || 'Tanpa Nama')}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                          <span>NISN: <strong>{studentDetailData.biodata?.nisn || '-'}</strong></span>
                          <span>•</span>
                          <span>NIK: <strong>{studentDetailData.biodata?.nik || '-'}</strong></span>
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-2 flex-wrap">
                          <span>🏛️ {studentDetailData.cabang?.name || '-'}</span>
                          <span>•</span>
                          <span>📚 {studentDetailData.siswaFormal?.kelas?.name ? `Kelas: ${studentDetailData.siswaFormal.kelas.name}` : 'Belum Ada Kelas'}</span>
                          <span>•</span>
                          <span>👥 {studentDetailData.dataDaimi?.grup?.name || studentDetailData.grupDaimi || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Wali Info */}
                    {studentDetailData.waliSantri && studentDetailData.waliSantri.length > 0 && (
                      <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Wali Terdaftar</span>
                        <div className="font-bold text-slate-800">
                          {studentDetailData.waliSantri[0].user?.operatorName || 'Wali Santri'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 justify-end">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {studentDetailData.waliSantri[0].user?.phone || '-'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary KPI Mini Cards */}
                  {(() => {
                    const tagihanArray = studentDetailData.tagihan || [];
                    const totalNominal = tagihanArray.reduce((sum: number, t: any) => sum + (t.nominal || 0), 0);
                    const lunasItems = tagihanArray.filter((t: any) => t.status === 'LUNAS');
                    const totalLunas = lunasItems.reduce((sum: number, t: any) => sum + (t.nominal || 0), 0);
                    const tunggakanItems = tagihanArray.filter((t: any) => t.status === 'BELUM_LUNAS');
                    const totalTunggakan = tunggakanItems.reduce((sum: number, t: any) => sum + (t.sisaBayar > 0 ? t.sisaBayar : t.nominal), 0);

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                          <span className="text-[11px] text-indigo-700 font-bold">Total Seluruh Tagihan ({tagihanArray.length})</span>
                          <div className="text-base font-extrabold text-indigo-950 mt-0.5 font-mono">
                            {formatRupiah(totalNominal)}
                          </div>
                        </div>

                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                          <span className="text-[11px] text-emerald-700 font-bold">Terbayar Lunas ({lunasItems.length})</span>
                          <div className="text-base font-extrabold text-emerald-950 mt-0.5 font-mono">
                            {formatRupiah(totalLunas)}
                          </div>
                        </div>

                        <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-2xl">
                          <span className="text-[11px] text-rose-700 font-bold">Sisa Tunggakan ({tunggakanItems.length})</span>
                          <div className="text-base font-extrabold text-rose-950 mt-0.5 font-mono">
                            {formatRupiah(totalTunggakan)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* History Table */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>Daftar Seluruh Tagihan Selama Mondok:</span>
                      <span className="text-slate-400 font-normal">
                        Total {studentDetailData.tagihan?.length || 0} tagihan
                      </span>
                    </h5>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      {(!studentDetailData.tagihan || studentDetailData.tagihan.length === 0) ? (
                        <div className="p-8 text-center text-slate-400">
                          Belum ada data tagihan untuk santri ini.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3.5">Periode / Judul</th>
                              <th className="py-2.5 px-3.5">Kategori</th>
                              <th className="py-2.5 px-3.5 text-right">Nominal</th>
                              <th className="py-2.5 px-3.5 text-center">Status</th>
                              <th className="py-2.5 px-3.5">Histori Bayar</th>
                              <th className="py-2.5 px-3.5 text-right">Aksi Kasir</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {studentDetailData.tagihan.map((t: any) => {
                              const latestPembayaran = t.pembayaran && t.pembayaran.length > 0 ? t.pembayaran[0] : null;

                              return (
                                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                                  {/* Judul & Periode */}
                                  <td className="py-3 px-3.5 font-medium text-slate-900">
                                    <div className="font-bold">{t.judul}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {t.bulan ? `${BULAN_LABELS[t.bulan - 1]} ` : ''}{t.tahun}
                                    </div>
                                  </td>

                                  {/* Kategori */}
                                  <td className="py-3 px-3.5">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${KATEGORI_LABEL[t.kategori]?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                      {KATEGORI_LABEL[t.kategori]?.label || t.kategori}
                                    </span>
                                  </td>

                                  {/* Nominal */}
                                  <td className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono">
                                    {formatRupiah(t.nominal)}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-3.5 text-center">
                                    {t.status === 'LUNAS' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" /> LUNAS
                                      </span>
                                    ) : t.status === 'PENDING' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                        <Clock className="w-3 h-3 text-amber-600" /> PENDING
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                        <AlertTriangle className="w-3 h-3" /> BELUM LUNAS
                                      </span>
                                    )}
                                  </td>

                                  {/* Histori Bayar */}
                                  <td className="py-3 px-3.5 text-slate-600">
                                    {latestPembayaran ? (
                                      <div>
                                        <div className="font-semibold text-slate-800">
                                          {latestPembayaran.metode} • {new Date(latestPembayaran.tanggalBayar).toLocaleDateString('id-ID')}
                                        </div>
                                        {latestPembayaran.verifiedBy && (
                                          <div className="text-[10px] text-emerald-600">
                                            Verif: {latestPembayaran.verifiedBy.operatorName || latestPembayaran.verifiedBy.username}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Belum ada bayar</span>
                                    )}
                                  </td>

                                  {/* Aksi Kasir */}
                                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                    {t.status !== 'LUNAS' ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedTagihanForDirectPay({
                                            ...t,
                                            student: {
                                              id: studentDetailData.id,
                                              biodata: studentDetailData.biodata,
                                              cabang: studentDetailData.cabang
                                            }
                                          });
                                          setDirectPayNominal(t.sisaBayar > 0 ? t.sisaBayar : t.nominal);
                                          setDirectPayMetode('TUNAI');
                                          setDirectPayCatatan('Pembayaran langsung kasir santri');
                                        }}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                      >
                                        <Banknote className="w-3 h-3" />
                                        Bayar Kasir
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Selesai
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
