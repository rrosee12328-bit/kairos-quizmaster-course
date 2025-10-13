import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import CourseSection from "@/components/CourseSection";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import CourseHeader from "@/components/CourseHeader";
import VideoPlayer from "@/components/VideoPlayer";
import securityHero from "@/assets/security-training-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const Level2Course = () => {
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [inCourseMode, setInCourseMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);
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

  // Fetch videos from Bunny.net
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

        // Build updated sections with matched videos
        let updatedSections: typeof courseSections = [] as any;
        updatedSections = (prevSections =>
          prevSections.map(section => {
            const sNorm = normalize(section.title);

            const matchingVideo = videos.find((video: any) => {
              const title = video?.title || '';
              const vNorm = normalize(title);
              const num = leadingNumber(title);
              return (
                vNorm.includes(sNorm) ||
                sNorm.includes(vNorm) ||
                num === section.id
              );
            });
            
            if (matchingVideo?.guid) {
              return {
                ...section,
                videoUrl: `https://iframe.mediadelivery.net/embed/510506/${matchingVideo.guid}`
              };
            }
            return section;
          })
        )(/* current state provided below */ courseSections as any);

        setCourseSections(updatedSections as any);

        const missing = updatedSections.filter(s => !s.videoUrl);
        if (missing.length) {
          toast.warning(`Videos not found for ${missing.length} section(s): ${missing.map(m => m.title).join(', ')}`);
        }

        setVideosLoaded(true);
      } catch (err) {
        console.error('Error fetching videos:', err);
        toast.error('Failed to load course videos');
      }
    };

    fetchVideos();
  }, []);

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

  const handleStartCourse = () => {
    setInCourseMode(true);
    setCurrentSlide(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {/* Course Title */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Level 2 Security Officer Certification Course</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive training program for unarmed security officers covering essential topics from basic security 
            principles to emergency response. Complete all 9 sections and pass the final exam to earn your certification.
          </p>
        </div>

        {/* Hero Image */}
        <div className="mb-8 rounded-lg overflow-hidden shadow-xl">
          <img 
            src={securityHero} 
            alt="Professional security training for unarmed security officers"
            className="w-full h-[400px] object-cover"
          />
        </div>
        
        {/* Course Overview */}
        <div className="mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                Course Overview
              </CardTitle>
              <CardDescription className="text-base">
                Get familiar with the course structure and certification requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
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
            </CardContent>
          </Card>
        </div>

        {/* Progress Tracker */}
        {inCourseMode && (
          <div className="mb-8">
            <ProgressTracker 
              completedSections={completedSections} 
              currentSection={currentSlide + 1}
              totalSections={totalSections}
            />
          </div>
        )}

        {/* Course Carousel - Kajabi Style */}
        {inCourseMode ? (
          <div className="mb-8 animate-fade-in">
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

            <div className="text-center mt-4 space-y-3">
              <Button
                onClick={() => {
                  // Mark all sections complete and open final exam
                  setCompletedSections(courseSections.map(s => s.id));
                  setShowQuiz(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                size="sm"
              >
                Go to Final Exam
              </Button>

              <div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setInCourseMode(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Exit Course View
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Course Overview - Show when not in course mode */}
            <div className="space-y-6 mb-8 animate-fade-in">
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle>Start Your Training</CardTitle>
                  <CardDescription>
                    Begin the course and progress through each section with our interactive video player.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleStartCourse} size="lg" className="w-full">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Start Course
                  </Button>
                </CardContent>
              </Card>

              {courseSections.map((section) => {
                const isCompleted = completedSections.includes(section.id);
                
                return (
                  <CourseSection
                    key={section.id}
                    section={{
                      ...section,
                      videoUrl: section.videoUrl || "",
                      completed: isCompleted,
                      locked: false
                    }}
                    onStartSection={() => {
                      handleStartCourse();
                      setTimeout(() => carouselApi?.scrollTo(section.id - 1), 100);
                    }}
                  />
                );
              })}
            </div>
          </>
        )}

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
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} size="lg" className="w-full">
                Start Final Exam (100 Questions)
              </Button>
            </CardContent>
          </Card>
        )}
        {allSectionsComplete && showQuiz && <Quiz />}
      </div>
    </div>
  );
};

export default Level2Course;