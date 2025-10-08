import { useState, useEffect, useRef } from "react";
import { SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VideoPlayerProps {
  section: {
    id: number;
    title: string;
    videoUrl: string;
    duration: string;
  };
  isActive?: boolean;
  onComplete: () => void;
  onNext: () => void;
}

const VideoPlayer = ({ section, isActive = true, onComplete, onNext }: VideoPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const maxWatchedRef = useRef(0);
  const isCompleteRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onNextRef = useRef(onNext);

  // Extract Bunny.net video ID from URL
  const getBunnyVideoId = (url: string) => {
    // Handle Bunny.net embed URLs like: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
    const match = url.match(/embed\/\d+\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const videoId = getBunnyVideoId(section.videoUrl);
  const libraryId = '506173';

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    let isMounted = true;
    if (!isActive) return;

    const ensurePlayerJs = () =>
      new Promise<void>((resolve) => {
        if ((window as any).playerjs) return resolve();
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/player.js@1.0.4/dist/player.min.js';
        s.async = true;
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    const setup = async () => {
      await ensurePlayerJs();
      if (!isMounted || !iframeRef.current) return;

      const p = new (window as any).playerjs.Player(iframeRef.current);
      playerRef.current = p;

      let duration = 0;

      // Bootstrap completion poll (runs even if 'ready' never fires')
      const bootstrapStart = Date.now();
      const bootstrapPoll = window.setInterval(() => {
        if (isCompleteRef.current) { try { window.clearInterval(bootstrapPoll); } catch {} return; }
        try {
          p.getDuration((d: number) => {
            if (d && d > 0) duration = d;
            p.getCurrentTime((t: number) => {
              const dSafe = duration || 0;
              const epsilon = Math.max(0.25, dSafe * 0.01);
              if (dSafe > 0 && t >= dSafe - epsilon) {
                console.log('[Bunny] bootstrap poll reached end', { t, d: dSafe });
                isCompleteRef.current = true;
                setIsComplete(true);
                onCompleteRef.current?.();
                setTimeout(() => onNextRef.current?.(), 300);
                try { window.clearInterval(bootstrapPoll); } catch {}
              }
            });
          });
        } catch {}
        if (Date.now() - bootstrapStart > 15000) {
          try { window.clearInterval(bootstrapPoll); } catch {}
        }
      }, 500);

      p.on('ready', () => {
        console.log('[Bunny] ready', { videoId });
        // Reset on new section
        setProgress(0);
        setIsComplete(false);
        isCompleteRef.current = false;
        maxWatchedRef.current = 0;

        const updateDuration = () => {
          p.getDuration((d: number) => {
            if (d && d > 0) {
              duration = d;
              console.log('[Bunny] duration', duration);
              try { clearInterval((updateDuration as any)._i); } catch {}
            }
          });
        };
        // Poll until duration is known
        (updateDuration as any)._i = window.setInterval(updateDuration, 500);
        updateDuration();

        // Robust completion polling as a fallback for very short videos or missing 'ended'
        const pollEpsilon = () => Math.max(0.25, (duration || 0) * 0.01);
        const completionPoll = window.setInterval(() => {
          if (isCompleteRef.current) return;
          try {
            p.getCurrentTime((t: number) => {
              const d = duration || 0;
              if (d > 0 && t >= d - pollEpsilon()) {
                console.log('[Bunny] completion poll reached end', { t, d });
                if (!isCompleteRef.current) {
                  isCompleteRef.current = true;
                  setIsComplete(true);
                  onCompleteRef.current?.();
                  setTimeout(() => onNextRef.current?.(), 300);
                }
              }
            });
          } catch {}
        }, 500);
        // Clear completionPoll when complete (on ended)
        const clearOnComplete = () => {
          try { window.clearInterval(completionPoll); } catch {}
        };
        p.on('ended', clearOnComplete);
      });

      p.on('timeupdate', (data: any) => {
        const current = data?.seconds ?? 0;
        const dur = data?.duration ?? duration ?? 0;
        const percentRaw = typeof data?.percent === 'number' ? data.percent : null;

        // Prevent forward seeking beyond watched + 10s
        if (current > maxWatchedRef.current + 10) {
          console.log('[Bunny] prevent seek forward', { current, max: maxWatchedRef.current });
          try { p.setCurrentTime(maxWatchedRef.current); } catch {}
          return;
        }
        if (current > maxWatchedRef.current) {
          maxWatchedRef.current = current;
        }

        let pct: number | null = null;
        if (percentRaw !== null) {
          pct = percentRaw <= 1 ? Math.round(percentRaw * 100) : Math.round(percentRaw);
        } else if (dur > 0) {
          pct = Math.min(100, Math.round((current / dur) * 100));
        }

        if (pct !== null) {
          setProgress(pct);
          // Fallback completion detection for very short videos if 'ended' doesn't fire
          const durSafe = dur || 0;
          const epsilon = Math.max(0.25, durSafe * 0.01); // 0.25s or 1% of duration
          if (!isCompleteRef.current && durSafe > 0 && (current >= durSafe - epsilon || pct >= 99)) {
            console.log('[Bunny] near-end fallback completion', { current, dur: durSafe, pct });
            isCompleteRef.current = true;
            setIsComplete(true);
            onCompleteRef.current?.();
            // Auto-advance to next section after marking complete
            setTimeout(() => onNextRef.current?.(), 300);
          }
        }
      });

      p.on('seeked', () => {
        // If user tries to seek forward, snap back
        p.getCurrentTime((t: number) => {
          if (t > maxWatchedRef.current + 0.5) {
            console.log('[Bunny] seeked forward, snapping back', { t, max: maxWatchedRef.current });
            try { p.setCurrentTime(maxWatchedRef.current); } catch {}
          }
        });
      });

      p.on('ended', () => {
        console.log('[Bunny] ended');
        if (!isCompleteRef.current) {
          isCompleteRef.current = true;
          setIsComplete(true);
          onCompleteRef.current?.();
          setTimeout(() => onNextRef.current?.(), 300);
        }
      });
    };

    setup();

    return () => {
      isMounted = false;
    };
  }, [section.videoUrl, isActive]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Section {section.id}: {section.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Bunny.net Video Player */}
          {isActive && videoId ? (
            <div className="relative rounded-lg overflow-hidden aspect-video mb-4 overscroll-none touch-none" onWheel={(e) => e.preventDefault()}>
              <iframe
                key={videoId || undefined}
                ref={iframeRef}
                src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&playsinline=true&showSpeed=false&rememberPosition=false&playerjs=1&ts=${Date.now()}`}
                loading="lazy" scrolling="no"
                style={{
                  border: 0,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '100%',
                }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4 overscroll-none touch-none" onWheel={(e) => e.preventDefault()}>
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-lg">Security Training Video</p>
                  <p className="text-sm opacity-80">Duration: {section.duration}</p>
                  <p className="text-xs opacity-60 mt-2">Video URL not configured</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress and Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {progress > 0 ? `Progress: ${progress}% complete` : 'Ready to watch'}
            </div>
            <div className="flex gap-2">
              {isComplete && (
                <Button onClick={onNext} size="sm">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Next Section
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPlayer;