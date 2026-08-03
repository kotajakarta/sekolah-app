import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export interface PengumumanItem {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

// GET /portal/pengumuman — active pengumuman, ordered createdAt desc (newest first).
export const useGetPengumuman = () => {
  return useQuery<PengumumanItem[]>({
    queryKey: ['portal', 'pengumuman'],
    queryFn: async () => {
      const response = await apiClient.get<PengumumanItem[]>('/portal/pengumuman');
      return response.data;
    },
  });
};
