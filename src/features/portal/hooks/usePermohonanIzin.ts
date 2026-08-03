import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export type JenisIzinSantri = 'IZIN_PULANG' | 'SAKIT' | 'LAINNYA';
export type StatusPermohonan = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PermohonanIzinItem {
  id: string;
  studentId: string;
  jenisIzin: JenisIzinSantri;
  keterangan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: StatusPermohonan;
  catatanAdmin?: string | null;
  createdAt: string;
}

export interface CreatePermohonanIzinInput {
  studentId: string;
  jenisIzin: JenisIzinSantri;
  keterangan: string;
  // YYYY-MM-DD — the backend DTO validates with @IsDateString.
  tanggalMulai: string;
  tanggalSelesai: string;
}

// GET /portal/permohonan-izin?studentId= — ordered createdAt desc.
export const useGetPermohonanIzinList = (studentId?: string) => {
  return useQuery<PermohonanIzinItem[]>({
    queryKey: ['portal', 'permohonan-izin', studentId ?? 'all'],
    queryFn: async () => {
      const response = await apiClient.get<PermohonanIzinItem[]>('/portal/permohonan-izin', {
        params: studentId ? { studentId } : undefined,
      });
      return response.data;
    },
  });
};

// POST /portal/permohonan-izin
export const useCreatePermohonanIzin = () => {
  const queryClient = useQueryClient();
  return useMutation<PermohonanIzinItem, unknown, CreatePermohonanIzinInput>({
    mutationFn: async (data) => {
      const response = await apiClient.post<PermohonanIzinItem>('/portal/permohonan-izin', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'permohonan-izin'] });
    },
  });
};
