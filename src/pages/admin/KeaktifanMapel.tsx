import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function KeaktifanMapel() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: mapelList, isLoading: loadingMapel } = useQuery({
    queryKey: ['mapel'],
    queryFn: async () => (await apiClient.get('/formal/mapel')).data
  });

  const { data: grupList, isLoading: loadingGrup } = useQuery({
    queryKey: ['grup-daimi'],
    queryFn: async () => (await apiClient.get('/pesantren/grup-daimi')).data
  });

  const { data: keaktifanList, isLoading: loadingKeaktifan } = useQuery({
    queryKey: ['mapel-grup'],
    queryFn: async () => (await apiClient.get('/formal/mapel-grup')).data
  });

  const toggleMutation = useMutation({
    mutationFn: async (data: { mataPelajaranId: string, grupDaimiId: string, isActive: boolean }) => {
      await apiClient.post('/formal/mapel-grup/toggle', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapel-grup'] });
      queryClient.invalidateQueries({ queryKey: ['mapel'] });
    }
  });

  const isLoading = loadingMapel || loadingGrup || loadingKeaktifan;

  const getKeaktifanStatus = (mapelId: string, grupId: string) => {
    if (!keaktifanList) return false;
    const item = keaktifanList.find((k: any) => k.mataPelajaranId === mapelId && k.grupDaimiId === grupId);
    return item ? item.isActive : false;
  };

  const handleToggle = (mapelId: string, grupId: string, currentStatus: boolean) => {
    toggleMutation.mutate({ mataPelajaranId: mapelId, grupDaimiId: grupId, isActive: !currentStatus });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Keaktifan Mapel Berdasarkan Grup</h1>
        <p className="text-sm text-slate-500 mt-1.5">Atur mata pelajaran formal mana saja yang diajarkan pada masing-masing jenis grup daimi (pesantren).</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase border-r border-slate-200">Mata Pelajaran</th>
                  {grupList?.map((grup: any) => (
                    <th key={grup.id} className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase border-r border-slate-200">
                      {grup.jenis || grup.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mapelList?.filter((m: any) => m.isActive).map((mapel: any) => (
                  <tr key={mapel.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 border-r border-slate-200">
                      {mapel.name} <span className="text-xs text-slate-400 font-normal ml-1">({mapel.grupMapel})</span>
                    </td>
                    {grupList?.map((grup: any) => {
                      const isActive = getKeaktifanStatus(mapel.id, grup.id);
                      return (
                        <td key={grup.id} className="px-4 py-3 whitespace-nowrap text-center border-r border-slate-200">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleToggle(mapel.id, grup.id, isActive)}
                            disabled={toggleMutation.isPending}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer disabled:opacity-50"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {mapelList?.filter((m: any) => m.isActive).length === 0 && (
                  <tr>
                    <td colSpan={(grupList?.length || 0) + 1} className="px-6 py-8 text-center text-slate-500">
                      Belum ada mata pelajaran aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
