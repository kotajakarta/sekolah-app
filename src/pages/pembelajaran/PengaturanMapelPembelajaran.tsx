import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Mapel {
  id: string;
  name: string;
  kodeMapel: string;
  grupMapel: string;
  aktifPembelajaran: boolean;
}

export default function PengaturanMapelPembelajaran() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: mapelList, isLoading } = useQuery<Mapel[]>({
    queryKey: ['mapel'],
    queryFn: async () => (await apiClient.get('/formal/mapel')).data
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, aktifPembelajaran }: { id: string; aktifPembelajaran: boolean }) => {
      await apiClient.put(`/formal/mapel/${id}`, { aktifPembelajaran });
    },
    onMutate: async ({ id, aktifPembelajaran }) => {
      await queryClient.cancelQueries({ queryKey: ['mapel'] });
      const previous = queryClient.getQueryData<Mapel[]>(['mapel']);
      queryClient.setQueryData<Mapel[]>(['mapel'], old =>
        old?.map(m => m.id === id ? { ...m, aktifPembelajaran } : m)
      );
      return { previous };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['mapel'], context.previous);
      showToast('error', err?.response?.data?.message || 'Gagal mengubah status mapel');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mapel'] });
    }
  });

  const grouped = (mapelList || []).reduce<Record<string, Mapel[]>>((acc, m) => {
    (acc[m.grupMapel] = acc[m.grupMapel] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Pilih mata pelajaran mana saja yang aktif untuk fitur Kontrol Pembelajaran (Kelola Silabus, Kontrol Silabus, Absensi Mapel, Laporan). Mapel yang dinonaktifkan tidak akan muncul di pilihan mapel pada tab-tab tersebut.
      </p>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 text-blue-800 animate-spin" />
        </div>
      ) : (mapelList || []).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
          Belum ada data mata pelajaran.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([grupMapel, items]) => (
            <div key={grupMapel} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-800">{grupMapel}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                      <p className="text-[11px] text-gray-400">{m.kodeMapel} &middot; {m.aktifPembelajaran ? 'Aktif' : 'Tidak Aktif'}</p>
                    </div>
                    <button
                      onClick={() => toggleMutation.mutate({ id: m.id, aktifPembelajaran: !m.aktifPembelajaran })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 ${
                        m.aktifPembelajaran ? 'bg-blue-800' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={m.aktifPembelajaran}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          m.aktifPembelajaran ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
