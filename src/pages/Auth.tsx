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
  const courseFromUrl = params.get('course') || undefined;
  const paymentSuccess = params.get('payment') === 'success';
  
  // If there's a course parameter, redirect to that course page after auth
  const getCourseRedirectPath = () => {
    if (courseFromUrl) {
      const courseMap: Record<string, string> = {
        'level2': '/course/level2',
        'level3': '/course/level3',
        'level4': '/course/level4',
        'pepper-spray': '/course/pepper-spray'
      };
      return courseMap[courseFromUrl] || '/courses';
    }
    return params.get('redirect') || '/profile';
  };
  
  const redirectPath = getCourseRedirectPath();

  const processPendingEnrollment = async (sessionUser: User) => {
    try {
      const raw = sessionStorage.getItem('pendingEnrollment');
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

      sessionStorage.removeItem('pendingEnrollment');
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
        // Sync enrollments created before sign-in
        await supabase.functions.invoke('sync-enrollment', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        navigate(redirectPath);
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
            // Ensure any pre-purchase enrollments are linked
            await supabase.functions.invoke('sync-enrollment', {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            navigate(redirectPath);
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate(redirectPath);
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
            {paymentSuccess && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-600 font-semibold">✓ Payment Successful!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create an account or sign in to access your course
                </p>
              </div>
            )}
            <p className="text-muted-foreground">
              {paymentSuccess ? 'Complete your enrollment to access the course' : 'Enroll in a course or sign in to continue your training'}
            </p>
          </div>

          <Tabs defaultValue="enroll" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enroll">Enroll</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enroll" className="mt-6">
              <EnrollmentForm onSuccess={handleAuthSuccess} defaultCourseType={courseFromUrl} />
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