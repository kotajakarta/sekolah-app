import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, FileText, Download, ExternalLink } from 'lucide-react';

interface Kalender {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export default function KalenderAkademikUmum() {
  const { data: list, isLoading } = useQuery<Kalender[]>({
    queryKey: ['kalender'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/kalender');
      return res.data;
    }
  });

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/v1')) return url;
    if (url.startsWith('/pengaturan/uploads')) return `/api/v1${url}`;
    if (url.startsWith('/uploads')) return `/api/v1/pengaturan${url}`;
    return `/api/v1/pengaturan/uploads/${url.replace(/^\/+/, '')}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Kalender Akademik</h1>
        <p className="text-sm text-slate-500 mt-1.5">Kalender pendidikan resmi untuk tahun ajaran aktif.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : list?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center">
          <FileText className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Belum Ada Kalender</h3>
          <p className="text-slate-500 mt-2 text-sm">Dokumen kalender pendidikan belum tersedia saat ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {list?.map((item) => {
            const fileUrl = getFullUrl(item.fileUrl);
            const isImage = /\.(png|jpe?g|webp)$/i.test(item.fileUrl);

            return (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4 shrink-0">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.title}</h3>
                      <p className="text-xs text-slate-500">Diperbarui: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Buka di Tab Baru
                    </a>
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      download
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh Dokumen
                    </a>
                  </div>
                </div>

                <div className="p-0 bg-slate-100 min-h-[650px] flex flex-col justify-center items-center">
                  {isImage ? (
                    <img 
                      src={fileUrl} 
                      alt={item.title} 
                      className="w-full max-h-[850px] object-contain p-4 bg-slate-900/5" 
                    />
                  ) : (
                    <iframe 
                      src={fileUrl} 
                      className="w-full h-[750px] border-0" 
                      title={item.title}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
