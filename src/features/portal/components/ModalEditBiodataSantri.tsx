import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import {
  X,
  Loader2,
  Save,
  User,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { normalizeTurkish, sanitizeTurkishDeep } from '../../../utils/text';
import { wilayahService, findMatchingWilayah, normalizeWilayahCode, WilayahItem } from '../../../services/wilayah.service';

const PENDIDIKAN_OPTIONS = [
  'SD/Sederajat',
  'SMP/Sederajat',
  'SMA/Sederajat',
  'D1',
  'D2',
  'D3',
  'D4/S1',
  'S2',
  'S3',
  'Tidak Bersekolah',
  'Lainnya'
];

const PEKERJAAN_OPTIONS = [
  'Tidak Bekerja',
  'Pensiunan',
  'PNS',
  'TNI/Polisi',
  'Guru/Dosen',
  'Pegawai Swasta',
  'Wiraswasta',
  'Pengacara/Jaksa/Hakim/Notaris',
  'Seniman/Pelukis/Artis/Sejenis',
  'Dokter/Bidan/Perawat',
  'Pilot/Pramugara',
  'Pedagang',
  'Petani/Peternak',
  'Nelayan',
  'Buruh (Tani/Pabrik/Bangunan)',
  'Sopir/Masinis/Kondektur',
  'Politikus',
  'Lainnya'
];

const PENGHASILAN_OPTIONS = [
  'dibawah 800.000',
  '800.001 - 1.200.000',
  '1.200.001 - 1.800.000',
  '1.800.001 - 2.500.000',
  '2.500.001 - 3.500.000',
  '3.500.001 - 4.800.000',
  '4.800.001 - 6.500.000',
  '6.500.001 - 10.000.000',
  '10.000.001 - 20.000.000',
  'diatas 20.000.001'
];

interface ModalEditBiodataSantriProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  initialBiodata: any;
}

