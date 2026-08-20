import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export type KehadiranStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';

export interface KehadiranProgram {
  id: string;
  name: string;
  date: string;
}

export interface KehadiranRecord {
  id: string;
  status: KehadiranStatus;
  catatan?: string | null;
  program: KehadiranProgram;
}

export interface KehadiranTally {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
}

export interface SilabusRecord {
  id: string;
  tanggal: string;
  status: KehadiranStatus;
  catatan?: string | null;
  mataPelajaran?: { id: string; name: string; kodeMapel?: string } | null;
  silabus?: { id: string; bab: string; section: string; tingkat: string; semester: string; tahunAjaran: string } | null;
  kelas?: { id: string; name: string } | null;
}

export interface KehadiranData {
  records: KehadiranRecord[];
  tally: KehadiranTally;
  harian?: {
    records: KehadiranRecord[];
    tally: KehadiranTally;
  };
  silabus?: {
    records: SilabusRecord[];
    tally: KehadiranTally;
  };
}

// GET /portal/students/:studentId/kehadiran?startDate=&endDate= per
// PortalService.getKehadiran (records ordered program.date desc, plus a tally).
export const useGetKehadiran = (
  studentId: string | null,
  startDate?: string,
  endDate?: string
) => {
  return useQuery<KehadiranData>({
    queryKey: ['portal', 'kehadiran', studentId, startDate, endDate],
    queryFn: async () => {
      const response = await apiClient.get<KehadiranData>(
        `/portal/students/${studentId}/kehadiran`,
        { params: { startDate, endDate } }
      );
      return response.data;
    },
    enabled: !!studentId,
  });
};
