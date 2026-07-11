import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, Building, Users, MapPin, Phone, Shield, CheckCircle2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilCabang() {
  const { user } = useAuth();
  const cabangId = user?.cabangId;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setTotalSantriManual(data.totalSantriManual ?? '');

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
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Building className="w-7 h-7 text-blue-600" />
          Profil Cabang: {profile.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Kelola informasi identitas, pimpinan, dan alamat kantor cabang Anda</p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3 transition-all duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Capacity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            Informasi Identitas & Kapasitas
          </h4>
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
                onChange={(e) => setKapasitasSantri(e.target.value === '' ? '' : Number(e.target.value))} 
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Total Santri Seharusnya</label>
              <input 
                type="number" 
                value={totalSantriManual} 
                onChange={(e) => setTotalSantriManual(e.target.value === '' ? '' : Number(e.target.value))} 
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Leaders */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Struktur Pimpinan
          </h4>
          <div className="space-y-4">
            {/* Ketua Cabang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Cabang</label>
                <select
                  value={ketuaCabangId}
                  onChange={(e) => setKetuaCabangId(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Ketua Cabang --</option>
                  {profile.staffList?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">No. Telp / WhatsApp</label>
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{ketuaCabangId ? getTeacherPhone(ketuaCabangId) : '-'}</span>
                </div>
              </div>
            </div>

            {/* Ketua Muadalah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Muadalah</label>
                <select
                  value={ketuaMuadalahId}
                  onChange={(e) => setKetuaMuadalahId(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Ketua Muadalah --</option>
                  {profile.staffList?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">No. Telp / WhatsApp</label>
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{ketuaMuadalahId ? getTeacherPhone(ketuaMuadalahId) : '-'}</span>
                </div>
              </div>
            </div>

            {/* Ketua Resmi Isler */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Ketua Resmi Isler</label>
                <select
                  value={ketuaIslerId}
                  onChange={(e) => setKetuaIslerId(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Ketua Resmi Isler --</option>
                  {profile.staffList?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">No. Telp / WhatsApp</label>
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{ketuaIslerId ? getTeacherPhone(ketuaIslerId) : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
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
                  // Reset child fields
                  setAlamatKabId('');
                  setAlamatKabName('');
                  setAlamatKecId('');
                  setAlamatKecName('');
                  setAlamatKelId('');
                  setAlamatKelName('');
                }}
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
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
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
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
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">-- Pilih Kelurahan / Desa --</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Alamat Jalan / Kampung */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase">Alamat Jalan / Kampung</label>
              <textarea 
                value={alamatJalan}
                onChange={(e) => setAlamatJalan(e.target.value)}
                rows={2}
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="Masukkan alamat lengkap RT/RW, nama jalan atau kampung..."
              />
            </div>
          </div>
        </div>

        {/* Ownership Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            Status Aset Operasional
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Status Tanah</label>
              <select
                value={statusTanah}
                onChange={(e) => setStatusTanah(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Pilih Status Tanah --</option>
                <option value="Wakaf">Wakaf</option>
                <option value="Kerjasama">Kerjasama</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Status Bangunan</label>
              <select
                value={statusBangunan}
                onChange={(e) => setStatusBangunan(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-350 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Pilih Status Bangunan --</option>
                <option value="Wakaf">Wakaf</option>
                <option value="Kerjasama">Kerjasama</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
          <button 
            type="submit" 
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:bg-blue-400"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
