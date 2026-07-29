import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, ArrowRight, CheckCircle, ChevronLeft, Building, Upload, Image as ImageIcon, MapPin, User, FileText, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import imageCompression from 'browser-image-compression';

const PENDIDIKAN_OPTIONS = ['SD/Sederajat', 'SMP/Sederajat', 'SMA/Sederajat', 'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3', 'Tidak Bersekolah', 'Lainnya'];
const PEKERJAAN_OPTIONS = ['Tidak Bekerja', 'Pensiunan', 'PNS', 'TNI/Polisi', 'Guru/Dosen', 'Pegawai Swasta', 'Wiraswasta', 'Pengacara/Jaksa/Hakim/Notaris', 'Seniman/Pelukis/Artis/Sejenis', 'Dokter/Bidan/Perawat', 'Pilot/Pramugara', 'Pedagang', 'Petani/Peternak', 'Nelayan', 'Buruh (Tani/Pabrik/Bangunan)', 'Sopir/Masinis/Kondektur', 'Politikus', 'Lainnya'];
const PENGHASILAN_OPTIONS = ['dibawah 800.000', '800.001 - 1.200.000', '1.200.001 - 1.800.000', '1.800.001 - 2.500.000', '2.500.001 - 3.500.000', '3.500.001 - 4.800.000', '4.800.001 - 6.500.000', '6.500.001 - 10.000.000', '10.000.001 - 20.000.000', 'diatas 20.000.001'];

const inputCls = "block w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-200 shadow-sm";
const selectCls = inputCls + " appearance-none cursor-pointer";

