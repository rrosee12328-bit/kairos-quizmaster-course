import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import VideoPlayer from "@/components/VideoPlayer";
import Quiz from "@/components/Quiz";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pepperSprayExamQuestions } from "@/data/pepperSprayExamQuestions";
import { useCourseProgress } from "@/hooks/useCourseProgress";

const LIBRARY_ID = "512130";
const VIDEO_GUID = "9ccd2d12-bbcf-4fd7-a74f-15cf1188e453";

const PepperSprayCourse = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);
  
  const { allSectionsComplete } = useCourseProgress('pepper_spray', 1);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true);
        checkAdminStatus(user.id);
        checkEnrollmentStatus(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        checkAdminStatus(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('bunny-video', {
          body: { action: 'getSignedUrl', libraryId: LIBRARY_ID, videoId: VIDEO_GUID, expiresInHours: 24 },
        });
        if (!error && (data?.iframeUrl || data?.signedUrl)) {
          setVideoUrl(data.iframeUrl || `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${VIDEO_GUID}`);
        } else {
          setVideoUrl(`https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${VIDEO_GUID}`);
        }
      } catch (e) {
        console.error('[PepperSprayCourse] Signing error', e);
        setVideoUrl(`https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${VIDEO_GUID}`);
      }
    })();
  }, []);

  useEffect(() => {
    if (showQuiz) {
      quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showQuiz]);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
    if (!error && data) {
      setIsAdmin(true);
    }
  };

  const checkEnrollmentStatus = async (userId: string) => {
    try {
      // Check if user is enrolled, has any progress, or has completed the course
      const [enrollmentResult, progressResult, completionResult] = await Promise.all([
        supabase
          .from('enrollments')
          .select('enrollment_status')
          .eq('user_id', userId)
          .eq('course_type', 'pepper_spray')
          .maybeSingle(),
        supabase
          .from('course_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('course_type', 'pepper_spray')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('course_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('course_type', 'pepper_spray')
          .maybeSingle()
      ]);

      const enrollment = enrollmentResult.data;
      const progress = progressResult.data;
      const completion = completionResult.data;

      console.log('[PepperSprayCourse] Access check:', { 
        userId, 
        hasEnrollment: !!enrollment, 
        hasProgress: !!progress, 
        hasCompletion: !!completion,
        isAdmin 
      });

      // Allow access if enrolled OR has progress OR completed (for review) OR is admin
      if (!enrollment && !progress && !completion && !isAdmin) {
        console.error('[PepperSprayCourse] Access denied - no enrollment, progress, or completion found');
        toast.error('You need to enroll in this course first. If you already purchased it, please contact support.');
        navigate('/courses');
      }
    } catch (error) {
      console.error('[PepperSprayCourse] Error checking enrollment:', error);
      // Don't block access on error - let them through
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader isAdmin={isAdmin} showAuthButtons={isAuthenticated} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate('/courses')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </div>
        
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Pepper Spray Training</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Learn the proper use, safety, and legal considerations of pepper spray for security professionals.
          </p>
        </div>

        <div className="mb-6 animate-fade-in">
          <VideoPlayer
            section={{
              id: 1,
              title: "Pepper Spray Training",
              videoUrl: videoUrl,
              duration: "Training Video",
            }}
            courseType="pepper_spray"
            isActive={true}
            onComplete={() => {}}
            onNext={() => {}}
          />
          
          <div className="text-center mt-4">
            <Button
              onClick={() => setShowQuiz(true)}
              disabled={!allSectionsComplete}
              size="sm"
              title={!allSectionsComplete ? "Complete the video to unlock the exam" : ""}
            >
              Go to Final Exam
            </Button>
          </div>
        </div>

        {allSectionsComplete && !showQuiz && (
          <Card className="border-l-4 border-l-green-500 animate-fade-in mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Video Completed
              </CardTitle>
              <CardDescription>
                Great! You've completed the training video. Take the final exam to earn your certificate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Training video completed
                </p>
              </div>
              <Button onClick={() => setShowQuiz(true)} size="lg" className="w-full">
                Start Final Exam (17 Questions)
              </Button>
            </CardContent>
          </Card>
        )}

        {showQuiz && (
          <div ref={quizRef}>
            <Quiz 
              questions={pepperSprayExamQuestions}
              courseType="pepper-spray"
              passingPercentage={70}
            />
          </div>
        )}

        <div className="mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Course Overview
              </CardTitle>
              <CardDescription className="text-base">
                Essential training for security professionals on pepper spray use.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold text-center">
                  📋 Passing Score Required: 70% or higher
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <p>This course covers:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                    Proper handling and deployment techniques
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                    Safety protocols and precautions
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                    Legal considerations and use of force
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                    Decontamination procedures
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PepperSprayCourse;
