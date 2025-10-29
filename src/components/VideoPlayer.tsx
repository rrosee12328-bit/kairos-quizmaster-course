import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Hls from "hls.js";
import AutoAdvanceModal from "./AutoAdvanceModal";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAutoAdvance, setShowAutoAdvance] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const hasCompletedRef = useRef(false);
  const maxWatchedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const snappingRef = useRef(false);
  const lastPingRef = useRef(0);
  const totalWatchTimeRef = useRef(0);
  const videoStartTimeRef = useRef<number | null>(null);

  const SNAP_TOL = 0.35;
  const JUMP = 1.25;
  const PING_EVERY = 10;

  // Extract Bunny.net video ID from URL
  const getBunnyVideoId = (url: string) => {
    const match = url.match(/embed\/\d+\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const videoId = getBunnyVideoId(section.videoUrl);
  const libraryIdMatch = section.videoUrl.match(/embed\/(\d+)\//);
  const libraryId = libraryIdMatch ? libraryIdMatch[1] : '510506';

  // Fetch direct HLS URL from edge function
  useEffect(() => {
    if (!isActive || !videoId) return;

    const fetchVideoUrl = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const response = await supabase.functions.invoke("bunny-video", {
          body: { 
            action: 'getSignedUrl',
            libraryId,
            videoId,
            expiresInHours: 24,
          },
        });

        if (response.error) throw response.error;

        // Get HLS URL from Bunny
        const hlsUrl = response.data?.signedUrl || response.data?.url || response.data;
        console.log('[VideoPlayer] Fetched HLS URL:', hlsUrl);
        setVideoUrl(hlsUrl);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to load video");
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [videoId, libraryId, isActive]);

  // Load HLS video with hls.js
  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Native HLS support (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      console.log('[VideoPlayer] Using native HLS');
    } 
    // hls.js for other browsers
    else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      console.log('[VideoPlayer] Using hls.js');
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
          setError("Video playback error");
        }
      });
    } else {
      setError("Your browser doesn't support video playback");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  // Anti-skip enforcement on native video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    const snapBack = (toTime: number) => {
      if (snappingRef.current) return;
      snappingRef.current = true;
      const playing = !video.paused && !video.ended;
      video.pause();
      video.currentTime = Math.max(0, toTime);
      if (playing) video.play().catch(() => {});
      setTimeout(() => {
        snappingRef.current = false;
      }, 120);
    };

    const handleLoadedMetadata = () => {
      console.log('[VideoPlayer] Video loaded, duration:', video.duration);
      maxWatchedRef.current = 0;
      lastTimeRef.current = 0;
      lastPingRef.current = 0;
      totalWatchTimeRef.current = 0;
      video.playbackRate = 1;
      video.controls = false;
      video.disablePictureInPicture = true;
    };

    const handleRateChange = () => {
      if (video.playbackRate !== 1) {
        video.playbackRate = 1;
        toast.error("Playback speed is locked to 1x");
      }
    };

    const handleSeeking = () => {
      const t = video.currentTime;
      if (t - maxWatchedRef.current > SNAP_TOL) {
        console.log('[VideoPlayer] Forward seek blocked:', t, 'max:', maxWatchedRef.current);
        toast.error("Forward seeking is disabled");
        snapBack(maxWatchedRef.current);
      }
    };

    const handleTimeUpdate = () => {
      const t = video.currentTime;
      const delta = t - lastTimeRef.current;

      if (!snappingRef.current) {
        const ahead = t - maxWatchedRef.current;
        if ((ahead > SNAP_TOL && delta > JUMP) || ahead > SNAP_TOL) {
          console.log('[VideoPlayer] Time jump detected, snapping back');
          toast.error("Forward seeking is disabled");
          snapBack(maxWatchedRef.current);
          return;
        }
      }

      if (t > maxWatchedRef.current) {
        maxWatchedRef.current = t;
      }
      lastTimeRef.current = t;

      // Update progress bar
      if (video.duration > 0) {
        setProgress((t / video.duration) * 100);
      }

      // Progress ping every 10 seconds
      if (Math.floor(t) - lastPingRef.current >= PING_EVERY && delta >= 0) {
        lastPingRef.current = Math.floor(t);
        supabase.functions.invoke("progress-video-complete", {
          body: { 
            course_id: courseType,
            section_id: section.id, 
            seconds_watched: Math.floor(t),
            has_quiz: section.has_quiz ?? false,
          },
        }).catch(console.error);
      }
    };

    const handleEnded = async () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;

      console.log('[VideoPlayer] Video ended, section:', section.id);

      // Stop watch time tracking
      if (videoStartTimeRef.current) {
        totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
        videoStartTimeRef.current = null;
      }

      try {
        const payload = {
          course_id: courseType,
          section_id: section.id,
          seconds_watched: totalWatchTimeRef.current,
          has_quiz: section.has_quiz ?? false,
        };

        const { data, error } = await supabase.functions.invoke("progress-video-complete", {
          body: payload,
        });

        if (error) {
          console.error("Error marking video complete:", error);
          return;
        }

        console.log('[VideoPlayer] Video completion posted:', data);
        onComplete?.();
        
        // Check if section is complete
        const sectionCompleted = data?.progress?.section_completed;
        if (sectionCompleted) {
          console.log('[VideoPlayer] Section completed, triggering modal');
          onSectionCompleted?.(section.id);
        }
        
        // Show auto-advance modal
        setShowAutoAdvance(true);
      } catch (error) {
        console.error("Error marking video complete:", error);
      }
    };

    const handlePlay = () => {
      console.log('[VideoPlayer] Video playing');
      setIsPlaying(true);
      if (!videoStartTimeRef.current) {
        videoStartTimeRef.current = Date.now();
      }
    };

    const handlePause = () => {
      console.log('[VideoPlayer] Video paused');
      setIsPlaying(false);
      if (videoStartTimeRef.current) {
        totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
        videoStartTimeRef.current = null;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ratechange", handleRateChange);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      // Save watch time before cleanup
      if (videoStartTimeRef.current) {
        totalWatchTimeRef.current += Math.floor((Date.now() - videoStartTimeRef.current) / 1000);
        videoStartTimeRef.current = null;
      }

      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ratechange", handleRateChange);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [section.id, courseType, isActive, onComplete, onSectionCompleted]);

  // Block keyboard seek shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const seekKeys = [
        "arrowright", "arrowleft", "l", "j", "k",
        ".", ",", ">", "<", "home", "end",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        " " // space bar
      ];
      
      if (seekKeys.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isActive]);

  const handleAutoAdvance = () => {
    setShowAutoAdvance(false);
    onNext?.();
  };

  const handleStayHere = () => {
    setShowAutoAdvance(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
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

  if (error || !videoUrl) {
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
      <CardContent className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            preload="metadata"
            disablePictureInPicture
            controls={false}
            controlsList="nodownload noplaybackrate noremoteplayback"
          />
          {/* Interaction shield to block native gestures/seeking */}
          <div
            className="absolute inset-0 z-10 cursor-not-allowed select-none"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-hidden
            title="Seeking is disabled - you must watch the video to progress"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={togglePlay} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            Forward seeking disabled
          </span>
        </div>

        <AutoAdvanceModal
          isOpen={showAutoAdvance}
          sectionTitle={section.title}
          onAdvance={handleAutoAdvance}
          onCancel={handleStayHere}
        />
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
