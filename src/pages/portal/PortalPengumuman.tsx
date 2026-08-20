import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetPengumuman, PengumumanItem } from '../../features/portal/hooks/useGetPengumuman';
import {
  Megaphone,
  Loader2,
  Calendar,
  Bell,
  ExternalLink,
  Link2,
  Building,
  Landmark,
  Layers,
  Sparkles
} from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PortalPengumuman() {
  const { selectedStudentId, isLoading: isStudentLoading, isError: isStudentError } = usePortalStudent();
  const { data: list = [], isLoading } = useGetPengumuman(selectedStudentId);
  const [filterType, setFilterType] = useState<'ALL' | 'GLOBAL' | 'CABANG'>('ALL');

  if (isStudentLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Memuat pengumuman...
      </div>
    );
  }

  if (isStudentError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-rose-600 text-center font-medium">
        Gagal memuat pengumuman. Silakan muat ulang.
      </div>
    );
  }

  if (!selectedStudentId) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun ini.
      </div>
    );
  }

  const filteredList = list.filter((item) => {
    if (filterType === 'GLOBAL') return item.scope === 'GLOBAL';
    if (filterType === 'CABANG') return item.scope === 'CABANG';
    return true;
  });

  const countGlobal = list.filter((i) => i.scope === 'GLOBAL').length;
  const countCabang = list.filter((i) => i.scope === 'CABANG').length;

  return (
    <div className="space-y-6">
      {/* ── HEADER PENGUMUMAN ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Informasi & Pengumuman Khusus Wali Santri
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Informasi resmi terverifikasi dari Pengurus Pusat Pesantren dan Manajemen Cabang Santri.
            </p>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Pengumuman ({list.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('GLOBAL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'GLOBAL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Dari Pusat ({countGlobal})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('CABANG')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'CABANG'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Khusus Dari Cabang ({countCabang})
          </button>
        </div>
      </div>

      {/* ── DAFTAR PENGUMUMAN ── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Memuat daftar pengumuman...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center text-sm text-slate-400">
          Belum ada informasi atau pengumuman pada kategori ini.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => {
            const isPusat = item.scope === 'GLOBAL';
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs border ${
                      isPusat
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    }`}
                  >
                    <Megaphone className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Scope Badge */}
                        {isPusat ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2.5 py-0.5 rounded-md">
                            <Building className="w-3 h-3" /> Pengumuman Pusat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-0.5 rounded-md">
                            <Landmark className="w-3 h-3" /> Cabang {item.cabang?.name || 'Pesantren'}
                          </span>
                        )}
                        <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                          {item.title}
                        </h2>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {/* HTML Content Rendering */}
                    <div
                      className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-100 prose prose-slate max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-a:text-emerald-600 prose-a:font-semibold hover:prose-a:underline"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                    />

                    {/* Links attached to announcement */}
                    {item.links && item.links.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                          Tautan Terkait
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 hover:text-emerald-600"
                            >
                              <span className="truncate">{link.title || link.url}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
