import React, { useState } from 'react';
import { Users, Plus, UserMinus, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { useGetStudents, Student } from '../../features/core_data/hooks/useGetStudents';
import LepasSiswaModal from '../../features/core_data/components/LepasSiswaModal';
import TarikSiswaMassalModal from '../../features/core_data/components/TarikSiswaMassalModal';
import StudentModal from '../../features/core_data/components/StudentModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

export default function DataSiswa() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';
  const queryClient = useQueryClient();

  const { data: students, isLoading, isError } = useGetStudents();
  const [studentToLepas, setStudentToLepas] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isTarikModalOpen, setIsTarikModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const { t } = useTranslation();

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/students/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      alert('Berhasil menghapus semua data siswa');
      setIsConfirmDeleteAllOpen(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Gagal menghapus semua data siswa');
      setIsConfirmDeleteAllOpen(false);
    }
  });

  const handleAdd = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{t('siswa.title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5.5">{t('siswa.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && students && students.length > 0 && (
            <button 
              onClick={() => setIsConfirmDeleteAllOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </button>
          )}
          {(user?.scope === 'CABANG' || user?.scope === 'WILAYAH') && (
            <button 
              onClick={() => setIsTarikModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-medium rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Tarik dari Pool
            </button>
          )}
          <button onClick={handleAdd} className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            {t('siswa.add_button')}
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
        ) : students && students.length > 0 ? (<>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('siswa.name')} & NIK</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('wilayah.region_name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('cabang.branch_name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {(Array.isArray(students) ? students : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{student.biodata?.fullName}</div>
                      <div className="text-xs text-slate-500">NIK: {student.biodata?.nik || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {student.wilayah?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {student.cabang?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        student.statusPool === 'AKTIF_CABANG' ? 'bg-green-100 text-green-800' :
                        student.statusPool === 'TERSEDIA' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {student.statusPool.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(student)}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 shadow-sm text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mr-2"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        {t('common.edit')}
                      </button>
                      {student.statusPool === 'AKTIF_CABANG' && (
                        <button
                          onClick={() => setStudentToLepas(student)}
                          className="inline-flex items-center px-3 py-1.5 border border-amber-200 shadow-sm text-xs font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                        >
                          <UserMinus className="h-3.5 w-3.5 mr-1" />
                          Lepas
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((students?.length || 0) / itemsPerPage)} 
            onPageChange={setCurrentPage} 
            totalItems={students?.length || 0} 
            itemsPerPage={itemsPerPage} 
          />
        </>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-slate-100">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-800">{t('siswa.no_data_title')}</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
              {t('siswa.no_data_desc')}
            </p>
          </div>
        )}
      </div>

      {studentToLepas && (
        <LepasSiswaModal
          student={studentToLepas}
          onClose={() => setStudentToLepas(null)}
        />
      )}

      {isTarikModalOpen && (
        <TarikSiswaMassalModal
          onClose={() => setIsTarikModalOpen(false)}
        />
      )}

      {isStudentModalOpen && (
        <StudentModal
          student={studentToEdit}
          onClose={() => setIsStudentModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={() => deleteAllMutation.mutate()}
        title="Konfirmasi Hapus Semua Siswa"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data siswa? Aksi ini akan menghapus data siswa secara permanen beserta data riwayat dan kehadirannya."
      />
    </div>
  );
}
