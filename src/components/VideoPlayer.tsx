import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAutoAdvance, setShowAutoAdvance] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCompletedRef = useRef(false);
  const maxWatchedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isSnappingRef = useRef(false);

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

  // Use direct MP4 URL from Bunny CDN
  useEffect(() => {
    if (!isActive) return;

    if (!videoId) {
      return;
    }

    // Use direct MP4 URL (no authentication needed for public videos)
    const mp4Url = `https://vz-${libraryId}.b-cdn.net/${videoId}/play_720p.mp4`;
    console.log('[VideoPlayer] Using direct MP4 URL:', mp4Url);
    setVideoUrl(mp4Url);
    setLoading(false);
  }, [isActive, videoId, libraryId]);

  // Setup video player with MP4 URL
  useEffect(() => {
    if (!videoUrl || !videoRef.current || !isActive) return;

    const video = videoRef.current;
    
    // Set MP4 source directly
    video.src = videoUrl;
    console.log('[VideoPlayer] Video source set');

    // Anti-skip: Reset maxWatched on new video
    maxWatchedRef.current = 0;
    lastTimeRef.current = 0;

    return () => {
      video.src = '';
    };
  }, [videoUrl, isActive]);

  // Anti-skip logic
  useEffect(() => {
    if (!videoRef.current || !isActive) return;

    const video = videoRef.current;
    const SNAP_TOLERANCE = 0.5;
    const JUMP_THRESHOLD = 2;

    const snapBack = (toTime: number) => {
      if (isSnappingRef.current) return;
      isSnappingRef.current = true;
      
      const wasPlaying = !video.paused && !video.ended;
      video.pause();
      video.currentTime = Math.max(0, toTime);
      
      if (wasPlaying) {
        video.play().catch(() => {});
      }
      
      setTimeout(() => {
        isSnappingRef.current = false;
      }, 150);
    };

    const handleLoadedMetadata = () => {
      maxWatchedRef.current = 0;
      lastTimeRef.current = 0;
      video.playbackRate = 1;
    };

    const handleRateChange = () => {
      if (video.playbackRate !== 1) {
        video.playbackRate = 1;
      }
    };

    const handleSeeking = () => {
      const currentTime = video.currentTime;
      const ahead = currentTime - maxWatchedRef.current;
      
      if (ahead > SNAP_TOLERANCE) {
        console.log('[VideoPlayer] Forward seek blocked:', { currentTime, maxWatched: maxWatchedRef.current });
        snapBack(maxWatchedRef.current);
      }
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const delta = currentTime - lastTimeRef.current;

      if (!isSnappingRef.current) {
        const ahead = currentTime - maxWatchedRef.current;
        
        if ((ahead > SNAP_TOLERANCE && delta > JUMP_THRESHOLD) || ahead > SNAP_TOLERANCE) {
          console.log('[VideoPlayer] Forward jump blocked:', { currentTime, maxWatched: maxWatchedRef.current, delta });
          snapBack(maxWatchedRef.current);
          return;
        }
      }

      if (currentTime > maxWatchedRef.current) {
        maxWatchedRef.current = currentTime;
      }
      
      lastTimeRef.current = currentTime;
    };

    const handleEnded = () => {
      console.log('[VideoPlayer] Video ended, showing countdown');
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onSectionCompleted?.(section.id);
        setShowAutoAdvance(true);
      }
    };

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowright', 'arrowleft', ' ', 'l', 'j', 'k'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, section.id, onSectionCompleted]);

  const handleAutoAdvance = () => {
    setShowAutoAdvance(false);
    onNext?.();
  };

  const handleStayHere = () => {
    setShowAutoAdvance(false);
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
      <CardContent>
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            playsInline
            onContextMenu={(e) => e.preventDefault()}
            title={`Video section ${section.id}`}
          />
        </div>

        <AutoAdvanceModal
          isOpen={showAutoAdvance}
          sectionTitle={section.title}
          onAdvance={handleAutoAdvance}
          onCancel={handleStayHere}
          countdownSeconds={5}
        />
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
