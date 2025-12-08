import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import VideoPlayer from "@/components/VideoPlayer";
import Quiz from "@/components/Quiz";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { level4ExamQuestions } from "@/data/level4ExamQuestions";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { trackCourseStarted } from "@/lib/tracking";

const LIBRARY_ID = "512706";
const VIDEO_GUID = "f5fc34de-7c2a-445a-9a5b-cd36225549a2";

const Level4Course = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);
  
  const { allSectionsComplete, failedAttempts, attemptsRemaining, refetchProgress } = useCourseProgress('level4', 1);

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
          // Track course started
          trackCourseStarted('level4');
        } else {
          setVideoUrl(`https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${VIDEO_GUID}`);
          trackCourseStarted('level4');
        }
      } catch (e) {
        console.error('[Level4Course] Signing error', e);
        setVideoUrl(`https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${VIDEO_GUID}`);
        trackCourseStarted('level4');
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
          .eq('course_type', 'level4')
          .maybeSingle(),
        supabase
          .from('course_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('course_type', 'level4')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('course_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('course_type', 'level4')
          .maybeSingle()
      ]);

      const enrollment = enrollmentResult.data;
      const progress = progressResult.data;
      const completion = completionResult.data;

      console.log('[Level4Course] Access check:', { 
        userId, 
        hasEnrollment: !!enrollment, 
        hasProgress: !!progress, 
        hasCompletion: !!completion,
        isAdmin 
      });

      // Allow access if enrolled OR has progress OR completed (for review) OR is admin
      if (!enrollment && !progress && !completion && !isAdmin) {
        console.error('[Level4Course] Access denied - no enrollment, progress, or completion found');
        toast.error('You need to enroll in this course first. If you already purchased it, please contact support.');
        navigate('/courses');
      }
    } catch (error) {
      console.error('[Level4Course] Error checking enrollment:', error);
      // Don't block access on error - let them through
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader isAdmin={isAdmin} isLoggedIn={isAuthenticated} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-4">
          <BackButton fallbackPath="/courses" />
        </div>
        
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Level 4: Personal Protection Officer (Part 1)</h1>
          </div>
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Part 1 (Online):</strong> 15 hour certification course - Complete the video and pass the final exam.
            </p>
            <div className="text-sm font-semibold text-primary bg-primary/10 p-3 rounded-lg border border-primary/20">
              ⚠️ Part 2 (In-Person): Must be completed in Houston area with Kairos Security. <strong>Part 2 is priced separately.</strong>
            </div>
          </div>
        </div>

        <div className="mb-6 animate-fade-in">
          <VideoPlayer
            section={{
              id: 1,
              title: "Level 4: Personal Protection Officer Training",
              videoUrl: videoUrl,
              duration: "Training Video",
            }}
            courseType="level4"
            isActive={true}
            onComplete={() => {}}
            onNext={() => {}}
          />
        </div>

        {allSectionsComplete && !showQuiz && (
          <Card className={`border-l-4 animate-fade-in mb-6 ${attemptsRemaining > 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${attemptsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <CheckCircle className="h-6 w-6" />
                {attemptsRemaining > 0 ? 'Video Completed' : 'Maximum Attempts Reached'}
              </CardTitle>
              <CardDescription>
                {attemptsRemaining > 0 
                  ? (failedAttempts > 0 
                    ? `You have ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining. Pass with 70% or higher to earn your certificate.`
                    : `Great! You've completed the training video. Take the final exam to earn your certificate.`)
                  : `You have used all 3 exam attempts. Please re-purchase the course to try again.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failedAttempts > 0 && attemptsRemaining > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ Failed attempts: {failedAttempts}/3 — {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                  </p>
                </div>
              )}
              {attemptsRemaining <= 0 ? null : (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Training video completed
                  </p>
                </div>
              )}
              {attemptsRemaining > 0 ? (
                <Button onClick={() => setShowQuiz(true)} size="lg" className="w-full">
                  {failedAttempts > 0 ? 'Retake Final Exam' : 'Start Final Exam'} (31 Questions)
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/courses')} 
                  size="lg" 
                  variant="destructive"
                  className="w-full"
                >
                  Re-purchase Course to Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {showQuiz && (
          <div ref={quizRef}>
            <Quiz 
              questions={level4ExamQuestions}
              courseType="level-4"
              passingPercentage={70}
              attemptsRemaining={attemptsRemaining}
              onQuizComplete={refetchProgress}
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
                This is a 15 hour course required by the Texas Department of Public Safety – Private Security Board.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold text-center">
                  📋 Passing Score Required: 70% or higher
                </p>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">About This Course</h3>
                  <p className="text-muted-foreground">
                    This course meets if not exceeds the training requirements of the PSB for a Personal Protection Officer license which allows a security officer to work in a bodyguard position. Subjects covered include: how to protect the principle when alone or as a team, threat avoidance techniques, and how to plan and scout escape routes. Some defensive tactics are taught as well as transportation tips, and the value and importance of proper planning and preplanning.
                  </p>
                  <p className="text-muted-foreground mt-2 font-medium">
                    THIS COURSE IS ALL CLASSROOM, NO RANGE OR LIVE FIRE IS REQUIRED
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prerequisites</h3>
                  <p className="text-muted-foreground">
                    The PSB Commission Rule 430.1 states that an applicant for a Personal Protection authorization must have already been issued a Commission. *If you have taken a Level 3 course, you can take the Level 4 course. You just can't apply for your Level 4 license until your Level 3 is issued.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Topics Include</h3>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Options in Personal Protection
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Comprehensive Protection Planning
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Coordination with local Authorities
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Building a Client Profile
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Rings of Protection
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      The Force Continuum
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Unarmed Defensive Tactics
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Private Security Act & Commission Rules
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Texas Penal Code
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Conflict Resolution & Avoidance
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Public Perception
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Arrest Authority
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                      Use of Force & Deadly Force
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Level4Course;
