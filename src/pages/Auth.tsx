import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import kairosLogo from "@/assets/kairos-logo.png";
import EnrollmentForm from "@/components/EnrollmentForm";
import SignInForm from "@/components/SignInForm";

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate('/courses');
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          navigate('/courses');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate('/courses');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
            <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Kairos Security Academy</h1>
          </Link>
          <p className="text-muted-foreground">
            Enroll in a course or sign in to continue your training
          </p>
        </div>

        <Tabs defaultValue="enroll" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enroll">Enroll</TabsTrigger>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
          </TabsList>
          
          <TabsContent value="enroll" className="mt-6">
            <EnrollmentForm onSuccess={handleAuthSuccess} />
          </TabsContent>
          
          <TabsContent value="signin" className="mt-6">
            <SignInForm onSuccess={handleAuthSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;