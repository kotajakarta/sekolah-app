import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { X, Megaphone, ExternalLink, Calendar, ArrowRight, Link2, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LinkItem {
  title?: string;
  group?: string;
  url: string;
  username?: string;
  password?: string;
}

interface Pengumuman {
  id: string;
  title: string;
  content: string;
  links: LinkItem[];
  isActive: boolean;
  showPopup: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'dismissed_popup_ids';

function getDismissedIds(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function addDismissedId(id: string) {
  const ids = getDismissedIds();
  if (!ids.includes(id)) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
  }
}

export default function PengumumanPopup() {
  const [visibleId, setVisibleId] = useState<string | null>(null);

  const { data: list } = useQuery<Pengumuman[]>({
    queryKey: ['pengumuman'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/pengumuman');
      return res.data;
    },
  });

  useEffect(() => {
    if (!list) return;
    const dismissed = getDismissedIds();
    const toShow = list.find(p => p.isActive && p.showPopup && !dismissed.includes(p.id));
    if (toShow) {
      setVisibleId(toShow.id);
    }
  }, [list]);

  const handleClose = () => {
    if (visibleId) addDismissedId(visibleId);
    setVisibleId(null);
  };

  const popup = list?.find(p => p.id === visibleId);
  if (!popup) return null;

  const pendingCount = list ? list.filter(p => p.isActive && p.showPopup && !getDismissedIds().includes(p.id)).length : 1;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white rounded-3xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.4)] w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-300">
        
        {/* Top Decorative Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shrink-0" />

        {/* Enterprise Header */}
        <div className="px-6 sm:px-8 pt-6 pb-5 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Pengumuman Resmi
              </span>
              {popup.createdAt && (
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(popup.createdAt)}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug break-words">
              {popup.title}
            </h2>
          </div>
          
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center shrink-0 shadow-xs group"
            aria-label="Tutup Pengumuman"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 bg-white">
          <div
            className="prose prose-slate max-w-none text-slate-700 text-[15px] leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-p:my-2.5 prose-ul:my-2.5 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: popup.content }}
          />

          {/* Links Grid (Enterprise Portal Style) */}
          {popup.links && popup.links.length > 0 && (
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                <Link2 className="w-4 h-4 text-indigo-600" />
                Tautan & Akses Portal Pendukung
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {popup.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 relative overflow-hidden"
                  >
                    {link.group && (
                      <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-md">
                        {link.group}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2 font-bold text-slate-800 group-hover:text-indigo-600 text-sm transition-colors">
                      <span className="truncate">{link.title || link.url}</span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1 font-mono">{link.url}</p>

                    {(link.username || link.password) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap gap-2 text-xs font-mono">
                        {link.username && (
                          <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] shadow-2xs">
                            User: <strong className="text-slate-900 font-semibold">{link.username}</strong>
                          </span>
                        )}
                        {link.password && (
                          <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] shadow-2xs">
                            Pass: <strong className="text-slate-900 font-semibold">{link.password}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enterprise Executive Footer */}
        <div className="shrink-0 px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            {pendingCount > 1 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200/60">
                Masih ada {pendingCount - 1} pengumuman lain setelah ini
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Informasi resmi dari Pusat Data & Informasi Sekolah
              </span>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md shadow-slate-900/10 hover:shadow-indigo-600/25 flex items-center justify-center gap-2 group"
          >
            <span>Tutup & Lanjutkan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
