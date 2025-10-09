import { Shield, BookOpen, Users, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import kairosLogo from "@/assets/kairos-logo.png";

interface CourseHeaderProps {
  isAdmin?: boolean;
  showAuthButtons?: boolean;
}

const CourseHeader = ({ isAdmin = false, showAuthButtons = false }: CourseHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
            <img src={kairosLogo} alt="Kairos Security Academy" className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold">Kairos Security Academy</h1>
              <p className="text-primary-foreground/80 text-lg">Professional Security Training</p>
            </div>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            {showAuthButtons && (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild className="text-foreground">
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut} className="text-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>9 Sections</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>100 Questions</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CourseHeader;