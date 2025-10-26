import { useState, useEffect, useRef } from "react";
import { SkipForward, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import VideoDebugPanel from "./VideoDebugPanel";
import { useToast } from "@/hooks/use-toast";
interface VideoPlayerProps {
  section: {
    id: number;
    title: string;
    videoUrl: string;
    duration: string;
  };
  courseType?: string;
  isActive?: boolean;
  onComplete: () => void;
  onNext: () => void;
}

const VideoPlayer = ({ section, courseType, isActive = true, onComplete, onNext }: VideoPlayerProps) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoAdvance] = useState(false); // Default: no auto-advance
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const maxWatchedRef = useRef(0);
  const isCompleteRef = useRef(false);
  const completionPostedRef = useRef(false);
  const readyRef = useRef(false);
  const retryCountRef = useRef(0);
  const signedRefreshesRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onNextRef = useRef(onNext);
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);
  const videoStartTimeRef = useRef<number | null>(null);
  const totalWatchTimeRef = useRef(0);
  const lastTimeUpdateRef = useRef(0);
  
  // Extract Bunny.net video ID from URL
  const getBunnyVideoId = (url: string) => {
    // Handle Bunny.net embed URLs like: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
    const match = url.match(/embed\/\d+\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const videoId = getBunnyVideoId(section.videoUrl);
  // Extract library ID from the video URL or use default
  const libraryIdMatch = section.videoUrl.match(/embed\/(\d+)\//);
  const libraryId = libraryIdMatch ? libraryIdMatch[1] : '510506';

  // Build iframe src using signed URL if provided (preserves token)
  const buildIframeSrc = () => {
    if (overrideUrl) return `${overrideUrl}&rememberPosition=false&playsinline=true&ts=${Date.now()}&rt=${reloadTick}`;
    const uStr = section.videoUrl;
    if (uStr && uStr.startsWith('https://iframe.mediadelivery.net/embed/')) {
      try {
        const u = new URL(uStr);
        u.searchParams.set('autoplay', 'false');
        u.searchParams.set('preload', 'true');
        u.searchParams.set('playsinline', 'true');
        u.searchParams.set('showSpeed', 'false');
        u.searchParams.set('rememberPosition', 'false');
        u.searchParams.set('playerjs', '1');
        u.searchParams.set('ts', String(Date.now()));
        u.searchParams.set('rt', String(reloadTick));
        return u.toString();
      } catch {
        return uStr; // fallback to provided URL
      }
    }
    // Fallback (shouldn't be needed if signed URL exists)
    return videoId
      ? `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&playsinline=true&showSpeed=false&rememberPosition=false&playerjs=1&ts=${Date.now()}&rt=${reloadTick}`
      : '';
  };
  const iframeSrc = buildIframeSrc();

  const handleIframeError = async () => {
    console.error('[VideoPlayer] iframe load error for video:', videoId);
    if (!videoId) return;
    if (signedRefreshesRef.current >= 2) return;
    try {
      const { data, error } = await supabase.functions.invoke('bunny-video', {
        body: {
          action: 'getSignedUrl',
          libraryId,
          videoId,
          expiresInHours: 24,
        },
      });
      if (!error && data?.signedUrl) {
        signedRefreshesRef.current += 1;
        setOverrideUrl(data.signedUrl);
        setReloadTick((t) => t + 1);
        console.log('[VideoPlayer] refreshed signed URL');
      } else {
        console.error('[VideoPlayer] failed to refresh signed URL', error || data);
      }
    } catch (e) {
      console.error('[VideoPlayer] error refreshing signed URL', e);
    }
  };

  const saveVideoWatchTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !courseType) return;

      const watchTimeSeconds = totalWatchTimeRef.current;
      console.log('[VideoPlayer] Saving watch time:', watchTimeSeconds, 'seconds for section', section.id);

      // Check if progress record exists
      const { data: existing } = await supabase
        .from('course_progress')
        .select('id, video_started_at')
        .eq('user_id', user.id)
        .eq('course_type', courseType)
        .eq('section_id', section.id)
        .single();

      if (existing) {
        await supabase
          .from('course_progress')
          .update({
            video_watch_time_seconds: watchTimeSeconds,
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('course_progress')
          .insert({
            user_id: user.id,
            course_type: courseType,
            section_id: section.id,
            video_started_at: new Date().toISOString(),
            video_watch_time_seconds: watchTimeSeconds,
            completed: true,
            completed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('[VideoPlayer] Error saving watch time:', error);
    }
  };

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    let isMounted = true;
    let bootstrapPoll: any = null;
    let completionPoll: any = null;
    let durationUpdateInterval: any = null;
    let fallbackTimeout: any = null;
    let watchdogInterval: any = null;
    
    if (!isActive || !videoId) {
      // Reset state when inactive
      setProgress(0);
      setIsComplete(false);
      isCompleteRef.current = false;
      maxWatchedRef.current = 0;
      readyRef.current = false;
      retryCountRef.current = 0;
      return;
    }

    const ensurePlayerJs = () =>
      new Promise<void>((resolve) => {
        if ((window as any).playerjs) return resolve();
        const s = document.createElement('script');
        s.src = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js';
        s.async = true;
        s.onload = () => {
          console.log('[VideoPlayer] Player.js loaded from Bunny CDN');
          resolve();
        };
        s.onerror = () => {
          console.error('[VideoPlayer] Failed to load Player.js');
          resolve(); // Continue anyway
        };
        document.head.appendChild(s);
      });

    const setup = async () => {
      await ensurePlayerJs();
      if (!isMounted || !iframeRef.current) return;

      const p = new (window as any).playerjs.Player(iframeRef.current);
      playerRef.current = p;

      let duration = 0;
      // Fallback: if player isn't ready in 6s, reload iframe (up to 2 retries)
      readyRef.current = false;
      if (fallbackTimeout) { try { clearTimeout(fallbackTimeout); } catch {} }
      fallbackTimeout = window.setTimeout(() => {
        if (!readyRef.current && retryCountRef.current < 2 && isMounted) {
          retryCountRef.current += 1;
          setReloadTick((t) => t + 1);
        }
      }, 6000);

      // Bootstrap completion poll (runs even if 'ready' never fires')
      const bootstrapStart = Date.now();
      bootstrapPoll = window.setInterval(() => {
        if (isCompleteRef.current || !isMounted) { 
          try { window.clearInterval(bootstrapPoll); } catch {} 
          return; 
        }
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
        if (!isMounted) return;
        readyRef.current = true;
        try { clearTimeout(fallbackTimeout); } catch {}
        console.log('[Bunny] EVENT: ready', { 
          videoId, 
          sectionId: section.id, 
          courseType,
          iframeAttached: !!iframeRef.current 
        });
        // Reset on new section
        setProgress(0);
        setIsComplete(false);
        isCompleteRef.current = false;
        completionPostedRef.current = false;
        maxWatchedRef.current = 0;
        videoStartTimeRef.current = null;
        totalWatchTimeRef.current = 0;
        lastTimeUpdateRef.current = 0;

        const updateDuration = () => {
          if (!isMounted) return;
          p.getDuration((d: number) => {
            if (d && d > 0) {
              duration = d;
              console.log('[Bunny] duration', duration);
              try { clearInterval(durationUpdateInterval); } catch {}
            }
          });
        };
        // Poll until duration is known
        durationUpdateInterval = window.setInterval(updateDuration, 500);
        updateDuration();

        // Robust completion polling as a fallback for very short videos or missing 'ended'
        const pollEpsilon = () => Math.max(0.25, (duration || 0) * 0.01);
        completionPoll = window.setInterval(() => {
          if (isCompleteRef.current || !isMounted) {
            try { window.clearInterval(completionPoll); } catch {}
            return;
          }
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
        
        const clearOnComplete = () => {
          try { window.clearInterval(completionPoll); } catch {}
        };
        p.on('ended', clearOnComplete);

        // Watchdog: Check every 300ms for unauthorized forward jumps
        watchdogInterval = window.setInterval(() => {
          if (!isMounted || !readyRef.current) return;
          try {
            p.getCurrentTime((t: number) => {
              const allowedMax = maxWatchedRef.current + 5;
              if (t > allowedMax) {
                console.log('[Bunny] WATCHDOG: Correcting unauthorized jump', {
                  currentTime: t,
                  maxWatched: maxWatchedRef.current,
                  snappingTo: allowedMax
                });
                try { p.setCurrentTime(allowedMax); } catch {}
              }
            });
          } catch {}
        }, 300);

        // Rate guard: prevent playback speed > 1.25x
        p.on('ratechange', () => {
          if (!isMounted) return;
          try {
            p.getPlaybackRate?.((rate: number) => {
              if (rate > 1.25) {
                console.log('[Bunny] RATE GUARD: Preventing speed-run', { 
                  attemptedRate: rate, 
                  enforcedRate: 1.0 
                });
                try { p.setPlaybackRate?.(1.0); } catch {}
              }
            });
          } catch {}
        });
      });

      p.on('timeupdate', (data: any) => {
        if (!isMounted) return;
        const current = data?.seconds ?? 0;
        const dur = data?.duration ?? duration ?? 0;
        const percentRaw = typeof data?.percent === 'number' ? data.percent : null;

        // Throttled logging (every 2 seconds)
        const now = Date.now();
        if (now - lastTimeUpdateRef.current > 2000) {
          console.log('[Bunny] EVENT: timeupdate (throttled)', { 
            current: current.toFixed(2), 
            maxWatched: maxWatchedRef.current.toFixed(2),
            percent: percentRaw 
          });
          lastTimeUpdateRef.current = now;
        }

        // Update state for debug panel
        setCurrentTime(current);
        setDuration(dur);

        // Only increase maxWatched on normal forward playback (not big jumps)
        const timeDiff = current - maxWatchedRef.current;
        if (timeDiff > 0 && timeDiff < 2) {
          // Normal playback: small incremental increase
          maxWatchedRef.current = current;
        } else if (current <= maxWatchedRef.current + 5) {
          // Within allowed buffer
          if (current > maxWatchedRef.current) {
            maxWatchedRef.current = current;
          }
        }

        let pct: number | null = null;
        if (percentRaw !== null) {
          pct = percentRaw <= 1 ? Math.round(percentRaw * 100) : Math.round(percentRaw);
        } else if (dur > 0) {
          pct = Math.min(100, Math.round((current / dur) * 100));
        }

        if (pct !== null) {
          setProgress(pct);
          // Completion at 90% threshold
          const durSafe = dur || 0;
          const epsilon = Math.max(0.25, durSafe * 0.01);
          if (!isCompleteRef.current && durSafe > 0 && (maxWatchedRef.current >= durSafe - epsilon || pct >= 90)) {
            console.log('[Bunny] 90% COMPLETION THRESHOLD REACHED', { 
              maxWatched: maxWatchedRef.current, 
              duration: durSafe, 
              percent: pct,
              sectionId: section.id,
              courseType 
            });
            isCompleteRef.current = true;
            setIsComplete(true);
            
            // Save to database (debounced)
            if (!completionPostedRef.current) {
              completionPostedRef.current = true;
              saveVideoWatchTime();
              onCompleteRef.current?.();
              
              // Show completion notification
              showCompletionNotification();
            }
          }
        }
      });

      p.on('seeked', () => {
        if (!isMounted) return;
        // Anti-skip: snap back if user seeks beyond allowed buffer (handles keyboard shortcuts 0-9, arrows)
        p.getCurrentTime((t: number) => {
          const allowedSeek = maxWatchedRef.current + 5;
          console.log('[Bunny] EVENT: seeked', { 
            seekedTo: t.toFixed(2), 
            maxWatched: maxWatchedRef.current.toFixed(2),
            allowed: allowedSeek.toFixed(2)
          });
          if (t > allowedSeek) {
            console.log('[Bunny] SEEK GUARD: Snapping back from seeked event', { 
              seekedTo: t, 
              snappedTo: allowedSeek 
            });
            try { p.setCurrentTime(allowedSeek); } catch {}
          }
        });
      });

      p.on('ended', () => {
        if (!isMounted) return;
        console.log('[Bunny] EVENT: ended', { 
          sectionId: section.id, 
          totalWatchTime: totalWatchTimeRef.current 
        });
        // Stop watch time tracking
        if (videoStartTimeRef.current) {
          totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
          videoStartTimeRef.current = null;
        }
        if (!isCompleteRef.current) {
          isCompleteRef.current = true;
          setIsComplete(true);
          
          // Save watch time to database
          if (!completionPostedRef.current) {
            completionPostedRef.current = true;
            saveVideoWatchTime();
            onCompleteRef.current?.();
            
            // Show completion notification
            showCompletionNotification();
          }
        }
      });

      p.on('play', () => {
        if (!isMounted) return;
        if (!videoStartTimeRef.current) {
          videoStartTimeRef.current = Date.now();
          console.log('[Bunny] EVENT: play (started watching)', { sectionId: section.id });
        }
      });

      p.on('pause', () => {
        if (!isMounted || !videoStartTimeRef.current) return;
        totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
        videoStartTimeRef.current = null;
        console.log('[Bunny] EVENT: pause', { 
          sectionId: section.id, 
          totalWatchTime: totalWatchTimeRef.current 
        });
      });
    };

    setup();

      return () => {
      isMounted = false;
      // Save watch time before cleanup
      if (videoStartTimeRef.current) {
        totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
        videoStartTimeRef.current = null;
      }
      // Clear all intervals
      try { window.clearInterval(bootstrapPoll); } catch {}
      try { window.clearInterval(completionPoll); } catch {}
      try { window.clearInterval(durationUpdateInterval); } catch {}
      try { window.clearInterval(watchdogInterval); } catch {}
      try { clearTimeout(fallbackTimeout); } catch {}
      readyRef.current = false;
      // Destroy player
      if (playerRef.current) {
        try {
          playerRef.current.off?.('ready');
          playerRef.current.off?.('timeupdate');
          playerRef.current.off?.('seeked');
          playerRef.current.off?.('ended');
          playerRef.current.off?.('play');
          playerRef.current.off?.('pause');
          playerRef.current.off?.('ratechange');
        } catch {}
        playerRef.current = null;
      }
    };
  }, [section.videoUrl, isActive, videoId, reloadTick]);

  const showCompletionNotification = () => {
    const handleContinue = () => {
      if (autoAdvance) {
        // Auto-advance with countdown
        let countdown = 5;
        
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            toast({
              title: "✅ Section Complete!",
              description: `Auto-advancing in ${countdown} seconds...`,
              duration: 1000,
            });
          } else {
            clearInterval(countdownInterval);
            onNextRef.current?.();
          }
        }, 1000);
        
        toast({
          title: "✅ Section Complete!",
          description: `Auto-advancing in 5 seconds...`,
          duration: 5000,
        });
      } else {
        // Immediate navigation
        onNextRef.current?.();
      }
    };

    // Show completion toast with actions
    toast({
      title: "✅ Section Complete!",
      description: "You've watched ≥90% of this lesson. Click 'Continue to Next' button below the video or the Next button in navigation.",
      duration: 10000,
    });
  };

  const recheckCompletion = async () => {
    if (!courseType) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('course_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('course_type', courseType)
        .eq('section_id', section.id)
        .maybeSingle();

      if (data?.completed) {
        console.log('[VideoPlayer] RECHECK: Section is completed in DB', { sectionId: section.id });
        if (!isCompleteRef.current) {
          isCompleteRef.current = true;
          setIsComplete(true);
          onCompleteRef.current?.();
        }
      } else {
        console.log('[VideoPlayer] RECHECK: Section NOT completed in DB', { sectionId: section.id });
      }
    } catch (error) {
      console.error('[VideoPlayer] Error rechecking completion:', error);
    }
  };

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
                key={`${videoId}-${reloadTick}`}
                ref={iframeRef}
                src={iframeSrc}
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
                onError={handleIframeError}
              />
            </div>
          ) : isActive && !videoId && section.videoUrl ? (
            <div className="relative bg-destructive/10 border border-destructive/50 rounded-lg overflow-hidden aspect-video mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-lg font-semibold mb-2">Video ID Error</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Could not extract video ID from URL
                  </p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                    {section.videoUrl}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-muted/50 border-2 border-dashed rounded-lg overflow-hidden aspect-video mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-lg font-semibold mb-2">Video Not Available</p>
                  <p className="text-sm text-muted-foreground mb-1">Duration: {section.duration}</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    This video is still being configured. Please refresh the page or contact support if this persists.
                  </p>
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
                  Continue to Next
                </Button>
              )}
              {!isComplete && (
                <span className="text-xs text-muted-foreground">
                  Watch ≥90% to unlock Next
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel (dev only) */}
      <VideoDebugPanel
        currentTime={currentTime}
        maxWatched={maxWatchedRef.current}
        duration={duration}
        percentWatched={progress}
        isComplete={isComplete}
        sectionId={section.id}
        courseType={courseType}
        onRecheck={recheckCompletion}
      />
    </div>
  );
};

export default VideoPlayer;