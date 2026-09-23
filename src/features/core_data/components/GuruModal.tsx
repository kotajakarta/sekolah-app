import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { X, Loader2, ImageIcon, Eye, CheckCircle2, Trash2, Upload } from 'lucide-react';
import { compressImage } from '../../../lib/imageCompressor';
import { useAuth } from '../../../hooks/useAuth';
import { useGetWilayah, useGetCabang } from '../hooks/useMasterData';
import { useTranslation } from 'react-i18next';
import { Guru } from '../hooks/usePoolGuru';
import Select from 'react-select';
import { useToast } from '../../../contexts/ToastContext';

interface GuruModalProps {
  guru?: Guru | null;
  onClose: () => void;
}

export default function GuruModal({ guru, onClose }: GuruModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: wilayahList } = useGetWilayah();
  const { data: cabangList } = useGetCabang();
  const { t } = useTranslation();

  const { data: kelasList } = useQuery({
    queryKey: ['kelas', user?.cabangId],
    queryFn: async () => {
      const response = await apiClient.get('/formal/kelas');
      if (user?.scope === 'CABANG') {
        return response.data.filter((k: any) => k.cabangId === user.cabangId && k.isActive);
      }
      return response.data.filter((k: any) => k.isActive);
    },
  });

  const [isCompressing, setIsCompressing] = useState(false);
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const predefinedPositions = [
    'Ketua Cabang',
    'Bendahara',
    'Sekretaris',
    'Pengajar',
    'Ketua Resmi Isler'
  ];

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    waliKelas: '',
    pendidikanTerakhir: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    wilayahId: user?.scope === 'WILAYAH' || user?.scope === 'CABANG' ? user.wilayahId || '' : '',
    cabangId: user?.scope === 'CABANG' ? user.cabangId || '' : '',
    ifadahUrl: '',
    ktpUrl: '',
    ijazahUrl: '',
    jenisKelamin: '',
    perguruanTinggi: '',
    programStudi: '',
    tahunLulus: '',
    phone: '',
    mapelUmum: [] as string[],
  });

  const mapelOptions = [
    { value: 'Matematika', label: 'Matematika' },
    { value: 'Bahasa Indonesia', label: 'Bahasa Indonesia' },
    { value: 'Bahasa Inggris', label: 'Bahasa Inggris' },
    { value: 'IPA', label: 'IPA' },
    { value: 'PKn', label: 'PKn' },
  ];

  useEffect(() => {
    if (guru) {
      const isCustom = guru.position ? !predefinedPositions.includes(guru.position) : false;
      setIsCustomPosition(isCustom);
      setFormData({
        name: guru.name || '',
        position: guru.position || '',
        waliKelas: (guru as any).waliKelas || '',
        pendidikanTerakhir: (guru as any).pendidikanTerakhir || '',
        nik: (guru as any).nik || '',
        tempatLahir: (guru as any).tempatLahir || '',
        tanggalLahir: (guru as any).tanggalLahir ? new Date((guru as any).tanggalLahir).toISOString().split('T')[0] : '',
        wilayahId: guru.wilayahId || '',
        cabangId: guru.cabangId || '',
        ifadahUrl: (guru as any).ifadahUrl || '',
        ktpUrl: (guru as any).ktpUrl || '',
        ijazahUrl: (guru as any).ijazahUrl || '',
        jenisKelamin: (guru as any).jenisKelamin || '',
        perguruanTinggi: (guru as any).perguruanTinggi || '',
        programStudi: (guru as any).programStudi || '',
        tahunLulus: (guru as any).tahunLulus || '',
        phone: (guru as any).phone || '',
        mapelUmum: guru.mapelUmum || [],
      });
    }
  }, [guru]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'ifadahUrl' | 'ktpUrl' | 'ijazahUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('info', t('siswa.form.alert_not_image'));
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('info', t('guru.form.alert_file_size'));
      e.target.value = '';
      return;
    }
    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImage(file, 150);
      setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
      showToast('success', 'Berkas berhasil dimuat ke formulir.');
    } catch (error) {
      console.error('Error compressing image:', error);
      showToast('info', t('siswa.form.alert_compress_fail'));
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (guru) {
        return apiClient.put(`/master-data/guru/${guru.id}`, data);
      } else {
        return apiClient.post('/master-data/guru', data);
      }
    },
    onSuccess: () => {
      showToast('success', guru ? 'Data guru berhasil diperbarui!' : 'Data guru berhasil ditambahkan!');
      queryClient.invalidateQueries({ queryKey: ['master-data', 'guru'] });
      queryClient.invalidateQueries({ queryKey: ['guru', 'pool'] });
      onClose();
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Gagal menyimpan data guru.';
      showToast('error', errMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">

      {viewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-4" onClick={() => setViewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <img src={viewImage} alt="Full size" className="max-w-full max-h-[90vh] object-contain" />
            <button onClick={() => setViewImage(null)} className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative transform rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-white px-6 py-4 border-b border-slate-200 rounded-t-xl flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">
              {guru ? (t('guru.edit_title') || 'Edit Data Guru') : (t('guru.add_title') || 'Tambah Guru Baru')}
            </h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto p-6 flex-1">
            <form id="guru-form" onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.nama')}</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.nik')}</label>
                  <input type="text" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.jenis_kelamin')}</label>
                  <select value={formData.jenisKelamin} onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">{t('guru.form.jenis_kelamin_ph')}</option>
                    <option value="L">{t('guru.form.laki_laki')}</option>
                    <option value="P">{t('guru.form.perempuan')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.phone')}</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.jabatan')}</label>
                  <select
                    value={isCustomPosition ? 'Lainnya' : (formData.position || '')}
                    onChange={(e) => {
                      if (e.target.value === 'Lainnya') {
                        setIsCustomPosition(true);
                        setFormData({ ...formData, position: '' });
                      } else {
                        setIsCustomPosition(false);
                        setFormData({ ...formData, position: e.target.value });
                      }
                    }}
                    className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">{t('guru.form.position_ph')}</option>
                    <option value="Ketua Cabang">{user?.scope === 'CABANG' ? 'Pimpinan Pesantren / Lembaga' : t('guru.form.pos_ketua_cabang')}</option>
                    <option value="Bendahara">{t('guru.form.pos_bendahara')}</option>
                    <option value="Sekretaris">{t('guru.form.pos_sekretaris')}</option>
                    <option value="Pengajar">{t('guru.form.pos_pengajar')}</option>
                    <option value="Ketua Resmi Isler">{t('guru.form.pos_ketua_resmi')}</option>
                    <option value="Lainnya">{t('guru.form.pos_lainnya')}</option>
                  </select>
                  {isCustomPosition && (
                    <input
                      type="text"
                      placeholder={t('guru.form.position_lainnya_ph')}
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="mt-2 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.tempat_lahir')}</label>
                  <input type="text" value={formData.tempatLahir} onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.tanggal_lahir')}</label>
                  <input type="date" value={formData.tanggalLahir} onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.pendidikan')}</label>
                  <select value={formData.pendidikanTerakhir} onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">{t('guru.form.pendidikan_ph')}</option>
                    <option value="SMA/SMK">{t('guru.form.pendidikan_sma')}</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="D4">{t('guru.form.pendidikan_d4')}</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.perguruan_tinggi')}</label>
                  <input type="text" value={formData.perguruanTinggi} onChange={(e) => setFormData({ ...formData, perguruanTinggi: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder={t('guru.form.perguruan_tinggi_ph')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.program_studi')}</label>
                  <input type="text" value={formData.programStudi} onChange={(e) => setFormData({ ...formData, programStudi: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder={t('guru.form.program_studi_ph')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.tahun_lulus')}</label>
                  <input type="text" value={formData.tahunLulus} onChange={(e) => setFormData({ ...formData, tahunLulus: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder={t('guru.form.tahun_lulus_ph')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('guru.form.wali_kelas')}</label>
                  <select value={formData.waliKelas} onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">{t('guru.form.wali_kelas_ph')}</option>
                    {kelasList?.map((k: any) => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {!guru && user?.scope !== 'CABANG' && (
                <>
                  <h4 className="text-sm font-semibold text-slate-800 mt-6 border-b border-slate-100 pb-2 mb-4">{t('siswa.form.section_akademik')}</h4>
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
                          {cabangList?.filter((c) => formData.wilayahId ? c.wilayahId === formData.wilayahId : true).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

            
              <h4 className="text-sm font-semibold text-slate-800 mt-6 border-b border-slate-100 pb-2 mb-4">{t('guru.form.berkas')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ifadah */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-xs text-slate-800">{t('guru.form.ifadah')}</h5>
                      {formData.ifadahUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terunggah
                        </span>
                      )}
                    </div>
                    {formData.ifadahUrl ? (
                      <div
                        onClick={() => setViewImage(formData.ifadahUrl)}
                        className="relative w-full h-28 mb-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden group cursor-pointer"
                        title="Klik untuk melihat berkas"
                      >
                        <img src={formData.ifadahUrl} alt="Ifadah" className="object-contain w-full h-full" />
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 text-white text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                            <Eye className="w-4 h-4" /> Lihat
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 mb-3 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-1">
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                        <span className="text-[11px] text-slate-400">Belum diunggah</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-1">
                    {formData.ifadahUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewImage(formData.ifadahUrl)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lihat Berkas</span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <label className="cursor-pointer bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs text-center inline-flex items-center justify-center gap-1">
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>Ganti</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ifadahUrl')} disabled={isCompressing} />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, ifadahUrl: '' }))}
                            className="bg-white border border-rose-200 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 shadow-2xs text-center inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs w-full text-center inline-flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Unggah Berkas</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ifadahUrl')} disabled={isCompressing} />
                      </label>
                    )}
                  </div>
                </div>

                {/* KTP */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-xs text-slate-800">{t('guru.form.ktp')}</h5>
                      {formData.ktpUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terunggah
                        </span>
                      )}
                    </div>
                    {formData.ktpUrl ? (
                      <div
                        onClick={() => setViewImage(formData.ktpUrl)}
                        className="relative w-full h-28 mb-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden group cursor-pointer"
                        title="Klik untuk melihat berkas"
                      >
                        <img src={formData.ktpUrl} alt="KTP" className="object-contain w-full h-full" />
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 text-white text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                            <Eye className="w-4 h-4" /> Lihat
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 mb-3 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-1">
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                        <span className="text-[11px] text-slate-400">Belum diunggah</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-1">
                    {formData.ktpUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewImage(formData.ktpUrl)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lihat Berkas</span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <label className="cursor-pointer bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs text-center inline-flex items-center justify-center gap-1">
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>Ganti</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ktpUrl')} disabled={isCompressing} />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, ktpUrl: '' }))}
                            className="bg-white border border-rose-200 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 shadow-2xs text-center inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs w-full text-center inline-flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Unggah Berkas</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ktpUrl')} disabled={isCompressing} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Ijazah */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-xs text-slate-800">{t('guru.form.ijazah')}</h5>
                      {formData.ijazahUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terunggah
                        </span>
                      )}
                    </div>
                    {formData.ijazahUrl ? (
                      <div
                        onClick={() => setViewImage(formData.ijazahUrl)}
                        className="relative w-full h-28 mb-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden group cursor-pointer"
                        title="Klik untuk melihat berkas"
                      >
                        <img src={formData.ijazahUrl} alt="Ijazah" className="object-contain w-full h-full" />
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 text-white text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                            <Eye className="w-4 h-4" /> Lihat
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-28 mb-3 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-1">
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                        <span className="text-[11px] text-slate-400">Belum diunggah</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-1">
                    {formData.ijazahUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewImage(formData.ijazahUrl)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lihat Berkas</span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <label className="cursor-pointer bg-white border border-slate-300 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs text-center inline-flex items-center justify-center gap-1">
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>Ganti</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ijazahUrl')} disabled={isCompressing} />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, ijazahUrl: '' }))}
                            className="bg-white border border-rose-200 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 shadow-2xs text-center inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs w-full text-center inline-flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Unggah Berkas</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ijazahUrl')} disabled={isCompressing} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

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
                form="guru-form"
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
    </div>
  );
}
