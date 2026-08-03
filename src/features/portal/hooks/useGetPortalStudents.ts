import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface PortalStudentBiodata {
  fullName: string;
  fotoUrl?: string | null;
}

export interface PortalStudentKelas {
  id: string;
  name: string;
  tingkat?: string | null;
}

export interface PortalStudent {
  id: string;
  isActive?: boolean;
  statusHafidz?: string | null;
  biodata?: PortalStudentBiodata | null;
  cabang?: { id: string; name: string } | null;
  wilayah?: { id: string; name: string } | null;
  siswaFormal?: { kelasId?: string | null; kelas?: PortalStudentKelas | null } | null;
}

export interface WaliSantriLink {
  id: string;
  studentId: string;
  hubungan?: string | null;
  student: PortalStudent;
}

export const useGetPortalStudents = () => {
  return useQuery<WaliSantriLink[]>({
    queryKey: ['portal', 'students'],
    queryFn: async () => {
      const response = await apiClient.get<WaliSantriLink[]>('/portal/students');
      return response.data;
    },
  });
};
