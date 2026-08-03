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
  isActive: boolean;
  createdAt: string;
}

export const useGetPengumuman = () => {
  return useQuery<PengumumanItem[]>({
    queryKey: ['portal', 'pengumuman'],
    queryFn: async () => {
      const response = await apiClient.get<PengumumanItem[]>('/portal/pengumuman');
      return response.data;
    },
  });
};
