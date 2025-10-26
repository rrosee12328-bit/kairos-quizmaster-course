import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AutoAdvanceModalProps {
  isOpen: boolean;
  sectionTitle: string;
  onAdvance: () => void;
  onCancel: () => void;
  countdownSeconds?: number;
}

const AutoAdvanceModal = ({
  isOpen,
  sectionTitle,
  onAdvance,
  onCancel,
  countdownSeconds = 5,
}: AutoAdvanceModalProps) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(countdownSeconds);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds, onAdvance]);

  const progress = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <DialogTitle>Section Complete!</DialogTitle>
          </div>
          <DialogDescription>
            You've completed "{sectionTitle}". 
            <div className="mt-2 font-semibold">
              Auto-advancing to next section in {secondsLeft} seconds...
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Stay Here
          </Button>
          <Button
            onClick={onAdvance}
            className="w-full sm:w-auto"
          >
            Continue Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutoAdvanceModal;
