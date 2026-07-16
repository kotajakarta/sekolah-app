import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Trash2, Loader2, Upload, FileText } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

interface Kalender {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export default function KelolaKalender() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: list, isLoading } = useQuery<Kalender[]>({
    queryKey: ['kalender'],
    queryFn: async () => {
      const res = await apiClient.get('/pengaturan/kalender');
  const { showToast } = useToast();
      return res.data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      await apiClient.post('/pengaturan/kalender', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['kalender'] }); 
      setFile(null); 
      setTitle(''); 
      showToast('success', 'Kalender berhasil diupload');
    },
    onError: () => showToast('error', 'Gagal mengupload kalender')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/pengaturan/kalender/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['kalender'] }); setIsConfirmOpen(false); }
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Kalender Akademik</h1>
        <p className="text-sm text-slate-500 mt-1.5">Upload dokumen Kalender Pendidikan (PDF).</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Dokumen</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none" placeholder="Contoh: Kalender Pendidikan 2026/2027" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">File PDF</label>
              <input type="file" required accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={!file || uploadMutation.isPending} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
              {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Upload Kalender
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div> : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Dokumen</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tanggal Upload</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list?.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-red-500 mr-3" />
                      <div>
                        <div className="font-medium text-slate-800">{item.title}</div>
                        <a href={`/api/v1/pengaturan${item.fileUrl}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">Lihat File</a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => { setDeleteId(item.id); setIsConfirmOpen(true); }} className="inline-flex items-center px-2 py-1 text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 text-xs font-medium">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {list?.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">Belum ada kalender yang diupload.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={() => { if(deleteId) deleteMutation.mutate(deleteId); }} title="Hapus Dokumen" message="Yakin ingin menghapus kalender akademik ini?" />
    </div>
  );
}
