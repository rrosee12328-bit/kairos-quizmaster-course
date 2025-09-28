import { Play, CheckCircle, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CourseSectionProps {
  section: {
    id: number;
    title: string;
    description: string;
    duration: string;
    videoUrl: string;
    completed: boolean;
    locked: boolean;
  };
  onStartSection: (sectionId: number) => void;
}

const CourseSection = ({ section, onStartSection }: CourseSectionProps) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              {section.completed ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : section.locked ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Play className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Section {section.id}: {section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </div>
          </div>
          <Badge variant={section.completed ? "default" : "secondary"}>
            {section.duration}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {section.completed && (
              <Badge variant="default" className="bg-green-600">
                Completed
              </Badge>
            )}
            {section.locked && (
              <Badge variant="secondary">
                Locked
              </Badge>
            )}
          </div>
          <Button
            onClick={() => onStartSection(section.id)}
            disabled={section.locked}
            variant={section.completed ? "outline" : "default"}
          >
            {section.completed ? "Review" : section.locked ? "Locked" : "Start Section"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseSection;