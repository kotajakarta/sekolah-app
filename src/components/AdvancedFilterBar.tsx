import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useTranslation } from 'react-i18next';
import { Filter, X, FileSpreadsheet } from 'lucide-react';
import { useGetCabang, useGetWilayah } from '../features/core_data/hooks/useMasterData';

export interface FilterState {
  wilayahId: string;
  cabangId: string;
  kelasId: string;
  lembagaMuadalahId: string;
  jenisDaimi?: string;
  tingkat?: string;
}

interface AdvancedFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  userScope: string;
  userWilayahId?: string;
  userCabangId?: string;
  showDaimiFilter?: boolean;
  showTingkatFilter?: boolean;
  availableTingkats?: string[];
  onOpenCustomExportModal?: () => void;
}

export default function AdvancedFilterBar({ 
  onFilterChange, 
  userScope, 
  userWilayahId, 
  userCabangId,
  showDaimiFilter = false,
  showTingkatFilter = false,
  availableTingkats,
  onOpenCustomExportModal
}: AdvancedFilterBarProps) {
  const { t } = useTranslation();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    wilayahId: userScope === 'WILAYAH' || userScope === 'CABANG' ? userWilayahId || '' : '',
    cabangId: userScope === 'CABANG' ? userCabangId || '' : '',
    kelasId: '',
    lembagaMuadalahId: '',
    jenisDaimi: '',
    tingkat: ''
  });

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.wilayahId && userScope !== 'WILAYAH' && userScope !== 'CABANG') count++;
    if (filters.cabangId && userScope !== 'CABANG') count++;
    if (filters.kelasId) count++;
    if (filters.lembagaMuadalahId) count++;
    if (filters.jenisDaimi) count++;
    if (filters.tingkat) count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  const { data: wilayahs = [] } = useGetWilayah();
  const { data: cabangs = [] } = useGetCabang();

  const { data: jenisGrupDaimiList = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['jenis-grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/jenis-grup-daimi');
      return res.data;
    },
    enabled: showDaimiFilter
  });
  
  const { data: kelass = [] } = useQuery({
    queryKey: ['kelas', filters.cabangId],
    queryFn: async () => {
      const res = await apiClient.get('/formal/kelas');
      let filtered = res.data.filter((k: any) => k.isActive);
      if (filters.cabangId) {
        filtered = filtered.filter((k: any) => k.cabangId === filters.cabangId);
      }
      return filtered;
    },
    enabled: true
  });

  const { data: muadalahs = [] } = useQuery({
    queryKey: ['lembaga-muadalah'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/muadalah');
      return res.data.filter((m: any) => m.isActive);
    }
  });

  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'wilayahId') {
        next.cabangId = '';
        next.kelasId = '';
      }
      if (key === 'cabangId') {
        next.kelasId = '';
      }
      return next;
    });
  };

  const onFilterChangeRef = React.useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  });

  useEffect(() => {
    onFilterChangeRef.current(filters);
  }, [filters]);

  const filteredCabangs = filters.wilayahId 
    ? cabangs.filter((c: any) => c.wilayahId === filters.wilayahId) 
    : cabangs;

  const filteredKelass = filters.cabangId
    ? kelass.filter((k: any) => k.cabangId === filters.cabangId)
    : kelass;

  const handleReset = () => {
    setFilters({
      wilayahId: userScope === 'WILAYAH' || userScope === 'CABANG' ? userWilayahId || '' : '',
      cabangId: userScope === 'CABANG' ? userCabangId || '' : '',
      kelasId: '',
      lembagaMuadalahId: '',
      jenisDaimi: '',
      tingkat: ''
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 transition-all duration-200 overflow-hidden">
      {/* Header Bar */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>Filter Lanjutan</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onOpenCustomExportModal && (
            <button
              onClick={() => onOpenCustomExportModal()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer mr-1"
              title="Buka Modal Filter & Export Kolom Custom"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filter Custom & Export</span>
            </button>
          )}

          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors mr-1"
            >
              <X className="w-3 h-3 mr-0.5" />
              Reset
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-semibold px-2 py-0.5 rounded text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            {isExpanded ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
      </div>

      {/* Filter Body (collapsible) */}
      {isExpanded && (
        <div className="p-3.5 border-t border-slate-100 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Wilayah</label>
              <select
                value={filters.wilayahId}
                onChange={(e) => handleChange('wilayahId', e.target.value)}
                disabled={userScope === 'WILAYAH' || userScope === 'CABANG'}
                className="w-full text-xs rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Semua Wilayah</option>
                {wilayahs.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Cabang</label>
              <select
                value={filters.cabangId}
                onChange={(e) => handleChange('cabangId', e.target.value)}
                disabled={userScope === 'CABANG'}
                className="w-full text-xs rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Semua Cabang</option>
                {filteredCabangs.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Kelas</label>
              <select
                value={filters.kelasId}
                onChange={(e) => handleChange('kelasId', e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Kelas</option>
                {filteredKelass.map((k: any) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Lembaga Muadalah</label>
              <select
                value={filters.lembagaMuadalahId}
                onChange={(e) => handleChange('lembagaMuadalahId', e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Lembaga</option>
                {muadalahs.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {showTingkatFilter && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Tingkat</label>
                <select
                  value={filters.tingkat || ''}
                  onChange={(e) => handleChange('tingkat', e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Semua Tingkat</option>
                  {(availableTingkats && availableTingkats.length > 0
                    ? availableTingkats
                    : ['Non Muadalah', '7', '8', '9', '10', '11', '12']
                  ).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {showDaimiFilter && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Jenis Daimi</label>
                <select
                  value={filters.jenisDaimi || ''}
                  onChange={(e) => handleChange('jenisDaimi', e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Semua Jenis Daimi</option>
                  {jenisGrupDaimiList.map(opt => (
                    <option key={opt.id} value={opt.name}>{opt.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