const InputField = ({ label, required = false, children, colSpan = false }: { label: string; required?: boolean; children: React.ReactNode; colSpan?: boolean }) => (
  <div className={colSpan ? "col-span-full" : ""}>
    <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
      {label}{required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

// File card untuk daftar ulang (upload via API publik, tidak perlu login)
const FileCard = ({
  label, value, biodataId, jenis, onUploaded, isCompressing, setIsCompressing, accept
}: {
  label: string; value: string; biodataId?: string; jenis: string;
  onUploaded: (url: string) => void;
  isCompressing: boolean; setIsCompressing: (v: boolean) => void;
  accept?: string;
}) => {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!value) setLocalPreview(null);
  }, [value]);

  const isImage = value && /\.(png|jpe?g|webp)$/i.test(value);
  const isPdf = value && /\.pdf$/i.test(value);
  const previewUrl = value ? (value.startsWith('http') ? value : `/api/v1${value.startsWith('/') ? '' : '/'}${value}`) : null;
  const displayUrl = localPreview || previewUrl;
  const isLocal = localPreview !== null || (displayUrl && (displayUrl.startsWith('blob:') || displayUrl.startsWith('data:')));

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileToUpload = file;

    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      try {
        setIsCompressing(true);
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.error('Compression error:', error);
        alert('Terjadi kesalahan saat mengompres gambar.');
        setIsCompressing(false);
        e.target.value = '';
        return;
      }
    }

    if (fileToUpload.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 2MB! Silakan pilih file yang lebih kecil.');
      setIsCompressing(false);
      e.target.value = '';
      return;
    }

    setLocalPreview(URL.createObjectURL(fileToUpload));
    setIsCompressing(true);
    try {
      const fd = new FormData();
      fd.append('file', fileToUpload);
      const url = biodataId
        ? `/students/daftar-ulang/upload/${biodataId}/${jenis}`
        : `/students/daftar-ulang/upload-temp/${jenis}`;
      const res = await apiClient.post(url, fd);
      onUploaded(res.data.url);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengupload file dokumen. Pastikan ukuran file di bawah 10MB.';
      console.error('Upload error:', msg);
      alert(msg);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="group relative flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-5 hover:bg-gray-50 transition-colors">
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      {displayUrl ? (
        <div className="w-24 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-md ring-4 ring-white">
          {isLocal ? (
            <img src={displayUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-emerald-50 flex flex-col items-center justify-center p-2 text-center gap-1.5 border border-emerald-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-emerald-800 font-bold leading-tight">Berkas Ada</span>
              <span className="text-[8px] text-emerald-600 font-semibold leading-tight">Terproteksi</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-colors">
          <ImageIcon className="w-8 h-8" />
        </div>
      )}
      <label className={`w-full cursor-pointer rounded-xl border py-2 px-3 text-xs font-semibold text-center transition-all ${value ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 shadow-sm'} ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {isCompressing ? (
          <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</span>
        ) : (
          <span className="flex items-center justify-center gap-1.5"><Upload className="w-4 h-4" />{value ? 'Ubah File' : 'Pilih File'}</span>
        )}
        <input type="file" accept={accept || 'image/*,application/pdf'} className="hidden" onChange={handleChange} disabled={isCompressing} />
      </label>
    </div>
  );
};

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, name: 'Verifikasi', icon: User },
    { id: 2, name: 'Data Diri', icon: FileText },
    { id: 3, name: 'Dokumen', icon: MapPin },
    { id: 4, name: 'Selesai', icon: Check }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        ></div>

        {steps.map((s) => {
          const isActive = currentStep >= s.id;
          const isCurrent = currentStep === s.id;
          const Icon = s.icon;
          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white border-2 border-gray-300 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-semibold ${isActive ? 'text-indigo-900' : 'text-gray-400'} hidden sm:block absolute -bottom-6 whitespace-nowrap`}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function DaftarUlang() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [kodeDaftarUlang, setKodeDaftarUlang] = useState('');
  const [nik, setNik] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [biodataId, setBiodataId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nik: '',
    noKk: '',
    anakKe: '',
    jumlahSaudara: '',
    nisn: '',
    fullName: '',
    tempatLahir: '',
    tanggalLahir: '',
    tanggalMasuk: new Date().toISOString().split('T')[0],
    jenisKelamin: 'L',
    kewarganegaraan: 'WNI',
    namaAyah: '',
    statusHidupAyah: 'Masih Hidup',
    nikAyah: '',
    tempatLahirAyah: '',
    tanggalLahirAyah: '',
    pekerjaanAyah: '',
    pendidikanAyah: '',
    penghasilanAyah: '',
    namaIbu: '',
    statusHidupIbu: 'Masih Hidup',
    nikIbu: '',
    tempatLahirIbu: '',
    tanggalLahirIbu: '',
    pekerjaanIbu: '',
    pendidikanIbu: '',
    penghasilanIbu: '',
    address: '',
    phone: '',
    fotoUrl: '',
    ijazahUrl: '',
    kkUrl: '',
    alamatProvId: '',
    alamatProvName: '',
    alamatKabId: '',
    alamatKabName: '',
    alamatKecId: '',
    alamatKecName: '',
    alamatKelId: '',
    alamatKelName: '',
    alamatJalan: '',
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((r) => r.json())
      .then((data) => setProvinces(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.alamatProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.alamatProvId}.json`)
        .then((r) => r.json()).then((d) => setRegencies(d)).catch(console.error);
    } else { setRegencies([]); }
  }, [formData.alamatProvId]);

  useEffect(() => {
    if (formData.alamatKabId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${formData.alamatKabId}.json`)
        .then((r) => r.json()).then((d) => setDistricts(d)).catch(console.error);
    } else { setDistricts([]); }
  }, [formData.alamatKabId]);

  useEffect(() => {
    if (formData.alamatKecId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${formData.alamatKecId}.json`)
        .then((r) => r.json()).then((d) => setVillages(d)).catch(console.error);
    } else { setVillages([]); }
  }, [formData.alamatKecId]);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/students/daftar-ulang/verify', { nik, kodeDaftarUlang });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.exists && data.student) {
        setStudentId(data.student.id);
        const b = data.student.biodata;
        setBiodataId(b?.id || null);
        setFormData(prev => ({
          ...prev,
          nik: b.nik || nik,
          noKk: b.noKk || '',
          anakKe: b.anakKe || '',
          jumlahSaudara: b.jumlahSaudara || '',
          nisn: b.nisn || '',
          fullName: b.fullName || '',
          tempatLahir: b.tempatLahir || '',
          tanggalLahir: b.tanggalLahir ? new Date(b.tanggalLahir).toISOString().split('T')[0] : '',
          jenisKelamin: b.jenisKelamin || 'L',
          kewarganegaraan: b.kewarganegaraan || 'WNI',
          tanggalMasuk: b.tanggalMasuk ? new Date(b.tanggalMasuk).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          namaAyah: b.namaAyah || '',
          statusHidupAyah: b.statusHidupAyah || 'Masih Hidup',
          nikAyah: b.nikAyah || '',
          tempatLahirAyah: b.tempatLahirAyah || '',
          tanggalLahirAyah: b.tanggalLahirAyah ? new Date(b.tanggalLahirAyah).toISOString().split('T')[0] : '',
          pekerjaanAyah: b.pekerjaanAyah || '',
          pendidikanAyah: b.pendidikanAyah || '',
          penghasilanAyah: b.penghasilanAyah || '',
          namaIbu: b.namaIbu || '',
          statusHidupIbu: b.statusHidupIbu || 'Masih Hidup',
          nikIbu: b.nikIbu || '',
          tempatLahirIbu: b.tempatLahirIbu || '',
          tanggalLahirIbu: b.tanggalLahirIbu ? new Date(b.tanggalLahirIbu).toISOString().split('T')[0] : '',
          pekerjaanIbu: b.pekerjaanIbu || '',
          pendidikanIbu: b.pendidikanIbu || '',
          penghasilanIbu: b.penghasilanIbu || '',
          address: b.address || '',
          phone: b.phone || '',
          fotoUrl: b.fotoUrl || '',
          ijazahUrl: b.ijazahUrl || '',
          kkUrl: b.kkUrl || '',
          alamatProvId: b.alamatProvId || '',
          alamatProvName: b.alamatProvName || '',
          alamatKabId: b.alamatKabId || '',
          alamatKabName: b.alamatKabName || '',
          alamatKecId: b.alamatKecId || '',
          alamatKecName: b.alamatKecName || '',
          alamatKelId: b.alamatKelId || '',
          alamatKelName: b.alamatKelName || '',
          alamatJalan: b.alamatJalan || '',
        }));
        showToast('success', 'Data santri ditemukan, silakan lengkapi data yang kurang.');
      } else {
        setStudentId(null);
        setBiodataId(null);
        setFormData(prev => ({ ...prev, nik }));
        showToast('success', 'Silakan lengkapi formulir pendaftaran baru.');
      }
      setStep(2);
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Kode daftar ulang salah atau NIK tidak valid');
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/students/daftar-ulang/submit', {
        ...formData,
        kodeDaftarUlang,
        studentId
      });
    },
    onSuccess: () => {
      setStep(4); // Success step
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-[15px] leading-tight tracking-tight">Pusdatin Enterprise</h1>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">Portal Akademik</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 bg-gray-50 hover:bg-indigo-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-indigo-200">
            <ChevronLeft className="w-4 h-4" /> Batal
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col items-center">

        {step > 1 && <StepIndicator currentStep={step} />}

        {step === 1 && (
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-indigo-900/5 border border-gray-100 overflow-hidden flex flex-col md:flex-row mt-4">
            <div className="w-full md:w-5/12 bg-indigo-900 relative overflow-hidden flex flex-col justify-between p-10 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-900 opacity-90 z-0"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50 z-0"></div>
              <div className="absolute top-10 left-10 w-32 h-32 bg-violet-400 rounded-full blur-3xl opacity-30 z-0"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/10">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-3">Portal Daftar Ulang</h2>
                <p className="text-indigo-100/90 text-sm leading-relaxed">
                  Sistem informasi manajemen siswa terpadu. Silakan verifikasi identitas Anda untuk melanjutkan proses pendaftaran ulang.
                </p>
              </div>
              <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
                <p className="text-xs font-medium text-indigo-200">Dilindungi oleh enkripsi standar industri</p>
              </div>
            </div>

            <div className="w-full md:w-7/12 p-10 md:p-14 flex items-center bg-white">
              <div className="w-full max-w-sm mx-auto">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Verifikasi Identitas</h3>
                  <p className="text-sm text-gray-500 mt-2">Masukkan NIK dan Kode Daftar Ulang yang valid.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); verifyMutation.mutate(); }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Induk Kependudukan</label>
                    <input
                      type="text"
                      required
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                      placeholder="Masukkan 16 digit NIK"
                      maxLength={16}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Kode Token / Daftar Ulang</label>
                    <input
                      type="text"
                      required
                      value={kodeDaftarUlang}
                      onChange={(e) => setKodeDaftarUlang(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal uppercase"
                      placeholder="Contoh: DAFTAR2026"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyMutation.isPending || !nik || !kodeDaftarUlang}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-4 bg-gray-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:hover:bg-gray-900 shadow-lg shadow-gray-900/20 hover:shadow-indigo-600/30"
                  >
                    {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lanjutkan Verifikasi'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden relative">
            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <div className="px-8 pt-8 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Lengkapi Data Diri</h2>
              <p className="text-gray-500 text-sm mt-1">Pastikan seluruh data yang dimasukkan sesuai dengan dokumen resmi.</p>
            </div>

            <form className="p-8 space-y-10" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <User className="w-4 h-4" /> Informasi Pribadi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <InputField label="Nama Lengkap" required><input name="fullName" value={formData.fullName} onChange={handleChange} required className={inputCls} /></InputField>
                  <InputField label="NIK" required><input name="nik" value={formData.nik} readOnly className={inputCls + " bg-gray-100 text-gray-500 border-dashed"} /></InputField>
                  <InputField label="Nomor KK" required><input name="noKk" value={formData.noKk} onChange={handleChange} required maxLength={16} placeholder="Masukkan 16 digit Nomor KK" className={inputCls} /></InputField>
                  <InputField label="Anak Ke-" required><input type="number" name="anakKe" value={formData.anakKe} onChange={handleChange} required min={1} className={inputCls} /></InputField>
                  <InputField label="Jumlah Saudara" required><input type="number" name="jumlahSaudara" value={formData.jumlahSaudara} onChange={handleChange} required min={0} className={inputCls} /></InputField>
                  <InputField label="NISN" required><input name="nisn" value={formData.nisn} onChange={handleChange} required placeholder="Masukkan NISN" className={inputCls} /></InputField>
                  <InputField label="No. Handphone" required><input name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} /></InputField>
                  <InputField label="Tempat Lahir" required><input name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} required className={inputCls} /></InputField>
                  <InputField label="Tanggal Lahir" required><input type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} required className={inputCls} /></InputField>
                  <InputField label="Tanggal Masuk Pesantren" required><input type="date" name="tanggalMasuk" value={formData.tanggalMasuk} onChange={handleChange} required className={inputCls} /></InputField>
                  <InputField label="Jenis Kelamin" required>
                    <select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} required className={selectCls}>
                      <option value="L">Laki-Laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </InputField>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Building className="w-4 h-4" /> Data Orang Tua
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-800">Biodata Ayah</h4>
                    <InputField label="Nama Ayah" required><input name="namaAyah" value={formData.namaAyah} onChange={handleChange} required className={inputCls} /></InputField>
                    <InputField label="Status Hidup Ayah" required>
                      <select name="statusHidupAyah" value={formData.statusHidupAyah} onChange={handleChange} required className={selectCls}>
                        <option value="Masih Hidup">Masih Hidup</option>
                        <option value="Wafat">Wafat</option>
                      </select>
                    </InputField>
                    <InputField label="NIK Ayah" required={formData.statusHidupAyah !== 'Wafat'}><input name="nikAyah" value={formData.nikAyah} onChange={handleChange} required={formData.statusHidupAyah !== 'Wafat'} maxLength={16} placeholder="Masukkan 16 digit NIK Ayah" className={inputCls} /></InputField>
                    <InputField label="Tempat Lahir Ayah" required={formData.statusHidupAyah !== 'Wafat'}><input name="tempatLahirAyah" value={formData.tempatLahirAyah} onChange={handleChange} required={formData.statusHidupAyah !== 'Wafat'} className={inputCls} /></InputField>
                    <InputField label="Tanggal Lahir Ayah" required={formData.statusHidupAyah !== 'Wafat'}><input type="date" name="tanggalLahirAyah" value={formData.tanggalLahirAyah} onChange={handleChange} required={formData.statusHidupAyah !== 'Wafat'} className={inputCls} /></InputField>
                    <InputField label="Pekerjaan Ayah" required={formData.statusHidupAyah !== 'Wafat'}>
                      <select name="pekerjaanAyah" value={formData.pekerjaanAyah} onChange={handleChange} required={formData.statusHidupAyah !== 'Wafat'} className={selectCls}>
                        <option value="">Pilih Pekerjaan</option>
                        {PEKERJAAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </InputField>
                    <InputField label="Pendidikan Ayah" required={formData.statusHidupAyah !== 'Wafat'}>
                      <select name="pendidikanAyah" value={formData.pendidikanAyah} onChange={handleChange} required={formData.statusHidupAyah !== 'Wafat'} className={selectCls}>
                        <option value="">Pilih Pendidikan</option>
                        {PENDIDIKAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </InputField>
                    <InputField label="Rata-rata Penghasilan Ayah" required={formData.statusHidupAyah !== 'Wafat'}>
                      <select name="penghasilanAyah" value={formData.penghasilanAyah} onChange={handleChange} required={formData.statusHidupAyah !== 'Wafat'} className={selectCls}>
                        <option value="">Pilih Penghasilan</option>
                        {PENGHASILAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </InputField>
                  </div>
                  <div className="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-800">Biodata Ibu</h4>
                    <InputField label="Nama Ibu" required><input name="namaIbu" value={formData.namaIbu} onChange={handleChange} required className={inputCls} /></InputField>
                    <InputField label="Status Hidup Ibu" required>
                      <select name="statusHidupIbu" value={formData.statusHidupIbu} onChange={handleChange} required className={selectCls}>
                        <option value="Masih Hidup">Masih Hidup</option>
                        <option value="Wafat">Wafat</option>
                      </select>
                    </InputField>
                    <InputField label="NIK Ibu" required={formData.statusHidupIbu !== 'Wafat'}><input name="nikIbu" value={formData.nikIbu} onChange={handleChange} required={formData.statusHidupIbu !== 'Wafat'} maxLength={16} placeholder="Masukkan 16 digit NIK Ibu" className={inputCls} /></InputField>
                    <InputField label="Tempat Lahir Ibu" required={formData.statusHidupIbu !== 'Wafat'}><input name="tempatLahirIbu" value={formData.tempatLahirIbu} onChange={handleChange} required={formData.statusHidupIbu !== 'Wafat'} className={inputCls} /></InputField>
                    <InputField label="Tanggal Lahir Ibu" required={formData.statusHidupIbu !== 'Wafat'}><input type="date" name="tanggalLahirIbu" value={formData.tanggalLahirIbu} onChange={handleChange} required={formData.statusHidupIbu !== 'Wafat'} className={inputCls} /></InputField>
                    <InputField label="Pekerjaan Ibu" required={formData.statusHidupIbu !== 'Wafat'}>
                      <select name="pekerjaanIbu" value={formData.pekerjaanIbu} onChange={handleChange} required={formData.statusHidupIbu !== 'Wafat'} className={selectCls}>
                        <option value="">Pilih Pekerjaan</option>
                        {PEKERJAAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </InputField>
                    <InputField label="Pendidikan Ibu" required={formData.statusHidupIbu !== 'Wafat'}>
                      <select name="pendidikanIbu" value={formData.pendidikanIbu} onChange={handleChange} required={formData.statusHidupIbu !== 'Wafat'} className={selectCls}>
                        <option value="">Pilih Pendidikan</option>
                        {PENDIDIKAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </InputField>
                    <InputField label="Rata-rata Penghasilan Ibu" required={formData.statusHidupIbu !== 'Wafat'}>
                      <select name="penghasilanIbu" value={formData.penghasilanIbu} onChange={handleChange} required={formData.statusHidupIbu !== 'Wafat'} className={selectCls}>
                        <option value="">Pilih Penghasilan</option>
                        {PENGHASILAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </InputField>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button type="submit" className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-indigo-600 font-bold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-gray-900/20 hover:shadow-indigo-600/30">
                  Selanjutnya <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden relative">
            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <div className="px-8 pt-8 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Alamat & Dokumen</h2>
              <p className="text-gray-500 text-sm mt-1">Lengkapi informasi domisili serta unggah dokumen pelengkap.</p>
            </div>

            <form className="p-8 space-y-10" onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}>
              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Alamat Domisili
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <InputField label="Provinsi" required>
                    <select name="alamatProvId" value={formData.alamatProvId} required onChange={(e) => {
                      setFormData({ ...formData, alamatProvId: e.target.value, alamatProvName: e.target.options[e.target.selectedIndex].text });
                    }} className={selectCls}>
                      <option value="">Pilih Provinsi</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Kabupaten/Kota" required>
                    <select name="alamatKabId" value={formData.alamatKabId} required disabled={!formData.alamatProvId} onChange={(e) => {
                      setFormData({ ...formData, alamatKabId: e.target.value, alamatKabName: e.target.options[e.target.selectedIndex].text });
                    }} className={selectCls}>
                      <option value="">Pilih Kabupaten/Kota</option>
                      {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Kecamatan" required>
                    <select name="alamatKecId" value={formData.alamatKecId} required disabled={!formData.alamatKabId} onChange={(e) => {
                      setFormData({ ...formData, alamatKecId: e.target.value, alamatKecName: e.target.options[e.target.selectedIndex].text });
                    }} className={selectCls}>
                      <option value="">Pilih Kecamatan</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Kelurahan/Desa" required>
                    <select name="alamatKelId" value={formData.alamatKelId} required disabled={!formData.alamatKecId} onChange={(e) => {
                      setFormData({ ...formData, alamatKelId: e.target.value, alamatKelName: e.target.options[e.target.selectedIndex].text });
                    }} className={selectCls}>
                      <option value="">Pilih Kelurahan/Desa</option>
                      {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Alamat Lengkap (Jalan, RT/RW)" required colSpan>
                    <input name="alamatJalan" value={formData.alamatJalan} onChange={handleChange} required className={inputCls} placeholder="Contoh: Jl. Sudirman No. 12, RT 01 / RW 02" />
                  </InputField>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Dokumen Pendukung (Opsional)
                  </span>
                  <span className="text-[11px] font-normal text-slate-500 normal-case italic bg-slate-100 px-2.5 py-1 rounded-lg">
                    *Upload berkas bersifat opsional
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <FileCard
                    label="Pas Foto" value={formData.fotoUrl}
                    biodataId={biodataId || undefined}
                    jenis="passfoto"
                    onUploaded={(url) => setFormData(prev => ({ ...prev, fotoUrl: url }))}
                    isCompressing={isCompressing} setIsCompressing={setIsCompressing}
                    accept="image/*"
                  />
                  <FileCard
                    label="Ijazah" value={formData.ijazahUrl}
                    biodataId={biodataId || undefined}
                    jenis="ijazah"
                    onUploaded={(url) => setFormData(prev => ({ ...prev, ijazahUrl: url }))}
                    isCompressing={isCompressing} setIsCompressing={setIsCompressing}
                    accept="image/*,application/pdf"
                  />
                  <FileCard
                    label="Kartu Keluarga" value={formData.kkUrl}
                    biodataId={biodataId || undefined}
                    jenis="kk"
                    onUploaded={(url) => setFormData(prev => ({ ...prev, kkUrl: url }))}
                    isCompressing={isCompressing} setIsCompressing={setIsCompressing}
                    accept="image/*,application/pdf"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setStep(2)} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold flex items-center gap-2 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button type="submit" disabled={submitMutation.isPending} className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-70">
                  {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Selesai & Kirim Data'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-indigo-900/5 p-12 border border-gray-100 text-center mt-10">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-70"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 mx-auto">
                <CheckCircle className="w-12 h-12" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Pendaftaran Berhasil!</h2>
            <p className="text-gray-600 mb-10 leading-relaxed">
              Terima kasih, data pendaftaran ulang Anda telah berhasil disimpan di dalam sistem informasi kami.
            </p>
            <button onClick={() => navigate('/')} className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-gray-900/20 hover:shadow-indigo-600/30 w-full text-lg">
              Kembali ke Beranda
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
