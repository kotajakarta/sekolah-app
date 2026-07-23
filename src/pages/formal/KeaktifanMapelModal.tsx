import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface KeaktifanMapelModalProps {
  mapel: { id: string; name: string; kodeMapel: string };
  onClose: () => void;
}

export default function KeaktifanMapelModal({ mapel, onClose }: KeaktifanMapelModalProps) {
  const queryClient = useQueryClient();

  const { data: grupList, isLoading: loadingGrup } = useQuery({
    queryKey: ['grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/grup-daimi');
      return res.data;
    }
  });

  const { data: mapelGrupList, isLoading: loadingMapelGrup } = useQuery({
    queryKey: ['mapel-grup'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/mapel-grup');
      return res.data;
    }
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

  const isMapelActiveInGrup = (grupId: string) => {
    if (!mapelGrupList) return false;
    const mapping = mapelGrupList.find((m: any) => m.mataPelajaranId === mapel.id && m.grupDaimiId === grupId);
    return mapping ? mapping.isActive : false;
  };

  const handleToggle = (grupId: string, currentStatus: boolean) => {
    toggleMutation.mutate({
      mataPelajaranId: mapel.id,
      grupDaimiId: grupId,
      isActive: !currentStatus
    });
  };

  const isLoading = loadingGrup || loadingMapelGrup;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Atur Keaktifan Mapel</h3>
            <p className="text-sm text-slate-500">{mapel.kodeMapel} - {mapel.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Pilih di jenis grup daimi mana saja mata pelajaran ini diajarkan secara aktif.
              </p>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {(grupList || []).map((grup: any) => {
                  const isActive = isMapelActiveInGrup(grup.id);
                  return (
                    <div key={grup.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">{grup.jenis || grup.name}</p>
                        <p className="text-xs text-slate-500">Status: {isActive ? 'Aktif' : 'Tidak Aktif'}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(grup.id, isActive)}
                        disabled={toggleMutation.isPending}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        role="switch"
                        aria-checked={isActive}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  );
                })}
                {grupList?.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    Belum ada data Grup Daimi.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
