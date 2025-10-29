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
  
  const hasCompletedRef = useRef(false);

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

  // Fetch signed iframe URL from edge function (or use provided iframe URL)
  useEffect(() => {
    if (!isActive) return;

    // If parent already provided an iframe URL, use it directly
    if (section.videoUrl && section.videoUrl.includes('iframe.mediadelivery.net')) {
      setVideoUrl(section.videoUrl);
      setLoading(false);
      return;
    }

    if (!videoId) {
      // Wait for parent to supply a valid URL/id
      return;
    }

    const fetchVideoUrl = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await supabase.functions.invoke("bunny-video", {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          body: { 
            action: 'getSignedUrl',
            libraryId,
            videoId,
            expiresInHours: 24,
          },
        });

        if (response.error) throw response.error;

        // Get iframe URL from Edge Function and render Bunny player
        const iframe = response.data?.iframeUrl || section.videoUrl;
        console.log('[VideoPlayer] Using Bunny iframe embed:', iframe);
        setVideoUrl(iframe);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to load video");
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [isActive, section.videoUrl, videoId, libraryId]);

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
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={`Video section ${section.id}`}
          />
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
