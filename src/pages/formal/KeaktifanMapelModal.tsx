import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { X, Loader2 } from 'lucide-react';

interface KeaktifanMapelModalProps {
  mapel: { id: string; name: string; kodeMapel: string };
  onClose: () => void;
}

export default function KeaktifanMapelModal({ mapel, onClose }: KeaktifanMapelModalProps) {
  const queryClient = useQueryClient();

  const { data: jenisGrupList, isLoading: loadingJenis } = useQuery({
    queryKey: ['jenis-grup-daimi'],
    queryFn: async () => (await apiClient.get('/pesantren/jenis-grup-daimi')).data
  });

  const { data: grupDaimiList, isLoading: loadingGrup } = useQuery({
    queryKey: ['grup-daimi'],
    queryFn: async () => (await apiClient.get('/pesantren/grup-daimi')).data
  });

  const { data: mapelGrupList, isLoading: loadingMapelGrup } = useQuery({
    queryKey: ['mapel-grup'],
    queryFn: async () => (await apiClient.get('/formal/mapel-grup')).data
  });

  const toggleMutation = useMutation({
    mutationFn: async (data: { mataPelajaranId: string; jenisGrupName: string; isActive: boolean }) => {
      await apiClient.post('/formal/mapel-grup/toggle', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapel-grup'] });
      queryClient.invalidateQueries({ queryKey: ['mapel'] });
    }
  });

  const isMapelActiveInJenisGrup = (jenisName: string) => {
    if (!mapelGrupList || !grupDaimiList) return false;

    const matchingGrupIds = grupDaimiList
      .filter((g: any) => 
        (g.jenis && g.jenis.toLowerCase() === jenisName.toLowerCase()) ||
        (g.name && g.name.toLowerCase() === jenisName.toLowerCase())
      )
      .map((g: any) => g.id);

    if (matchingGrupIds.length === 0) return false;

    return mapelGrupList.some((m: any) => 
      m.mataPelajaranId === mapel.id && 
      matchingGrupIds.includes(m.grupDaimiId) && 
      m.isActive
    );
  };

  const handleToggle = (jenisName: string, currentStatus: boolean) => {
    toggleMutation.mutate({
      mataPelajaranId: mapel.id,
      jenisGrupName: jenisName,
      isActive: !currentStatus
    });
  };

  const isLoading = loadingJenis || loadingGrup || loadingMapelGrup;

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
                {(jenisGrupList || []).map((jenis: any) => {
                  const isActive = isMapelActiveInJenisGrup(jenis.name);
                  return (
                    <div key={jenis.id || jenis.name} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">{jenis.name}</p>
                        <p className="text-xs text-slate-500">Status: {isActive ? 'Aktif' : 'Tidak Aktif'}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(jenis.name, isActive)}
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
                {jenisGrupList?.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    Belum ada data Jenis Grup Daimi.
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
