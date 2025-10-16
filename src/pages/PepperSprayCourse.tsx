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

const LIBRARY_ID = "512130";
const VIDEO_GUID = "9ccd2d12-bbcf-4fd7-a74f-15cf1188e453";

const PepperSprayCourse = () => {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true);
        checkAdminStatus(user.id);
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
    setVideoUrl(`https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${VIDEO_GUID}`);
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

  const handleComplete = () => {
    setCompleted(true);
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
            isActive={true}
            onComplete={handleComplete}
            onNext={() => {}}
          />
          
          <div className="text-center mt-4">
            <Button
              onClick={() => setShowQuiz(true)}
              size="sm"
            >
              Go to Final Exam
            </Button>
          </div>
        </div>

        {completed && !showQuiz && (
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
