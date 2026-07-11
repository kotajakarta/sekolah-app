import React, { useState, useEffect } from 'react';
import { X, Loader2, Building, MapPin, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';
import { useGetWilayah, Cabang } from '../hooks/useMasterData';

interface CabangModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabangToEdit?: Cabang | null;
}

export default function CabangModal({ isOpen, onClose, cabangToEdit }: CabangModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: wilayahList } = useGetWilayah();

  const [formData, setFormData] = useState({
    name: '',
    wilayahId: '',
    nameGlodemy: '',
    nameResmi: '',
    kapasitasSantri: '',
    totalSantriManual: '',
    ketuaCabangId: '',
    ketuaMuadalahId: '',
    ketuaIslerId: '',
    alamatProvId: '',
    alamatProvName: '',
    alamatKabId: '',
    alamatKabName: '',
    alamatKecId: '',
    alamatKecName: '',
    alamatKelId: '',
    alamatKelName: '',
    alamatJalan: '',
    alamatNegara: '',
    statusTanah: '',
    statusBangunan: '',
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  
  const [profile, setProfile] = useState<any>(null); // To store staffList for edit mode

  // Load API Wilayah
  useEffect(() => {
    if (isOpen) {
      fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
        .then((r) => r.json())
        .then((data) => setProvinces(data))
        .catch((e) => console.error('Error fetching provinces', e));
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.alamatProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.alamatProvId}.json`)
        .then((r) => r.json())
        .then((data) => setRegencies(data))
        .catch(console.error);
    } else {
      setRegencies([]);
    }
  }, [formData.alamatProvId]);

  useEffect(() => {
    if (formData.alamatKabId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${formData.alamatKabId}.json`)
        .then((r) => r.json())
        .then((data) => setDistricts(data))
        .catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [formData.alamatKabId]);

  useEffect(() => {
    if (formData.alamatKecId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${formData.alamatKecId}.json`)
        .then((r) => r.json())
        .then((data) => setVillages(data))
        .catch(console.error);
    } else {
      setVillages([]);
    }
  }, [formData.alamatKecId]);

  useEffect(() => {
    if (isOpen) {
      if (cabangToEdit) {
        // Load profile data
        apiClient.get(`/master-data/cabang/${cabangToEdit.id}/profile`).then(res => {
          const data = res.data;
          setProfile(data);
          setFormData({
            name: data.name || '',
            wilayahId: data.wilayahId || '',
            nameGlodemy: data.nameGlodemy || '',
            nameResmi: data.nameResmi || '',
            kapasitasSantri: data.kapasitasSantri?.toString() || '',
            totalSantriManual: data.totalSantriManual?.toString() || '',
            ketuaCabangId: data.ketuaCabangId || '',
            ketuaMuadalahId: data.ketuaMuadalahId || '',
            ketuaIslerId: data.ketuaIslerId || '',
            alamatProvId: data.alamatProvId || '',
            alamatProvName: data.alamatProvName || '',
            alamatKabId: data.alamatKabId || '',
            alamatKabName: data.alamatKabName || '',
            alamatKecId: data.alamatKecId || '',
            alamatKecName: data.alamatKecName || '',
            alamatKelId: data.alamatKelId || '',
            alamatKelName: data.alamatKelName || '',
            alamatJalan: data.alamatJalan || '',
            alamatNegara: data.alamatNegara || '',
            statusTanah: data.statusTanah || '',
            statusBangunan: data.statusBangunan || '',
          });

          // Preload sub-regions
          if (data.alamatProvId) {
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${data.alamatProvId}.json`).then((r) => r.json()).then(setRegencies).catch(console.error);
          }
          if (data.alamatKabId) {
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${data.alamatKabId}.json`).then((r) => r.json()).then(setDistricts).catch(console.error);
          }
          if (data.alamatKecId) {
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${data.alamatKecId}.json`).then((r) => r.json()).then(setVillages).catch(console.error);
          }
        });
      } else {
        setFormData({
          name: '', wilayahId: '', nameGlodemy: '', nameResmi: '',
          kapasitasSantri: '', totalSantriManual: '',
          ketuaCabangId: '', ketuaMuadalahId: '', ketuaIslerId: '',
          alamatProvId: '', alamatProvName: '', alamatKabId: '', alamatKabName: '',
          alamatKecId: '', alamatKecName: '', alamatKelId: '', alamatKelName: '', alamatJalan: '',
          alamatNegara: '', statusTanah: '', statusBangunan: '',
        });
        setProfile(null);
      }
    }
  }, [isOpen, cabangToEdit]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        kapasitasSantri: data.kapasitasSantri ? Number(data.kapasitasSantri) : 0,
        totalSantriManual: data.totalSantriManual ? Number(data.totalSantriManual) : 0,
      };
      if (cabangToEdit) {
        return apiClient.put(`/master-data/cabang/${cabangToEdit.id}`, payload);
      }
      return apiClient.post('/master-data/cabang', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data', 'cabang'] });
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative transform rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl flex flex-col max-h-[90vh]">
          <div className="bg-white px-6 py-4 border-b border-slate-200 rounded-t-xl flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              {cabangToEdit ? t('common.edit') + ' Cabang' : t('common.add') + ' Cabang'}
            </h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
            <form id="cabang-form" onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-500" /> Identitas Dasar
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Nama Cabang (Glodemy) *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Wilayah *</label>
                    <select required value={formData.wilayahId} onChange={(e) => setFormData({ ...formData, wilayahId: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">-- Pilih Wilayah --</option>
                      {wilayahList?.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Nama Cabang (Resmi)</label>
                    <input type="text" value={formData.nameResmi} onChange={(e) => setFormData({ ...formData, nameResmi: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kapasitas Santri</label>
                    <input type="number" value={formData.kapasitasSantri} onChange={(e) => setFormData({ ...formData, kapasitasSantri: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Total Santri (Manual)</label>
                    <input type="number" value={formData.totalSantriManual} onChange={(e) => setFormData({ ...formData, totalSantriManual: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {cabangToEdit && profile && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" /> Struktur Kepemimpinan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Cabang</label>
                      <select value={formData.ketuaCabangId} onChange={(e) => setFormData({ ...formData, ketuaCabangId: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                        <option value="">-- Pilih Ketua Cabang --</option>
                        {profile.staffList?.map((t: any) => (<option key={t.id} value={t.id}>{t.name} ({t.position})</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Muadalah (Endonezya)</label>
                      <select value={formData.ketuaMuadalahId} onChange={(e) => setFormData({ ...formData, ketuaMuadalahId: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                        <option value="">-- Pilih Ketua Muadalah --</option>
                        {profile.staffList?.map((t: any) => (<option key={t.id} value={t.id}>{t.name} ({t.position})</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Resmi Isler</label>
                      <select value={formData.ketuaIslerId} onChange={(e) => setFormData({ ...formData, ketuaIslerId: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                        <option value="">-- Pilih Ketua Isler --</option>
                        {profile.staffList?.map((t: any) => (<option key={t.id} value={t.id}>{t.name} ({t.position})</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" /> Informasi Alamat
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Negara</label>
                    <input type="text" value={formData.alamatNegara} onChange={(e) => setFormData({ ...formData, alamatNegara: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm" placeholder="Contoh: Indonesia, Turki" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Provinsi</label>
                    <select value={formData.alamatProvId} onChange={(e) => setFormData({ ...formData, alamatProvId: e.target.value, alamatProvName: e.target.options[e.target.selectedIndex].text, alamatKabId: '', alamatKecId: '', alamatKelId: '' })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kabupaten / Kota</label>
                    <select value={formData.alamatKabId} disabled={!formData.alamatProvId} onChange={(e) => setFormData({ ...formData, alamatKabId: e.target.value, alamatKabName: e.target.options[e.target.selectedIndex].text, alamatKecId: '', alamatKelId: '' })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                      <option value="">-- Pilih Kabupaten --</option>
                      {regencies.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kecamatan</label>
                    <select value={formData.alamatKecId} disabled={!formData.alamatKabId} onChange={(e) => setFormData({ ...formData, alamatKecId: e.target.value, alamatKecName: e.target.options[e.target.selectedIndex].text, alamatKelId: '' })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kelurahan / Desa</label>
                    <select value={formData.alamatKelId} disabled={!formData.alamatKecId} onChange={(e) => setFormData({ ...formData, alamatKelId: e.target.value, alamatKelName: e.target.options[e.target.selectedIndex].text })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                      <option value="">-- Pilih Kelurahan --</option>
                      {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Alamat Jalan / Kampung</label>
                    <textarea value={formData.alamatJalan} onChange={(e) => setFormData({ ...formData, alamatJalan: e.target.value })} rows={2} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm" placeholder="Contoh: Jl. Sudirman No. 123" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Status Tanah</label>
                    <select value={formData.statusTanah} onChange={(e) => setFormData({ ...formData, statusTanah: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                      <option value="">-- Pilih Status Tanah --</option>
                      <option value="WAKAF">Wakaf</option>
                      <option value="KERJASAMA">Kerjasama</option>
                      <option value="SEWA">Sewa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Status Bangunan</label>
                    <select value={formData.statusBangunan} onChange={(e) => setFormData({ ...formData, statusBangunan: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white">
                      <option value="">-- Pilih Status Bangunan --</option>
                      <option value="WAKAF">Wakaf</option>
                      <option value="KERJASAMA">Kerjasama</option>
                      <option value="SEWA">Sewa</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-xl flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit" form="cabang-form" disabled={mutation.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 shadow-sm transition-colors">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
