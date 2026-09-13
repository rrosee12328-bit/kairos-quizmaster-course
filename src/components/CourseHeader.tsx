import { BookOpen, Users, LogOut, LogIn, Home, Menu, Settings, ArrowUpRight } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import kairosLogo from "@/assets/kairos-logo.png";
import "@/styles/academy.css";

interface CourseHeaderProps { isAdmin?: boolean; isLoggedIn?: boolean; }
const CourseHeader = ({ isAdmin = false, isLoggedIn = false }: CourseHeaderProps) => {
  const navigate = useNavigate();
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Failed to sign out");
    else { toast.success("Signed out successfully"); navigate("/auth"); }
  };
  return <header className="academy-header">
    <Link to="/" className="academy-brand" aria-label="Kairos Security Academy home"><img src={kairosLogo} alt="" width="44" height="44" /><span>KAIROS<small>SECURITY ACADEMY</small></span></Link>
    <nav className="academy-nav" aria-label="Main navigation"><NavLink to="/" end>Home</NavLink><NavLink to="/courses">Training paths</NavLink><Link to="/#approach">Our approach</Link></nav>
    <div className="academy-header-actions"><Link className="academy-account" to={isLoggedIn ? "/profile" : "/auth"}>{isLoggedIn ? "My learning" : "Student login"}<ArrowUpRight size={15} /></Link>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="academy-menu"><Menu size={17} /><span>Menu</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52">
      <DropdownMenuItem asChild><Link to="/"><Home className="mr-2 h-4 w-4" />Home</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link to="/courses"><BookOpen className="mr-2 h-4 w-4" />Courses</Link></DropdownMenuItem><DropdownMenuSeparator />
      {isLoggedIn ? <><DropdownMenuItem asChild><Link to="/profile"><Users className="mr-2 h-4 w-4" />My learning</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>{isAdmin && <DropdownMenuItem asChild><Link to="/admin">Administration</Link></DropdownMenuItem>}<DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></> : <DropdownMenuItem asChild><Link to="/auth"><LogIn className="mr-2 h-4 w-4" />Sign in</Link></DropdownMenuItem>}
    </DropdownMenuContent></DropdownMenu></div>
  </header>;
};
export default CourseHeader;
