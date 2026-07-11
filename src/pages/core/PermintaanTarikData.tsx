import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { Database, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';

export default function PermintaanTarikData() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['permintaan-tarik'],
    queryFn: async () => {
      const { data } = await apiClient.get('/students/permintaan-tarik');
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/students/permintaan-tarik/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan-tarik'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      alert('Permintaan disetujui');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menyetujui permintaan');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/students/permintaan-tarik/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permintaan-tarik'] });
      alert('Permintaan ditolak');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Gagal menolak permintaan');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Permintaan Tarik Data</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Kelola permintaan penarikan data siswa antar cabang
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : requests && requests.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Siswa</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang Peminta</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang Asal</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                    {user?.scope === 'GLOBAL' && (
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((req: any) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800">{req.student?.biodata?.fullName}</div>
                        <div className="text-xs text-slate-500">NISN: {req.student?.biodata?.nisn || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {req.requestingCabang?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {req.targetCabang?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      {user?.scope === 'GLOBAL' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => { if(confirm('Setujui permintaan?')) approveMutation.mutate(req.id) }}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                className="inline-flex items-center px-3 py-1.5 border border-green-200 shadow-sm text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none transition-colors mr-2 disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Setujui
                              </button>
                              <button
                                onClick={() => { if(confirm('Tolak permintaan?')) rejectMutation.mutate(req.id) }}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                className="inline-flex items-center px-3 py-1.5 border border-red-200 shadow-sm text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none transition-colors disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5 mr-1" /> Tolak
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil((requests?.length || 0) / itemsPerPage)} 
              onPageChange={setCurrentPage} 
              totalItems={requests?.length || 0} 
              itemsPerPage={itemsPerPage} 
            />
          </>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
              <Database className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800">Tidak ada data</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
              Belum ada permintaan penarikan data siswa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
