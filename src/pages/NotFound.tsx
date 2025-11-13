import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = window.location;
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <CourseHeader showAuthButtons={!!user} />

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold">404</h1>
          <p className="mb-8 text-2xl text-muted-foreground">Oops! Page not found</p>
          <Button asChild size="lg">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
