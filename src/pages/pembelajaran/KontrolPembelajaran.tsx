import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, LayoutDashboard, BookMarked, ClipboardCheck, TrendingUp, FileBarChart, Settings } from 'lucide-react';
import Ringkasan from './Ringkasan';
import KelolaSilabus from './KelolaSilabus';
import KontrolSilabus from './KontrolSilabus';
import ProgresSilabus from './ProgresSilabus';
import LaporanPembelajaran from './LaporanPembelajaran';
import PengaturanMapelPembelajaran from './PengaturanMapelPembelajaran';

type TabKey = 'ringkasan' | 'silabus' | 'kontrol-silabus' | 'progres-silabus' | 'laporan' | 'pengaturan';

export default function KontrolPembelajaran() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: pengaturanAkademik } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => (await apiClient.get('/pengaturan/akademik')).data
  });

  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string; icon: any }[] = [];
    list.push({ key: 'ringkasan', label: 'Dashboard', icon: LayoutDashboard });
    if (user?.scope === 'GLOBAL') {
      list.push({ key: 'silabus', label: 'Kelola Silabus', icon: BookMarked });
    }
    list.push({ key: 'kontrol-silabus', label: 'Kontrol Silabus', icon: ClipboardCheck });
    list.push({ key: 'progres-silabus', label: 'Progres Silabus', icon: TrendingUp });
    if (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') {
      list.push({ key: 'laporan', label: 'Laporan Pembelajaran', icon: FileBarChart });
    }
    if (user?.scope === 'GLOBAL') {
      list.push({ key: 'pengaturan', label: 'Pengaturan', icon: Settings });
    }
    return list;
  }, [user?.scope]);

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && tabs.some(t => t.key === tabParam)) {
      return tabParam;
    }
    return tabs[0]?.key || 'kontrol-silabus';
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as TabKey;
    if (tabParam && tabs.some(t => t.key === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location.search, tabs]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate({ search: `?tab=${key}` }, { replace: true });
  };

  return (
    <div className="font-sans text-[#191c1d] animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
            Kontrol Pembelajaran
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            Silabus dan absensi siswa per mata pelajaran, dalam satu tempat.
          </p>
        </div>
        {pengaturanAkademik && (
          <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            TA {pengaturanAkademik.tahunAjaran} &middot; {pengaturanAkademik.semesterAktif}
          </span>
        )}
      </div>

      <div className="border-b border-gray-200 bg-white px-2 sm:px-3 pt-2 rounded-lg mb-3 sm:mb-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-t-md transition-all border-b-2 shrink-0 ${
                activeTab === tab.key
                  ? 'border-blue-800 text-blue-800 bg-blue-50/60'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'ringkasan' && <Ringkasan />}
      {activeTab === 'silabus' && user?.scope === 'GLOBAL' && <KelolaSilabus />}
      {activeTab === 'kontrol-silabus' && <KontrolSilabus />}
      {activeTab === 'progres-silabus' && <ProgresSilabus />}
      {activeTab === 'laporan' && (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && <LaporanPembelajaran />}
      {activeTab === 'pengaturan' && user?.scope === 'GLOBAL' && <PengaturanMapelPembelajaran />}
    </div>
  );
}
