import React, { useState, useEffect, useContext, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Users, UserCheck, Building2, Map, BookOpen, GraduationCap, Home, FileText, Database, Search, ChevronRight, ChevronLeft, ChevronDown, Cloud, Settings, Activity, School, User, HeartHandshake, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useNavigate } from 'react-router-dom';

const SidebarContext = createContext({ isCollapsed: false });

const NavLink = ({ to, icon: Icon, badge, children }: { to: string, icon: any, badge?: number, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { isCollapsed } = useContext(SidebarContext);

  if (isCollapsed) {
    return (
      <li title={children?.toString()}>
        <Link
          to={to}
          className={`flex items-center justify-center p-2 mx-auto w-10 h-10 rounded-lg transition-all duration-200 group ${isActive
              ? 'bg-emerald-50 text-emerald-700 font-semibold'
              : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={isActive ? 2.5 : 2} />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center justify-between px-3 py-2 text-[13px] rounded-lg transition-all duration-200 group ${isActive
            ? 'bg-emerald-50 text-emerald-700 font-semibold'
            : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <div className="flex items-center">
          <Icon className={`w-[18px] h-[18px] mr-3 transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={isActive ? 2.5 : 2} />
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
            ? 'bg-slate-100 text-slate-900 font-semibold'
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await apiClient.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      return res.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['permintaan-tarik-pending-count'],
    queryFn: async () => {
      const res = await apiClient.get('/students/permintaan-tarik/pending-count');
      return res.data;
    },
    enabled: user?.scope === 'GLOBAL',
    refetchInterval: 30000,
  });

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

  const showKelembagaan =
    user?.scope === 'CABANG' ||
    user?.divisi === 'FORMAL' ||
    user?.divisi === 'ALL' ||
    user?.scope === 'GLOBAL' ||
    user?.scope === 'WILAYAH';

  const kelembagaanItems = [
    { to: '/profile-cabang', label: 'Profil Cabang', show: user?.scope === 'CABANG' },
    { to: '/formal/muadalah', label: 'Lembaga Muadalah', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
    { to: '/core/cabang', label: t('sidebar.cabang'), show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
    { to: '/core/wilayah', label: t('sidebar.wilayah'), show: user?.scope === 'GLOBAL' },
    { to: '/formal/mapel', label: 'Mata Pelajaran', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
  ].filter(i => i.show);

  const sarprasItems = [
    { to: '/sarpras/ruang', label: 'Ruang & Bangunan', show: true },
    { to: '/sarpras/fasilitas', label: 'Fasilitas Utama', show: true },
  ];

  const santriItems = [
    { to: '/core/siswa', label: 'Data Semua Santri', show: true },
    { to: '/formal/siswa', label: 'Santri Muadalah', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
    { to: '/absensi/siswa', label: 'Absensi Siswa', show: true },
    { to: '/core/pool', label: 'Pool Santri', show: user?.scope === 'GLOBAL' },
  ].filter(i => i.show);

  const ustadzItems = [
    { to: '/core/guru', label: 'Data Guru', show: true },
    { to: '/formal/penugasan-guru', label: 'Penugasan Guru', show: user?.divisi === 'FORMAL' || user?.divisi === 'ALL' },
    { to: '/core/pool-guru', label: 'Pool Guru', show: user?.scope === 'GLOBAL' },
  ].filter(i => i.show);

  const showRombonganBelajar = user?.divisi === 'FORMAL' || user?.divisi === 'ALL';

  const layananItems = [
    { to: '/umum/pengumuman', label: 'Pengumuman', show: true },
    { to: '/umum/kalender', label: 'Kalender Pendidikan', show: true },
  ].filter(i => i.show);

  const monitoringItems = [
    { to: '/dashboard/ketersediaan-guru', label: 'Ketersediaan Guru Mapel', show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
    { to: '/absensi/programs', label: 'Kelola Program Absensi', show: user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH' },
    { to: '/core/riwayat-perubahan', label: 'Riwayat Perubahan Data', show: true },
  ].filter(i => i.show);

  const konfirmasiItems = [
    { to: '/core/permintaan-tarik', label: 'Status Mutasi & Tarik Data', badge: pendingCount, show: true },
  ].filter(i => i.show);

  const laporanItems = [
    { to: '/laporan/absensi', label: 'Rekapitulasi Absensi', show: true },
    { to: '/laporan/evaluasi', label: 'Laporan Evaluasi', show: true, disabled: true },
  ];

  const location = useLocation();

  useEffect(() => {
    const preOpen: Record<string, boolean> = {};
    if (kelembagaanItems.some(i => i.to === location.pathname)) preOpen.kelembagaan = true;
    if (sarprasItems.some(i => i.to === location.pathname)) preOpen.sarpras = true;
    if (santriItems.some(i => i.to === location.pathname)) preOpen.santri = true;
    if (ustadzItems.some(i => i.to === location.pathname)) preOpen.ustadz = true;
    if (layananItems.some(i => i.to === location.pathname)) preOpen.layanan = true;
    if (monitoringItems.some(i => i.to === location.pathname)) preOpen.monitoring = true;
    if (konfirmasiItems.some(i => i.to === location.pathname)) preOpen.konfirmasi = true;
    if (laporanItems.some(i => i.to === location.pathname)) preOpen.laporan = true;

    setOpenGroups(prev => ({ ...prev, ...preOpen }));
  }, [location.pathname]);

  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      <div className={`h-screen bg-white flex flex-col relative z-20 border-r border-slate-200 transition-all duration-300 ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}`}>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 text-emerald-600 z-50 transition-transform duration-205"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={3} />
          )}
        </button>

        {isCollapsed ? (
          <div className="h-14 flex items-center justify-center shrink-0 mb-4 mt-2">
            <img src="https://cdn.aithendi.my.id/assets/logoyts-modern2.png" alt="YTS Logo" className="h-8 w-auto object-contain shrink-0" />
          </div>
        ) : (
          <div className="h-14 px-5 flex items-center justify-between shrink-0 mb-4 mt-2 gap-2">
            <svg viewBox="0 0 155 45" className="h-9 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 12 10 H 30" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 12 10 V 35" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 12 35 H 30" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 12 22.5 H 24" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 18 31 V 26 H 27" stroke="#f5a623" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 52 13 C 52 9, 38 9, 38 15 C 38 21, 52 23, 52 29 C 52 35, 38 35, 38 31" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 60 10 V 35" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 82 13 C 82 9, 68 9, 68 15 C 68 21, 82 23, 82 29 C 82 35, 68 35, 68 31" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 90 10 L 96 35 L 102 18 L 108 35 L 114 10" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 122 35 L 132 10 L 142 35" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 126 25 H 138" stroke="#106ebe" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <img src="https://cdn.aithendi.my.id/assets/logoyts-modern2.png" alt="YTS Logo" className="h-8 w-auto object-contain shrink-0" />
          </div>
        )}

        {isCollapsed ? (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              title="Cari data..."
            >
              <Search className="w-[18px] h-[18px] text-slate-400" />
            </button>
          </div>
        ) : (
          <div className="px-3 mb-4">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-8 pr-8 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <span className="absolute right-2.5 text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1">Ctrl K</span>

              {isSearchFocused && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-3 text-center text-sm text-slate-500">Mencari...</div>
                  ) : searchResults.length > 0 ? (
                    <ul className="py-1">
                      {searchResults.map((res: any) => (
                        <li key={`${res.type}-${res.id}`}>
                          <button
                            onClick={() => navigate(res.link)}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex flex-col"
                          >
                            <span className="text-sm font-medium text-slate-800">{res.name}</span>
                            <span className="text-xs text-slate-500">{res.type} • {res.subtitle}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-center text-sm text-slate-500">Tidak ada hasil</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-hidden hover:overflow-y-auto px-3 py-2 custom-scrollbar">
          <ul className="space-y-1">
            <NavLink to="/dashboard" icon={Home}>Dashboard</NavLink>

            {showKelembagaan && (
              <>
                <GroupHeader
                  label="Kelembagaan"
                  icon={School}
                  isOpen={!!openGroups.kelembagaan}
                  onClick={() => handleGroupClick('kelembagaan')}
                />
                {!isCollapsed && openGroups.kelembagaan && (
                  <ul className="mt-1 space-y-1">
                    {kelembagaanItems.map(item => (
                      <SubNavLink key={item.to} to={item.to}>{item.label}</SubNavLink>
                    ))}
                  </ul>
                )}
              </>
            )}

            <>
              <GroupHeader
                label="Sarana Prasarana"
                icon={Building2}
                isOpen={!!openGroups.sarpras}
                onClick={() => handleGroupClick('sarpras')}
              />
              {!isCollapsed && openGroups.sarpras && (
                <ul className="mt-1 space-y-1">
                  {sarprasItems.map(item => (
                    <SubNavLink key={item.to} to={item.to}>{item.label}</SubNavLink>
                  ))}
                </ul>
              )}
            </>

            <>
              <GroupHeader
                label="Santri"
                icon={User}
                isOpen={!!openGroups.santri}
                onClick={() => handleGroupClick('santri')}
              />
              {!isCollapsed && openGroups.santri && (
                <ul className="mt-1 space-y-1">
                  {santriItems.map(item => (
                    <SubNavLink key={item.to} to={item.to}>{item.label}</SubNavLink>
                  ))}
                </ul>
              )}
            </>

            <>
              <GroupHeader
                label="Ustadz"
                icon={Users}
                isOpen={!!openGroups.ustadz}
                onClick={() => handleGroupClick('ustadz')}
              />
              {!isCollapsed && openGroups.ustadz && (
                <ul className="mt-1 space-y-1">
                  {ustadzItems.map(item => (
                    <SubNavLink key={item.to} to={item.to}>{item.label}</SubNavLink>
                  ))}
                </ul>
              )}
            </>

            {showRombonganBelajar && (
              <NavLink to="/formal/kelas" icon={UserCheck}>Rombongan Belajar</NavLink>
            )}

            <>
              <GroupHeader
                label="Layanan dan Bantuan"
                icon={HeartHandshake}
                isOpen={!!openGroups.layanan}
                onClick={() => handleGroupClick('layanan')}
              />
              {!isCollapsed && openGroups.layanan && (
                <ul className="mt-1 space-y-1">
                  {layananItems.map(item => (
                    <SubNavLink key={item.to} to={item.to}>{item.label}</SubNavLink>
                  ))}
                </ul>
              )}
            </>

            <>
              <GroupHeader
                label="Monitoring"
                icon={Activity}
                isOpen={!!openGroups.monitoring}
                onClick={() => handleGroupClick('monitoring')}
              />
              {!isCollapsed && openGroups.monitoring && (
                <ul className="mt-1 space-y-1">
                  {monitoringItems.map(item => (
                    <SubNavLink key={item.to} to={item.to}>{item.label}</SubNavLink>
                  ))}
                </ul>
              )}
            </>

            <>
              <GroupHeader
                label="Konfirmasi"
                icon={CheckCircle}
                isOpen={!!openGroups.konfirmasi}
                onClick={() => handleGroupClick('konfirmasi')}
              />
              {!isCollapsed && openGroups.konfirmasi && (
                <ul className="mt-1 space-y-1">
                  {konfirmasiItems.map(item => (
                    <SubNavLink key={item.to} to={item.to} badge={item.badge}>{item.label}</SubNavLink>
                  ))}
                </ul>
              )}
            </>

            <>
              <GroupHeader
                label="Laporan"
                icon={FileText}
                isOpen={!!openGroups.laporan}
                onClick={() => handleGroupClick('laporan')}
              />
              {!isCollapsed && openGroups.laporan && (
                <ul className="mt-1 space-y-1">
                  {laporanItems.map(item => (
                    <SubNavLink key={item.to} to={item.to} disabled={item.disabled}>{item.label}</SubNavLink>
                  ))}
                </ul>
              )}
            </>
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
                      <NavLink to="/settings/users" icon={Users}>Manage account</NavLink>
                      <NavLink to="/settings/sync" icon={Database}>Sinkronisasi</NavLink>
                      <NavLink to="/settings/akademik" icon={Database}>Pengaturan Akademik</NavLink>
                      <NavLink to="/settings/pengumuman" icon={FileText}>Kelola Pengumuman</NavLink>
                      <NavLink to="/settings/kalender" icon={FileText}>Kelola Kalender</NavLink>
                      <NavLink to="/settings/keaktifan-mapel" icon={Database}>Keaktifan Mapel</NavLink>
                      <NavLink to="/settings/faq" icon={FileText}>Kelola FAQ</NavLink>
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
