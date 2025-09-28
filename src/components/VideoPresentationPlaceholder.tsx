import { Play, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VideoPresentationPlaceholder = () => {
  return (
    <Card className="mb-8 overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-0">
        <div className="relative">
          {/* Video Placeholder */}
          <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 opacity-80" />
            <div className="relative z-10 text-center">
              <div className="bg-background/90 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-md mx-auto">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="h-10 w-10 text-primary ml-1" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Course Introduction Video</h3>
                <p className="text-muted-foreground mb-4">
                  Watch the welcome presentation from our lead instructor
                </p>
                <Button variant="default" className="mb-3">
                  <Play className="h-4 w-4 mr-2" />
                  Play Introduction
                </Button>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>12 min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Interactive</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPresentationPlaceholder;