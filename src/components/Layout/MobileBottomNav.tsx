import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Menu, X, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavEntries, NavEntry } from './navConfig';

// 4 ikon cepat di bottom bar + tombol "Menu" yang membuka flyout berisi semua kategori
const QUICK_KEYS = ['santri', 'ustadz', 'absensi'];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navEntries = useNavEntries();
  const [sheetStack, setSheetStack] = useState<string[]>([]);

  const settingsEntry: NavEntry | null = user?.scope === 'GLOBAL' ? {
    type: 'group',
    key: 'settings',
    label: 'Pengaturan',
    icon: Settings,
    items: [
      { to: '/dashboard/settings/users', label: 'Manage account' },
      { to: '/dashboard/settings/sync', label: 'Sinkronisasi' },
      { to: '/dashboard/settings/akademik', label: 'Pengaturan Akademik' },
      { to: '/dashboard/settings/pengumuman', label: 'Kelola Pengumuman' },
      { to: '/dashboard/settings/kalender', label: 'Kelola Kalender' },
      { to: '/dashboard/settings/keaktifan-mapel', label: 'Keaktifan Mapel' },
      { to: '/dashboard/settings/faq', label: 'Kelola FAQ' },
    ],
  } : null;

  const allEntries: NavEntry[] = settingsEntry ? [...navEntries, settingsEntry] : navEntries;

  const konfirmasiEntry = allEntries.find(e => e.type === 'group' && e.key === 'konfirmasi');
  const pendingCount = konfirmasiEntry && konfirmasiEntry.type === 'group'
    ? konfirmasiEntry.items.reduce((sum, i) => sum + (i.badge || 0), 0)
    : 0;

  const quickEntries = QUICK_KEYS
    .map(key => allEntries.find(e => e.key === key))
    .filter((e): e is NavEntry => !!e);

  const closeSheet = () => setSheetStack([]);
  const openGroup = (key: string) => setSheetStack(prev => [...prev, key]);
  const goBack = () => setSheetStack(prev => prev.slice(0, -1));

  const handleNavigate = (to: string) => {
    closeSheet();
    navigate(to);
  };

  const isGroupActive = (entry: NavEntry) =>
    entry.type === 'group' && entry.items.some(i => i.to === location.pathname);

  const currentKey = sheetStack[sheetStack.length - 1];
  const currentEntry = currentKey && currentKey !== 'root'
    ? allEntries.find(e => e.key === currentKey)
    : null;

  return (
    <>
      {/* Flyout: root grid (semua kategori) atau daftar submenu satu kategori */}
      {sheetStack.length > 0 && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <button
            aria-label="Tutup menu"
            onClick={closeSheet}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[70vh] flex flex-col animate-[slideUp_0.2s_ease-out]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {sheetStack.length > 1 && (
                  <button onClick={goBack} className="p-1 -ml-1 text-slate-400 hover:text-slate-700 shrink-0" aria-label="Kembali">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {currentKey === 'root' ? 'Menu Lainnya' : (currentEntry?.label ?? '')}
                </h3>
              </div>
              <button onClick={closeSheet} className="p-1 text-slate-400 hover:text-slate-700 shrink-0" aria-label="Tutup">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-3">
              {currentKey === 'root' ? (
                <div className="grid grid-cols-3 gap-2">
                  {allEntries.map(entry => (
                    <button
                      key={entry.key}
                      onClick={() => entry.type === 'link' ? handleNavigate(entry.to) : openGroup(entry.key)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-colors ${
                        (entry.type === 'link' ? location.pathname === entry.to : isGroupActive(entry))
                          ? 'bg-brand/10 border-brand/30 text-brand'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <entry.icon className="w-5 h-5" strokeWidth={2} />
                      <span className="text-[11px] font-medium text-center leading-tight">{entry.label}</span>
                    </button>
                  ))}
                </div>
              ) : currentEntry?.type === 'group' ? (
                <ul className="space-y-0.5 pb-2">
                  {currentEntry.items.map(item => (
                    <li key={item.to}>
                      {item.disabled ? (
                        <span className="flex items-center justify-between px-3 py-2.5 text-sm text-slate-400 italic">
                          {item.label} (Segera)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleNavigate(item.to)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${
                            location.pathname === item.to
                              ? 'bg-brand/10 text-brand font-semibold'
                              : 'text-slate-700 font-medium hover:bg-slate-50'
                          }`}
                        >
                          <span>{item.label}</span>
                          <div className="flex items-center gap-2">
                            {!!item.badge && item.badge > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-14" style={{ gridTemplateColumns: `repeat(${2 + quickEntries.length}, minmax(0, 1fr))` }}>
          <button
            onClick={() => handleNavigate('/dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 ${location.pathname === '/dashboard' ? 'text-brand' : 'text-slate-500'}`}
          >
            <Home className="w-5 h-5" strokeWidth={location.pathname === '/dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Beranda</span>
          </button>

          {quickEntries.map(entry => {
            const isActive = entry.type === 'link' ? location.pathname === entry.to : isGroupActive(entry);
            return (
              <button
                key={entry.key}
                onClick={() => entry.type === 'link' ? handleNavigate(entry.to) : setSheetStack([entry.key])}
                className={`flex flex-col items-center justify-center gap-0.5 ${isActive || currentKey === entry.key ? 'text-brand' : 'text-slate-500'}`}
              >
                <entry.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{entry.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setSheetStack(['root'])}
            className={`relative flex flex-col items-center justify-center gap-0.5 ${currentKey === 'root' ? 'text-brand' : 'text-slate-500'}`}
          >
            <Menu className="w-5 h-5" strokeWidth={2} />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-[calc(50%-18px)] w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
