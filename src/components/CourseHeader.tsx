import { Shield, BookOpen, Users, LogOut, LogIn, Home, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import kairosLogo from "@/assets/kairos-logo.png";

interface CourseHeaderProps {
  isAdmin?: boolean;
  isLoggedIn?: boolean;
}

const CourseHeader = ({ isAdmin = false, isLoggedIn = false }: CourseHeaderProps) => {
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
          <div className="flex items-center gap-2 sm:gap-4 text-sm">
            {/* Prominent navigation buttons - visible on larger screens */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Courses
                </Link>
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20 hover:border-primary-foreground/50 font-semibold">
                  <Menu className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Menu</span>
                  <span className="sm:hidden">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                {/* Show Home/Courses in dropdown on mobile */}
                <div className="sm:hidden">
                  <DropdownMenuItem asChild>
                    <Link to="/" className="flex items-center cursor-pointer">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/courses" className="flex items-center cursor-pointer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Courses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                {isLoggedIn ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center cursor-pointer">
                        <Users className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="flex items-center cursor-pointer">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CourseHeader;