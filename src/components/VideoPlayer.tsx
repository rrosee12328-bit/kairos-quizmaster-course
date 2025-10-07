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
  onComplete: () => void;
  onNext: () => void;
}

const VideoPlayer = ({ section, onComplete, onNext }: VideoPlayerProps) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const maxWatchedRef = useRef(0);
  const isCompleteRef = useRef(false);

  // Extract Bunny.net video ID from URL
  const getBunnyVideoId = (url: string) => {
    // Handle Bunny.net embed URLs like: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
    const match = url.match(/embed\/\d+\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const videoId = getBunnyVideoId(section.videoUrl);
  const libraryId = '506173';

  useEffect(() => {
    let isMounted = true;

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

      p.on('ready', () => {
        // Reset on new section
        setProgress(0);
        setIsComplete(false);
        isCompleteRef.current = false;
        maxWatchedRef.current = 0;

        p.getDuration((d: number) => {
          duration = d || 0;
        });
      });

      p.on('timeupdate', (data: any) => {
        const current = data?.seconds ?? 0;
        const dur = data?.duration ?? duration ?? 0;

        // Prevent forward seeking beyond watched + 2s
        if (current > maxWatchedRef.current + 2) {
          p.setCurrentTime(maxWatchedRef.current);
          return;
        }
        if (current > maxWatchedRef.current) {
          maxWatchedRef.current = current;
        }

        if (dur > 0) {
          const pct = Math.min(100, Math.round((current / dur) * 100));
          setProgress(pct);
          if (pct >= 90 && !isCompleteRef.current) {
            isCompleteRef.current = true;
            setIsComplete(true);
            onComplete();
          }
        }
      });

      p.on('ended', () => {
        if (!isCompleteRef.current) {
          isCompleteRef.current = true;
          setIsComplete(true);
          onComplete();
        }
      });
    };

    setup();

    return () => {
      isMounted = false;
    };
  }, [section.videoUrl, onComplete]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Section {section.id}: {section.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Bunny.net Video Player */}
          {videoId ? (
            <div className="relative rounded-lg overflow-hidden aspect-video mb-4 overscroll-none touch-none" onWheel={(e) => e.preventDefault()}>
              <iframe
                ref={iframeRef}
                src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&showSpeed=false&rememberPosition=false`}
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