import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../lib/apiClient';
import PermohonanIzinSantriTab from '../../features/permohonan/PermohonanIzinSantriTab';
import KelolaCctvCabangTab from '../../features/portal/components/KelolaCctvCabangTab';
import HlsPlayer from '../../components/Cctv/HlsPlayer';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import {
  HeartHandshake,
  Users,
  CheckCircle2,
  Video,
  Search,
  MessageCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Building2,
  School,
  Utensils,
  Maximize2,
  Radio,
  Loader2,
  ExternalLink,
  Plus,
  Filter,
  Lock,
  Save,
  Edit2,
  ShieldAlert,
  Trash2,
  X,
  Link2,
  SlidersHorizontal,
  GraduationCap,
  CalendarCheck,
  FileText,
  Megaphone,
  Settings,
  UserX,
  Check,
  Ban,
  Edit3,
} from 'lucide-react';
import KelolaPengumumanWalsanTab from '../../features/portal/components/KelolaPengumumanWalsanTab';
import { useGetCabang } from '../../features/core_data/hooks/useMasterData';

interface WaliUserItem {
  id: string;
  username: string;
  operatorName?: string | null;
  phone?: string | null;
  nik?: string | null;
  isApproved?: boolean;
  status?: string;
  scope: string;
  createdAt: string;
  waliSantri?: Array<{
    id: string;
    studentId: string;
    status?: string;
    hubungan?: string | null;
    student?: {
      biodata?: { fullName?: string; nik?: string; nisLokal?: string } | null;
      cabang?: { name?: string } | null;
    } | null;
  }>;
}

interface CCTVChannel {
  id: string;
  name: string;
  location: string;
  category: string;
  icon: any;
  status: 'ONLINE' | 'OFFLINE';
  fps: number;
  bg: string;
  streamUrl?: string;
  rawItem?: any;
}

const ADMIN_CCTV_FEEDS: CCTVChannel[] = [
  {
    id: 'c1',
    name: 'CCTV-01: Ruang Kelas Utama A-102',
    location: 'Gedung Utama Lt. 2',
    category: 'KELAS',
    icon: School,
    status: 'ONLINE',
    fps: 30,
    bg: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8',
  },
  {
    id: 'c2',
    name: 'CCTV-02: Masjid Jami (Ruang Utama)',
    location: 'Area Masjid Santri',
    category: 'MASJID',
    icon: Building2,
    status: 'ONLINE',
    fps: 30,
    bg: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8',
  },
  {
    id: 'c3',
    name: 'CCTV-03: Tempat Makan & Dapur',
    location: 'Gedung Konsumsi',
    category: 'MAKAN',
    icon: Utensils,
    status: 'ONLINE',
    fps: 30,
    bg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8',
  },
  {
    id: 'c4',
    name: 'CCTV-04: Halaman Asrama & Gazebo',
    location: 'Area Terbuka Asrama',
    category: 'ASRAMA',
    icon: Building2,
    status: 'ONLINE',
    fps: 30,
    bg: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
    streamUrl: 'https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8',
  },
];

