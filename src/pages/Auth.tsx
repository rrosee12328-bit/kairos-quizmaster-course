import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import kairosLogo from "@/assets/kairos-logo.png";
import EnrollmentForm from "@/components/EnrollmentForm";
import SignInForm from "@/components/SignInForm";

const Auth = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const priceIdFromUrl = params.get('priceId') || undefined;
  const courseFromUrl = params.get('course') || undefined;

  const processPendingEnrollment = async (sessionUser: User) => {
    try {
      const raw = localStorage.getItem('pendingEnrollment');
      if (!raw) return;
      const pending = JSON.parse(raw);

      const payload = {
        ...pending,
        user_id: sessionUser.id,
        email: sessionUser.email?.toLowerCase() ?? pending.email,
      };

      const { error } = await supabase.from('enrollments').insert(payload);
      if (error) {
        console.error('Finalize enrollment error:', error);
        toast.error('We could not finalize your enrollment after sign-in.');
        return;
      }

      localStorage.removeItem('pendingEnrollment');
      toast.success('Enrollment completed! Welcome.');
    } catch (e) {
      console.error('Finalize enrollment unexpected error:', e);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await processPendingEnrollment(session.user);
        navigate('/profile');
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            await processPendingEnrollment(session.user!);
            navigate('/profile');
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
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
              <EnrollmentForm onSuccess={handleAuthSuccess} priceId={priceIdFromUrl} defaultCourseType={courseFromUrl} />
            </TabsContent>
            
            <TabsContent value="signin" className="mt-6">
              <SignInForm onSuccess={handleAuthSuccess} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;