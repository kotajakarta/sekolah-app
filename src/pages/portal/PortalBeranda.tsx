import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import { useGetPembelajaranSilabus, PembelajaranItem } from '../../features/portal/hooks/useGetPembelajaranSilabus';
import { getStudentFotoUrl } from '../../utils/photo';
import {
  UserCircle,
  CheckCircle2,
  XCircle,
  GraduationCap,
  MapPin,
  Loader2,
  Award,
  Calendar,
  BookOpen,
  Edit3,
  AlertTriangle,
  Phone,
  MessageCircle,
  Users,
  FileCheck,
  FileWarning,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Lock,
  Clock,
  Banknote,
  Receipt,
  CreditCard
} from 'lucide-react';
import ModalEditBiodataSantri from '../../features/portal/components/ModalEditBiodataSantri';

const STATUS_HAFIDZ_LABEL: Record<string, string> = {
  BELUM_MULAI: 'Belum Mulai Hafalan',
  SEDANG_BERLANGSUNG: 'Sedang Menghafal',
  SUDAH_SETOR_30_JUZ: 'Sudah Setor 30 Juz',
  SUDAH_KHATAMAN_KUBRO: 'Sudah Khataman Kubro',
};

interface CompletenessItem {
  key: string;
  label: string;
  category: 'Pribadi' | 'Orang Tua' | 'Alamat' | 'Dokumen';
  isComplete: boolean;
}

