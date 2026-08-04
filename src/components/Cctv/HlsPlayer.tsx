import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Video, AlertCircle, RefreshCw, Radio } from 'lucide-react';

interface HlsPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  title?: string;
}

export const HlsPlayer: React.FC<HlsPlayerProps> = ({
  src,
  poster,
  autoPlay = true,
  muted = true,
  controls = true,
  className = 'w-full h-full object-cover',
  title = 'Live CCTV Stream',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  useEffect(() => {
    setError(null);
    setLoading(true);

    if (!src) {
      setLoading(false);
      return;
    }

    // Check if iframe embed URL
    if (src.includes('<iframe') || src.includes('youtube.com') || src.includes('vimeo.com')) {
      setIsIframe(true);
      setLoading(false);
      return;
    } else {
      setIsIframe(false);
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported() && (src.includes('.m3u8') || src.includes('/hls/') || src.includes('stream'))) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked fallback
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Gagal menghubungkan ke server stream CCTV (Network Error). Mencoba ulang...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Format media stream tidak dapat diputar. Mencoba memulihkan...');
              hls?.recoverMediaError();
              break;
            default:
              setError('Stream CCTV sedang offline atau URL tidak valid.');
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari iOS / macOS)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });
      video.addEventListener('error', () => {
        setError('Gagal memuat video stream CCTV.');
        setLoading(false);
      });
    } else {
      // Direct MP4 / WebM video
      video.src = src;
      video.onloadeddata = () => setLoading(false);
      video.onerror = () => {
        setError('Format stream tidak didukung secara langsung.');
        setLoading(false);
      };
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay]);

  if (isIframe && src.includes('<iframe')) {
    return (
      <div
        className="w-full h-full overflow-hidden [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
        dangerouslySetInnerHTML={{ __html: src }}
      />
    );
  }

  if (isIframe && (src.includes('http') || src.includes('https'))) {
    return <iframe src={src} title={title} className="w-full h-full border-0" allow="autoplay; fullscreen" />;
  }

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        controls={controls}
        muted={muted}
        playsInline
        className={className}
      />

      {/* Loading Overlay */}
      {loading && !error && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3 z-10">
          <div className="relative flex items-center justify-center">
            <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-300">Menghubungkan Sinyal CCTV Live...</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono max-w-xs truncate">{src}</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
          <AlertCircle className="w-10 h-10 text-rose-500 animate-bounce" />
          <div>
            <h4 className="text-sm font-bold text-rose-300">Streaming CCTV Tidak Dapat Diputar</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{error}</p>
            <p className="text-[10px] font-mono text-slate-500 mt-2 truncate max-w-xs bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              URL: {src}
            </p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              if (videoRef.current) videoRef.current.load();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Coba Hubungkan Ulang
          </button>
        </div>
      )}
    </div>
  );
};

export default HlsPlayer;
