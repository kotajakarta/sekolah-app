import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface NilaiFormalHistory {
  id: string;
  studentId: string;
  mataPelajaranId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: string;
  nilaiHarian?: number | null;
  nilaiPas?: number | null;
  nilaiAkhir?: number | null;
  predikat?: string | null;
  capaianKompetensi?: string | null;
  mataPelajaran?: { id: string; kodeMapel: string; name: string; grupMapel: string };
  kelas?: { id: string; name: string; tingkat?: number };
}

export const useGetNilaiHistory = (studentId: string) => {
  return useQuery<NilaiFormalHistory[]>({
    queryKey: ['nilai-history', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await apiClient.get<NilaiFormalHistory[]>(`/formal/nilai/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
};
