import React, { useState, useEffect } from 'react';
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
import { useToast } from '../../../contexts/ToastContext';
import AdvancedFilterBar, { FilterState } from '../../../components/AdvancedFilterBar';
import { useTranslation } from 'react-i18next';

export default function StudentPoolTable() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [inputQuery, setInputQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  // Debounce: only update searchQuery (used for API call) after user stops typing for 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputQuery]);

  const { data: students, isLoading, isError } = useGetPoolStudents(searchQuery);
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.scope === 'GLOBAL';
  const queryClient = useQueryClient();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToTarik, setStudentToTarik] = useState<Student | null>(null);

  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    wilayahId: '',
    cabangId: '',
    kelasId: '',
    lembagaMuadalahId: ''
  });

  const filteredStudents = (Array.isArray(students) ? students : []).filter(s => {
    // Advanced filters: check direct cabang/wilayah OR last riwayat cabang/wilayah
    if (advancedFilters.wilayahId) {
      const studentWilayahId = s.wilayahId || s.riwayatPendidikan?.[0]?.cabang?.wilayahId;
      if (studentWilayahId !== advancedFilters.wilayahId) return false;
    }
    if (advancedFilters.cabangId) {
      const studentCabangId = s.cabangId || s.riwayatPendidikan?.[0]?.cabangId;
      if (studentCabangId !== advancedFilters.cabangId) return false;
    }
    if (advancedFilters.kelasId && s.siswaFormal?.kelasId !== advancedFilters.kelasId) return false;
    if (advancedFilters.lembagaMuadalahId && s.siswaFormal?.kelas?.lembagaMuadalah?.id !== advancedFilters.lembagaMuadalahId) return false;

    // Search query (server-side handles the filtering already, client-side is just safety net)
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      const name = s.biodata?.fullName?.toLowerCase() || '';
      const nik = s.biodata?.nik?.toLowerCase() || '';
      const nisn = s.biodata?.nisn?.toLowerCase() || '';
      const nisLokal = (s.biodata as any)?.nisLokal?.toLowerCase() || '';
      return words.every(w => name.includes(w) || nik.includes(w) || nisn.includes(w) || nisLokal.includes(w));
    }
    return true;
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/students/pool/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', 'pool'] });
      showToast('success', 'Berhasil menghapus semua data pool siswa');
      setIsConfirmDeleteAllOpen(false);
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Gagal menghapus data pool siswa');
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
        <h2 className="text-lg font-semibold text-gray-900">{t('pool_siswa.title') || 'Data Pool Siswa'}</h2>
        <div className="flex items-center gap-4">
          {isAdmin && students && students.length > 0 && (
            <button 
              onClick={() => setIsConfirmDeleteAllOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-200 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('common.delete_all') || 'Hapus Semua'}
            </button>
          )}
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {students?.length || 0} Siswa Tersedia
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 pb-0">
        <AdvancedFilterBar 
          onFilterChange={setAdvancedFilters} 
          userScope={user?.scope || ''} 
          userWilayahId={user?.wilayahId} 
          userCabangId={user?.cabangId} 
        />
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama, NIK, atau NISN... (tekan Enter atau berhenti mengetik)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  Tidak ada siswa di pool saat ini.
                </td>
              </tr>
            ) : (
              filteredStudents
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((student, idx) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-400">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.biodata?.fullName}</div>
                    <div className="text-xs text-gray-500">NIK: {student.biodata?.nik || '-'} {student.biodata?.nisn ? `| NISN: ${student.biodata.nisn}` : ''}</div>
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
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                          student.statusPool === 'AKTIF_CABANG' 
                            ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        {student.statusPool === 'AKTIF_CABANG' ? 'Minta ke Pusat' : 'Tarik ke Cabang'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="text-sm text-gray-500">
          Total {filteredStudents.length} siswa
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={Math.ceil(filteredStudents.length / itemsPerPage)} 
          onPageChange={setCurrentPage} 
          totalItems={filteredStudents.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>
      </div>
      
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
