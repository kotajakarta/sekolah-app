import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, BookOpen, LayoutDashboard, Award, Loader2,
  Calendar, MoreHorizontal, Plus, ChevronRight, Activity,
  CheckCircle2, Copy, AlertCircle, FileText, Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';

interface DashboardStats {
  totalSantri: number;
  totalKelas: number;
  cabangMissingSubjectsCount?: number;
  ketersediaanGuru?: { 
    cabangId: string; 
    cabangName: string; 
    wilayahName: string;
    missingSubjects: string[];
    status: 'hijau' | 'kuning' | 'merah';
  }[];
  chartGrupDaimi: { name: string; value: number }[];
  chartKelas: { name: string; value: number }[];
  activities: { title: string; time: string; author: string }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get<DashboardStats>('/dashboard/stats');
        setStatsData(res.data);
      } catch (err: any) {
        setError(t('common.failed') || 'Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 shadow-sm mt-6">
        {error || 'Data tidak ditemukan'}
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-500 pb-10">

      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest">Portal Utama</span>
            {user?.scope && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${user.scope === 'GLOBAL' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                user.scope === 'WILAYAH' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                {user.scope === 'GLOBAL' ? 'Pusat' : user.scope === 'WILAYAH' ? 'Wilayah' : 'Cabang'}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Selamat datang kembali, <span className="text-blue-600 font-extrabold">
              {user?.scope === 'CABANG'
                ? (user?.cabangName || user?.username || 'Cabang')
                : user?.scope === 'WILAYAH'
                  ? (user?.wilayahName || user?.username || 'Wilayah')
                  : 'Administrator'}
            </span>
          </h1>
        </div>
        {/* <div className="flex items-center gap-2 self-start md:self-center">
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all bg-white shadow-sm hover:shadow-md">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all bg-white shadow-sm hover:shadow-md">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md ml-1 active:scale-[0.98]">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Tambah Data
          </button>
        </div> */}
      </div>

      {/* Analytics Section Header */}
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Ringkasan Data</h2>
        <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[12px] font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Terakhir Update: Hari ini
        </button>
      </div>

      {/* Top 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* Santri Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col relative group">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-[12px] font-semibold text-slate-600">Total Santri</span>
            </div>
            <AlertCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-pointer" />
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between z-10 relative">
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Data Santri Aktif</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{statsData.totalSantri.toLocaleString()}</span>
                <span className="text-[11px] font-bold text-green-600 flex items-center bg-green-50 px-1.5 py-0.5 rounded-md">↗ 2.4%</span>
              </div>
            </div>

            {/* CSS Bar Chart */}
            <div className="flex items-end h-10 gap-1 w-full mt-5">
              <div className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-t-[3px] transition-all" style={{ height: '30%' }}></div>
              <div className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-t-[3px] transition-all" style={{ height: '50%' }}></div>
              <div className="flex-1 bg-blue-500/15 hover:bg-blue-500/25 rounded-t-[3px] transition-all" style={{ height: '40%' }}></div>
              <div className="flex-1 bg-blue-500/40 hover:bg-blue-500/50 rounded-t-[3px] transition-all" style={{ height: '70%' }}></div>
              <div className="flex-1 bg-blue-500/60 hover:bg-blue-500/75 rounded-t-[3px] transition-all" style={{ height: '90%' }}></div>
              <div className="flex-1 bg-blue-500/100 hover:bg-blue-500/90 rounded-t-[3px] transition-all" style={{ height: '65%' }}></div>
            </div>
          </div>
        </div>

        {/* Kelas Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col relative group">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[12px] font-semibold text-slate-600">Kelas Aktif</span>
            </div>
          </div>
          <div className="p-5 flex-1 relative z-10 min-h-[120px]">
            <p className="text-[11px] text-slate-400 mb-1">Rombongan Belajar</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{statsData.totalKelas.toLocaleString()}</span>
            </div>

            {/* Area Chart Wavy SVG */}
            <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden rounded-b-xl z-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient-emerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M0,40 L0,20 C20,25 35,5 55,22 C75,39 85,15 100,18 L100,40 Z" fill="url(#gradient-emerald)" />
                <path d="M0,20 C20,25 35,5 55,22 C75,39 85,15 100,18" fill="none" stroke="#10B981" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cabang Kurang Guru Mapel */}
        <div className="bg-white border border-rose-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col relative group col-span-1 sm:col-span-2">
          <div className="px-4 py-3 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-[12px] font-semibold text-rose-700">Cabang Kurang Guru Mapel Umum</span>
            </div>
            <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
              {statsData.cabangMissingSubjectsCount || 0} Cabang
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[160px] custom-scrollbar">
            {statsData.ketersediaanGuru && statsData.ketersediaanGuru.filter(k => k.status !== 'hijau').length > 0 ? (
              <ul className="space-y-3">
                {statsData.ketersediaanGuru.filter(k => k.status !== 'hijau').map((cabang, idx) => (
                  <li key={idx} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <p className="text-[12px] font-bold text-slate-800">{cabang.cabangName}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kekurangan: <span className="font-medium text-rose-600">{cabang.missingSubjects.join(', ')}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                <p className="text-[12px] font-medium">Semua cabang lengkap</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Distribusi Grup Daimi */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col group/chart">
          <div className="bg-[#f9fafb] px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Distribusi Grup Daimi</h3>
          </div>

          <div className="p-6 flex items-end justify-between gap-4 h-44 relative bg-[linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:100%_32px]">
            {statsData.chartGrupDaimi && statsData.chartGrupDaimi.length > 0 ? (
              statsData.chartGrupDaimi.map((item, i) => {
                const maxVal = Math.max(...statsData.chartGrupDaimi.map(d => d.value), 1);
                const percent = (item.value / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative z-10">
                    <span className="text-[11px] font-bold text-slate-800 bg-slate-50 px-1 py-0.5 rounded shadow-sm border border-slate-100 absolute -top-6 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {item.value}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mb-1">{item.value}</span>
                    <div className="w-3.5 h-24 bg-slate-100/70 rounded-full flex flex-col justify-end overflow-hidden">
                      <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-full transition-all duration-700 origin-bottom hover:brightness-105 cursor-pointer" style={{ height: `${percent}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 text-center uppercase tracking-tight leading-tight mt-2 w-full truncate">{item.name}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-[13px] text-slate-500 py-4 text-center w-full">Data tidak tersedia</div>
            )}
          </div>
        </div>

        {/* Kategori Siswa */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col group/chart">
          <div className="bg-[#f9fafb] px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Kategori Siswa (Formal)</h3>
          </div>

          <div className="p-6 flex items-end justify-between gap-4 h-44 relative bg-[linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:100%_32px]">
            {statsData.chartKelas && statsData.chartKelas.length > 0 ? (
              statsData.chartKelas.map((item, i) => {
                const maxVal = Math.max(...statsData.chartKelas.map(d => d.value), 1);
                const percent = (item.value / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group/bar relative z-10">
                    <span className="text-[11px] font-bold text-slate-800 bg-slate-50 px-1 py-0.5 rounded shadow-sm border border-slate-100 absolute -top-6 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {item.value}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mb-1">{item.value}</span>
                    <div className="w-3.5 h-24 bg-slate-100/70 rounded-full flex flex-col justify-end overflow-hidden">
                      <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 origin-bottom hover:brightness-105 cursor-pointer" style={{ height: `${percent}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 text-center uppercase tracking-tight leading-tight mt-2 w-full truncate">{item.name}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-[13px] text-slate-500 py-4 text-center w-full">Data tidak tersedia</div>
            )}
          </div>
        </div>

      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

        {/* Left Column: Aktivitas Terbaru */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#f9fafb] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-[18px] h-[18px] text-slate-500" />
                <span className="text-[13px] font-semibold text-slate-700 uppercase tracking-wider">Aktivitas Terbaru</span>
                <span className="bg-slate-200/60 text-slate-700 text-[11px] px-2 py-0.5 rounded-full font-bold ml-1">
                  {statsData.activities.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* <button className="p-1 hover:bg-slate-200/60 rounded text-slate-500 transition-colors"><Settings className="w-4 h-4" /></button> */}
                <a
                  href="/core/riwayat-perubahan"
                  className="inline-block p-1 hover:bg-slate-200/60 rounded text-slate-500 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="p-6 relative">
              {/* Vertical timeline connector */}
              <div className="absolute left-[33px] top-[26px] bottom-[26px] w-[1.5px] bg-slate-100 border-dashed border-l border-slate-200 pointer-events-none"></div>

              <div className="space-y-5">
                {statsData.activities.map((activity, i) => (
                  <div key={i} className="relative flex gap-4 items-start pl-8 group">
                    <div className="absolute left-[-2px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center z-10 transition-transform group-hover:scale-125">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="flex-1 bg-slate-50/30 hover:bg-slate-50/80 p-3 rounded-lg border border-transparent hover:border-slate-150 transition-all duration-300 shadow-sm/50">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-[13px] font-semibold text-slate-800">{activity.title}</h4>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">oleh <span className="font-semibold text-slate-650">{activity.author}</span></p>
                    </div>
                  </div>
                ))}

                {statsData.activities.length === 0 && (
                  <div className="px-4 py-10 text-center flex flex-col items-center justify-center">
                    <Activity className="w-8 h-8 text-slate-350 mb-2" />
                    <p className="text-[13px] text-slate-500">Belum ada aktivitas terbaru yang tercatat.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Akses Cepat */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#f9fafb] px-4 py-3 border-b border-slate-200">
              <span className="text-[13px] font-semibold text-slate-700 uppercase tracking-wider">Akses Cepat</span>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: 'Data Santri', desc: 'Kelola & tambah', path: '/core/siswa', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50' },
                { label: 'Kelas Formal', desc: 'Rombel & jadwal', path: '/formal/kelas', icon: LayoutDashboard, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50' },
                { label: 'Kalender', desc: 'Kegiatan cabang', path: '/settings/kalender', icon: Calendar, color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/50' },
                { label: 'Pengumuman', desc: 'Informasi resmi', path: '/umum/pengumuman', icon: FileText, color: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100/50' }
              ].map((item, i) => (
                <Link to={item.path} key={i} className="group p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-300 hover:shadow-md/50 flex flex-col justify-between h-32 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${item.color.split(' ')[0]} ${item.color.split(' ')[1]} border ${item.color.split(' ')[2]} transition-colors`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-350 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h4 className="text-[12px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">{item.label}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Full Width Table: Status Ketersediaan Guru Mapel Umum */}
      <div className="mt-8 bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#f9fafb] px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Ketersediaan Guru Mapel Umum</h3>
            <Link to="/formal/penugasan-guru" className="ml-2 text-[11px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-0.5 rounded-md font-semibold border border-blue-100 transition-colors">
              Atur Penugasan
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Lengkap
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Sebagian
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Kosong
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3 w-16 text-center">Status</th>
                <th className="px-5 py-3 w-64">Nama Cabang</th>
                <th className="px-5 py-3 w-48">Wilayah</th>
                <th className="px-5 py-3">Keterangan / Mapel Kosong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statsData.ketersediaanGuru && statsData.ketersediaanGuru.length > 0 ? (
                statsData.ketersediaanGuru.map((cabang, idx) => (
                  <tr key={cabang.cabangId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-center">
                      {cabang.status === 'hijau' ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600" title="Semua 5 mapel umum tersedia">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : cabang.status === 'kuning' ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600" title="Beberapa mapel umum masih kosong">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600" title="Belum ada guru mapel umum sama sekali">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] font-bold text-slate-800">{cabang.cabangName}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                        {cabang.wilayahName}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {cabang.status === 'hijau' ? (
                        <span className="text-[12px] text-emerald-600 font-medium">Lengkap (5 Mapel Tersedia)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {cabang.missingSubjects.map(sub => (
                            <span key={sub} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 capitalize">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-[13px]">
                    Belum ada data cabang.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
