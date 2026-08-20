import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface LinkItem {
  title?: string;
  group?: string;
  url: string;
}

export interface PengumumanItem {
  id: string;
  title: string;
  content: string;
  links?: LinkItem[];
  scope: 'GLOBAL' | 'CABANG' | string;
  cabangId?: string | null;
  cabang?: { id: string; name: string } | null;
  createdBy?: { id: string; operatorName?: string; username: string } | null;
  isActive: boolean;
  createdAt: string;
}

export const useGetPengumuman = (studentId?: string | null) => {
  return useQuery<PengumumanItem[]>({
    queryKey: ['portal', 'pengumuman', studentId],
    queryFn: async () => {
      const response = await apiClient.get<PengumumanItem[]>('/portal/pengumuman', {
        params: { studentId: studentId || undefined }
      });
      return response.data;
    },
  });
};
