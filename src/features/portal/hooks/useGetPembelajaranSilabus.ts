import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface PembelajaranItem {
  id: string;
  tanggal: string | Date;
  mataPelajaran?: { id: string; name: string; kodeMapel?: string } | null;
  silabus?: {
    id: string;
    bab: string;
    section: string;
    tingkat: string;
    semester: string;
    tahunAjaran: string;
  } | null;
  guru?: { id: string; name: string } | null;
  kelas?: { id: string; name: string } | null;
  statusKehadiran: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | 'LIBUR';
  isMengikuti: boolean;
  keterangan: string;
  catatan?: string | null;
}

export const useGetPembelajaranSilabus = (studentId: string | null) => {
  return useQuery<PembelajaranItem[]>({
    queryKey: ['portal', 'pembelajaran-silabus', studentId],
    queryFn: async () => {
      const response = await apiClient.get<PembelajaranItem[]>(
        `/portal/students/${studentId}/pembelajaran`
      );
      return response.data;
    },
    enabled: !!studentId,
  });
};
