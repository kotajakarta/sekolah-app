import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface Staff {
  id: string;
  name: string;
  position: string;
  cabangId?: string | null;
}

export interface Wilayah {
  id: string;
  name: string;
}

export interface Cabang {
  id: string;
  name: string;
  wilayahId: string;
  nameGlodemy?: string;
  nameResmi?: string;
  kapasitasSantri?: number;
  totalSantriManual?: number;
  alamatJalan?: string;
  alamatKecName?: string;
  alamatKabName?: string;
  alamatProvName?: string;
  statusTanah?: string;
  statusBangunan?: string;
  wilayah?: Wilayah;
  pimpinanCabang?: string;
  pjMuadalah?: string;
  personel?: {
    pendidikLK: number;
    pendidikPR: number;
    kependidikanLK: number;
    kependidikanPR: number;
    totalLK: number;
    totalPR: number;
    guruMatematika: number;
    guruIndo: number;
    guruInggris: number;
    guruIpa: number;
    guruPkn: number;
    totalGuruMapel: number;
  };
  siswaStats?: {
    totalSiswa: number;
    grup: {
      hazirlik: number;
      hafizlik: number;
      ibtidai: number;
      ihzari: number;
    };
    tingkat: {
      tingkat7: number;
      tingkat8: number;
      tingkat9: number;
      tingkat10: number;
      tingkat11: number;
      tingkat12: number;
      lulus: number;
      sekolahLain: number;
    };
  };
  _count?: {
    students: number;
  };
}

export const useGetGuru = () => {
  return useQuery<Staff[]>({
    queryKey: ['master-data', 'guru'],
    queryFn: async () => {
      const response = await apiClient.get<Staff[]>('/master-data/guru');
      return response.data;
    },
  });
};

export const useDeleteGuru = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/master-data/guru/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'guru'] });
      queryClient.invalidateQueries({ queryKey: ['guru', 'pool'] });
    },
  });
};

export const useGetCabang = () => {
  return useQuery<Cabang[]>({
    queryKey: ['master-data', 'cabang'],
    queryFn: async () => {
      const response = await apiClient.get<Cabang[]>('/master-data/cabang');
      return response.data;
    },
  });
};

export const useGetWilayah = () => {
  return useQuery<Wilayah[]>({
    queryKey: ['master-data', 'wilayah'],
    queryFn: async () => {
      const response = await apiClient.get<Wilayah[]>('/master-data/wilayah');
      return response.data;
    },
  });
};
