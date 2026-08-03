import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface RaporRiwayatMataPelajaran {
  id: string;
  name: string;
  kodeMapel: string;
  grupMapel: string;
}

export interface RaporRiwayatItem {
  id: string;
  tahunAjaran: string;
  semester: string;
  nilaiAkhir: number | null;
  predikat: string | null;
  mataPelajaran: RaporRiwayatMataPelajaran;
  // Class average for this mapel/period, computed by FormalService.getNilaiHistoryByStudent.
  rataRataKelas: number | null;
}

// GET /portal/students/:studentId/rapor/riwayat — flat list, ordered
// tahunAjaran desc, semester desc, mataPelajaran.kodeMapel asc.
export const useGetRaporRiwayat = (studentId: string | null) => {
  return useQuery<RaporRiwayatItem[]>({
    queryKey: ['portal', 'rapor-riwayat', studentId],
    queryFn: async () => {
      const response = await apiClient.get<RaporRiwayatItem[]>(
        `/portal/students/${studentId}/rapor/riwayat`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
};
