import { useState } from "react";
import { Play, Pause, Volume2, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Simulate progress updates
    if (!isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onComplete();
            return 100;
          }
          return prev + 1;
        });
        setCurrentTime(prev => {
          const [min, sec] = prev.split(':').map(Number);
          const totalSec = min * 60 + sec + 1;
          return `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
        });
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Section {section.id}: {section.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Video Player Mockup */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-lg">Security Training Video</p>
                <p className="text-sm opacity-80">Duration: {section.duration}</p>
              </div>
            </div>
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-white text-sm">{currentTime}</span>
                  <Progress value={progress} className="flex-1" />
                  <span className="text-white text-sm">{section.duration}</span>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Progress and Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Progress: {Math.round(progress)}% complete
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Replay
              </Button>
              {progress === 100 && (
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