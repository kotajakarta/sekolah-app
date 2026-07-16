import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface RiwayatKelasFormal {
  id: string;
  studentId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: string;
  statusAkhir?: string | null;
  waliKelasId?: string | null;
  catatan?: string | null;
  kelas?: { 
    id: string; 
    name: string;
    tingkat?: number;
    isActive?: boolean;
    tahunAjaran?: string;
    lembagaMuadalah?: { id: string; name: string };
  };
  waliKelas?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export const useGetRiwayatKelas = (studentId: string) => {
  return useQuery<RiwayatKelasFormal[]>({
    queryKey: ['riwayat-kelas', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await apiClient.get<RiwayatKelasFormal[]>(`/formal/riwayat-kelas/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
};

export const useCreateRiwayatKelas = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/formal/riwayat-kelas', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['riwayat-kelas', variables.studentId] });
    },
  });
};

export const useUpdateRiwayatKelas = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: any; studentId: string }) => {
      const response = await apiClient.put(`/formal/riwayat-kelas/${params.id}`, params.data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['riwayat-kelas', variables.studentId] });
    },
  });
};

export const useDeleteRiwayatKelas = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; studentId: string }) => {
      const response = await apiClient.delete(`/formal/riwayat-kelas/${params.id}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['riwayat-kelas', variables.studentId] });
    },
  });
};

export const useKenaikanKelasMassal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/formal/kelas/naik-kelas-massal', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riwayat-kelas'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['kelas'] });
    },
  });
};
