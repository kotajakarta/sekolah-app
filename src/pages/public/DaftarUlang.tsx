import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, ArrowRight, CheckCircle, ChevronLeft, Building, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { compressImage } from '../../lib/imageCompressor';

const PENDIDIKAN_OPTIONS = ['SD/Sederajat','SMP/Sederajat','SMA/Sederajat','D1','D2','D3','D4/S1','S2','S3','Tidak Bersekolah','Lainnya'];
const PEKERJAAN_OPTIONS = ['Tidak Bekerja','Pensiunan','PNS','TNI/Polisi','Guru/Dosen','Pegawai Swasta','Wiraswasta','Pengacara/Jaksa/Hakim/Notaris','Seniman/Pelukis/Artis/Sejenis','Dokter/Bidan/Perawat','Pilot/Pramugara','Pedagang','Petani/Peternak','Nelayan','Buruh (Tani/Pabrik/Bangunan)','Sopir/Masinis/Kondektur','Politikus','Lainnya'];
const PENGHASILAN_OPTIONS = ['dibawah 800.000','800.001 - 1.200.000','1.200.001 - 1.800.000','1.800.001 - 2.500.000','2.500.001 - 3.500.000','3.500.001 - 4.800.000','4.800.001 - 6.500.000','6.500.001 - 10.000.000','10.000.001 - 20.000.000','diatas 20.000.001'];

const inputCls = "block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150";
const selectCls = inputCls + " appearance-none cursor-pointer";

