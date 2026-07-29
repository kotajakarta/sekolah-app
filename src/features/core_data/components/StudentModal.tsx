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
const InputField = ({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
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
        noKk: (student.biodata as any)?.noKk || '',
        anakKe: (student.biodata as any)?.anakKe || '',
        jumlahSaudara: (student.biodata as any)?.jumlahSaudara || '',
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
        nikAyah: (student.biodata as any)?.nikAyah || '',
        tempatLahirAyah: (student.biodata as any)?.tempatLahirAyah || '',
        tanggalLahirAyah: (student.biodata as any)?.tanggalLahirAyah ? new Date((student.biodata as any).tanggalLahirAyah).toISOString().split('T')[0] : '',
        pekerjaanAyah: student.biodata?.pekerjaanAyah || '',
        pendidikanAyah: student.biodata?.pendidikanAyah || '',
        penghasilanAyah: (student.biodata as any)?.penghasilanAyah || '',
        namaIbu: student.biodata?.namaIbu || '',
        statusHidupIbu: student.biodata?.statusHidupIbu || 'Masih Hidup',
        nikIbu: (student.biodata as any)?.nikIbu || '',
        tempatLahirIbu: (student.biodata as any)?.tempatLahirIbu || '',
        tanggalLahirIbu: (student.biodata as any)?.tanggalLahirIbu ? new Date((student.biodata as any).tanggalLahirIbu).toISOString().split('T')[0] : '',
        pekerjaanIbu: student.biodata?.pekerjaanIbu || '',
        pendidikanIbu: student.biodata?.pendidikanIbu || '',
        penghasilanIbu: (student.biodata as any)?.penghasilanIbu || '',
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
        jenisSiswa: student.jenisSiswa || '',
        grupDaimi: student.grupDaimi || '',
        statusHafidz: student.statusHafidz || '',
        tanggalMasuk: new Date().toISOString().split('T')[0],
        isActive: student.isActive !== undefined ? student.isActive : true,
        alamatProvId: (student.biodata as any)?.alamatProvId || '',
        alamatProvName: (student.biodata as any)?.alamatProvName || '',
        alamatKabId: (student.biodata as any)?.alamatKabId || '',
        alamatKabName: (student.biodata as any)?.alamatKabName || '',
        alamatKecId: (student.biodata as any)?.alamatKecId || '',
        alamatKecName: (student.biodata as any)?.alamatKecName || '',
        alamatKelId: (student.biodata as any)?.alamatKelId || '',
        alamatKelName: (student.biodata as any)?.alamatKelName || '',
        alamatJalan: (student.biodata as any)?.alamatJalan || '',
      });

      if ((student.biodata as any)?.alamatProvId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${(student.biodata as any).alamatProvId}.json`)
          .then((r) => r.json()).then((d) => setRegencies(d)).catch(console.error);
      }
      if ((student.biodata as any)?.alamatKabId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${(student.biodata as any).alamatKabId}.json`)
          .then((r) => r.json()).then((d) => setDistricts(d)).catch(console.error);
      }
      if ((student.biodata as any)?.alamatKecId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${(student.biodata as any).alamatKecId}.json`)
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
      setNotification({
        isOpen: true,
        type: 'error',
        title: t('siswa.form.save_error_title'),
        message: `${t('siswa.form.save_error_msg')}\n${msg}\n\n${t('siswa.form.save_error_contact')}`
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
           style={{ maxHeight: 'calc(100vh - 48px)', height: 'min(820px, calc(100vh - 48px))' }}>
        
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 flex-shrink-0">
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
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Sidebar Tabs */}
          <div className="w-44 flex-shrink-0 bg-slate-50 border-r border-slate-100 flex flex-col py-3 px-2 gap-1">
            {tabs.filter(t => t.show).map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-700'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-500'}`}>
                    {tab.icon}
                  </span>
                  <span className="text-xs font-semibold leading-tight">{tab.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                </button>
              );
            })}

            {/* Document status indicators */}
            <div className="mt-auto pt-3 border-t border-slate-200 px-1">
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
                <div className="p-6 space-y-6">
                  
                  {/* Upload Documents Row */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_berkas')}</h3>
                    <div className="grid grid-cols-3 gap-3">
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
                        <InputField label={t('siswa.form.nama_lengkap')} required>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className={inputCls}
                            placeholder={t('siswa.form.nama_lengkap_ph')}
                          />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.nik')}>
                        <input type="text" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className={inputCls} placeholder={t('siswa.form.nik_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.nisn_label')}>
                        <input type="text" value={formData.nisn} onChange={(e) => setFormData({ ...formData, nisn: e.target.value })} className={inputCls} placeholder={t('siswa.form.nisn_ph')} />
                      </InputField>
                      <InputField label={`${t('siswa.form.nis_lokal')} / NISM`}>
                        <input type="text" value={formData.nisLokal} onChange={(e) => setFormData({ ...formData, nisLokal: e.target.value })} className={inputCls} />
                      </InputField>
                      <InputField label={t('siswa.form.no_glodemy')}>
                        <input type="text" value={formData.noGlodemy} onChange={(e) => setFormData({ ...formData, noGlodemy: e.target.value })} className={inputCls} />
                      </InputField>
                      <InputField label={t('siswa.form.birth_place')}>
                        <input type="text" value={formData.tempatLahir} onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })} className={inputCls} placeholder={t('siswa.form.birth_place_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.birth_date')}>
                        <input type="date" value={formData.tanggalLahir} onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })} className={inputCls} />
                      </InputField>
                      <InputField label={t('siswa.form.gender')}>
                        <select value={formData.jenisKelamin} onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })} className={selectCls}>
                          <option value="L">{t('siswa.form.gender_l')}</option>
                          <option value="P">{t('siswa.form.gender_p')}</option>
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.nationality')}>
                        <Select
                          options={countries}
                          value={countries.find(c => c.value === formData.kewarganegaraan) || { value: formData.kewarganegaraan, label: formData.kewarganegaraan }}
                          onChange={(selected) => setFormData({ ...formData, kewarganegaraan: selected?.value || 'Indonesia' })}
                          placeholder={t('siswa.form.search_country')}
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#e2e8f0',
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
                      <InputField label={t('siswa.form.no_kk')}>
                        <input type="text" value={formData.noKk} onChange={(e) => setFormData({ ...formData, noKk: e.target.value })} className={inputCls} placeholder={t('siswa.form.no_kk_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.anak_ke')}>
                        <input type="number" min={1} value={formData.anakKe} onChange={(e) => setFormData({ ...formData, anakKe: e.target.value })} className={inputCls} />
                      </InputField>
                      <InputField label={t('siswa.form.jumlah_saudara')}>
                        <input type="number" min={0} value={formData.jumlahSaudara} onChange={(e) => setFormData({ ...formData, jumlahSaudara: e.target.value })} className={inputCls} />
                      </InputField>
                    </div>
                  </div>

                  {/* Academic Registration */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_registrasi')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!student && user?.scope === 'GLOBAL' && (
                        <InputField label={t('siswa.form.wilayah_daftar')} required>
                          <select required value={formData.wilayahId} onChange={(e) => setFormData({ ...formData, wilayahId: e.target.value })} className={selectCls}>
                            <option value="">{t('siswa.form.select_wilayah')}</option>
                            {wilayahList?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </InputField>
                      )}
                      {!student && (user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
                        <InputField label={t('siswa.form.cabang_penempatan')}>
                          <select value={formData.cabangId} onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })} className={selectCls}>
                            <option value="">{t('siswa.form.no_cabang')}</option>
                            {cabangList?.filter(c => formData.wilayahId ? c.wilayahId === formData.wilayahId : true).map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </InputField>
                      )}
                      <InputField label={t('siswa.form.tgl_masuk')}>
                        <input type="date" value={formData.tanggalMasuk} onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })} className={inputCls} />
                      </InputField>
                      <InputField label={t('siswa.form.jenis_siswa')}>
                        <select value={formData.jenisSiswa} onChange={(e) => setFormData({ ...formData, jenisSiswa: e.target.value })} className={selectCls}>
                          <option value="">{t('siswa.form.jenis_siswa_ph')}</option>
                          <option value="MUADALAH">{t('siswa.form.jenis_muadalah')}</option>
                          <option value="NON_MUADALAH">{t('siswa.form.jenis_non_muadalah')}</option>
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.grup_daimi')}>
                        <select value={formData.grupDaimi} onChange={(e) => setFormData({ ...formData, grupDaimi: e.target.value })} className={selectCls}>
                          <option value="">{t('siswa.form.grup_daimi_ph')}</option>
                          {grupDaimiList?.map((grup: any) => (
                            <option key={grup.id} value={grup.name}>
                              {grup.name}{grup.jenis ? ` (${grup.jenis})` : ''}
                            </option>
                          ))}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.status_hafidz')}>
                        <select value={formData.statusHafidz} onChange={(e) => setFormData({ ...formData, statusHafidz: e.target.value })} className={selectCls}>
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

              {/* ── TAB: ORANG TUA ───────────────────────────────── */}
              {activeTab === 'ORANG_TUA' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6">
                    
                    {/* Ayah */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">{t('siswa.form.ayah_title')}</h3>
                      </div>
                      <InputField label={t('siswa.form.nama_ayah')}>
                        <input type="text" value={formData.namaAyah} onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })} className={inputCls} placeholder={t('siswa.form.nama_ayah_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.nik_ayah')}>
                        <input type="text" value={formData.nikAyah} onChange={(e) => setFormData({ ...formData, nikAyah: e.target.value })} className={inputCls} placeholder={t('siswa.form.nik_ph')} maxLength={16} />
                      </InputField>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label={t('siswa.form.tempat_lahir_ayah')}>
                          <input type="text" value={formData.tempatLahirAyah} onChange={(e) => setFormData({ ...formData, tempatLahirAyah: e.target.value })} className={inputCls} placeholder={t('siswa.form.tempat_lahir_ayah_ph')} />
                        </InputField>
                        <InputField label={t('siswa.form.tgl_lahir_ayah')}>
                          <input type="date" value={formData.tanggalLahirAyah} onChange={(e) => setFormData({ ...formData, tanggalLahirAyah: e.target.value })} className={inputCls} />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.status_hidup_ayah')}>
                        <select value={formData.statusHidupAyah} onChange={(e) => setFormData({ ...formData, statusHidupAyah: e.target.value })} className={selectCls}>
                          <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                          <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                          <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pendidikan_ayah')}>
                        <select value={formData.pendidikanAyah} onChange={(e) => setFormData({ ...formData, pendidikanAyah: e.target.value })} className={selectCls}>
                          <option value="">{t('siswa.form.pilih_pendidikan')}</option>
                          {PENDIDIKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pekerjaan_ayah')}>
                        <select value={formData.pekerjaanAyah} onChange={(e) => setFormData({ ...formData, pekerjaanAyah: e.target.value })} className={selectCls}>
                          <option value="">{t('siswa.form.pilih_pekerjaan')}</option>
                          {PEKERJAAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.penghasilan_ayah')}>
                        <select value={formData.penghasilanAyah} onChange={(e) => setFormData({ ...formData, penghasilanAyah: e.target.value })} className={selectCls}>
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
                      <InputField label={t('siswa.form.nama_ibu')}>
                        <input type="text" value={formData.namaIbu} onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })} className={inputCls} placeholder={t('siswa.form.nama_ibu_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.nik_ibu')}>
                        <input type="text" value={formData.nikIbu} onChange={(e) => setFormData({ ...formData, nikIbu: e.target.value })} className={inputCls} placeholder={t('siswa.form.nik_ph')} maxLength={16} />
                      </InputField>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label={t('siswa.form.tempat_lahir_ibu')}>
                          <input type="text" value={formData.tempatLahirIbu} onChange={(e) => setFormData({ ...formData, tempatLahirIbu: e.target.value })} className={inputCls} placeholder={t('siswa.form.tempat_lahir_ibu_ph')} />
                        </InputField>
                        <InputField label={t('siswa.form.tgl_lahir_ibu')}>
                          <input type="date" value={formData.tanggalLahirIbu} onChange={(e) => setFormData({ ...formData, tanggalLahirIbu: e.target.value })} className={inputCls} />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.status_hidup_ibu')}>
                        <select value={formData.statusHidupIbu} onChange={(e) => setFormData({ ...formData, statusHidupIbu: e.target.value })} className={selectCls}>
                          <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                          <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                          <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pendidikan_ibu')}>
                        <select value={formData.pendidikanIbu} onChange={(e) => setFormData({ ...formData, pendidikanIbu: e.target.value })} className={selectCls}>
                          <option value="">{t('siswa.form.pilih_pendidikan')}</option>
                          {PENDIDIKAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.pekerjaan_ibu')}>
                        <select value={formData.pekerjaanIbu} onChange={(e) => setFormData({ ...formData, pekerjaanIbu: e.target.value })} className={selectCls}>
                          <option value="">{t('siswa.form.pilih_pekerjaan')}</option>
                          {PEKERJAAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.penghasilan_ibu')}>
                        <select value={formData.penghasilanIbu} onChange={(e) => setFormData({ ...formData, penghasilanIbu: e.target.value })} className={selectCls}>
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
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_alamat')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label={t('siswa.form.provinsi')}>
                        <select
                          value={formData.alamatProvId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = provinces.find((p) => p.id === id)?.name || '';
                            setFormData({ ...formData, alamatProvId: id, alamatProvName: name, alamatKabId: '', alamatKabName: '', alamatKecId: '', alamatKecName: '', alamatKelId: '', alamatKelName: '', alamatJalan: '', address: '' });
                          }}
                          className={selectCls}
                        >
                          <option value="">{t('siswa.form.provinsi_ph')}</option>
                          {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.kabupaten')}>
                        <select
                          value={formData.alamatKabId}
                          disabled={!formData.alamatProvId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = regencies.find((r) => r.id === id)?.name || '';
                            setFormData({ ...formData, alamatKabId: id, alamatKabName: name, alamatKecId: '', alamatKecName: '', alamatKelId: '', alamatKelName: '', alamatJalan: '', address: '' });
                          }}
                          className={selectCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                        >
                          <option value="">{t('siswa.form.kabupaten_ph')}</option>
                          {regencies.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.kecamatan')}>
                        <select
                          value={formData.alamatKecId}
                          disabled={!formData.alamatKabId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = districts.find((d) => d.id === id)?.name || '';
                            setFormData({ ...formData, alamatKecId: id, alamatKecName: name, alamatKelId: '', alamatKelName: '', alamatJalan: '', address: '' });
                          }}
                          className={selectCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                        >
                          <option value="">{t('siswa.form.kecamatan_ph')}</option>
                          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </InputField>
                      <InputField label={t('siswa.form.kelurahan')}>
                        <select
                          value={formData.alamatKelId}
                          disabled={!formData.alamatKecId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const name = villages.find((v) => v.id === id)?.name || '';
                            setFormData({ ...formData, alamatKelId: id, alamatKelName: name, alamatJalan: '', address: '' });
                          }}
                          className={selectCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                        >
                          <option value="">{t('siswa.form.kelurahan_ph')}</option>
                          {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </InputField>
                      <div className="sm:col-span-2">
                        <InputField label={t('siswa.form.alamat_jalan')}>
                          <textarea
                            value={formData.alamatJalan}
                            onChange={(e) => {
                              const val = e.target.value;
                              const unifiedAddress = `${val}, Kel. ${formData.alamatKelName || ''}, Kec. ${formData.alamatKecName || ''}, Kab/Kota. ${formData.alamatKabName || ''}, Prov. ${formData.alamatProvName || ''}`;
                              setFormData({ ...formData, alamatJalan: val, address: unifiedAddress });
                            }}
                            rows={2}
                            className={inputCls}
                            placeholder={t('siswa.form.alamat_jalan_ph')}
                          />
                        </InputField>
                      </div>
                      <InputField label={t('siswa.form.phone')}>
                        <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder={t('siswa.form.phone_ph')} />
                      </InputField>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('siswa.form.section_darurat')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <InputField label={t('siswa.form.darurat_nama')}>
                        <input type="text" value={formData.kontakDaruratNama} onChange={(e) => setFormData({ ...formData, kontakDaruratNama: e.target.value })} className={inputCls} placeholder={t('siswa.form.darurat_nama_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.darurat_telp')}>
                        <input type="text" value={formData.kontakDaruratTelp} onChange={(e) => setFormData({ ...formData, kontakDaruratTelp: e.target.value })} className={inputCls} placeholder={t('siswa.form.darurat_telp_ph')} />
                      </InputField>
                      <InputField label={t('siswa.form.darurat_hub')}>
                        <input type="text" value={formData.kontakDaruratHubungan} onChange={(e) => setFormData({ ...formData, kontakDaruratHubungan: e.target.value })} className={inputCls} placeholder={t('siswa.form.darurat_hub_ph')} />
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
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {isCompressing && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('siswa.form.compressing')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
            >
              {t('common.cancel')}
            </button>
            {activeTab !== 'AKTIVITAS_BELAJAR' && activeTab !== 'RIWAYAT_NILAI' && (
              <button
                type="submit"
                form="student-form"
                disabled={saveMutation.isPending || isCompressing}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shadow-indigo-200"
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
