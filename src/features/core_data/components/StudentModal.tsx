import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { Student } from '../hooks/useGetStudents';
import {
  X, Loader2, Image as ImageIcon, Eye, User, Users, MapPin, BookOpen, ClipboardList,
  Upload, CheckCircle, AlertCircle, ChevronRight, Camera, FileText, Home
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useGetWilayah, useGetCabang } from '../hooks/useMasterData';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import NotificationModal from '../../../components/NotificationModal';
import { useToast } from '../../../contexts/ToastContext';
import AktivitasBelajarTab from './AktivitasBelajarTab';
import RiwayatNilaiTab from './RiwayatNilaiTab';
import imageCompression from 'browser-image-compression';

export type TabType = 'SANTRI' | 'ORANG_TUA' | 'ALAMAT' | 'AKTIVITAS_BELAJAR' | 'RIWAYAT_NILAI';

interface StudentModalProps {
  student?: Student | null;
  onClose: () => void;
}

const PENDIDIKAN_OPTIONS = ['SD/Sederajat','SMP/Sederajat','SMA/Sederajat','D1','D2','D3','D4/S1','S2','S3','Tidak Bersekolah','Lainnya'];
const PEKERJAAN_OPTIONS = ['Tidak Bekerja','Pensiunan','PNS','TNI/Polisi','Guru/Dosen','Pegawai Swasta','Wiraswasta','Pengacara/Jaksa/Hakim/Notaris','Seniman/Pelukis/Artis/Sejenis','Dokter/Bidan/Perawat','Pilot/Pramugara','Pedagang','Petani/Peternak','Nelayan','Buruh (Tani/Pabrik/Bangunan)','Sopir/Masinis/Kondektur','Politikus','Lainnya'];
const PENGHASILAN_OPTIONS = ['dibawah 800.000','800.001 - 1.200.000','1.200.001 - 1.800.000','1.800.001 - 2.500.000','2.500.001 - 3.500.000','3.500.001 - 4.800.000','4.800.001 - 6.500.000','6.500.001 - 10.000.000','10.000.001 - 20.000.000','diatas 20.000.001'];

// Reusable styled input
const InputField = ({ label, required = false, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) => (
  <div>
    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${error ? 'text-rose-500' : 'text-slate-500'}`}>
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-1.5 text-xs font-medium text-rose-500 animate-in slide-in-from-top-1 opacity-100">{error}</p>}
  </div>
);

const inputCls = "block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150";
const selectCls = inputCls + " appearance-none cursor-pointer";

// File Upload Card — upload via API, tampilkan via URL
const FileCard = ({ 
  label, icon, value, studentId, jenis, onUploaded, isCompressing, setIsCompressing, accept
}: { 
  label: string; icon: React.ReactNode; value: string; 
  studentId?: string; jenis: string;
  onUploaded: (url: string) => void;
  isCompressing: boolean; setIsCompressing: (v: boolean) => void;
  accept?: string;
}) => {
  const { t } = useTranslation();
  const isImage = value && /\.(png|jpe?g|webp)$/i.test(value);
  const isPdf = value && /\.pdf$/i.test(value);
  const previewUrl = value ? (value.startsWith('http') ? value : `/api/v1${value.startsWith('/') ? '' : '/'}${value}`) : null;

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

    setIsCompressing(true);
    try {
      const fd = new FormData();
      fd.append('file', fileToUpload);
      const url = studentId 
        ? `/students/${studentId}/upload/${jenis}`
        : `/students/upload-temp/${jenis}`;
      const res = await apiClient.post(url, fd);
      onUploaded(res.data.url);
    } catch (err: any) {
      console.error('Upload error:', err.response?.data?.message || err.message);
      alert(err.response?.data?.message || err.message);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="group relative flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 self-start">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</span>
      </div>
      {previewUrl ? (
        <div className="relative w-24 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
          {isImage ? (
            <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
          ) : isPdf ? (
            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center gap-1">
              <FileText className="w-7 h-7 text-red-500" />
              <span className="text-[10px] text-red-600 font-medium">PDF</span>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 underline">{t('siswa.form.lihat_pdf')}</a>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>
      ) : (
        <div className="w-24 h-28 rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400">
          <ImageIcon className="w-7 h-7" />
        </div>
      )}
      <label className={`w-full cursor-pointer rounded-lg border py-1.5 px-3 text-xs font-semibold text-center transition-all duration-150 ${value ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'} ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {isCompressing ? (
          <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> {t('siswa.form.upload_uploading')}</span>
        ) : (
          <span className="flex items-center justify-center gap-1.5"><Upload className="w-3 h-3" />{value ? t('siswa.form.upload_ganti') : t('siswa.form.upload_btn')}</span>
        )}
        <input type="file" accept={accept || 'image/*,application/pdf'} className="hidden" onChange={handleChange} disabled={isCompressing} />
      </label>
      {value && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        </div>
      )}
    </div>
  );
};

// Section Divider
const SectionDivider = ({ title }: { title: string }) => (
  <div className="col-span-full flex items-center gap-3 pt-2">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);

