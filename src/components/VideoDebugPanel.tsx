import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, RefreshCw } from "lucide-react";

interface VideoDebugPanelProps {
  currentTime: number;
  maxWatched: number;
  duration: number;
  percentWatched: number;
  isComplete: boolean;
  sectionId: number;
  courseType?: string;
  onRecheck: () => void;
}

const VideoDebugPanel = ({
  currentTime,
  maxWatched,
  duration,
  percentWatched,
  isComplete,
  sectionId,
  courseType,
  onRecheck,
}: VideoDebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <Card className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Video Debug Panel (Dev Only)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-2 text-xs font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Section ID:</span> {sectionId}
            </div>
            <div>
              <span className="font-semibold">Course Type:</span> {courseType || "N/A"}
            </div>
            <div>
              <span className="font-semibold">Current Time:</span>{" "}
              {currentTime.toFixed(2)}s
            </div>
            <div>
              <span className="font-semibold">Max Watched:</span>{" "}
              {maxWatched.toFixed(2)}s
            </div>
            <div>
              <span className="font-semibold">Duration:</span>{" "}
              {duration.toFixed(2)}s
            </div>
            <div>
              <span className="font-semibold">% Watched:</span>{" "}
              {percentWatched.toFixed(1)}%
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Completed (DB):</span>{" "}
              <span
                className={
                  isComplete ? "text-green-600 font-bold" : "text-red-600"
                }
              >
                {isComplete ? "✓ YES" : "✗ NO"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Seek Guard:</span> Max +5s buffer
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onRecheck}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Recheck Completion Status
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default VideoDebugPanel;
