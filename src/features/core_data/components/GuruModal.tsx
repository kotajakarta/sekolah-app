import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { X, Loader2, ImageIcon, Eye } from 'lucide-react';
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
        phone: (guru as any).phone || '',
        mapelUmum: guru.mapelUmum || [],
      });
    }
  }, [guru]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'ifadahUrl' | 'ktpUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('info', t('siswa.form.alert_not_image'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal adalah 2MB! Silakan pilih file yang lebih kecil.');
      e.target.value = '';
      return;
    }
    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImage(file, 150);
      setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
    } catch (error) {
      console.error('Error compressing image:', error);
      showToast('info', t('siswa.form.alert_compress_fail'));
    } finally {
      setIsCompressing(false);
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
      queryClient.invalidateQueries({ queryKey: ['master-data', 'guru'] });
      queryClient.invalidateQueries({ queryKey: ['guru', 'pool'] });
      onClose();
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
                    <option value="Ketua Cabang">{t('guru.form.pos_ketua_cabang')}</option>
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
                  <input type="text" value={formData.pendidikanTerakhir} onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('guru.form.mapel_umum')}</label>
                  <Select
                    isMulti
                    options={mapelOptions}
                    value={mapelOptions.filter(opt => formData.mapelUmum.includes(opt.value))}
                    onChange={(selected) => {
                      setFormData({
                        ...formData,
                        mapelUmum: selected.map(item => item.value)
                      });
                    }}
                    placeholder={t('guru.form.mapel_umum_ph')}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('guru.form.mapel_umum_desc')}
                  </p>
                </div>

              </div>

              {!guru && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ifadah */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                  <h5 className="font-medium text-sm text-slate-800 mb-3">{t('guru.form.ifadah')}</h5>
                  {formData.ifadahUrl ? (
                    <div className="relative w-32 h-24 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                      <img src={formData.ifadahUrl} alt="Ifadah" className="object-contain w-full h-full" />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setViewImage(formData.ifadahUrl)} className="text-white p-2 hover:text-blue-300">
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
                    <span>{formData.ifadahUrl ? t('guru.form.change') : t('guru.form.upload')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ifadahUrl')} disabled={isCompressing} />
                  </label>
                </div>

                {/* KTP */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col items-center">
                  <h5 className="font-medium text-sm text-slate-800 mb-3">{t('guru.form.ktp')}</h5>
                  {formData.ktpUrl ? (
                    <div className="relative w-32 h-24 mb-3 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden group">
                      <img src={formData.ktpUrl} alt="KTP" className="object-contain w-full h-full" />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setViewImage(formData.ktpUrl)} className="text-white p-2 hover:text-blue-300">
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
                    <span>{formData.ktpUrl ? t('guru.form.change') : t('guru.form.upload')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'ktpUrl')} disabled={isCompressing} />
                  </label>
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