export default function StudentModal({ student, onClose }: StudentModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: wilayahList } = useGetWilayah();
  const { data: cabangList } = useGetCabang();
  const { t } = useTranslation();

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const { data: grupDaimiList } = useQuery({
    queryKey: ['grup-daimi'],
    queryFn: async () => {
      const res = await apiClient.get('/pesantren/grup-daimi');
      return res.data;
    }
  });

  const [countries, setCountries] = useState<{value: string, label: string}[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((r) => r.json())
      .then((data) => setProvinces(data))
      .catch((e) => console.error('Gagal mengambil data provinsi', e));
  }, []);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/master-data/countries')
      .then((response) => {
        const resJson = response.data;
        if (!mounted) return;
        const objects = resJson?.data?.objects || [];
        const formatted = objects.map((c: any) => ({
          value: c.names?.common || '',
          label: c.names?.common || ''
        })).filter((c: any) => c.value);

        formatted.sort((a: any, b: any) => a.label.localeCompare(b.label));
        const idn = formatted.find((c: any) => c.value === 'Indonesia');
        const rest = formatted.filter((c: any) => c.value !== 'Indonesia');
        setCountries(idn ? [idn, ...rest] : formatted);
      })
      .catch(() => {
        setCountries([{ value: 'Indonesia', label: 'Indonesia' }, { value: 'Malaysia', label: 'Malaysia' }]);
      });
    return () => { mounted = false; };
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('SANTRI');
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nik: '',
    noKk: '',
    anakKe: '',
    jumlahSaudara: '',
    nisn: '',
    nisLokal: '',
    noGlodemy: '',
    fullName: '',
    tempatLahir: '',
    tanggalLahir: '',
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
    kontakDaruratNama: '',
    kontakDaruratTelp: '',
    kontakDaruratHubungan: '',
    fotoUrl: '',
    ijazahUrl: '',
    kkUrl: '',
    wilayahId: user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user.wilayahId || '' : '',
    cabangId: user?.scope === 'CABANG' ? user.cabangId || '' : '',
    kelasId: '',
    jenisSiswa: '',
    grupDaimi: '',
    statusHafidz: '',
    tanggalMasuk: new Date().toISOString().split('T')[0],
    isActive: true,
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

  useEffect(() => {
    if (formData.nik && formData.nik.length === 16) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiClient.get('/students/check-duplicate', {
            params: { nik: formData.nik, excludeStudentId: student?.id }
          });
          if (res.data?.nikDuplicate?.exists) {
            setFieldErrors(prev => ({
              ...prev,
              nik: `NIK sudah terpakai atas nama ${res.data.nikDuplicate.fullName}`
            }));
          }
        } catch (e) {
          console.error('Check NIK duplicate error', e);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData.nik, student?.id]);

  useEffect(() => {
    if (formData.nisn && formData.nisn.length === 10) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiClient.get('/students/check-duplicate', {
            params: { nisn: formData.nisn, excludeStudentId: student?.id }
          });
          if (res.data?.nisnDuplicate?.exists) {
            setFieldErrors(prev => ({
              ...prev,
              nisn: `NISN sudah terpakai atas nama ${res.data.nisnDuplicate.fullName}`
            }));
          }
        } catch (e) {
          console.error('Check NISN duplicate error', e);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData.nisn, student?.id]);

  const { data: rombelList = [] } = useQuery<{ id: string; name: string; tingkat?: string; cabangId?: string }[]>({
    queryKey: ['formal-kelas-active', formData.cabangId],
    queryFn: async () => {
      if (!formData.cabangId) return [];
      const res = await apiClient.get('/formal/kelas');
      return (res.data || []).filter((k: any) => k.cabangId === formData.cabangId && k.isActive !== false);
    },
    enabled: !!formData.cabangId
  });

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

  useEffect(() => {
    if (formData.noGlodemy && formData.tanggalMasuk) {
      const year = new Date(formData.tanggalMasuk).getFullYear();
      if (!isNaN(year)) {
        const autoNisLokal = `${formData.noGlodemy}${year}`;
        if (formData.nisLokal !== autoNisLokal) {
          setFormData(prev => ({ ...prev, nisLokal: autoNisLokal }));
        }
      }
    }
  }, [formData.noGlodemy, formData.tanggalMasuk, formData.nisLokal]);

  useEffect(() => {
    if (student) {
      setFormData({
        nik: student.biodata?.nik || '',
        noKk: student.biodata?.noKk || '',
        anakKe: student.biodata?.anakKe !== undefined && student.biodata?.anakKe !== null ? String(student.biodata.anakKe) : '',
        jumlahSaudara: student.biodata?.jumlahSaudara !== undefined && student.biodata?.jumlahSaudara !== null ? String(student.biodata.jumlahSaudara) : '',
        nisn: student.biodata?.nisn || '',
        nisLokal: student.biodata?.nisLokal || '',
        noGlodemy: student.biodata?.noGlodemy || '',
        fullName: student.biodata?.fullName || '',
        tempatLahir: student.biodata?.tempatLahir || '',
        tanggalLahir: student.biodata?.tanggalLahir ? new Date(student.biodata.tanggalLahir).toISOString().split('T')[0] : '',
        jenisKelamin: student.biodata?.jenisKelamin || 'L',
        kewarganegaraan: student.biodata?.kewarganegaraan || 'WNI',
        namaAyah: student.biodata?.namaAyah || '',
        statusHidupAyah: student.biodata?.statusHidupAyah || 'Masih Hidup',
        nikAyah: student.biodata?.nikAyah || '',
        tempatLahirAyah: student.biodata?.tempatLahirAyah || '',
        tanggalLahirAyah: student.biodata?.tanggalLahirAyah ? new Date(student.biodata.tanggalLahirAyah).toISOString().split('T')[0] : '',
        pekerjaanAyah: student.biodata?.pekerjaanAyah || '',
        pendidikanAyah: student.biodata?.pendidikanAyah || '',
        penghasilanAyah: student.biodata?.penghasilanAyah || '',
        namaIbu: student.biodata?.namaIbu || '',
        statusHidupIbu: student.biodata?.statusHidupIbu || 'Masih Hidup',
        nikIbu: student.biodata?.nikIbu || '',
        tempatLahirIbu: student.biodata?.tempatLahirIbu || '',
        tanggalLahirIbu: student.biodata?.tanggalLahirIbu ? new Date(student.biodata.tanggalLahirIbu).toISOString().split('T')[0] : '',
        pekerjaanIbu: student.biodata?.pekerjaanIbu || '',
        pendidikanIbu: student.biodata?.pendidikanIbu || '',
        penghasilanIbu: student.biodata?.penghasilanIbu || '',
        address: student.biodata?.address || '',
        phone: student.biodata?.phone || '',
        kontakDaruratNama: student.biodata?.kontakDaruratNama || '',
        kontakDaruratTelp: student.biodata?.kontakDaruratTelp || '',
        kontakDaruratHubungan: student.biodata?.kontakDaruratHubungan || '',
        fotoUrl: student.biodata?.fotoUrl || '',
        ijazahUrl: student.biodata?.ijazahUrl || '',
        kkUrl: student.biodata?.kkUrl || '',
        wilayahId: student.wilayahId || '',
        cabangId: student.cabangId || '',
        kelasId: (student.siswaFormal as any)?.kelasId || '',
        jenisSiswa: student.jenisSiswa || (student.siswaFormal ? 'MUADALAH' : ''),
        grupDaimi: student.dataDaimi?.grup?.name || student.grupDaimi || '',
        statusHafidz: student.statusHafidz || '',
        tanggalMasuk: student.riwayatPendidikan?.[0]?.tanggalMasuk ? new Date(student.riwayatPendidikan[0].tanggalMasuk).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isActive: student.isActive !== undefined ? student.isActive : true,
        alamatProvId: student.biodata?.alamatProvId || '',
        alamatProvName: student.biodata?.alamatProvName || '',
        alamatKabId: student.biodata?.alamatKabId || '',
        alamatKabName: student.biodata?.alamatKabName || '',
        alamatKecId: student.biodata?.alamatKecId || '',
        alamatKecName: student.biodata?.alamatKecName || '',
        alamatKelId: student.biodata?.alamatKelId || '',
        alamatKelName: student.biodata?.alamatKelName || '',
        alamatJalan: student.biodata?.alamatJalan || '',
      });

      if (student.biodata?.alamatProvId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${student.biodata.alamatProvId}.json`)
          .then((r) => r.json()).then((d) => setRegencies(d)).catch(console.error);
      }
      if (student.biodata?.alamatKabId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${student.biodata.alamatKabId}.json`)
          .then((r) => r.json()).then((d) => setDistricts(d)).catch(console.error);
      }
      if (student.biodata?.alamatKecId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${student.biodata.alamatKecId}.json`)
          .then((r) => r.json()).then((d) => setVillages(d)).catch(console.error);
      }
    }
  }, [student]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (student) {
        return apiClient.put(`/students/${student.id}`, data);
      } else {
        return apiClient.post('/students', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setNotification({
        isOpen: true,
        type: 'success',
        title: t('siswa.form.save_success_title'),
        message: t('siswa.form.save_success_msg')
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Internal error.';
      const newErrors: Record<string, string> = { ...fieldErrors };
      
      if (msg.includes('NIK sudah terpakai atas nama')) {
        newErrors['nik'] = msg;
        setActiveTab('SANTRI');
      } else if (msg.includes('NISN sudah terpakai atas nama')) {
        newErrors['nisn'] = msg;
        setActiveTab('SANTRI');
      } else if (msg.includes('duplikat')) {
        const fieldStr = msg.replace('Data ', '').replace(' yang Anda masukkan sudah terdaftar (duplikat).', '');
        const fields = fieldStr.split(', ');
        fields.forEach((f: string) => {
          newErrors[f] = 'Data sudah terdaftar (duplikat)';
        });
        setActiveTab('SANTRI');
      }
      setFieldErrors(newErrors);

      setNotification({
        isOpen: true,
        type: 'error',
        title: t('siswa.form.save_error_title'),
        message: `${t('siswa.form.save_error_msg')}\n${msg}\n\n${t('siswa.form.save_error_contact')}`
      });
    }
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let firstErrorTab: TabType | null = null;

    const checkRequired = (key: string, val: any, fieldLabel: string, tab: TabType) => {
      if (!val || (typeof val === 'string' && !val.trim())) {
        errors[key] = `${fieldLabel} wajib diisi`;
        if (!firstErrorTab) firstErrorTab = tab;
      }
    };

    // TAB SANTRI
    checkRequired('fullName', formData.fullName, t('siswa.form.nama_lengkap'), 'SANTRI');
    checkRequired('nik', formData.nik, t('siswa.form.nik'), 'SANTRI');
    checkRequired('nisn', formData.nisn, t('siswa.form.nisn_label'), 'SANTRI');
    checkRequired('noGlodemy', formData.noGlodemy, t('siswa.form.no_glodemy'), 'SANTRI');
    checkRequired('tempatLahir', formData.tempatLahir, t('siswa.form.birth_place'), 'SANTRI');
    checkRequired('tanggalLahir', formData.tanggalLahir, t('siswa.form.birth_date'), 'SANTRI');
    checkRequired('jenisKelamin', formData.jenisKelamin, t('siswa.form.gender'), 'SANTRI');
    checkRequired('kewarganegaraan', formData.kewarganegaraan, t('siswa.form.nationality'), 'SANTRI');
    checkRequired('noKk', formData.noKk, t('siswa.form.no_kk'), 'SANTRI');
    checkRequired('anakKe', formData.anakKe, t('siswa.form.anak_ke'), 'SANTRI');
    checkRequired('jumlahSaudara', formData.jumlahSaudara, t('siswa.form.jumlah_saudara'), 'SANTRI');

    if (!student && user?.scope === 'GLOBAL') {
      checkRequired('wilayahId', formData.wilayahId, t('siswa.form.wilayah_daftar'), 'SANTRI');
    }
    if (!student && (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH')) {
      checkRequired('cabangId', formData.cabangId, t('siswa.form.cabang_penempatan'), 'SANTRI');
    }
    checkRequired('tanggalMasuk', formData.tanggalMasuk, t('siswa.form.tgl_masuk'), 'SANTRI');
    checkRequired('statusHafidz', formData.statusHafidz, t('siswa.form.status_hafidz'), 'SANTRI');

    // TAB ORANG TUA
    checkRequired('namaAyah', formData.namaAyah, t('siswa.form.nama_ayah'), 'ORANG_TUA');
    checkRequired('nikAyah', formData.nikAyah, t('siswa.form.nik_ayah'), 'ORANG_TUA');
    checkRequired('tempatLahirAyah', formData.tempatLahirAyah, t('siswa.form.tempat_lahir_ayah'), 'ORANG_TUA');
    checkRequired('tanggalLahirAyah', formData.tanggalLahirAyah, t('siswa.form.tgl_lahir_ayah'), 'ORANG_TUA');
    checkRequired('statusHidupAyah', formData.statusHidupAyah, t('siswa.form.status_hidup_ayah'), 'ORANG_TUA');
    checkRequired('pendidikanAyah', formData.pendidikanAyah, t('siswa.form.pendidikan_ayah'), 'ORANG_TUA');
    checkRequired('pekerjaanAyah', formData.pekerjaanAyah, t('siswa.form.pekerjaan_ayah'), 'ORANG_TUA');
    checkRequired('penghasilanAyah', formData.penghasilanAyah, t('siswa.form.penghasilan_ayah'), 'ORANG_TUA');

    checkRequired('namaIbu', formData.namaIbu, t('siswa.form.nama_ibu'), 'ORANG_TUA');
    checkRequired('nikIbu', formData.nikIbu, t('siswa.form.nik_ibu'), 'ORANG_TUA');
    checkRequired('tempatLahirIbu', formData.tempatLahirIbu, t('siswa.form.tempat_lahir_ibu'), 'ORANG_TUA');
    checkRequired('tanggalLahirIbu', formData.tanggalLahirIbu, t('siswa.form.tgl_lahir_ibu'), 'ORANG_TUA');
    checkRequired('statusHidupIbu', formData.statusHidupIbu, t('siswa.form.status_hidup_ibu'), 'ORANG_TUA');
    checkRequired('pendidikanIbu', formData.pendidikanIbu, t('siswa.form.pendidikan_ibu'), 'ORANG_TUA');
    checkRequired('pekerjaanIbu', formData.pekerjaanIbu, t('siswa.form.pekerjaan_ibu'), 'ORANG_TUA');
    checkRequired('penghasilanIbu', formData.penghasilanIbu, t('siswa.form.penghasilan_ibu'), 'ORANG_TUA');

    // TAB ALAMAT
    checkRequired('alamatProvId', formData.alamatProvId, t('siswa.form.provinsi'), 'ALAMAT');
    checkRequired('alamatKabId', formData.alamatKabId, t('siswa.form.kabupaten'), 'ALAMAT');
    checkRequired('alamatKecId', formData.alamatKecId, t('siswa.form.kecamatan'), 'ALAMAT');
    checkRequired('alamatKelId', formData.alamatKelId, t('siswa.form.kelurahan'), 'ALAMAT');
    checkRequired('alamatJalan', formData.alamatJalan, t('siswa.form.alamat_jalan'), 'ALAMAT');
    checkRequired('phone', formData.phone, t('siswa.form.phone'), 'ALAMAT');

    checkRequired('kontakDaruratNama', formData.kontakDaruratNama, t('siswa.form.darurat_nama'), 'ALAMAT');
    checkRequired('kontakDaruratTelp', formData.kontakDaruratTelp, t('siswa.form.darurat_telp'), 'ALAMAT');
    checkRequired('kontakDaruratHubungan', formData.kontakDaruratHubungan, t('siswa.form.darurat_hub'), 'ALAMAT');

    // Digit length validations
    if (formData.nik && !/^\d{16}$/.test(formData.nik.trim())) {
      errors['nik'] = 'NIK Siswa harus 16 digit angka';
      if (!firstErrorTab) firstErrorTab = 'SANTRI';
    }
    if (formData.nisn && !/^\d{10}$/.test(formData.nisn.trim())) {
      errors['nisn'] = 'NISN harus 10 digit angka';
      if (!firstErrorTab) firstErrorTab = 'SANTRI';
    }
    if (formData.noKk && !/^\d{16}$/.test(formData.noKk.trim())) {
      errors['noKk'] = 'Nomor KK harus 16 digit angka';
      if (!firstErrorTab) firstErrorTab = 'SANTRI';
    }
    if (formData.nikAyah && (formData.statusHidupAyah !== 'Wafat' || formData.nikAyah.trim()) && !/^\d{16}$/.test(formData.nikAyah.trim())) {
      errors['nikAyah'] = 'NIK Ayah harus 16 digit angka';
      if (!firstErrorTab) firstErrorTab = 'ORANG_TUA';
    }
    if (formData.nikIbu && (formData.statusHidupIbu !== 'Wafat' || formData.nikIbu.trim()) && !/^\d{16}$/.test(formData.nikIbu.trim())) {
      errors['nikIbu'] = 'NIK Ibu harus 16 digit angka';
      if (!firstErrorTab) firstErrorTab = 'ORANG_TUA';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (firstErrorTab) {
        setActiveTab(firstErrorTab);
      }
      showToast('error', 'Harap isi semua bidang yang wajib sebelum menyimpan.');
      return false;
    }

    return true;
  };

  const getTabErrorCount = (tabId: TabType) => {
    if (tabId === 'SANTRI') {
      return ['fullName', 'nik', 'nisn', 'noGlodemy', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'kewarganegaraan', 'noKk', 'anakKe', 'jumlahSaudara', 'wilayahId', 'cabangId', 'tanggalMasuk', 'statusHafidz'].filter(k => fieldErrors[k]).length;
    }
    if (tabId === 'ORANG_TUA') {
      return ['namaAyah', 'nikAyah', 'tempatLahirAyah', 'tanggalLahirAyah', 'statusHidupAyah', 'pendidikanAyah', 'pekerjaanAyah', 'penghasilanAyah', 'namaIbu', 'nikIbu', 'tempatLahirIbu', 'tanggalLahirIbu', 'statusHidupIbu', 'pendidikanIbu', 'pekerjaanIbu', 'penghasilanIbu'].filter(k => fieldErrors[k]).length;
    }
    if (tabId === 'ALAMAT') {
      return ['alamatProvId', 'alamatKabId', 'alamatKecId', 'alamatKelId', 'alamatJalan', 'phone', 'kontakDaruratNama', 'kontakDaruratTelp', 'kontakDaruratHubungan'].filter(k => fieldErrors[k]).length;
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    saveMutation.mutate(formData);
  };

  const tabs: { id: TabType; label: string; shortLabel: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'SANTRI',           label: t('siswa.form.tab_santri'),    shortLabel: t('siswa.form.tab_santri_short'),    icon: <User className="w-4 h-4" />,      show: true },
    { id: 'ORANG_TUA',        label: t('siswa.form.tab_ortu'),      shortLabel: t('siswa.form.tab_ortu_short'),      icon: <Users className="w-4 h-4" />,     show: true },
    { id: 'ALAMAT',           label: t('siswa.form.tab_alamat'),    shortLabel: t('siswa.form.tab_alamat_short'),    icon: <MapPin className="w-4 h-4" />,    show: true },
    { id: 'AKTIVITAS_BELAJAR',label: t('siswa.form.tab_aktivitas'), shortLabel: t('siswa.form.tab_aktivitas_short'), icon: <BookOpen className="w-4 h-4" />,  show: !!student },
    { id: 'RIWAYAT_NILAI',    label: t('siswa.form.tab_nilai'),     shortLabel: t('siswa.form.tab_nilai_short'),     icon: <ClipboardList className="w-4 h-4" />, show: !!student },
  ];

  const isEditMode = !!student;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden h-[92vh] sm:h-[820px] max-h-[100vh] sm:max-h-[calc(100vh-48px)]">
        
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {isEditMode ? (t('siswa.edit_modal_title') || 'Edit Data Santri') : (t('siswa.add_modal_title') || 'Tambah Santri Baru')}
              </h2>
              {isEditMode && student?.biodata?.fullName && (
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{student.biodata.fullName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ─── BODY: sidebar + content ─────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          
          {/* Navigation Tabs (Horizontal scroll on mobile, vertical sidebar on desktop) */}
          <div className="w-full md:w-48 flex-shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col py-2 px-3 md:py-3 md:px-2 gap-1.5 overflow-x-auto whitespace-nowrap custom-scrollbar flex-nowrap md:flex-wrap">
            {tabs.filter(t => t.show).map(tab => {
              const isActive = activeTab === tab.id;
              const errCount = getTabErrorCount(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 md:py-2.5 rounded-xl text-left transition-all duration-150 group relative flex-shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800 font-medium'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-500'}`}>
                    {tab.icon}
                  </span>
                  <span className="text-xs leading-tight">{tab.shortLabel || tab.label}</span>
                  {errCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full flex-shrink-0">
                      {errCount}
                    </span>
                  )}
                  {errCount === 0 && isActive && <ChevronRight className="hidden md:block w-3 h-3 ml-auto opacity-60 flex-shrink-0" />}
                </button>
              );
            })}

            {/* Document status indicators (Desktop only) */}
            <div className="hidden md:block mt-auto pt-3 border-t border-slate-200 px-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('siswa.form.sidebar_dokumen')}</p>
              {[
                { label: t('siswa.form.doc_foto'), value: formData.fotoUrl },
                { label: t('siswa.form.doc_ijazah'), value: formData.ijazahUrl },
                { label: t('siswa.form.doc_kk'), value: formData.kkUrl },
              ].map(doc => (
                <div key={doc.label} className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-slate-500">{doc.label}</span>
                  {doc.value
                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto min-w-0">
            <form id="student-form" onSubmit={handleSubmit} className={(activeTab === 'AKTIVITAS_BELAJAR' || activeTab === 'RIWAYAT_NILAI') ? 'hidden' : 'block h-full'}>
              
              {/* ── TAB: DATA SANTRI ─────────────────────────────── */}
              {activeTab === 'SANTRI' && (
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                  
                  {/* Upload Documents Row */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_berkas')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <FileCard 
                        label={t('siswa.form.foto_label')} 
                        icon={<Camera className="w-3.5 h-3.5" />} 
                        value={formData.fotoUrl}
                        studentId={student?.id}
                        jenis="passfoto"
                        onUploaded={(url) => { setFormData(prev => ({ ...prev, fotoUrl: url })); showToast('success', t('siswa.form.upload_success_foto')); }}
                        isCompressing={isCompressing}
                        setIsCompressing={setIsCompressing}
                        accept="image/*"
                      />
                      <FileCard 
                        label={t('siswa.form.ijazah_label')} 
                        icon={<FileText className="w-3.5 h-3.5" />} 
                        value={formData.ijazahUrl}
                        studentId={student?.id}
                        jenis="ijazah"
                        onUploaded={(url) => { setFormData(prev => ({ ...prev, ijazahUrl: url })); showToast('success', t('siswa.form.upload_success_ijazah')); }}
                        isCompressing={isCompressing}
                        setIsCompressing={setIsCompressing}
                        accept="image/*,application/pdf"
                      />
                      <FileCard 
                        label={t('siswa.form.kk_label')} 
                        icon={<Home className="w-3.5 h-3.5" />} 
                        value={formData.kkUrl}
                        studentId={student?.id}
                        jenis="kk"
                        onUploaded={(url) => { setFormData(prev => ({ ...prev, kkUrl: url })); showToast('success', t('siswa.form.upload_success_kk')); }}
                        isCompressing={isCompressing}
                        setIsCompressing={setIsCompressing}
                        accept="image/*,application/pdf"
                      />
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_identitas')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <InputField label={t('siswa.form.nama_lengkap')} required error={fieldErrors['fullName']}>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); setFieldErrors({ ...fieldErrors, fullName: '' }); }}
                            className={`${inputCls} ${fieldErrors['fullName'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                            placeholder={t('siswa.form.nama_lengkap_ph')}
                          />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.nik')} required error={fieldErrors['nik']}>
                        <input type="text" value={formData.nik} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 16); setFormData({ ...formData, nik: val }); setFieldErrors({ ...fieldErrors, nik: '' }); }} className={`${inputCls} ${fieldErrors['nik'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder="Masukkan 16 digit NIK" maxLength={16} />
                      </InputField>
                      <InputField label={t('siswa.form.nisn_label')} required error={fieldErrors['nisn']}>
                        <input type="text" value={formData.nisn} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setFormData({ ...formData, nisn: val }); setFieldErrors({ ...fieldErrors, nisn: '' }); }} className={`${inputCls} ${fieldErrors['nisn'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder="Masukkan 10 digit NISN" maxLength={10} />
                      </InputField>
                      <InputField label={`${t('siswa.form.nis_lokal')} / NISM`}>
                        <input type="text" value={formData.nisLokal} readOnly className={`${inputCls} bg-slate-100 cursor-not-allowed`} />
                      </InputField>
                      <InputField label={t('siswa.form.no_glodemy')} required error={fieldErrors['noGlodemy']}>
                        <input type="text" value={formData.noGlodemy} onChange={(e) => { setFormData({ ...formData, noGlodemy: e.target.value }); setFieldErrors({ ...fieldErrors, noGlodemy: '' }); }} className={`${inputCls} ${fieldErrors['noGlodemy'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} />
                      </InputField>
                      <InputField label={t('siswa.form.birth_place')} required error={fieldErrors['tempatLahir']}>
                        <input type="text" value={formData.tempatLahir} onChange={(e) => { setFormData({ ...formData, tempatLahir: e.target.value }); setFieldErrors({ ...fieldErrors, tempatLahir: '' }); }} className={`${inputCls} ${fieldErrors['tempatLahir'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.birth_place_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.birth_date')} required error={fieldErrors['tanggalLahir']}>
                        <input type="date" value={formData.tanggalLahir} onChange={(e) => { setFormData({ ...formData, tanggalLahir: e.target.value }); setFieldErrors({ ...fieldErrors, tanggalLahir: '' }); }} className={`${inputCls} ${fieldErrors['tanggalLahir'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} />
                      </InputField>
                      <InputField label={t('siswa.form.gender')} required error={fieldErrors['jenisKelamin']}>
                        <select value={formData.jenisKelamin} onChange={(e) => { setFormData({ ...formData, jenisKelamin: e.target.value }); setFieldErrors({ ...fieldErrors, jenisKelamin: '' }); }} className={`${selectCls} ${fieldErrors['jenisKelamin'] ? 'border-rose-300' : ''}`}>
                          <option value="L">{t('siswa.form.gender_l')}</option>
                          <option value="P">{t('siswa.form.gender_p')}</option>
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.nationality')} required error={fieldErrors['kewarganegaraan']}>
                        <Select
                          options={countries}
                          value={countries.find(c => c.value === formData.kewarganegaraan) || { value: formData.kewarganegaraan, label: formData.kewarganegaraan }}
                          onChange={(selected) => { setFormData({ ...formData, kewarganegaraan: selected?.value || 'Indonesia' }); setFieldErrors({ ...fieldErrors, kewarganegaraan: '' }); }}
                          placeholder={t('siswa.form.search_country')}
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: fieldErrors['kewarganegaraan'] ? '#fca5a5' : '#e2e8f0',
                              borderRadius: '0.5rem',
                              backgroundColor: '#f8fafc',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#6366f1' },
                              minHeight: '42px',
                              fontSize: '14px',
                            }),
                            option: (base, state) => ({
                              ...base,
                              backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : 'white',
                              color: state.isSelected ? 'white' : '#1e293b',
                              fontSize: '13px',
                            }),
                          }}
                        />
                      </InputField>
                      <InputField label={t('siswa.form.no_kk')} required error={fieldErrors['noKk']}>
                        <input type="text" value={formData.noKk} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 16); setFormData({ ...formData, noKk: val }); setFieldErrors({ ...fieldErrors, noKk: '' }); }} className={`${inputCls} ${fieldErrors['noKk'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder="Masukkan 16 digit Nomor KK" maxLength={16} />
                      </InputField>
                      <InputField label={t('siswa.form.anak_ke')} required error={fieldErrors['anakKe']}>
                        <input type="number" min={1} value={formData.anakKe} onChange={(e) => { setFormData({ ...formData, anakKe: e.target.value }); setFieldErrors({ ...fieldErrors, anakKe: '' }); }} className={`${inputCls} ${fieldErrors['anakKe'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} />
                      </InputField>
                      <InputField label={t('siswa.form.jumlah_saudara')} required error={fieldErrors['jumlahSaudara']}>
                        <input type="number" min={0} value={formData.jumlahSaudara} onChange={(e) => { setFormData({ ...formData, jumlahSaudara: e.target.value }); setFieldErrors({ ...fieldErrors, jumlahSaudara: '' }); }} className={`${inputCls} ${fieldErrors['jumlahSaudara'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} />
                      </InputField>
                    </div>
                  </div>

                  {/* Academic Registration */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_registrasi')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!student && user?.scope === 'GLOBAL' && (
                        <InputField label={t('siswa.form.wilayah_daftar')} required error={fieldErrors['wilayahId']}>
                          <select value={formData.wilayahId} onChange={(e) => { setFormData({ ...formData, wilayahId: e.target.value }); setFieldErrors({ ...fieldErrors, wilayahId: '' }); }} className={`${selectCls} ${fieldErrors['wilayahId'] ? 'border-rose-300' : ''}`}>
                            <option value="">{t('siswa.form.select_wilayah')}</option>
                            {wilayahList?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </InputField>
                      )}
                      {!student && (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
                        <InputField label={t('siswa.form.cabang_penempatan')} required error={fieldErrors['cabangId']}>
                          <select value={formData.cabangId} onChange={(e) => { setFormData({ ...formData, cabangId: e.target.value }); setFieldErrors({ ...fieldErrors, cabangId: '' }); }} className={`${selectCls} ${fieldErrors['cabangId'] ? 'border-rose-300' : ''}`}>
                            <option value="">{t('siswa.form.no_cabang')}</option>
                            {cabangList?.filter(c => formData.wilayahId ? c.wilayahId === formData.wilayahId : true).map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </InputField>
                      )}
                      <InputField label={t('siswa.form.tgl_masuk')} required error={fieldErrors['tanggalMasuk']}>
                        <input type="date" value={formData.tanggalMasuk} onChange={(e) => { setFormData({ ...formData, tanggalMasuk: e.target.value }); setFieldErrors({ ...fieldErrors, tanggalMasuk: '' }); }} className={`${inputCls} ${fieldErrors['tanggalMasuk'] ? 'border-rose-300' : ''}`} />
                      </InputField>

                      <InputField label="Rombongan Belajar (Kelas Formal Aktif)">
                        <input
                          type="text"
                          readOnly
                          value={
                            student?.siswaFormal?.kelas
                              ? `${student.siswaFormal.kelas.name} (Tingkat ${student.siswaFormal.kelas.tingkat || '-'})`
                              : 'Belum Terdaftar di Rombel Kelas Aktif'
                          }
                          className="block w-full rounded-lg border border-slate-200 bg-slate-100/80 py-2.5 px-3.5 text-sm font-semibold text-slate-700 cursor-not-allowed select-none focus:outline-none"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                          * Otomatis mengikuti Rombel aktif tempat santri terdaftar di menu Rombongan Belajar (/dashboard/formal/kelas).
                        </p>
                      </InputField>
                      <InputField label={t('siswa.form.jenis_siswa')}>
                        <input
                          type="text"
                          readOnly
                          value={
                            formData.jenisSiswa === 'MUADALAH'
                              ? `${t('siswa.form.jenis_muadalah')} (Otomatis dari Rombel)`
                              : formData.jenisSiswa === 'NON_MUADALAH'
                              ? `${t('siswa.form.jenis_non_muadalah')} (Otomatis dari Rombel)`
                              : 'Belum Terdaftar di Rombel Kelas (Otomatis)'
                          }
                          className="block w-full rounded-lg border border-slate-200 bg-slate-100/80 py-2.5 px-3.5 text-sm font-medium text-slate-500 cursor-not-allowed select-none focus:outline-none"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                          * Terisi otomatis jika santri dimasukkan ke Rombel Kelas
                        </p>
                      </InputField>

                      <InputField label={t('siswa.form.grup_daimi')}>
                        <input
                          type="text"
                          readOnly
                          value={
                            formData.grupDaimi
                              ? `${formData.grupDaimi} (Otomatis)`
                              : 'Belum Terdaftar di Grup Daimi (Otomatis)'
                          }
                          className="block w-full rounded-lg border border-slate-200 bg-slate-100/80 py-2.5 px-3.5 text-sm font-medium text-slate-500 cursor-not-allowed select-none focus:outline-none"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                          * Terisi otomatis jika santri dimasukkan ke Grup Daimi
                        </p>
                      </InputField>
                      <InputField label={t('siswa.form.status_hafidz')} required error={fieldErrors['statusHafidz']}>
                        <select value={formData.statusHafidz} onChange={(e) => { setFormData({ ...formData, statusHafidz: e.target.value }); setFieldErrors({ ...fieldErrors, statusHafidz: '' }); }} className={`${selectCls} ${fieldErrors['statusHafidz'] ? 'border-rose-300' : ''}`}>
                          <option value="">{t('siswa.form.status_hafidz_ph')}</option>
                          <option value="BELUM_MULAI">{t('siswa.form.hafidz_belum')}</option>
                          <option value="SEDANG_BERLANGSUNG">{t('siswa.form.hafidz_berlangsung')}</option>
                          <option value="SUDAH_SETOR_30_JUZ">{t('siswa.form.hafidz_30juz')}</option>
                          <option value="SUDAH_KHATAMAN_KUBRO">{t('siswa.form.hafidz_khataman')}</option>
                        </select>
                      </InputField>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: DATA ORANG TUA ──────────────────────────── */}
              {activeTab === 'ORANG_TUA' && (
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    
                    {/* Ayah */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">{t('siswa.form.ayah_title')}</h3>
                      </div>
                      <InputField label={t('siswa.form.nama_ayah')} required error={fieldErrors['namaAyah']}>
                        <input type="text" value={formData.namaAyah} onChange={(e) => { setFormData({ ...formData, namaAyah: e.target.value }); setFieldErrors({ ...fieldErrors, namaAyah: '' }); }} className={`${inputCls} ${fieldErrors['namaAyah'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.nama_ayah_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.nik_ayah')} required error={fieldErrors['nikAyah']}>
                        <input type="text" value={formData.nikAyah} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 16); setFormData({ ...formData, nikAyah: val }); setFieldErrors({ ...fieldErrors, nikAyah: '' }); }} className={`${inputCls} ${fieldErrors['nikAyah'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder="Masukkan 16 digit NIK Ayah" maxLength={16} />
                      </InputField>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label={t('siswa.form.tempat_lahir_ayah')} required error={fieldErrors['tempatLahirAyah']}>
                          <input type="text" value={formData.tempatLahirAyah} onChange={(e) => { setFormData({ ...formData, tempatLahirAyah: e.target.value }); setFieldErrors({ ...fieldErrors, tempatLahirAyah: '' }); }} className={`${inputCls} ${fieldErrors['tempatLahirAyah'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.tempat_lahir_ayah_ph')} />
                        </InputField>
                        <InputField label={t('siswa.form.tgl_lahir_ayah')} required error={fieldErrors['tanggalLahirAyah']}>
                          <input type="date" value={formData.tanggalLahirAyah} onChange={(e) => { setFormData({ ...formData, tanggalLahirAyah: e.target.value }); setFieldErrors({ ...fieldErrors, tanggalLahirAyah: '' }); }} className={`${inputCls} ${fieldErrors['tanggalLahirAyah'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.status_hidup_ayah')} required error={fieldErrors['statusHidupAyah']}>
                        <select value={formData.statusHidupAyah} onChange={(e) => { setFormData({ ...formData, statusHidupAyah: e.target.value }); setFieldErrors({ ...fieldErrors, statusHidupAyah: '' }); }} className={`${selectCls} ${fieldErrors['statusHidupAyah'] ? 'border-rose-300' : ''}`}>
                          <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                          <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                          <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pendidikan_ayah')} required error={fieldErrors['pendidikanAyah']}>
                        <select value={formData.pendidikanAyah} onChange={(e) => { setFormData({ ...formData, pendidikanAyah: e.target.value }); setFieldErrors({ ...fieldErrors, pendidikanAyah: '' }); }} className={`${selectCls} ${fieldErrors['pendidikanAyah'] ? 'border-rose-300' : ''}`}>
                          <option value="">{t('siswa.form.pilih_pendidikan')}</option>
                          {PENDIDIKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pekerjaan_ayah')} required error={fieldErrors['pekerjaanAyah']}>
                        <select value={formData.pekerjaanAyah} onChange={(e) => { setFormData({ ...formData, pekerjaanAyah: e.target.value }); setFieldErrors({ ...fieldErrors, pekerjaanAyah: '' }); }} className={`${selectCls} ${fieldErrors['pekerjaanAyah'] ? 'border-rose-300' : ''}`}>
                          <option value="">{t('siswa.form.pilih_pekerjaan')}</option>
                          {PEKERJAAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.penghasilan_ayah')} required error={fieldErrors['penghasilanAyah']}>
                        <select value={formData.penghasilanAyah} onChange={(e) => { setFormData({ ...formData, penghasilanAyah: e.target.value }); setFieldErrors({ ...fieldErrors, penghasilanAyah: '' }); }} className={`${selectCls} ${fieldErrors['penghasilanAyah'] ? 'border-rose-300' : ''}`}>
                          <option value="">{t('siswa.form.pilih_penghasilan')}</option>
                          {PENGHASILAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                    </div>

                    {/* Divider for mobile */}
                    <div className="block lg:hidden my-6 border-t border-slate-100" />

                    {/* Ibu */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">{t('siswa.form.ibu_title')}</h3>
                      </div>
                      <InputField label={t('siswa.form.nama_ibu')} required error={fieldErrors['namaIbu']}>
                        <input type="text" value={formData.namaIbu} onChange={(e) => { setFormData({ ...formData, namaIbu: e.target.value }); setFieldErrors({ ...fieldErrors, namaIbu: '' }); }} className={`${inputCls} ${fieldErrors['namaIbu'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.nama_ibu_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.nik_ibu')} required error={fieldErrors['nikIbu']}>
                        <input type="text" value={formData.nikIbu} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 16); setFormData({ ...formData, nikIbu: val }); setFieldErrors({ ...fieldErrors, nikIbu: '' }); }} className={`${inputCls} ${fieldErrors['nikIbu'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder="Masukkan 16 digit NIK Ibu" maxLength={16} />
                      </InputField>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label={t('siswa.form.tempat_lahir_ibu')} required error={fieldErrors['tempatLahirIbu']}>
                          <input type="text" value={formData.tempatLahirIbu} onChange={(e) => { setFormData({ ...formData, tempatLahirIbu: e.target.value }); setFieldErrors({ ...fieldErrors, tempatLahirIbu: '' }); }} className={`${inputCls} ${fieldErrors['tempatLahirIbu'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.tempat_lahir_ibu_ph')} />
                        </InputField>
                        <InputField label={t('siswa.form.tgl_lahir_ibu')} required error={fieldErrors['tanggalLahirIbu']}>
                          <input type="date" value={formData.tanggalLahirIbu} onChange={(e) => { setFormData({ ...formData, tanggalLahirIbu: e.target.value }); setFieldErrors({ ...fieldErrors, tanggalLahirIbu: '' }); }} className={`${inputCls} ${fieldErrors['tanggalLahirIbu'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.status_hidup_ibu')} required error={fieldErrors['statusHidupIbu']}>
                        <select value={formData.statusHidupIbu} onChange={(e) => { setFormData({ ...formData, statusHidupIbu: e.target.value }); setFieldErrors({ ...fieldErrors, statusHidupIbu: '' }); }} className={`${selectCls} ${fieldErrors['statusHidupIbu'] ? 'border-rose-300' : ''}`}>
                          <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                          <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                          <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pendidikan_ibu')} required error={fieldErrors['pendidikanIbu']}>
                        <select value={formData.pendidikanIbu} onChange={(e) => { setFormData({ ...formData, pendidikanIbu: e.target.value }); setFieldErrors({ ...fieldErrors, pendidikanIbu: '' }); }} className={`${selectCls} ${fieldErrors['pendidikanIbu'] ? 'border-rose-300' : ''}`}>
                          <option value="">{t('siswa.form.pilih_pendidikan')}</option>
                          {PENDIDIKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pekerjaan_ibu')} required error={fieldErrors['pekerjaanIbu']}>
                        <select value={formData.pekerjaanIbu} onChange={(e) => { setFormData({ ...formData, pekerjaanIbu: e.target.value }); setFieldErrors({ ...fieldErrors, pekerjaanIbu: '' }); }} className={`${selectCls} ${fieldErrors['pekerjaanIbu'] ? 'border-rose-300' : ''}`}>
                          <option value="">{t('siswa.form.pilih_pekerjaan')}</option>
                          {PEKERJAAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.penghasilan_ibu')} required error={fieldErrors['penghasilanIbu']}>
                        <select value={formData.penghasilanIbu} onChange={(e) => { setFormData({ ...formData, penghasilanIbu: e.target.value }); setFieldErrors({ ...fieldErrors, penghasilanIbu: '' }); }} className={`${selectCls} ${fieldErrors['penghasilanIbu'] ? 'border-rose-300' : ''}`}>
                          <option value="">{t('siswa.form.pilih_penghasilan')}</option>
                          {PENGHASILAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: ALAMAT ──────────────────────────────────── */}
              {activeTab === 'ALAMAT' && (
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_alamat')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label={t('siswa.form.provinsi')} required error={fieldErrors['alamatProvId']}>
                        <select
                          value={formData.alamatProvId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = provinces.find((p) => p.id === id)?.name || '';
                            setFormData({ ...formData, alamatProvId: id, alamatProvName: name, alamatKabId: '', alamatKabName: '', alamatKecId: '', alamatKecName: '', alamatKelId: '', alamatKelName: '', alamatJalan: '', address: '' });
                            setFieldErrors({ ...fieldErrors, alamatProvId: '' });
                          }}
                          className={`${selectCls} ${fieldErrors['alamatProvId'] ? 'border-rose-300' : ''}`}
                        >
                          <option value="">{t('siswa.form.provinsi_ph')}</option>
                          {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.kabupaten')} required error={fieldErrors['alamatKabId']}>
                        <select
                          value={formData.alamatKabId}
                          disabled={!formData.alamatProvId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = regencies.find((r) => r.id === id)?.name || '';
                            setFormData({ ...formData, alamatKabId: id, alamatKabName: name, alamatKecId: '', alamatKecName: '', alamatKelId: '', alamatKelName: '', alamatJalan: '', address: '' });
                            setFieldErrors({ ...fieldErrors, alamatKabId: '' });
                          }}
                          className={`${selectCls} ${fieldErrors['alamatKabId'] ? 'border-rose-300' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="">{t('siswa.form.kabupaten_ph')}</option>
                          {regencies.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.kecamatan')} required error={fieldErrors['alamatKecId']}>
                        <select
                          value={formData.alamatKecId}
                          disabled={!formData.alamatKabId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = districts.find((d) => d.id === id)?.name || '';
                            setFormData({ ...formData, alamatKecId: id, alamatKecName: name, alamatKelId: '', alamatKelName: '', alamatJalan: '', address: '' });
                            setFieldErrors({ ...fieldErrors, alamatKecId: '' });
                          }}
                          className={`${selectCls} ${fieldErrors['alamatKecId'] ? 'border-rose-300' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="">{t('siswa.form.kecamatan_ph')}</option>
                          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.kelurahan')} required error={fieldErrors['alamatKelId']}>
                        <select
                          value={formData.alamatKelId}
                          disabled={!formData.alamatKecId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = villages.find((v) => v.id === id)?.name || '';
                            setFormData({ ...formData, alamatKelId: id, alamatKelName: name, alamatJalan: '', address: '' });
                            setFieldErrors({ ...fieldErrors, alamatKelId: '' });
                          }}
                          className={`${selectCls} ${fieldErrors['alamatKelId'] ? 'border-rose-300' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="">{t('siswa.form.kelurahan_ph')}</option>
                          {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </InputField>
                      <div className="sm:col-span-2">
                        <InputField label={t('siswa.form.alamat_jalan')} required error={fieldErrors['alamatJalan']}>
                          <textarea
                            value={formData.alamatJalan}
                            onChange={(e) => {
                              const val = e.target.value;
                              const unifiedAddress = `${val}, Kel. ${formData.alamatKelName || ''}, Kec. ${formData.alamatKecName || ''}, Kab/Kota. ${formData.alamatKabName || ''}, Prov. ${formData.alamatProvName || ''}`;
                              setFormData({ ...formData, alamatJalan: val, address: unifiedAddress });
                              setFieldErrors({ ...fieldErrors, alamatJalan: '' });
                            }}
                            rows={2}
                            className={`${inputCls} ${fieldErrors['alamatJalan'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                            placeholder={t('siswa.form.alamat_jalan_ph')}
                          />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.phone')} required error={fieldErrors['phone']}>
                        <input type="text" value={formData.phone} onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setFieldErrors({ ...fieldErrors, phone: '' }); }} className={`${inputCls} ${fieldErrors['phone'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.phone_ph')} />
                      </InputField>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_darurat')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <InputField label={t('siswa.form.darurat_nama')} required error={fieldErrors['kontakDaruratNama']}>
                        <input type="text" value={formData.kontakDaruratNama} onChange={(e) => { setFormData({ ...formData, kontakDaruratNama: e.target.value }); setFieldErrors({ ...fieldErrors, kontakDaruratNama: '' }); }} className={`${inputCls} ${fieldErrors['kontakDaruratNama'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.darurat_nama_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.darurat_telp')} required error={fieldErrors['kontakDaruratTelp']}>
                        <input type="text" value={formData.kontakDaruratTelp} onChange={(e) => { setFormData({ ...formData, kontakDaruratTelp: e.target.value }); setFieldErrors({ ...fieldErrors, kontakDaruratTelp: '' }); }} className={`${inputCls} ${fieldErrors['kontakDaruratTelp'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.darurat_telp_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.darurat_hub')} required error={fieldErrors['kontakDaruratHubungan']}>
                        <input type="text" value={formData.kontakDaruratHubungan} onChange={(e) => { setFormData({ ...formData, kontakDaruratHubungan: e.target.value }); setFieldErrors({ ...fieldErrors, kontakDaruratHubungan: '' }); }} className={`${inputCls} ${fieldErrors['kontakDaruratHubungan'] ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`} placeholder={t('siswa.form.darurat_hub_ph')} />
                      </InputField>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {activeTab === 'AKTIVITAS_BELAJAR' && student && (
              <div className="p-6 h-full">
                <AktivitasBelajarTab
                  student={student}
                  onStatusChange={(isActive) => {
                    setFormData({ ...formData, isActive });
                  }}
                />
              </div>
            )}

            {activeTab === 'RIWAYAT_NILAI' && student && (
              <div className="p-6 h-full">
                <RiwayatNilaiTab student={student} />
              </div>
            )}
          </div>
        </div>

        {/* ─── FOOTER ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 bg-white flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
            {isCompressing && (
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span className="truncate">{t('siswa.form.compressing')}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-150"
            >
              {t('common.cancel')}
            </button>
            {activeTab !== 'AKTIVITAS_BELAJAR' && activeTab !== 'RIWAYAT_NILAI' && (
              <button
                type="submit"
                form="student-form"
                disabled={saveMutation.isPending || isCompressing}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shadow-indigo-200"
              >
                {saveMutation.isPending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('siswa.form.saving')}</>
                  : <>{t('common.save')}</>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── IMAGE VIEWER ────────────────────────────────────── */}
      {viewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <button
            type="button"
            onClick={() => setViewImage(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={viewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => {
          setNotification(prev => ({ ...prev, isOpen: false }));
          if (notification.type === 'success') {
            onClose();
          }
        }}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
