import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Pagination from '../../components/Pagination';
import UserModal from './UserModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManajemenUser() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      alert(t('common.delete_success'));
    },
    onError: (error: any) => {
      if (error.response?.status === 400 || error.response?.data?.code?.startsWith('P2')) {
        alert(t('common.delete_constraint_failed'));
      } else {
        alert(error.response?.data?.message || t('common.delete_failed'));
      }
    }
  });

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleEdit = (user: any) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Manajemen User</h1>
          <p className="text-sm text-slate-500 mt-1.5">Kelola hak akses pengguna, wilayah, dan cabang</p>
        </div>
        <button 
          onClick={handleAdd}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
        ) : users && users.length > 0 ? (<>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Username</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Scope</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Divisi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Wilayah</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {(Array.isArray(users) ? users : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{item.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.scope}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.divisi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.wilayah?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.cabang?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-blue-900 mr-4">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => confirmDelete(item.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((users?.length || 0) / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={users?.length || 0} 
            itemsPerPage={itemsPerPage} 
          />
        </>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800">Belum Ada User</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
              Tambahkan user baru untuk memberikan hak akses.
            </p>
          </div>
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus user ini? Aksi ini tidak dapat dibatalkan."
      />
    </div>
  );
}
