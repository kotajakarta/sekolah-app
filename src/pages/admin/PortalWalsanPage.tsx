import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import apiClient from '../../lib/apiClient';
import PermohonanIzinSantriTab from '../../features/permohonan/PermohonanIzinSantriTab';
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
  },
];

export default function PortalWalsanPage({ initialTab = 'overview' }: { initialTab?: 'overview' | 'list' | 'izin' | 'cctv' }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'izin' | 'cctv'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCctv, setSelectedCctv] = useState<CCTVChannel>(ADMIN_CCTV_FEEDS[0]);

  // CCTV Access Code PIN States
  const [cctvPinInput, setCctvPinInput] = useState(() => localStorage.getItem('cctv_access_code') || '123456');
  const [cctvProtectionEnabled, setCctvProtectionEnabled] = useState(() => localStorage.getItem('cctv_protection_enabled') !== 'false');
  const [showPinText, setShowPinText] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Fetch Users for Wali Santri List
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<WaliUserItem[]>({
    queryKey: ['admin-users-walsan'],
    queryFn: async () => (await apiClient.get('/admin/users')).data,
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
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">4 Kanal Online</h3>
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

            {/* MONITORING CCTV EMBED */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600" /> Pemantauan CCTV Realtime
                </h3>
                <button
                  onClick={() => setActiveTab('cctv')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  Buka Full CCTV <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ADMIN_CCTV_FEEDS.map((feed) => (
                  <div
                    key={feed.id}
                    onClick={() => {
                      setSelectedCctv(feed);
                      setActiveTab('cctv');
                    }}
                    className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer border border-slate-200"
                  >
                    <img src={feed.bg} alt={feed.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span className="text-[9px] font-bold text-white bg-slate-900/70 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        LIVE
                      </span>
                    </div>
                    <p className="absolute bottom-2 left-2 text-[10px] font-bold text-white truncate max-w-[90%]">
                      {feed.name.split(': ')[1] || feed.name}
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

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600" /> Live CCTV Monitoring Hub
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Kanal siaran langsung pengawasan area santri 24 jam.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> Live Stream Active
                </span>
              </div>
            </div>

            {/* MAIN CAMERA DISPLAY */}
            <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-xl">
              <img src={selectedCctv.bg} alt={selectedCctv.name} className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40"></div>

              {/* OVERLAY BADGES */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-md">
                  LIVE REC 🔴
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-slate-200 border border-slate-700">
                  1080p HD @ {selectedCctv.fps}fps
                </span>
              </div>

              <div className="absolute bottom-4 left-4">
                <p className="text-white font-bold text-base flex items-center gap-2">
                  <selectedCctv.icon className="w-5 h-5 text-indigo-400" />
                  {selectedCctv.name}
                </p>
                <p className="text-slate-300 text-xs">{selectedCctv.location}</p>
              </div>
            </div>

            {/* CAMERA GRID SELECTOR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {ADMIN_CCTV_FEEDS.map((feed) => (
                <button
                  key={feed.id}
                  onClick={() => setSelectedCctv(feed)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedCctv.id === feed.id
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <p className="font-bold text-slate-800 text-xs truncate">{feed.name.split(': ')[1]}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{feed.location}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
