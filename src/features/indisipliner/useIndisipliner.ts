import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  PelanggaranRecord,
  SuratPeringatanRecord,
  PengeluaranSiswaRecord,
  StatusPelanggaran,
  IndisiplinerStats,
} from './types';

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
export function useGetPelanggaran(params?: {
  search?: string;
  kategori?: string;
  status?: string;
  wilayahId?: string;
  cabangId?: string;
  kelasId?: string;
}) {
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

export function useUpdatePelanggaranStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'DISETUJUI' | 'DITOLAK' }) => {
      const res = await apiClient.patch(`/indisipliner/pelanggaran/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
    },
  });
}

export function useUpdatePelanggaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PelanggaranRecord> }) => {
      const res = await apiClient.put(`/indisipliner/pelanggaran/${id}`, data);
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
export function useGetSp(params?: {
  search?: string;
  tingkat?: string;
  statusApproval?: string;
  wilayahId?: string;
  cabangId?: string;
  kelasId?: string;
}) {
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

export function useUpdateSpStatusApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statusApproval }: { id: string; statusApproval: StatusPelanggaran }) => {
      const res = await apiClient.patch(`/indisipliner/sp/${id}/status-approval`, { statusApproval });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
    },
  });
}

export function useUpdateSp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SuratPeringatanRecord> }) => {
      const res = await apiClient.put(`/indisipliner/sp/${id}`, data);
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
export function useGetPengeluaran(params?: {
  search?: string;
  status?: string;
  wilayahId?: string;
  cabangId?: string;
  kelasId?: string;
}) {
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

export function useUpdatePengeluaranStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusPelanggaran }) => {
      const res = await apiClient.patch(`/indisipliner/pengeluaran/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indisipliner'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdatePengeluaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PengeluaranSiswaRecord> }) => {
      const res = await apiClient.put(`/indisipliner/pengeluaran/${id}`, data);
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

// === UPLOAD BERKAS SP & PENGELUARAN (PDF / GAMBAR) ===
export function useUploadIndisiplinerDoc() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<{ url: string; filename: string; ukuranDokumen: string }>(
        '/indisipliner/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data;
    },
  });
}

// === DOWNLOAD TEMPLATE DOCX ===
export const downloadSpTemplateDocx = async (tingkat: string, id?: string) => {
  const url = `/indisipliner/template/sp/${encodeURIComponent(tingkat)}${id ? `?id=${encodeURIComponent(id)}` : ''}`;
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = id ? `Surat_Peringatan_${tingkat.replace(/\s+/g, '_')}.docx` : `Template_SP_${tingkat.replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

export const downloadPengeluaranTemplateDocx = async (id?: string) => {
  const url = `/indisipliner/template/pengeluaran${id ? `?id=${encodeURIComponent(id)}` : ''}`;
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = id ? 'SK_Pengeluaran_Santri.docx' : 'Template_SK_Pengeluaran_Santri.docx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};
