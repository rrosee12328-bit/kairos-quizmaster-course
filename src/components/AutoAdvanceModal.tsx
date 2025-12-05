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
  isFinalSection?: boolean;
}

const AutoAdvanceModal = ({
  isOpen,
  sectionTitle,
  onAdvance,
  onCancel,
  countdownSeconds = 10,
  isFinalSection = false,
}: AutoAdvanceModalProps) => {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(countdownSeconds);
      return;
    }

    console.log('MODAL_SHOWN', { sectionTitle, isFinalSection, device, ua: navigator.userAgent });

    // Don't run countdown for final section
    if (isFinalSection) return;

    // Visual countdown only - no auto-advance
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds, isFinalSection, sectionTitle, device]);

  const progress = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;

  const handleContinue = () => {
    const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    console.log('CONTINUE_NOW_CLICK', { sectionTitle, device });
    onAdvance();
  };

  const handleStay = () => {
    const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    console.log('STAY_HERE_CLICK', { sectionTitle, device });
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleStay()}>
      <DialogContent 
        className="sm:max-w-md" 
        data-testid="complete-modal"
        role="dialog"
        aria-labelledby="complete-modal-title"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 
              className="h-6 w-6 text-green-500" 
              data-testid="complete-icon"
            />
            <div className="flex-1">
              <DialogTitle 
                id="complete-modal-title"
                data-testid="complete-title"
                className="text-xl"
              >
                {isFinalSection ? "Course Complete!" : "Section Complete!"}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                data-testid="complete-section-title"
              >
                {sectionTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isFinalSection && (
          <>
            <div className="space-y-2">
              <p 
                className="text-sm font-semibold text-center"
                data-testid="complete-countdown-label"
              >
                {secondsLeft > 0 ? `${secondsLeft} seconds to review...` : "Ready to continue?"}
              </p>
              <Progress 
                value={progress} 
                className="h-2" 
                data-testid="complete-progress"
              />
            </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleStay}
              className="w-full sm:w-auto hover:bg-muted"
              data-testid="btn-stay-here"
            >
              <X className="h-4 w-4 mr-2" />
              Review Section
            </Button>
            <Button
              onClick={handleContinue}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              data-testid="btn-continue-now"
            >
              Continue to Next Section
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
          </>
        )}

        {isFinalSection && (
          <DialogFooter>
            <Button
              onClick={handleContinue}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="btn-continue-now"
            >
              Continue to Exam
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AutoAdvanceModal;
