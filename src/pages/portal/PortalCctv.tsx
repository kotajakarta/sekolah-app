import React, { useState, useEffect } from 'react';
import { usePortalStudent } from '../../features/portal/context/PortalStudentContext';
import {
  Video,
  Camera,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Radio,
  ShieldAlert,
  Building,
  School,
  Utensils,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

interface CCTVChannel {
  id: string;
  name: string;
  location: string;
  category: 'KELAS' | 'MASJID' | 'MAKAN' | 'ASRAMA';
  icon: any;
  status: 'ONLINE' | 'MAINTENANCE';
  streamQuality: string;
  fps: number;
  description: string;
  gradient: string;
  simulatedBg: string;
}

const CCTV_CHANNELS: CCTVChannel[] = [
  {
    id: 'cctv-kelas-1',
    name: 'CCTV Kelas A-102 (Gedung Utama)',
    location: 'Lantai 2 - Ruang Kelas Santri',
    category: 'KELAS',
    icon: School,
    status: 'ONLINE',
    streamQuality: '1080p HD',
    fps: 30,
    description: 'Pemantauan aktivitas belajar mengajar & suasana kelas santri.',
    gradient: 'from-blue-600 to-indigo-900',
    simulatedBg: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cctv-masjid-1',
    name: 'CCTV Masjid Jami (Ruang Utama)',
    location: 'Lantai 1 - Area Shalat & Mengaji',
    category: 'MASJID',
    icon: Building,
    status: 'ONLINE',
    streamQuality: '1080p HD',
    fps: 30,
    description: 'Pemantauan kegiatan jamaah shalat, tahfidz, dan kajian santri.',
    gradient: 'from-emerald-600 to-teal-900',
    simulatedBg: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cctv-makan-1',
    name: 'CCTV Tempat Makan & Kantin',
    location: 'Gedung Konsumsi Santri',
    category: 'MAKAN',
    icon: Utensils,
    status: 'ONLINE',
    streamQuality: '1080p HD',
    fps: 30,
    description: 'Pemantauan waktu makan santri, kebersihan dapur, & antrean kantin.',
    gradient: 'from-amber-600 to-orange-900',
    simulatedBg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cctv-asrama-1',
    name: 'CCTV Halaman Asrama & Gazebo',
    location: 'Area Terbuka Asrama Santri',
    category: 'ASRAMA',
    icon: Building,
    status: 'ONLINE',
    streamQuality: '1080p HD',
    fps: 30,
    description: 'Pemantauan jam istirahat, kegiatan olahraga, & gazebo hafalan.',
    gradient: 'from-indigo-600 to-purple-900',
    simulatedBg: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function PortalCctv() {
  const { selectedLink } = usePortalStudent();

  // Check protection & lock status
  const isProtectionEnabled = localStorage.getItem('cctv_protection_enabled') !== 'false';
  const [isUnlocked, setIsUnlocked] = useState(
    () => !isProtectionEnabled || localStorage.getItem('cctv_unlocked_session') === 'true'
  );

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState<CCTVChannel>(CCTV_CHANNELS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
          ' ' +
          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const targetCode = localStorage.getItem('cctv_access_code') || '123456';

    if (pinInput.trim() === targetCode) {
      setIsUnlocked(true);
      localStorage.setItem('cctv_unlocked_session', 'true');
    } else {
      setPinError('Kode Akses PIN salah! Silakan tanyakan kode PIN ke pihak pengelola sekolah.');
    }
  };

  const handleLockSession = () => {
    localStorage.removeItem('cctv_unlocked_session');
    setIsUnlocked(false);
    setPinInput('');
  };

  const handleTakeSnapshot = () => {
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 3000);
  };

  const studentName = selectedLink?.student?.biodata?.fullName ?? 'Anak Anda';
  const kelasName = selectedLink?.student?.siswaFormal?.kelas?.name ?? 'Kelas Santri';

  // ── LOCK SCREEN IF NOT UNLOCKED ──
  if (isProtectionEnabled && !isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-8 text-center space-y-6 relative">
          <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-100 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Akses Live CCTV Terkunci</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Halaman tayangan CCTV dilindungi dengan Kode Akses PIN oleh pengelola sekolah.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" /> Masukkan Kode PIN Akses:
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Kode PIN (misal: 123456)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-center font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pinError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" /> Buka Tayangan CCTV
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-normal">
            💡 Kode PIN Akses CCTV dapat diperoleh dengan menghubungi sekretariat / pengelola sekolah.
          </div>
        </div>
      </div>
    );
  }

  // ── UNLOCKED FULL CCTV DISPLAY ──
  return (
    <div className="space-y-6">
      {/* ── BANNER INFORMASI LIVE CCTV ── */}
      <div className="bg-gradient-to-r from-[#0A192F] via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Portal Monitoring CCTV Terverifikasi
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-indigo-400" />
              Live CCTV Pembelajaran & Lingkungan Santri
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl">
              Pantau aktivitas santri <strong className="text-white">{studentName}</strong> ({kelasName}) secara langsung di area Kelas, Masjid, Tempat Makan, dan Asrama.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-indigo-900/50 px-3 py-1.5 rounded-2xl border border-indigo-700/50 text-xs font-medium text-indigo-200">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{currentTime}</span>
            </div>

            {isProtectionEnabled && (
              <button
                onClick={handleLockSession}
                className="px-3 py-1.5 bg-indigo-900/80 hover:bg-rose-900/80 border border-indigo-700/60 rounded-xl text-xs font-semibold text-indigo-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Kunci Akses Sesi CCTV"
              >
                <Lock className="w-3.5 h-3.5" /> Kunci Sesi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYER & CHANNEL SELECTOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PLAYER MAIN CONTAINER */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className={`relative bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 group ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'aspect-video'
            }`}
          >
            {/* SIMULATED STREAM DISPLAY */}
            <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <img
                src={selectedChannel.simulatedBg}
                alt={selectedChannel.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-90 scale-[1.01]' : 'opacity-40 blur-xs'}`}
              />

              {/* DYNAMIC MOTION OVERLAY SIMULATION */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60 pointer-events-none"></div>
              )}

              {/* PAUSED OVERLAY */}
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs text-white p-4">
                  <Pause className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="font-bold text-sm">Streaming Di-pause</p>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold shadow-lg cursor-pointer"
                  >
                    Lanjutkan Stream
                  </button>
                </div>
              )}

              {/* LIVE OSD OVERLAY (Top-Left) */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-600/90 text-white shadow-md backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  LIVE REC 🔴
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-slate-200 border border-slate-700/60 backdrop-blur-xs">
                  {selectedChannel.streamQuality} @ {selectedChannel.fps}fps
                </span>
              </div>

              {/* STREAM INFO (Top-Right) */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-none">
                <div className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-900/80 text-emerald-400 border border-slate-700/60 backdrop-blur-xs">
                  {currentTime}
                </div>
              </div>

              {/* CAMERA NAME WATERMARK (Bottom-Left) */}
              <div className="absolute bottom-16 left-4 z-20 pointer-events-none">
                <p className="text-white font-bold text-sm drop-shadow-md flex items-center gap-1.5">
                  <selectedChannel.icon className="w-4 h-4 text-indigo-400" />
                  {selectedChannel.name}
                </p>
                <p className="text-slate-300 text-xs drop-shadow-xs">{selectedChannel.location}</p>
              </div>

              {/* PLAYER CONTROL BAR (Bottom) */}
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-30 border-t border-slate-800/80 text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200 hover:text-white cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200 hover:text-white cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                  </button>

                  <span className="text-[11px] text-slate-400 border-l border-slate-800 pl-3">
                    Signal: <span className="text-emerald-400 font-semibold">Kuat (98%)</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTakeSnapshot}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Snapshot</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-200 hover:text-white cursor-pointer"
                    title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* SNAPSHOT NOTIFICATION */}
          {snapshotSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Snapshot tayangan CCTV berhasil disimpan ke galeri perangkat Anda!
              </span>
            </div>
          )}

          {/* CHANNEL DETAIL DESCRIPTION */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <selectedChannel.icon className="w-4 h-4 text-indigo-600" />
                {selectedChannel.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedChannel.status}
              </span>
            </div>
            <p className="text-xs text-slate-600">{selectedChannel.description}</p>
          </div>
        </div>

        {/* CHANNEL SELECTION SIDEBAR */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-600" /> Pilih Kamera CCTV
            </h3>

            <div className="space-y-2.5">
              {CCTV_CHANNELS.map((channel) => {
                const isSelected = selectedChannel.id === channel.id;
                const IconComponent = channel.icon;

                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannel(channel);
                      setIsPlaying(true);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs text-indigo-950 font-semibold'
                        : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/70 text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl text-white shrink-0 bg-gradient-to-br ${channel.gradient} shadow-2xs`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{channel.name.split(' (')[0]}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{channel.location}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-indigo-600 font-semibold">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          {channel.streamQuality}
                        </span>
                        <span>LIVE Stream</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INFORMASI ATURAN CCTV */}
          <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-5 text-amber-900 text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Etika & Ketentuan Tayangan CCTV
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 leading-relaxed">
              <li>Tayangan CCTV dikhususkan untuk wali santri resmi demi kenyamanan & keamanan santri.</li>
              <li>Dilarang menyebarluaskan rekaman atau tayangan CCTV ke media sosial tanpa izin pengelola pesantren.</li>
              <li>Akses tayangan beroperasi selama 24 jam dengan enkripsi stream HLS SSL terenkripsi.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
