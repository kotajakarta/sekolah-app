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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';

const TABS = [
  { to: '/portal', label: 'Beranda', icon: Home },
  { to: '/portal/rapor', label: 'Rapor', icon: GraduationCap },
  { to: '/portal/kehadiran', label: 'Kehadiran', icon: CalendarCheck },
  { to: '/portal/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { to: '/portal/permohonan-izin', label: 'Izin', icon: FileText },
];

export default function PortalLayout() {
  const { logout } = useAuth();
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
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0 sticky top-0 z-40 shadow-2xs">
        <span className="font-display font-bold text-slate-800 text-sm shrink-0">Portal Wali Santri</span>

        <div className="flex items-center gap-3 ml-auto">
          {links.length > 1 ? (
            <div className="relative" ref={childMenuRef}>
              <button
                onClick={() => setIsChildMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 shadow-sm cursor-pointer"
              >
                <span>{selectedLink?.student.biodata?.fullName ?? 'Pilih Anak'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isChildMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[100] text-left text-xs">
                  {links.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        setSelectedStudentId(link.studentId);
                        setIsChildMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        link.studentId === selectedLink?.studentId
                          ? 'font-bold text-indigo-600 bg-indigo-50/40'
                          : 'text-slate-700 hover:bg-indigo-50/60'
                      }`}
                    >
                      {link.student.biodata?.fullName ?? '-'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : selectedLink ? (
            <span className="text-xs font-semibold text-slate-700">{selectedLink.student.biodata?.fullName ?? '-'}</span>
          ) : null}

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((v) => !v)}
              className="flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <UserCircle className="w-6 h-6" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[100]">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/portal/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Profil Saya
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-14">
          {TABS.map((tab) => {
            const isActive = location.pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex flex-col items-center justify-center gap-0.5 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
