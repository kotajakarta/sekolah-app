import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ShieldCheck, Zap, Users, GraduationCap, BarChart, CheckCircle, ChevronRight, LayoutDashboard, Calendar, FileText } from 'lucide-react';

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
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-lg border-b border-slate-200 py-3 shadow-sm'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-8 h-8 bg-[#0A192F] rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#0A192F]">eSantri</span>
          </div>

          {/* Nav Links — latar terang, teks slate, hover biru tua */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A5568]">
            <a href="#beranda" className="hover:text-[#0369A1] transition-colors">Beranda</a>
            <a href="#fitur"   className="hover:text-[#0369A1] transition-colors">Fitur Utama</a>
            <a href="#manfaat" className="hover:text-[#0369A1] transition-colors">Manfaat</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/daftar-ulang')}
              className="hidden sm:block text-sm font-semibold text-[#4A5568] hover:text-[#0369A1] transition-colors"
            >
              Daftar Ulang
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#0A192F] hover:bg-[#132F52] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg flex items-center gap-2"
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
            Masa Depan Manajemen dengan{' '}
            <span className="text-[#0369A1]">Teknologi Terkini</span>
          </h1>

          {/* Subtitle — Slate Gray #4A5568 */}
          <p className="text-lg md:text-xl text-[#4A5568] max-w-2xl mb-10 leading-relaxed">
            eSantri PP Sulaimaniyah membantu modernisasi data santri, absensi, dan administrasi akademik secara terpusat untuk efisiensi operasional harian.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-[#0A192F] hover:bg-[#132F52] text-white rounded-full font-bold text-lg transition-all shadow-xl hover:scale-105"
            >
              Login Dashboard
            </button>
            <button
              onClick={() => navigate('/daftar-ulang')}
              className="px-8 py-4 bg-white hover:bg-sky-50 text-[#0A192F] border-2 border-[#0A192F] rounded-full font-bold text-lg transition-all flex items-center gap-2"
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
              <h3 className="text-3xl font-extrabold text-[#0A192F] mb-1">15.000+</h3>
              <p className="text-sm font-medium text-[#4A5568]">Santri Aktif & Terdata</p>
            </div>

            {/* Card 2 — Navy bg (dark), teks putih, aksen cyan terang */}
            <div className="bg-[#0A192F] p-8 rounded-3xl shadow-2xl border border-[#1E3A5F] flex flex-col justify-center text-white relative overflow-hidden h-64 md:h-auto z-10 md:scale-110">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B4D8]/20 blur-2xl rounded-full"></div>
              <h3 className="text-xl font-bold mb-4">Total Cabang</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black">54+</span>
                {/* Aksen #00B4D8 hanya di atas bg gelap — BENAR */}
                <span className="text-[#00B4D8] font-medium pb-1">Wilayah</span>
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
              { icon: Users,         title: 'Data Santri Terpusat',      desc: 'Kelola seluruh informasi biodata, riwayat pendidikan, dan domisili dalam satu database.' },
              { icon: GraduationCap, title: 'Manajemen Akademik',         desc: 'Pemetaan rombel, muadalah, dan penilaian raport secara sistematis dan mudah.' },
              { icon: CheckCircle,   title: 'Absensi Real-time',          desc: 'Monitoring kehadiran santri harian terintegrasi untuk keamanan dan kedisiplinan.' },
              { icon: ShieldCheck,   title: 'Keamanan Tingkat Tinggi',    desc: 'Infrastruktur cloud aman dengan enkripsi data dan pembatasan akses berlapis.' },
              { icon: LayoutDashboard, title: 'Dashboard Eksekutif',      desc: 'Visualisasi data statistik untuk pimpinan dalam mengambil keputusan strategis.' },
              { icon: FileText,      title: 'Portal Daftar Ulang',        desc: 'Fasilitas publik untuk verifikasi identitas santri lama secara mandiri.' },
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
                { title: 'Monitoring Identitas Terpusat',   desc: 'Pantau kuantitas dan sebaran santri dari pusat hingga ke cabang secara realtime.' },
                { title: 'Optimalisasi Proses Akademik',    desc: 'Kurangi beban administratif — dari kalender akademik hingga penerbitan rapor.' },
                { title: 'Infrastruktur Berbasis Cloud',    desc: 'Akses dari mana saja dengan jaminan ketersediaan data (uptime) 99.9%.' },
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-[#0A192F] font-bold rounded-full hover:bg-sky-50 transition-colors shadow-xl"
            >
              Menuju Dashboard Internal
            </button>
            <button
              onClick={() => navigate('/daftar-ulang')}
              className="px-8 py-4 border-2 border-[#00B4D8] text-[#00B4D8] font-bold rounded-full hover:bg-[#00B4D8]/10 transition-colors"
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-[#0369A1] rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight text-lg">eSantri</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sistem Informasi Manajemen Pesantren untuk PP Sulaimaniyah. Tercepat, teraman, dan terpercaya.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Akses Cepat</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#beranda" className="hover:text-[#00B4D8] transition-colors">Beranda</a></li>
              <li><a href="#fitur"   className="hover:text-[#00B4D8] transition-colors">Fitur Utama</a></li>
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
              <li>Tim IT PP Sulaimaniyah</li>
              <li>support@esantri.id</li>
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
