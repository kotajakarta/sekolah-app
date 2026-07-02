import React, { useEffect, useState } from 'react';
import { Users, BookOpen, LayoutDashboard, Award, Loader2 } from 'lucide-react';
import apiClient from '../lib/apiClient';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  totalSantri: number;
  totalKelas: number;
  totalTahfidz: number;
  totalPrestasi: number;
  activities: { title: string; time: string; author: string }[];
}

export default function Dashboard() {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get<DashboardStats>('/dashboard/stats');
        setStatsData(res.data);
      } catch (err: any) {
        setError(t('common.failed'));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 shadow-sm">
        {error || t('common.no_data')}
      </div>
    );
  }

  const stats = [
    { label: t('dashboard.total_santri'), value: statsData.totalSantri.toLocaleString(), icon: Users, color: 'bg-indigo-50 text-indigo-600 ring-indigo-100' },
    { label: t('dashboard.kelas_aktif'), value: statsData.totalKelas.toLocaleString(), icon: LayoutDashboard, color: 'bg-violet-50 text-violet-600 ring-violet-100' },
    { label: t('dashboard.program_tahfidz'), value: statsData.totalTahfidz.toLocaleString(), icon: BookOpen, color: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
    { label: t('dashboard.prestasi'), value: statsData.totalPrestasi.toLocaleString(), icon: Award, color: 'bg-amber-50 text-amber-600 ring-amber-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-500 mt-1.5.5">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/70 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color} ring-1 ring-inset`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1.5.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 p-7 shadow-sm">
        <h3 className="text-lg font-display font-bold text-slate-800 mb-6">{t('dashboard.recent_activities')}</h3>
        <div className="space-y-6">
          {statsData.activities.map((activity, i) => (
            <div key={i} className="flex items-start gap-4 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2.5 h-2.5 mt-1.5.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></div>
              <div>
                <p className="text-sm font-medium text-slate-800">{activity.title}</p>
                <p className="text-xs text-slate-500 mt-1.5">{activity.time} {t('dashboard.by')} <span className="font-medium text-slate-700">{activity.author}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
