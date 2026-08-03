import React from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetPengumuman } from '../../features/portal/hooks/useGetPengumuman';
import { Megaphone, Loader2, Calendar, Bell, ExternalLink, Link2 } from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PortalPengumuman() {
  const { selectedStudentId, isLoading: isStudentLoading, isError: isStudentError } = usePortalStudent();
  const { data: list = [], isLoading } = useGetPengumuman();

  if (isStudentLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-sm text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat pengumuman...
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

  return (
    <div className="space-y-6">
      {/* ── HEADER PENGUMUMAN ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <Bell className="w-6 h-6 text-indigo-600" /> Informasi & Pengumuman
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pengumuman resmi dari Pusat (Umum) maupun dari Cabang Pesantren tempat santri belajar.
        </p>
      </div>

      {/* ── DAFTAR PENGUMUMAN ── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat daftar pengumuman...
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 text-center text-sm text-slate-400">
          Belum ada informasi atau pengumuman terbaru saat ini.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h2 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">{item.title}</h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  
                  {/* HTML Content Rendering */}
                  <div
                    className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 prose prose-slate max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-a:text-indigo-600 prose-a:font-semibold hover:prose-a:underline"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />

                  {/* Links attached to announcement */}
                  {item.links && item.links.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                        Tautan Terkait
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 hover:text-indigo-600"
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
          ))}
        </div>
      )}
    </div>
  );
}