const InputField = ({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const FileCard = ({ 
  label, value, onUpload, isCompressing 
}: { 
  label: string; value: string; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; isCompressing: boolean;
}) => (
  <div className="group relative flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</span>
    {value ? (
      <div className="w-20 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        <img src={value} alt={label} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className="w-20 h-28 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
        <ImageIcon className="w-7 h-7" />
      </div>
    )}
    <label className={`w-full cursor-pointer rounded-lg border py-1.5 px-3 text-xs font-semibold text-center ${value ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'} ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {isCompressing ? (
        <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> ...</span>
      ) : (
        <span className="flex items-center justify-center gap-1.5"><Upload className="w-3 h-3" />{value ? 'Ganti' : 'Upload'}</span>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={isCompressing} />
    </label>
  </div>
);

export default function DaftarUlang() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [kodeDaftarUlang, setKodeDaftarUlang] = useState('');
  const [nik, setNik] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nik: '',
    nisn: '',
    fullName: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    kewarganegaraan: 'WNI',
    namaAyah: '',
    pekerjaanAyah: '',
    pendidikanAyah: '',
    penghasilanAyah: '',
    namaIbu: '',
    pekerjaanIbu: '',
    pendidikanIbu: '',
    penghasilanIbu: '',
    address: '',
    phone: '',
    fotoBase64: '',
    ijazahBase64: '',
    kkBase64: '',
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
        setFormData(prev => ({
          ...prev,
          nik: b.nik || nik,
          nisn: b.nisn || '',
          fullName: b.fullName || '',
          tempatLahir: b.tempatLahir || '',
          tanggalLahir: b.tanggalLahir ? new Date(b.tanggalLahir).toISOString().split('T')[0] : '',
          jenisKelamin: b.jenisKelamin || 'L',
          kewarganegaraan: b.kewarganegaraan || 'WNI',
          namaAyah: b.namaAyah || '',
          pekerjaanAyah: b.pekerjaanAyah || '',
          pendidikanAyah: b.pendidikanAyah || '',
          penghasilanAyah: b.penghasilanAyah || '',
          namaIbu: b.namaIbu || '',
          pekerjaanIbu: b.pekerjaanIbu || '',
          pendidikanIbu: b.pendidikanIbu || '',
          penghasilanIbu: b.penghasilanIbu || '',
          address: b.address || '',
          phone: b.phone || '',
          fotoBase64: b.fotoBase64 || '',
          ijazahBase64: b.ijazahBase64 || '',
          kkBase64: b.kkBase64 || '',
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
        showToast('success', 'Data siswa ditemukan, silakan lengkapi data yang kurang.');
      } else {
        setStudentId(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'fotoBase64' | 'ijazahBase64' | 'kkBase64') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 800);
      setFormData(prev => ({ ...prev, [field]: compressed }));
    } catch {
      showToast('error', 'Gagal memproses gambar');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">SekolahApp</h1>
            <p className="text-xs text-slate-500">Portal Daftar Ulang</p>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Kembali ke Beranda
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {step === 1 && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Daftar Ulang Siswa</h2>
              <p className="text-sm text-slate-500 mt-2">Masukkan NIK dan Kode Daftar Ulang yang diberikan oleh administrator.</p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); verifyMutation.mutate(); }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIK (Nomor Induk Kependudukan)</label>
                <input
                  type="text"
                  required
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Masukkan NIK 16 digit"
                  maxLength={16}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kode Daftar Ulang</label>
                <input
                  type="text"
                  required
                  value={kodeDaftarUlang}
                  onChange={(e) => setKodeDaftarUlang(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Contoh: DAFTAR2026"
                />
              </div>
              
              <button
                type="submit"
                disabled={verifyMutation.isPending || !nik || !kodeDaftarUlang}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-70"
              >
                {verifyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verifikasi Data'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="bg-indigo-600 px-8 py-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Formulir Daftar Ulang</h2>
                <p className="text-indigo-100 text-sm mt-1">Lengkapi data diri, orang tua, dan alamat dengan benar.</p>
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">Langkah 1 dari 2</span>
            </div>
            
            <form className="p-8 space-y-8" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Nama Lengkap" required><input name="fullName" value={formData.fullName} onChange={handleChange} required className={inputCls} /></InputField>
                <InputField label="NIK" required><input name="nik" value={formData.nik} readOnly className={inputCls + " bg-slate-100 cursor-not-allowed"} /></InputField>
                <InputField label="NISN"><input name="nisn" value={formData.nisn} onChange={handleChange} className={inputCls} /></InputField>
                <InputField label="No. Handphone" required><input name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} /></InputField>
                <InputField label="Tempat Lahir" required><input name="tempatLahir" value={formData.tempatLahir} onChange={handleChange} required className={inputCls} /></InputField>
                <InputField label="Tanggal Lahir" required><input type="date" name="tanggalLahir" value={formData.tanggalLahir} onChange={handleChange} required className={inputCls} /></InputField>
                <InputField label="Jenis Kelamin" required>
                  <select name="jenisKelamin" value={formData.jenisKelamin} onChange={handleChange} className={selectCls}>
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </InputField>
              </div>

              <hr className="border-slate-100" />
              <h3 className="font-bold text-slate-800">Data Orang Tua</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Data Ayah</h4>
                  <InputField label="Nama Ayah"><input name="namaAyah" value={formData.namaAyah} onChange={handleChange} className={inputCls} /></InputField>
                  <InputField label="Pekerjaan Ayah">
                    <select name="pekerjaanAyah" value={formData.pekerjaanAyah} onChange={handleChange} className={selectCls}>
                      <option value="">Pilih Pekerjaan</option>
                      {PEKERJAAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Pendidikan Ayah">
                    <select name="pendidikanAyah" value={formData.pendidikanAyah} onChange={handleChange} className={selectCls}>
                      <option value="">Pilih Pendidikan</option>
                      {PENDIDIKAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </InputField>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Data Ibu</h4>
                  <InputField label="Nama Ibu"><input name="namaIbu" value={formData.namaIbu} onChange={handleChange} className={inputCls} /></InputField>
                  <InputField label="Pekerjaan Ibu">
                    <select name="pekerjaanIbu" value={formData.pekerjaanIbu} onChange={handleChange} className={selectCls}>
                      <option value="">Pilih Pekerjaan</option>
                      {PEKERJAAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </InputField>
                  <InputField label="Pendidikan Ibu">
                    <select name="pendidikanIbu" value={formData.pendidikanIbu} onChange={handleChange} className={selectCls}>
                      <option value="">Pilih Pendidikan</option>
                      {PENDIDIKAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </InputField>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2">
                  Lanjutkan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="bg-indigo-600 px-8 py-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Alamat & Dokumen</h2>
                <p className="text-indigo-100 text-sm mt-1">Lengkapi alamat domisili dan unggah dokumen pendukung.</p>
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">Langkah 2 dari 2</span>
            </div>
            
            <form className="p-8 space-y-8" onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="col-span-full">
                  <InputField label="Alamat Lengkap (Jalan, RT/RW)" required>
                    <input name="alamatJalan" value={formData.alamatJalan} onChange={handleChange} required className={inputCls} />
                  </InputField>
                </div>
              </div>

              <hr className="border-slate-100" />
              <h3 className="font-bold text-slate-800">Unggah Dokumen</h3>
              <div className="flex gap-4">
                <FileCard label="Pas Foto" value={formData.fotoBase64} onUpload={(e) => handleFileUpload(e, 'fotoBase64')} isCompressing={isCompressing} />
                <FileCard label="Ijazah" value={formData.ijazahBase64} onUpload={(e) => handleFileUpload(e, 'ijazahBase64')} isCompressing={isCompressing} />
                <FileCard label="Kartu Keluarga" value={formData.kkBase64} onUpload={(e) => handleFileUpload(e, 'kkBase64')} isCompressing={isCompressing} />
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setStep(2)} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button type="submit" disabled={submitMutation.isPending} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2">
                  {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Selesai & Kirim'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-10 border border-slate-100 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil</h2>
            <p className="text-slate-600 mb-8">Data pendaftaran ulang Anda telah berhasil disimpan di dalam sistem. Terima kasih.</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors w-full">
              Kembali ke Beranda
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
