import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, Building, Users, MapPin, Phone, Shield, CheckCircle2, Camera, ImageIcon, FileText } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { compressImage } from '../../lib/imageCompressor';
import DataSiswa from './DataSiswa';

export default function ProfilCabang() {
  const { user } = useAuth();
  const cabangId = user?.cabangId;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'students'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for manual fields
  const [nameGlodemy, setNameGlodemy] = useState('');
  const [nameResmi, setNameResmi] = useState('');
  const [kapasitasSantri, setKapasitasSantri] = useState<number | ''>('');

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

  // Form states for photos
  const [fotoPlang, setFotoPlang] = useState('');
  const [fotoGedung, setFotoGedung] = useState('');
  const [fotoHalaman, setFotoHalaman] = useState('');
  const [fotoDenah, setFotoDenah] = useState('');
  const [fotoMushala, setFotoMushala] = useState('');
  const [fotoKelas, setFotoKelas] = useState('');
  const [fotoRuangTidur, setFotoRuangTidur] = useState('');
  const [fotoRuangMakan, setFotoRuangMakan] = useState('');
  const [fotoKamarMandi, setFotoKamarMandi] = useState('');

  const [isCompressing, setIsCompressing] = useState(false);

  // Dropdown lists from Emsifa API
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  // Fetch provinces
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((r) => r.json())
      .then((data) => setProvinces(data))
      .catch((e) => console.error('Gagal mengambil data provinsi', e));
  }, []);

  // Fetch regencies when province changes
  useEffect(() => {
    if (alamatProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${alamatProvId}.json`)
        .then((r) => r.json())
        .then((data) => setRegencies(data))
        .catch((e) => console.error('Gagal mengambil data kabupaten', e));
    } else {
      setRegencies([]);
    }
  }, [alamatProvId]);

  // Fetch districts when regency changes
  useEffect(() => {
    if (alamatKabId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${alamatKabId}.json`)
        .then((r) => r.json())
        .then((data) => setDistricts(data))
        .catch((e) => console.error('Gagal mengambil data kecamatan', e));
    } else {
      setDistricts([]);
    }
  }, [alamatKabId]);

  // Fetch villages when district changes
  useEffect(() => {
    if (alamatKecId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${alamatKecId}.json`)
        .then((r) => r.json())
        .then((data) => setVillages(data))
        .catch((e) => console.error('Gagal mengambil data kelurahan', e));
    } else {
      setVillages([]);
    }
  }, [alamatKecId]);

  // Load Cabang Profile
  useEffect(() => {
    if (!cabangId) {
      setLoading(false);
      setError('Cabang ID tidak terdeteksi pada sesi Anda.');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await apiClient.get(`/master-data/cabang/${cabangId}/profile`);
        const data = res.data;
        setProfile(data);
        setNameGlodemy(data.nameGlodemy || data.name || '');
        setNameResmi(data.nameResmi || '');
        setKapasitasSantri(data.kapasitasSantri ?? '');

        setKetuaCabangId(data.ketuaCabangId || '');
        setKetuaMuadalahId(data.ketuaMuadalahId || '');
        setKetuaIslerId(data.ketuaIslerId || '');

        setAlamatProvId(data.alamatProvId || '');
        setAlamatProvName(data.alamatProvName || '');
        setAlamatKabId(data.alamatKabId || '');
        setAlamatKabName(data.alamatKabName || '');
        setAlamatKecId(data.alamatKecId || '');
        setAlamatKecName(data.alamatKecName || '');
        setAlamatKelId(data.alamatKelId || '');
        setAlamatKelName(data.alamatKelName || '');
        setAlamatJalan(data.alamatJalan || '');

        setStatusTanah(data.statusTanah || '');
        setStatusBangunan(data.statusBangunan || '');

        // Load photo fields into state
        setFotoPlang(data.fotoPlang || '');
        setFotoGedung(data.fotoGedung || '');
        setFotoHalaman(data.fotoHalaman || '');
        setFotoDenah(data.fotoDenah || '');
        setFotoMushala(data.fotoMushala || '');
        setFotoKelas(data.fotoKelas || '');
        setFotoRuangTidur(data.fotoRuangTidur || '');
        setFotoRuangMakan(data.fotoRuangMakan || '');
        setFotoKamarMandi(data.fotoKamarMandi || '');

        // Preload sub-regions
        if (data.alamatProvId) {
          fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${data.alamatProvId}.json`)
            .then((r) => r.json())
            .then((d) => setRegencies(d))
            .catch((e) => console.error(e));
        }
        if (data.alamatKabId) {
          fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${data.alamatKabId}.json`)
            .then((r) => r.json())
            .then((d) => setDistricts(d))
            .catch((e) => console.error(e));
        }
        if (data.alamatKecId) {
          fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${data.alamatKecId}.json`)
            .then((r) => r.json())
            .then((d) => setVillages(d))
            .catch((e) => console.error(e));
        }
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
      setSuccessMessage('Profil cabang berhasil diperbarui!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: () => {
      setError('Gagal memperbarui profil cabang');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    saveMutation.mutate({
      nameGlodemy,
      nameResmi,
      kapasitasSantri: kapasitasSantri === '' ? 0 : Number(kapasitasSantri),
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
      statusBangunan: statusBangunan || null,
      // Photos
      fotoPlang: fotoPlang || null,
      fotoGedung: fotoGedung || null,
      fotoHalaman: fotoHalaman || null,
      fotoDenah: fotoDenah || null,
      fotoMushala: fotoMushala || null,
      fotoKelas: fotoKelas || null,
      fotoRuangTidur: fotoRuangTidur || null,
      fotoRuangMakan: fotoRuangMakan || null,
      fotoKamarMandi: fotoKamarMandi || null
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 800);
      switch (field) {
        case 'fotoPlang': setFotoPlang(compressed); break;
        case 'fotoGedung': setFotoGedung(compressed); break;
        case 'fotoHalaman': setFotoHalaman(compressed); break;
        case 'fotoDenah': setFotoDenah(compressed); break;
        case 'fotoMushala': setFotoMushala(compressed); break;
        case 'fotoKelas': setFotoKelas(compressed); break;
        case 'fotoRuangTidur': setFotoRuangTidur(compressed); break;
        case 'fotoRuangMakan': setFotoRuangMakan(compressed); break;
        case 'fotoKamarMandi': setFotoKamarMandi(compressed); break;
      }
    } catch {
      setError('Gagal memproses gambar');
    } finally {
      setIsCompressing(false);
    }
  };

  // Helpers to get teacher phone by ID
  const getTeacherPhone = (id: string) => {
    const teacher = profile?.staffList?.find((t: any) => t.id === id);
    return teacher?.phone ? teacher.phone : t('profil_cabang.no_phone');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Memuat profil cabang...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 shadow-sm max-w-md mx-auto text-center mt-8">
        <div className="font-semibold mb-2">Terjadi Kesalahan</div>
        <div>{error || 'Profil tidak dapat dimuat.'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center border-b border-slate-150 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Building className="w-7 h-7 text-blue-600" />
            {t('profil_cabang.title')}: {profile.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t('profil_cabang.subtitle')}</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3 transition-all duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200/80 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="w-4 h-4" />
          {t('profil_cabang.tab_profil')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'photos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Camera className="w-4 h-4" />
          {t('profil_cabang.tab_foto')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('profil_cabang.tab_santri')}
        </button>
      </div>

      {activeTab === 'students' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <DataSiswa />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'profile' && (
            <>
              {/* Identity & Capacity */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  {t('profil_cabang.info_identitas')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.name_glodemy')}</label>
                    <input 
                      type="text" 
                      value={nameGlodemy} 
                      readOnly
                      className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-500 cursor-not-allowed focus:outline-none" 
                      placeholder={t('profil_cabang.name_glodemy')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.name_resmi')}</label>
                    <input 
                      type="text" 
                      value={nameResmi} 
                      onChange={(e) => setNameResmi(e.target.value)} 
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      placeholder={t('profil_cabang.name_resmi_ph')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.kapasitas')}</label>
                    <input 
                      type="number" 
                      value={kapasitasSantri} 
                      onChange={(e) => setKapasitasSantri(e.target.value === '' ? '' : Number(e.target.value))} 
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.total_santri')}</label>
                    <input 
                      type="number" 
                      value={profile.totalSantriOtomatis || 0} 
                      readOnly
                      className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-500 cursor-not-allowed focus:outline-none" 
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Leaders */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  {t('profil_cabang.struktur_pimpinan')}
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.ketua_cabang')}</label>
                      <select 
                        value={ketuaCabangId} 
                        onChange={(e) => setKetuaCabangId(e.target.value)}
                        className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">{t('profil_cabang.pilih_ketua_cabang')}</option>
                        {profile.staffList?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">{t('profil_cabang.telp')} {getTeacherPhone(ketuaCabangId)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.ketua_muadalah')}</label>
                      <select 
                        value={ketuaMuadalahId} 
                        onChange={(e) => setKetuaMuadalahId(e.target.value)}
                        className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">{t('profil_cabang.pilih_ketua_muadalah')}</option>
                        {profile.staffList?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">{t('profil_cabang.telp')} {getTeacherPhone(ketuaMuadalahId)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.ketua_isler')}</label>
                      <select 
                        value={ketuaIslerId} 
                        onChange={(e) => setKetuaIslerId(e.target.value)}
                        className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">{t('profil_cabang.pilih_ketua_isler')}</option>
                        {profile.staffList?.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">{t('profil_cabang.telp')} {getTeacherPhone(ketuaIslerId)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {t('profil_cabang.alamat_kantor')}
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
                        // Reset child fields
                        setAlamatKabId('');
                        setAlamatKabName('');
                        setAlamatKecId('');
                        setAlamatKecName('');
                        setAlamatKelId('');
                        setAlamatKelName('');
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kabupaten / Kota */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kabupaten / Kota</label>
                    <select 
                      value={alamatKabId}
                      disabled={!alamatProvId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = regencies.find((r) => r.id === id)?.name || '';
                        setAlamatKabId(id);
                        setAlamatKabName(name);
                        // Reset child fields
                        setAlamatKecId('');
                        setAlamatKecName('');
                        setAlamatKelId('');
                        setAlamatKelName('');
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">-- Pilih Kabupaten / Kota --</option>
                      {regencies.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
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
                        const name = districts.find((d) => d.id === id)?.name || '';
                        setAlamatKecId(id);
                        setAlamatKecName(name);
                        // Reset child fields
                        setAlamatKelId('');
                        setAlamatKelName('');
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kelurahan / Desa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Kelurahan / Desa</label>
                    <select 
                      value={alamatKelId}
                      disabled={!alamatKecId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const name = villages.find((v) => v.id === id)?.name || '';
                        setAlamatKelId(id);
                        setAlamatKelName(name);
                      }}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">-- Pilih Kelurahan / Desa --</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Alamat Jalan */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Alamat Jalan / Kampung</label>
                    <textarea 
                      value={alamatJalan}
                      onChange={(e) => setAlamatJalan(e.target.value)}
                      rows={2}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none" 
                      placeholder="Masukkan alamat lengkap RT/RW, nama jalan atau kampung..."
                    />
                  </div>
                </div>
              </div>

              {/* Ownership Status */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  {t('profil_cabang.status_aset')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.status_tanah')}</label>
                    <select
                      value={statusTanah}
                      onChange={(e) => setStatusTanah(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white focus:outline-none"
                    >
                      <option value="">{t('profil_cabang.pilih_status_tanah')}</option>
                      <option value="WAKAF">{t('profil_cabang.status_wakaf')}</option>
                      <option value="KERJASAMA">{t('profil_cabang.status_kerjasama')}</option>
                      <option value="SEWA">{t('profil_cabang.status_sewa')}</option>
                      <option value="MILIK_SENDIRI">{t('profil_cabang.status_milik_sendiri')}</option>
                      <option value="PINJAM_PAKAI">{t('profil_cabang.status_pinjam_pakai')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">{t('profil_cabang.status_bangunan')}</label>
                    <select
                      value={statusBangunan}
                      onChange={(e) => setStatusBangunan(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm bg-white focus:outline-none"
                    >
                      <option value="">{t('profil_cabang.pilih_status_bangunan')}</option>
                      <option value="WAKAF">{t('profil_cabang.status_wakaf')}</option>
                      <option value="KERJASAMA">{t('profil_cabang.status_kerjasama')}</option>
                      <option value="SEWA">{t('profil_cabang.status_sewa')}</option>
                      <option value="MILIK_SENDIRI">{t('profil_cabang.status_milik_sendiri')}</option>
                      <option value="PINJAM_PAKAI">{t('profil_cabang.status_pinjam_pakai')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'photos' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-500" />
                  {t('profil_cabang.galeri_foto')}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{t('profil_cabang.galeri_desc')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { id: 'fotoPlang', label: t('profil_cabang.foto_plang'), value: fotoPlang },
                  { id: 'fotoGedung', label: t('profil_cabang.foto_gedung'), value: fotoGedung },
                  { id: 'fotoHalaman', label: t('profil_cabang.foto_halaman'), value: fotoHalaman },
                  { id: 'fotoDenah', label: t('profil_cabang.foto_denah'), value: fotoDenah },
                  { id: 'fotoMushala', label: t('profil_cabang.foto_mushala'), value: fotoMushala },
                  { id: 'fotoKelas', label: t('profil_cabang.foto_kelas'), value: fotoKelas },
                  { id: 'fotoRuangTidur', label: t('profil_cabang.foto_ruang_tidur'), value: fotoRuangTidur },
                  { id: 'fotoRuangMakan', label: t('profil_cabang.foto_ruang_makan'), value: fotoRuangMakan },
                  { id: 'fotoKamarMandi', label: t('profil_cabang.foto_kamar_mandi'), value: fotoKamarMandi },
                ].map((ph) => (
                  <div key={ph.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-700 text-center mb-3 block">{ph.label}</span>
                    
                    {ph.value ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 group mb-3 shadow-sm bg-white">
                        <img src={ph.value} alt={ph.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer text-white text-xs font-semibold bg-blue-600/90 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5" />
                            {t('profil_cabang.ganti_foto')}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, ph.id)} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full h-32 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center gap-2 bg-white mb-3 hover:bg-blue-50/30 transition-all">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <span className="text-[11px] font-semibold text-slate-500">{t('profil_cabang.unggah_foto')}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, ph.id)} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end gap-3 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
            <button 
              type="submit" 
              disabled={saveMutation.isPending || isCompressing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm focus:outline-none disabled:bg-blue-400"
            >
              {saveMutation.isPending || isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isCompressing ? t('profil_cabang.memproses_gambar') : t('profil_cabang.menyimpan')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('profil_cabang.simpan_perubahan')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
