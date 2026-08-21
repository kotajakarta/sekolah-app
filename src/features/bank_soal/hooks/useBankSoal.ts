import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import type { QuestionBank, QuestionItem, QuestionBankFilterParams, QuestionType } from '../types';

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
    mutationFn: async (payload: Partial<QuestionBank>) => {
      const response = await apiClient.post('/bank-soal', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-soal-list'] });
      queryClient.invalidateQueries({ queryKey: ['bank-soal-filters'] });
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
