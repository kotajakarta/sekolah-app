import React, { useState, useEffect, useContext, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  FileText,
  Database,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  Sliders,
  GraduationCap,
} from 'lucide-react';
import { useNavEntries, NavEntry, NavSubItem } from './navConfig';

const SidebarContext = createContext<{ isCollapsed: boolean }>({ isCollapsed: false });

const NavLink = ({
  to,
  icon: Icon,
  badge,
  highlight,
  children,
}: {
  to: string;
  icon: any;
  badge?: number;
  highlight?: boolean;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { isCollapsed } = useContext(SidebarContext);

  if (isCollapsed) {
    return (
      <li className="relative group/tooltip flex justify-center py-0.5">
        <Link
          to={to}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group ${
            isActive
              ? 'bg-brand/10 text-brand shadow-xs font-semibold'
              : highlight
              ? 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Icon
            className={`w-[18px] h-[18px] transition-colors ${
              isActive ? 'text-brand' : highlight ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'
            }`}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </Link>
        {/* Floating Tooltip */}
        <div className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover/tooltip:flex items-center z-50">
          <div className="bg-slate-900/95 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2 border border-slate-700/60 backdrop-blur-xs">
            <span>{children}</span>
            {badge !== undefined && badge > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-brand/10 text-brand font-bold shadow-2xs'
            : highlight
            ? 'bg-indigo-50/60 text-slate-800 font-semibold border border-indigo-100/90 hover:bg-indigo-100/70 hover:text-indigo-900'
            : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center min-w-0">
          <Icon
            className={`w-[18px] h-[18px] mr-3 shrink-0 transition-colors ${
              isActive ? 'text-brand' : highlight ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
            }`}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className="truncate">{children}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {highlight && !isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          )}
          {badge !== undefined && badge > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
};

const SubNavLink = ({
  to,
  badge,
  disabled,
  children,
}: {
  to: string;
  badge?: number;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  if (disabled) {
    return (
      <li>
        <span className="flex items-center px-2.5 py-1.5 text-[12px] text-slate-400 font-medium cursor-not-allowed italic">
          {children} (Segera)
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-lg transition-all duration-150 group relative ${
          isActive
            ? 'bg-brand/10 text-brand font-bold'
            : 'text-slate-600 font-medium hover:bg-slate-100/80 hover:text-slate-900'
        }`}
      >
        {/* Active Pip Dot along the guide line */}
        {isActive && (
          <span className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand ring-2 ring-white" />
        )}
        <span className="truncate">{children}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  );
};

const GroupHeader = ({
  label,
  icon: Icon,
  isOpen,
  onClick,
  items,
}: {
  label: string;
  icon: any;
  isOpen: boolean;
  onClick: () => void;
  items: NavSubItem[];
}) => {
  const { isCollapsed } = useContext(SidebarContext);
  const location = useLocation();
  const isChildActive = items.some((i) => i.to === location.pathname);

  if (isCollapsed) {
    return (
      <li className="relative group/flyout flex justify-center py-0.5">
        <button
          onClick={onClick}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
            isChildActive
              ? 'bg-brand/10 text-brand font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Icon
            className={`w-[18px] h-[18px] transition-colors ${
              isChildActive ? 'text-brand' : 'text-slate-500 group-hover/flyout:text-slate-700'
            }`}
            strokeWidth={isChildActive ? 2.5 : 2}
          />
        </button>

        {/* Floating Flyout Submenu on Hover in Collapsed Mode */}
        <div className="invisible opacity-0 group-hover/flyout:visible group-hover/flyout:opacity-100 transition-all duration-150 absolute left-full top-0 ml-2.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 pointer-events-auto">
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center gap-2">
            <Icon className="w-4 h-4 text-brand shrink-0" />
            <span className="text-xs font-bold text-slate-800 truncate">{label}</span>
          </div>
          <ul className="space-y-0.5 px-1.5 max-h-64 overflow-y-auto custom-scrollbar">
            {items.map((item) => {
              const active = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      active
                        ? 'bg-brand/10 text-brand font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-xl transition-all duration-200 font-medium group cursor-pointer ${
          isChildActive
            ? 'text-slate-900 font-semibold bg-slate-50/80'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center min-w-0">
          <Icon
            className={`w-[18px] h-[18px] mr-3 shrink-0 transition-colors ${
              isChildActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'
            }`}
            strokeWidth={isChildActive ? 2.5 : 2}
          />
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isChildActive && !isOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          )}
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" />
          )}
        </div>
      </button>
    </li>
  );
};

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
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
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleGroupClick = (group: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenGroups((prev) => ({
        ...prev,
        [group]: true,
      }));
    } else {
      toggleGroup(group);
    }
  };

  // Otomatis buka accordion jika halaman anak sedang aktif
  useEffect(() => {
    const preOpen: Record<string, boolean> = {};
    navEntries.forEach((entry) => {
      if (entry.type === 'group' && entry.items.some((i) => i.to === location.pathname)) {
        preOpen[entry.key] = true;
      }
    });
    setOpenGroups((prev) => ({ ...prev, ...preOpen }));
  }, [location.pathname, navEntries]);

  // Settings links array for reuse in expanded and collapsed flyout
  const settingsLinks = [
    { to: '/dashboard/settings/users', icon: Users, label: 'Manage account' },
    { to: '/dashboard/settings/sync', icon: Database, label: 'Sinkronisasi' },
    { to: '/dashboard/formal/emis-sync', icon: Database, label: 'Validasi EMIS & Verval' },
    { to: '/dashboard/settings/modul', icon: Sliders, label: 'Pengaturan Modul' },
    { to: '/dashboard/settings/akademik', icon: GraduationCap, label: 'Pengaturan Akademik' },
    { to: '/dashboard/settings/pengumuman', icon: FileText, label: 'Kelola Pengumuman' },
    { to: '/dashboard/settings/kalender', icon: FileText, label: 'Kelola Kalender' },
    { to: '/dashboard/settings/keaktifan-mapel', icon: Database, label: 'Keaktifan Mapel' },
    { to: '/dashboard/settings/faq', icon: FileText, label: 'Kelola FAQ' },
    { to: '/dashboard/settings/ppdb', icon: GraduationCap, label: 'Kelola PPDB' },
  ];

  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      <aside
        className={`h-screen bg-white hidden lg:flex flex-col relative z-20 border-r border-slate-200 transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-[264px]'
        }`}
      >
        {/* Collapse / Expand Floating Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Perlebar Sidebar' : 'Ciutkan Sidebar'}
          className="absolute top-5 -right-3 w-6 h-6 bg-white border border-slate-200/90 rounded-full shadow-xs flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-brand z-30 transition-all hover:scale-105 active:scale-95"
          title={isCollapsed ? 'Perlebar Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
        </button>

        {/* Header / Brand Identity */}
        {isCollapsed ? (
          <div className="h-16 flex items-center justify-center shrink-0 border-b border-slate-100">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center shadow-sm border border-slate-700/30"
              title="eSantri Pusdatin"
            >
              <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
          </div>
        ) : (
          <div className="h-16 px-4 flex items-center justify-between shrink-0 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center shrink-0 shadow-sm border border-slate-700/30">
                <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  eSantri
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-brand/10 text-brand uppercase tracking-wider">
                    PRO
                  </span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 truncate">
                  Pusdatin Pesantren
                </span>
              </div>
            </div>
            <div className="flex items-center pl-2 border-l border-slate-100 shrink-0">
              <img
                src="https://cdn.aithendi.my.id/assets/logoyts-modern.png"
                alt="YTS Logo"
                className="h-7 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-hidden hover:overflow-y-auto px-3 py-3 custom-scrollbar">
          <ul className="space-y-1">
            {navEntries.map((entry, index) => {
              const prevEntry = index > 0 ? navEntries[index - 1] : null;
              const showSectionHeader =
                entry.section && (!prevEntry || prevEntry.section !== entry.section);

              return (
                <React.Fragment key={entry.key}>
                  {/* Category Section Header Divider */}
                  {showSectionHeader && (
                    isCollapsed ? (
                      <li className="my-2.5 mx-3 border-t border-slate-200/80 first:hidden" />
                    ) : (
                      <li className="pt-3.5 pb-1 px-3 first:pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                            {entry.section}
                          </span>
                        </div>
                      </li>
                    )
                  )}

                  {/* Nav Item */}
                  {entry.type === 'link' ? (
                    <NavLink
                      to={entry.to}
                      icon={entry.icon}
                      highlight={entry.highlight}
                    >
                      {entry.label}
                    </NavLink>
                  ) : (
                    <>
                      <GroupHeader
                        label={entry.label}
                        icon={entry.icon}
                        isOpen={!!openGroups[entry.key]}
                        onClick={() => handleGroupClick(entry.key)}
                        items={entry.items}
                      />
                      {/* Sub-menu with Tree Guide Line in Expanded Mode */}
                      {!isCollapsed && openGroups[entry.key] && (
                        <div className="relative mt-1 mb-1 ml-5 pl-2.5 border-l border-slate-200/90 space-y-0.5 animate-fadeIn">
                          {entry.items.map((item) => (
                            <SubNavLink
                              key={item.to}
                              to={item.to}
                              badge={item.badge}
                              disabled={item.disabled}
                            >
                              {item.label}
                            </SubNavLink>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Settings Section (for GLOBAL scope) */}
        {user?.scope === 'GLOBAL' && (
          <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/60 p-2.5">
            {isCollapsed ? (
              <div className="relative group/settings flex justify-center py-0.5">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 cursor-pointer"
                >
                  <Settings className="w-[18px] h-[18px] text-slate-500" strokeWidth={2} />
                </button>
                {/* Floating Settings Menu on Hover in Collapsed Mode */}
                <div className="invisible opacity-0 group-hover/settings:visible group-hover/settings:opacity-100 transition-all duration-150 absolute left-full bottom-0 ml-2.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 pointer-events-auto">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-brand shrink-0" />
                    <span className="text-xs font-bold text-slate-800">Pengaturan Sistem</span>
                  </div>
                  <ul className="space-y-0.5 px-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {settingsLinks.map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                            location.pathname === item.to
                              ? 'bg-brand/10 text-brand font-bold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-xl transition-all duration-200 text-slate-600 font-semibold hover:bg-slate-200/60 hover:text-slate-900 group cursor-pointer"
                >
                  <div className="flex items-center min-w-0">
                    <Settings
                      className="w-[18px] h-[18px] mr-3 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0"
                      strokeWidth={2}
                    />
                    <span className="truncate">Pengaturan Sistem</span>
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {isSettingsOpen && (
                  <div className="mt-1 ml-5 pl-2.5 border-l border-slate-200/90 max-h-56 overflow-y-auto custom-scrollbar space-y-0.5 py-1 animate-fadeIn">
                    <ul className="space-y-0.5">
                      {settingsLinks.map((item) => (
                        <NavLink key={item.to} to={item.to} icon={item.icon}>
                          {item.label}
                        </NavLink>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </SidebarContext.Provider>
  );
};
