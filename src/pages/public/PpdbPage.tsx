import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Building,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Coins,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  HeartHandshake,
  School,
  Award,
  Users,
  Search,
  Check,
  Info,
  MapPin,
} from 'lucide-react';
import {
  ppdbService,
  DEFAULT_PPDB_CONFIG,
  PpdbFullConfig,
} from '../../services/ppdb.service';

export default function PpdbPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PpdbFullConfig>(DEFAULT_PPDB_CONFIG);
  const [loading, setLoading] = useState(true);
  const [selectedTimelineTrack, setSelectedTimelineTrack] = useState<
    'wusthaPutra' | 'ulyaPutra' | 'wusthaPutri'
  >('wusthaPutra');
  const [selectedSyaratTab, setSelectedSyaratTab] = useState<'wustha' | 'ulya'>('wustha');
  const [kontakSearch, setKontakSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch config
    ppdbService.getPublic().then((res) => {
      if (res) setConfig(res);
      setLoading(false);
    });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const {
    tahunAjaran,
    semboyan,
    portalUrl,
    websiteResmi,
    data: {
      jenjangPendidikan,
      programUnggulan,
      fasilitasUnggulan,
      syarat,
      timelinePendidikan,
      alurPendaftaran,
      biaya,
      kontakWilayah,
    },
  } = config;

  const filteredKontak = kontakWilayah.filter((k) =>
    k.wilayah.toLowerCase().includes(kontakSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-sky-200">
      {/* ── NAVIGATION BAR ────────────────────────────────────── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img
              src="https://cdn.aithendi.my.id/assets/logoyts-modern.png"
              alt="Logo eSantri"
              className="h-9 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[#0A192F]">
                eSantri <span className="text-[#0369A1] font-bold text-sm">PSB</span>
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#4A5568]">
            <a href="#jenjang" className="hover:text-[#0369A1] transition-colors">
              Jenjang & Program
            </a>
            <a href="#syarat" className="hover:text-[#0369A1] transition-colors">
              Syarat
            </a>
            <a href="#timeline" className="hover:text-[#0369A1] transition-colors">
              Masa Studi
            </a>
            <a href="#alur" className="hover:text-[#0369A1] transition-colors">
              Alur & Jadwal
            </a>
            <a href="#biaya" className="hover:text-[#0369A1] transition-colors">
              Biaya
            </a>
            <a href="#kontak" className="hover:text-[#0369A1] transition-colors">
              Kontak Wilayah
            </a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/')}
              className="hidden md:inline-flex text-xs font-semibold text-slate-600 hover:text-[#0369A1] px-3 py-2"
            >
              Beranda Utama
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#0369A1] to-[#0A192F] hover:from-[#025682] hover:to-[#081426] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Daftar Online</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-3xl -z-10 translate-x-1/3"></div>
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-3xl -z-10 -translate-x-1/2"></div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Tahun Ajaran Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-[#0369A1] text-xs font-extrabold uppercase tracking-wider mb-6 border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-[#0369A1]" />
            Tahun Ajaran {tahunAjaran}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0A192F] tracking-tight leading-tight mb-4">
            Informasi Penerimaan Santri Baru (PSB)
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-[#0369A1] mb-6">
            YAYASAN TAHFIDZ SULAIMANIYAH
          </p>

          {/* Semboyan Box */}
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-white border border-sky-100 shadow-sm mb-10 text-slate-700 font-medium italic text-sm sm:text-base">
            &ldquo;{semboyan}&rdquo;
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full font-bold text-base sm:text-lg transition-all shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Daftar Sekarang di Portal Resmi</span>
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href="#kontak"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-sky-50 text-[#0A192F] border-2 border-[#0A192F] rounded-full font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5 text-[#0369A1]" />
              <span>Kontak Panitia Wilayah</span>
            </a>
          </div>

          {/* Highlights Mini Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#0369A1] flex items-center justify-center shrink-0 border border-sky-100">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-base text-[#0A192F]">Program Beasiswa</div>
                <div className="text-xs text-slate-500">Pendidikan di Indonesia & Turki</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-base text-[#0A192F]">Metode Utsmani</div>
                <div className="text-xs text-slate-500">Tahfidz Al-Qur&apos;an 30 Juz & Kitab Kuning</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-base text-[#0A192F]">Formal Muadalah</div>
                <div className="text-xs text-slate-500">Ijazah Resmi Diakui Negara</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 1. JENJANG PENDIDIKAN YANG DIBUKA ─────────────────── */}
      <section id="jenjang" className="py-20 px-4 sm:px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider mb-2 block">
              1. Jenjang Pendidikan
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A192F]">
              Jenjang Pendidikan yang Dibuka
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Pilihan jenjang studi terakreditasi dan terintegrasi untuk putra dan putri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Wustha / SMP */}
            <div className="bg-gradient-to-br from-white to-sky-50/50 rounded-3xl p-8 border-2 border-sky-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/50 rounded-full blur-2xl -z-10"></div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0369A1] text-white flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-[#0369A1] border border-sky-200">
                  {jenjangPendidikan.wustha.gender}
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#0A192F] mb-3">
                {jenjangPendidikan.wustha.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {jenjangPendidikan.wustha.description}
              </p>
              <div className="space-y-2.5 pt-4 border-t border-sky-100 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tersedia untuk santri Putra dan santri Putri</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Target lulusan hafal 30 Juz & bekal studi kitab</span>
                </div>
              </div>
            </div>

            {/* Ulya / SMA */}
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 border-2 border-blue-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl -z-10"></div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0A192F] text-white flex items-center justify-center">
                  <School className="w-6 h-6" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {jenjangPendidikan.ulya.gender}
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#0A192F] mb-3">
                {jenjangPendidikan.ulya.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {jenjangPendidikan.ulya.description}
              </p>
              <div className="space-y-2.5 pt-4 border-t border-blue-100 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Program pembinaan intensif khusus Putra</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Persiapan seleksi beasiswa kuliah ke Turki</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PROGRAM & FASILITAS UNGGULAN ──────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider mb-2 block">
              2. Program & Fasilitas
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A192F]">
              Program & Fasilitas Unggulan
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Menunjang santri dalam belajar, menghafal, dan beribadah secara optimal dan nyaman.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Program Unggulan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F]">Program Unggulan</h3>
              </div>
              <ul className="space-y-4">
                {programUnggulan.map((prog, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/60 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-slate-800 text-sm sm:text-base">
                      {prog}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fasilitas Unggulan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0369A1] flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#0A192F]">Fasilitas Unggulan</h3>
              </div>
              <ul className="space-y-4">
                {fasilitasUnggulan.map((fas, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-sky-50/60 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-sky-100 text-[#0369A1] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-700 text-sm sm:text-base font-medium">
                      {fas}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SYARAT PENDAFTARAN ────────────────────────────── */}
      <section id="syarat" className="py-20 px-4 sm:px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider mb-2 block">
              3. Persyaratan
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A192F]">
              Syarat Pendaftaran Calon Santri
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Pastikan calon santri memenuhi kriteria umum dan kriteria khusus jenjang yang dituju.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Persyaratan Umum (Left Column) */}
            <div className="lg:col-span-6 bg-slate-50 rounded-3xl p-8 border border-slate-200/80">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                  A
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0A192F]">A. Persyaratan Umum</h3>
                  <p className="text-xs text-slate-500">Berlaku untuk seluruh pendaftar</p>
                </div>
              </div>
              <ul className="space-y-3.5">
                {syarat.umum.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-sky-200/70 text-[#0369A1] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Persyaratan Khusus (Right Column with Tabs) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-8 border-2 border-sky-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    B
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0A192F]">B. Persyaratan Khusus</h3>
                    <p className="text-xs text-slate-500">Berdasarkan jenjang yang dipilih</p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6">
                  <button
                    onClick={() => setSelectedSyaratTab('wustha')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      selectedSyaratTab === 'wustha'
                        ? 'bg-white text-[#0A192F] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Jenjang Wustha / SMP
                  </button>
                  <button
                    onClick={() => setSelectedSyaratTab('ulya')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      selectedSyaratTab === 'ulya'
                        ? 'bg-white text-[#0A192F] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Jenjang Ulya / SMA
                  </button>
                </div>

                {/* Tab Content */}
                {selectedSyaratTab === 'wustha' ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/60 text-xs font-semibold text-sky-800">
                      {syarat.khusus.wustha.title} — ({syarat.khusus.wustha.targetGender})
                    </div>
                    <ul className="space-y-3">
                      {syarat.khusus.wustha.items.map((it, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs font-semibold text-amber-900">
                      {syarat.khusus.ulya.title} — ({syarat.khusus.ulya.targetGender})
                    </div>
                    <ul className="space-y-3">
                      {syarat.khusus.ulya.items.map((it, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#0369A1] hover:underline"
                >
                  <span>Siapkan berkas dan daftar sekarang</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TIMELINE PENDIDIKAN (MASA STUDI) ──────────────── */}
      <section id="timeline" className="py-20 px-4 sm:px-6 bg-[#0A192F] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00B4D8]/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-[#00B4D8] uppercase tracking-wider mb-2 block">
              4. Masa Studi & Kurikulum
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Timeline Pendidikan Santri
            </h2>
            <p className="text-slate-300 mt-3 text-sm sm:text-base">
              Alur penahapan terstruktur dari masa persiapan (Pra-Tahfidz), tahfidz 30 juz, hingga studi kitab dan pengabdian.
            </p>
          </div>

          {/* Track Switcher */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedTimelineTrack('wusthaPutra')}
              className={`px-5 py-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedTimelineTrack === 'wusthaPutra'
                  ? 'bg-[#00B4D8] text-[#0A192F] shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Jenjang Wustha/SMP - Putra (6 Tahun)
            </button>
            <button
              onClick={() => setSelectedTimelineTrack('ulyaPutra')}
              className={`px-5 py-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedTimelineTrack === 'ulyaPutra'
                  ? 'bg-[#00B4D8] text-[#0A192F] shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Jenjang Ulya/SMA - Putra (5 Tahun)
            </button>
            <button
              onClick={() => setSelectedTimelineTrack('wusthaPutri')}
              className={`px-5 py-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedTimelineTrack === 'wusthaPutri'
                  ? 'bg-[#00B4D8] text-[#0A192F] shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Jenjang Wustha/SMP - Putri (6 Tahun)
            </button>
          </div>

          {/* Stepper Timeline List */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {timelinePendidikan[selectedTimelineTrack].title}
                </h3>
                <span className="px-4 py-1.5 rounded-full bg-[#00B4D8]/20 text-[#00B4D8] text-xs font-bold border border-[#00B4D8]/40">
                  {timelinePendidikan[selectedTimelineTrack].totalTahun}
                </span>
              </div>

              <div className="space-y-6">
                {timelinePendidikan[selectedTimelineTrack].steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00B4D8]/50 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#00B4D8] text-[#0A192F] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#00B4D8] uppercase tracking-wider mb-1">
                          {step.periode}
                        </div>
                        <div className="text-base sm:text-lg font-bold text-white">
                          {step.target}
                        </div>
                      </div>
                    </div>
                    <div className="px-3.5 py-1 rounded-xl bg-white/10 text-slate-200 text-xs font-semibold shrink-0">
                      Durasi: {step.durasi}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. ALUR & JADWAL PENDAFTARAN ─────────────────────── */}
      <section id="alur" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider mb-2 block">
              5. Tahapan Seleksi
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A192F]">
              Alur & Jadwal Pendaftaran
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Catat tanggal penting dan tahapan seleksi penerimaan santri baru.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {alurPendaftaran.map((alur) => (
              <div
                key={alur.no}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0A192F] text-white font-black text-lg flex items-center justify-center shrink-0">
                    {alur.no}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0A192F]">{alur.tahapan}</h3>
                    {alur.catatan && (
                      <p className="text-xs text-slate-500 mt-0.5">{alur.catatan}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-100/70 border border-sky-200 text-[#0369A1] text-sm font-bold shrink-0 self-stretch md:self-auto justify-center">
                  <Calendar className="w-4 h-4" />
                  <span>{alur.jadwal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. INFORMASI BIAYA (INFAQ & SPP) ─────────────────── */}
      <section id="biaya" className="py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider mb-2 block">
              6. Biaya Pendidikan
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A192F]">
              Rincian Biaya & Infaq Masuk
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Transparansi pembiayaan santri baru wilayah JADETABEK dan LUAR JADETABEK.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-[#0A192F] text-white p-4 sm:p-5 font-bold text-xs sm:text-sm">
              <div className="col-span-6 sm:col-span-6">Rincian Biaya</div>
              <div className="col-span-3 sm:col-span-3 text-right">JADETABEK</div>
              <div className="col-span-3 sm:col-span-3 text-right">LUAR JADETABEK</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100">
              {biaya.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 p-4 sm:p-5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="col-span-6 sm:col-span-6 font-semibold text-slate-900">
                    {item.nama}
                  </div>
                  <div className="col-span-3 sm:col-span-3 text-right font-medium text-slate-700">
                    Rp {item.jadetabek.toLocaleString('id-ID')}
                  </div>
                  <div className="col-span-3 sm:col-span-3 text-right font-medium text-slate-700">
                    Rp {item.luarJadetabek.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}

              {/* TOTAL ROW */}
              <div className="grid grid-cols-12 p-4 sm:p-5 text-sm sm:text-base font-black bg-sky-50/80 text-[#0A192F]">
                <div className="col-span-6 sm:col-span-6 uppercase">TOTAL INFAQ MASUK</div>
                <div className="col-span-3 sm:col-span-3 text-right text-[#0369A1]">
                  Rp {biaya.total.jadetabek.toLocaleString('id-ID')}
                </div>
                <div className="col-span-3 sm:col-span-3 text-right text-[#0369A1]">
                  Rp {biaya.total.luarJadetabek.toLocaleString('id-ID')}
                </div>
              </div>

              {/* SPP ROW */}
              <div className="grid grid-cols-12 p-4 sm:p-5 text-xs sm:text-sm font-bold bg-emerald-50/80 text-emerald-900">
                <div className="col-span-6 sm:col-span-6">SPP (Bulanan)</div>
                <div className="col-span-3 sm:col-span-3 text-right">
                  Rp {biaya.sppBulanan.jadetabek.toLocaleString('id-ID')}
                </div>
                <div className="col-span-3 sm:col-span-3 text-right">
                  Rp {biaya.sppBulanan.luarJadetabek.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. KONTAK WILAYAH & WHATSAPP DIRECT ───────────────── */}
      <section id="kontak" className="py-20 px-4 sm:px-6 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider mb-2 block">
              7. Layanan Informasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0A192F]">
              Kontak Panitia Pendaftaran Wilayah
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Hubungi panitia penerimaan santri baru sesuai domisili Anda untuk konsultasi & informasi lebih lanjut.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-md mx-auto mb-10 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari wilayah Anda (contoh: Jakarta, Banten, Jawa Timur)..."
              value={kontakSearch}
              onChange={(e) => setKontakSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1] focus:bg-white transition-all shadow-sm"
            />
          </div>

          {/* Kontak Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredKontak.map((k, idx) => (
              <div
                key={idx}
                className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-[#0369A1]" />
                    <h3 className="font-extrabold text-base text-[#0A192F] group-hover:text-[#0369A1] transition-colors">
                      {k.wilayah}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Kontak Putra */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Kontak Putra
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">
                          {k.kontakPutra || '—'}
                        </span>
                        {k.waPutra && (
                          <a
                            href={`https://wa.me/${k.waPutra}?text=Assalamu%27alaikum%20Panitia%20PSB%20Wilayah%20${encodeURIComponent(
                              k.wilayah
                            )}%2C%20saya%20ingin%20bertanya%20informasi%20PSB%20Santri%20Putra.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Kontak Putri */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Kontak Putri
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">
                          {k.kontakPutri || '—'}
                        </span>
                        {k.waPutri && k.kontakPutri !== '—' && (
                          <a
                            href={`https://wa.me/${k.waPutri}?text=Assalamu%27alaikum%20Panitia%20PSB%20Wilayah%20${encodeURIComponent(
                              k.wilayah
                            )}%2C%20saya%20ingin%20bertanya%20informasi%20PSB%20Santri%20Putri.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM STICKY CALL TO ACTION ─────────────────────── */}
      <div className="sticky bottom-0 z-40 bg-[#0A192F]/95 backdrop-blur-md border-t border-[#1E3A5F] py-3.5 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Sparkles className="w-5 h-5 text-[#00B4D8] shrink-0 hidden sm:block" />
            <div>
              <span className="font-extrabold text-sm sm:text-base text-white">
                Penerimaan Santri Baru ({tahunAjaran}) Telah Dibuka
              </span>
              <span className="hidden md:inline text-xs text-slate-300 ml-2">
                — Kuota terbatas di setiap cabang
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#00B4D8] hover:bg-[#0096b4] text-[#0A192F] font-black text-xs sm:text-sm rounded-full transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Daftar Online Sekarang</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#060D1A] text-slate-400 py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://cdn.aithendi.my.id/assets/logoyts-modern.png"
                alt="Logo eSantri"
                className="h-8 w-auto object-contain brightness-110"
              />
              <span className="font-bold text-white tracking-tight text-lg">
                eSantri PSB
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Yayasan Tahfidz Sulaimaniyah. Mendidik generasi penghafal Al-Qur&apos;an yang bertafaqquh fiddin dan mengabdi untuk negeri.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Akses Cepat PSB</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#00B4D8] text-sky-400 font-semibold transition-colors">
                  Portal Pendaftaran Online ↗
                </a>
              </li>
              <li>
                <a href="#syarat" className="hover:text-[#00B4D8] transition-colors">
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="#biaya" className="hover:text-[#00B4D8] transition-colors">
                  Rincian Biaya
                </a>
              </li>
              <li>
                <a href="#kontak" className="hover:text-[#00B4D8] transition-colors">
                  Kontak Panitia Wilayah
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Website Resmi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`https://${websiteResmi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#00B4D8] transition-colors"
                >
                  {websiteResmi}
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-[#00B4D8] transition-colors text-left"
                >
                  Portal Informasi eSantri
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Pusat Bantuan</h4>
            <ul className="space-y-2 text-sm">
              <li>Yayasan Tahfidz Sulaimaniyah</li>
              <li>info@sulaimaniyah.sch.id / 0813-1415-1420</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Yayasan Tahfidz Sulaimaniyah. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button onClick={() => navigate('/')} className="hover:text-slate-300 transition-colors">
              Beranda eSantri
            </button>
            <button onClick={() => navigate('/login')} className="hover:text-slate-300 transition-colors">
              Login Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
