import { useState, useEffect, useRef, useMemo } from "react";
import { SkipForward, CheckCircle2, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import VideoDebugPanel from "./VideoDebugPanel";
import { useToast } from "@/hooks/use-toast";
interface VideoPlayerProps {
  section: {
    id: number;
    title: string;
    videoUrl: string;
    duration: string;
    has_quiz?: boolean;
  };
  courseType?: string;
  isActive?: boolean;
  onComplete: () => void;
  onNext: () => void;
  // Instrumentation callbacks (dev-only)
  onLocal90Reached?: (reached: boolean) => void;
  onPostStatus?: (status: number | null) => void;
  // Gating state up to parent
  onServerCompletedChange?: (val: boolean) => void;
  onGraceTimerDoneChange?: (val: boolean) => void;
  // Section completion callback
  onSectionCompleted?: (sectionId: number) => void;
}

const VideoPlayer = ({ 
  section, 
  courseType, 
  isActive = true, 
  onComplete, 
  onNext,
  onLocal90Reached,
  onPostStatus,
  onServerCompletedChange,
  onGraceTimerDoneChange,
  onSectionCompleted,
}: VideoPlayerProps) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false); // nextEnabled gating
  const [reloadTick, setReloadTick] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Debug/instrumentation
  const [debugUserId, setDebugUserId] = useState<string | null>(null);
  const [localCompleted, setLocalCompleted] = useState(false);
  const [serverCompleted, setServerCompleted] = useState(false);
  const [postStatus, setPostStatus] = useState<number | null>(null);
  const [graceTimerDone, setGraceTimerDone] = useState(false);

  const [autoAdvance] = useState(false); // Default: no auto-advance
  const [showCompleteModal, setShowCompleteModal] = useState(false);
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
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Anti-skip constants
  const GRACE = 5; // seconds ahead allowed
  const FORWARD_GRACE = 2; // strict forward seek tolerance (seconds)
  const HYST = 1.5; // hysteresis tolerance
  const CORRECTION_COOLDOWN_MS = 1200;
  const lastCorrectionAtRef = useRef(0);
  const isCorrectingRef = useRef(false);
  const lastPlayingStateRef = useRef(false);
  const suppressNextTimeupdateRef = useRef(false);
  const lastPlaybackTimeRef = useRef(0);
  // Suppress anti-skip corrections during initial startup per section
  const startupSuppressUntilRef = useRef(0);
  // Queue a play request if user clicks before player is ready
  const queuedPlayRef = useRef(false);
  // Format seconds to M:SS for display
  const fmt = (s: number) => {
    const v = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(v / 60);
    const sec = String(v % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };
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
  const iframeSrc = useMemo(() => {
    if (overrideUrl) {
      // Keep the URL stable; only change when we explicitly refresh (reloadTick)
      const u = new URL(overrideUrl);
      u.searchParams.set('rememberPosition', 'false');
      u.searchParams.set('playsinline', 'true');
      u.searchParams.set('playerjs', '1');
      u.searchParams.set('rt', String(reloadTick));
      return u.toString();
    }
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
        u.searchParams.set('rt', String(reloadTick));
        return u.toString();
      } catch {
        return uStr; // fallback to provided URL
      }
    }
    // Fallback (shouldn't be needed if signed URL exists)
    return videoId
      ? `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&playsinline=true&showSpeed=false&rememberPosition=false&playerjs=1&rt=${reloadTick}`
      : '';
  }, [overrideUrl, section.videoUrl, videoId, libraryId, reloadTick]);

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
    // Capture current user id for debug panel
    supabase.auth.getUser().then(({ data }) => setDebugUserId(data.user?.id ?? null));
  }, []);

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
                try { window.clearInterval(bootstrapPoll); } catch {}
                if (!localCompleted) {
                  setLocalCompleted(true);
                  onLocal90Reached?.(true);
                  console.log('[FLOW] LOCAL_90 (from bootstrap)');
                }
                handleCompletionTrigger();
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
          iframeAttached: !!iframeRef.current,
        });
        // Reset on new section - STRICT RESET
        setProgress(0);
        setIsComplete(false);
        isCompleteRef.current = false;
        completionPostedRef.current = false;
        maxWatchedRef.current = 0;
        videoStartTimeRef.current = null;
        totalWatchTimeRef.current = 0;
        lastTimeUpdateRef.current = 0;
        lastPlaybackTimeRef.current = 0;
        lastCorrectionAtRef.current = 0;
        // Shorter startup suppression to enforce restrictions faster
        startupSuppressUntilRef.current = Date.now() + 3000;
        
        // Force video to start at 0 with retry to overcome Bunny caching
        const forceStart = () => {
          try { 
            p.setCurrentTime(0);
            // Verify it actually reset
            setTimeout(() => {
              p.getCurrentTime((t: number) => {
                if (t > 5) {
                  console.log('[Bunny] FORCE RESET - Position still high, retrying', t);
                  p.setCurrentTime(0);
                }
              });
            }, 500);
          } catch {}
        };
        forceStart();

        // If user clicked play before ready, honor it now
        if (queuedPlayRef.current) {
          try { p.play?.(); } catch {}
          queuedPlayRef.current = false;
        }

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

        // If server already marks this section completed (refresh), enable Next immediately
        recheckCompletion();

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
                try { window.clearInterval(completionPoll); } catch {}
                if (!localCompleted) {
                  setLocalCompleted(true);
                  onLocal90Reached?.(true);
                  console.log('[FLOW] LOCAL_90 (from poll end)');
                }
                handleCompletionTrigger();
              }
            });
          } catch {}
        }, 500);
        
        const clearOnComplete = () => {
          try { window.clearInterval(completionPoll); } catch {}
        };
        p.on('ended', clearOnComplete);

        // Watchdog disabled per request; relying on 'seeked' and guarded 'timeupdate' clamps only.

        // Rate guard: prevent playback speed > 1.25x
        p.on('ratechange', () => {
          if (!isMounted) return;
          try {
            p.getPlaybackRate?.((rate: number) => {
              console.log('[Bunny] EVENT: ratechange', { rate });
              if (rate > 1.25) {
                console.log('[Bunny] RATE GUARD: Preventing speed-run', {
                  attemptedRate: rate,
                  enforcedRate: 1.25,
                });
                try {
                  p.setPlaybackRate?.(1.25);
                  toast({
                    title: 'Max speed 1.25×',
                    description: 'To ensure proper learning, videos cannot be played faster than 1.25×',
                    duration: 2000,
                  });
                } catch {}
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

        const now = Date.now();
        // Throttled logging (every 2 seconds)
        if (now - lastTimeUpdateRef.current > 2000) {
          console.log('[Bunny] EVENT: timeupdate (throttled)', {
            current: current.toFixed(2),
            maxWatched: maxWatchedRef.current.toFixed(2),
            percent: percentRaw,
          });
          lastTimeUpdateRef.current = now;
        }

        // Update UI state for debug panel
        setCurrentTime(current);
        setDuration(dur);

        // During startup suppression window, ONLY sync maxWatched if we're near the start
        // This prevents Bunny's position caching from inflating maxWatched
        if (Date.now() < startupSuppressUntilRef.current) {
          // Only allow maxWatched to grow if we're in the first 10 seconds
          if (current < 10) {
            maxWatchedRef.current = Math.max(maxWatchedRef.current, current);
          } else {
            // Beyond 10 seconds during startup means Bunny cached position - clamp it
            console.log('[Bunny] STARTUP: Detected cached position, forcing reset', { current, maxWatched: maxWatchedRef.current });
            try { p.setCurrentTime(0); } catch {}
          }
        }

        // Skip logic during suppression window after a clamp correction
        if (suppressNextTimeupdateRef.current) {
          lastPlaybackTimeRef.current = current;
          return;
        }

        // Enforce anti-skip in case 'seeked' didn't fire
        if (Date.now() >= startupSuppressUntilRef.current && !isCorrectingRef.current) {
          const allowedEnd = maxWatchedRef.current + FORWARD_GRACE;
          const hystWindow = allowedEnd + HYST;
          const delta = current - lastPlaybackTimeRef.current;

          // Large jump forward detected (user seek) - clamp aggressively
          if (delta > 0.5) {
            if (current > hystWindow && now - lastCorrectionAtRef.current >= CORRECTION_COOLDOWN_MS) {
              console.log('[Bunny] TIMEUPDATE CLAMP', { current, maxWatched: maxWatchedRef.current, snappingTo: allowedEnd });
              isCorrectingRef.current = true;
              suppressNextTimeupdateRef.current = true;
              lastCorrectionAtRef.current = now;
              try { 
                p.setCurrentTime(allowedEnd);
              } catch {}
              setTimeout(() => {
                isCorrectingRef.current = false;
                suppressNextTimeupdateRef.current = false;
              }, 400);
              lastPlaybackTimeRef.current = allowedEnd;
              return;
            }
            if (current > allowedEnd) {
              // Tolerate small overshoot but do not extend maxWatched on a jump
              lastPlaybackTimeRef.current = current;
              return;
            }
          }
        }

        // Only increase maxWatched on natural forward playback (not during correction cooldown)
        const inCooldown = now - lastCorrectionAtRef.current < CORRECTION_COOLDOWN_MS;
        const delta = current - lastPlaybackTimeRef.current;
        if (!inCooldown && !isCorrectingRef.current && delta > 0 && delta <= 0.5) {
          // Keep maxWatched in sync with actual playback to avoid false snapbacks
          maxWatchedRef.current = Math.max(maxWatchedRef.current, current);
        }
        lastPlaybackTimeRef.current = current;

        // Compute percent
        // Compute percent
        let pct: number | null = null;
        if (percentRaw !== null) {
          pct = percentRaw <= 1 ? Math.round(percentRaw * 100) : Math.round(percentRaw);
        } else if (dur > 0) {
          pct = Math.min(100, Math.round((current / dur) * 100));
        }

        if (pct !== null) {
          setProgress(pct);
          const durSafe = dur || 0;
          const ninetyReached = durSafe > 0 && (maxWatchedRef.current / durSafe) >= 0.9;
          if (ninetyReached && !localCompleted) {
            setLocalCompleted(true);
            onLocal90Reached?.(true);
            // Post to server and wait for confirmation before enabling Next
            handleCompletionTrigger();
          }
        }
      });

      p.on('seeked', () => {
        if (!isMounted || isCorrectingRef.current) return;
        if (Date.now() < startupSuppressUntilRef.current) return;

        p.getCurrentTime((t: number) => {
          const now = Date.now();
          // Strict grace: only allow limited forward seeking
          const allowedEnd = maxWatchedRef.current + FORWARD_GRACE;
          const hystWindow = allowedEnd + HYST;

          console.log('[Bunny] EVENT: seeked', {
            seekedTo: t.toFixed(2),
            maxWatched: maxWatchedRef.current.toFixed(2),
            allowedEnd: allowedEnd.toFixed(2),
            hystWindow: hystWindow.toFixed(2),
          });

          // Cooldown check
          if (now - lastCorrectionAtRef.current < CORRECTION_COOLDOWN_MS) {
            console.log('[Bunny] SEEK: In cooldown, skipping correction');
            return;
          }

          // Ignore backward seeks
          if (t <= maxWatchedRef.current) return;

          // Tolerate small overshoot within hysteresis window
          if (t <= hystWindow) {
            console.log('[Bunny] SEEK: SKIP tolerated (within hysteresis)');
            return;
          }

          // Clamp without blinking
          console.log('[Bunny] SEEK: CORRECT (snapback)', { seekedTo: t, snappingTo: allowedEnd });
          isCorrectingRef.current = true;
          suppressNextTimeupdateRef.current = true;
          lastCorrectionAtRef.current = now;
          try {
            p.setCurrentTime(allowedEnd);
          } catch {}
          setTimeout(() => {
            isCorrectingRef.current = false;
            suppressNextTimeupdateRef.current = false;
          }, 400);
        });
      });

      p.on('ended', () => {
        if (!isMounted) return;
        console.log('[Bunny] EVENT: ended', {
          sectionId: section.id,
          totalWatchTime: totalWatchTimeRef.current,
        });
        setIsPlaying(false);
        // Stop watch time tracking
        if (videoStartTimeRef.current) {
          totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
          videoStartTimeRef.current = null;
        }
        // Trigger completion flow (no auto-advance)
        handleCompletionTrigger();
        
        // Trigger modal only after video ends
        if (completionPostedRef.current) {
          console.log('[FLOW] VIDEO_ENDED - Triggering section completion modal');
          onSectionCompleted?.(section.id);
        }
      });

      p.on('play', () => {
        if (!isMounted) return;
        console.log('[Bunny] PLAY_CLICK - Video playing');
        lastPlayingStateRef.current = true;
        setIsPlaying(true);
        if (!videoStartTimeRef.current) {
          videoStartTimeRef.current = Date.now();
          console.log('[Bunny] EVENT: play (started watching)', { sectionId: section.id });
        }
        // Sync maxWatched with current time at play start to avoid early corrections
        try {
          p.getCurrentTime((t: number) => {
            maxWatchedRef.current = Math.max(maxWatchedRef.current, t);
            lastPlaybackTimeRef.current = t;
          });
        } catch {}
      });

      p.on('pause', () => {
        if (!isMounted) return;
        console.log('[Bunny] PAUSE_CLICK - Video paused');
        lastPlayingStateRef.current = false;
        setIsPlaying(false);
        if (videoStartTimeRef.current) {
          totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
          videoStartTimeRef.current = null;
        }
        console.log('[Bunny] EVENT: pause', { 
          sectionId: section.id, 
          totalWatchTime: totalWatchTimeRef.current 
        });
      });
    };

    setup();
    
    // Keyboard seek prevention (capture) while playing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive || !lastPlayingStateRef.current) return;

      const blockKeys = ['0','1','2','3','4','5','6','7','8','9','ArrowRight'];
      if (blockKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Bunny] KEYBOARD: Blocked seek key', { key: e.key });
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);

      return () => {
      isMounted = false;
      document.removeEventListener('keydown', handleKeyDown, true);
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

  // Poll server to confirm completion (up to 10 attempts = ~5s)
  const waitForServerCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !courseType) return false;
      
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase
          .from('course_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('course_type', courseType)
          .eq('section_id', section.id)
          .maybeSingle();
        
        console.log('[FLOW] VERIFY_AFTER_POST', { 
          attempt: i + 1, 
          userId: user.id, 
          courseId: courseType, 
          sectionId: section.id, 
          found: !!data?.completed 
        });
        
        if (data?.completed) return true;
        await new Promise((r) => setTimeout(r, 500));
      }
      return false;
    } catch (e) {
      console.error('[VideoPlayer] waitForServerCompletion error', e);
      return false;
    }
  };

  const handleCompletionTrigger = async () => {
    if (completionPostedRef.current) return;
    completionPostedRef.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[FLOW] POST_ERROR: No authenticated user');
        return;
      }

      const payload = {
        course_id: courseType,
        section_id: section.id,
        seconds_watched: totalWatchTimeRef.current,
        has_quiz: section.has_quiz ?? false,
      };
      
      console.log('[FLOW] POST_SENT', { 
        userId: user?.id, 
        courseId: courseType, 
        sectionId: section.id, 
        payload 
      });
      
      // Get a fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('[FLOW] POST_ERROR: No session token available');
        setPostStatus(401);
        onPostStatus?.(401);
        return;
      }

      const { data, error } = await supabase.functions.invoke('progress-video-complete', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        const status = (error as any)?.context?.status ?? 500;
        setPostStatus(status);
        onPostStatus?.(status);
        console.error('[FLOW] POST_ERROR', { status, message: error.message, error });
        return;
      }
      
      setPostStatus(200);
      onPostStatus?.(200);
      console.log('[FLOW] POST_OK', { courseId: courseType, sectionId: section.id, data });
      
      // Check if section is complete (video done and no quiz, or quiz already passed)
      const progress = data?.progress;
      if (progress?.section_completed) {
        console.log('[FLOW] SECTION_COMPLETED - Server confirmed, waiting for video ended event to show modal');
        // DON'T call onSectionCompleted here - wait for 'ended' event
      }
    } catch (e: any) {
      setPostStatus(500);
      onPostStatus?.(500);
      console.error('[FLOW] POST_ERROR', e?.message || e);
      return;
    }

    // Poll for server confirmation
    const ok = await waitForServerCompletion();
    if (ok) {
      setServerCompleted(true);
      onServerCompletedChange?.(true);
      console.log('[FLOW] SERVER_CONFIRMED', { courseId: courseType, sectionId: section.id });
      
      setTimeout(() => {
        setGraceTimerDone(true);
        onGraceTimerDoneChange?.(true);
        console.log('[FLOW] GRACE_DONE');
        setIsComplete(true);
        console.log('[FLOW] NEXT_ENABLED = true (disabled=false)');
        onCompleteRef.current?.();
        showCompletionNotification();
      }, 2000);
    } else {
      console.warn('[FLOW] SERVER_CONFIRM_TIMEOUT', { courseId: courseType, sectionId: section.id });
    }
  };

  const showCompletionNotification = () => {
    // Open modal; navigation only on user click
    setShowCompleteModal(true);
  };

  const recheckCompletion = async () => {
    if (!courseType) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('course_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('course_type', courseType)
        .eq('section_id', section.id)
        .maybeSingle();

      console.log('[FLOW] RECHECK', { 
        userId: user.id, 
        courseId: courseType, 
        sectionId: section.id, 
        found: !!data?.completed, 
        error 
      });

      if (data?.completed) {
        setServerCompleted(true);
        onServerCompletedChange?.(true);
        console.log('[FLOW] SERVER_CONFIRMED (from recheck)');
        if (!isComplete) {
          setTimeout(() => {
            setGraceTimerDone(true);
            onGraceTimerDoneChange?.(true);
            console.log('[FLOW] GRACE_DONE (from recheck)');
            setIsComplete(true);
            console.log('[FLOW] NEXT_ENABLED (from recheck)');
            onCompleteRef.current?.();
          }, 2000);
        }
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
                key={`${videoId}`}
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
              {/* Scrubber blocker: prevent all interactions with the progress bar */}
              <div
                className="absolute inset-x-0 bottom-0 h-6 z-10 cursor-not-allowed select-none"
                style={{ pointerEvents: 'auto', userSelect: 'none', touchAction: 'none' }}
                aria-hidden
                title="Seeking is disabled - you must watch the video to progress"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onPointerMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrag={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
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
        userId={debugUserId}
        localCompleted={localCompleted}
        serverCompleted={serverCompleted}
        postStatus={postStatus}
        graceTimerDone={graceTimerDone}
      />
    </div>
  );
};

export default VideoPlayer;