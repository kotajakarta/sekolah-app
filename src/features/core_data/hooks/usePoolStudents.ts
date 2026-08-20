import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { Student } from './useGetStudents';

export const useGetPoolStudents = (search?: string, options?: { enabled?: boolean }) => {
  return useQuery<Student[]>({
    queryKey: ['students', 'pool', search || ''],
    queryFn: async () => {
      const response = await apiClient.get<Student[]>('/students/pool', {
        params: search ? { search } : undefined
      });
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
};

export const useTarikSiswa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, cabangId }: { studentId: string; cabangId: string }) => {
      const response = await apiClient.post(`/students/${studentId}/tarik`, { cabangId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'pool'] });
    },
  });
};

export const useTarikMassalSiswa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentIds, cabangId }: { studentIds: string[]; cabangId: string }) => {
      const response = await apiClient.post(`/students/pool/tarik-massal`, { studentIds, cabangId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'pool'] });
    },
  });
};

export const useLepasSiswa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      studentId,
      statusAkhir,
      catatan
    }: {
      studentId: string;
      statusAkhir: string;
      catatan?: string;
    }) => {
      const response = await apiClient.post(`/students/${studentId}/lepas`, { statusAkhir, catatan });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'pool'] });
    },
  });
};

export const useLepasMassalSiswa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      studentIds,
      statusAkhir,
      catatan
    }: {
      studentIds: string[];
      statusAkhir: string;
      catatan?: string;
    }) => {
      const response = await apiClient.post('/students/lepas-massal', { studentIds, statusAkhir, catatan });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'pool'] });
    },
  });
};

