import React, { useState, useEffect } from 'react';
import { Activity, Search, Calendar, ChevronLeft, ChevronRight, User, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../lib/apiClient';

interface AuditLog {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  actorId: string;
  actorName: string;
  actorScope: string;
  details: string;
  createdAt: string;
  wilayahId: string | null;
  cabangId: string | null;
}

function parseLogDetails(details: string) {
  const match = details.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    const mainAction = match[1];
    const changesStr = match[2];
    const changes: Array<{ field: string; oldVal: string; newVal: string }> = [];
    const changeItems = changesStr.split(/,\s*(?=[A-Za-z\s\u00C0-\u017F\.]+:)/);

    for (const item of changeItems) {
      const itemMatch = item.match(/^([A-Za-z\s\u00C0-\u017F\.]+):\s*"(.*?)"\s*➔\s*"(.*?)"$/);
      if (itemMatch) {
        changes.push({
          field: itemMatch[1].trim(),
          oldVal: itemMatch[2],
          newVal: itemMatch[3]
        });
      }
    }
    return { mainAction, changes };
  }
  return { mainAction: details, changes: [] };
}

export default function RiwayatPerubahanData() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/audit-logs?page=${currentPage}&limit=15`);
      setLogs(res.data.items || res.data.data || []);
      setTotalPages(res.data.totalPages || res.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'UPDATE': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'TARIK': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'LEPAS': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-500 pb-10">
      
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Riwayat Perubahan Data
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">Lacak semua aktivitas perubahan data (siswa, guru, kelas, cabang) yang dilakukan oleh pengguna</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari aktivitas..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] w-64 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => fetchLogs(page)}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <th className="p-4 w-48">Waktu</th>
                <th className="p-4 w-32">Aksi</th>
                <th className="p-4">Deskripsi Aktivitas</th>
                <th className="p-4 w-48">Pelaku</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Memuat riwayat...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Belum ada riwayat aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold border tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        {(() => {
                          const { mainAction, changes } = parseLogDetails(log.details);
                          return (
                            <>
                              <p className="font-semibold text-slate-700">{mainAction}</p>
                              {changes.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail Perubahan:</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {changes.map((c, idx) => (
                                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 rounded-lg shadow-xs">
                                        <span className="font-semibold text-slate-700">{c.field}</span>:
                                        <span className="text-rose-600 line-through max-w-[120px] truncate" title={c.oldVal}>{c.oldVal || '-'}</span>
                                        <span className="text-slate-400">➔</span>
                                        <span className="text-emerald-600 font-medium max-w-[120px] truncate" title={c.newVal}>{c.newVal || '-'}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">ID: {log.entityId} | Entitas: {log.entityName}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">{log.actorName}</p>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">{log.actorScope}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && logs.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[12px] text-slate-500 font-medium">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
