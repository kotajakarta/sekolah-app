import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  HeartHandshake,
  UserCheck,
  Calendar,
  Lock,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Eye,
  EyeOff,
  Building,
  Sparkles,
  Info
} from 'lucide-react';

interface VerifiedStudent {
  id: string;
  fullName: string;
  nik: string | null;
  nisLokal: string | null;
  cabangId: string | null;
  cabangName: string;
  kelasName: string;
}

export default function PortalRegisterPage() {
  const navigate = useNavigate();

  const { data: moduleSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['module-settings'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/pengaturan/modules');
        return res.data;
      } catch (e) {
        return { portalWalsanEnabled: true };
      }
    },
    staleTime: 60000,
  });

  const isPortalEnabled = moduleSettings?.portalWalsanEnabled !== false;

  // Step state: 1 = verify student, 2 = fill parent info, 3 = success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Student verification
  const [studentNik, setStudentNik] = useState('');
  const [studentBirthDate, setStudentBirthDate] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<VerifiedStudent | null>(null);

  // Step 2: Parent data
  const [namaWalsan, setNamaWalsan] = useState('');
  const [nikWalsan, setNikWalsan] = useState('');
  const [hubungan, setHubungan] = useState('Ayah');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available?: boolean; message?: string } | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await apiClient.get<{ available: boolean; message: string }>(
          `/auth/check-username?username=${encodeURIComponent(username.trim().toLowerCase())}`
        );
        setUsernameStatus(res.data);
      } catch (err) {
        setUsernameStatus(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  // Handle Step 1: Verify Student
  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');

    if (!studentNik.trim() || !studentBirthDate) {
      setVerifyError('Harap isi NIK dan Tanggal Lahir santri dengan lengkap.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiClient.post<{ verified: boolean; student: VerifiedStudent }>(
        '/auth/walsan/verify-student',
        {
          nik: studentNik.trim(),
          tanggalLahir: studentBirthDate,
        }
      );

      if (response.data.verified && response.data.student) {
        setVerifiedStudent(response.data.student);
        setStep(2);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Data santri dengan NIK dan Tanggal Lahir tersebut tidak ditemukan. Mohon pastikan data sesuai dengan arsip pendaftaran pesantren.';
      setVerifyError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Step 2: Register Account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!verifiedStudent) {
      setStep(1);
      return;
    }

    if (!namaWalsan.trim() || !phone.trim() || !username.trim() || !password || !confirmPassword) {
      setSubmitError('Harap lengkapi semua kolom yang wajib diisi, termasuk Nomor WhatsApp / HP.');
      return;
    }

    if (usernameStatus && !usernameStatus.available) {
      setSubmitError('Username sudah digunakan. Silakan gunakan username lain.');
      return;
    }

    if (password.length < 6) {
      setSubmitError('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/walsan/register', {
        studentId: verifiedStudent.id,
        namaWalsan: namaWalsan.trim(),
        nikWalsan: nikWalsan.trim() || undefined,
        hubungan,
        phone: phone.trim(),
        username: username.trim().toLowerCase(),
        password,
      });

      setStep(3);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftarkan akun. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoadingSettings && !isPortalEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-200">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-md">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">Portal Wali Santri</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    Nonaktif
                  </span>
                </div>
                <p className="text-xs text-slate-400">Pusdatin PP Sulaimaniyah</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
              >
                Login Petugas
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl text-center space-y-6 w-full">
            <div className="w-16 h-16 bg-rose-50 border border-rose-200/80 rounded-3xl mx-auto flex items-center justify-center text-rose-600 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Modul Portal Wali Santri Sedang Nonaktif
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Layanan pendaftaran akun dan akses Portal Wali Santri saat ini sedang dinonaktifkan oleh Administrator Pusat. Silakan hubungi pengurus pesantren atau cabang terkait untuk informasi lebih lanjut.
              </p>
            </div>
            <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Kembali ke Beranda
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Login Internal
              </button>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          &copy; {new Date().getFullYear()} eSantri PP Sulaimaniyah. Hak Cipta Dilindungi.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-200">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Portal Wali Santri</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  eSantri
                </span>
              </div>
              <p className="text-xs text-slate-400">Pusdatin PP Sulaimaniyah</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-700 px-3 py-2 rounded-xl transition-colors"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 my-auto">
        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative max-w-xs mx-auto">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-slate-200 -z-0"></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-emerald-600 -z-0 transition-all duration-500"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            ></div>

            {/* Step 1 Node */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step >= 1
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                    : 'bg-white text-slate-400 border border-slate-300'
                }`}
              >
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-[11px] font-bold text-slate-600">Verifikasi Santri</span>
            </div>

            {/* Step 2 Node */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step >= 2
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                    : 'bg-white text-slate-400 border border-slate-300'
                }`}
              >
                {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-[11px] font-bold text-slate-600">Buat Akun</span>
            </div>

            {/* Step 3 Node */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === 3
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                    : 'bg-white text-slate-400 border border-slate-300'
                }`}
              >
                3
              </div>
              <span className="text-[11px] font-bold text-slate-600">Selesai</span>
            </div>
          </div>
        </div>

        {/* ── STEP 1: VERIFIKASI DATA SANTRI ── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center max-w-md mx-auto mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <UserCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verifikasi Data Santri</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Masukkan NIK dan Tanggal Lahir putra/putri Anda yang terdaftar di pesantren untuk memulai pembuatan akun wali santri.
              </p>
            </div>

            {verifyError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">{verifyError}</div>
              </div>
            )}

            <form onSubmit={handleVerifyStudent} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  NIK Santri (16 Digit) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={studentNik}
                    onChange={(e) => setStudentNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 3201234567890001"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Nomor Induk Kependudukan santri sesuai Kartu Keluarga (KK) yang didaftarkan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Tanggal Lahir Santri <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={studentBirthDate}
                    onChange={(e) => setStudentBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Memverifikasi Data...
                    </>
                  ) : (
                    <>
                      Lanjutkan Verifikasi <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 2: FORM DATA WALI SANTRI ── */}
        {step === 2 && verifiedStudent && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Student Match Card */}
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                      Santri Terverifikasi
                    </span>
                  </div>
                  <h2 className="font-bold text-base text-slate-900 mt-1">{verifiedStudent.fullName}</h2>
                  <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                    <span>{verifiedStudent.cabangName}</span>
                    <span>•</span>
                    <span>Kelas: {verifiedStudent.kelasName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline shrink-0 mt-1"
              >
                Ganti Santri
              </button>
            </div>

            <div className="text-center max-w-md mx-auto mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Lengkapi Data Wali Santri
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Akun ini akan digunakan untuk memantau absensi, rapor, dan CCTV santri di portal.
              </p>
            </div>

            {submitError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">{submitError}</div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nama Lengkap Wali <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={namaWalsan}
                    onChange={(e) => setNamaWalsan(e.target.value)}
                    placeholder="Nama Lengkap Orang Tua / Wali"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Hubungan dengan Santri <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={hubungan}
                    onChange={(e) => setHubungan(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all cursor-pointer"
                  >
                    <option value="Ayah">Ayah Kandung</option>
                    <option value="Ibu">Ibu Kandung</option>
                    <option value="Wali">Wali</option>
                    <option value="Kakek/Nenek">Kakek / Nenek</option>
                    <option value="Paman/Bibi">Paman / Bibi</option>
                    <option value="Saudara">Kakak / Saudara</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    NIK Wali Santri <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nikWalsan}
                    onChange={(e) => setNikWalsan(e.target.value.replace(/\D/g, ''))}
                    placeholder="16 digit NIK Wali"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    No. WhatsApp / HP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  />
                </div>
              </div>

              {/* Username with realtime validator */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Username Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    placeholder="Contoh: walsan_ahmad"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 transition-all ${
                      usernameStatus
                        ? usernameStatus.available
                          ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-600/10'
                          : 'border-rose-500 focus:border-rose-600 focus:ring-rose-600/10'
                        : 'border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/10'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isCheckingUsername && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    {!isCheckingUsername && usernameStatus && (
                      usernameStatus.available ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )
                    )}
                  </div>
                </div>

                {/* Validation message feedback */}
                {usernameStatus && (
                  <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${
                    usernameStatus.available ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Hanya boleh menggunakan huruf kecil, angka, titik, atau garis bawah (_).
                </p>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Konfirmasi Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (usernameStatus && !usernameStatus.available)}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Mendaftarkan Akun...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" /> Selesaikan Pendaftaran
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 3: SUKSES & MENUNGGU APPROVAL ── */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 mb-3">
              Status: Menunggu Persetujuan (Pending)
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pendaftaran Berhasil Dikirim!
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-md mx-auto leading-relaxed">
              Akun wali santri Anda telah berhasil didaftarkan. Untuk menjaga keamanan data santri, akun Anda akan diverifikasi dan disetujui terlebih dahulu oleh pihak <strong>Cabang {verifiedStudent?.cabangName}</strong> atau <strong>Admin Pusat</strong>.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Santri Terkait:</span>
                <span className="font-bold text-slate-800">{verifiedStudent?.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Username Akun:</span>
                <span className="font-mono font-bold text-slate-800">{username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Wali / Hubungan:</span>
                <span className="font-bold text-slate-800">{namaWalsan} ({hubungan})</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-md"
              >
                Ke Halaman Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        © {new Date().getFullYear()} PP Sulaimaniyah • Pusdatin eSantri
      </footer>
    </div>
  );
}
