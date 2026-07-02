import React, { useState, useMemo } from 'react';
import { X, Search, Map, List, Building2 } from 'lucide-react';
import { Cabang } from '../hooks/useMasterData';

interface HulasaCabangModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabangList: Cabang[] | undefined;
}

export default function HulasaCabangModal({ isOpen, onClose, cabangList = [] }: HulasaCabangModalProps) {
  const [viewMode, setViewMode] = useState<'all' | 'wilayah'>('all');
  const [search, setSearch] = useState('');

  const filteredCabang = useMemo(() => {
    if (!search.trim()) return cabangList;
    const lowerSearch = search.toLowerCase();
    return cabangList.filter(c => 
      c.name.toLowerCase().includes(lowerSearch) || 
      (c.wilayah?.name || '').toLowerCase().includes(lowerSearch)
    );
  }, [cabangList, search]);

  const wilayahSummary = useMemo(() => {
    const summary: Record<string, { name: string, count: number, cabangNames: string[] }> = {};
    
    filteredCabang.forEach(c => {
      const wName = c.wilayah?.name || 'Tanpa Wilayah';
      if (!summary[wName]) {
        summary[wName] = { name: wName, count: 0, cabangNames: [] };
      }
      summary[wName].count += 1;
      summary[wName].cabangNames.push(c.name);
    });
    
    return Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredCabang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <h3 className="flex items-center gap-2 text-xl font-display font-semibold text-slate-900">
            <Building2 className="w-5 h-5 text-blue-600" />
            Hulasa (Ringkasan) Data Cabang
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-slate-50/50">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari wilayah atau cabang..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-200/60 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('all')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'all' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <List className="w-4 h-4" />
                Tampilkan Semua
              </button>
              <button
                onClick={() => setViewMode('wilayah')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'wilayah' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Map className="w-4 h-4" />
                Hanya Wilayah
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50">
            {viewMode === 'all' ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Cabang</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Wilayah</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredCabang.length > 0 ? filteredCabang.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 text-center">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100/60">
                          {item.wilayah?.name || 'Tanpa Wilayah'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Search className="w-8 h-8 mb-3 text-slate-300" />
                          <p className="text-sm">Tidak ada data cabang yang sesuai</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Wilayah</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Total Cabang</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Daftar Cabang</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {wilayahSummary.length > 0 ? wilayahSummary.map((item, index) => (
                    <tr key={item.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 text-center align-top">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 align-top">
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100/60">
                          {item.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 text-center align-top">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded bg-slate-100 text-slate-800">
                          {item.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-wrap gap-2">
                          {item.cabangNames.map((cName, idx) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 shadow-sm text-xs font-medium">
                              {cName}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Search className="w-8 h-8 mb-3 text-slate-300" />
                          <p className="text-sm">Tidak ada data wilayah yang sesuai</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 sticky bottom-0 z-10">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-sm font-bold text-slate-900 text-right">TOTAL KESELURUHAN:</td>
                    <td className="px-6 py-4 text-base font-bold text-indigo-700 text-center">{filteredCabang.length}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
