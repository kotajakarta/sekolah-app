import React, { useState, useEffect, useContext, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, FileText, Database, ChevronRight, ChevronLeft, ChevronDown, Settings, Sliders, GraduationCap } from 'lucide-react';
import { useNavEntries } from './navConfig';

const SidebarContext = createContext({ isCollapsed: false });

const NavLink = ({ to, icon: Icon, badge, highlight, children }: { to: string, icon: any, badge?: number, highlight?: boolean, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { isCollapsed } = useContext(SidebarContext);

  if (isCollapsed) {
    return (
      <li title={children?.toString()}>
        <Link
          to={to}
          className={`flex items-center justify-center p-2 mx-auto w-10 h-10 rounded-lg transition-all duration-200 group ${isActive
            ? 'bg-brand/10 text-brand font-semibold'
            : highlight
            ? 'bg-indigo-50/70 text-indigo-700 font-semibold hover:bg-indigo-100/80'
            : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-brand' : highlight ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={isActive ? 2.5 : 2} />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-lg transition-all duration-200 group ${isActive
          ? 'bg-brand/10 text-brand font-semibold'
          : highlight
          ? 'bg-indigo-50/50 text-slate-800 font-semibold border border-indigo-100/80 hover:bg-indigo-100/60'
          : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <div className="flex items-center">
          <Icon className={`w-[18px] h-[18px] mr-3 transition-colors ${isActive ? 'text-brand' : highlight ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={isActive ? 2.5 : 2} />
          {children}
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  );
};

const SubNavLink = ({ to, badge, disabled, children }: { to: string, badge?: number, disabled?: boolean, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  if (disabled) {
    return (
      <li>
        <span className="flex items-center pl-[42px] pr-3 py-1.5 text-[12px] text-slate-400 font-medium cursor-not-allowed italic">
          {children} (Segera)
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center justify-between pl-[42px] pr-3 py-1.5 text-[12px] rounded-lg transition-all duration-200 group ${isActive
          ? 'bg-brand/10 text-brand font-semibold'
          : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
          }`}
      >
        <span>{children}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  );
};

const GroupHeader = ({ label, icon: Icon, isOpen, onClick }: { label: string, icon: any, isOpen: boolean, onClick: () => void }) => {
  const { isCollapsed } = useContext(SidebarContext);

  if (isCollapsed) {
    return (
      <li title={label}>
        <button
          onClick={onClick}
          className="w-10 h-10 mx-auto flex items-center justify-center p-2 rounded-lg transition-all duration-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 group cursor-pointer"
        >
          <Icon className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={2} />
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg transition-all duration-200 text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900 group cursor-pointer"
      >
        <div className="flex items-center">
          <Icon className="w-[18px] h-[18px] mr-3 text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={2} />
          <span>{label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
    </li>
  );
};

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const navEntries = useNavEntries();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleGroupClick = (group: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenGroups(prev => ({
        ...prev,
        [group]: true
      }));
    } else {
      toggleGroup(group);
    }
  };

  const location = useLocation();

  useEffect(() => {
    const preOpen: Record<string, boolean> = {};
    navEntries.forEach(entry => {
      if (entry.type === 'group' && entry.items.some(i => i.to === location.pathname)) {
        preOpen[entry.key] = true;
      }
    });
    setOpenGroups(prev => ({ ...prev, ...preOpen }));
  }, [location.pathname, navEntries]);

  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      <div className={`h-screen bg-white hidden lg:flex flex-col relative z-20 border-r border-slate-200 transition-all duration-300 ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}`}>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-brand/10 text-brand z-50 transition-transform duration-205"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
          )}
        </button>

        {isCollapsed ? (
          <div className="h-14 flex items-center justify-center shrink-0 mb-4 mt-2">
            <img src="https://cdn.aithendi.my.id/assets/logoyts-modern.png" alt="YTS Logo" className="h-8 w-auto object-contain shrink-0" />
          </div>
        ) : (
          <div className="h-14 px-5 flex items-center justify-between shrink-0 mb-4 mt-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#0A192F] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="9,22 9,12 15,12 15,22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-[#0A192F]">eSantri</span>
            </div>
            <img src="https://cdn.aithendi.my.id/assets/logoyts-modern.png" alt="YTS Logo" className="h-8 w-auto object-contain shrink-0" />
          </div>
        )}

        <nav className="flex-1 overflow-hidden hover:overflow-y-auto px-3 py-2 custom-scrollbar mt-1">
          <ul className="space-y-1">
            {navEntries.map(entry => (
              entry.type === 'link' ? (
                <NavLink key={entry.key} to={entry.to} icon={entry.icon} highlight={entry.highlight}>{entry.label}</NavLink>
              ) : (
                <React.Fragment key={entry.key}>
                  <GroupHeader
                    label={entry.label}
                    icon={entry.icon}
                    isOpen={!!openGroups[entry.key]}
                    onClick={() => handleGroupClick(entry.key)}
                  />
                  {!isCollapsed && openGroups[entry.key] && (
                    <ul className="mt-1 space-y-1">
                      {entry.items.map(item => (
                        <SubNavLink key={item.to} to={item.to} badge={item.badge} disabled={item.disabled}>{item.label}</SubNavLink>
                      ))}
                    </ul>
                  )}
                </React.Fragment>
              )
            ))}
          </ul>
        </nav>

        {user?.scope === 'GLOBAL' && (
          <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/50 p-3">
            {isCollapsed ? (
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 mx-auto flex items-center justify-center p-2 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 cursor-pointer"
                title="Pengaturan"
              >
                <Settings className="w-[18px] h-[18px] text-slate-400" strokeWidth={2} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg transition-all duration-200 text-slate-600 font-medium hover:bg-slate-200/50 hover:text-slate-900 group"
                >
                  <div className="flex items-center">
                    <Settings className="w-[18px] h-[18px] mr-3 text-slate-400 group-hover:text-slate-600 transition-colors" strokeWidth={2} />
                    <span>Pengaturan</span>
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isSettingsOpen && (
                  <div className="mt-1 pl-4 border-l border-slate-200 ml-5">
                    <ul className="space-y-1">
                      <NavLink to="/dashboard/settings/users" icon={Users}>Manage account</NavLink>
                      <NavLink to="/dashboard/settings/sync" icon={Database}>Sinkronisasi</NavLink>
                      <NavLink to="/dashboard/settings/modul" icon={Sliders}>Pengaturan Modul</NavLink>
                      <NavLink to="/dashboard/settings/akademik" icon={GraduationCap}>Pengaturan Akademik</NavLink>
                      <NavLink to="/dashboard/settings/pengumuman" icon={FileText}>Kelola Pengumuman</NavLink>
                      <NavLink to="/dashboard/settings/kalender" icon={FileText}>Kelola Kalender</NavLink>
                      <NavLink to="/dashboard/settings/keaktifan-mapel" icon={Database}>Keaktifan Mapel</NavLink>
                      <NavLink to="/dashboard/settings/faq" icon={FileText}>Kelola FAQ</NavLink>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </SidebarContext.Provider>
  );
};
