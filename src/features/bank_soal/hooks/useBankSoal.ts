import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type {
  QuestionBank,
  QuestionItem,
  QuestionBankFilterParams,
  BankSoalProject,
  BankSoalAssignment,
  FormalMetadata,
  AssignmentStatus,
} from '../types';

// ================= FORMAL METADATA =================

export const useFormalMetadata = () => {
  return useQuery({
    queryKey: ['bank-soal-formal-metadata'],
    queryFn: async () => {
      const response = await apiClient.get<FormalMetadata>('/bank-soal/metadata/formal');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useHierarchyMetadata = (wilayahId?: string, cabangId?: string) => {
  return useQuery({
    queryKey: ['bank-soal-hierarchy-metadata', wilayahId, cabangId],
    queryFn: async () => {
      const response = await apiClient.get<{
        wilayahList: { id: string; name: string }[];
        branches: { id: string; name: string; wilayahId?: string }[];
        teachers: { id: string; username: string; operatorName?: string; cabangId?: string }[];
      }>('/bank-soal/metadata/hierarchy', {
        params: { wilayahId, cabangId },
      });
      return response.data;
    },
  });
};

// ================= BANK SOAL CRUD =================

export const useBankSoalList = (params: QuestionBankFilterParams) => {
  return useQuery({
    queryKey: ['bank-soal-list', params],
    queryFn: async () => {
      const response = await apiClient.get('/bank-soal', { params });
      return response.data;
    },
  });
};

export const useBankSoalDetail = (id?: string) => {
  return useQuery({
    queryKey: ['bank-soal-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<QuestionBank>(`/bank-soal/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useBankSoalFilterOptions = () => {
  return useQuery({
    queryKey: ['bank-soal-filters'],
    queryFn: async () => {
      const response = await apiClient.get<{ subjects: string[]; gradeLevels: string[] }>('/bank-soal/filters');
      return response.data;
    },
  });
};

export const useCreateBankSoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<QuestionBank> & { assignmentId?: string }) => {
      const response = await apiClient.post('/bank-soal', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-list'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-filters'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-projects'] });
    },
  });
};

export const useUpdateBankSoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuestionBank> }) => {
      const response = await apiClient.put(`/bank-soal/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-list'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-filters'] });
    },
  });
};

export const useDeleteBankSoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/bank-soal/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-list'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-filters'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-assignments'] });
    },
  });
};

export const useDuplicateBankSoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/bank-soal/${id}/duplicate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-list'] });
    },
  });
};

// ================= BUTIR SOAL CRUD =================

export const useCreateQuestionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bankId, data }: { bankId: string; data: Partial<QuestionItem> }) => {
      const response = await apiClient.post(`/bank-soal/${bankId}/questions`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-detail', variables.bankId] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-list'] });
    },
  });
};

export const useUpdateQuestionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bankId,
      questionId,
      data,
    }: {
      bankId: string;
      questionId: string;
      data: Partial<QuestionItem>;
    }) => {
      const response = await apiClient.put(`/bank-soal/${bankId}/questions/${questionId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-detail', variables.bankId] });
    },
  });
};

export const useDeleteQuestionItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bankId, questionId }: { bankId: string; questionId: string }) => {
      const response = await apiClient.delete(`/bank-soal/${bankId}/questions/${questionId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-detail', variables.bankId] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-list'] });
    },
  });
};

export const useReorderQuestions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bankId, questionIds }: { bankId: string; questionIds: string[] }) => {
      const response = await apiClient.post(`/bank-soal/${bankId}/reorder`, { questionIds });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-detail', variables.bankId] });
    },
  });
};

// ================= PROYEK & PENUGASAN HOOKS =================

export const useBankSoalProjects = () => {
  return useQuery({
    queryKey: ['bank-soal-projects'],
    queryFn: async () => {
      const response = await apiClient.get<BankSoalProject[]>('/bank-soal/projects/list');
      return response.data;
    },
  });
};

export const useBankSoalProjectDetail = (id?: string) => {
  return useQuery({
    queryKey: ['bank-soal-project-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<BankSoalProject>(`/bank-soal/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateBankSoalProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiClient.post('/bank-soal/projects', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-projects'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-assignments'] });
    },
  });
};

export const useDeleteBankSoalProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/bank-soal/projects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-projects'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-assignments'] });
    },
  });
};

export const useBankSoalAssignments = (params?: {
  projectId?: string;
  status?: AssignmentStatus;
  onlyMine?: boolean;
}) => {
  return useQuery({
    queryKey: ['bank-soal-assignments', params],
    queryFn: async () => {
      const response = await apiClient.get<BankSoalAssignment[]>('/bank-soal/assignments/list', {
        params,
      });
      return response.data;
    },
  });
};

export const useDelegateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/bank-soal/assignments/${id}/delegate`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-projects'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-project-detail'] });
    },
  });
};

/**
 * Utility to trigger DOCX download
 */
export const downloadBankSoalDocx = async (bankId: string, title: string, includeKey = false) => {
  const response = await apiClient.get(`/bank-soal/${bankId}/export-docx`, {
    params: { includeKey },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanTitle = (title || 'Soal_Ujian').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTitle}${includeKey ? '_Kunci' : ''}.docx`;

  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
