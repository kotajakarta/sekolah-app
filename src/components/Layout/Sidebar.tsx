import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Users, UserCheck, Building2, Map, BookOpen, GraduationCap, Home, FileText, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NavLink = ({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <li>
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-xl transition-all ${
          isActive 
            ? 'bg-indigo-50/80 text-indigo-700 shadow-sm ring-1 ring-indigo-100' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
        {children}
      </Link>
    </li>
  );
};

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="w-64 h-screen bg-white flex flex-col relative z-20 border-r border-slate-100 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)]">
      <div className="h-16 px-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Database className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-display font-bold tracking-tight text-slate-800">
          {t('app_name')}
        </span>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        <div>
          <ul className="space-y-1">
            <NavLink to="/" icon={LayoutDashboard}>{t('sidebar.dashboard')}</NavLink>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3 px-3">{t('sidebar.master_data')}</h3>
          <ul className="space-y-1">
            <NavLink to="/core/siswa" icon={Users}>{t('sidebar.students')}</NavLink>
            {user?.scope === 'GLOBAL' && (
              <NavLink to="/core/pool" icon={Database}>{t('sidebar.pool')}</NavLink>
            )}
            <NavLink to="/core/guru" icon={UserCheck}>{t('sidebar.staff')}</NavLink>
            {user?.scope === 'GLOBAL' && (
              <NavLink to="/core/pool-guru" icon={Database}>{t('sidebar.pool_guru')}</NavLink>
            )}
            
            {(user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
              <NavLink to="/core/cabang" icon={Building2}>{t('sidebar.cabang')}</NavLink>
            )}
            
            {user?.scope === 'GLOBAL' && (
              <NavLink to="/core/wilayah" icon={Map}>{t('sidebar.wilayah')}</NavLink>
            )}
          </ul>
        </div>

        {(user?.divisi === 'FORMAL' || user?.divisi === 'ALL') && (
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3 px-3">{t('sidebar.formal')}</h3>
            <ul className="space-y-1">
              <NavLink to="/formal/siswa" icon={Users}>{t('sidebar.siswa_formal')}</NavLink>
              <NavLink to="/formal/kelas" icon={BookOpen}>{t('sidebar.kelas_formal')}</NavLink>
              <NavLink to="/formal/rapor" icon={FileText}>{t('sidebar.rapor')}</NavLink>
            </ul>
          </div>
        )}

        {user?.scope === 'GLOBAL' && (
          <div>
            <h3 className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-3 px-3">{t('sidebar.settings')}</h3>
            <ul className="space-y-1">
              <NavLink to="/settings/users" icon={Users}>{t('sidebar.users')}</NavLink>
              <NavLink to="/settings/sync" icon={Database}>Sinkronisasi</NavLink>
            </ul>
          </div>
        )}
      </nav>
    </div>
  );
};

