import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Student } from '../hooks/useGetStudents';

interface KelengkapanSiswaModalProps {
  student: Student;
  onClose: () => void;
}

export default function KelengkapanSiswaModal({ student, onClose }: KelengkapanSiswaModalProps) {
  const biodata = student?.biodata;

  const fieldsToCheck = [
    { key: 'fullName', label: 'Nama Lengkap', value: biodata?.fullName },
    { key: 'nik', label: 'NIK', value: biodata?.nik },
    { key: 'nisn', label: 'NISN', value: biodata?.nisn },
    { key: 'tempatLahir', label: 'Tempat Lahir', value: biodata?.tempatLahir },
    { key: 'tanggalLahir', label: 'Tanggal Lahir', value: biodata?.tanggalLahir },
    { key: 'jenisKelamin', label: 'Jenis Kelamin', value: biodata?.jenisKelamin },
    { key: 'namaIbu', label: 'Nama Ibu Kandung', value: biodata?.namaIbu },
    { key: 'namaAyah', label: 'Nama Ayah', value: biodata?.namaAyah },
    { key: 'phone', label: 'No. Telepon', value: biodata?.phone },
    { key: 'address', label: 'Alamat', value: biodata?.address || biodata?.alamatJalan },
    { key: 'fotoUrl', label: 'Upload Foto', value: biodata?.fotoUrl, isFile: true },
    { key: 'ijazahUrl', label: 'Upload Ijazah', value: biodata?.ijazahUrl, isFile: true },
    { key: 'kkUrl', label: 'Upload Kartu Keluarga (KK)', value: biodata?.kkUrl, isFile: true },
  ];

  const missingFields = fieldsToCheck.filter(
    (field) => field.value === null || field.value === undefined || field.value === ''
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          {/* Header */}
          <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Kelengkapan Data Siswa
            </h3>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-slate-500">
                Berikut adalah daftar data yang kurang/belum lengkap untuk siswa:
              </p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {biodata?.fullName || 'Siswa Tanpa Nama'}
              </p>
            </div>

            {missingFields.length > 0 ? (
              <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {missingFields.map((field) => (
                  <div 
                    key={field.key} 
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50/50 border border-rose-100/80 text-rose-900 text-sm font-medium"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span>{field.label}</span>
                    {field.isFile && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-semibold ml-auto uppercase tracking-wider">
                        Dokumen
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-800">Semua Data Lengkap</p>
                <p className="text-xs text-slate-500 mt-1">Tidak ada data atau dokumen yang kurang.</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
