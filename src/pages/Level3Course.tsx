import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import CourseHeader from "@/components/CourseHeader";
import VideoPlayer from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { trackCourseStarted } from "@/lib/tracking";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

// Allowed emails for developer mode
const DEV_MODE_ALLOWED_EMAILS = ['rrosee12328@gmail.com', 'swiftskillnow@gmail.com'];

const Course = () => {
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  
  const totalSections = 10;
  const { completedSections, allSectionsComplete, examUnlocked, completionPercentage, examLockReason, failedAttempts, attemptsRemaining, refetchProgress } = useCourseProgress('level3', totalSections);
  const [localCompletedSections, setLocalCompletedSections] = useState<number[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email || null);
        checkAdminStatus(user.id);
        checkEnrollmentStatus(user.id);
      } else {
        // Redirect to login if not authenticated (match Level 2 behavior)
        navigate('/auth?redirect=/course/level3');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        checkAdminStatus(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUserEmail(null);
        // Redirect to login if logged out (match Level 2 behavior)
        navigate('/auth?redirect=/course/level3');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch videos from Bunny.net and generate signed URLs
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (videosLoaded) return;
      
      try {
        console.log('[Level3Course] Generating signed URLs for all sections');
        
        // Generate signed URLs for each section's video
        const updatedSections = await Promise.all(
          courseSections.map(async (section) => {
            if (!section.videoUrl) {
              console.warn(`[Level3Course] No video URL for section ${section.id}`);
              return section;
            }

            // Extract video ID from existing URL
            const match = section.videoUrl.match(/\/embed\/(\d+)\/([a-f0-9-]+)/i);
            if (!match) {
              console.warn(`[Level3Course] Could not extract video ID from ${section.videoUrl}`);
              return section;
            }

            const libraryId = match[1];
            const videoId = match[2];

            try {
              const { data: signedData, error: signedError } = await supabase.functions.invoke('bunny-video', {
                body: {
                  action: 'getSignedUrl',
                  libraryId: libraryId,
                  videoId: videoId,
                  expiresInHours: 24
                }
              });

              if (signedError || (!signedData?.signedUrl && !signedData?.iframeUrl)) {
                console.error(`[Level3Course] Failed to generate signed URL for section ${section.id}:`, signedError || signedData);
                return section;
              }

              // Use iframe URL for embed
              const iframeUrl = signedData.iframeUrl || signedData.signedUrl;
              console.log(`[Level3Course] Generated signed iframe URL for section ${section.id}:`, iframeUrl);
              
              return {
                ...section,
                videoUrl: iframeUrl
              };
            } catch (err) {
              console.error(`[Level3Course] Error generating signed URL for section ${section.id}:`, err);
              return section;
            }
          })
        );

        setCourseSections(updatedSections);
        setVideosLoaded(true);
        console.log('[Level3Course] All video URLs signed');
        
        // Track course started once videos are loaded
        trackCourseStarted('level3');
      } catch (err) {
        console.error('[Level3Course] Fatal error generating signed URLs:', err);
        toast.error('Failed to load course videos. Please refresh the page.');
      }
    };

    if (isAuthenticated && !videosLoaded) {
      fetchSignedUrls();
    }
  }, [isAuthenticated, videosLoaded]);

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
    console.log('[Level3Course] Admin check:', { userId, data, error });
    if (!error && data) {
      setIsAdmin(true);
      console.log('[Level3Course] User is admin');
      return true;
    } else {
      console.log('[Level3Course] User is not admin');
      return false;
    }
  };

  const checkEnrollmentStatus = async (userId: string, isAdminUser = false) => {
    try {
      // Check if user is enrolled, has any progress, or has completed the course
      const [enrollmentResult, progressResult, completionResult] = await Promise.all([
        supabase
          .from('enrollments')
          .select('enrollment_status')
          .eq('user_id', userId)
          .eq('course_type', 'level3')
          .maybeSingle(),
        supabase
          .from('course_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('course_type', 'level3')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('course_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('course_type', 'level3')
          .maybeSingle()
      ]);

      const enrollment = enrollmentResult.data;
      const progress = progressResult.data;
      const completion = completionResult.data;

      console.log('[Level3Course] Access check:', { 
        userId, 
        hasEnrollment: !!enrollment, 
        hasProgress: !!progress, 
        hasCompletion: !!completion,
        isAdmin: isAdminUser 
      });

      // Allow access if enrolled OR has progress OR completed (for review) OR is admin
      if (!enrollment && !progress && !completion && !isAdminUser) {
        console.error('[Level3Course] Access denied - no enrollment, progress, or completion found');
        toast.error('You need to enroll in this course first. If you already purchased it, please contact support.');
        navigate('/courses');
      }
    } catch (error) {
      console.error('[Level3Course] Error checking enrollment:', error);
      // Don't block access on error - let them through
    }
  };

  const [courseSections, setCourseSections] = useState([
    {
      id: 1,
      title: "Welcome",
      description: "Welcome to the Level 3 Security Officer Certification Course",
      duration: "1 minute",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/571ebbaa-2ffc-4050-8670-a3e9d0c1c4f5",
      content: [
        "Course overview and objectives",
        "What to expect from the training",
        "Certification requirements",
        "Getting started"
      ]
    },
    {
      id: 2,
      title: "Introduction",
      description: "Overview of security principles and basic operational procedures",
      duration: "2 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/db2f0bdb-2977-47ea-ae37-38d776952152",
      content: [
        "Understanding the role of a Level 3 Security Officer",
        "Basic security terminology and concepts",
        "Legal responsibilities and authority",
        "Professional conduct and ethics"
      ]
    },
    {
      id: 3,
      title: "Applicable Rules and State Laws",
      description: "Identifying, analyzing, and mitigating security risks",
      duration: "45 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/3a213a0e-1632-4600-89d6-b710eeac71be",
      content: [
        "Risk identification techniques",
        "Threat assessment methodologies",
        "Vulnerability analysis",
        "Risk mitigation strategies"
      ]
    },
    {
      id: 4,
      title: "Verbal and Written Communication Best Practices",
      description: "Managing and monitoring access to secured areas",
      duration: "33 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/7d719c17-74cb-4c9a-b8b4-c98a065c4bcf",
      content: [
        "Types of access control systems",
        "Card reader technologies",
        "Biometric systems",
        "Visitor management protocols"
      ]
    },
    {
      id: 5,
      title: "Incident Scene Security",
      description: "Operating and monitoring surveillance equipment",
      duration: "17 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/6350df04-1780-4e87-8ae7-a37b54c0050a",
      content: [
        "Camera types and positioning",
        "Monitoring techniques",
        "Recording and storage systems",
        "Privacy considerations"
      ]
    },
    {
      id: 6,
      title: "Situational Awareness",
      description: "Handling various emergency situations effectively",
      duration: "11 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/bb96462b-13f9-4197-b131-1ffa0e789772",
      content: [
        "Fire emergency procedures",
        "Medical emergency response",
        "Evacuation protocols",
        "Communication during emergencies"
      ]
    },
    {
      id: 7,
      title: "Use of Force",
      description: "Proper documentation and reporting of security incidents",
      duration: "48 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/987a687c-03fa-4e28-b07a-dc42c722c5f4",
      content: [
        "Incident report writing",
        "Evidence collection",
        "Chain of custody procedures",
        "Legal documentation requirements"
      ]
    },
    {
      id: 8,
      title: "Conflict Resolution",
      description: "Effective communication in security contexts",
      duration: "13 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/b94ee663-382f-4cfb-8b1d-73343b745638",
      content: [
        "Professional communication",
        "De-escalation techniques",
        "Customer service in security",
        "Working with law enforcement"
      ]
    },
    {
      id: 9,
      title: "Defensive Tactics",
      description: "Understanding and implementing physical security controls",
      duration: "26 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/12fb0f82-c9ae-4d57-9577-a3328632d3c7",
      content: [
        "Perimeter security",
        "Barrier systems",
        "Lighting for security",
        "Environmental design principles"
      ]
    },
    {
      id: 10,
      title: "Handcuffing",
      description: "Proper handcuffing techniques and procedures for security operations",
      duration: "5 minutes",
      videoUrl: "https://iframe.mediadelivery.net/embed/506173/8c142b15-c591-4f2b-9d09-1b39fca4fe38",
      content: [
        "Handcuffing fundamentals",
        "Safety protocols",
        "Legal considerations",
        "Practical techniques"
      ]
    }
  ]);

  const handleNextSlide = () => {
    if (!carouselApi) return;

    try {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else if (currentSlide < totalSections - 1) {
        carouselApi.scrollTo(currentSlide + 1);
      }
    } catch (e) {
      console.warn('Carousel next failed, retrying with scrollTo', e);
      try { carouselApi.scrollTo(currentSlide + 1); } catch {}
    }
  };

  const handlePrevSlide = () => {
    if (carouselApi && currentSlide > 0) {
      carouselApi.scrollTo(currentSlide - 1);
    }
  };

  // Keep currentSlide in sync with Embla selections
  useEffect(() => {
    if (!carouselApi) return;
    const update = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    update();
    try {
      carouselApi.on("select", update);
      carouselApi.on("reInit", update);
    } catch {}
    return () => {
      try {
        // @ts-ignore - Embla may expose off()
        carouselApi.off?.("select", update);
        // @ts-ignore
        carouselApi.off?.("reInit", update);
      } catch {}
    };
  }, [carouselApi]);

  // Auto-resume: scroll to first incomplete section on load
  useEffect(() => {
    if (!carouselApi || completedSections.length === 0) return;
    
    // Find first incomplete section (section not in completedSections)
    const firstIncompleteIndex = courseSections.findIndex(
      section => !completedSections.includes(section.id)
    );
    
    if (firstIncompleteIndex > 0) {
      console.log('[Level3Course] Resuming at section', firstIncompleteIndex + 1);
      // Use requestAnimationFrame for better cross-browser compatibility
      requestAnimationFrame(() => {
        setTimeout(() => {
          carouselApi.scrollTo(firstIncompleteIndex, false);
        }, 100);
      });
    }
  }, [carouselApi, completedSections, courseSections]);

  const currentSectionId = courseSections[currentSlide]?.id;
  const isCurrentSectionComplete = developerMode || (currentSectionId ? (localCompletedSections.includes(currentSectionId) || completedSections.includes(currentSectionId)) : false);

  useEffect(() => {
    if (showQuiz) {
      setTimeout(() => {
        quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [showQuiz]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader isAdmin={isAdmin} isLoggedIn={isAuthenticated} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Back Button and Developer Mode Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <BackButton fallbackPath="/courses" />
          {isAuthenticated && userEmail && DEV_MODE_ALLOWED_EMAILS.includes(userEmail) && (
            <Button
              variant={developerMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDeveloperMode(!developerMode);
                toast.success(developerMode ? "Developer mode disabled" : "Developer mode enabled");
                console.log('[Level3Course] Developer mode:', !developerMode);
              }}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              {developerMode ? "Dev Mode: ON" : "Dev Mode: OFF"}
              {!isAdmin && <span className="text-xs ml-1">(Testing)</span>}
            </Button>
          )}
        </div>
        
        {/* Course Title */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Level 3 Security Officer Certification (Online Only)</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            This self-paced online course covers the classroom/theory portion of the Texas Level 3 curriculum, including laws, use of force, and safety fundamentals.
          </p>
        </div>

        {/* Important Notice */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">⚠️ Important:</p>
            <p className="text-sm text-muted-foreground">
              This course does not provide a Texas Level 3 certificate and cannot be used by itself to apply for a commission license. To become certified, you must also complete in-person firearms and practical training with a DPS-approved school.
            </p>
          </div>

          {/* How Our Level 3 Training Works */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">How Our Level 3 Training Works</CardTitle>
              <CardDescription>
                At Kairos Security Academy, we split your Level 3 training into two parts:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Part 1: Online Theory Prep</h4>
                <p className="text-sm text-muted-foreground">
                  Learn the Texas Level 3 laws, use of force, and classroom content at your own pace from home.
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Part 2: In-Person Firearms & Practical Training</h4>
                <p className="text-sm text-muted-foreground">
                  Complete your live firearms qualification, defensive tactics, and required hands-on training with a DPS-approved instructor in the Houston area.
                </p>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ To receive an official Texas Level 3 Certificate of Completion, you must complete both the online theory and the in-person training with Kairos Security Academy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What You Get */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">What You Get with Online Theory Completion:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  24/7 access to video lessons & quizzes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Downloadable notes & resources
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  Online Theory Completion Report (for your records) – <strong>not a DPS certificate</strong>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pricing Notice */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              💰 <strong>Pricing:</strong> The online price ($99) covers Part 1 only. Part 2 in-person training is priced separately and paid at the time of your appointment.
            </p>
          </div>
        </div>

        {/* Course Carousel */}
        <div className="mb-6 animate-fade-in">
            <Carousel 
              setApi={setCarouselApi}
            >
              <CarouselContent>
                {courseSections.map((section, idx) => (
                  <CarouselItem key={section.id}>
                     {isAuthenticated && (
                      <VideoPlayer
                        section={{
                          id: section.id,
                          title: section.title,
                          videoUrl: section.videoUrl || "",
                          duration: section.duration,
                        }}
                        courseType="level3"
                        isActive={currentSlide === idx}
                        isFinalSection={idx === totalSections - 1}
                        onComplete={() => {}}
                        onNext={handleNextSlide}
                        onSectionCompleted={(id) => {
                          setLocalCompletedSections((prev) =>
                            prev.includes(id) ? prev : [...prev, id]
                          );
                          // Refetch progress from database to update completion percentage
                          setTimeout(() => refetchProgress(), 1000);
                        }}
                        onExamReady={() => {
                          setShowQuiz(true);
                          setTimeout(() => {
                            quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }}
                      />
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Section {currentSlide + 1} of {totalSections}
              </div>

              {currentSlide === totalSections - 1 && !isCurrentSectionComplete ? (
                <Button
                  disabled
                  title="Complete the final section to unlock the exam"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : currentSlide === totalSections - 1 ? (
                <Button
                  disabled
                  title="Video will auto-advance to exam when complete"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextSlide}
                  disabled={!isCurrentSectionComplete}
                  title={!isCurrentSectionComplete ? "Complete current section to unlock next" : ""}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Tracker */}
        <div className="mb-6">
          <ProgressTracker 
            completedSections={[...new Set([...completedSections, ...localCompletedSections])]} 
            currentSection={currentSlide + 1}
            totalSections={totalSections}
            showLocks={false}
          />
          {!examUnlocked && !developerMode && (
            <>
              {examLockReason && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Exam Locked:</strong> {examLockReason}
                  </p>
                </div>
              )}
              <div className="mt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Course completion: <span className="font-semibold text-primary">{completionPercentage.toFixed(1)}%</span> 
                  <span className="text-xs ml-1">(90% required for exam)</span>
                </p>
              </div>
            </>
          )}
          {developerMode && (
            <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
              <p className="text-sm text-primary font-semibold">
                🔓 Developer Mode Active: All sections and exam unlocked
              </p>
            </div>
          )}
        </div>

        {/* PDF Resource */}
        <div className="mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Private Security Level 3 PDF (Part 1)
              </CardTitle>
              <CardDescription className="space-y-2">
                <span className="block">Reference manual for Part 1 online training.</span>
                <span className="block text-sm font-semibold text-primary bg-primary/10 p-2 rounded border border-primary/20">
                  ⚠️ Part 2 in-person training required for full certification
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => window.open('/Level3-Security-Manual.pdf', '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF Manual
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Course Overview */}
        <div className="mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Course Overview
              </CardTitle>
              <CardDescription className="space-y-2">
                <span className="block text-base">Complete all sections and pass the final exam for Part 1.</span>
                <span className="block text-sm font-semibold text-primary bg-primary/10 p-2 rounded border border-primary/20">
                  ⚠️ Part 2 in-person training is required for full armed certification
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-2xl font-bold text-primary">10</span>
                  <span className="text-muted-foreground">Sections</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-2xl font-bold text-primary">30</span>
                  <span className="text-muted-foreground">Hours</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-2xl font-bold text-primary">1</span>
                  <span className="text-muted-foreground">Final Exam</span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold text-center">
                  📋 Passing Score Required: 70% or higher
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final Quiz */}
        {(examUnlocked || developerMode) && !showQuiz && (
          <Card className={`border-l-4 animate-fade-in ${attemptsRemaining > 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${attemptsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <Shield className="h-6 w-6" />
                {developerMode 
                  ? "Developer Mode: Exam Unlocked" 
                  : attemptsRemaining > 0 
                    ? "Ready for Part 1 Final Exam" 
                    : "Maximum Attempts Reached"}
              </CardTitle>
              <CardDescription>
                {developerMode 
                  ? "Developer mode enabled - exam accessible for testing purposes"
                  : attemptsRemaining > 0 
                    ? (failedAttempts > 0 
                      ? `You have ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining. Pass with 70% or higher.`
                      : "You've completed 90% of the course! Pass the final exam, then complete Part 2 in-person training for full certification.")
                    : `You have used all 3 exam attempts. Please re-purchase the course to try again.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failedAttempts > 0 && attemptsRemaining > 0 && !developerMode && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ Failed attempts: {failedAttempts}/3 — {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                  </p>
                </div>
              )}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {developerMode 
                    ? "🔓 Developer mode active - all restrictions bypassed"
                    : `✓ Course progress: ${completionPercentage.toFixed(1)}% complete`
                  }
                </p>
              </div>
              {attemptsRemaining > 0 ? (
                <Button onClick={() => {
                  setShowQuiz(true);
                }} size="lg" className="w-full">
                  {failedAttempts > 0 ? 'Retake Part 1 Final Exam' : 'Start Part 1 Final Exam'} (67 Questions)
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
        <div ref={quizRef}>{showQuiz && <Quiz courseType="level3" attemptsRemaining={attemptsRemaining} onQuizComplete={refetchProgress} />}</div>
      </div>

      <Footer />
    </div>
  );
};

export default Course;