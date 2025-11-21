import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import AutoAdvanceModal from "./AutoAdvanceModal";
import playerjs from "player.js";
import { useVideoResume } from "@/hooks/useVideoResume";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { toast } from "sonner";

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
  onSectionCompleted?: (sectionId: number) => void;
  // Legacy props for backward compatibility (not used in new implementation)
  onLocal90Reached?: (reached: boolean) => void;
  onPostStatus?: (status: number | null) => void;
  onServerCompletedChange?: (val: boolean) => void;
  onGraceTimerDoneChange?: (val: boolean) => void;
}

const VideoPlayer = ({ 
  section, 
  courseType, 
  isActive = true, 
  onComplete, 
  onNext,
  onSectionCompleted,
}: VideoPlayerProps) => {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAutoAdvance, setShowAutoAdvance] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [furthestWatchedTime, setFurthestWatchedTime] = useState(0);
  
  const { savedPosition } = useVideoResume(courseType || '', section.id);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasCompletedRef = useRef(false);
  const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const playerInstanceRef = useRef<any>(null);
  const lastSavedPositionRef = useRef<number>(0);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const lastSeekTimeRef = useRef<number>(0);

  // Extract Bunny.net identifiers from either iframe or HLS URL
  const extractIdsFromUrl = (url: string) => {
    // iframe.mediadelivery.net/embed/{libraryId}/{videoId}
    const iframeMatch = url.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i);
    if (iframeMatch) {
      return { libraryId: iframeMatch[1], videoId: iframeMatch[2] };
    }
    // generic embed/{libraryId}/{videoId}
    const embedMatch = url.match(/embed\/(\d+)\/([a-f0-9-]+)/i);
    if (embedMatch) {
      return { libraryId: embedMatch[1], videoId: embedMatch[2] };
    }
    // HLS signed URL: https://{cdn}/{videoId}/playlist.m3u8?token=...&expires=...
    const hlsMatch = url.match(/https?:\/\/[^/]+\/([a-f0-9-]+)\/playlist\.m3u8/i);
    if (hlsMatch) {
      return { libraryId: undefined as unknown as string, videoId: hlsMatch[1] };
    }
    return { libraryId: undefined as unknown as string, videoId: null as unknown as string };
  };

  const { videoId: extractedVideoId, libraryId: extractedLibraryId } = extractIdsFromUrl(section.videoUrl || '');
  const videoId = extractedVideoId;
  const libraryId = extractedLibraryId || '510506';

  // Save video position function (shared across effects)
  const saveVideoPosition = async (seconds: number) => {
    if (!courseType || seconds < 1) return;
    
    // Don't save if position hasn't changed significantly (at least 2 seconds difference)
    if (Math.abs(seconds - lastSavedPositionRef.current) < 2) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      lastSavedPositionRef.current = seconds;
      
        await supabase
          .from('course_progress')
          .update({
            last_video_position_seconds: Math.floor(seconds),
            last_updated_at: new Date().toISOString()
          } as any)
          .eq('user_id', user.id)
          .eq('course_type', courseType)
          .eq('section_id', section.id);

      console.log('[VideoPlayer] Saved position:', Math.floor(seconds));
    } catch (err) {
      console.error('[VideoPlayer] Error saving position:', err);
    }
  };

  // Fetch signed iframe URL from Bunny.net (skip if already signed)
  useEffect(() => {
    if (!isActive || !videoId) return;

    // Skip fetching if URL already has token & expires (already signed)
    const urlHasToken = section.videoUrl?.includes('token=') && section.videoUrl?.includes('expires=');
    if (urlHasToken) {
      console.log('[VideoPlayer] Using pre-signed URL:', section.videoUrl);
      setIframeUrl(section.videoUrl);
      setLoading(false);
      return;
    }

    const fetchIframeUrl = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke('bunny-video', {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          body: {
            action: 'getSignedUrl',
            libraryId,
            videoId,
            expiresInHours: 24
          }
        });

        if (error) throw error;
        
        // Use iframe URL from Bunny
        const url = data?.iframeUrl || section.videoUrl;
        console.log('[VideoPlayer] Using Bunny iframe URL:', url);
        setIframeUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('[VideoPlayer] Error fetching iframe URL:', err);
        setError('Failed to load video');
        setLoading(false);
      }
    };

    fetchIframeUrl();
  }, [isActive, videoId, libraryId, section.videoUrl]);

  // Auto-save position every 10 seconds
  useEffect(() => {
    if (!isActive || !isPlaying) return;

    saveIntervalRef.current = setInterval(() => {
      if (currentTimeRef.current > 0) {
        saveVideoPosition(currentTimeRef.current);
      }
    }, 10000); // Every 10 seconds

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [isActive, isPlaying, courseType, section.id]);

  // Save position on window blur (user switching tabs/windows)
  useEffect(() => {
    if (!isActive) return;

    const handleBlur = () => {
      if (currentTimeRef.current > 0) {
        console.log('[VideoPlayer] Window blur - saving position');
        saveVideoPosition(currentTimeRef.current);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isActive, courseType, section.id]);

  // Wire Player.js to the Bunny iframe for reliable events
  useEffect(() => {
    if (!isActive || !iframeUrl || !iframeRef.current) return;

    const iframe = iframeRef.current;
    let player: any;

    try {
      player = new (playerjs as any).Player(iframe);
    } catch (e) {
      console.warn('[VideoPlayer] Player.js init failed, falling back to message listener');
    }

    const handleTimeUpdate = (payload: any) => {
      try {
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const seconds = data?.seconds ?? data?.currentTime;
        const duration = data?.duration ?? data?.length;
        
        // Store current time and duration in refs and enforce no fast-forward beyond furthest watched
        if (typeof seconds === 'number') {
          const prevTime = currentTimeRef.current;
          const prevFurthest = furthestWatchedTime;
          
          currentTimeRef.current = seconds;
          
          // Update furthest watched (state + ref) when user truly progresses
          if (seconds > prevFurthest) {
            setFurthestWatchedTime(seconds);
          }
          
          const jumpedForward = prevTime > 0 && seconds > prevTime + 2;
          const attemptedBeyondFurthest = seconds > prevFurthest + 1;
          
          if (jumpedForward && attemptedBeyondFurthest && player) {
            console.log('[VideoPlayer] Prevented forward seek beyond watched:', { 
              attempted: seconds, 
              furthest: prevFurthest 
            });
            try {
              player.setCurrentTime(prevFurthest);
            } catch (err) {
              console.error('[VideoPlayer] Error preventing forward seek:', err);
            }
          }
        }
        if (typeof duration === 'number') durationRef.current = duration;
        
        if (typeof seconds === 'number' && typeof duration === 'number' && duration > 0) {
          const percent = (seconds / duration) * 100;
          const newPercent = Math.max(percent, 0);
          setWatchedPercent((prev) => Math.max(prev, newPercent));
          
          // Save watch time to database every 10%
          if (courseType && Math.floor(newPercent) % 10 === 0 && Math.floor(newPercent) > 0) {
            saveWatchProgress(seconds, duration);
          }
          
          if (percent >= 99.9 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            saveWatchProgress(seconds, duration, true);
            onSectionCompleted?.(section.id);
            setShowAutoAdvance(true);
          }
        }
      } catch {}
    };

    const saveWatchProgress = async (seconds: number, duration: number, completed = false) => {
      if (!courseType) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.functions.invoke('progress-video-complete', {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          body: {
            course_id: courseType,
            section_id: section.id,
            seconds_watched: Math.floor(seconds),
            total_duration: Math.floor(duration),
            has_quiz: section.has_quiz || false
          }
        });
      } catch (err) {
        console.error('[VideoPlayer] Error saving watch progress:', err);
      }
    };

    if (player) {
      playerInstanceRef.current = player; // Store for later use
      
      player.on('ready', () => {
        // Initialize furthest watched to saved position
        if (savedPosition > 0) {
          setFurthestWatchedTime(savedPosition);
        }
        
        // Show resume prompt if there's a saved position
        if (savedPosition > 10) {
          setShowResumePrompt(true);
          toast('Resume from where you left off?', {
            description: `Jump to ${Math.floor(savedPosition / 60)}:${String(Math.floor(savedPosition % 60)).padStart(2, '0')}`,
            action: {
              label: 'Resume',
              onClick: () => {
                try {
                  player.setCurrentTime(savedPosition);
                  player.play();
                  setShowResumePrompt(false);
                } catch (err) {
                  console.error('[VideoPlayer] Error seeking to saved position:', err);
                }
              }
            },
            cancel: {
              label: 'Start Over',
              onClick: () => setShowResumePrompt(false)
            },
            duration: 10000
          });
        }
        
        // Listen for events
        player.on('play', () => setIsPlaying(true));
        player.on('pause', () => {
          setIsPlaying(false);
          // Save position on pause
          if (currentTimeRef.current > 0) {
            saveVideoPosition(currentTimeRef.current);
          }
        });
        player.on('timeupdate', handleTimeUpdate);
        player.on('ended', () => {
          setIsPlaying(false);
          setWatchedPercent(100);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onSectionCompleted?.(section.id);
            
            // Pause the video when showing the modal
            try {
              player.pause();
              console.log('[VideoPlayer] Paused video on completion');
            } catch (err) {
              console.error('[VideoPlayer] Error pausing:', err);
            }
            
            setShowAutoAdvance(true);
          }
        });
      });
    } else {
      // Fallback: generic message listener (best-effort)
      const allowedOrigin = (() => {
        try { return new URL(iframeUrl).origin; } catch { return undefined; }
      })();
      const onMessage = (event: MessageEvent) => {
        if (allowedOrigin && event.origin !== allowedOrigin) return;
        const d = event.data;
        if (d?.event === 'timeupdate' || d?.type === 'timeupdate' || (d?.seconds && d?.duration)) {
          handleTimeUpdate(d.data || d);
        }
        if (d?.event === 'ended' || d?.type === 'ended') {
          setIsPlaying(false);
          setWatchedPercent(100);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onSectionCompleted?.(section.id);
            
            // Try to pause via postMessage (fallback method)
            try {
              iframe?.contentWindow?.postMessage({ method: 'pause' }, '*');
              console.log('[VideoPlayer] Sent pause message on completion (fallback)');
            } catch (err) {
              console.error('[VideoPlayer] Error sending pause message:', err);
            }
            
            setShowAutoAdvance(true);
          }
        }
        if (d?.event === 'play' || d?.type === 'play') setIsPlaying(true);
        if (d?.event === 'pause' || d?.type === 'pause') {
          setIsPlaying(false);
          // Save position on pause (fallback)
          if (currentTimeRef.current > 0) {
            saveVideoPosition(currentTimeRef.current);
          }
        }
      };
      window.addEventListener('message', onMessage);
      messageListenerRef.current = onMessage;
    }

    return () => {
      // Clear auto-save interval
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      
      if (messageListenerRef.current) {
        window.removeEventListener('message', messageListenerRef.current);
        messageListenerRef.current = null;
      }
      // Clean up player instance ref
      playerInstanceRef.current = null;
    };
  }, [isActive, iframeUrl, section.id, onSectionCompleted]);


  const handleAutoAdvance = () => {
    console.log('[VideoPlayer] User advancing to next section');
    setShowAutoAdvance(false);
    onNext?.();
  };

  const handleStayHere = () => {
    console.log('[VideoPlayer] User staying on current section');
    setShowAutoAdvance(false);
    
    // Ensure video controls are responsive after dismissing modal
    // No need to unpause - user can manually play if they want
  };

  const handleCompleteSection = () => {
    if (!hasCompletedRef.current) {
      console.log('[VideoPlayer] User completed section, showing countdown');
      hasCompletedRef.current = true;
      onSectionCompleted?.(section.id);
      setShowAutoAdvance(true);
    }
  };

  if (!isActive) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Section {section.id}: {section.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading video...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !iframeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Section {section.id}: {section.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full aspect-video bg-destructive/10 rounded-xl flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-destructive font-medium mb-2">
                {error || "Failed to load video"}
              </p>
              <p className="text-sm text-muted-foreground">
                Please refresh the page or contact support if the issue persists.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section {section.id}: {section.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video group">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
            loading="eager"
            title={`Video section ${section.id}`}
          />
        </div>

        <AutoAdvanceModal
          isOpen={showAutoAdvance}
          sectionTitle={section.title}
          onAdvance={handleAutoAdvance}
          onCancel={handleStayHere}
          countdownSeconds={10}
        />
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
