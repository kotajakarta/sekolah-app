import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Plus, UserMinus, UserPlus, Edit2, Trash2, Search, User, AlertCircle } from 'lucide-react';
import { useGetStudents, Student } from '../../features/core_data/hooks/useGetStudents';
import LepasSiswaModal from '../../features/core_data/components/LepasSiswaModal';
import LepasSiswaMassalModal from '../../features/core_data/components/LepasSiswaMassalModal';
import TarikSiswaMassalModal from '../../features/core_data/components/TarikSiswaMassalModal';
import StudentModal from '../../features/core_data/components/StudentModal';
import StudentProfileModal from '../../features/core_data/components/StudentProfileModal';
import KelengkapanSiswaModal from '../../features/core_data/components/KelengkapanSiswaModal';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import NotificationModal from '../../components/NotificationModal';
import AdvancedFilterBar, { FilterState } from '../../components/AdvancedFilterBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

const calculateProgress = (student: any) => {
  if (!student || !student.biodata) return 0;
  const biodata = student.biodata;
  const fields = [
    biodata.fullName,
    biodata.nik,
    biodata.nisn,
    biodata.tempatLahir,
    biodata.tanggalLahir,
    biodata.jenisKelamin,
    biodata.namaIbu,
    biodata.namaAyah,
    biodata.phone,
    biodata.address || biodata.alamatJalan,
    biodata.fotoBase64,
    biodata.ijazahBase64,
    biodata.kkBase64
  ];
  const filled = fields.filter(val => val !== null && val !== undefined && val !== '').length;
  return Math.round((filled / fields.length) * 100);
};

