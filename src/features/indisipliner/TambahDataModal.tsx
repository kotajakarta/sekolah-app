import React, { useState } from 'react';
import { X, AlertTriangle, FileWarning, LogOut, Plus, Check, UserCheck } from 'lucide-react';
import { PelanggaranRecord, SuratPeringatanRecord, PengeluaranSiswaRecord, TingkatSp, KategoriPelanggaran } from './types';
import { useGetStudents } from '../core_data/hooks/useGetStudents';

interface TambahDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'pelanggaran' | 'sp' | 'pengeluaran';
  onAddPelanggaran: (data: PelanggaranRecord) => void;
  onAddSp: (data: SuratPeringatanRecord) => void;
  onAddPengeluaran: (data: PengeluaranSiswaRecord) => void;
}

export default function TambahDataModal({
  isOpen,
  onClose,
  defaultTab = 'pelanggaran',
  onAddPelanggaran,
  onAddSp,
  onAddPengeluaran,
}: TambahDataModalProps) {
  const [activeFormType, setActiveFormType] = useState<'pelanggaran' | 'sp' | 'pengeluaran'>(defaultTab);

  const { data: students = [] } = useGetStudents();

  // Form states - Pelanggaran
  const [siswaId, setSiswaId] = useState('');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [nisLokal, setNisLokal] = useState('');
  const [kelas, setKelas] = useState('X-A Ulya');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenisPelanggaran, setJenisPelanggaran] = useState('');
  const [kategori, setKategori] = useState<KategoriPelanggaran>('Ringan');
  const [poin, setPoin] = useState(5);
  const [lokasi, setLokasi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tindakanPembinaan, setTindakanPembinaan] = useState('');

  // Form states - SP
  const [tingkatSp, setTingkatSp] = useState<TingkatSp>('SP 1');
  const [nomorSp, setNomorSp] = useState(`SP/${Math.floor(Math.random() * 90 + 10)}/KDS/YTS/2026`);
  const [alasanSp, setAlasanSp] = useState('');
  const [berlakuHingga, setBerlakuHingga] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [poinAkumulasi, setPoinAkumulasi] = useState(30);

  // Form states - Pengeluaran
  const [nomorSk, setNomorSk] = useState(`SK/DO/YTS/2026/${Math.floor(Math.random() * 900 + 100)}`);
  const [alasanPemberhentian, setAlasanPemberhentian] = useState('');
  const [kategoriAlasan, setKategoriAlasan] = useState<'Akumulasi Poin Maksimal' | 'Pelanggaran Berat Syariat / Asusila' | 'Mangkir / Kabur' | 'Kriminal / Narkoba' | 'Lainnya'>('Akumulasi Poin Maksimal');
  const [pejabatTtd, setPejabatTtd] = useState('Dr. KH. Abdullah Syakir, M.Ag. (Pimpinan Lembaga)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSiswa.trim()) {
      alert('Nama Siswa wajib diisi!');
      return;
    }

    const effectiveSiswaId =
      siswaId ||
      students.find((s: any) => s.biodata?.fullName?.toLowerCase() === namaSiswa.trim().toLowerCase())?.id ||
      `std-${Date.now()}`;

    if (activeFormType === 'pelanggaran') {
      const newPel: PelanggaranRecord = {
        id: `PLG-${Date.now().toString().slice(-4)}`,
        tanggal,
        siswaId: effectiveSiswaId,
        namaSiswa: namaSiswa.trim(),
        nisLokal: nisLokal || `${Math.floor(Math.random() * 900000 + 100000)}`,
        kelas,
        jenisPelanggaran: jenisPelanggaran.trim() || 'Pelanggaran Disiplin',
        kategori,
        poin: Number(poin) || 5,
        lokasi: lokasi.trim() || 'Lingkungan Lembaga',
        keterangan: keterangan.trim(),
        tindakanPembinaan: tindakanPembinaan.trim() || 'Teguran tertulis & pembinaan',
        dicatatOleh: 'Petugas Ketertiban & Disiplin',
      };
      onAddPelanggaran(newPel);
    } else if (activeFormType === 'sp') {
      const newSp: SuratPeringatanRecord = {
        id: `SP-${Date.now().toString().slice(-4)}`,
        tanggalTerbit: tanggal,
        nomorSp: nomorSp.trim(),
        siswaId: effectiveSiswaId,
        namaSiswa: namaSiswa.trim(),
        nisLokal: nisLokal || `${Math.floor(Math.random() * 900000 + 100000)}`,
        kelas,
        tingkatSp,
        status: 'Aktif',
        alasan: alasanSp.trim() || 'Pelanggaran tata tertib berturut-turut',
        berlakuHingga,
        poinAkumulasi: Number(poinAkumulasi) || 30,
        tembusan: 'Wali Santri, Mudir Pesantren, Wali Kelas',
      };
      onAddSp(newSp);
    } else {
      const newDo: PengeluaranSiswaRecord = {
        id: `DO-${Date.now().toString().slice(-4)}`,
        tanggalKeluar: tanggal,
        siswaId: effectiveSiswaId,
        namaSiswa: namaSiswa.trim(),
        nisLokal: nisLokal || `${Math.floor(Math.random() * 900000 + 100000)}`,
        kelas,
        alasanPemberhentian: alasanPemberhentian.trim() || 'Keputusan Sidang Disiplin Pesantren',
        kategoriAlasan,
        nomorSk: nomorSk.trim(),
        tanggalSk: tanggal,
        dokumenSkUrl: `/dokumen/sk/${nomorSk.replace(/[\/]/g, '-')}.pdf`,
        ukuranDokumen: '350 KB',
        pejabatTtd,
      };
      onAddPengeluaran(newDo);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tambah Catatan Indisipliner</h3>
              <p className="text-xs text-slate-300">Pilih formulir sesuai jenis tindakan kedisiplinan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Type Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveFormType('pelanggaran')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeFormType === 'pelanggaran'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            1. Catat Pelanggaran
          </button>

          <button
            type="button"
            onClick={() => setActiveFormType('sp')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeFormType === 'sp'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileWarning className="w-4 h-4 text-amber-500" />
            2. Terbitkan SP
          </button>

          <button
            type="button"
            onClick={() => setActiveFormType('pengeluaran')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeFormType === 'pengeluaran'
                ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogOut className="w-4 h-4 text-red-500" />
            3. Pengeluaran Siswa
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Section: Identitas Santri (Shared) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
              Identitas Peserta Didik
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-600 font-semibold">Nama Lengkap Santri *</label>
                <input
                  type="text"
                  required
                  list="santri-datalist"
                  placeholder="Ketik atau pilih nama santri..."
                  value={namaSiswa}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNamaSiswa(val);
                    const matched = students.find(
                      (s: any) => s.biodata?.fullName?.toLowerCase() === val.trim().toLowerCase()
                    );
                    if (matched) {
                      setSiswaId(matched.id);
                      if (matched.biodata?.nisLokal || matched.siswaFormal?.nis) {
                        setNisLokal(matched.biodata?.nisLokal || matched.siswaFormal?.nis);
                      }
                      if (matched.siswaFormal?.kelas?.name) {
                        setKelas(matched.siswaFormal.kelas.name);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <datalist id="santri-datalist">
                  {students.slice(0, 100).map((s: any) => (
                    <option key={s.id} value={s.biodata?.fullName || ''}>
                      NIS: {s.biodata?.nisLokal || s.siswaFormal?.nis || '-'} • {s.siswaFormal?.kelas?.name || 'Umum'}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">NIS Lokal</label>
                <input
                  type="text"
                  placeholder="Contoh: 202401089"
                  value={nisLokal}
                  onChange={(e) => setNisLokal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Kelas</label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="VII-A Wustha">VII-A Wustha</option>
                  <option value="VIII-B Wustha">VIII-B Wustha</option>
                  <option value="IX-A Wustha">IX-A Wustha</option>
                  <option value="X-A Ulya">X-A Ulya</option>
                  <option value="X-B Ulya">X-B Ulya</option>
                  <option value="XI-A Ulya">XI-A Ulya</option>
                  <option value="XI-B Ulya">XI-B Ulya</option>
                  <option value="XII-A Ulya">XII-A Ulya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">
                  {activeFormType === 'pelanggaran' && 'Tanggal Kejadian *'}
                  {activeFormType === 'sp' && 'Tanggal Terbit SP *'}
                  {activeFormType === 'pengeluaran' && 'Tanggal Efektif Keluar *'}
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Form Content: Pelanggaran */}
          {activeFormType === 'pelanggaran' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-600 font-semibold">Jenis / Nama Pelanggaran *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Terlambat shalat berjamaah / Membawa HP"
                    value={jenisPelanggaran}
                    onChange={(e) => setJenisPelanggaran(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Bobot Poin (+)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={poin}
                    onChange={(e) => setPoin(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-rose-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Kategori Tingkat Pelanggaran</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as KategoriPelanggaran)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Ringan">Ringan (&lt; 10 Poin)</option>
                    <option value="Sedang">Sedang (10 - 24 Poin)</option>
                    <option value="Berat">Berat (≥ 25 Poin)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Lokasi Kejadian</label>
                  <input
                    type="text"
                    placeholder="Contoh: Asrama Putra / Masjid / Kelas"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Kronologi & Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Ceritakan singkat kronologi kejadian pelanggaran..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Tindakan Pembinaan / Sanksi Awal</label>
                <input
                  type="text"
                  placeholder="Contoh: Hafalan surat Al-Mulk / Ganti rugi / Teguran tertulis"
                  value={tindakanPembinaan}
                  onChange={(e) => setTindakanPembinaan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Form Content: SP */}
          {activeFormType === 'sp' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Tingkat SP *</label>
                  <select
                    value={tingkatSp}
                    onChange={(e) => setTingkatSp(e.target.value as TingkatSp)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-amber-700"
                  >
                    <option value="SP 1">SP 1 (Peringatan I)</option>
                    <option value="SP 2">SP 2 (Peringatan II)</option>
                    <option value="SP 3">SP 3 (Peringatan Terakhir)</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-slate-600 font-semibold">Nomor Surat Peringatan</label>
                  <input
                    type="text"
                    required
                    value={nomorSp}
                    onChange={(e) => setNomorSp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Masa Pembinaan Hingga</label>
                  <input
                    type="date"
                    value={berlakuHingga}
                    onChange={(e) => setBerlakuHingga(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Total Poin Akumulasi</label>
                  <input
                    type="number"
                    value={poinAkumulasi}
                    onChange={(e) => setPoinAkumulasi(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-rose-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Alasan / Konsideran Penerbitan SP *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan alasan penerbitan SP dan akumulasi catatan pelanggaran..."
                  value={alasanSp}
                  onChange={(e) => setAlasanSp(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Form Content: Pengeluaran */}
          {activeFormType === 'pengeluaran' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Nomor Surat Keputusan (SK)</label>
                  <input
                    type="text"
                    required
                    value={nomorSk}
                    onChange={(e) => setNomorSk(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Kategori Alasan Pengeluaran</label>
                  <select
                    value={kategoriAlasan}
                    onChange={(e) => setKategoriAlasan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Akumulasi Poin Maksimal">Akumulasi Poin Maksimal (&gt;100 Poin)</option>
                    <option value="Pelanggaran Berat Syariat / Asusila">Pelanggaran Berat Syariat / Asusila</option>
                    <option value="Mangkir / Kabur">Mangkir / Kabur &gt;30 Hari</option>
                    <option value="Kriminal / Narkoba">Tindak Pidana / Kriminal / Narkoba</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Alasan Utama Pemberhentian *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Uraikan dasar pemberhentian resmi santri dari lembaga..."
                  value={alasanPemberhentian}
                  onChange={(e) => setAlasanPemberhentian(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-rose-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Pejabat yang Menandatangani SK</label>
                <input
                  type="text"
                  value={pejabatTtd}
                  onChange={(e) => setPejabatTtd(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" /> Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
