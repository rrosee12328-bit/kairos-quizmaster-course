import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ChevronLeft, ChevronRight, FileText, Download, GraduationCap } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import CourseHeader from "@/components/CourseHeader";
import VideoPlayer from "@/components/VideoPlayer";
import EnrollmentForm from "@/components/EnrollmentForm";
import AutoAdvanceModal from "@/components/AutoAdvanceModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const Level2Course = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showEnrollment = searchParams.get('enroll') === 'true';
  const [showQuiz, setShowQuiz] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const quizRef = useRef<HTMLDivElement>(null);
  // Server-truth gating (dev instrumentation)
  const [debugUserId, setDebugUserId] = useState<string | null>(null);
  const [local90Reached, setLocal90Reached] = useState(false);
  const [postStatus, setPostStatus] = useState<number | null>(null);
  const [serverCompleted, setServerCompleted] = useState(false);
  const [graceTimerDone, setGraceTimerDone] = useState(false);
  const [bypassGate, setBypassGate] = useState(false); // dev only
  const [showAutoAdvanceModal, setShowAutoAdvanceModal] = useState(false);
  const [completedSectionTitle, setCompletedSectionTitle] = useState("");
  const [highestCompletedIndex, setHighestCompletedIndex] = useState(0);
  const [showExamPrompt, setShowExamPrompt] = useState(false);
  
  const totalSections = 9;
  const { completedSections, examUnlocked, completionPercentage, examLockReason } = useCourseProgress('level2', totalSections);
  
  const [courseSections, setCourseSections] = useState([
    {
      id: 1,
      title: "Welcome",
      description: "Introduction to the Level 2 Security Officer Certification Course",
      duration: "6 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "Course overview",
        "What to expect from this training"
      ]
    },
    {
      id: 2,
      title: "Training Objective",
      description: "Understanding the goals and objectives of this certification program",
      duration: "1 minute 59 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "Certification requirements",
        "Learning outcomes",
        "Career opportunities"
      ]
    },
    {
      id: 3,
      title: "Security Officer Basics",
      description: "Fundamental principles and responsibilities of security officers",
      duration: "27 minutes 3 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "Professional conduct and appearance",
        "Core security responsibilities",
        "Industry standards and ethics"
      ]
    },
    {
      id: 4,
      title: "Applicable Rules and State Laws",
      description: "Legal framework governing security operations",
      duration: "37 minutes 59 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "State regulations for security officers",
        "Legal powers and limitations",
        "Compliance requirements"
      ]
    },
    {
      id: 5,
      title: "Personal Communication and Conflict Resolution",
      description: "Effective communication and de-escalation techniques",
      duration: "39 minutes 51 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "Professional communication skills",
        "Conflict de-escalation strategies",
        "Active listening techniques"
      ]
    },
    {
      id: 6,
      title: "Use of Force",
      description: "Understanding appropriate force levels and legal considerations",
      duration: "16 minutes 58 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "Force continuum",
        "Legal justifications",
        "Documentation requirements"
      ]
    },
    {
      id: 7,
      title: "Arrests",
      description: "Citizen's arrest powers and procedures",
      duration: "5 minutes 57 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "Legal authority for arrests",
        "Proper arrest procedures",
        "Documentation and reporting"
      ]
    },
    {
      id: 8,
      title: "Verbal and Written Communication Best Practices",
      description: "Professional communication and documentation standards",
      duration: "8 minutes 57 seconds",
      videoUrl: "",
      has_quiz: false,
      content: [
        "Report writing techniques",
        "Professional correspondence",
        "Documentation standards"
      ]
    },
    {
      id: 9,
      title: "9. Emergencies and Safety Hazards",
      description: "Emergency response procedures and hazard identification",
      duration: "6 minutes 40 seconds",
      videoUrl: "a1c6e8da-cc44-4a4f-b895-ad7ba0a8519f",
      has_quiz: false,
      content: [
        "Emergency response protocols",
        "Safety hazard identification",
        "Evacuation procedures"
      ]
    }
  ]);

  // Track page visibility to pause updates when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isPageVisible) return; // Skip auth check if page not visible
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true);
        setDebugUserId(user.id);
        checkAdminStatus(user.id);
        checkEnrollmentStatus(user.id);
      } else {
        // Redirect to login if not authenticated
        navigate('/auth?redirect=/course/level2');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        checkAdminStatus(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        // Redirect to login if logged out
        navigate('/auth?redirect=/course/level2');
      }
    });

    return () => subscription.unsubscribe();
  }, [isPageVisible, navigate]);

  useEffect(() => {
    if (showQuiz) {
      quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showQuiz]);

  // Fetch videos from Bunny.net (only when page is visible)
  useEffect(() => {
    const normalize = (s: string) =>
      (s || "")
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[^a-z0-9 ]/g, "")
        .trim();

    const leadingNumber = (s: string) => {
      const m = (s || "").trim().match(/^(\d{1,2})/);
      return m ? parseInt(m[1], 10) : null;
    };

    const fetchVideos = async () => {
      if (!isPageVisible || videosLoaded) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('bunny-video', {
          body: { 
            action: 'listVideos',
            libraryId: '510506'
          }
        });

        if (error) {
          console.error('[Level2Course] Bunny API error:', error);
          toast.error('Failed to connect to video service');
          throw error;
        }

        const videos = data?.items || [];
        console.log('[Level2Course] Fetched videos:', videos?.map((v: any) => ({ 
          title: v?.title, 
          guid: v?.guid,
          status: v?.status,
          isPublic: v?.isPublic 
        })));

        if (!videos.length) {
          toast.error('No videos found in library. Please contact support.');
          return;
        }

        // Build updated sections with matched videos and generate signed URLs
        const availableVideos: any[] = Array.isArray(videos) ? [...videos] : [];
        const used = new Set<string>();

        const getMatchForSection = (section: any) => {
          const sNorm = normalize(section.title);

          // 1) Prefer numeric prefix match
          let match = availableVideos.find((v: any) => {
            const num = leadingNumber(v?.title || '');
            return num === section.id && !used.has(v.guid);
          });

          // 2) Fuzzy title match
          if (!match) {
            match = availableVideos.find((v: any) => {
              const vNorm = normalize(v?.title || '');
              return (vNorm.includes(sNorm) || sNorm.includes(vNorm)) && !used.has(v.guid);
            });
          }

          // 3) Fallback by index alignment (sorted by title)
          if (!match) {
            const sorted = [...availableVideos].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            match = sorted[section.id - 1];
            if (match && used.has(match.guid)) match = undefined;
          }

          if (match) used.add(match.guid);
          return match;
        };

        const updatedSectionsPromises = courseSections.map(async (section) => {
          // Skip auto-matching if section already has a videoUrl (explicit video ID set)
          if (section.videoUrl) {
            console.log(`[Level2Course] Section ${section.id} "${section.title}" has explicit video ID: ${section.videoUrl}`);
            
            // Generate signed URL for the explicitly set video
            try {
              const { data: signedData, error: signedError } = await supabase.functions.invoke('bunny-video', {
                body: {
                  action: 'getSignedUrl',
                  libraryId: '510506',
                  videoId: section.videoUrl,
                  expiresInHours: 24
                }
              });

              if (signedError || (!signedData?.signedUrl && !signedData?.iframeUrl)) {
                console.error(`[Level2Course] Failed to generate signed URL for ${section.videoUrl}:`, signedError || signedData);
                return section;
              }

              return {
                ...section,
                videoUrl: signedData.iframeUrl || signedData.signedUrl,
              };
            } catch (err) {
              console.error(`[Level2Course] Error generating signed URL:`, err);
              return section;
            }
          }

          const matchingVideo = getMatchForSection(section);

          if (matchingVideo?.guid) {
            console.log(`[Level2Course] Matched section ${section.id} "${section.title}" to video "${matchingVideo.title}" (${matchingVideo.guid})`);
            
            // Generate signed URL for private video
            try {
              const { data: signedData, error: signedError } = await supabase.functions.invoke('bunny-video', {
                body: {
                  action: 'getSignedUrl',
                  libraryId: '510506',
                  videoId: matchingVideo.guid,
                  expiresInHours: 24
                }
              });

              if (signedError || (!signedData?.signedUrl && !signedData?.iframeUrl)) {
                console.error(`[Level2Course] Failed to generate signed URL for ${matchingVideo.guid}:`, signedError || signedData);
                return section;
              }

              return {
                ...section,
                // Prefer signed iframe URL for Bunny embed
                videoUrl: signedData.iframeUrl || signedData.signedUrl,
              };
            } catch (err) {
              console.error(`[Level2Course] Error generating signed URL:`, err);
              return section;
            }
          } else {
            console.warn(`[Level2Course] No match for section ${section.id} "${section.title}"`);
            return section;
          }
        });

        const updated = await Promise.all(updatedSectionsPromises);
        setCourseSections(updated);

        const missing = updated.filter((s) => !s.videoUrl);
        if (missing.length) {
          console.error('[Level2Course] Missing videos for:', missing.map(m => `${m.id}: ${m.title}`));
          toast.error(
            `Could not load ${missing.length} video(s). Check console for details.`,
            { duration: 5000 }
          );
        } else {
          console.log('[Level2Course] All videos matched and signed successfully!');
        }

        setVideosLoaded(true);
        
        // Track course started once videos are loaded
        trackCourseStarted('level2');
      } catch (err) {
        console.error('[Level2Course] Error fetching videos:', err);
        toast.error('Failed to load course videos. Please refresh the page.');
      }
    };

    if (isPageVisible && !videosLoaded) {
      fetchVideos();
    }
  }, [isPageVisible, videosLoaded]);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
    if (!error && data) {
      setIsAdmin(true);
    }
  };

  const checkEnrollmentStatus = async (userId: string) => {
    try {
      const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
      console.log('[Level2Course] course_access', {
        userId,
        courseId: 'level2',
        client: { 
          device, 
          os: navigator.platform,
          ua: navigator.userAgent,
          referrer: document.referrer,
          origin: window.location.origin
        }
      });

      // Check if user is enrolled, has any progress, or has completed the course
      const [enrollmentResult, progressResult, completionResult] = await Promise.all([
        supabase
          .from('enrollments')
          .select('enrollment_status')
          .eq('user_id', userId)
          .eq('course_type', 'level2')
          .maybeSingle(),
        supabase
          .from('course_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('course_type', 'level2')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('course_completions')
          .select('id, passed')
          .eq('user_id', userId)
          .eq('course_type', 'level2')
          .maybeSingle()
      ]);

      const enrollment = enrollmentResult.data;
      const progress = progressResult.data;
      const completion = completionResult.data;

      // Visibility rule: canRenderVideo = isEnrolled(user, courseId) - INDEPENDENT of pass/fail
      const canRenderVideo = !!(enrollment || progress || completion);
      const assessmentResult = completion?.passed === false ? 'failed' : completion?.passed ? 'passed' : 'none';

      console.log('[Level2Course] course_access', { 
        userId, 
        courseId: 'level2',
        enrolled: !!enrollment,
        assessment: assessmentResult,
        canRenderVideo,
        canAdvance: true, // Quiz results only affect advancement, not visibility
        hasEnrollment: !!enrollment, 
        hasProgress: !!progress, 
        hasCompletion: !!completion,
        isAdmin,
        outcome: canRenderVideo || isAdmin ? '200' : '403',
        reason: canRenderVideo || isAdmin ? 'ENTITLEMENT_OK' : 'NO_ENTITLEMENT'
      });

      // Allow access if enrolled OR has progress OR completed (for review) OR is admin
      if (!canRenderVideo && !isAdmin) {
        console.error('[Level2Course] Access denied - no enrollment, progress, or completion found');
        toast.error('You need to enroll in this course first. If you already purchased it, please contact support.');
        navigate('/courses');
        return;
      }
    } catch (error) {
      console.error('[Level2Course] Error checking enrollment:', error);
      // Don't block access on error - let them through
    }

    // Check highest completed section for navigation guard (canAdvance, not canRenderVideo)
    const { data: progressData } = await supabase
      .from('course_progress')
      .select('section_id, section_completed')
      .eq('user_id', userId)
      .eq('course_type', 'level2')
      .eq('section_completed', true)
      .order('section_id', { ascending: false })
      .limit(1);

    if (progressData && progressData.length > 0) {
      const highestSection = progressData[0].section_id;
      const highestIndex = courseSections.findIndex(s => s.id === highestSection);
      setHighestCompletedIndex(highestIndex);
      
      console.log('GUARD - Highest completed section:', {
        highestSection,
        highestIndex,
        allowedUpToIndex: highestIndex + 1
      });
    }
  };

  const handleSectionComplete = (sectionId: number) => {
    const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    console.log('[Level2Course] video_ended', {
      sectionId,
      currentSlide,
      device,
      ua: navigator.userAgent,
      nextSectionExists: !!courseSections[currentSlide + 1]
    });
    
    // No need to update local state - useCourseProgress hook handles this
    console.log('[Level2Course] Section complete', { sectionId });
  };

  const handleSectionCompleted = async (sectionId: number) => {
    const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    console.log('SERVER_CONFIRMED_SECTION_COMPLETE', { 
      sectionId, 
      userId: debugUserId,
      courseType: 'level2',
      device
    });

    // CRITICAL: Re-fetch progress from server to ensure we have latest state (no stale cache)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: progressData } = await supabase
        .from('course_progress')
        .select('section_completed, video_completed, quiz_passed')
        .eq('user_id', user.id)
        .eq('course_type', 'level2')
        .eq('section_id', sectionId)
        .maybeSingle();

      console.log('POST_OK - Fresh server data:', { 
        sectionId, 
        serverData: progressData,
        device
      });

      if (progressData?.section_completed) {
        setServerCompleted(true);
        const nextSection = courseSections[currentSlide + 1];
        
        if (nextSection) {
          console.log('[Level2Course] countdown_shown', {
            nextSection: nextSection.title,
            device
          });
          setShowAutoAdvanceModal(true);
        } else {
          console.log('[Level2Course] Course complete - final section', { device });
          toast.success("You've completed all sections!");
          setShowQuiz(true);
          setTimeout(() => {
            quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    }
  };

  const handleNextSection = () => {
    if (!nextSectionId) {
      console.log('NEXT_CLICK_NAV - Final section, going to exam');
      setShowQuiz(true);
      setTimeout(() => {
        quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    console.log('NEXT_CLICK_NAV', {
      from: { sectionId: currentSectionId, index: currentIndex },
      to: { sectionId: nextSectionId, index: nextIndex }
    });

    // Navigate via carousel
    handleNextSlide();
  };

  const handleDevBypass = () => {
    if (!nextSectionId) {
      toast.error("Already on final section");
      return;
    }
    
    console.log('DEV_BYPASS_NAV', {
      from: currentSectionId,
      to: nextSectionId
    });
    
    handleNextSlide();
  };

  const handleAutoAdvance = () => {
    setShowAutoAdvanceModal(false);
    
    // If final section, show exam prompt
    if (currentSlide >= courseSections.length - 1) {
      setShowExamPrompt(true);
      return;
    }
    
    handleNextSection();
  };


  const handleCancelAutoAdvance = () => {
    setShowAutoAdvanceModal(false);
    toast.info("Staying on current section. Click Next when ready.");
  };

  const handleNextSlide = () => {
    if (!carouselApi) return;

    // Mark current section complete when moving forward
    const curId = courseSections[currentSlide]?.id;
    if (curId) {
      handleSectionComplete(curId);
    }

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
        // @ts-ignore
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
      console.log('[Level2Course] Resuming at section', firstIncompleteIndex + 1);
      // Use requestAnimationFrame for better cross-browser compatibility
      requestAnimationFrame(() => {
        setTimeout(() => {
          carouselApi.scrollTo(firstIncompleteIndex, false);
        }, 100);
      });
    }
  }, [carouselApi, completedSections, courseSections]);

  const progressPercentage = (completedSections.length / totalSections) * 100;
  const allSectionsComplete = examUnlocked;
  
  // IDs logged once on mount
  const userId = debugUserId;
  const courseId = "level2";
  const currentIndex = currentSlide;
  const nextIndex = currentSlide + 1;
  const currentSectionId = courseSections[currentSlide]?.id;
  const nextSectionId = courseSections[nextIndex]?.id;
  const isCurrentSectionComplete = currentSectionId ? completedSections.includes(currentSectionId) : false;
  const isNextSectionComplete = nextSectionId ? completedSections.includes(nextSectionId) : false;
  
  // canProceed: Allow if bypassed, server-confirmed current section, current section already complete, OR next section already completed (going back)
  const canProceed = bypassGate || serverCompleted || isCurrentSectionComplete || isNextSectionComplete;
  
  // Log IDs once on mount
  useEffect(() => {
    if (debugUserId && courseSections.length > 0) {
      console.log('IDS_LOGGED_ON_MOUNT', {
        userId: debugUserId,
        courseId,
        currentSectionId,
        nextSectionId,
        currentIndex,
        nextIndex,
        totalSections: courseSections.length
      });
    }
  }, [debugUserId, currentSectionId, nextSectionId, currentIndex, nextIndex, courseSections.length]);

  // Log when grace timer completes
  useEffect(() => {
    if (graceTimerDone && !canProceed) {
      console.log('GRACE_DONE', { graceTimerDone, serverCompleted, canProceed });
    }
    if (canProceed) {
      console.log('CAN_PROCEED_TRUE', { serverCompleted, graceTimerDone, bypassGate });
    }
  }, [graceTimerDone, canProceed, serverCompleted, bypassGate]);

  // Reset gating states when section changes
  useEffect(() => {
    console.log('SECTION_CHANGED - Resetting gating states', { 
      currentSectionId, 
      currentSlide 
    });
    setServerCompleted(false);
    setGraceTimerDone(false);
    setLocal90Reached(false);
    setPostStatus(null);
  }, [currentSectionId, currentSlide]);
  
  console.log('[Level2Course] GATING CHECK', {
    courseType: 'level2',
    currentSectionId,
    serverCompleted,
    graceTimerDone,
    canProceed,
    bypassGate,
    completedSections,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader isAdmin={isAdmin} showAuthButtons={isAuthenticated} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton fallbackPath="/courses" />
        </div>

        {showEnrollment ? (
          /* Enrollment Form */
          <div className="max-w-2xl mx-auto">
            <EnrollmentForm 
              priceId="price_1SIuwK2Lv7r2i0JX3XIe7Oi0"
              defaultCourseType="level2"
              onSuccess={() => {
                navigate('/course/level2');
              }}
            />
          </div>
        ) : (
          <>
            {/* Course Title */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Level 2 Security Officer Certification</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Complete all 9 sections and pass the final exam to earn your certification.
              </p>
            </div>

        {/* Course Carousel */}
        <div className="mb-6">
            <Carousel 
              setApi={setCarouselApi}
            >
              <CarouselContent>
                {courseSections.map((section, idx) => (
                  <CarouselItem key={section.id}>
                    <VideoPlayer
                      
                      section={{
                        id: section.id,
                        title: section.title,
                        videoUrl: section.videoUrl || "",
                        duration: section.duration,
                        has_quiz: section.has_quiz || false,
                      }}
                      courseType="level2"
                      isActive={currentSlide === idx}
                      onComplete={() => handleSectionComplete(section.id)}
                      onNext={handleNextSlide}
                      onLocal90Reached={(reached) => setLocal90Reached(reached)}
                      onPostStatus={(status) => setPostStatus(status)}
                      onServerCompletedChange={(val) => setServerCompleted(val)}
                      onGraceTimerDoneChange={(val) => setGraceTimerDone(val)}
                      onSectionCompleted={handleSectionCompleted}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-6">
              {/* Navigation Buttons */}
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

              {/* Real Next Button with proper click handler */}
              <button
                id="nextBtn"
                data-testid="btn-next"
                disabled={!canProceed}
                aria-disabled={!canProceed}
                onClick={() => {
                  console.log('CAN_PROCEED_TRUE - NEXT_CLICK_NAV', { 
                    canProceed, 
                    currentSectionId, 
                    nextSectionId,
                    currentIndex,
                    nextIndex
                  });
                  handleNextSection();
                }}
                title={!canProceed ? "Finish previous lesson to unlock" : ""}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                style={{ 
                  outline: import.meta.env.DEV ? (canProceed ? '3px solid lime' : '3px solid red') : undefined,
                  zIndex: 10000,
                  pointerEvents: 'auto'
                }}
              >
                {currentSlide === totalSections - 1 ? 'Next' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Dev Bypass Button */}
            {import.meta.env.DEV && (
              <div className="text-center mt-2">
                <button
                  data-testid="btn-dev-bypass"
                  onClick={handleDevBypass}
                  className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                  style={{ zIndex: 10000 }}
                >
                  🔧 Dev Bypass → Next
                </button>
              </div>
            )}

            <div className="text-center mt-4 space-y-4">
              {/* Dev Panel (page-level gating state) */}
              {!import.meta.env.PROD && (
                <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-xs">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">🔧 Page Gating Debug (Dev Only)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 font-mono">
                    <div><strong>User ID:</strong> {debugUserId || 'N/A'}</div>
                    <div><strong>Course ID:</strong> level2</div>
                    <div><strong>Current Section ID:</strong> {currentSectionId}</div>
                    <div><strong>local90Reached:</strong> {String(local90Reached)}</div>
                    <div><strong>postStatus:</strong> {postStatus ?? 'N/A'}</div>
                    <div><strong>serverCompleted:</strong> {String(serverCompleted)}</div>
                    <div><strong>graceTimerDone:</strong> {String(graceTimerDone)}</div>
                    <div><strong>canProceed:</strong> {String(canProceed)}</div>
                    <div><strong>isCurrentSectionComplete:</strong> {String(isCurrentSectionComplete)}</div>
                    <div className="pt-2 border-t">
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={bypassGate} 
                          onChange={(e) => setBypassGate(e.target.checked)}
                        />
                        <span>Bypass Gate (dev only)</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

        {/* Progress Tracker */}
        <div className="mb-6">
          <ProgressTracker 
            completedSections={completedSections} 
            currentSection={currentSlide + 1}
            totalSections={totalSections}
            showLocks={false}
          />
          {!examUnlocked && (
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
        </div>

        {/* PDF Resource */}
        <div className="mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Private Security Level 2 PDF
              </CardTitle>
              <CardDescription>
                Reference manual to follow along with videos or use during the exam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => window.open('/Level2-Security-Manual.pdf', '_blank')}
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
              <CardDescription className="text-base">
                Complete all sections and pass the final exam to earn your certification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-2xl font-bold text-primary">9</span>
                  <span className="text-muted-foreground">Sections</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-2xl font-bold text-primary">6</span>
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
        {allSectionsComplete && !showQuiz && (
          <Card className="border-l-4 border-l-green-500 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-600">
                <Shield className="h-6 w-6" />
                Ready for Final Exam
              </CardTitle>
              <CardDescription>
                Congratulations! You've completed all {totalSections} course sections. Take the final exam to earn your certification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ All sections completed ({completedSections.length}/{totalSections})
                </p>
              </div>
              <Button onClick={() => {
                setShowQuiz(true);
              }} size="lg" className="w-full">
                Start Final Exam (32 Questions)
              </Button>
            </CardContent>
          </Card>
        )}
        {showQuiz && (
          <div ref={quizRef}>
            <Quiz courseType="level2" />
          </div>
        )}
          </>
        )}
      </div>

      {/* Auto-advance modal */}
      <AutoAdvanceModal
        isOpen={showAutoAdvanceModal}
        sectionTitle={completedSectionTitle}
        onAdvance={handleAutoAdvance}
        onCancel={handleCancelAutoAdvance}
        countdownSeconds={10}
        isFinalSection={currentSlide >= courseSections.length - 1}
      />

      {/* Exam ready prompt */}
      <Dialog open={showExamPrompt} onOpenChange={setShowExamPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <DialogTitle className="text-2xl">Course Complete!</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Congratulations! You've completed all {totalSections} sections of the Level 2 Security Officer course. 
              You're now ready to take the final exam to earn your certification.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">✓ All {totalSections} sections completed</p>
            <p className="text-sm text-muted-foreground">• 32 exam questions</p>
            <p className="text-sm text-muted-foreground">• 80% passing score required</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowExamPrompt(false)} className="w-full sm:w-auto">
              Review Course
            </Button>
            <Button 
              onClick={() => {
                setShowExamPrompt(false);
                setShowQuiz(true);
                setTimeout(() => {
                  quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }} 
              className="w-full sm:w-auto"
            >
              Start Final Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Level2Course;