import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation } from 'react-i18next';

interface SiswaMuadalahModalProps {
  student: any;
  onClose: () => void;
}

export default function SiswaMuadalahModal({ student, onClose }: SiswaMuadalahModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    kelasId: '',
    isVerval: false,
  });

  const { data: kelasList } = useQuery({
    queryKey: ['kelas', student.cabangId],
    queryFn: async () => {
      const { data } = await apiClient.get('/formal/kelas');
      // only show kelas for this student's cabang
      return data.filter((k: any) => k.cabangId === student.cabangId && k.isActive);
    },
    enabled: !!student.cabangId,
  });

  useEffect(() => {
    if (student) {
      setFormData({
        nis: student.siswaFormal?.nis || student.biodata?.nisLokal || '',
        nisn: student.siswaFormal?.nisn || student.biodata?.nisn || '',
        kelasId: student.siswaFormal?.kelasId || '',
        isVerval: student.siswaFormal?.isVerval || false,
      });
    }
  }, [student]);

  const selectedKelas = kelasList?.find((k: any) => k.id === formData.kelasId);
  const tingkat = selectedKelas?.tingkat || student?.siswaFormal?.kelas?.tingkat || '';

  const biodata = student.biodata || {};
  const hasNisn = !!formData.nisn?.trim();
  const hasNik = !!biodata.nik?.trim();
  const hasNama = !!biodata.fullName?.trim();
  const hasTempatLahir = !!biodata.tempatLahir?.trim();
  const hasTanggalLahir = !!biodata.tanggalLahir;
  const hasNamaIbu = !!biodata.namaIbu?.trim();
  const hasJenisKelamin = !!biodata.jenisKelamin?.trim();
  const hasTingkat = !!tingkat?.trim();

  const canVerval = hasNisn && hasNik && hasNama && hasTempatLahir && hasTanggalLahir && hasNamaIbu && hasJenisKelamin && hasTingkat;

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiClient.put(`/formal/siswa/${student.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa-formal'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Double check canVerval if trying to set to true
    if (formData.isVerval && !canVerval) {
      showToast('error', 'Tidak dapat memverifikasi siswa. Harap lengkapi semua data wajib: NISN, NIK, Nama, Tempat/Tanggal Lahir, Nama Ibu, Jenis Kelamin, dan Tingkat.');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {t('formal.edit_academic_title') || 'Edit Data Akademik'}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900">{student.biodata?.fullName}</p>
                <p className="text-xs text-gray-500">{student.cabang?.name}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">NISN</label>
                  <input type="text" value={formData.nisn} onChange={(e) => setFormData({ ...formData, nisn: e.target.value })} className="mt-1.5 block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NIS Lokal</label>
                  <input type="text" value={formData.nis} onChange={(e) => setFormData({ ...formData, nis: e.target.value })} className="mt-1.5 block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kelas</label>
                  <select value={formData.kelasId} onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })} className="mt-1.5 block w-full rounded-md border-gray-300 border py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-indigo-500">
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList?.map((k: any) => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      disabled={!canVerval}
                      checked={formData.isVerval} 
                      onChange={(e) => setFormData({ ...formData, isVerval: e.target.checked })}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 disabled:opacity-40"
                    />
                    <span className={`text-sm font-semibold ${!canVerval ? 'text-gray-400' : 'text-slate-800'}`}>
                      Sudah Verval ? (Ceklis data valid)
                    </span>
                  </label>
                  {!canVerval && (
                    <p className="text-[11px] text-rose-500 mt-1 leading-normal">
                      * Verval dapat diceklis jika data lengkap: NISN, NIK, Nama, Tempat/Tanggal Lahir, Ibu Kandung, Jenis Kelamin, dan Tingkat Kelas.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
