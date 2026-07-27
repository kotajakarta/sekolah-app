import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, BookMarked, ClipboardCheck, BookOpen, FileBarChart } from 'lucide-react';
import KelolaSilabus from './KelolaSilabus';
import KontrolSilabus from './KontrolSilabus';
import AbsensiMapel from './AbsensiMapel';
import LaporanPembelajaran from './LaporanPembelajaran';

type TabKey = 'silabus' | 'kontrol-silabus' | 'absensi-mapel' | 'laporan';

export default function KontrolPembelajaran() {
  const { user } = useAuth();

  const { data: pengaturanAkademik } = useQuery({
    queryKey: ['pengaturan-akademik'],
    queryFn: async () => (await apiClient.get('/pengaturan/akademik')).data
  });

  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string; icon: any }[] = [];
    if (user?.scope === 'GLOBAL') {
      list.push({ key: 'silabus', label: 'Kelola Silabus', icon: BookMarked });
    }
    list.push({ key: 'kontrol-silabus', label: 'Kontrol Silabus', icon: ClipboardCheck });
    list.push({ key: 'absensi-mapel', label: 'Absensi Mapel', icon: BookOpen });
    if (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') {
      list.push({ key: 'laporan', label: 'Laporan Pembelajaran', icon: FileBarChart });
    }
    return list;
  }, [user?.scope]);

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]?.key || 'kontrol-silabus');

  return (
    <div className="font-sans text-[#191c1d] animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-800" />
            Kontrol Pembelajaran
          </h1>
          <p className="hidden sm:block text-sm text-slate-500 mt-1">
            Silabus dan absensi siswa per mata pelajaran, dalam satu tempat.
          </p>
        </div>
        {pengaturanAkademik && (
          <span className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            TA {pengaturanAkademik.tahunAjaran} &middot; {pengaturanAkademik.semesterAktif}
          </span>
        )}
      </div>

      <div className="border-b border-gray-200 bg-white px-2 sm:px-4 pt-3 rounded-lg mb-4 sm:mb-6">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-t-md transition-all border-b-2 shrink-0 ${
                activeTab === tab.key
                  ? 'border-blue-800 text-blue-800 bg-blue-50/60'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'silabus' && user?.scope === 'GLOBAL' && <KelolaSilabus />}
      {activeTab === 'kontrol-silabus' && <KontrolSilabus />}
      {activeTab === 'absensi-mapel' && <AbsensiMapel />}
      {activeTab === 'laporan' && (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && <LaporanPembelajaran />}
    </div>
  );
}
