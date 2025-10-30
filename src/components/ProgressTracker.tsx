import { CheckCircle, Circle, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressTrackerProps {
  completedSections: number[];
  currentSection: number;
  totalSections: number;
  showLocks?: boolean;
}

const ProgressTracker = ({ completedSections, currentSection, totalSections, showLocks = false }: ProgressTrackerProps) => {
  const progressPercentage = (completedSections.length / totalSections) * 100;
  const isQuizUnlocked = completedSections.length === totalSections;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle className="h-5 w-5 text-primary" />
          Course Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Section Progress</h4>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: totalSections }, (_, index) => {
              const sectionNumber = index + 1;
              const isCompleted = completedSections.includes(sectionNumber);
              const isCurrent = sectionNumber === currentSection;
              const isLocked = showLocks ? (!isCompleted && sectionNumber > Math.max(...completedSections, 0) + 1) : false;
              
              return (
                <div
                  key={sectionNumber}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : isLocked
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    sectionNumber
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className={`flex items-center gap-2 text-sm ${
            isQuizUnlocked ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {isQuizUnlocked ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span>
              Final Exam {isQuizUnlocked ? 'Available' : 'Locked'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Watch 90% of all course videos to unlock the final exam
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;