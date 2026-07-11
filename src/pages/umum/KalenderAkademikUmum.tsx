import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, FileText, Download } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
          {list?.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{item.title}</h3>
                    <p className="text-xs text-slate-500">Diperbarui: {new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <a 
                  href={`/api/v1/pengaturan${item.fileUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  download
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Unduh PDF
                </a>
              </div>
              <div className="p-0 bg-slate-100">
                <iframe 
                  src={`/api/v1/pengaturan${item.fileUrl}#toolbar=0`} 
                  className="w-full h-[600px]" 
                  title={item.title}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
