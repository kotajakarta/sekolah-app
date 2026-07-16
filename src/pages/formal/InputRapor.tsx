import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import { useToast } from '../../contexts/ToastContext';

export default function InputRapor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', studentName: '', subject: '', score: 0 });

  const { data: rapor, isLoading } = useQuery({
    queryKey: ['rapor'],
    queryFn: async () => {
      const res = await apiClient.get('/formal/rapor');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        return apiClient.put(`/formal/rapor/${data.id}`, {
          studentName: data.studentName,
          subject: data.subject,
          score: Number(data.score)
        });
      }
      return apiClient.post('/formal/rapor', {
        studentName: data.studentName,
        subject: data.subject,
        score: Number(data.score)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapor'] });
      setIsModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/formal/rapor/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapor'] });
      showToast('success', t('common.delete_success'));
    },
    onError: (error: any) => {
      if (error.response?.status === 400 || error.response?.data?.code?.startsWith('P2')) {
        showToast('error', t('common.delete_constraint_failed'));
      } else {
        showToast('error', error.response?.data?.message || t('common.delete_failed'));
      }
    }
  });

  const handleEdit = (item: any) => {
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({ id: '', studentName: '', subject: '', score: 0 });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t('formal.rapor_title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('formal.rapor_subtitle')}</p>
        </div>
        <button 
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('common.add')}
        </button>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : (
          <>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t('siswa.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Mata Pelajaran</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nilai</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(Array.isArray(rapor) ? rapor : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: any) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{item.studentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-blue-900 mr-4">{t('common.edit')}</button>
                    <button onClick={() => deleteMutation.mutate(item.id)} className="text-red-600 hover:text-red-900">{t('common.delete')}</button>
                  </td>
                </tr>
              ))}
              {rapor?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('common.no_data')}</td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((rapor?.length || 0) / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={rapor?.length || 0} 
            itemsPerPage={itemsPerPage} 
          />
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">{formData.id ? t('common.edit') : t('common.add')}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('siswa.name')}</label>
                <input type="text" value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
                <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nilai</label>
                <input type="number" value={formData.score} onChange={(e) => setFormData({...formData, score: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">{t('common.cancel')}</button>
              <button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
