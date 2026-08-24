import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Save, Building, Users, MapPin, Phone, Shield } from 'lucide-react';
import apiClient from '../../../lib/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wilayahService, findMatchingWilayah, normalizeWilayahCode, WilayahItem } from '../../../services/wilayah.service';

interface ProfileCabangModalProps {
  cabangId: string;
  onClose: () => void;
}

export const ProfileCabangModal: React.FC<ProfileCabangModalProps> = ({ cabangId, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for manual fields
  const [nameGlodemy, setNameGlodemy] = useState('');
  const [nameResmi, setNameResmi] = useState('');
  const [kapasitasSantri, setKapasitasSantri] = useState<number | ''>('');
  const [totalSantriManual, setTotalSantriManual] = useState<number | ''>('');

  // Form states for leader fields
  const [ketuaCabangId, setKetuaCabangId] = useState('');
  const [ketuaMuadalahId, setKetuaMuadalahId] = useState('');
  const [ketuaIslerId, setKetuaIslerId] = useState('');

  // Form states for address
  const [alamatProvId, setAlamatProvId] = useState('');
  const [alamatProvName, setAlamatProvName] = useState('');
  const [alamatKabId, setAlamatKabId] = useState('');
  const [alamatKabName, setAlamatKabName] = useState('');
  const [alamatKecId, setAlamatKecId] = useState('');
  const [alamatKecName, setAlamatKecName] = useState('');
  const [alamatKelId, setAlamatKelId] = useState('');
  const [alamatKelName, setAlamatKelName] = useState('');
  const [alamatJalan, setAlamatJalan] = useState('');

  // Form states for status
  const [statusTanah, setStatusTanah] = useState('');
  const [statusBangunan, setStatusBangunan] = useState('');

  // Dropdown lists from Wilindo API
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  // Fetch provinces
  useEffect(() => {
    wilayahService.getProvinces()
      .then(setProvinces)
      .catch((e) => console.error('Gagal mengambil data provinsi', e));
  }, []);

  // Fetch regencies when province changes
  useEffect(() => {
    if (alamatProvId) {
      wilayahService.getRegencies(alamatProvId)
        .then(setRegencies)
        .catch((e) => console.error('Gagal mengambil data kabupaten', e));
    } else {
      setRegencies([]);
    }
  }, [alamatProvId]);

  // Fetch districts when regency changes
  useEffect(() => {
    if (alamatKabId) {
      wilayahService.getDistricts(alamatKabId)
        .then(setDistricts)
        .catch((e) => console.error('Gagal mengambil data kecamatan', e));
    } else {
      setDistricts([]);
    }
  }, [alamatKabId]);

  // Fetch villages when district changes
  useEffect(() => {
    if (alamatKecId) {
      wilayahService.getVillages(alamatKecId)
        .then(setVillages)
        .catch((e) => console.error('Gagal mengambil data kelurahan', e));
    } else {
      setVillages([]);
    }
  }, [alamatKecId]);

  // Load Cabang Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get(`/master-data/cabang/${cabangId}/profile`);
        const data = res.data;
        setProfile(data);
        setNameGlodemy(data.nameGlodemy || data.name || '');
        setNameResmi(data.nameResmi || '');
        setKapasitasSantri(data.kapasitasSantri ?? '');
        setTotalSantriManual(data.totalSantriManual ?? '');

        setKetuaCabangId(data.ketuaCabangId || '');
        setKetuaMuadalahId(data.ketuaMuadalahId || '');
        setKetuaIslerId(data.ketuaIslerId || '');

        setAlamatProvId('');
        setAlamatProvName(data.alamatProvName || '');
        setAlamatKabId('');
        setAlamatKabName(data.alamatKabName || '');
        setAlamatKecId('');
        setAlamatKecName(data.alamatKecName || '');
        setAlamatKelId('');
        setAlamatKelName(data.alamatKelName || '');
        setAlamatJalan(data.alamatJalan || '');

        setStatusTanah(data.statusTanah || '');
        setStatusBangunan(data.statusBangunan || '');

        // Resolusi otomatis seluruh hierarki wilayah secara simultan
        wilayahService.resolveHierarchy({
          provId: data.alamatProvId,
          provName: data.alamatProvName,
          kabId: data.alamatKabId,
          kabName: data.alamatKabName,
          kecId: data.alamatKecId,
          kecName: data.alamatKecName,
          kelId: data.alamatKelId,
          kelName: data.alamatKelName,
          jalan: data.alamatJalan,
        }).then((res) => {
          if (res.provinces.length) setProvinces(res.provinces);
          if (res.regencies.length) setRegencies(res.regencies);
          if (res.districts.length) setDistricts(res.districts);
          if (res.villages.length) setVillages(res.villages);

          if (res.selectedProv) {
            setAlamatProvId(res.selectedProv.kode);
            setAlamatProvName(res.selectedProv.nama);
          }
          if (res.selectedKab) {
            setAlamatKabId(res.selectedKab.kode);
            setAlamatKabName(res.selectedKab.nama);
          }
          if (res.selectedKec) {
            setAlamatKecId(res.selectedKec.kode);
            setAlamatKecName(res.selectedKec.nama);
          }
          if (res.selectedKel) {
            setAlamatKelId(res.selectedKel.kode);
            setAlamatKelName(res.selectedKel.nama);
          }
        }).catch(console.error);
      } catch (err: any) {
        setError('Gagal memuat profil cabang');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [cabangId]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.put(`/master-data/cabang/${cabangId}/profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabang'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      nameGlodemy,
      nameResmi,
      kapasitasSantri: kapasitasSantri === '' ? 0 : Number(kapasitasSantri),
      totalSantriManual: totalSantriManual === '' ? 0 : Number(totalSantriManual),
      ketuaCabangId: ketuaCabangId || null,
      ketuaMuadalahId: ketuaMuadalahId || null,
      ketuaIslerId: ketuaIslerId || null,
      alamatProvId: alamatProvId || null,
      alamatProvName: alamatProvName || null,
      alamatKabId: alamatKabId || null,
      alamatKabName: alamatKabName || null,
      alamatKecId: alamatKecId || null,
      alamatKecName: alamatKecName || null,
      alamatKelId: alamatKelId || null,
      alamatKelName: alamatKelName || null,
      alamatJalan: alamatJalan || null,
      statusTanah: statusTanah || null,
      statusBangunan: statusBangunan || null
    });
  };

  // Helpers to get teacher phone by ID
  const getTeacherPhone = (id: string) => {
    const teacher = profile?.staffList?.find((t: any) => t.id === id);
    return teacher?.phone ? teacher.phone : 'Belum memiliki no. telp';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-xl p-8 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-slate-500">Memuat profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-xl p-6 shadow-xl max-w-md w-full text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">Tutup</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

        <div className="relative transform rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-white px-6 py-4 border-b border-slate-200 rounded-t-xl flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-semibold text-slate-955 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Profil Cabang: {profile.name}
            </h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 flex-1">
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Identity & Capacity */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Informasi Identitas & Kapasitas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Nama Cabang (Glodemy)</label>
                    <input
                      type="text"
                      value={nameGlodemy}
                      readOnly
                      className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-100 py-2 px-3 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
                      placeholder="Nama Glodemy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Nama Cabang (Resmi)</label>
                    <input
                      type="text"
                      value={nameResmi}
                      onChange={(e) => setNameResmi(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Masukkan nama resmi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kapasitas Santri</label>
                    <input
                      type="number"
                      value={kapasitasSantri}
                      onChange={(e) => setKapasitasSantri(e.target.value ? Number(e.target.value) : '')}
                      className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Total Santri Seharusnya</label>
                    <input
                      type="number"
                      value={totalSantriManual}
                      onChange={(e) => setTotalSantriManual(e.target.value ? Number(e.target.value) : '')}
                      className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Leaders Section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Struktur Pimpinan
                </h4>
                <div className="space-y-4">
                  {/* Ketua Cabang */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Cabang</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                      <select
                        value={ketuaCabangId}
                        onChange={(e) => setKetuaCabangId(e.target.value)}
                        className="block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- Pilih Ketua Cabang --</option>
                        {profile.staffList?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-lg text-slate-600 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{ketuaCabangId ? getTeacherPhone(ketuaCabangId) : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ketua Muadalah */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Muadalah (Endonezya)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                      <select
                        value={ketuaMuadalahId}
                        onChange={(e) => setKetuaMuadalahId(e.target.value)}
                        className="block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- Pilih Ketua Muadalah --</option>
                        {profile.staffList?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-lg text-slate-600 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{ketuaMuadalahId ? getTeacherPhone(ketuaMuadalahId) : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ketua Resmi Isler */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Resmi Isler</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                      <select
                        value={ketuaIslerId}
                        onChange={(e) => setKetuaIslerId(e.target.value)}
                        className="block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- Pilih Ketua Resmi Isler --</option>
                        {profile.staffList?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-lg text-slate-600 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{ketuaIslerId ? getTeacherPhone(ketuaIslerId) : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Address Form */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Alamat Kantor Cabang
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Provinsi */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Provinsi</label>
                    <select
                      value={alamatProvId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = provinces.find((p) => p.id === id)?.name || '';
                        setAlamatProvId(id);
                        setAlamatProvName(name);
                        setAlamatKabId('');
                        setAlamatKabName('');
                        setAlamatKecId('');
                        setAlamatKecName('');
                        setAlamatKelId('');
                        setAlamatKelName('');
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-355 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map((p) => <option key={p.kode || p.id} value={p.kode || p.id}>{p.nama || p.name}</option>)}
                    </select>
                  </div>

                  {/* Kabupaten */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kabupaten / Kota</label>
                    <select
                      value={alamatKabId}
                      disabled={!alamatProvId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const selected = regencies.find((r) => r.kode === id || r.id === id);
                        const name = selected?.nama || selected?.name || '';
                        setAlamatKabId(id);
                        setAlamatKabName(name);
                        setAlamatKecId('');
                        setAlamatKecName('');
                        setAlamatKelId('');
                        setAlamatKelName('');
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-355 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">-- Pilih Kota/Kabupaten --</option>
                      {regencies.map((r) => <option key={r.kode || r.id} value={r.kode || r.id}>{r.nama || r.name}</option>)}
                    </select>
                  </div>

                  {/* Kecamatan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kecamatan</label>
                    <select
                      value={alamatKecId}
                      disabled={!alamatKabId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const selected = districts.find((d) => d.kode === id || d.id === id);
                        const name = selected?.nama || selected?.name || '';
                        setAlamatKecId(id);
                        setAlamatKecName(name);
                        setAlamatKelId('');
                        setAlamatKelName('');
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-355 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map((d) => <option key={d.kode || d.id} value={d.kode || d.id}>{d.nama || d.name}</option>)}
                    </select>
                  </div>

                  {/* Kelurahan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kelurahan / Desa</label>
                    <select
                      value={alamatKelId}
                      disabled={!alamatKecId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const selected = villages.find((v) => v.kode === id || v.id === id);
                        const name = selected?.nama || selected?.name || '';
                        setAlamatKelId(id);
                        setAlamatKelName(name);
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-355 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">-- Pilih Kelurahan/Desa --</option>
                      {villages.map((v) => <option key={v.kode || v.id} value={v.kode || v.id}>{v.nama || v.name}</option>)}
                    </select>
                  </div>

                  {/* Alamat Detail */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Alamat Jalan / Kampung</label>
                    <textarea
                      value={alamatJalan}
                      onChange={(e) => setAlamatJalan(e.target.value)}
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-slate-355 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nama Jalan, No Rumah, RT/RW, Kampung, Dusun..."
                    />
                  </div>
                </div>
              </div>

              {/* Property Status */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Status Operasional Cabang</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Tanah */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Status Tanah</label>
                    <select
                      value={statusTanah}
                      onChange={(e) => setStatusTanah(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-slate-355 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- Pilih Status Tanah --</option>
                      <option value="WAKAF">Wakaf</option>
                      <option value="KERJASAMA">Kerjasama</option>
                    </select>
                  </div>

                  {/* Status Bangunan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Status Bangunan</label>
                    <select
                      value={statusBangunan}
                      onChange={(e) => setStatusBangunan(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-slate-355 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- Pilih Status Bangunan --</option>
                      <option value="WAKAF">Wakaf</option>
                      <option value="KERJASAMA">Kerjasama</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Automated Statistics */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Statistik Aktual (Otomatis)
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">Total Santri</p>
                    <p className="text-xl font-bold text-emerald-900">{profile.totalSantriOtomatis}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-1">Kelas 7 - 12</p>
                    <p className="text-xl font-bold text-blue-900">{profile.kelas7sd12}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                    <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider mb-1">Non Muadalah</p>
                    <p className="text-xl font-bold text-purple-900">{profile.nonMuadalahOtomatis}</p>
                  </div>
                </div>

                {/* Grup Daimi Distribution */}
                <div className="pt-2">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Distribusi Grup Daimi</h5>
                  <div className="space-y-2.5">
                    {profile.grupDaimiOtomatis && profile.grupDaimiOtomatis.length > 0 ? (
                      profile.grupDaimiOtomatis.map((g: any, i: number) => {
                        const maxVal = Math.max(...profile.grupDaimiOtomatis.map((d: any) => d.value), 1);
                        const percent = (g.value / maxVal) * 100;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-20 text-[11px] font-bold text-slate-700 truncate">{g.name}</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                            <div className="w-8 text-right text-[11px] font-bold text-slate-900">{g.value}</div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500 italic">Belum ada data grup daimi.</p>
                    )}
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-xl flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-350 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center disabled:opacity-50 transition-colors shadow-sm"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
