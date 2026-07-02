/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Bell, Search, UserCircle, LogOut, Loader2 } from 'lucide-react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';

// Import Pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/auth/LoginPage';
import ManajemenKelas from './pages/formal/ManajemenKelas';
import InputRapor from './pages/formal/InputRapor';
import UsersWilayah from './pages/admin/UsersWilayah';
import DataSiswaMuadalah from './pages/formal/DataSiswaMuadalah';
import PoolSiswa from './pages/core/PoolSiswa';
import PoolGuru from './pages/core/PoolGuru';
import DataSiswa from './pages/core/DataSiswa';
import DataGuru from './pages/core/DataGuru';
import DataCabang from './pages/core/DataCabang';
import DataWilayah from './pages/core/DataWilayah';
import Sinkronisasi from './pages/admin/Sinkronisasi';

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

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari data santri, kelas, atau modul..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm transition-all outline-none text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6">
            <Select
              value={currentLang}
              onChange={(option) => changeLanguage(option?.value || 'id')}
              options={languageOptions}
              className="w-24 text-sm"
              classNames={{
                control: () => "bg-slate-50 border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer",
              }}
              isSearchable={false}
            />
            <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.scope?.toLowerCase() || 'Role'}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <UserCircle className="w-5 h-5" />
              </div>
              <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-1" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="core/siswa" element={<DataSiswa />} />
            <Route path="core/pool" element={<PoolSiswa />} />
            <Route path="core/guru" element={<DataGuru />} />
            <Route path="core/pool-guru" element={<PoolGuru />} />
            <Route path="core/cabang" element={<DataCabang />} />
            <Route path="core/wilayah" element={<DataWilayah />} />
            <Route path="formal/siswa" element={<DataSiswaMuadalah />} />
            <Route path="formal/kelas" element={<ManajemenKelas />} />
            <Route path="formal/rapor" element={<InputRapor />} />
            <Route path="settings/users" element={<UsersWilayah />} />
            <Route path="settings/sync" element={<Sinkronisasi />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
