import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import AutoAdvanceModal from "./AutoAdvanceModal";
import playerjs from "player.js";

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
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasCompletedRef = useRef(false);
  const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

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
        if (typeof seconds === 'number' && typeof duration === 'number' && duration > 0) {
          const percent = (seconds / duration) * 100;
          const newPercent = Math.max(percent, 0);
          setWatchedPercent((prev) => Math.max(prev, newPercent));
          if (percent >= 99.5 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onSectionCompleted?.(section.id);
            setShowAutoAdvance(true);
          }
        }
      } catch {}
    };

    if (player) {
      player.on('ready', () => {
        // Listen for events
        player.on('play', () => setIsPlaying(true));
        player.on('pause', () => setIsPlaying(false));
        player.on('timeupdate', handleTimeUpdate);
        player.on('ended', () => {
          setIsPlaying(false);
          setWatchedPercent(100);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onSectionCompleted?.(section.id);
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
            setShowAutoAdvance(true);
          }
        }
        if (d?.event === 'play' || d?.type === 'play') setIsPlaying(true);
        if (d?.event === 'pause' || d?.type === 'pause') setIsPlaying(false);
      };
      window.addEventListener('message', onMessage);
      messageListenerRef.current = onMessage;
    }

    return () => {
      if (messageListenerRef.current) {
        window.removeEventListener('message', messageListenerRef.current);
        messageListenerRef.current = null;
      }
    };
  }, [isActive, iframeUrl, section.id, onSectionCompleted]);


  const handleAutoAdvance = () => {
    setShowAutoAdvance(false);
    onNext?.();
  };

  const handleStayHere = () => {
    setShowAutoAdvance(false);
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
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            title={`Video section ${section.id}`}
          />
          {/* Overlay to block scrubber at bottom */}
          <div 
            className="absolute left-0 right-0 bottom-0 h-24 z-10 cursor-not-allowed"
            style={{ pointerEvents: 'auto' }}
            title="Scrubbing is disabled during training"
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
