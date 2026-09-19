import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { PelanggaranRecord, SuratPeringatanRecord, PengeluaranSiswaRecord } from './types';

export interface IndisiplinerStats {
  totalPelanggaran: number;
  totalPoin: number;
  totalSp: number;
  spAktif: number;
  totalPengeluaran: number;
}

// === STATS ===
export function useGetIndisiplinerStats() {
  return useQuery<IndisiplinerStats>({
    queryKey: ['indisipliner', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<IndisiplinerStats>('/indisipliner/stats');
      return res.data;
    },
    staleTime: 30000,
  });
}

// === PELANGGARAN ===
export function useGetPelanggaran(params?: { search?: string; kategori?: string }) {
  return useQuery<PelanggaranRecord[]>({
    queryKey: ['indisipliner', 'pelanggaran', params],
    queryFn: async () => {
      const res = await apiClient.get<PelanggaranRecord[]>('/indisipliner/pelanggaran', { params });
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useCreatePelanggaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PelanggaranRecord>) => {
      const res = await apiClient.post('/indisipliner/pelanggaran', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
    },
  });
}

export function useDeletePelanggaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/indisipliner/pelanggaran/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
    },
  });
}

// === SURAT PERINGATAN (SP) ===
export function useGetSp(params?: { search?: string; tingkat?: string }) {
  return useQuery<SuratPeringatanRecord[]>({
    queryKey: ['indisipliner', 'sp', params],
    queryFn: async () => {
      const res = await apiClient.get<SuratPeringatanRecord[]>('/indisipliner/sp', { params });
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useCreateSp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SuratPeringatanRecord>) => {
      const res = await apiClient.post('/indisipliner/sp', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
    },
  });
}

export function useUpdateSpStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/indisipliner/sp/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
    },
  });
}

export function useDeleteSp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/indisipliner/sp/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
    },
  });
}

// === PENGELUARAN SISWA ===
export function useGetPengeluaran(params?: { search?: string }) {
  return useQuery<PengeluaranSiswaRecord[]>({
    queryKey: ['indisipliner', 'pengeluaran', params],
    queryFn: async () => {
      const res = await apiClient.get<PengeluaranSiswaRecord[]>('/indisipliner/pengeluaran', { params });
      return res.data;
    },
    staleTime: 30000,
  });
}

export function useCreatePengeluaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PengeluaranSiswaRecord>) => {
      const res = await apiClient.post('/indisipliner/pengeluaran', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeletePengeluaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/indisipliner/pengeluaran/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
