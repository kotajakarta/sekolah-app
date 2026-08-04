import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../lib/apiClient';
import PermohonanIzinSantriTab from '../../features/permohonan/PermohonanIzinSantriTab';
import KelolaCctvCabangTab from '../../features/portal/components/KelolaCctvCabangTab';
import HlsPlayer from '../../components/Cctv/HlsPlayer';
import { useToast } from '../../contexts/ToastContext';
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
  Trash2,
  X,
  Link2,
} from 'lucide-react';

interface WaliUserItem {
  id: string;
  username: string;
  operatorName?: string | null;
  scope: string;
  createdAt: string;
  waliSantri?: Array<{
    id: string;
    studentId: string;
    student?: {
      biodata?: { fullName?: string } | null;
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

export default function PortalWalsanPage({ initialTab = 'overview' }: { initialTab?: 'overview' | 'list' | 'izin' | 'cctv' }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'izin' | 'cctv'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // CCTV Access Code PIN States
  const [cctvPinInput, setCctvPinInput] = useState(() => localStorage.getItem('cctv_access_code') || '123456');
  const [cctvProtectionEnabled, setCctvProtectionEnabled] = useState(() => localStorage.getItem('cctv_protection_enabled') !== 'false');
  const [showPinText, setShowPinText] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

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

  // Filter only WALI users
  const waliList = allUsers.filter((u) => u.scope === 'WALI');

  const filteredWali = waliList.filter((w) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (w.operatorName || '').toLowerCase().includes(term);
    const userMatch = w.username.toLowerCase().includes(term);
    const studentMatch = (w.waliSantri || []).some((ws) =>
      (ws.student?.biodata?.fullName || '').toLowerCase().includes(term)
    );
    return nameMatch || userMatch || studentMatch;
  });

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
          </div>
        </div>
      )}

      {/* ── TAB 2: DAFTAR WALI SANTRI (LIST WALSAN) ── */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> List Wali Santri Terdaftar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar seluruh wali santri yang terhubung ke akun eSantri Portal.</p>
            </div>

            {/* SEARCH BAR */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari wali / nama santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {isLoadingUsers ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat data wali santri...
            </div>
          ) : filteredWali.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
              Tidak ada data wali santri ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Nama Wali / Pengguna</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Santri Terhubung</th>
                    <th className="py-3 px-4">Cabang</th>
                    <th className="py-3 px-4 text-right">Kontak / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWali.map((w) => {
                    const studentNames = (w.waliSantri || [])
                      .map((ws) => ws.student?.biodata?.fullName)
                      .filter(Boolean);
                    const cabangName = (w.waliSantri || [])[0]?.student?.cabang?.name || '-';

                    return (
                      <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {w.operatorName || 'Wali Santri'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo-600 font-medium">@{w.username}</td>
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
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`https://wa.me/?text=Halo%20Wali%20Santri%20${encodeURIComponent(w.operatorName || w.username)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Kirim Pesan WA
                          </a>
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
                  onClick={() => {
                    const newStatus = !cctvProtectionEnabled;
                    setCctvProtectionEnabled(newStatus);
                    localStorage.setItem('cctv_protection_enabled', newStatus ? 'true' : 'false');
                    setSaveSuccessMsg(newStatus ? 'Proteksi PIN CCTV Diaktifkan!' : 'Proteksi PIN CCTV Dinonaktifkan!');
                    setTimeout(() => setSaveSuccessMsg(''), 3000);
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
                  onClick={() => {
                    if (!cctvPinInput.trim()) return;
                    localStorage.setItem('cctv_access_code', cctvPinInput.trim());
                    localStorage.setItem('cctv_protection_enabled', cctvProtectionEnabled ? 'true' : 'false');
                    setSaveSuccessMsg('Kode PIN Akses CCTV berhasil disimpan!');
                    setTimeout(() => setSaveSuccessMsg(''), 3000);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Simpan Kode Akses PIN
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
