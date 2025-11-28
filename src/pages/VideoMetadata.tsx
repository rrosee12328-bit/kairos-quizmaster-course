import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import kairosLogo from "@/assets/kairos-logo.png";

interface BunnyVideo {
  guid: string;
  title: string;
  length: number;
  dateUploaded: string;
}

const VideoMetadata = () => {
  const [videos, setVideos] = useState<BunnyVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const videoIds = [
    "571ebbaa-2ffc-4050-8670-a3e9d0c1c4f5",
    "db2f0bdb-2977-47ea-ae37-38d776952152",
    "3a213a0e-1632-4600-89d6-b710eeac71be",
    "7d719c17-74cb-4c9a-b8b4-c98a065c4bcf",
    "6350df04-1780-4e87-8ae7-a37b54c0050a",
    "bb96462b-13f9-4197-b131-1ffa0e789772",
    "987a687c-03fa-4e28-b07a-dc42c722c5f4",
    "b94ee663-382f-4cfb-8b1d-73343b745638",
    "12fb0f82-c9ae-4d57-9577-a3328632d3c7"
  ];

  const fetchVideoMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const videoPromises = videoIds.map(async (videoId) => {
        const { data, error } = await supabase.functions.invoke('bunny-video', {
          body: { action: 'getVideo', videoId }
        });

        if (error) throw error;
        return data;
      });

      const results = await Promise.all(videoPromises);
      setVideos(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      console.error('Error fetching video metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minutes`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader isLoggedIn={!!user} />

      <div className="container mx-auto max-w-4xl p-8">
        <Card>
          <CardHeader>
            <CardTitle>Bunny.net Video Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchVideoMetadata} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Video Metadata
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {videos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Video Details:</h3>
                {videos.map((video, index) => (
                  <Card key={video.guid}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p><strong>Chapter {index + 1}:</strong></p>
                        <p><strong>Video ID:</strong> {video.guid}</p>
                        <p><strong>Title:</strong> {video.title}</p>
                        <p><strong>Duration:</strong> {formatDuration(video.length)}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(video.dateUploaded).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default VideoMetadata;
