import React, { useState } from 'react';
import { Users, Edit2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import SiswaMuadalahModal from './SiswaMuadalahModal';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';

export default function DataSiswaMuadalah() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [studentToEdit, setStudentToEdit] = useState<any>(null);
  const { t } = useTranslation();

  const { data: students, isLoading } = useQuery({
    queryKey: ['siswa-formal'],
    queryFn: async () => {
      const { data } = await apiClient.get('/formal/siswa');
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t('formal.siswa_title')}</h1>
          <p className="text-sm text-slate-500 mt-1.5">{t('formal.siswa_subtitle')}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : students && students.length > 0 ? (<>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('siswa.name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">NIS (Lokal)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Kelas</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('cabang.branch_name')}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {(Array.isArray(students) ? students : [])?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{student.biodata?.fullName}</div>
                      <div className="text-xs text-slate-500">NISN: {student.biodata?.nisn || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {student.siswaFormal?.nis || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {student.siswaFormal?.kelas?.name || 'Belum ada kelas'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {student.cabang?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setStudentToEdit(student)}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 shadow-sm text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors mr-2"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        {t('common.edit')} Akademik
                      </button>
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

      {studentToEdit && (
        <SiswaMuadalahModal
          student={studentToEdit}
          onClose={() => setStudentToEdit(null)}
        />
      )}
    </div>
  );
}
