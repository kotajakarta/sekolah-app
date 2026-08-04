import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  GraduationCap,
  CalendarCheck,
  Megaphone,
  FileText,
  UserCircle,
  ChevronDown,
  LogOut,
  User,
  Sparkles,
  Video,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';

const TABS = [
  { to: '/portal', label: 'Beranda', icon: Home },
  { to: '/portal/rapor', label: 'Rapor', icon: GraduationCap },
  { to: '/portal/kehadiran', label: 'Kehadiran', icon: CalendarCheck },
  { to: '/portal/cctv', label: 'CCTV Live', icon: Video },
  { to: '/portal/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { to: '/portal/permohonan-izin', label: 'Permohonan Izin', icon: FileText },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { links, selectedLink, setSelectedStudentId } = usePortalStudent();
  const location = useLocation();
  const navigate = useNavigate();

  const [isChildMenuOpen, setIsChildMenuOpen] = useState(false);
  const childMenuRef = useRef<HTMLDivElement>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (childMenuRef.current && !childMenuRef.current.contains(event.target as Node)) {
        setIsChildMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-slate-50/80 min-h-screen flex flex-col font-sans antialiased text-slate-800">
      {/* ── TOP HEADER (Desktop & Mobile) ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link to="/portal" className="flex items-center gap-2.5 focus:outline-none">
              <div className="w-9 h-9 bg-gradient-to-tr from-[#0A192F] to-indigo-900 rounded-xl flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">eSantri</span>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Portal Walisantri</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-xl border border-slate-200/60">
            {TABS.map((tab) => {
              const isActive = location.pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Student Switcher + User Profile */}
          <div className="flex items-center gap-3">
            {/* Student Switcher */}
            {links.length > 1 ? (
              <div className="relative" ref={childMenuRef}>
                <button
                  onClick={() => setIsChildMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/70 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="max-w-[120px] sm:max-w-[160px] truncate">
                    {selectedLink?.student.biodata?.fullName ?? 'Pilih Anak'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                </button>

                {isChildMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-[100] text-left text-xs">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                      Pilih Anak Santri
                    </div>
                    {links.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => {
                          setSelectedStudentId(link.studentId);
                          setIsChildMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          link.studentId === selectedLink?.studentId
                            ? 'font-bold text-indigo-700 bg-indigo-50/60'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{link.student.biodata?.fullName ?? '-'}</span>
                        {link.student.siswaFormal?.kelas?.name && (
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                            {link.student.siswaFormal.kelas.name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedLink ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="truncate max-w-[150px]">{selectedLink.student.biodata?.fullName ?? '-'}</span>
              </div>
            ) : null}

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  {user?.operatorName ? user.operatorName.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5" />}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-[100] text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800 truncate">{user?.operatorName || user?.username}</p>
                    <p className="text-[11px] text-slate-500 capitalize">Walisantri</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/portal/profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profil Saya
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Keluar Sesi
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION (hidden on md+) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="grid grid-cols-5 h-15">
          {TABS.map((tab) => {
            const isActive = location.pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50' : ''}`}>
                  <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] leading-none">{tab.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
