import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { X, Megaphone, ExternalLink } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white fill-white transform -rotate-12" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-indigo-200 font-semibold">Pengumuman</p>
            <h2 className="text-[15px] font-bold text-white leading-tight truncate">{popup.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div
            className="prose prose-slate max-w-none text-sm prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5"
            dangerouslySetInnerHTML={{ __html: popup.content }}
          />
          {popup.links && popup.links.length > 0 && (
            <div className="mt-4 border-t pt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tautan Terkait</p>
              {popup.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-indigo-700 text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{link.title || link.url}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 bg-slate-50 border-t flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Oke, Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