export default function PortalWalsanPage({ initialTab = 'overview' }: { initialTab?: 'overview' | 'list' | 'izin' | 'cctv' | 'pengumuman' | 'settings' }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'izin' | 'cctv' | 'pengumuman' | 'settings'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Fetch Module Settings from Backend
  const { data: moduleSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['admin-module-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/modules');
      return res.data;
    },
  });

  // Mutation to update module settings
  const updateModuleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.put('/pengaturan/modules', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-module-settings'] });
      queryClient.invalidateQueries({ queryKey: ['portal-module-settings'] });
      showToast('success', 'Pengaturan menu portal berhasil diperbarui!');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan pengaturan');
    },
  });

  // Fetch Cabangs list
  const { data: cabangList = [] } = useGetCabang();

  // Mutation to update cabang edit biodata
  const updateCabangEditMutation = useMutation({
    mutationFn: async ({ cabangId, isEnabled }: { cabangId: string; isEnabled: boolean }) => {
      const res = await apiClient.put('/pengaturan/modules/cabang-edit-biodata', { cabangId, isEnabled });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-module-settings'] });
      queryClient.invalidateQueries({ queryKey: ['portal-module-settings'] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'students'] });
      showToast('success', 'Izin perbaruan data santri berhasil diperbarui!');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal mengubah izin edit cabang');
    }
  });

  // CCTV Access Code PIN States
  const [cctvPinInput, setCctvPinInput] = useState('');
  const [cctvProtectionEnabled, setCctvProtectionEnabled] = useState(true);
  const [showPinText, setShowPinText] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  useEffect(() => {
    if (moduleSettings) {
      if (moduleSettings.cctvPin !== undefined) setCctvPinInput(moduleSettings.cctvPin);
      if (moduleSettings.cctvProtectionEnabled !== undefined) setCctvProtectionEnabled(moduleSettings.cctvProtectionEnabled);
    }
  }, [moduleSettings]);

  // Fetch CCTV Channels from DB
  const { data: dbCctvList = [] } = useQuery({
    queryKey: ['cctv-channels-admin'],
    queryFn: async () => {
      const res = await apiClient.get('/cctv/channels');
      return res.data;
    },
  });

  const activeCctvFeeds: CCTVChannel[] = (dbCctvList || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    location: c.location || 'Lokasi Cabang',
    category: c.category || 'KELAS',
    icon: c.category === 'MASJID' ? Building2 : c.category === 'MAKAN' ? Utensils : School,
    status: c.isActive ? 'ONLINE' : 'OFFLINE',
    fps: 30,
    bg: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    streamUrl: c.streamUrl,
    rawItem: c,
  }));

  const [selectedCctv, setSelectedCctv] = useState<CCTVChannel | null>(null);

  useEffect(() => {
    if (activeCctvFeeds.length > 0) {
      if (!selectedCctv || !activeCctvFeeds.some((f) => f.id === selectedCctv.id)) {
        setSelectedCctv(activeCctvFeeds[0]);
      }
    } else {
      setSelectedCctv(null);
    }
  }, [dbCctvList]);

  // Edit Modal State
  const [editingFeed, setEditingFeed] = useState<CCTVChannel | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'KELAS',
    streamUrl: '',
    location: '',
    description: '',
    isActive: true,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Mutation
  const saveCctvMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingFeed?.rawItem?.id) {
        return apiClient.put(`/cctv/channels/${editingFeed.rawItem.id}`, payload);
      } else {
        return apiClient.post('/cctv/channels', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cctv-channels-admin'] });
      queryClient.invalidateQueries({ queryKey: ['portal-cctv-channels'] });
      showToast('success', 'Kamera CCTV berhasil diperbarui!');
      setIsEditModalOpen(false);
      setEditingFeed(null);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan kamera CCTV');
    },
  });

  const openEditModal = (feed: CCTVChannel) => {
    setEditingFeed(feed);
    setEditFormData({
      name: feed.rawItem?.name || feed.name,
      category: feed.rawItem?.category || feed.category || 'KELAS',
      streamUrl: feed.streamUrl || feed.rawItem?.streamUrl || 'https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8',
      location: feed.rawItem?.location || feed.location || '',
      description: feed.rawItem?.description || '',
      isActive: feed.status === 'ONLINE',
    });
    setIsEditModalOpen(true);
  };

  // Fetch Users for Wali Santri List
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<WaliUserItem[]>({
    queryKey: ['admin-users-walsan'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users');
        return res.data;
      } catch (err) {
        console.warn('Cannot fetch admin users:', err);
        return [];
      }
    },
    retry: false,
  });

  // Approval & Rejection Mutations
  const approveWalsanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.put(`/admin/walsan/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-walsan'] });
      showToast('success', 'Akun wali santri berhasil disetujui (Approved)!');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menyetujui akun');
    }
  });

  const rejectWalsanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.put(`/admin/walsan/${userId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-walsan'] });
      showToast('success', 'Pendaftaran akun wali santri telah ditolak');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal menolak akun');
    }
  });

  // Filter only WALI users
  const waliList = allUsers.filter((u) => u.scope === 'WALI');

  const countPending = waliList.filter((w) => w.status === 'PENDING' || w.isApproved === false).length;
  const countApproved = waliList.filter((w) => w.status === 'APPROVED' || (w.isApproved === true && w.status !== 'REJECTED')).length;
  const countRejected = waliList.filter((w) => w.status === 'REJECTED').length;

  const filteredWali = waliList.filter((w) => {
    // Status Filter
    if (statusFilter === 'PENDING' && !(w.status === 'PENDING' || w.isApproved === false)) return false;
    if (statusFilter === 'APPROVED' && !(w.status === 'APPROVED' || (w.isApproved === true && w.status !== 'REJECTED'))) return false;
    if (statusFilter === 'REJECTED' && w.status !== 'REJECTED') return false;

    const term = searchQuery.toLowerCase();
    const nameMatch = (w.operatorName || '').toLowerCase().includes(term);
    const userMatch = w.username.toLowerCase().includes(term);
    const nikMatch = (w.nik || '').toLowerCase().includes(term);
    const phoneMatch = (w.phone || '').toLowerCase().includes(term);
    const studentMatch = (w.waliSantri || []).some((ws) =>
      (ws.student?.biodata?.fullName || '').toLowerCase().includes(term) ||
      (ws.student?.biodata?.nik || '').toLowerCase().includes(term)
    );
    return nameMatch || userMatch || nikMatch || phoneMatch || studentMatch;
  });

  if (moduleSettings && moduleSettings.portalWalsanEnabled === false) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Modul Portal Wali Santri Nonaktif</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Akses ke halaman Portal Wali Santri telah dinonaktifkan oleh Administrator Pusat di Pengaturan Sistem.
          </p>
        </div>
        <button
          onClick={() => (window.location.href = '/dashboard')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Kembali ke Dashboard Utama
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Wali Santri</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Pusat kelola akun wali santri, konfirmasi permohonan izin, dan pemantauan live CCTV.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            {waliList.length} Akun Wali Terdaftar
          </span>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Ringkasan & Overview</span>
        </button>

        {(user?.scope !== 'CABANG' || moduleSettings?.cabangWalsanListEnabled !== false) && (
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Wali Santri ({waliList.length})</span>
          </button>
        )}

        {(user?.scope !== 'CABANG' || moduleSettings?.cabangIzinEnabled !== false) && (
          <button
            onClick={() => setActiveTab('izin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'izin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Konfirmasi Izin Santri</span>
          </button>
        )}

        {(user?.scope === 'GLOBAL' || (moduleSettings?.walsanCctvEnabled !== false && moduleSettings?.cabangCctvEnabled !== false)) && (
          <button
            onClick={() => setActiveTab('cctv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cctv'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Live CCTV Streaming</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('pengumuman')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pengumuman'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Pengumuman Walsan</span>
        </button>

        {/* Tab Khusus Admin Pusat (GLOBAL) */}
        {user?.scope === 'GLOBAL' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Pengaturan Menu & Akses</span>
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded-md font-extrabold uppercase">
              Admin
            </span>
          </button>
        )}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Wali Santri</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{waliList.length} Akun</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Layanan Izin Santri</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">Aktif Status</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Live CCTV Stream</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {activeCctvFeeds.filter((f) => f.status === 'ONLINE').length} Kamera Online
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Sistem Integrasi</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">eSantri Portal</h3>
              </div>
            </div>
          </div>

          {/* ── CARD IZIN EDIT BIODATA SANTRI KHUSUS CABANG ── */}
          {user?.scope === 'CABANG' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  (moduleSettings?.cabangEditBiodataMap?.[user?.cabangId || ''] ?? moduleSettings?.walsanEditBiodataEnabled ?? false)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base">Izin Edit & Perbaruan Data Santri oleh Walsan</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      (moduleSettings?.cabangEditBiodataMap?.[user?.cabangId || ''] ?? moduleSettings?.walsanEditBiodataEnabled ?? false)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {(moduleSettings?.cabangEditBiodataMap?.[user?.cabangId || ''] ?? moduleSettings?.walsanEditBiodataEnabled ?? false) ? 'AKSES AKTIF' : 'AKSES DITUTUP'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    {(moduleSettings?.cabangEditBiodataMap?.[user?.cabangId || ''] ?? moduleSettings?.walsanEditBiodataEnabled ?? false)
                      ? 'Wali santri dari cabang ini sedang DIIZINKAN untuk melengkapi atau memperbarui biodata dan dokumen santri di Portal Walsan.'
                      : 'Fitur edit data mandiri sedang DITUTUP oleh cabang ini. Wali santri hanya dapat melihat data secara readonly.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={updateCabangEditMutation.isPending}
                onClick={() => {
                  const currentStatus = Boolean(moduleSettings?.cabangEditBiodataMap?.[user?.cabangId || ''] ?? moduleSettings?.walsanEditBiodataEnabled ?? false);
                  updateCabangEditMutation.mutate({ cabangId: user?.cabangId || '', isEnabled: !currentStatus });
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-2 ${
                  (moduleSettings?.cabangEditBiodataMap?.[user?.cabangId || ''] ?? moduleSettings?.walsanEditBiodataEnabled ?? false)
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {updateCabangEditMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {(moduleSettings?.cabangEditBiodataMap?.[user?.cabangId || ''] ?? moduleSettings?.walsanEditBiodataEnabled ?? false)
                  ? 'Tutup Izin Edit Walsan'
                  : 'Aktifkan Izin Edit Walsan'}
              </button>
            </div>
          )}

          {/* QUICK ACCESS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MANAJEMEN AKUN WALI */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Daftar Wali Santri Terbaru
                </h3>
                <button
                  onClick={() => setActiveTab('list')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Lihat Semua <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoadingUsers ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat data...
                </div>
              ) : waliList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Belum ada akun wali santri.
                </div>
              ) : (
                <div className="space-y-2">
                  {waliList.slice(0, 4).map((w) => (
                    <div key={w.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{w.operatorName || w.username}</p>
                        <p className="text-[10px] text-slate-500">
                          Santri: {(w.waliSantri || []).map((s) => s.student?.biodata?.fullName).filter(Boolean).join(', ') || 'Belum terhubung'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {w.username}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MONITORING CCTV EMBED (DYNAMIC FROM DB) */}
            {(user?.scope === 'GLOBAL' || (moduleSettings?.walsanCctvEnabled !== false && moduleSettings?.cabangCctvEnabled !== false)) ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Video className="w-5 h-5 text-indigo-600" /> Pemantauan CCTV Realtime ({activeCctvFeeds.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('cctv')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    Buka Full CCTV <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {activeCctvFeeds.slice(0, 4).map((feed) => (
                    <div
                      key={feed.id}
                      onClick={() => {
                        setSelectedCctv(feed);
                        setActiveTab('cctv');
                      }}
                      className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer border border-slate-200 bg-slate-950"
                    >
                      <HlsPlayer
                        src={feed.streamUrl || 'https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8'}
                        poster={feed.bg}
                        controls={false}
                        title={feed.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="text-[9px] font-bold text-white bg-slate-900/70 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                          LIVE
                        </span>
                      </div>
                      <p className="absolute bottom-2 left-2 text-[10px] font-bold text-white truncate max-w-[90%] pointer-events-none">
                        {feed.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Live CCTV Dinonaktifkan</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Pemantauan CCTV live saat ini dinonaktifkan oleh Administrator Pusat.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: DAFTAR WALI SANTRI (LIST WALSAN & APPROVAL) ── */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Daftar & Persetujuan Akun Wali Santri
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola pendaftaran mandiri wali santri, berikan persetujuan akun, atau tolak akun yang tidak sesuai.
              </p>
            </div>

            {/* SEARCH BAR */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari wali, username, NIK, atau santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* STATUS FILTER PILLS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Akun ({waliList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Menunggu Persetujuan ({countPending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disetujui / Aktif ({countApproved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              Ditolak ({countRejected})
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat data wali santri...
            </div>
          ) : filteredWali.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              Tidak ada data wali santri ditemukan pada filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Nama Wali & Info</th>
                    <th className="py-3 px-4">Akun Login</th>
                    <th className="py-3 px-4">Santri Terhubung</th>
                    <th className="py-3 px-4">Cabang</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi & Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWali.map((w) => {
                    const studentNames = (w.waliSantri || [])
                      .map((ws) => ws.student?.biodata?.fullName)
                      .filter(Boolean);
                    const cabangName = (w.waliSantri || [])[0]?.student?.cabang?.name || '-';
                    const isPending = w.status === 'PENDING' || w.isApproved === false;
                    const isRejected = w.status === 'REJECTED';
                    const isApproved = w.status === 'APPROVED' || (w.isApproved === true && !isRejected);

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{w.operatorName || 'Wali Santri'}</p>
                          {w.nik && (
                            <p className="text-[11px] text-slate-400 font-mono">NIK: {w.nik}</p>
                          )}
                          {w.phone && (
                            <p className="text-[11px] text-slate-500 font-mono">HP: {w.phone}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo-600 font-semibold">
                          @{w.username}
                        </td>
                        <td className="py-3.5 px-4">
                          {studentNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {studentNames.map((name, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100">
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum terhubung</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{cabangName}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3" /> Menunggu Persetujuan
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3" /> Ditolak
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Disetujui (Aktif)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={approveWalsanMutation.isPending}
                                  onClick={() => approveWalsanMutation.mutate(w.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Setujui
                                </button>
                                <button
                                  type="button"
                                  disabled={rejectWalsanMutation.isPending}
                                  onClick={() => {
                                    if (confirm(`Yakin ingin menolak pendaftaran akun ${w.operatorName || w.username}?`)) {
                                      rejectWalsanMutation.mutate(w.id);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-50"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Tolak
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <>
                                <a
                                  href={`https://wa.me/${(w.phone || '').replace(/[^0-9]/g, '')}?text=Halo%20Wali%20Santri%20${encodeURIComponent(w.operatorName || w.username)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  WA
                                </a>
                                <button
                                  type="button"
                                  disabled={rejectWalsanMutation.isPending}
                                  onClick={() => {
                                    if (confirm(`Nonaktifkan akun ${w.operatorName || w.username}?`)) {
                                      rejectWalsanMutation.mutate(w.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Nonaktifkan / Tolak Akun"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                disabled={approveWalsanMutation.isPending}
                                onClick={() => approveWalsanMutation.mutate(w.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Setujui Ulang
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: KONFIRMASI IZIN SANTRI ── */}
      {activeTab === 'izin' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Konfirmasi Permohonan Izin Santri
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Tinjau, disetujui, atau tolak permohonan izin santri dari wali santri.</p>
          </div>

          <PermohonanIzinSantriTab />
        </div>
      )}

      {/* ── TAB 4: LIVE CCTV STREAMING ── */}
      {activeTab === 'cctv' && (
        (user?.scope !== 'GLOBAL' && (moduleSettings?.walsanCctvEnabled === false || moduleSettings?.cabangCctvEnabled === false)) ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Fitur Live CCTV Streaming Dinonaktifkan</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Akses live streaming kamera CCTV untuk Cabang dan Wali Santri saat ini sedang dinonaktifkan oleh Administrator Pusat di Pengaturan Menu Sistem.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          {/* CCTV ACCESS CODE CONFIGURATION FOR ADMIN */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg space-y-4 border border-indigo-700/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-indigo-800/80">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Pengaturan Keamanan CCTV Wali Santri
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" /> Kode Akses / PIN CCTV
                </h3>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Tentukan Kode PIN Akses yang wajib dimasukkan oleh wali santri saat membuka halaman /portal/cctv.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isSavingPin}
                  onClick={async () => {
                    const newStatus = !cctvProtectionEnabled;
                    setCctvProtectionEnabled(newStatus);
                    setIsSavingPin(true);
                    try {
                      await apiClient.put('/pengaturan/modules', {
                        cctvProtectionEnabled: newStatus,
                      });
                      refetchSettings();
                      setSaveSuccessMsg(newStatus ? 'Proteksi PIN CCTV Diaktifkan (Tersimpan di Server)!' : 'Proteksi PIN CCTV Dinonaktifkan (Tersimpan di Server)!');
                    } catch {
                      showToast('error', 'Gagal menyimpan pengaturan CCTV ke server');
                    } finally {
                      setIsSavingPin(false);
                      setTimeout(() => setSaveSuccessMsg(''), 3000);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 ${
                    cctvProtectionEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${cctvProtectionEnabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                  Status: {cctvProtectionEnabled ? 'PROTEKSI AKTIF' : 'BEBAS AKSES (TANPA PIN)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-1">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-indigo-200 block">Kode Akses PIN CCTV Baru:</label>
                <div className="relative">
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={cctvPinInput}
                    onChange={(e) => setCctvPinInput(e.target.value)}
                    placeholder="Masukkan Kode PIN (misal: 123456 atau CCTV2026)"
                    className="w-full bg-slate-950/80 border border-indigo-700/60 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400 hover:text-white"
                  >
                    {showPinText ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
              </div>

              <div>
                <button
                  disabled={isSavingPin}
                  onClick={async () => {
                    if (!cctvPinInput.trim()) {
                      showToast('warning', 'Kode PIN tidak boleh kosong');
                      return;
                    }
                    setIsSavingPin(true);
                    try {
                      await apiClient.put('/pengaturan/modules', {
                        cctvProtectionEnabled,
                        cctvPin: cctvPinInput.trim(),
                      });
                      refetchSettings();
                      setSaveSuccessMsg('Kode PIN Akses CCTV berhasil disimpan ke Server!');
                    } catch {
                      showToast('error', 'Gagal menyimpan PIN ke server');
                    } finally {
                      setIsSavingPin(false);
                      setTimeout(() => setSaveSuccessMsg(''), 3000);
                    }
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSavingPin ? 'Menyimpan...' : 'Simpan Kode Akses PIN'}
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {saveSuccessMsg}
              </div>
            )}
          </div>

          {/* MANAGING CABANG CCTV STREAM URLS */}
          <KelolaCctvCabangTab />

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600" /> Live CCTV Monitoring Hub
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Kanal siaran langsung pengawasan area santri 24 jam.</p>
              </div>

              {activeCctvFeeds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> Live Stream Active ({activeCctvFeeds.length})
                  </span>
                </div>
              )}
            </div>

            {activeCctvFeeds.length === 0 || !selectedCctv ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <Video className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">Belum Ada Kamera CCTV Live Terdaftar untuk Cabang Ini</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Belum ada siaran kamera CCTV yang dikonfigurasi. Klik tombol <strong className="text-indigo-600">"+ Tambah Kamera CCTV"</strong> di atas untuk mendaftarkan URL siaran kamera.
                </p>
              </div>
            ) : (
              <>
                {/* MAIN CAMERA DISPLAY WITH LIVE HLS PLAYER */}
                <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-xl">
                  <HlsPlayer
                    src={selectedCctv.streamUrl || 'https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8'}
                    poster={selectedCctv.bg}
                    title={selectedCctv.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none"></div>

                  {/* OVERLAY BADGES */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none z-10">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-md">
                      LIVE REC 🔴
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-slate-200 border border-slate-700">
                      1080p HD @ {selectedCctv.fps}fps
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 pointer-events-none z-10">
                    <p className="text-white font-bold text-base flex items-center gap-2">
                      <selectedCctv.icon className="w-5 h-5 text-indigo-400" />
                      {selectedCctv.name}
                    </p>
                    <p className="text-slate-300 text-xs">{selectedCctv.location}</p>
                  </div>
                </div>

                {/* CAMERA GRID SELECTOR & DIRECT EDIT BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {activeCctvFeeds.map((feed) => {
                    const isSelected = selectedCctv.id === feed.id;
                    const IconComp = feed.icon;

                    return (
                      <div
                        key={feed.id}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/30 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => setSelectedCctv(feed)}
                            className="flex-1 text-left cursor-pointer"
                          >
                            <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
                              <IconComp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              {feed.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{feed.location}</p>
                          </button>

                          {/* EDIT BUTTON (As requested by user screenshot) */}
                          <button
                            onClick={() => openEditModal(feed)}
                            className="p-1.5 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs shrink-0 cursor-pointer"
                            title="Edit Alamat Stream & Detail Kamera Ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                          <span className="font-mono text-slate-400 truncate max-w-[130px]">
                            {feed.streamUrl || 'URL Default'}
                          </span>
                          <button
                            onClick={() => setSelectedCctv(feed)}
                            className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {isSelected ? 'TAYANG' : 'PILIH'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        )
      )}

      {/* ── TAB 5: KELOLA PENGUMUMAN WALSAN (PUSAT & CABANG) ── */}
      {activeTab === 'pengumuman' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
          <KelolaPengumumanWalsanTab />
        </div>
      )}

      {/* ── TAB 6: PENGATURAN MENU & AKSES (KHUSUS ADMIN PUSAT) ── */}
      {activeTab === 'settings' && user?.scope === 'GLOBAL' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-300" />
                  Pusat Kendali Otorisasi & Visibilitas Menu
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Pengaturan Menu Portal Walsan & Akses Cabang
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Atur ketersediaan menu yang dapat diakses oleh Wali Santri di portal maupun Staf Cabang di dashboard secara realtime.
                </p>
              </div>

              {/* Master Toggle Portal Walsan */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col gap-2 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  Master Switch Portal
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = moduleSettings?.portalWalsanEnabled !== false;
                    updateModuleMutation.mutate({ portalWalsanEnabled: !currentVal });
                  }}
                  disabled={updateModuleMutation.isPending}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                    moduleSettings?.portalWalsanEnabled !== false
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                  {moduleSettings?.portalWalsanEnabled !== false ? 'PORTAL AKTIF' : 'PORTAL NONAKTIF'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── BAGIAN 1: KONTROL MENU PORTAL WALI SANTRI ── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-indigo-600" />
                    Menu Portal Wali Santri (/portal)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan menu mana saja yang dapat dilihat dan digunakan oleh orang tua / wali santri.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* 1. CCTV Live Streaming */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Menu Live CCTV Streaming (Walsan & Cabang)</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Menampilkan pemantauan CCTV untuk Wali Santri di portal dan Staf Cabang di dashboard. Jika dinonaktifkan, akses CCTV di portal dan cabang akan otomatis dinonaktifkan.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyEnabled = moduleSettings?.walsanCctvEnabled !== false && moduleSettings?.cabangCctvEnabled !== false;
                      updateModuleMutation.mutate({
                        walsanCctvEnabled: !isCurrentlyEnabled,
                        cabangCctvEnabled: !isCurrentlyEnabled,
                      });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                      (moduleSettings?.walsanCctvEnabled !== false && moduleSettings?.cabangCctvEnabled !== false)
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {(moduleSettings?.walsanCctvEnabled !== false && moduleSettings?.cabangCctvEnabled !== false) ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {/* 2. Menu E-Rapor Santri */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Menu E-Rapor Santri</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Mengizinkan wali santri melihat nilai raport dan hasil evaluasi belajar santri.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = moduleSettings?.walsanRaporEnabled !== false;
                      updateModuleMutation.mutate({ walsanRaporEnabled: !currentVal });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                      moduleSettings?.walsanRaporEnabled !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {moduleSettings?.walsanRaporEnabled !== false ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {/* 3. Menu Presensi & Kehadiran */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Menu Presensi & Kehadiran</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Menampilkan rekapitulasi kehadiran santri harian dan program absensi.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = moduleSettings?.walsanKehadiranEnabled !== false;
                      updateModuleMutation.mutate({ walsanKehadiranEnabled: !currentVal });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                      moduleSettings?.walsanKehadiranEnabled !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {moduleSettings?.walsanKehadiranEnabled !== false ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {/* 4. Menu Permohonan Izin Santri */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Menu Permohonan Izin Santri</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Wali santri dapat mengajukan permohonan izin pulang / keluar pondok.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = moduleSettings?.walsanIzinEnabled !== false;
                      updateModuleMutation.mutate({ walsanIzinEnabled: !currentVal });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                      moduleSettings?.walsanIzinEnabled !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {moduleSettings?.walsanIzinEnabled !== false ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {/* 5. Menu Pengumuman */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Menu Pengumuman & Informasi</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Menampilkan berita dan pengumuman resmi pesantren untuk orang tua santri.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = moduleSettings?.walsanPengumumanEnabled !== false;
                      updateModuleMutation.mutate({ walsanPengumumanEnabled: !currentVal });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                      moduleSettings?.walsanPengumumanEnabled !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {moduleSettings?.walsanPengumumanEnabled !== false ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {/* 6. Izin Edit Biodata Santri (Default Global) */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Izin Edit Biodata Santri (Default Global)</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Izin standar edit data mandiri santri oleh walisan jika cabang belum mengatur secara khusus.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = moduleSettings?.walsanEditBiodataEnabled === true;
                      updateModuleMutation.mutate({ walsanEditBiodataEnabled: !currentVal });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                      moduleSettings?.walsanEditBiodataEnabled === true
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {moduleSettings?.walsanEditBiodataEnabled === true ? 'Aktif Global' : 'Nonaktif'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── KONTROL IZIN EDIT BIODATA PER CABANG (ADMIN PUSAT) ── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    Izin Edit Biodata Santri Per Cabang
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aktifkan atau nonaktifkan izin edit biodata mandiri santri untuk masing-masing cabang.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[340px] overflow-y-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Nama Cabang</th>
                      <th className="py-2.5 px-4">Wilayah</th>
                      <th className="py-2.5 px-4 text-center">Status Izin Edit</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(cabangList || []).map((c: any) => {
                      const isEnabled = Boolean(
                        moduleSettings?.cabangEditBiodataMap?.[c.id] ?? moduleSettings?.walsanEditBiodataEnabled ?? false
                      );
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                          <td className="py-3 px-4 text-slate-500">{c.wilayah?.name || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            {isEnabled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" /> Diizinkan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Lock className="w-3 h-3 text-slate-400" /> Ditutup
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              disabled={updateCabangEditMutation.isPending}
                              onClick={() => {
                                updateCabangEditMutation.mutate({ cabangId: c.id, isEnabled: !isEnabled });
                              }}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                                isEnabled
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {isEnabled ? 'Tutup Akses' : 'Buka Akses Edit'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── BAGIAN 2: KONTROL AKSES MENU STAF CABANG & PENGATURAN CCTV PIN ── */}
            <div className="space-y-6">
              {/* KONTROL AKSES STAF CABANG */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                      Akses Fitur Staf Cabang (Admin Cabang)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atur izin menu yang dapat diakses oleh operator cabang di Portal Walsan admin.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* 1. Akses Live CCTV Cabang */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Akses Live CCTV di Cabang</h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          Izinkan operator cabang membuka tab Live CCTV dan monitoring kamera.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={moduleSettings?.walsanCctvEnabled === false}
                      onClick={() => {
                        const currentVal = moduleSettings?.cabangCctvEnabled !== false;
                        updateModuleMutation.mutate({ cabangCctvEnabled: !currentVal });
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                        moduleSettings?.walsanCctvEnabled === false
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : moduleSettings?.cabangCctvEnabled !== false
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {moduleSettings?.walsanCctvEnabled === false
                        ? 'Dinonaktifkan Global'
                        : moduleSettings?.cabangCctvEnabled !== false
                          ? 'Diizinkan'
                          : 'Dibatasi'}
                    </button>
                  </div>

                  {/* 2. Akses Konfirmasi Izin Santri di Cabang */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Konfirmasi Izin Santri di Cabang</h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          Izinkan staf cabang menyetujui / menolak permohonan izin dari wali santri.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = moduleSettings?.cabangIzinEnabled !== false;
                        updateModuleMutation.mutate({ cabangIzinEnabled: !currentVal });
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                        moduleSettings?.cabangIzinEnabled !== false
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {moduleSettings?.cabangIzinEnabled !== false ? 'Diizinkan' : 'Dibatasi'}
                    </button>
                  </div>

                  {/* 3. Akses Daftar Akun Wali Santri di Cabang */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Lihat Kontak & Akun Wali Santri</h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          Izinkan staf cabang melihat direktori wali santri yang terdaftar di sistem.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = moduleSettings?.cabangWalsanListEnabled !== false;
                        updateModuleMutation.mutate({ cabangWalsanListEnabled: !currentVal });
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                        moduleSettings?.cabangWalsanListEnabled !== false
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {moduleSettings?.cabangWalsanListEnabled !== false ? 'Diizinkan' : 'Dibatasi'}
                    </button>
                  </div>
                </div>
              </div>

              {/* KEAMANAN & KODE PIN AKSES CCTV */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white space-y-4 border border-indigo-900/60 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/50 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Keamanan Kode PIN Live CCTV</h3>
                      <p className="text-[11px] text-slate-300">
                        Wajibkan wali santri memasukkan PIN sebelum dapat menonton streaming.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !cctvProtectionEnabled;
                      setCctvProtectionEnabled(nextState);
                      updateModuleMutation.mutate({ cctvProtectionEnabled: nextState });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      cctvProtectionEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {cctvProtectionEnabled ? 'PROTEKSI AKTIF' : 'TANPA PIN'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-indigo-200 block">Kode PIN Akses CCTV Baru:</label>
                    <div className="relative">
                      <input
                        type={showPinText ? 'text' : 'password'}
                        value={cctvPinInput}
                        onChange={(e) => setCctvPinInput(e.target.value)}
                        placeholder="Misal: 123456"
                        className="w-full bg-slate-950/80 border border-indigo-700/60 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPinText(!showPinText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400 hover:text-white cursor-pointer"
                      >
                        {showPinText ? 'Sembunyikan' : 'Lihat'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={isSavingPin}
                      onClick={async () => {
                        if (!cctvPinInput.trim()) {
                          showToast('warning', 'Kode PIN tidak boleh kosong');
                          return;
                        }
                        setIsSavingPin(true);
                        try {
                          await apiClient.put('/pengaturan/modules', {
                            cctvProtectionEnabled,
                            cctvPin: cctvPinInput.trim(),
                          });
                          refetchSettings();
                          showToast('success', 'Kode PIN CCTV berhasil disimpan!');
                        } catch {
                          showToast('error', 'Gagal menyimpan PIN ke server');
                        } finally {
                          setIsSavingPin(false);
                        }
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" /> {isSavingPin ? 'Menyimpan...' : 'Simpan PIN'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT STREAM KAMERA CCTV (Sesuai Gambar User) ── */}
      {isEditModalOpen && editingFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                Edit Pengaturan & Alamat Stream CCTV
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveCctvMutation.mutate(editFormData);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Kamera CCTV *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: CCTV-01: Ruang Kelas Utama A-102"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Kategori Area *</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="KELAS">Ruang Kelas</option>
                    <option value="MASJID">Masjid / Mushala</option>
                    <option value="MAKAN">Tempat Makan / Dapur</option>
                    <option value="ASRAMA">Asrama Santri</option>
                    <option value="HALAMAN">Halaman & Lapangan</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Lokasi Detail</label>
                  <input
                    type="text"
                    placeholder="Misal: Gedung Utama Lt. 2"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Alamat Stream URL (HLS `.m3u8` / RTSP / WebRTC) *</label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8"
                    value={editFormData.streamUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, streamUrl: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Pastikan URL stream aktif. Contoh URL HLS publik: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">https://its.binamarga.pu.go.id:8989/play/hls/CT-02/index.m3u8</code>
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Deskripsi / Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai kamera ini..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveEditModal"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isActiveEditModal" className="font-bold text-slate-700 cursor-pointer">
                  Aktifkan Sinyal Kamera CCTV untuk Wali Santri
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveCctvMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saveCctvMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
