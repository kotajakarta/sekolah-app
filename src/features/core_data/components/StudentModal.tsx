import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { Student } from '../hooks/useGetStudents';
import { compressImage } from '../../../lib/imageCompressor';
import { X, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, Eye } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useGetWilayah, useGetCabang } from '../hooks/useMasterData';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';

interface StudentModalProps {
  student?: Student | null;
  onClose: () => void;
}

export default function StudentModal({ student, onClose }: StudentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: wilayahList } = useGetWilayah();
  const { data: cabangList } = useGetCabang();
  const { t } = useTranslation();
  
  const [countries, setCountries] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name')
      .then(res => res.json())
      .then((data: any[]) => {
        const formatted = data.map(c => ({ value: c.name.common, label: c.name.common }));
        formatted.sort((a, b) => a.label.localeCompare(b.label));
        const idn = formatted.find(c => c.value === 'Indonesia');
        const rest = formatted.filter(c => c.value !== 'Indonesia');
        if (idn) {
          setCountries([idn, ...rest]);
        } else {
          setCountries(formatted);
        }
      })
      .catch(err => {
        setCountries([{ value: 'Indonesia', label: 'Indonesia' }, { value: 'Malaysia', label: 'Malaysia' }]);
      });
  }, []);

  const [expandedSections, setExpandedSections] = useState({
    utama: true,
    akademik: true,
    orangTua: true,
    darurat: true,
    berkas: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [viewImage, setViewImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'fotoBase64' | 'ijazahBase64' | 'kkBase64') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('siswa.form.alert_not_image'));
      return;
    }

    try {
      setIsCompressing(true);
      // max size 150kb
      const compressedBase64 = await compressImage(file, 150);
      setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
    } catch (error) {
      console.error('Error compressing image:', error);
      alert(t('siswa.form.alert_compress_fail'));
    } finally {
      setIsCompressing(false);
    }
  };

  const [formData, setFormData] = useState({
    nik: '',
    nisLokal: '',
    noGlodemy: '',
    fullName: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    kewarganegaraan: 'WNI',
    namaAyah: '',
    statusHidupAyah: 'Masih Hidup',
    pekerjaanAyah: '',
    pendidikanAyah: '',
    namaIbu: '',
    statusHidupIbu: 'Masih Hidup',
    pekerjaanIbu: '',
    pendidikanIbu: '',
    address: '',
    phone: '',
    kontakDaruratNama: '',
    kontakDaruratTelp: '',
    kontakDaruratHubungan: '',
    fotoBase64: '',
    ijazahBase64: '',
    kkBase64: '',
    wilayahId: user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user.wilayahId || '' : '',
    cabangId: user?.scope === 'CABANG' ? user.cabangId || '' : '',
    tanggalMasuk: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (student) {
      setFormData({
        nik: student.biodata?.nik || '',
        nisLokal: student.biodata?.nisLokal || '',
        noGlodemy: student.biodata?.noGlodemy || '',
        fullName: student.biodata?.fullName || '',
        tempatLahir: student.biodata?.tempatLahir || '',
        tanggalLahir: student.biodata?.tanggalLahir ? new Date(student.biodata.tanggalLahir).toISOString().split('T')[0] : '',
        jenisKelamin: student.biodata?.jenisKelamin || 'L',
        kewarganegaraan: student.biodata?.kewarganegaraan || 'WNI',
        namaAyah: student.biodata?.namaAyah || '',
        statusHidupAyah: student.biodata?.statusHidupAyah || 'Masih Hidup',
        pekerjaanAyah: student.biodata?.pekerjaanAyah || '',
        pendidikanAyah: student.biodata?.pendidikanAyah || '',
        namaIbu: student.biodata?.namaIbu || '',
        statusHidupIbu: student.biodata?.statusHidupIbu || 'Masih Hidup',
        pekerjaanIbu: student.biodata?.pekerjaanIbu || '',
        pendidikanIbu: student.biodata?.pendidikanIbu || '',
        address: student.biodata?.address || '',
        phone: student.biodata?.phone || '',
        kontakDaruratNama: student.biodata?.kontakDaruratNama || '',
        kontakDaruratTelp: student.biodata?.kontakDaruratTelp || '',
        kontakDaruratHubungan: student.biodata?.kontakDaruratHubungan || '',
        fotoBase64: student.biodata?.fotoBase64 || '',
        ijazahBase64: student.biodata?.ijazahBase64 || '',
        kkBase64: student.biodata?.kkBase64 || '',
        wilayahId: student.wilayahId || '',
        cabangId: student.cabangId || '',
        tanggalMasuk: new Date().toISOString().split('T')[0] // Only used on create
      });
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
      queryClient.invalidateQueries({ queryKey: ['students', 'pool'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const SectionHeader = ({ title, section }: { title: string, section: keyof typeof expandedSections }) => (
    <div 
      className="flex justify-between items-center bg-slate-50 p-3 rounded-md cursor-pointer mt-6 mb-4"
      onClick={() => toggleSection(section)}
    >
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      {expandedSections[section] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl flex flex-col max-h-[90vh]">
          <div className="bg-white px-6 py-4 border-b border-slate-200 rounded-t-xl flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">
              {student ? t('common.edit') + ' ' + t('siswa.title') : t('common.add') + ' ' + t('siswa.title')}
            </h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto p-6 flex-1">
            <form id="student-form" onSubmit={handleSubmit}>
              
              <SectionHeader title={t('siswa.form.section_utama')} section="utama" />
              {expandedSections.utama && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nik')}</label>
                    <input type="text" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nis_lokal')}</label>
                    <input type="text" value={formData.nisLokal} onChange={(e) => setFormData({ ...formData, nisLokal: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.no_glodemy')}</label>
                    <input type="text" value={formData.noGlodemy} onChange={(e) => setFormData({ ...formData, noGlodemy: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.full_name')}</label>
                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.birth_place')}</label>
                    <input type="text" value={formData.tempatLahir} onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.birth_date')}</label>
                    <input type="date" value={formData.tanggalLahir} onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.gender')}</label>
                    <select value={formData.jenisKelamin} onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="L">{t('siswa.form.gender_l')}</option>
                      <option value="P">{t('siswa.form.gender_p')}</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nationality')}</label>
                    <Select
                      options={countries}
                      value={countries.find(c => c.value === formData.kewarganegaraan) || { value: formData.kewarganegaraan, label: formData.kewarganegaraan }}
                      onChange={(selected) => setFormData({ ...formData, kewarganegaraan: selected?.value || 'Indonesia' })}
                      className="mt-1"
                      placeholder={t('siswa.form.search_country')}
                      isClearable
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.address')}</label>
                    <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.phone')}</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              {!student && (
                <>
                  <SectionHeader title={t('siswa.form.section_akademik')} section="akademik" />
                  {expandedSections.akademik && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user?.scope === 'GLOBAL' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('siswa.form.wilayah_daftar')}</label>
                          <select required value={formData.wilayahId} onChange={(e) => setFormData({ ...formData, wilayahId: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">{t('siswa.form.select_wilayah')}</option>
                            {wilayahList?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </div>
                      )}
                      
                      {(user?.scope === 'GLOBAL' || user?.scope === 'WILAYAH') && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('siswa.form.cabang_penempatan')}</label>
                          <select value={formData.cabangId} onChange={(e) => setFormData({ ...formData, cabangId: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">{t('siswa.form.no_cabang')}</option>
                            {cabangList?.filter(c => formData.wilayahId ? c.wilayahId === formData.wilayahId : true).map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700">{t('siswa.form.tgl_masuk')}</label>
                        <input type="date" value={formData.tanggalMasuk} onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <SectionHeader title={t('siswa.form.section_ortu')} section="orangTua" />
              {expandedSections.orangTua && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  {/* Ayah */}
                  <div className="space-y-4 border-r border-slate-100 pr-4">
                    <h5 className="font-medium text-sm text-slate-800 border-b border-slate-100 pb-2">{t('siswa.form.ayah_title')}</h5>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nama_ayah')}</label>
                      <input type="text" value={formData.namaAyah} onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.status_hidup_ayah')}</label>
                      <select value={formData.statusHidupAyah} onChange={(e) => setFormData({ ...formData, statusHidupAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                        <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                        <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pekerjaan_ayah')}</label>
                      <input type="text" value={formData.pekerjaanAyah} onChange={(e) => setFormData({ ...formData, pekerjaanAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pendidikan_ayah')}</label>
                      <input type="text" value={formData.pendidikanAyah} onChange={(e) => setFormData({ ...formData, pendidikanAyah: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>

                  {/* Ibu */}
                  <div className="space-y-4 pl-4">
                    <h5 className="font-medium text-sm text-slate-800 border-b border-slate-100 pb-2">{t('siswa.form.ibu_title')}</h5>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.nama_ibu')}</label>
                      <input type="text" value={formData.namaIbu} onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.status_hidup_ibu')}</label>
                      <select value={formData.statusHidupIbu} onChange={(e) => setFormData({ ...formData, statusHidupIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value={t('siswa.form.status_hidup')}>{t('siswa.form.status_hidup')}</option>
                        <option value={t('siswa.form.status_mati')}>{t('siswa.form.status_mati')}</option>
                        <option value={t('siswa.form.status_unknown')}>{t('siswa.form.status_unknown')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pekerjaan_ibu')}</label>
                      <input type="text" value={formData.pekerjaanIbu} onChange={(e) => setFormData({ ...formData, pekerjaanIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{t('siswa.form.pendidikan_ibu')}</label>
                      <input type="text" value={formData.pendidikanIbu} onChange={(e) => setFormData({ ...formData, pendidikanIbu: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}

              <SectionHeader title={t('siswa.form.section_darurat')} section="darurat" />
              {expandedSections.darurat && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.darurat_nama')}</label>
                    <input type="text" value={formData.kontakDaruratNama} onChange={(e) => setFormData({ ...formData, kontakDaruratNama: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.darurat_telp')}</label>
                    <input type="text" value={formData.kontakDaruratTelp} onChange={(e) => setFormData({ ...formData, kontakDaruratTelp: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t('siswa.form.darurat_hub')}</label>
                    <input type="text" value={formData.kontakDaruratHubungan} onChange={(e) => setFormData({ ...formData, kontakDaruratHubungan: e.target.value })} placeholder={t('siswa.form.darurat_hub_ph')} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              <SectionHeader title={t('siswa.form.section_berkas')} section="berkas" />
              {expandedSections.berkas && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Foto */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                    <h5 className="font-medium text-sm text-slate-800 mb-3">{t('siswa.form.foto')}</h5>
                    {formData.fotoBase64 ? (
                      <div className="relative w-24 h-32 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                        <img src={formData.fotoBase64} alt="Foto thumbnail" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => setViewImage(formData.fotoBase64)} className="text-white p-2 hover:text-blue-300">
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-32 mb-3 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm w-full text-center">
                      <span>{formData.fotoBase64 ? t('siswa.form.change_foto') : t('siswa.form.upload_foto')}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'fotoBase64')} disabled={isCompressing} />
                    </label>
                  </div>

                  {/* Ijazah */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                    <h5 className="font-medium text-sm text-slate-800 mb-3">{t('siswa.form.ijazah')}</h5>
                    {formData.ijazahBase64 ? (
                      <div className="relative w-32 h-24 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                        <img src={formData.ijazahBase64} alt="Ijazah thumbnail" className="object-contain w-full h-full" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => setViewImage(formData.ijazahBase64)} className="text-white p-2 hover:text-blue-300">
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-24 mb-3 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm w-full text-center">
                      <span>{formData.ijazahBase64 ? t('siswa.form.change_ijazah') : t('siswa.form.upload_ijazah')}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ijazahBase64')} disabled={isCompressing} />
                    </label>
                  </div>

                  {/* Kartu Keluarga */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                    <h5 className="font-medium text-sm text-slate-800 mb-3">{t('siswa.form.kk')}</h5>
                    {formData.kkBase64 ? (
                      <div className="relative w-32 h-24 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                        <img src={formData.kkBase64} alt="KK thumbnail" className="object-contain w-full h-full" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => setViewImage(formData.kkBase64)} className="text-white p-2 hover:text-blue-300">
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-24 mb-3 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm w-full text-center">
                      <span>{formData.kkBase64 ? t('siswa.form.change_kk') : t('siswa.form.upload_kk')}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'kkBase64')} disabled={isCompressing} />
                    </label>
                  </div>
                </div>
              )}

            </form>
          </div>
            
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-xl flex justify-between items-center">
            <div className="text-xs text-slate-500">
              {isCompressing ? <span className="flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1" /> {t('siswa.form.compressing')}</span> : ''}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                form="student-form"
                disabled={saveMutation.isPending || isCompressing}
                className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Image Modal */}
      {viewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-80">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button 
              type="button" 
              onClick={() => setViewImage(null)} 
              className="absolute top-4 right-4 text-white hover:text-slate-300 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={viewImage} alt="View" className="max-w-full max-h-full object-contain bg-white rounded-sm shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

