import React, { useState } from 'react';
import { useGetPoolStudents } from '../hooks/usePoolStudents';
import { useAuth } from '../../../hooks/useAuth';
import { Student } from '../hooks/useGetStudents';
import StudentHistoryModal from './StudentHistoryModal';
import TarikSiswaModal from './TarikSiswaModal';
import { History, UserPlus, Trash2 } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';

export default function StudentPoolTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const { data: students, isLoading, isError } = useGetPoolStudents();
  const { user } = useAuth();
  const isAdmin = user?.scope === 'GLOBAL';
  const queryClient = useQueryClient();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToTarik, setStudentToTarik] = useState<Student | null>(null);

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/students/pool/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pool-students'] });
      alert('Berhasil menghapus semua data pool siswa');
      setIsConfirmDeleteAllOpen(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Gagal menghapus data pool siswa');
      setIsConfirmDeleteAllOpen(false);
    }
  });

  const executeDeleteAll = () => {
    deleteAllMutation.mutate();
  };

  if (isLoading) return <div className="p-4 text-center text-gray-500">Loading pool data...</div>;
  if (isError) return <div className="p-4 text-center text-red-500">Failed to load pool data.</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Data Pool Siswa</h2>
        <div className="flex items-center gap-4">
          {isAdmin && students && students.length > 0 && (
            <button 
              onClick={() => setIsConfirmDeleteAllOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Semua
            </button>
          )}
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {students?.length || 0} Siswa Tersedia
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  Tidak ada siswa di pool saat ini.
                </td>
              </tr>
            ) : (
              (Array.isArray(students) ? students : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.biodata?.fullName}</div>
                    <div className="text-xs text-gray-500">ID: {student.id.substring(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.wilayah?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.biodata?.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <History className="h-3.5 w-3.5 mr-1" />
                        Riwayat
                      </button>
                      
                      <button
                        onClick={() => setStudentToTarik(student)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Tarik ke Cabang
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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

      {selectedStudent && (
        <StudentHistoryModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {studentToTarik && (
        <TarikSiswaModal
          student={studentToTarik}
          onClose={() => setStudentToTarik(null)}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={executeDeleteAll}
        title="Konfirmasi Hapus Semua Siswa di Pool"
        message="PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data siswa yang ada di dalam pool? Aksi ini akan menghapus data siswa secara permanen dan tidak dapat dibatalkan."
      />
    </div>
  );
}
