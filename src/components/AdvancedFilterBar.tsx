import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
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
}

export default function AdvancedFilterBar({ 
  onFilterChange, 
  userScope, 
  userWilayahId, 
  userCabangId,
  showDaimiFilter = false,
  showTingkatFilter = false
}: AdvancedFilterBarProps) {
  const { t } = useTranslation();
  
  const [filters, setFilters] = useState<FilterState>({
    wilayahId: userScope === 'WILAYAH' || userScope === 'CABANG' ? userWilayahId || '' : '',
    cabangId: userScope === 'CABANG' ? userCabangId || '' : '',
    kelasId: '',
    lembagaMuadalahId: '',
    jenisDaimi: '',
    tingkat: ''
  });

  const { data: wilayahs = [] } = useGetWilayah();
  const { data: cabangs = [] } = useGetCabang();
  
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

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

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
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4 text-slate-700 font-medium">
        <Filter className="w-4 h-4 text-indigo-500" />
        <span>Filter Lanjutan</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Wilayah</label>
          <select
            value={filters.wilayahId}
            onChange={(e) => handleChange('wilayahId', e.target.value)}
            disabled={userScope === 'WILAYAH' || userScope === 'CABANG'}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Semua Wilayah</option>
            {wilayahs.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Cabang</label>
          <select
            value={filters.cabangId}
            onChange={(e) => handleChange('cabangId', e.target.value)}
            disabled={userScope === 'CABANG'}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Semua Cabang</option>
            {filteredCabangs.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Kelas</label>
          <select
            value={filters.kelasId}
            onChange={(e) => handleChange('kelasId', e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua Kelas</option>
            {filteredKelass.map((k: any) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Lembaga Muadalah</label>
          <select
            value={filters.lembagaMuadalahId}
            onChange={(e) => handleChange('lembagaMuadalahId', e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua Lembaga</option>
            {muadalahs.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {showTingkatFilter && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tingkat</label>
            <select
              value={filters.tingkat || ''}
              onChange={(e) => handleChange('tingkat', e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Tingkat</option>
              <option value="Non Muadalah">Non Muadalah</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </div>
        )}

        {showDaimiFilter && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Jenis Grup Daimi</label>
            <select
              value={filters.jenisDaimi || ''}
              onChange={(e) => handleChange('jenisDaimi', e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 py-2 px-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Jenis Daimi</option>
              <option value="1. YIL LİSE">1. YIL LİSE</option>
              <option value="1. YIL ORTAOKUL">1. YIL ORTAOKUL</option>
              <option value="HAFIZLIK">HAFIZLIK</option>
              <option value="HAZIRLIK LİSE">HAZIRLIK LİSE</option>
              <option value="HAZIRLIK ORTAOKUL">HAZIRLIK ORTAOKUL</option>
              <option value="İBTİDAİ">İBTİDAİ</option>
              <option value="İHZARİ">İHZARİ</option>
              <option value="PRA TEDRİS">PRA TEDRİS</option>
              <option value="TEKAMÜL">TEKAMÜL</option>
              <option value="TEKAMÜLALTI">TEKAMÜLALTI</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleReset}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Reset Filter
        </button>
      </div>
    </div>
  );
}
