/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, Navigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import MobileBottomNav from './components/Layout/MobileBottomNav';
import HeaderSearch from './components/Layout/HeaderSearch';
import { GlobalSearch } from './components/Layout/GlobalSearch';
import { Bell, Search, UserCircle, LogOut, Loader2, Sparkles, LifeBuoy, CheckCircle, Globe, ChevronDown, Check } from 'lucide-react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import { useQuery } from '@tanstack/react-query';
import apiClient from './lib/apiClient';

// Import Pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/auth/LoginPage';
import ManajemenKelas from './pages/formal/ManajemenKelas';
import ERaporPage from './pages/formal/ERaporPage';
import ManajemenMapel from './pages/formal/ManajemenMapel';
import PenugasanGuru from './pages/formal/PenugasanGuru';
import KontrolPembelajaran from './pages/pembelajaran/KontrolPembelajaran';
import UsersWilayah from './pages/admin/UsersWilayah';
import DataSiswaMuadalah from './pages/formal/DataSiswaMuadalah';
import PoolSiswa from './pages/core/PoolSiswa';
import PoolGuru from './pages/core/PoolGuru';
import DataSiswa from './pages/core/DataSiswa';
import DataResidu from './pages/core/DataResidu';
import DaftarUlangSiswa from './pages/core/DaftarUlangSiswa';
import PermintaanTarikData from './pages/core/PermintaanTarikData';
import DataGuru from './pages/core/DataGuru';
import DataCabang from './pages/core/DataCabang';
import DataWilayah from './pages/core/DataWilayah';
import ProfilCabang from './pages/core/ProfilCabang';
import Sinkronisasi from './pages/admin/Sinkronisasi';
import PengaturanAkademik from './pages/admin/PengaturanAkademik';
import KelolaPengumuman from './pages/admin/KelolaPengumuman';
import KelolaKalender from './pages/admin/KelolaKalender';
import KeaktifanMapel from './pages/admin/KeaktifanMapel';
import PengumumanUmum from './pages/umum/PengumumanUmum';
import PengumumanPopup from './components/PengumumanPopup';
import TwoFactorReminderPopup from './components/TwoFactorReminderPopup';
import KalenderAkademikUmum from './pages/umum/KalenderAkademikUmum';
import LandingPage from './pages/public/LandingPage';
import DaftarUlang from './pages/public/DaftarUlang';
import RiwayatPerubahanData from './pages/core/RiwayatPerubahanData';
import PermohonanIzinSantri from './pages/core/PermohonanIzinSantri';
import FaqPage from './pages/umum/FaqPage';
import ProfileUser from './pages/core/ProfileUser';
import KetersediaanGuruMapel from './pages/dashboard/KetersediaanGuruMapel';
import AbsensiSiswa from './pages/absensi/AbsensiSiswa';
import AbsensiGuru from './pages/absensi/AbsensiGuru';
import RekapitulasiAbsensi from './pages/laporan/RekapitulasiAbsensi';
import RekapitulasiKelengkapanData from './pages/laporan/RekapitulasiKelengkapanData';
import RekapitulasiKelengkapanGuru from './pages/laporan/RekapitulasiKelengkapanGuru';
import KelolaProgramAbsensi from './pages/absensi/KelolaProgramAbsensi';
import LembagaMuadalahPage from './pages/formal/LembagaMuadalah';
import ManajemenRuang from './pages/sarpras/ManajemenRuang';
import ManajemenFasilitas from './pages/sarpras/ManajemenFasilitas';
import KelolaFaq from './pages/settings/KelolaFaq';
import FormKegiatan from './pages/kegiatan/FormKegiatan';
import ListKegiatanBap from './pages/kegiatan/ListKegiatanBap';
import KelolaJenisKegiatan from './pages/kegiatan/KelolaJenisKegiatan';
import KelolaTemplateKegiatan from './pages/kegiatan/KelolaTemplateKegiatan';
import DashboardBapAdmin from './pages/kegiatan/DashboardBapAdmin';
import SuratPage from './pages/surat/SuratPage';
import PortalLayout from './components/Layout/PortalLayout';
import { PortalStudentProvider } from './features/portal/context/PortalStudentContext';
import PortalBeranda from './pages/portal/PortalBeranda';
import PortalRapor from './pages/portal/PortalRapor';
import PortalKehadiran from './pages/portal/PortalKehadiran';
import PortalPengumuman from './pages/portal/PortalPengumuman';
import PortalPermohonanIzin from './pages/portal/PortalPermohonanIzin';
import PortalProfile from './pages/portal/PortalProfile';
import PortalCctv from './pages/portal/PortalCctv';
import PortalWalsanPage from './pages/admin/PortalWalsanPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.scope === 'WALI') {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};

const WaliRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.scope !== 'WALI') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languageOptions = [
    { value: 'id', label: 'ID', flag: '🇮🇩', name: 'Bahasa Indonesia' },
    { value: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
    { value: 'tr', label: 'TR', flag: '🇹🇷', name: 'Türkçe' },
  ];

  const currentLang = languageOptions.find(opt => opt.value === i18n.resolvedLanguage) || languageOptions[0];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Announcements
  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ['pengumuman'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/pengumuman');
      return res.data;
    },
    refetchInterval: 60000
  });

  // Fetch BAPs and Templates (only if scope is CABANG)
  const { data: baps = [] } = useQuery<any[]>({
    queryKey: ['kegiatan', 'branch-list'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan');
      return res.data;
    },
    enabled: user?.scope === 'CABANG',
    refetchInterval: 60000
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ['template-kegiatan'],
    queryFn: async () => {
      const res = await apiClient.get('/kegiatan/templates');
      return res.data;
    },
    enabled: user?.scope === 'CABANG',
    refetchInterval: 60000
  });

  // Fetch Permohonan Cabang (only if scope is GLOBAL)
  const { data: permohonanCabang = [] } = useQuery<any[]>({
    queryKey: ['permohonan-cabang'],
    queryFn: async () => {
      const res = await apiClient.get('/master-data/cabang/permohonan');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL',
    refetchInterval: 30000
  });

  // Fetch Permohonan Kelas (only if scope is GLOBAL)
  const { data: permohonanKelas = [] } = useQuery<any[]>({
    queryKey: ['permohonan-kelas'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas/permohonan');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL',
    refetchInterval: 30000
  });

  const activeAnnouncements = announcements.filter((p: any) => p.isActive);
  const pendingBaps = user?.scope === 'CABANG'
    ? templates.filter((tmpl: any) => !baps.some((b: any) => b.templateId === tmpl.id))
    : [];

  const pendingPermohonanCabang = user?.scope === 'GLOBAL'
    ? permohonanCabang.filter((p: any) => p.status === 'PENDING')
    : [];

  const pendingPermohonanKelas = user?.scope === 'GLOBAL'
    ? permohonanKelas.filter((k: any) => k.status === 'PENDING')
    : [];

  const totalWarnings = activeAnnouncements.length + pendingBaps.length + pendingPermohonanCabang.length + pendingPermohonanKelas.length;

  return (
    <div className="bg-slate-50 flex w-full h-screen font-sans text-gray-800 overflow-hidden">
      <PengumumanPopup />
      <TwoFactorReminderPopup />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-3 lg:px-8 shrink-0 sticky top-0 z-40 shadow-2xs">
          <HeaderSearch />

          <div className="flex items-center gap-3 sm:gap-5 text-sm font-medium text-gray-600 shrink-0 ml-auto">
            {user?.scope === 'GLOBAL' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm truncate">
                <span className="hidden sm:inline">Scope:&nbsp;</span>Pusat
              </span>
            )}
            {user?.scope === 'WILAYAH' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-sm truncate max-w-[140px] sm:max-w-none">
                <span className="hidden sm:inline">Wilayah:&nbsp;</span>{user.wilayahName || 'Semua Wilayah'}
              </span>
            )}
            {user?.scope === 'CABANG' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm truncate max-w-[140px] sm:max-w-none">
                <span className="hidden sm:inline">Cabang:&nbsp;</span>{user.cabangName || 'Semua Cabang'}
              </span>
            )}

            <button onClick={() => navigate('/dashboard/faq')} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
              <LifeBuoy className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.support') || "Support"}</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 shadow-sm cursor-pointer"
                title={t('nav.select_language') || "Pilih Bahasa"}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentLang.flag} {currentLang.label}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[100] text-xs text-left">
                  <div className="px-3.5 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    {t('nav.select_language') || "Pilih Bahasa"}
                  </div>
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        changeLanguage(opt.value);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-indigo-50/60 transition-colors ${
                        i18n.resolvedLanguage === opt.value ? 'font-bold text-indigo-600 bg-indigo-50/40' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{opt.flag}</span>
                        <span>{opt.name}</span>
                      </span>
                      {i18n.resolvedLanguage === opt.value && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {totalWarnings > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {totalWarnings}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-[100] text-left text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                    <span>Notifikasi & Tugas</span>
                    {totalWarnings > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold">
                        {totalWarnings} Butuh Tindakan
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {pendingPermohonanCabang.length > 0 && (
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/dashboard/core/cabang?tab=permohonan');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50/50 flex items-start gap-2.5 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 animate-pulse"></span>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">Pengajuan Cabang Baru</p>
                          <p className="text-[10px] text-slate-500">Terdapat {pendingPermohonanCabang.length} pengajuan cabang baru dari Wilayah.</p>
                        </div>
                      </button>
                    )}

                    {pendingPermohonanKelas.length > 0 && (
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/dashboard/formal/kelas?tab=permohonan');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50/50 flex items-start gap-2.5 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shrink-0 animate-pulse"></span>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">Pengajuan Kelas Baru</p>
                          <p className="text-[10px] text-slate-500">Terdapat {pendingPermohonanKelas.length} pengajuan kelas baru dari Wilayah.</p>
                        </div>
                      </button>
                    )}

                    {activeAnnouncements.length > 0 && (
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/dashboard/umum/pengumuman');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50/50 flex items-start gap-2.5 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0 animate-pulse"></span>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">Ada Pengumuman Aktif</p>
                          <p className="text-[10px] text-slate-400">Terdapat {activeAnnouncements.length} pengumuman baru dari Pusat.</p>
                        </div>
                      </button>
                    )}

                    {pendingBaps.length > 0 && (
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/dashboard/kegiatan/buat');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50/50 flex items-start gap-2.5 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0 animate-pulse"></span>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">Tugas Laporan BAP Kegiatan</p>
                          <p className="text-[10px] text-slate-400">Ada {pendingBaps.length} laporan BAP kegiatan yang belum dikerjakan.</p>
                        </div>
                      </button>
                    )}

                    {totalWarnings === 0 && (
                      <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-1.5">
                        <CheckCircle className="w-7 h-7 text-emerald-500" />
                        <span className="font-medium text-slate-500">Semua tugas & pengumuman selesai!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-gray-300"></div>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <UserCircle className="w-6 h-6" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[100]">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/dashboard/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Lihat Profile User
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 lg:px-8 py-4 pb-20 lg:py-10 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/daftar-ulang" element={<DaftarUlang />} />
            <Route path="/dafta-ulng" element={<Navigate to="/daftar-ulang" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="profile-cabang" element={<ProfilCabang />} />
              <Route path="umum/pengumuman" element={<PengumumanUmum />} />
              <Route path="umum/kalender" element={<KalenderAkademikUmum />} />
              <Route path="core/siswa" element={<DataSiswa />} />
              <Route path="core/siswa-residu" element={<DataResidu />} />
              <Route path="core/daftar-ulang" element={<DaftarUlangSiswa />} />
              <Route path="core/permintaan-tarik" element={<PermintaanTarikData />} />
              <Route path="core/permohonan-izin" element={<PermohonanIzinSantri />} />
              <Route path="core/pool" element={<PoolSiswa />} />
              <Route path="core/guru" element={<DataGuru />} />
              <Route path="core/pool-guru" element={<PoolGuru />} />
              <Route path="core/cabang" element={<DataCabang />} />
              <Route path="core/wilayah" element={<DataWilayah />} />
              <Route path="core/riwayat-perubahan" element={<RiwayatPerubahanData />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="profile" element={<ProfileUser />} />
              <Route path="formal/siswa" element={<DataSiswaMuadalah />} />
              <Route path="formal/kelas" element={<ManajemenKelas />} />
              <Route path="formal/muadalah" element={<LembagaMuadalahPage />} />
              <Route path="formal/mapel" element={<ManajemenMapel />} />
              <Route path="formal/penugasan-guru" element={<PenugasanGuru />} />
              <Route path="pembelajaran" element={<KontrolPembelajaran />} />
              <Route path="formal/rapor" element={<ERaporPage />} />
              <Route path="settings/users" element={<UsersWilayah />} />
              <Route path="settings/sync" element={<Sinkronisasi />} />
              <Route path="settings/akademik" element={<PengaturanAkademik />} />
              <Route path="settings/pengumuman" element={<KelolaPengumuman />} />
              <Route path="settings/kalender" element={<KelolaKalender />} />
              <Route path="settings/keaktifan-mapel" element={<KeaktifanMapel />} />
              <Route path="settings/faq" element={<KelolaFaq />} />
              <Route path="dashboard/ketersediaan-guru" element={<KetersediaanGuruMapel />} />
              <Route path="absensi/siswa" element={<AbsensiSiswa />} />
              <Route path="absensi/guru" element={<AbsensiGuru />} />
              <Route path="absensi/programs" element={<KelolaProgramAbsensi />} />
              <Route path="laporan/absensi" element={<RekapitulasiAbsensi />} />
              <Route path="laporan/kelengkapan-data" element={<RekapitulasiKelengkapanData />} />
              <Route path="laporan/kelengkapan-guru" element={<RekapitulasiKelengkapanGuru />} />
              <Route path="sarpras/ruang" element={<ManajemenRuang />} />
              <Route path="sarpras/fasilitas" element={<ManajemenFasilitas />} />
              <Route path="kegiatan/buat" element={<FormKegiatan />} />
              <Route path="kegiatan" element={<ListKegiatanBap />} />
              <Route path="kegiatan/dashboard" element={<DashboardBapAdmin />} />
              <Route path="kegiatan/stats" element={<DashboardBapAdmin />} />
              <Route path="kegiatan/jenis" element={<KelolaJenisKegiatan />} />
              <Route path="kegiatan/templates" element={<KelolaTemplateKegiatan />} />
              <Route path="surat" element={<SuratPage />} />
              <Route path="portal-walsan" element={<PortalWalsanPage />} />
              <Route path="portal-walsan/list" element={<PortalWalsanPage initialTab="list" />} />
              <Route path="portal-walsan/izin" element={<PortalWalsanPage initialTab="izin" />} />
              <Route path="portal-walsan/cctv" element={<PortalWalsanPage initialTab="cctv" />} />
            </Route>
            <Route
              path="/portal"
              element={
                <WaliRoute>
                  <PortalStudentProvider>
                    <PortalLayout />
                  </PortalStudentProvider>
                </WaliRoute>
              }
            >
              <Route index element={<PortalBeranda />} />
              <Route path="rapor" element={<PortalRapor />} />
              <Route path="kehadiran" element={<PortalKehadiran />} />
              <Route path="cctv" element={<PortalCctv />} />
              <Route path="pengumuman" element={<PortalPengumuman />} />
              <Route path="permohonan-izin" element={<PortalPermohonanIzin />} />
              <Route path="profile" element={<PortalProfile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
      <ToastContainer />
    </ToastProvider>
  );
}