export default function PortalBeranda() {
  const navigate = useNavigate();
  const { selectedStudentId, selectedLink, isLoading, isError } = usePortalStudent();
  const { data: pembelajaranList = [], isLoading: isPembelajaranLoading } = useGetPembelajaranSilabus(selectedStudentId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchPembelajaran, setSearchPembelajaran] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Syahriyah query for current year
  const currentBulan = new Date().getMonth() + 1;
  const currentTahun = new Date().getFullYear();
  const { data: syahriyahData } = useQuery({
    queryKey: ['portal-syahriyah-summary-beranda', selectedStudentId, currentTahun],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await apiClient.get(`/portal/students/${selectedStudentId}/syahriyah?tahun=${currentTahun}`);
      return res.data;
    },
    enabled: !!selectedStudentId
  });

  const syahriyahTagihanList: any[] = syahriyahData?.tagihan || [];
  const currentMonthSyahriyah = syahriyahTagihanList.find(
    (t) => t.kategori === 'BULANAN' && t.bulan === currentBulan
  );
  const syahriyahSummary = syahriyahData?.summary || { totalTagihan: 0, totalLunas: 0, totalPending: 0, totalBelumLunas: 0 };

  const student = selectedLink?.student;
  const biodata = student?.biodata;
  const kelas = student?.siswaFormal?.kelas;
  const dataDaimi = student?.dataDaimi;
  const grupDaimi = dataDaimi?.grup;
  const ketuaDaimi = grupDaimi?.ketua;
  const canEdit = Boolean(student?.canEditBiodata);

  // 1. Evaluasi Kelengkapan Data Santri (Missing Fields)
  const completeness = useMemo(() => {
    if (!biodata) return { percentage: 0, missing: [], completedCount: 0, total: 0 };

    const items: CompletenessItem[] = [
      { key: 'fullName', label: 'Nama Lengkap', category: 'Pribadi', isComplete: !!biodata.fullName?.trim() },
      { key: 'nik', label: 'NIK Santri (16 digit)', category: 'Pribadi', isComplete: !!biodata.nik?.trim() && biodata.nik.replace(/\D/g, '').length === 16 },
      { key: 'noKk', label: 'Nomor Kartu Keluarga (16 digit)', category: 'Pribadi', isComplete: !!biodata.noKk?.trim() && biodata.noKk.replace(/\D/g, '').length === 16 },
      { key: 'nisn', label: 'NISN Santri (10 digit)', category: 'Pribadi', isComplete: !!biodata.nisn?.trim() && biodata.nisn.replace(/\D/g, '').length === 10 },
      { key: 'tempatLahir', label: 'Tempat Lahir', category: 'Pribadi', isComplete: !!biodata.tempatLahir?.trim() },
      { key: 'tanggalLahir', label: 'Tanggal Lahir', category: 'Pribadi', isComplete: !!biodata.tanggalLahir },
      { key: 'phone', label: 'No. Handphone / WhatsApp', category: 'Pribadi', isComplete: !!biodata.phone?.trim() },
      
      { key: 'namaAyah', label: 'Nama Ayah Kandung', category: 'Orang Tua', isComplete: !!biodata.namaAyah?.trim() },
      { key: 'nikAyah', label: 'NIK Ayah', category: 'Orang Tua', isComplete: biodata.statusHidupAyah === 'Wafat' || (!!biodata.nikAyah?.trim() && biodata.nikAyah.replace(/\D/g, '').length === 16) },
      { key: 'pekerjaanAyah', label: 'Pekerjaan Ayah', category: 'Orang Tua', isComplete: biodata.statusHidupAyah === 'Wafat' || !!biodata.pekerjaanAyah?.trim() },
      
      { key: 'namaIbu', label: 'Nama Ibu Kandung', category: 'Orang Tua', isComplete: !!biodata.namaIbu?.trim() },
      { key: 'nikIbu', label: 'NIK Ibu', category: 'Orang Tua', isComplete: biodata.statusHidupIbu === 'Wafat' || (!!biodata.nikIbu?.trim() && biodata.nikIbu.replace(/\D/g, '').length === 16) },
      { key: 'pekerjaanIbu', label: 'Pekerjaan Ibu', category: 'Orang Tua', isComplete: biodata.statusHidupIbu === 'Wafat' || !!biodata.pekerjaanIbu?.trim() },
      
      { key: 'alamatProv', label: 'Provinsi Domisili', category: 'Alamat', isComplete: !!biodata.alamatProvId || !!biodata.alamatProvName },
      { key: 'alamatKab', label: 'Kabupaten/Kota Domisili', category: 'Alamat', isComplete: !!biodata.alamatKabId || !!biodata.alamatKabName },
      { key: 'alamatKec', label: 'Kecamatan Domisili', category: 'Alamat', isComplete: !!biodata.alamatKecId || !!biodata.alamatKecName },
      { key: 'alamatKel', label: 'Kelurahan/Desa Domisili', category: 'Alamat', isComplete: !!biodata.alamatKelId || !!biodata.alamatKelName },
      { key: 'alamatJalan', label: 'Alamat Lengkap (Jalan, RT/RW)', category: 'Alamat', isComplete: !!biodata.alamatJalan?.trim() },
      
      { key: 'fotoUrl', label: 'Pas Foto Santri', category: 'Dokumen', isComplete: !!biodata.fotoUrl?.trim() },
      { key: 'kkUrl', label: 'Scan Kartu Keluarga (KK)', category: 'Dokumen', isComplete: !!biodata.kkUrl?.trim() },
      { key: 'ijazahUrl', label: 'Scan Ijazah Terakhir', category: 'Dokumen', isComplete: !!biodata.ijazahUrl?.trim() },
    ];

    const completedCount = items.filter((i) => i.isComplete).length;
    const percentage = Math.round((completedCount / items.length) * 100);
    const missing = items.filter((i) => !i.isComplete);

    return { percentage, missing, completedCount, total: items.length };
  }, [biodata]);

  // 3. Filter Pembelajaran Silabus
  const filteredPembelajaran = useMemo(() => {
    return pembelajaranList.filter((item: PembelajaranItem) => {
      const matchSearch =
        !searchPembelajaran ||
        item.mataPelajaran?.name?.toLowerCase().includes(searchPembelajaran.toLowerCase()) ||
        item.silabus?.bab?.toLowerCase().includes(searchPembelajaran.toLowerCase()) ||
        item.silabus?.section?.toLowerCase().includes(searchPembelajaran.toLowerCase()) ||
        item.guru?.name?.toLowerCase().includes(searchPembelajaran.toLowerCase());

      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'HADIR' && item.statusKehadiran === 'HADIR') ||
        (filterStatus === 'IZIN_SAKIT' && (item.statusKehadiran === 'IZIN' || item.statusKehadiran === 'SAKIT')) ||
        (filterStatus === 'ALPA' && item.statusKehadiran === 'ALPA');

      return matchSearch && matchStatus;
    });
  }, [pembelajaranList, searchPembelajaran, filterStatus]);

  const pembelajaranStats = useMemo(() => {
    let hadir = 0;
    let izinSakit = 0;
    let alpa = 0;
    pembelajaranList.forEach((item) => {
      if (item.statusKehadiran === 'HADIR') hadir++;
      else if (item.statusKehadiran === 'IZIN' || item.statusKehadiran === 'SAKIT') izinSakit++;
      else if (item.statusKehadiran === 'ALPA') alpa++;
    });
    const total = pembelajaranList.length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return { hadir, izinSakit, alpa, total, rate };
  }, [pembelajaranList]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="font-semibold text-slate-700">Memuat data portal santri...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 shadow-xs p-8 text-sm text-rose-600 text-center font-medium">
        Gagal memuat data santri. Silakan muat ulang halaman.
      </div>
    );
  }

  if (!selectedStudentId || !selectedLink || !student) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center text-sm text-slate-500">
        Belum ada santri yang terhubung ke akun walisantri ini.
      </div>
    );
  }

  const fotoUrl = getStudentFotoUrl(biodata?.fotoUrl);
  const formattedTtl = [
    biodata?.tempatLahir,
    biodata?.tanggalLahir
      ? new Date(biodata.tanggalLahir).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  const ketuaWaLink = ketuaDaimi?.phone
    ? `https://wa.me/${ketuaDaimi.phone.replace(/\D/g, '').replace(/^0/, '62')}`
    : null;

  return (
    <div className="space-y-6">
      {/* ── BANNER HEADER INFORMASI UTAMA ── */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> Portal Wali Santri
              </span>
              {student.isActive === false ? (
                <span className="px-3 py-1 bg-rose-500/20 border border-rose-400/30 text-rose-300 rounded-full text-xs font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Nonaktif
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Santri Aktif
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {biodata?.fullName || 'Nama Santri Belum Diisi'}
            </h1>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-emerald-100/80 flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                Kelas:{' '}
                <strong className="text-white font-semibold">
                  {kelas?.name ? `${kelas.name}${kelas.tingkat ? ` (Tingkat ${kelas.tingkat})` : ''}` : 'Belum Ada Kelas'}
                </strong>
              </span>
              <span className="text-emerald-300/40">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Cabang: <strong className="text-white font-semibold">{student.cabang?.name ?? '-'}</strong>
              </span>
              {student.statusHafidz && (
                <>
                  <span className="text-emerald-300/40">•</span>
                  <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <Award className="w-4 h-4 text-amber-400" />
                    {STATUS_HAFIDZ_LABEL[student.statusHafidz] ?? student.statusHafidz}
                  </span>
                </>
              )}
            </div>
          </div>

          {canEdit ? (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Perbarui Data Santri
            </button>
          ) : (
            <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shrink-0 shadow-sm">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Edit Data Dikunci Cabang</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2 COLUMN MAIN GRID LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ══════════ LEFT COLUMN: INFORMASI UTAMA (7 COLS) ══════════ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. STATUS KELENGKAPAN & DATA SANTRI YANG KURANG */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  completeness.percentage === 100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {completeness.percentage === 100 ? <FileCheck className="w-5 h-5" /> : <FileWarning className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Kelengkapan Data & Berkas Santri</h2>
                  <p className="text-xs text-slate-500">
                    {completeness.percentage === 100
                      ? 'Seluruh data diri dan berkas santri telah terisi lengkap.'
                      : `Terdapat ${completeness.missing.length} data yang masih kosong atau belum diunggah.`}
                  </p>
                </div>
              </div>

              <span className={`text-base font-extrabold px-3 py-1 rounded-xl border ${
                completeness.percentage === 100
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : completeness.percentage >= 70
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {completeness.percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completeness.percentage === 100
                      ? 'bg-emerald-600'
                      : completeness.percentage >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>{completeness.completedCount} dari {completeness.total} data lengkap</span>
                <span>Target kelengkapan: 100%</span>
              </div>
            </div>

            {/* Missing items list */}
            {completeness.missing.length > 0 ? (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Daftar data santri yang belum lengkap:
                </p>
                <div className="flex flex-wrap gap-2">
                  {completeness.missing.map((item) => (
                    <span
                      key={item.key}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50/80 text-rose-700 border border-rose-200/80"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {item.label}
                    </span>
                  ))}
                </div>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Lengkapi Data Sekarang
                  </button>
                ) : (
                  <div className="mt-2 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-medium flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-950">Akses Edit Belum Diaktifkan oleh Cabang</span>
                      Fitur perbaruan data mandiri santri sedang dinonaktifkan oleh <strong>{student.cabang?.name || 'Cabang Terkait'}</strong>. Silakan menghubungi admin Cabang jika ada perbaruan data.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Luar biasa! Seluruh data santri dan berkas persyaratan sudah lengkap dan valid.</span>
              </div>
            )}
          </div>

          {/* ── 2. WIDGET STATUS IURAN SYAHRIYAH ── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Status Iuran Syahriyah & Biaya</h2>
                  <p className="text-xs text-slate-500">Iuran bulanan dan biaya pendidikan santri periode {currentTahun}.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/portal/syahriyah')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                Lihat Detail <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Status Bulan Ini */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Syahriyah Bulan Ini
                </span>
                <div className="pt-0.5">
                  {currentMonthSyahriyah?.status === 'LUNAS' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
                    </span>
                  ) : currentMonthSyahriyah?.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 animate-pulse">
                      <Clock className="w-3.5 h-3.5" /> MENUNGGU VERIFIKASI
                    </span>
                  ) : currentMonthSyahriyah ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5" /> BELUM DIBAYAR
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Belum Diterbitkan</span>
                  )}
                </div>
              </div>

              {/* Total Belum Lunas */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tunggakan Belum Lunas
                </span>
                <p className="text-sm sm:text-base font-extrabold font-mono text-rose-700">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(syahriyahSummary.totalBelumLunas || 0)}
                </p>
              </div>

              {/* Terbayar Lunas */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Sudah Terbayar
                </span>
                <p className="text-sm sm:text-base font-extrabold font-mono text-emerald-700">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(syahriyahSummary.totalLunas || 0)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/portal/syahriyah')}
              className="w-full py-2.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Buka Rincian Tagihan & Konfirmasi Pembayaran
            </button>
          </div>

          {/* 3. NAMA KETUA GRUP DAIMI & KONTAK */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pembina & Grup Daimi</h2>
                  <p className="text-xs text-slate-500">Informasi ketua grup daimi dan kontak pembimbing santri.</p>
                </div>
              </div>

              {grupDaimi ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {grupDaimi.name}
                </span>
              ) : null}
            </div>

            {grupDaimi ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Info Ketua Grup */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Ketua Grup Daimi
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {ketuaDaimi?.name || 'Belum Ditentukan'}
                    </p>
                    <p className="text-xs text-slate-500">{ketuaDaimi?.position || 'Ketua / Pembina Grup'}</p>
                  </div>

                  {ketuaDaimi?.phone ? (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${ketuaDaimi.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-700 transition-colors shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        {ketuaDaimi.phone}
                      </a>
                      {ketuaWaLink && (
                        <a
                          href={ketuaWaLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-colors shadow-2xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat WA
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Kontak belum tersedia</span>
                  )}
                </div>

                {/* Info Kelas / Grup Daimi */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Grup & Kelas Daimi
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{grupDaimi.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kategori Grup</span>
                      <strong className="text-slate-800 font-semibold">{grupDaimi.jenis || 'Daimi'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kelas Daimi</span>
                      <strong className="text-slate-800 font-semibold">{dataDaimi.kelas?.name || '-'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500 space-y-1.5">
                <Users className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Santri Belum Masuk ke Grup Daimi</p>
                <p className="text-slate-400 max-w-sm mx-auto">
                  Informasi ketua grup dan kontak pembina akan muncul setelah santri dialokasikan ke grup daimi oleh cabang.
                </p>
              </div>
            )}
          </div>

          {/* 3. KEGIATAN PEMBELAJARAN (KONTROL SILABUS & ABSENSI MAPEL) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Kegiatan Pembelajaran Silabus</h2>
                  <p className="text-xs text-slate-500">
                    Riwayat materi pelajaran yang telah diajarkan dan status kehadiran santri.
                  </p>
                </div>
              </div>

              {/* Stat pill */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  {pembelajaranStats.rate}% Mengikuti
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl">
                  {pembelajaranStats.total} Sesi
                </span>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchPembelajaran}
                  onChange={(e) => setSearchPembelajaran(e.target.value)}
                  placeholder="Cari mata pelajaran, materi, atau guru..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'HADIR', label: 'Hadir' },
                  { id: 'IZIN_SAKIT', label: 'Izin / Sakit' },
                  { id: 'ALPA', label: 'Alpa' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                      filterStatus === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table / List Pembelajaran */}
            {isPembelajaranLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Memuat data pembelajaran silabus...
              </div>
            ) : filteredPembelajaran.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Belum Ada Catatan Pembelajaran Silabus</p>
                <p className="text-slate-400">
                  Data sesi belajar dan absensi mapel akan otomatis tampil saat guru melakukan absensi kontrol silabus.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3.5">Tanggal</th>
                      <th className="py-2.5 px-3.5">Mata Pelajaran</th>
                      <th className="py-2.5 px-3.5">Materi / Bab</th>
                      <th className="py-2.5 px-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPembelajaran.map((item: PembelajaranItem) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-semibold text-slate-700 whitespace-nowrap">
                          {item.tanggal
                            ? new Date(item.tanggal).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-bold text-slate-900">{item.mataPelajaran?.name || 'Mata Pelajaran'}</p>
                          {item.guru?.name && (
                            <p className="text-[11px] text-slate-400 font-normal">Guru: {item.guru.name}</p>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <p className="font-semibold text-slate-800">{item.silabus?.bab || '-'}</p>
                          {item.silabus?.section && (
                            <p className="text-[11px] text-slate-500 font-medium">{item.silabus.section}</p>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {item.statusKehadiran === 'HADIR' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Mengikuti
                            </span>
                          ) : item.statusKehadiran === 'SAKIT' ? (
                            <span className="inline-flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>Sakit</span>
                              {item.catatan && (
                                <span className="text-[9px] font-normal text-amber-600">({item.catatan})</span>
                              )}
                            </span>
                          ) : item.statusKehadiran === 'IZIN' ? (
                            <span className="inline-flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span>Izin</span>
                              {item.catatan && (
                                <span className="text-[9px] font-normal text-blue-600">({item.catatan})</span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span>Tidak Hadir</span>
                              {item.catatan && (
                                <span className="text-[9px] font-normal text-rose-600">({item.catatan})</span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* ══════════ RIGHT COLUMN: DATA SINGKAT SANTRI (5 COLS) ══════════ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 sticky top-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-emerald-600" /> Profil Singkat Santri
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            {/* Foto & Identitas Pokok */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={biodata?.fullName || 'Santri'}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-emerald-50 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-100 border-4 border-slate-50 flex items-center justify-center text-slate-400 ${
                    fotoUrl ? 'hidden' : ''
                  }`}
                >
                  <UserCircle className="w-16 h-16" />
                </div>

                <div className="absolute -bottom-2 -right-2">
                  {student.isActive !== false ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-xs">
                      ✓
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white border-2 border-white flex items-center justify-center shadow-xs">
                      ✕
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {biodata?.fullName || 'Nama Belum Diisi'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  NIK: <span className="font-semibold text-slate-700">{biodata?.nik || '-'}</span>
                </p>
              </div>
            </div>

            {/* Data Detail Singkat (TTL, NIK, Orang Tua, Alamat) */}
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">Tempat, Tgl Lahir</span>
                <span className="text-slate-800 font-semibold text-right">{formattedTtl || '-'}</span>
              </div>

              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">Jenis Kelamin</span>
                <span className="text-slate-800 font-semibold">
                  {biodata?.jenisKelamin === 'P' || biodata?.jenisKelamin === 'PEREMPUAN'
                    ? 'Perempuan'
                    : 'Laki-Laki'}
                </span>
              </div>

              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">NISN</span>
                <span className="text-slate-800 font-semibold font-mono">{biodata?.nisn || '-'}</span>
              </div>

              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">Nomor Kartu Keluarga</span>
                <span className="text-slate-800 font-semibold font-mono">{biodata?.noKk || '-'}</span>
              </div>

              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">Nama Ayah</span>
                <span className="text-slate-800 font-semibold text-right">
                  {biodata?.namaAyah || '-'}
                  {biodata?.statusHidupAyah === 'Wafat' && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(Alm)</span>
                  )}
                </span>
              </div>

              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">Nama Ibu</span>
                <span className="text-slate-800 font-semibold text-right">
                  {biodata?.namaIbu || '-'}
                  {biodata?.statusHidupIbu === 'Wafat' && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(Almh)</span>
                  )}
                </span>
              </div>

              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">No. WhatsApp Santri/Ortu</span>
                <span className="text-slate-800 font-semibold text-right">{biodata?.phone || '-'}</span>
              </div>

              <div className="py-2.5 flex items-start justify-between gap-4">
                <span className="text-slate-400 font-medium">Domisili</span>
                <span className="text-slate-800 font-semibold text-right">
                  {[biodata?.alamatKabName, biodata?.alamatProvName].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            {canEdit ? (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-4 h-4 text-emerald-600" />
                Perbarui Profil Biodata
              </button>
            ) : (
              <div className="w-full py-3 px-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Edit Biodata Dikunci Cabang</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Edit Data Siswa */}
      <ModalEditBiodataSantri
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        studentId={student.id}
        initialBiodata={biodata}
      />
    </div>
  );
}