export default function ModalEditBiodataSantri({
  isOpen,
  onClose,
  studentId,
  initialBiodata
}: ModalEditBiodataSantriProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'diri' | 'ortu' | 'alamat' | 'dokumen'>('diri');
  const [formData, setFormData] = useState<any>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State dropdown wilayah
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  // Load provinces on modal open
  useEffect(() => {
    if (isOpen) {
      wilayahService.getProvinces()
        .then(setProvinces)
        .catch(console.error);
    }
  }, [isOpen]);

  // Cascading fetch: Regencies when Provinsi changes
  useEffect(() => {
    if (formData.alamatProvId) {
      wilayahService.getRegencies(formData.alamatProvId)
        .then(setRegencies)
        .catch(console.error);
    } else {
      setRegencies([]);
    }
  }, [formData.alamatProvId]);

  // Cascading fetch: Districts when Kabupaten changes
  useEffect(() => {
    if (formData.alamatKabId) {
      wilayahService.getDistricts(formData.alamatKabId)
        .then(setDistricts)
        .catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [formData.alamatKabId]);

  // Cascading fetch: Villages when Kecamatan changes
  useEffect(() => {
    if (formData.alamatKecId) {
      wilayahService.getVillages(formData.alamatKecId)
        .then(setVillages)
        .catch(console.error);
    } else {
      setVillages([]);
    }
  }, [formData.alamatKecId]);

  // Initialize data strictly aligned with /daftar-ulang
  useEffect(() => {
    if (initialBiodata) {
      setFormData({
        // 1. Data Diri
        fullName: initialBiodata.fullName || '',
        nik: initialBiodata.nik || '',
        noKk: initialBiodata.noKk || '',
        anakKe: initialBiodata.anakKe || '',
        jumlahSaudara: initialBiodata.jumlahSaudara || '',
        nisn: initialBiodata.nisn || '',
        phone: initialBiodata.phone || '',
        tempatLahir: initialBiodata.tempatLahir || '',
        tanggalLahir: initialBiodata.tanggalLahir
          ? new Date(initialBiodata.tanggalLahir).toISOString().split('T')[0]
          : '',
        jenisKelamin: initialBiodata.jenisKelamin || 'L',
        kewarganegaraan: initialBiodata.kewarganegaraan || 'WNI',

        // 2. Data Orang Tua - Ayah
        namaAyah: initialBiodata.namaAyah || '',
        statusHidupAyah: initialBiodata.statusHidupAyah || 'Masih Hidup',
        nikAyah: initialBiodata.nikAyah || '',
        tempatLahirAyah: initialBiodata.tempatLahirAyah || '',
        tanggalLahirAyah: initialBiodata.tanggalLahirAyah
          ? new Date(initialBiodata.tanggalLahirAyah).toISOString().split('T')[0]
          : '',
        pekerjaanAyah: initialBiodata.pekerjaanAyah || '',
        pendidikanAyah: initialBiodata.pendidikanAyah || '',
        penghasilanAyah: initialBiodata.penghasilanAyah || '',

        // 2. Data Orang Tua - Ibu
        namaIbu: initialBiodata.namaIbu || '',
        statusHidupIbu: initialBiodata.statusHidupIbu || 'Masih Hidup',
        nikIbu: initialBiodata.nikIbu || '',
        tempatLahirIbu: initialBiodata.tempatLahirIbu || '',
        tanggalLahirIbu: initialBiodata.tanggalLahirIbu
          ? new Date(initialBiodata.tanggalLahirIbu).toISOString().split('T')[0]
          : '',
        pekerjaanIbu: initialBiodata.pekerjaanIbu || '',
        pendidikanIbu: initialBiodata.pendidikanIbu || '',
        penghasilanIbu: initialBiodata.penghasilanIbu || '',

        // 3. Alamat
        alamatProvId: '',
        alamatProvName: initialBiodata.alamatProvName || '',
        alamatKabId: '',
        alamatKabName: initialBiodata.alamatKabName || '',
        alamatKecId: '',
        alamatKecName: initialBiodata.alamatKecName || '',
        alamatKelId: '',
        alamatKelName: initialBiodata.alamatKelName || '',
        alamatJalan: initialBiodata.alamatJalan || '',

        // 4. Dokumen Pendukung
        fotoUrl: initialBiodata.fotoUrl || '',
        ijazahUrl: initialBiodata.ijazahUrl || '',
        kkUrl: initialBiodata.kkUrl || '',
      });

      // Resolusi otomatis seluruh hierarki wilayah secara simultan
      wilayahService.resolveHierarchy({
        provId: initialBiodata.alamatProvId,
        provName: initialBiodata.alamatProvName,
        kabId: initialBiodata.alamatKabId,
        kabName: initialBiodata.alamatKabName,
        kecId: initialBiodata.alamatKecId,
        kecName: initialBiodata.alamatKecName,
        kelId: initialBiodata.alamatKelId,
        kelName: initialBiodata.alamatKelName,
        jalan: initialBiodata.alamatJalan,
      }).then((res) => {
        if (res.provinces.length) setProvinces(res.provinces);
        if (res.regencies.length) setRegencies(res.regencies);
        if (res.districts.length) setDistricts(res.districts);
        if (res.villages.length) setVillages(res.villages);

        setFormData((prev: any) => ({
          ...prev,
          alamatProvId: res.selectedProv?.kode || '',
          alamatProvName: res.selectedProv?.nama || initialBiodata.alamatProvName || '',
          alamatKabId: res.selectedKab?.kode || '',
          alamatKabName: res.selectedKab?.nama || initialBiodata.alamatKabName || '',
          alamatKecId: res.selectedKec?.kode || '',
          alamatKecName: res.selectedKec?.nama || initialBiodata.alamatKecName || '',
          alamatKelId: res.selectedKel?.kode || '',
          alamatKelName: res.selectedKel?.nama || initialBiodata.alamatKelName || '',
        }));
      }).catch(console.error);
    }
  }, [initialBiodata, isOpen]);

  const handleChange = (field: string, val: any) => {
    const cleanVal = typeof val === 'string' ? normalizeTurkish(val) : val;
    setFormData((prev: any) => ({ ...prev, [field]: cleanVal }));
  };

  const handleFileUpload = async (field: 'fotoUrl' | 'ijazahUrl' | 'kkUrl', file: File) => {
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      try {
        fileToUpload = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true });
      } catch (err) {
        console.error('Compression error', err);
      }
    }

    const fieldToJenis: Record<string, string> = {
      fotoUrl: 'passfoto',
      ijazahUrl: 'ijazah',
      kkUrl: 'kk'
    };
    const jenis = fieldToJenis[field] || field;

    setUploadingField(field);
    try {
      const fd = new FormData();
      fd.append('file', fileToUpload);
      const url = initialBiodata?.id
        ? `/students/daftar-ulang/upload/${initialBiodata.id}/${jenis}`
        : `/students/daftar-ulang/upload-temp/${jenis}`;
      const res = await apiClient.post(url, fd);
      handleChange(field, res.data.url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengupload berkas.');
    } finally {
      setUploadingField(null);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.put(`/portal/students/${studentId}/biodata`, sanitizeTurkishDeep(formData));
      return res.data;
    },
    onSuccess: () => {
      setSuccessMessage('Data santri berhasil diperbarui!');
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['portal', 'students'] });
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Gagal memperbarui data santri.');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Perbarui Data Santri</h2>
              <p className="text-xs text-slate-500">
                Lengkapi dan perbarui data diri, data orang tua, alamat domisili, serta dokumen santri.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-white pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('diri')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'diri'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Informasi Pribadi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ortu')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ortu'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Data Orang Tua
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alamat')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'alamat'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" /> Alamat Domisili
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dokumen')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dokumen'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Dokumen Pendukung
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* TAB 1: INFORMASI PRIBADI */}
          {activeTab === 'diri' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  NIK Santri <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => handleChange('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="16 digit NIK"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nomor KK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={formData.noKk}
                  onChange={(e) => handleChange('noKk', e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="16 digit Nomor KK"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Anak Ke- <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.anakKe}
                  onChange={(e) => handleChange('anakKe', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Jumlah Saudara <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.jumlahSaudara}
                  onChange={(e) => handleChange('jumlahSaudara', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  NISN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.nisn}
                  onChange={(e) => handleChange('nisn', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digit NISN"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  No. Handphone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Tempat Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tempatLahir}
                  onChange={(e) => handleChange('tempatLahir', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.jenisKelamin === 'PEREMPUAN' || formData.jenisKelamin === 'P' ? 'P' : 'L'}
                  onChange={(e) => handleChange('jenisKelamin', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Kewarganegaraan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kewarganegaraan}
                  onChange={(e) => handleChange('kewarganegaraan', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                >
                  <option value="WNI">WNI (Warga Negara Indonesia)</option>
                  <option value="WNA">WNA (Warga Negara Asing)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: DATA ORANG TUA */}
          {activeTab === 'ortu' && (
            <div className="space-y-6">
              {/* BIODATA AYAH */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" /> Biodata Ayah
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Nama Ayah <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.namaAyah}
                      onChange={(e) => handleChange('namaAyah', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Status Hidup Ayah <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.statusHidupAyah}
                      onChange={(e) => handleChange('statusHidupAyah', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Sudah Meninggal">Sudah Meninggal</option>
                      <option value="Tidak Diketahui">Tidak Diketahui</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      NIK Ayah {formData.statusHidupAyah !== 'Sudah Meninggal' && formData.statusHidupAyah !== 'Wafat' && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nikAyah}
                      onChange={(e) => handleChange('nikAyah', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="16 digit NIK Ayah"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Tempat Lahir Ayah
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahirAyah}
                      onChange={(e) => handleChange('tempatLahirAyah', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Tanggal Lahir Ayah
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahirAyah}
                      onChange={(e) => handleChange('tanggalLahirAyah', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Pekerjaan Ayah
                    </label>
                    <select
                      value={formData.pekerjaanAyah}
                      onChange={(e) => handleChange('pekerjaanAyah', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="">Pilih Pekerjaan</option>
                      {PEKERJAAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Pendidikan Ayah
                    </label>
                    <select
                      value={formData.pendidikanAyah}
                      onChange={(e) => handleChange('pendidikanAyah', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="">Pilih Pendidikan</option>
                      {PENDIDIKAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Rata-rata Penghasilan Ayah
                    </label>
                    <select
                      value={formData.penghasilanAyah}
                      onChange={(e) => handleChange('penghasilanAyah', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="">Pilih Penghasilan</option>
                      {PENGHASILAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BIODATA IBU */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" /> Biodata Ibu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Nama Ibu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.namaIbu}
                      onChange={(e) => handleChange('namaIbu', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Status Hidup Ibu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.statusHidupIbu}
                      onChange={(e) => handleChange('statusHidupIbu', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="Masih Hidup">Masih Hidup</option>
                      <option value="Sudah Meninggal">Sudah Meninggal</option>
                      <option value="Tidak Diketahui">Tidak Diketahui</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      NIK Ibu {formData.statusHidupIbu !== 'Sudah Meninggal' && formData.statusHidupIbu !== 'Wafat' && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nikIbu}
                      onChange={(e) => handleChange('nikIbu', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="16 digit NIK Ibu"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Tempat Lahir Ibu
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahirIbu}
                      onChange={(e) => handleChange('tempatLahirIbu', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Tanggal Lahir Ibu
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahirIbu}
                      onChange={(e) => handleChange('tanggalLahirIbu', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Pekerjaan Ibu
                    </label>
                    <select
                      value={formData.pekerjaanIbu}
                      onChange={(e) => handleChange('pekerjaanIbu', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="">Pilih Pekerjaan</option>
                      {PEKERJAAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Pendidikan Ibu
                    </label>
                    <select
                      value={formData.pendidikanIbu}
                      onChange={(e) => handleChange('pendidikanIbu', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="">Pilih Pendidikan</option>
                      {PENDIDIKAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Rata-rata Penghasilan Ibu
                    </label>
                    <select
                      value={formData.penghasilanIbu}
                      onChange={(e) => handleChange('penghasilanIbu', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    >
                      <option value="">Pilih Penghasilan</option>
                      {PENGHASILAN_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALAMAT DOMISILI */}
          {activeTab === 'alamat' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Alamat Domisili Santri</p>
                  <p className="text-[11px] text-emerald-700">Pilih wilayah domisili secara bertingkat mulai dari Provinsi hingga Kelurahan/Desa.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provinsi */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.alamatProvId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = provinces.find(p => p.kode === id || p.id === id);
                      const name = selected?.nama || selected?.name || '';
                      setFormData((prev: any) => ({
                        ...prev,
                        alamatProvId: id,
                        alamatProvName: name,
                        alamatKabId: '',
                        alamatKabName: '',
                        alamatKecId: '',
                        alamatKecName: '',
                        alamatKelId: '',
                        alamatKelName: ''
                      }));
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="">Pilih Provinsi</option>
                    {provinces.map((p) => (
                      <option key={p.kode || p.id} value={p.kode || p.id}>
                        {p.nama || p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kabupaten / Kota */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Kabupaten / Kota <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.alamatKabId}
                    disabled={!formData.alamatProvId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = regencies.find(r => r.kode === id || r.id === id);
                      const name = selected?.nama || selected?.name || '';
                      setFormData((prev: any) => ({
                        ...prev,
                        alamatKabId: id,
                        alamatKabName: name,
                        alamatKecId: '',
                        alamatKecName: '',
                        alamatKelId: '',
                        alamatKelName: ''
                      }));
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="">Pilih Kabupaten/Kota</option>
                    {regencies.map((r) => (
                      <option key={r.kode || r.id} value={r.kode || r.id}>
                        {r.nama || r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kecamatan */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Kecamatan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.alamatKecId}
                    disabled={!formData.alamatKabId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = districts.find(d => d.kode === id || d.id === id);
                      const name = selected?.nama || selected?.name || '';
                      setFormData((prev: any) => ({
                        ...prev,
                        alamatKecId: id,
                        alamatKecName: name,
                        alamatKelId: '',
                        alamatKelName: ''
                      }));
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="">Pilih Kecamatan</option>
                    {districts.map((d) => (
                      <option key={d.kode || d.id} value={d.kode || d.id}>
                        {d.nama || d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kelurahan / Desa */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Kelurahan / Desa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.alamatKelId}
                    disabled={!formData.alamatKecId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = villages.find(v => v.kode === id || v.id === id);
                      const name = selected?.nama || selected?.name || '';
                      setFormData((prev: any) => ({
                        ...prev,
                        alamatKelId: id,
                        alamatKelName: name
                      }));
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="">Pilih Kelurahan/Desa</option>
                    {villages.map((v) => (
                      <option key={v.kode || v.id} value={v.kode || v.id}>
                        {v.nama || v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alamat Lengkap (Jalan, RT/RW) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Alamat Lengkap (Jalan, RT/RW) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.alamatJalan}
                    onChange={(e) => handleChange('alamatJalan', e.target.value)}
                    placeholder="Contoh: Jl. Sudirman No. 12, RT 01 / RW 02"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOKUMEN PENDUKUNG (OPSIONAL) */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-bold flex items-center gap-2 text-slate-800">
                  <FileText className="w-4 h-4 text-emerald-600" /> Berkas Dokumen Pendukung
                </span>
                <span className="text-[11px] italic bg-slate-200/70 px-2.5 py-0.5 rounded-md text-slate-600">
                  *Upload berkas bersifat opsional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { field: 'fotoUrl' as const, label: 'Pas Foto Santri', accept: 'image/*' },
                  { field: 'ijazahUrl' as const, label: 'Ijazah Terakhir', accept: 'image/*,application/pdf' },
                  { field: 'kkUrl' as const, label: 'Kartu Keluarga', accept: 'image/*,application/pdf' },
                ].map((doc) => (
                  <div key={doc.field} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.label}</p>
                      {formData[doc.field] ? (
                        <span className="inline-block mt-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Berkas Terlampir
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-[11px] text-slate-400 font-medium">
                          Belum Diunggah
                        </span>
                      )}
                    </div>

                    <label className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer text-center transition-all flex items-center justify-center gap-1.5 shadow-xs">
                      {uploadingField === doc.field ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-emerald-600" />
                          {formData[doc.field] ? 'Ganti Berkas' : 'Unggah Berkas'}
                        </>
                      )}
                      <input
                        type="file"
                        accept={doc.accept}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(doc.field, file);
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
