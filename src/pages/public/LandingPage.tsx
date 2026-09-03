import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import {
  ShieldCheck, Zap, Users, GraduationCap, BarChart, CheckCircle,
  ChevronRight, LayoutDashboard, Calendar, FileText, HeartHandshake,
  Lock, Server, Cpu, Layers, Globe, Award, FileCheck2, HardDrive, KeyRound, Fingerprint, Shield, ExternalLink
} from 'lucide-react';

// ============================================================
// COLOR PALETTE — The Royal Trust
// Primary BG Dark  : #0A192F (Deep Navy Blue)
// Primary BG Light : #FFFFFF (Pure White) / #F8FAFC (slate-50)
// Accent           : #00B4D8 (Teal/Cyan)  — only on dark backgrounds
// Accent Light     : #0369A1 (Dark Cyan)  — only on light/white backgrounds
// Text Secondary   : #4A5568 (Slate Gray)
// ============================================================

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const { data: moduleSettings } = useQuery({
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-sky-200">

      {/* ── NAVIGATION ────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/90 backdrop-blur-lg border-b border-slate-200 py-3 shadow-sm'
        : 'bg-transparent py-5'
        }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img
              src="https://cdn.aithendi.my.id/assets/logoyts-modern.png"
              alt="Logo eSantri"
              className="h-9 w-auto object-contain"
            />
            <span className="font-bold text-xl tracking-tight text-[#0A192F]">eSantri</span>
          </div>

          {/* Nav Links — latar terang, teks slate, hover biru tua */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A5568]">
            <a href="#beranda" className="hover:text-[#0369A1] transition-colors">Beranda</a>
            <a href="#fitur" className="hover:text-[#0369A1] transition-colors">Fitur Utama</a>
            <a href="#keamanan" className="hover:text-[#0369A1] transition-colors">Keamanan & Standar</a>
            <a href="#manfaat" className="hover:text-[#0369A1] transition-colors">Manfaat</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://peveri.sulaimaniyah.sch.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-full transition-all border border-amber-200/80 shadow-2xs group cursor-pointer"
              title="Penerbitan dan Verifikasi Ijazah PP Sulaimaniyah"
            >
              <Award className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Peveri (Ijazah)</span>
              <ExternalLink className="w-3 h-3 text-amber-600 opacity-75" />
            </a>
            <button
              onClick={() => navigate('/ppdb')}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-full transition-colors border border-sky-200 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-sky-600" />
              Info PPDB
            </button>
            {isPortalEnabled && (
              <button
                onClick={() => navigate('/portal-register')}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors border border-emerald-200/80 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                Portal Walsan
              </button>
            )}
            <button
              onClick={() => navigate('/daftar-ulang')}
              className="hidden sm:block text-sm font-semibold text-[#4A5568] hover:text-[#0369A1] transition-colors cursor-pointer"
            >
              Daftar Ulang
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#0A192F] hover:bg-[#132F52] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Masuk <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ──────────────────────────────────── */}
      {/* Latar: Putih, Teks: Navy, Aksen: #0369A1 (biru gelap) */}
      <section id="beranda" className="pt-32 pb-20 px-6 relative overflow-hidden bg-white">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-sky-50 to-transparent -z-10"></div>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-sky-100/60 rounded-full blur-3xl -z-10 translate-x-1/3"></div>
        <div className="absolute top-40 left-0 w-[350px] h-[350px] bg-blue-100/60 rounded-full blur-3xl -z-10 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0369A1] text-xs font-bold uppercase tracking-wider mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0369A1]"></span>
            </span>
            Platform Manajemen Pesantren Resmi
          </div>

          {/* Heading — Navy bold, aksen biru gelap pada light bg */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#0A192F] tracking-tight leading-[1.1] max-w-4xl mb-6">
            Manajemen Data Santri Berbasis{' '}
            <span className="text-[#0369A1]">Web Online</span>
          </h1>

          {/* Subtitle — Slate Gray #4A5568 */}
          <p className="text-lg md:text-xl text-[#4A5568] max-w-2xl mb-10 leading-relaxed">
            eSantri PP Sulaimaniyah membantu modernisasi data santri, absensi, dan administrasi akademik secara terpusat untuk efisiensi operasional harian.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap justify-center">
            <a
              href="https://peveri.sulaimaniyah.sch.id"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-full font-bold text-base sm:text-lg transition-all shadow-xl hover:scale-105 flex items-center gap-2.5 group cursor-pointer"
              title="Penerbitan dan Verifikasi Ijazah Resmi PP Sulaimaniyah"
            >
              <Award className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
              <span>Peveri (Ijazah)</span>
              <ExternalLink className="w-4 h-4 text-amber-200 opacity-80" />
            </a>
            <button
              onClick={() => navigate('/ppdb')}
              className="px-7 py-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-full font-bold text-base sm:text-lg transition-all shadow-xl hover:scale-105 flex items-center gap-2.5 cursor-pointer"
            >
              <GraduationCap className="w-5 h-5" />
              Info Lengkap PPDB
            </button>
            {isPortalEnabled && (
              <button
                onClick={() => navigate('/portal-register')}
                className="px-7 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-full font-bold text-base sm:text-lg transition-all shadow-xl hover:scale-105 flex items-center gap-2.5 cursor-pointer"
              >
                <HeartHandshake className="w-5 h-5" />
                Portal Wali Santri
              </button>
            )}
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-4 bg-[#0A192F] hover:bg-[#132F52] text-white rounded-full font-bold text-base sm:text-lg transition-all shadow-xl hover:scale-105 cursor-pointer"
            >
              Login Dashboard
            </button>
            <button
              onClick={() => navigate('/daftar-ulang')}
              className="px-7 py-4 bg-white hover:bg-sky-50 text-[#0A192F] border-2 border-[#0A192F] rounded-full font-bold text-base sm:text-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              Daftar Ulang Santri
            </button>
          </div>

          {/* ── Hero Stats Cards ── */}
          <div className="mt-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 — white bg, icon dark cyan */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center md:-translate-y-4">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#0369A1]" />
              </div>
              <h3 className="text-3xl font-extrabold text-[#0A192F] mb-1">5.000+</h3>
              <p className="text-sm font-medium text-[#4A5568]">Santri Aktif & Terdata</p>
            </div>

            {/* Card 2 — Navy bg (dark), teks putih, aksen cyan terang */}
            <div className="bg-[#0A192F] p-8 rounded-3xl shadow-2xl border border-[#1E3A5F] flex flex-col justify-center text-white relative overflow-hidden h-64 md:h-auto z-10 md:scale-110">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B4D8]/20 blur-2xl rounded-full"></div>
              <h3 className="text-xl font-bold mb-4">Total Cabang</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black">100+</span>
                {/* Aksen #00B4D8 hanya di atas bg gelap — BENAR */}
                <span className="text-[#00B4D8] font-medium pb-1">Mitra</span>
              </div>
              <p className="text-slate-400 text-sm">Terintegrasi dalam satu sistem komprehensif.</p>
            </div>

            {/* Card 3 — white bg */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center md:-translate-y-4">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-[#0369A1]" />
              </div>
              <h3 className="text-3xl font-extrabold text-[#0A192F] mb-1">99.9%</h3>
              <p className="text-sm font-medium text-[#4A5568]">Akurasi & Keamanan Data</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────── */}
      {/* Latar: Navy #0A192F (GELAP), Teks: Putih, Aksen: #00B4D8 (cyan terang) */}
      <section id="fitur" className="py-24 bg-[#0A192F] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Layanan Manajemen Terintegrasi & Efisien
            </h2>
            {/* Subtitle di atas latar gelap — gunakan warna terang */}
            <p className="text-slate-300 text-lg">
              Sistem informasi yang dirancang khusus untuk kebutuhan pesantren modern, memastikan kualitas data dan operasional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Data Santri Terpusat', desc: 'Kelola seluruh informasi biodata, riwayat pendidikan, dan domisili dalam satu database.' },
              { icon: GraduationCap, title: 'Manajemen Akademik', desc: 'Pemetaan rombel, muadalah, dan penilaian raport secara sistematis dan mudah.' },
              { icon: CheckCircle, title: 'Absensi Real-time', desc: 'Monitoring kehadiran santri harian terintegrasi untuk keamanan dan kedisiplinan.' },
              { icon: ShieldCheck, title: 'Keamanan Tingkat Tinggi', desc: 'Infrastruktur cloud aman dengan enkripsi data dan pembatasan akses berlapis.' },
              { icon: LayoutDashboard, title: 'Dashboard Eksekutif', desc: 'Visualisasi data statistik untuk pimpinan dalam mengambil keputusan strategis.' },
              { icon: FileText, title: 'Portal Daftar Ulang', desc: 'Fasilitas publik untuk verifikasi identitas santri lama secara mandiri.' },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors cursor-pointer group">
                {/* Ikon #00B4D8 — kontras tinggi di atas bg gelap */}
                <f.icon className="w-8 h-8 text-[#00B4D8] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                {/* Teks deskripsi — slate-400 di atas bg gelap masih terbaca */}
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY & BEST PRACTICES SECTION ─────────────────── */}
      {/* Standar & Praktik Keamanan Terkini */}
      <section id="keamanan" className="py-24 bg-slate-50 border-y border-slate-200/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 text-[#0369A1] text-xs font-bold uppercase tracking-wider mb-4 border border-sky-200">
              <Shield className="w-3.5 h-3.5" />
              Security Architecture & Best Practices
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0A192F] mb-6 tracking-tight">
              Selaras dengan Standar Keamanan Global
            </h2>
            <p className="text-[#4A5568] text-lg leading-relaxed">
              Infrastruktur eSantri dirancang dengan arsitektur *Defense-in-Depth* berbasis RHEL + Podman Rootless + Quadlet + Cloudflare Zero-Trust, dengan kontrol keamanan yang dipetakan terhadap prinsip-prinsip framework keamanan informasi yang relevan.
            </p>
          </div>

          {/* Grid 5 Standar Keamanan */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* 1. CIS-Inspired Hardening */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 hover:shadow-xl hover:border-sky-300 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0369A1] flex items-center justify-center font-black group-hover:scale-110 transition-transform border border-sky-100">
                    <Server className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Prinsip CIS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-2">1. CIS-Inspired Hardening</h3>
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-4">Container Hardening Principles</p>
                <ul className="space-y-2.5 text-sm text-[#4A5568]">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Non-Root Daemonless:</strong> Kontainer berjalan tanpa root daemon pada host OS.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Read-Only Volume (`:ro,Z`):</strong> Membatasi container agar tidak dapat menulis ke mount aplikasi dan mengurangi risiko modifikasi file.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Zero Clear-Text Secrets:</strong> Kredensial dipisahkan secara native di luar repositori source code.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. NIST SP 800-190 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 hover:shadow-xl hover:border-sky-300 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform border border-emerald-100">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Panduan NIST
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-2">2. NIST SP 800-190</h3>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-4">Application Container Security Guide</p>
                <ul className="space-y-2.5 text-sm text-[#4A5568]">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Breakout Mitigation:</strong> Isolasi User Namespace membatasi akses kernel host.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Least Privilege:</strong> Izin berkas konfigurasi dikunci ketat (`chmod 600 / 700`).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>SELinux Enforced:</strong> Pelabelan konteks keamanan kontainer secara ketat dan terisolasi.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. ISO/IEC 27001:2022 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 hover:shadow-xl hover:border-sky-300 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform border border-indigo-100">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Selaras ISO 27001
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-2">3. ISO/IEC 27001:2022</h3>
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-4">Information Security Controls</p>
                <ul className="space-y-2.5 text-sm text-[#4A5568]">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>A.8.20 & A.8.21 Network Security:</strong> Zero Open Ports melalui Cloudflare Zero-Trust Tunnel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>A.8.24 Cryptography:</strong> Perlindungan data in-transit dan at-rest melalui TLS dan enkripsi storage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>A.5.15 Access Control:</strong> Hak akses otentikasi berjenjang berbasis peran (RBAC).</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. OWASP Top 10 & Container Security */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 hover:shadow-xl hover:border-sky-300 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform border border-amber-100">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Praktik OWASP
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-2">4. OWASP Security Guidelines</h3>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-4">Web & Container Security Cheat Sheet</p>
                <ul className="space-y-2.5 text-sm text-[#4A5568]">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Anti-LFI & Path Traversal:</strong> Segregasi `.secret` menghapus risiko eksposur berkas konfigurasi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Container Hardening:</strong> Docker daemon socket `/var/run/docker.sock` tidak diekspos ke kontainer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>A01 Broken Access Control:</strong> Proteksi JWT token pada berkas media & dokumen privasi santri.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 5. SOC 2 Trust Principles */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 hover:shadow-xl hover:border-sky-300 transition-all group flex flex-col justify-between md:col-span-2 lg:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black group-hover:scale-110 transition-transform border border-purple-100">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Prinsip SOC 2
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0A192F] mb-2">5. SOC 2 Trust Principles (Security & Confidentiality)</h3>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-4">Pemetaan Terhadap Kriteria CC6.1 & CC6.3</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#4A5568]">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Defense-in-Depth:</strong> Perlindungan bertingkat dari WAF Perimeter, Network Bridge, Compute, hingga Storage.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Perimeter Isolation:</strong> Akses database PostgreSQL dan MinIO terisolasi hanya pada network privat `global_net`.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>IAM & Tokenized Storage:</strong> Validasi ketat otentikasi token pada streaming passfoto dan dokumen santri.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Systemd Quadlet Monitoring:</strong> Health check periodik 30 detik untuk *self-healing* kontainer otomatis.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Defense-in-Depth Visual Architecture Banner */}
          <div className="bg-gradient-to-r from-[#0A192F] via-[#132F52] to-[#0A192F] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00B4D8]/15 blur-3xl rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <span className="text-[#00B4D8] font-bold text-xs uppercase tracking-widest block mb-2">Architectural Summary</span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                  Infrastruktur Aman, Cepat, dan Selaras Standar Global
                </h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Data santri, wali santri, dan administrasi pesantren dilindungi oleh arsitektur sistem keamanan bertaraf korporasi tanpa kompromi performa.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00B4D8]" /> Prinsip CIS
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" /> Cloudflare Zero-Trust
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" /> Podman Rootless
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" /> MinIO S3 Encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS SECTION ──────────────────────────────── */}
      {/* Latar: Putih, Teks: Navy, Aksen: #0369A1 */}
      <section id="manfaat" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          {/* Mockup UI */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute inset-0 bg-sky-50 rounded-[3rem] transform -rotate-3 scale-105 z-0"></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 relative z-10">
              {/* Window chrome dots */}
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-sky-400"></div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-1/3 h-6 bg-slate-200 rounded-md"></div>
                  <div className="w-1/4 h-8 bg-sky-100 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
                        <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
                      </div>
                      <div className="w-16 h-6 bg-sky-50 border border-sky-200 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Chart Widget */}
              <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 w-64">
                <h4 className="font-bold text-[#0A192F] mb-4">Statistik Kehadiran</h4>
                <div className="flex items-end gap-2 h-24">
                  <div className="w-1/4 bg-sky-100 rounded-t-lg h-[40%]"></div>
                  <div className="w-1/4 bg-[#0369A1] rounded-t-lg h-[70%]"></div>
                  <div className="w-1/4 bg-[#0A192F] rounded-t-lg h-[100%]"></div>
                  <div className="w-1/4 bg-slate-200 rounded-t-lg h-[30%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0A192F] mb-6 leading-tight">
              Manfaat Utama Sistem Kami untuk Efisiensi Anda
            </h2>
            <p className="text-[#4A5568] text-lg mb-10">
              Mengakselerasi kinerja operasional pengurus dengan akses data yang cepat, akurat, dan terstruktur.
            </p>

            <div className="space-y-8">
              {[
                { title: 'Monitoring Identitas Terpusat', desc: 'Pantau kuantitas dan sebaran santri dari pusat hingga ke cabang secara realtime.' },
                { title: 'Optimalisasi Proses Akademik', desc: 'Kurangi beban administratif — dari kalender akademik hingga penerbitan rapor.' },
                { title: 'Infrastruktur Berbasis Cloud', desc: 'Akses dari mana saja dengan jaminan ketersediaan data (uptime) 99.9%.' },
              ].map((b, i) => (
                <div key={i} className="flex gap-4">
                  {/* Icon wrapper: sky-50 bg, ikon #0369A1 — kontras cukup di atas putih */}
                  <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#0369A1]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#0A192F] mb-1">{b.title}</h4>
                    <p className="text-[#4A5568] leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────── */}
      {/* Latar: Navy, Teks: Putih, Aksen: #00B4D8 */}
      <section className="py-24 bg-[#0A192F] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Digitalisasi Pesantren dalam Genggaman
          </h2>
          {/* Subtitle di atas navy: slate-300 cukup terbaca */}
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Segera manfaatkan teknologi untuk mereduksi birokrasi dan meningkatkan produktivitas. Akses eSantri sekarang juga!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <a
              href="https://peveri.sulaimaniyah.sch.id"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-full transition-all shadow-xl flex items-center gap-2 cursor-pointer"
              title="Penerbitan dan Verifikasi Ijazah Resmi PP Sulaimaniyah"
            >
              <Award className="w-5 h-5 text-amber-200" />
              Peveri (Ijazah)
              <ExternalLink className="w-4 h-4 text-amber-200" />
            </a>
            <button
              onClick={() => navigate('/ppdb')}
              className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-full transition-all shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-5 h-5" />
              Info Lengkap PPDB
            </button>
            <a
              href="https://pendaftaran.tahfidzsulaimaniyah.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-5 h-5" />
              Daftar Online PPDB
            </a>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-[#0A192F] font-bold rounded-full hover:bg-sky-50 transition-colors shadow-xl cursor-pointer"
            >
              Menuju Dashboard Internal
            </button>
            <button
              onClick={() => navigate('/daftar-ulang')}
              className="px-8 py-4 border-2 border-[#00B4D8] text-[#00B4D8] font-bold rounded-full hover:bg-[#00B4D8]/10 transition-colors cursor-pointer"
            >
              Daftar Ulang Santri
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      {/* Latar: Navy lebih gelap, Teks: slate-400/300, Hover: #00B4D8 */}
      <footer className="bg-[#060D1A] text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://cdn.aithendi.my.id/assets/logoyts-modern.png"
                alt="Logo eSantri"
                className="h-8 w-auto object-contain brightness-110"
              />
              <span className="font-bold text-white tracking-tight text-lg">eSantri</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sistem Informasi Manajemen Pesantren untuk PP Sulaimaniyah. Tercepat, teraman, dan terpercaya.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Akses Cepat</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://peveri.sulaimaniyah.sch.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#00B4D8] transition-colors inline-flex items-center gap-1 text-amber-400 font-semibold"
                >
                  Peveri (Verifikasi Ijazah) <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate('/ppdb')}
                  className="hover:text-[#00B4D8] transition-colors inline-flex items-center gap-1 text-sky-400 font-semibold cursor-pointer"
                >
                  Informasi PPDB 2027–2028 <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
              </li>
              <li>
                <a
                  href="https://pendaftaran.tahfidzsulaimaniyah.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#00B4D8] transition-colors inline-flex items-center gap-1 text-emerald-400 font-semibold"
                >
                  Portal Pendaftaran PPDB <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </li>
              <li><a href="#beranda" className="hover:text-[#00B4D8] transition-colors">Beranda</a></li>
              <li><a href="#fitur" className="hover:text-[#00B4D8] transition-colors">Fitur Utama</a></li>
              <li><a href="#keamanan" className="hover:text-[#00B4D8] transition-colors">Keamanan & Standar</a></li>
              <li><a href="#manfaat" className="hover:text-[#00B4D8] transition-colors">Manfaat</a></li>
              <li><button onClick={() => navigate('/daftar-ulang')} className="hover:text-[#00B4D8] transition-colors text-left">Daftar Ulang Santri</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Modul Sistem</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-[#00B4D8] transition-colors cursor-default">Manajemen Santri</li>
              <li className="hover:text-[#00B4D8] transition-colors cursor-default">Absensi & Jurnal</li>
              <li className="hover:text-[#00B4D8] transition-colors cursor-default">Kepegawaian (HRD)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Hubungi Kami</h4>
            <ul className="space-y-2 text-sm">
              <li>CS PP Sulaimaniyah</li>
              <li>info@sulaimaniyah.sch.id / 0813-1415-1420 </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} eSantri PP Sulaimaniyah. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-300 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
