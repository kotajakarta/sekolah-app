/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, Navigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { GlobalSearch } from './components/Layout/GlobalSearch';
import { Bell, Search, UserCircle, LogOut, Loader2, Sparkles, LifeBuoy } from 'lucide-react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';

// Import Pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/auth/LoginPage';
import ManajemenKelas from './pages/formal/ManajemenKelas';
import InputRapor from './pages/formal/InputRapor';
import ManajemenMapel from './pages/formal/ManajemenMapel';
import PenugasanGuru from './pages/formal/PenugasanGuru';
import UsersWilayah from './pages/admin/UsersWilayah';
import DataSiswaMuadalah from './pages/formal/DataSiswaMuadalah';
import PoolSiswa from './pages/core/PoolSiswa';
import PoolGuru from './pages/core/PoolGuru';
import DataSiswa from './pages/core/DataSiswa';
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
import KalenderAkademikUmum from './pages/umum/KalenderAkademikUmum';
import LandingPage from './pages/public/LandingPage';
import DaftarUlang from './pages/public/DaftarUlang';
import RiwayatPerubahanData from './pages/core/RiwayatPerubahanData';
import FaqPage from './pages/umum/FaqPage';
import ProfileUser from './pages/core/ProfileUser';
import KetersediaanGuruMapel from './pages/dashboard/KetersediaanGuruMapel';
import AbsensiSiswa from './pages/absensi/AbsensiSiswa';
import RekapitulasiAbsensi from './pages/laporan/RekapitulasiAbsensi';
import KelolaProgramAbsensi from './pages/absensi/KelolaProgramAbsensi';
import LembagaMuadalahPage from './pages/formal/LembagaMuadalah';
import ManajemenRuang from './pages/sarpras/ManajemenRuang';
import ManajemenFasilitas from './pages/sarpras/ManajemenFasilitas';
import KelolaFaq from './pages/settings/KelolaFaq';

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

  return <>{children}</>;
};

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
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
    { value: 'id', label: 'ID' },
    { value: 'en', label: 'EN' },
    { value: 'tr', label: 'TR' },
  ];

  const currentLang = languageOptions.find(opt => opt.value === i18n.resolvedLanguage) || languageOptions[0];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex w-full h-screen bg-white font-sans text-gray-800 overflow-hidden">
      <PengumumanPopup />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {user?.scope === 'GLOBAL' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                Scope: Pusat (Global)
              </span>
            )}
            {user?.scope === 'WILAYAH' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
                Wilayah: {user.wilayahName || 'Semua Wilayah'}
              </span>
            )}
            {user?.scope === 'CABANG' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                Cabang: {user.cabangName || 'Semua Cabang'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-5 text-sm font-medium text-gray-600">
            <button onClick={() => navigate('/faq')} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
              <LifeBuoy className="w-4 h-4" />
              Support
            </button>
            <div className="w-px h-4 bg-gray-300"></div>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <UserCircle className="w-6 h-6" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/profile');
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
        <main ref={mainRef} className="flex-1 overflow-auto bg-white p-6 lg:p-10">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
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
            <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="profile-cabang" element={<ProfilCabang />} />
              <Route path="umum/pengumuman" element={<PengumumanUmum />} />
              <Route path="umum/kalender" element={<KalenderAkademikUmum />} />
              <Route path="core/siswa" element={<DataSiswa />} />
              <Route path="core/permintaan-tarik" element={<PermintaanTarikData />} />
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
              <Route path="formal/rapor" element={<InputRapor />} />
              <Route path="settings/users" element={<UsersWilayah />} />
              <Route path="settings/sync" element={<Sinkronisasi />} />
              <Route path="settings/akademik" element={<PengaturanAkademik />} />
              <Route path="settings/pengumuman" element={<KelolaPengumuman />} />
              <Route path="settings/kalender" element={<KelolaKalender />} />
              <Route path="settings/keaktifan-mapel" element={<KeaktifanMapel />} />
              <Route path="settings/faq" element={<KelolaFaq />} />
              <Route path="dashboard/ketersediaan-guru" element={<KetersediaanGuruMapel />} />
              <Route path="absensi/siswa" element={<AbsensiSiswa />} />
              <Route path="absensi/programs" element={<KelolaProgramAbsensi />} />
              <Route path="laporan/absensi" element={<RekapitulasiAbsensi />} />
              <Route path="sarpras/ruang" element={<ManajemenRuang />} />
              <Route path="sarpras/fasilitas" element={<ManajemenFasilitas />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
      <ToastContainer />
    </ToastProvider>
  );
}
