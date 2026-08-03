import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface HafalanAlQuran {
  id: string;
  studentId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: string;
  awalPutaran: number | null;
  awalJuz: number | null;
  targetPutaran: number | null;
  targetJuz: number | null;
  akhirPutaran: number | null;
  akhirJuz: number | null;
}

// GET /portal/students/:studentId/hafalan?tahunAjaran=&semester= — a raw
// findUnique result, `null` when the student has no hafalan record for the period
// (not every student has a hafalan track).
export const useGetHafalan = (
  studentId: string | null,
  tahunAjaran: string | null,
  semester: string | null
) => {
  return useQuery<HafalanAlQuran | null>({
    queryKey: ['portal', 'hafalan', studentId, tahunAjaran, semester],
    queryFn: async () => {
      const response = await apiClient.get<HafalanAlQuran | null>(
        `/portal/students/${studentId}/hafalan`,
        { params: { tahunAjaran, semester } }
      );
      return response.data;
    },
    enabled: !!studentId && !!tahunAjaran && !!semester,
  });
};
