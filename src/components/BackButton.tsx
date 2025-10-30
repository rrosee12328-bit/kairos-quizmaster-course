import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  preferHistory?: boolean;
}

export const BackButton = ({ fallbackPath = "/", label = "Back", preferHistory = true }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (!preferHistory) {
      navigate(fallbackPath);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button variant="ghost" onClick={handleBack} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};
