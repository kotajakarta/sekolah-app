import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, RefreshCw, Radio, ExternalLink } from 'lucide-react';
import { decryptStreamUrlAsync, maskStreamUrl } from '../../utils/cctvCrypto';

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
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isIframe, setIsIframe] = useState<boolean>(false);
  const [realStreamUrl, setRealStreamUrl] = useState<string>('');

  // Dynamically load hls.js@latest from CDN as ultra-resilient fallback if needed
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Hls) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    setError(null);
    setLoading(true);
    let isSubscribed = true;

    if (!src) {
      setLoading(false);
      return;
    }

    // Check if iframe embed snippet or third party URL
    if (src.includes('<iframe') || src.includes('youtube.com') || src.includes('vimeo.com')) {
      setIsIframe(true);
      setLoading(false);
      return;
    } else {
      setIsIframe(false);
    }

    const video = videoRef.current;
    if (!video) return;

    // Destroy previous Hls instance if exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Construct proxy target source URL if needed
    let targetSourceUrl = src;
    if (src.startsWith('cctv_enc_')) {
      targetSourceUrl = `/api/v1/cctv/stream-proxy/playlist?token=${encodeURIComponent(src)}`;
    } else if ((src.startsWith('http://') || src.startsWith('https://')) && !src.includes('/stream-proxy/')) {
      targetSourceUrl = `/api/v1/cctv/stream-proxy/playlist?url=${encodeURIComponent(src)}`;
    }

    setRealStreamUrl(targetSourceUrl);

    // Get Hls constructor (either imported or window.Hls latest from CDN)
    const HlsConstructor = (window as any).Hls || Hls;
    const isHlsStream =
      targetSourceUrl.includes('.m3u8') ||
      targetSourceUrl.includes('/stream-proxy/') ||
      targetSourceUrl.includes('/hls/') ||
      targetSourceUrl.includes('/play/') ||
      targetSourceUrl.includes('stream') ||
      src.startsWith('cctv_enc_');

    if (HlsConstructor && HlsConstructor.isSupported() && isHlsStream) {
      const hls = new HlsConstructor({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(targetSourceUrl);
      hls.attachMedia(video);

      hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
        if (!isSubscribed) return;
        setLoading(false);
        setError(null);
        if (autoPlay) {
          video.play().catch((e) => {
            console.warn('Autoplay prevented:', e);
          });
        }
      });

        hls.on(HlsConstructor.Events.ERROR, (_event: any, data: any) => {
          if (!isSubscribed) return;
          console.warn('HLS.js Event Error:', data);
          if (data.fatal) {
            switch (data.type) {
              case HlsConstructor.ErrorTypes.NETWORK_ERROR:
                console.error('HLS Network error encountered, attempting recovery...');
                hls.startLoad();
                setError('Gagal menghubungkan ke stream server. Pastikan server CCTV online dan mengizinkan CORS.');
                break;
              case HlsConstructor.ErrorTypes.MEDIA_ERROR:
                console.error('HLS Media error encountered, recovering...');
                hls.recoverMediaError();
                break;
              default:
                setError('Format stream CCTV tidak dapat diputar di browser ini.');
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari iOS / macOS)
        video.src = targetSourceUrl;
        const handleLoadedMetadata = () => {
          if (!isSubscribed) return;
          setLoading(false);
          setError(null);
          if (autoPlay) {
            video.play().catch(() => {});
          }
        };
        const handleError = () => {
          if (!isSubscribed) return;
          setError('Gagal memuat video stream CCTV.');
          setLoading(false);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
      } else {
        // Direct MP4 / WebM / fallback
        video.src = targetSourceUrl;
        video.onloadeddata = () => {
          if (!isSubscribed) return;
          setLoading(false);
          setError(null);
        };
        video.onerror = () => {
          if (!isSubscribed) return;
          setError('Format stream tidak dapat diputar langsung.');
          setLoading(false);
        };
      }

    return () => {
      isSubscribed = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  if (isIframe && src.includes('<iframe')) {
    const match = src.match(/src=["']([^"']+)["']/i);
    const iframeSrc = match ? match[1] : '';
    if (iframeSrc && (iframeSrc.startsWith('http://') || iframeSrc.startsWith('https://') || iframeSrc.startsWith('/'))) {
      return (
        <iframe
          src={iframeSrc}
          title={title || 'CCTV Stream'}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }
  }

  if (isIframe && (src.includes('http') || src.includes('https'))) {
    return <iframe src={src} title={title} className="w-full h-full border-0" allow="autoplay; fullscreen" />;
  }

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden group">
      {/* HTML5 Video Element with HLS.js */}
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
            <p className="text-xs font-bold text-emerald-300">Menghubungkan HLS.js Live Stream...</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono max-w-xs truncate font-bold">
              {maskStreamUrl(src)}
            </p>
          </div>
        </div>
      )}

      {/* Error / Offline Overlay */}
      {error && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
          <AlertCircle className="w-10 h-10 text-amber-400 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-white">Stream CCTV Terkendala Sinyal / Server</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-md">{error}</p>
            <div className="mt-2 text-[10px] font-mono text-slate-400 truncate max-w-xs bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 mx-auto font-bold">
              URL: {maskStreamUrl(src)}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Putar Ulang Stream
            </button>
            {realStreamUrl && (
              <a
                href={realStreamUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Stream di Tab Baru
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HlsPlayer;
