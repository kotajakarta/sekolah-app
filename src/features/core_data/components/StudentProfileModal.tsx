import React from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, User, Phone, MapPin, Calendar, Activity, GraduationCap, Users, Printer, History } from 'lucide-react';
import { Student } from '../hooks/useGetStudents';
import { useTranslation } from 'react-i18next';
import PrintStudentProfile from './PrintStudentProfile';
import StudentClassHistoryModal from './StudentClassHistoryModal';
import { useState } from 'react';

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
  onEdit: () => void;
}

export default function StudentProfileModal({ student, onClose, onEdit }: StudentProfileModalProps) {
  const { t } = useTranslation();
  const [isClassHistoryOpen, setIsClassHistoryOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative transform rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-slate-200/60 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Profil Siswa
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <Printer className="h-4 w-4 mr-1.5 text-slate-500" />
                Cetak CV
              </button>
              <button
                onClick={() => setIsClassHistoryOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <History className="h-4 w-4 mr-1.5 text-slate-500" />
                Riwayat Kelas
              </button>
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-1.5 border border-indigo-200 shadow-sm text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <Edit2 className="h-4 w-4 mr-1.5" />
                {t('common.edit')}
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {/* Top Section: Photo & Basic Info */}
            <div className="p-6 bg-slate-50/50 flex flex-col md:flex-row gap-6 items-start border-b border-slate-100">
              <div className="shrink-0">
                {student.biodata?.fotoUrl ? (
                  <img 
                    src={`/api/v1${student.biodata.fotoUrl}`} 
                    alt={student.biodata.fullName} 
                    className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-slate-200 flex items-center justify-center border-4 border-white shadow-md">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1 mt-2">
                <h2 className="text-2xl font-bold text-slate-900">{student.biodata?.fullName}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                    <span className="font-semibold text-slate-500">NIK:</span> {student.biodata?.nik || '-'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                    <span className="font-semibold text-slate-500">NISN:</span> {student.biodata?.nisn || '-'}
                  </span>
                </div>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                    student.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {student.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                  <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                    Status Pool: {student.statusPool.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Grid 1: Personal Data */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" /> Data Pribadi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Tempat, Tanggal Lahir</span>
                    <span className="text-sm text-slate-900 font-medium">
                      {student.biodata?.tempatLahir || '-'}, {student.biodata?.tanggalLahir ? new Date(student.biodata.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Jenis Kelamin</span>
                    <span className="text-sm text-slate-900 font-medium">{student.biodata?.jenisKelamin === 'L' ? 'Laki-laki' : student.biodata?.jenisKelamin === 'P' ? 'Perempuan' : student.biodata?.jenisKelamin || '-'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Telepon</span>
                    <span className="text-sm text-slate-900 font-medium">{student.biodata?.phone || '-'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Kewarganegaraan</span>
                    <span className="text-sm text-slate-900 font-medium">{student.biodata?.kewarganegaraan || '-'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Anak Ke- / Jumlah Saudara</span>
                    <span className="text-sm text-slate-900 font-medium">
                      {(student.biodata as any)?.anakKe || '-'} / {(student.biodata as any)?.jumlahSaudara || '-'} bersaudara
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Nomor KK</span>
                    <span className="text-sm text-slate-900 font-medium">{(student.biodata as any)?.noKk || '-'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm md:col-span-2">
                    <span className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Alamat Lengkap</span>
                    <span className="text-sm text-slate-900 font-medium">{student.biodata?.address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Penempatan */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Penempatan & Akademik
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Wilayah</span>
                    <span className="text-sm text-slate-900 font-medium">{student.wilayah?.name || '-'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Cabang</span>
                    <span className="text-sm text-slate-900 font-medium">{student.cabang?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 3: Orang Tua */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" /> Data Orang Tua
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Data Ayah</h5>
                    <div>
                      <span className="block text-xs text-slate-500">Nama Lengkap</span>
                      <span className="text-sm text-slate-900 font-medium">{student.biodata?.namaAyah || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Status</span>
                      <span className="text-sm text-slate-900">{student.biodata?.statusHidupAyah || '-'}</span>
                    </div>
                    {student.biodata?.statusHidupAyah === 'Masih Hidup' && (
                      <>
                        <div>
                          <span className="block text-xs text-slate-500">NIK Ayah</span>
                          <span className="text-sm text-slate-900">{(student.biodata as any)?.nikAyah || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-slate-500">Tempat, Tanggal Lahir</span>
                          <span className="text-sm text-slate-900">
                            {(student.biodata as any)?.tempatLahirAyah || '-'}, {(student.biodata as any)?.tanggalLahirAyah ? new Date((student.biodata as any).tanggalLahirAyah).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-slate-500">Penghasilan rata-rata/bulan</span>
                          <span className="text-sm text-slate-900">{(student.biodata as any)?.penghasilanAyah || '-'}</span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="block text-xs text-slate-500">Pendidikan Terakhir</span>
                      <span className="text-sm text-slate-900">{student.biodata?.pendidikanAyah || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Pekerjaan Utama</span>
                      <span className="text-sm text-slate-900">{student.biodata?.pekerjaanAyah || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-3 border-l border-slate-200 pl-4 md:pl-6">
                    <h5 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Data Ibu</h5>
                    <div>
                      <span className="block text-xs text-slate-500">Nama Lengkap</span>
                      <span className="text-sm text-slate-900 font-medium">{student.biodata?.namaIbu || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Status</span>
                      <span className="text-sm text-slate-900">{student.biodata?.statusHidupIbu || '-'}</span>
                    </div>
                    {student.biodata?.statusHidupIbu === 'Masih Hidup' && (
                      <>
                        <div>
                          <span className="block text-xs text-slate-500">NIK Ibu</span>
                          <span className="text-sm text-slate-900">{(student.biodata as any)?.nikIbu || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-slate-500">Tempat, Tanggal Lahir</span>
                          <span className="text-sm text-slate-900">
                            {(student.biodata as any)?.tempatLahirIbu || '-'}, {(student.biodata as any)?.tanggalLahirIbu ? new Date((student.biodata as any).tanggalLahirIbu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-slate-500">Penghasilan rata-rata/bulan</span>
                          <span className="text-sm text-slate-900">{(student.biodata as any)?.penghasilanIbu || '-'}</span>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="block text-xs text-slate-500">Pendidikan Terakhir</span>
                      <span className="text-sm text-slate-900">{student.biodata?.pendidikanIbu || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Pekerjaan Utama</span>
                      <span className="text-sm text-slate-900">{student.biodata?.pekerjaanIbu || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
      </div>
      {/* Print View */}
      {createPortal(
        <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white z-[99999] m-0 p-0">
          <PrintStudentProfile student={student} />
        </div>,
        document.body
      )}

      {isClassHistoryOpen && (
        <StudentClassHistoryModal
          student={student}
          onClose={() => setIsClassHistoryOpen(false)}
        />
      )}
    </>
  );
}
