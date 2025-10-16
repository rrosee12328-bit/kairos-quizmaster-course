import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import CourseHeader from "@/components/CourseHeader";
import VideoPlayer from "@/components/VideoPlayer";
import EnrollmentForm from "@/components/EnrollmentForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const quizRef = useRef<HTMLDivElement>(null);
  const [courseSections, setCourseSections] = useState([
    {
      id: 1,
      title: "Welcome",
      description: "Introduction to the Level 2 Security Officer Certification Course",
      duration: "6 seconds",
      videoUrl: "",
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
      duration: "38 minutes 3 seconds",
      videoUrl: "",
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
      content: [
        "Report writing techniques",
        "Professional correspondence",
        "Documentation standards"
      ]
    },
    {
      id: 9,
      title: "Emergencies and Safety Hazards",
      description: "Emergency response procedures and hazard identification",
      duration: "6 minutes 40 seconds",
      videoUrl: "",
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
  }, [isPageVisible]);

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
      if (!isPageVisible || videosLoaded) return; // Skip if page not visible or already loaded
      
      try {
        const { data, error } = await supabase.functions.invoke('bunny-video', {
          body: { 
            action: 'listVideos',
            libraryId: '510506'
          }
        });

        if (error) throw error;

        const videos = data?.items || [];
        console.log('[Level2Course] Fetched videos:', videos?.map((v: any) => ({ title: v?.title, guid: v?.guid })));

        if (!videos.length) {
          toast.error('No videos found in Bunny.net library 510506');
        }

        // Build updated sections with matched videos using functional state update
        setCourseSections((prev) => {
          const updated = prev.map((section) => {
            const sNorm = normalize(section.title);

            const byNumber = videos.find((video: any) => leadingNumber(video?.title || '') === section.id);
            const byTitle = videos.find((video: any) => {
              const title = video?.title || '';
              const vNorm = normalize(title);
              return vNorm.includes(sNorm) || sNorm.includes(vNorm);
            });

            const matchingVideo = byNumber || byTitle;

            if (matchingVideo?.guid) {
              return {
                ...section,
                videoUrl: `https://iframe.mediadelivery.net/embed/510506/${matchingVideo.guid}`,
              };
            }
            return section;
          });

          console.log('[Level2Course] Section video map', updated.map(s => ({ id: s.id, title: s.title, hasUrl: !!s.videoUrl })));

          const missing = updated.filter((s) => !s.videoUrl);
          if (missing.length) {
            toast.warning(`Videos not found for ${missing.length} section(s): ${missing.map((m) => m.title).join(', ')}`);
          }

          return updated;
        });

        setVideosLoaded(true);
      } catch (err) {
        console.error('Error fetching videos:', err);
        toast.error('Failed to load course videos');
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

  const handleSectionComplete = (sectionId: number) => {
    setCompletedSections((prev) => {
      const next = prev.includes(sectionId) ? prev : [...prev, sectionId];
      console.log('[Level2Course] Section complete', { sectionId, next });
      return next;
    });
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

  const totalSections = courseSections.length;
  const progressPercentage = (completedSections.length / totalSections) * 100;
  const allSectionsComplete = completedSections.length === totalSections;
  const currentSectionId = courseSections[currentSlide]?.id;
  const isCurrentSectionComplete = currentSectionId ? completedSections.includes(currentSectionId) : false;

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
              priceId="price_1SIuLD2Lv7r2i0JXXk5P6dwi"
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
        <div className="mb-6 animate-fade-in">
            <Carousel 
              setApi={setCarouselApi}
            >
              <CarouselContent>
                {courseSections.map((section, idx) => (
                  <CarouselItem key={section.id}>
                    <VideoPlayer
                      key={`video-${section.id}-${section.videoUrl || 'empty'}-${currentSlide === idx ? 'active' : 'inactive'}`}
                      section={{
                        id: section.id,
                        title: section.title,
                        videoUrl: section.videoUrl || "",
                        duration: section.duration,
                      }}
                      isActive={currentSlide === idx}
                      onComplete={() => handleSectionComplete(section.id)}
                      onNext={handleNextSlide}
                    />
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

              <Button
                onClick={handleNextSlide}
                disabled={currentSlide === totalSections - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="text-center mt-4">
              <Button
                onClick={() => {
                  setShowQuiz(true);
                }}
                size="sm"
              >
                Go to Final Exam
              </Button>
            </div>
          </div>

        {/* Progress Tracker */}
        <div className="mb-6">
          <ProgressTracker 
            completedSections={completedSections} 
            currentSection={currentSlide + 1}
            totalSections={totalSections}
          />
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

      <Footer />
    </div>
  );
};

export default Level2Course;