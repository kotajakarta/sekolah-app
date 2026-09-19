import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  FileWarning,
  LogOut,
  Plus,
  Check,
  Search,
  Upload,
  FileText,
  FileDown,
  Loader2,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { PelanggaranRecord, SuratPeringatanRecord, PengeluaranSiswaRecord, TingkatSp, KategoriPelanggaran } from './types';
import { useGetStudents, Student } from '../core_data/hooks/useGetStudents';
import { useUploadIndisiplinerDoc, downloadSpTemplateDocx, downloadPengeluaranTemplateDocx } from './useIndisipliner';

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

  // Ambil data santri riil dari database sistem
  const { data: students = [], isLoading: isLoadingStudents } = useGetStudents();

  // Search & Selected Student State
  const [searchSantriQuery, setSearchSantriQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states - Identitas Santri
  const [siswaId, setSiswaId] = useState('');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [nisLokal, setNisLokal] = useState('');
  const [kelas, setKelas] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // Form states - Pelanggaran
  const [jenisPelanggaran, setJenisPelanggaran] = useState('');
  const [kategori, setKategori] = useState<KategoriPelanggaran>('Ringan');
  const [poin, setPoin] = useState(5);
  const [lokasi, setLokasi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tindakanPembinaan, setTindakanPembinaan] = useState('');

  // Form states - SP
  const [tingkatSp, setTingkatSp] = useState<TingkatSp>('SP 1');
  const [nomorSp, setNomorSp] = useState('');
  const [alasanSp, setAlasanSp] = useState('');
  const [berlakuHingga, setBerlakuHingga] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [poinAkumulasi, setPoinAkumulasi] = useState(30);

  // Form states - Pengeluaran
  const [nomorSk, setNomorSk] = useState('');
  const [alasanPemberhentian, setAlasanPemberhentian] = useState('');
  const [kategoriAlasan, setKategoriAlasan] = useState<'Akumulasi Poin Maksimal' | 'Pelanggaran Berat Syariat / Asusila' | 'Mangkir / Kabur' | 'Kriminal / Narkoba' | 'Lainnya'>('Akumulasi Poin Maksimal');
  const [pejabatTtd, setPejabatTtd] = useState('');

  // Upload File States
  const uploadDocMutation = useUploadIndisiplinerDoc();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSpDoc, setUploadedSpDoc] = useState<{ url: string; filename: string; ukuran: string } | null>(null);
  const [uploadedSkDoc, setUploadedSkDoc] = useState<{ url: string; filename: string; ukuran: string } | null>(null);

  // Error validation
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-filter daftar santri berdasarkan kata kunci pencarian
  const filteredStudents = useMemo(() => {
    if (!searchSantriQuery.trim()) return [];
    const q = searchSantriQuery.toLowerCase();
    return students
      .filter((s: Student) => {
        const name = s.biodata?.fullName?.toLowerCase() || '';
        const nis = (s.biodata?.nisLokal || s.siswaFormal?.nis || '').toLowerCase();
        const nisn = (s.biodata?.nisn || s.siswaFormal?.nisn || '').toLowerCase();
        const kelasName = (s.siswaFormal?.kelas?.name || '').toLowerCase();
        const cabangName = (s.cabang?.name || '').toLowerCase();
        return name.includes(q) || nis.includes(q) || nisn.includes(q) || kelasName.includes(q) || cabangName.includes(q);
      })
      .slice(0, 15);
  }, [students, searchSantriQuery]);

  // Handler memilih santri riil dari database
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSiswaId(student.id);
    setNamaSiswa(student.biodata?.fullName || 'Santri');
    setNisLokal(student.biodata?.nisLokal || student.siswaFormal?.nis || '-');
    setKelas(student.siswaFormal?.kelas?.name || student.cabang?.name || 'Reguler');
    setSearchSantriQuery('');
    setIsDropdownOpen(false);
    setErrorMessage('');
  };

  // Reset pilihan santri
  const handleResetStudent = () => {
    setSelectedStudent(null);
    setSiswaId('');
    setNamaSiswa('');
    setNisLokal('');
    setKelas('');
    setSearchSantriQuery('');
  };

  // Handler upload berkas PDF / Gambar
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'sp' | 'sk') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 15 MB.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');
      const res = await uploadDocMutation.mutateAsync(file);
      if (target === 'sp') {
        setUploadedSpDoc({
          url: res.url,
          filename: res.filename,
          ukuran: res.ukuranDokumen,
        });
      } else {
        setUploadedSkDoc({
          url: res.url,
          filename: res.filename,
          ukuran: res.ukuranDokumen,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Gagal mengunggah berkas dokumen.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!siswaId || !namaSiswa.trim()) {
      setErrorMessage('Wajib memilih santri terdaftar dari database sistem!');
      return;
    }

    if (activeFormType === 'pelanggaran') {
      if (!jenisPelanggaran.trim()) {
        setErrorMessage('Jenis/Nama pelanggaran wajib diisi!');
        return;
      }

      const newPel: PelanggaranRecord = {
        id: `PLG-${Date.now()}`,
        tanggal,
        siswaId,
        namaSiswa: namaSiswa.trim(),
        nisLokal: nisLokal || '-',
        kelas: kelas.trim() || 'Umum',
        jenisPelanggaran: jenisPelanggaran.trim(),
        kategori,
        poin: Number(poin) || 5,
        lokasi: lokasi.trim() || '-',
        keterangan: keterangan.trim(),
        tindakanPembinaan: tindakanPembinaan.trim() || 'Pembinaan lisan & tertulis',
        dicatatOleh: 'Petugas Ketertiban & Disiplin',
      };
      onAddPelanggaran(newPel);
    } else if (activeFormType === 'sp') {
      if (!alasanSp.trim()) {
        setErrorMessage('Alasan penerbitan SP wajib diisi!');
        return;
      }

      const newSp: SuratPeringatanRecord = {
        id: `SP-${Date.now()}`,
        tanggalTerbit: tanggal,
        nomorSp: nomorSp.trim() || `SP/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
        siswaId,
        namaSiswa: namaSiswa.trim(),
        nisLokal: nisLokal || '-',
        kelas: kelas.trim() || 'Umum',
        tingkatSp,
        status: 'Aktif',
        alasan: alasanSp.trim(),
        berlakuHingga,
        poinAkumulasi: Number(poinAkumulasi) || 0,
        tembusan: 'Wali Santri, Pimpinan Lembaga, Wali Kelas',
        dokumenSpUrl: uploadedSpDoc?.url || null,
        ukuranDokumen: uploadedSpDoc?.ukuran || null,
      };
      onAddSp(newSp);
    } else {
      if (!alasanPemberhentian.trim()) {
        setErrorMessage('Alasan pemberhentian wajib diisi!');
        return;
      }

      const newDo: PengeluaranSiswaRecord = {
        id: `DO-${Date.now()}`,
        tanggalKeluar: tanggal,
        siswaId,
        namaSiswa: namaSiswa.trim(),
        nisLokal: nisLokal || '-',
        kelas: kelas.trim() || 'Umum',
        alasanPemberhentian: alasanPemberhentian.trim(),
        kategoriAlasan,
        nomorSk: nomorSk.trim() || `SK-DO/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
        tanggalSk: tanggal,
        dokumenSkUrl: uploadedSkDoc?.url || '',
        ukuranDokumen: uploadedSkDoc?.ukuran || '-',
        pejabatTtd: pejabatTtd.trim() || 'Pimpinan Pondok Pesantren',
      };
      onAddPengeluaran(newDo);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tambah Catatan Indisipliner</h3>
              <p className="text-xs text-slate-300">Catat santri yang melakukan pelanggaran atau tindakan disiplin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Type Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveFormType('pelanggaran');
              setErrorMessage('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
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
            onClick={() => {
              setActiveFormType('sp');
              setErrorMessage('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
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
            onClick={() => {
              setActiveFormType('pengeluaran');
              setErrorMessage('');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
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
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section: Identitas Santri Riil dari Database */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10.5px]">
                Identitas Peserta Didik (Data Santri Terdaftar)
              </span>
              {selectedStudent && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> Terverifikasi di Database
                </span>
              )}
            </div>

            {selectedStudent ? (
              /* Tampilan santri terpilih */
              <div className="p-3.5 bg-white border-2 border-indigo-500/50 rounded-xl shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                    {namaSiswa.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{namaSiswa}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>NIS: <strong className="font-mono text-slate-700">{nisLokal}</strong></span>
                      <span>•</span>
                      <span>Kelas: <strong className="text-slate-700">{kelas}</strong></span>
                      {selectedStudent.cabang?.name && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">{selectedStudent.cabang.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetStudent}
                  className="px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  Ganti Santri
                </button>
              </div>
            ) : (
              /* Input pencarian santri dari database */
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={
                      isLoadingStudents
                        ? 'Memuat data santri dari database...'
                        : 'Ketik nama santri atau NIS untuk memilih dari database...'
                    }
                    disabled={isLoadingStudents}
                    value={searchSantriQuery}
                    onChange={(e) => {
                      setSearchSantriQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  />
                </div>

                {/* Dropdown hasil pencarian santri */}
                {isDropdownOpen && searchSantriQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        Tidak ada santri ditemukan dengan kata kunci &quot;{searchSantriQuery}&quot;
                      </div>
                    ) : (
                      filteredStudents.map((s: Student) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStudent(s)}
                          className="p-2.5 hover:bg-indigo-50/70 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              {s.biodata?.fullName || 'Tanpa Nama'}
                            </span>
                            <div className="text-[10.5px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>NIS: {s.biodata?.nisLokal || s.siswaFormal?.nis || '-'}</span>
                              <span>•</span>
                              <span>Kelas: {s.siswaFormal?.kelas?.name || 'Umum'}</span>
                              {s.cabang?.name && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-600">{s.cabang.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                            Pilih
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Kelas / Rombel</label>
                <input
                  type="text"
                  placeholder="Contoh: VII-A / X-B Ulya"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
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
                    placeholder="Contoh: Terlambat Shalat Berjamaah / Membawa HP / Keluar Asrama Tanpa Izin"
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
                    placeholder="Contoh: Asrama Putra / Masjid / Kelas / Lingkungan Lembaga"
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
                  placeholder="Ceritakan kronologi singkat kejadian pelanggaran..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Tindakan Pembinaan / Sanksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Teguran lisan, tadarus Al-Qur'an 1 juz, pemanggilan wali santri"
                  value={tindakanPembinaan}
                  onChange={(e) => setTindakanPembinaan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Form Content: SP */}
          {activeFormType === 'sp' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-700">Format & Template Surat Peringatan</span>
                <button
                  type="button"
                  onClick={() => downloadSpTemplateDocx(tingkatSp)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold transition-colors cursor-pointer border border-indigo-200"
                  title="Unduh Template Word SP ini"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                  Unduh Template DOCX ({tingkatSp})
                </button>
              </div>

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
                    placeholder="Contoh: 001/SP/PST/2026"
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
                  placeholder="Jelaskan dasar pertimbangan penerbitan surat peringatan..."
                  value={alasanSp}
                  onChange={(e) => setAlasanSp(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Upload Berkas Scan SP (PDF / Gambar) */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                <label className="text-slate-700 font-bold flex items-center gap-1.5 text-[11px]">
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  Lampirkan Scan / Dokumen SP (PDF atau Gambar)
                </label>
                {uploadedSpDoc ? (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block truncate max-w-[280px]">
                          {uploadedSpDoc.filename}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {uploadedSpDoc.ukuran} • Terlampir
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedSpDoc(null)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Hapus lampiran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-amber-300 rounded-lg bg-white hover:bg-amber-50/50 transition-colors cursor-pointer text-center">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          <span>Mengunggah dokumen berkas...</span>
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-4 h-4 text-amber-600" />
                          <span>Pilih file PDF atau Gambar (JPG, PNG)</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">Maksimal 15 MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(e, 'sp')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Form Content: Pengeluaran */}
          {activeFormType === 'pengeluaran' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-700">Format & Template Surat Keputusan</span>
                <button
                  type="button"
                  onClick={() => downloadPengeluaranTemplateDocx()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold transition-colors cursor-pointer border border-indigo-200"
                  title="Unduh Template Word SK Pengeluaran"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                  Unduh Template DOCX (SK DO)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">Nomor SK Pengeluaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: 012/SK-DO/PST/2026"
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
                  placeholder="Uraikan dasar keputusan pemberhentian santri dari lembaga..."
                  value={alasanPemberhentian}
                  onChange={(e) => setAlasanPemberhentian(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-rose-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">Pejabat yang Menandatangani SK</label>
                <input
                  type="text"
                  placeholder="Nama & Jabatan Penandatangan (contoh: Pimpinan Pondok Pesantren)"
                  value={pejabatTtd}
                  onChange={(e) => setPejabatTtd(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Upload Berkas Scan SK Pengeluaran (PDF / Gambar) */}
              <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl space-y-2">
                <label className="text-slate-700 font-bold flex items-center gap-1.5 text-[11px]">
                  <Upload className="w-3.5 h-3.5 text-red-600" />
                  Lampirkan Berkas Asli SK Pengeluaran (PDF atau Gambar)
                </label>
                {uploadedSkDoc ? (
                  <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block truncate max-w-[280px]">
                          {uploadedSkDoc.filename}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {uploadedSkDoc.ukuran} • Terlampir
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedSkDoc(null)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus lampiran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-red-300 rounded-lg bg-white hover:bg-red-50/50 transition-colors cursor-pointer text-center">
                    <div className="flex items-center gap-2 text-red-800 font-semibold text-xs">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          <span>Mengunggah dokumen SK...</span>
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-4 h-4 text-red-600" />
                          <span>Pilih file PDF atau Gambar (JPG, PNG)</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">Maksimal 15 MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(e, 'sk')}
                      className="hidden"
                    />
                  </label>
                )}
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
              disabled={isUploading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Simpan Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
