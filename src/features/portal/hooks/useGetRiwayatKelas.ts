import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface RiwayatKelasWaliKelas {
  id: string;
  name: string;
}

export interface RiwayatKelasKelas {
  id: string;
  name: string;
  tingkat?: string | null;
}

export interface RiwayatKelasItem {
  id: string;
  studentId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: string;
  statusAkhir?: string | null;
  waliKelasId?: string | null;
  kelas: RiwayatKelasKelas;
  waliKelas?: RiwayatKelasWaliKelas | null;
}

// GET /portal/students/:studentId/riwayat-kelas — ordered newest-first
// (tahunAjaran desc, semester desc) by FormalService.getRiwayatKelasByStudent.
export const useGetRiwayatKelas = (studentId: string | null) => {
  return useQuery<RiwayatKelasItem[]>({
    queryKey: ['portal', 'riwayat-kelas', studentId],
    queryFn: async () => {
      const response = await apiClient.get<RiwayatKelasItem[]>(
        `/portal/students/${studentId}/riwayat-kelas`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
};