export default function DataSiswa() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  
  const { user } = useAuth();
  
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    wilayahId: user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user?.wilayahId || '' : '',
    cabangId: user?.scope === 'CABANG' ? user?.cabangId || '' : '',
    kelasId: '',
    lembagaMuadalahId: '',
    jenisDaimi: '',
    tingkat: ''
  });

  const isAdmin = user?.scope === 'GLOBAL';
  const queryClient = useQueryClient();

  const { data: students, isLoading, isError } = useGetStudents();
  const [studentToLepas, setStudentToLepas] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToView, setStudentToView] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentForKelengkapan, setSelectedStudentForKelengkapan] = useState<Student | null>(null);
  const [isTarikModalOpen, setIsTarikModalOpen] = useState(false);
  const [isLepasMassalOpen, setIsLepasMassalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (students && students.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const viewId = searchParams.get('viewId');
      if (viewId) {
        const student = students.find((s: Student) => s.id === viewId);
        if (student) {
          setStudentToView(student);
          // Remove viewId from URL without reloading
          searchParams.delete('viewId');
          navigate({ search: searchParams.toString() }, { replace: true });
        }
      }
    }
  }, [students, location.search, navigate]);

  const filteredStudents = (Array.isArray(students) ? students : []).filter((s: Student) => {
    // Advanced filters
    if (advancedFilters.wilayahId && s.wilayahId !== advancedFilters.wilayahId) return false;
    if (advancedFilters.cabangId && s.cabangId !== advancedFilters.cabangId) return false;
    if (advancedFilters.kelasId && s.siswaFormal?.kelasId !== advancedFilters.kelasId) return false;
    if (advancedFilters.lembagaMuadalahId && s.siswaFormal?.kelas?.lembagaMuadalah?.id !== advancedFilters.lembagaMuadalahId) return false;
    if (advancedFilters.jenisDaimi && s.dataDaimi?.grup?.jenis !== advancedFilters.jenisDaimi) return false;
    if (advancedFilters.tingkat && s.siswaFormal?.kelas?.tingkat !== advancedFilters.tingkat) return false;

    // Search query
    const q = searchQuery.toLowerCase();
    if (q) {
      return s.biodata?.fullName?.toLowerCase().includes(q) ||
             s.biodata?.nik?.toLowerCase().includes(q) ||
             s.biodata?.nisn?.toLowerCase().includes(q);
    }
    return true;
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete('/students/all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Berhasil menghapus semua data siswa',
      });
      setIsConfirmDeleteAllOpen(false);
    },
    onError: (error: any) => {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus semua data siswa',
      });
      setIsConfirmDeleteAllOpen(false);
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Berhasil menghapus data siswa',
      });
      setStudentToDelete(null);
    },
    onError: (error: any) => {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Gagal menghapus data siswa',
      });
      setStudentToDelete(null);
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
          <p className="text-sm text-slate-500 mt-1.5">{t('siswa.subtitle')}</p>
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
              Tarik Data Siswa
            </button>
          )}
          <button 
            onClick={() => setIsLepasMassalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-amber-200 shadow-sm text-sm font-medium rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <UserMinus className="w-4 h-4 mr-2" />
            Lepas Massal
          </button>
          <button onClick={handleAdd} className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            {t('siswa.add_button')}
          </button>
        </div>
      </div>
      
      <AdvancedFilterBar 
        onFilterChange={setAdvancedFilters} 
        userScope={user?.scope || ''} 
        userWilayahId={user?.wilayahId} 
        userCabangId={user?.cabangId}
        showDaimiFilter={true}
        showTingkatFilter={true}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/70 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIK, atau NISN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">{t('common.failed')}</div>
        ) : filteredStudents && filteredStudents.length > 0 ? (<>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">No</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest w-16">Foto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('siswa.name')} & NIK</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('wilayah.region_name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('cabang.branch_name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Akademik</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Kelengkapan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredStudents
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((student, idx) => {
                    const progress = calculateProgress(student);
                    return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {student.biodata?.fotoBase64 ? (
                          <div className="relative inline-block">
                            <img
                              src={student.biodata.fotoBase64}
                              alt="Foto Siswa"
                              className={`w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 ${
                                student.biodata?.jenisKelamin === 'PEREMPUAN' ? 'blur-sm' : ''
                              }`}
                            />
                            {student.biodata?.jenisKelamin === 'PEREMPUAN' && (
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-sm pointer-events-none">🔒</span>
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800">{student.biodata?.fullName}</div>
                        <div className="text-xs text-slate-500">
                          NIK: {student.biodata?.nik || '-'} 
                          {student.biodata?.nisn ? ` | NISN: ${student.biodata.nisn}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {student.wilayah?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {student.cabang?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                        <div className="flex flex-wrap gap-1 items-center">
                          {student.siswaFormal?.kelas ? (
                            <>
                              {student.siswaFormal.kelas.tingkat && student.siswaFormal.kelas.tingkat !== 'Non Muadalah' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                                  {student.siswaFormal.kelas.tingkat}
                                </span>
                              )}
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                {student.siswaFormal.kelas.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 font-normal">Belum ada kelas</span>
                          )}
                        </div>
                        {student.dataDaimi?.grup?.jenis ? (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Daimi: {student.dataDaimi.grup.jenis}
                            </span>
                          </div>
                        ) : student.grupDaimi ? (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Daimi: {student.grupDaimi}
                            </span>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                progress === 100 ? 'bg-green-500' :
                                progress >= 75 ? 'bg-emerald-500' :
                                progress >= 50 ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{progress}%</span>
                          {progress < 100 && (
                            <button
                              onClick={() => setSelectedStudentForKelengkapan(student)}
                              className="text-amber-500 hover:text-amber-600 transition-colors p-0.5 rounded hover:bg-amber-50 focus:outline-none"
                              title="Lihat data yang kurang"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 w-fit ${
                            student.statusPool === 'AKTIF_CABANG' ? 'bg-green-100 text-green-800' :
                            student.statusPool === 'TERSEDIA' ? 'bg-blue-100 text-blue-800' :
                            student.statusPool === 'MUTASI' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {student.statusPool.replace('_', ' ')}
                          </span>
                          {!student.isActive && (
                            <span className="inline-flex rounded-full px-2 text-[10px] font-semibold leading-4 bg-red-100 text-red-700 w-fit">
                              Tidak Aktif
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                        <button
                          onClick={() => setStudentToView(student)}
                          className="inline-flex items-center justify-center p-1.5 border border-slate-200 shadow-sm rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                          title="Profil Siswa"
                        >
                          <User className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          className="inline-flex items-center justify-center p-1.5 border border-indigo-200 shadow-sm rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          title={t('common.edit') || "Edit"}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {student.statusPool === 'AKTIF_CABANG' && (
                          <button
                            onClick={() => setStudentToLepas(student)}
                            className="inline-flex items-center justify-center p-1.5 border border-amber-200 shadow-sm rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                            title="Lepas Siswa"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="inline-flex items-center justify-center p-1.5 border border-red-200 shadow-sm rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(filteredStudents.length / itemsPerPage)}
            onPageChange={setCurrentPage} 
            totalItems={filteredStudents.length}
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

      {isLepasMassalOpen && (
        <LepasSiswaMassalModal
          students={filteredStudents}
          onClose={() => setIsLepasMassalOpen(false)}
        />
      )}

      {studentToView && (
        <StudentProfileModal
          student={studentToView}
          onClose={() => setStudentToView(null)}
          onEdit={() => {
            handleEdit(studentToView);
            setStudentToView(null);
          }}
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
        requireInput="HAPUS"
      />

      <ConfirmModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudentMutation.mutate(studentToDelete.id);
          }
        }}
        title="Konfirmasi Hapus Siswa"
        message={`Apakah Anda yakin ingin menghapus data siswa "${studentToDelete?.biodata?.fullName}" secara permanen? Aksi ini tidak dapat dibatalkan.`}
      />

      {selectedStudentForKelengkapan && (
        <KelengkapanSiswaModal
          student={selectedStudentForKelengkapan}
          onClose={() => setSelectedStudentForKelengkapan(null)}
        />
      )}

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
