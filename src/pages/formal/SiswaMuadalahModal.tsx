import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { X, Loader2 } from 'lucide-react';

interface SiswaMuadalahModalProps {
  student: any;
  onClose: () => void;
}

export default function SiswaMuadalahModal({ student, onClose }: SiswaMuadalahModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    kelasId: '',
  });

  const { data: kelasList } = useQuery({
    queryKey: ['kelas', student.cabangId],
    queryFn: async () => {
      const { data } = await apiClient.get('/formal/kelas');
      // only show kelas for this student's cabang
      return data.filter((k: any) => k.cabangId === student.cabangId);
    },
    enabled: !!student.cabangId,
  });

  useEffect(() => {
    if (student?.siswaFormal) {
      setFormData({
        nis: student.siswaFormal.nis || '',
        nisn: student.siswaFormal.nisn || '',
        kelasId: student.siswaFormal.kelasId || '',
      });
    }
  }, [student]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiClient.put(`/formal/siswa/${student.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa-formal'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Edit Data Akademik
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900">{student.biodata?.fullName}</p>
                <p className="text-xs text-gray-500">{student.cabang?.name}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">NISN</label>
                  <input type="text" value={formData.nisn} onChange={(e) => setFormData({ ...formData, nisn: e.target.value })} className="mt-1.5 block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIS Lokal</label>
                  <input type="text" value={formData.nis} onChange={(e) => setFormData({ ...formData, nis: e.target.value })} className="mt-1.5 block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kelas</label>
                  <select value={formData.kelasId} onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })} className="mt-1.5 block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-indigo-500">
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList?.map((k: any) => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
