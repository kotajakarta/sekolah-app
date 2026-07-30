import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface Guru {
  id: string;
  name: string;
  position: string;
  wilayahId?: string;
  cabangId?: string;
  statusPool: string;
  wilayah?: { id: string; name: string };
  cabang?: { id: string; name: string };
  mapelUmum?: string[];
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  pendidikanTerakhir?: string;
  jenisKelamin?: string;
  perguruanTinggi?: string;
  programStudi?: string;
  tahunLulus?: string;
  ifadahUrl?: string;
  ktpUrl?: string;
  ijazahUrl?: string;
  phone?: string;
  waliKelas?: string;
}

export const useGetPoolGuru = () => {
  return useQuery<Guru[]>({
    queryKey: ['guru', 'pool'],
    queryFn: async () => {
      const response = await apiClient.get('/master-data/pool-guru');
      return response.data;
    },
  });
};

export const useTarikMassalGuru = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ staffIds, cabangId }: { staffIds: string[]; cabangId: string }) => {
      const response = await apiClient.post(`/master-data/pool-guru/tarik-massal`, { staffIds, cabangId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'guru'] });
      queryClient.invalidateQueries({ queryKey: ['guru', 'pool'] });
    },
  });
};

export const useLepasGuru = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      const response = await apiClient.post(`/master-data/pool-guru/${staffId}/lepas`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'guru'] });
      queryClient.invalidateQueries({ queryKey: ['guru', 'pool'] });
    },
  });
};
