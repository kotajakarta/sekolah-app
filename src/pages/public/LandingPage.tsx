import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ShieldCheck, Zap, Users, GraduationCap, BarChart, CheckCircle, ChevronRight, LayoutDashboard, Calendar, FileText } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-[#00B4D8]/30">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-slate-200 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-8 h-8 bg-[#00B4D8] rounded-lg flex items-center justify-center shadow-lg shadow-[#00B4D8]/20">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">eSantri</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#beranda" className="hover:text-[#0077B6] transition-colors">Beranda</a>
            <a href="#fitur" className="hover:text-[#0077B6] transition-colors">Fitur Utama</a>
            <a href="#manfaat" className="hover:text-[#0077B6] transition-colors">Manfaat</a>
            <a href="#skala" className="hover:text-[#0077B6] transition-colors">Skalabilitas</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/daftar-ulang')} className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-[#0077B6] transition-colors">
              Daftar Ulang
            </button>
            <button onClick={() => navigate('/login')} className="bg-slate-900 hover:bg-[#0096C7] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-slate-900/20 hover:shadow-[#00B4D8]/30 flex items-center gap-2">
              Sign In <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 to-slate-50 -z-10"></div>
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-cyan-200/20 rounded-full blur-3xl -z-10 translate-x-1/3"></div>
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-3xl -z-10 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5E9]/80 border border-[#00B4D8]/30 text-[#0A192F] text-xs font-bold uppercase tracking-wider mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B4D8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B4D8]"></span>
            </span>
            Platform Manajemen Pesantren Resmi
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mb-6">
            Masa Depan Manajemen dengan <span className="text-[#0077B6]">Teknologi Terkini</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            eSantri PP Sulaimaniyah membantu modernisasi data santri, absensi, dan administrasi akademik secara terpusat untuk efisiensi operasional harian.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button onClick={() => navigate('/login')} className="px-8 py-4 bg-[#0A192F] hover:bg-[#060D1A] text-white rounded-full font-bold text-lg transition-all shadow-xl shadow-[#00B4D8]/30 hover:scale-105">
              Login Dashboard
            </button>
            <button onClick={() => navigate('/daftar-ulang')} className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-bold text-lg transition-all shadow-sm flex items-center gap-2">
              Daftar Ulang Santri
            </button>
          </div>

          {/* Hero Floating Cards */}
          <div className="mt-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center items-center text-center transform md:-translate-y-4">
              <div className="w-12 h-12 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mb-4 text-[#0077B6]">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-1">15.000+</h3>
              <p className="text-sm font-medium text-slate-500">Santri Aktif & Terdata</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl shadow-slate-900/30 border border-slate-800 flex flex-col justify-center text-white relative overflow-hidden h-64 md:h-auto z-10 md:scale-110">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B4D8]/20 blur-2xl rounded-full"></div>
              <h3 className="text-xl font-bold mb-4">Total Cabang</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black">54+</span>
                <span className="text-[#00B4D8] font-medium pb-1">Wilayah</span>
              </div>
              <p className="text-slate-400 text-sm">Terintegrasi dalam satu sistem komprehensif.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center items-center text-center transform md:-translate-y-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 text-purple-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-1">99.9%</h3>
              <p className="text-sm font-medium text-slate-500">Akurasi & Keamanan Data</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Dark Green) */}
      <section id="fitur" className="py-24 bg-[#0A192F] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Layanan Manajemen Terintegrasi & Efisien</h2>
            <p className="text-sky-50/70 text-lg">
              Sistem informasi yang dirancang khusus untuk memenuhi kebutuhan pesantren modern, memastikan kualitas data dan operasional.
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
                <f.icon className="w-8 h-8 text-[#00B4D8] mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-sky-50/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="manfaat" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute inset-0 bg-[#E8F5E9] rounded-[3rem] transform -rotate-3 scale-105 z-0"></div>
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 relative z-10">
              {/* Mockup Dashboard UI */}
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-[#00B4D8]"></div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-1/3 h-6 bg-slate-200 rounded-md"></div>
                  <div className="w-1/4 h-8 bg-[#E8F5E9] rounded-full"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
                        <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
                      </div>
                      <div className="w-16 h-6 bg-emerald-50 rounded-full border border-emerald-100"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Chart Widget */}
              <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 w-64">
                <h4 className="font-bold text-slate-800 mb-4">Statistik Kehadiran</h4>
                <div className="flex items-end gap-2 h-24">
                  <div className="w-1/4 bg-[#E8F5E9] rounded-t-lg h-[40%]"></div>
                  <div className="w-1/4 bg-[#00B4D8] rounded-t-lg h-[70%]"></div>
                  <div className="w-1/4 bg-[#00B4D8] rounded-t-lg h-[100%]"></div>
                  <div className="w-1/4 bg-slate-200 rounded-t-lg h-[30%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">Manfaat Utama Sistem Kami untuk Efisiensi Anda</h2>
            <p className="text-slate-600 text-lg mb-10">
              Mengakselerasi kinerja operasional pengurus dengan akses data yang cepat, akurat, dan terstruktur.
            </p>

            <div className="space-y-8">
              {[
                { title: 'Monitoring Identitas Terpusat', desc: 'Dengan sistem canggih yang kami miliki, Anda dapat memantau kuantitas dan sebaran santri dari pusat hingga ke cabang secara realtime.' },
                { title: 'Optimalisasi Proses Akademik', desc: 'Kurangi beban administratif. Sistem kami memfasilitasi pembuatan kalender akademik, penyusunan jadwal mapel, hingga penerbitan rapor.' },
                { title: 'Infrastruktur Berbasis Cloud', desc: 'Tidak perlu memikirkan server fisik. Akses dari mana saja menggunakan browser dengan jaminan ketersediaan data (uptime) 99.9%.' }
              ].map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#0077B6]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{b.title}</h4>
                    <p className="text-slate-600 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 bg-[#0A192F] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Digitalisasi Pesantren dalam Genggaman</h2>
          <p className="text-sky-50 text-lg mb-10">
            Segera manfaatkan teknologi untuk mereduksi birokrasi dan meningkatkan produktivitas. Akses eSantri sekarang juga!
          </p>
          <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white text-[#0A192F] font-bold rounded-full hover:bg-sky-50 transition-colors shadow-xl">
            Menuju Dashboard Internal
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060D1A] text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[#00B4D8] rounded flex items-center justify-center">
                <Building className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">eSantri</span>
            </div>
            <p className="text-sm">
              Sistem Informasi Manajemen Pesantren untuk PP Sulaimaniyah. Tercepat, teraman, dan terpercaya.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Akses Cepat</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#00B4D8] transition-colors">Beranda</a></li>
              <li><a href="#" className="hover:text-[#00B4D8] transition-colors">Daftar Ulang Santri</a></li>
              <li><a href="#" className="hover:text-[#00B4D8] transition-colors">FAQ & Bantuan</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Modul Sistem</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-[#00B4D8] transition-colors">Manajemen Santri</span></li>
              <li><span className="hover:text-[#00B4D8] transition-colors">Absensi & Jurnal</span></li>
              <li><span className="hover:text-[#00B4D8] transition-colors">Kepegawaian (HRD)</span></li>
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
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>&copy; {new Date().getFullYear()} eSantri PP Sulaimaniyah. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-white">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
