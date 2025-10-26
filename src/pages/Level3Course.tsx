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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const Course = () => {
  const navigate = useNavigate();
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

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

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
    if (!error && data) {
      setIsAdmin(true);
    }
  };

  const checkEnrollmentStatus = async (userId: string) => {
    // Check if user is enrolled or has completed the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('enrollment_status')
      .eq('user_id', userId)
      .eq('course_type', 'level3')
      .maybeSingle();

    const { data: completion } = await supabase
      .from('course_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('course_type', 'level3')
      .eq('passed', true)
      .maybeSingle();

    // Allow access if enrolled OR completed (for review)
    if (!enrollment && !completion && !isAdmin) {
      toast.error('You need to enroll in this course first');
      navigate('/courses');
    }
  };

  const courseSections = [
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
  ];

  const handleSectionComplete = (sectionId: number) => {
    setCompletedSections((prev) => {
      const next = prev.includes(sectionId) ? prev : [...prev, sectionId];
      console.log('[Course] Section complete', { sectionId, next });
      return next;
    });
  };

  const handleNextSlide = () => {
    if (!carouselApi) return;

    // Mark current section complete when moving forward (keeps progress bar in sync)
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
        // @ts-ignore - Embla may expose off()
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

  useEffect(() => {
    if (showQuiz) {
      setTimeout(() => {
        quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [showQuiz]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader isAdmin={isAdmin} showAuthButtons={isAuthenticated} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton fallbackPath="/courses" />
        </div>
        
        {/* Course Title */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Level 3 Security Officer Certification (Part 1)</h1>
          </div>
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Part 1 (Online):</strong> Complete all 10 sections and pass the final exam.
            </p>
            <div className="text-sm font-semibold text-primary bg-primary/10 p-3 rounded-lg border border-primary/20">
              ⚠️ Part 2 (In-Person): Must be completed in person after Part 1 to earn full armed certification
            </div>
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
                    <VideoPlayer
                      section={{
                        id: section.id,
                        title: section.title,
                        videoUrl: section.videoUrl || "",
                        duration: section.duration,
                      }}
                      courseType="level3"
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
                disabled={currentSlide === totalSections - 1 || !isCurrentSectionComplete}
                title={!isCurrentSectionComplete ? "Complete current section to unlock next" : ""}
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
                Go to Part 1 Final Exam
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
        {allSectionsComplete && !showQuiz && (
          <Card className="border-l-4 border-l-green-500 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-600">
                <Shield className="h-6 w-6" />
                Ready for Part 1 Final Exam
              </CardTitle>
              <CardDescription>
                Congratulations! You&apos;ve completed all {totalSections} Part 1 sections. Pass the final exam, then complete Part 2 in-person training for full certification.
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
                Start Part 1 Final Exam (100 Questions)
              </Button>
            </CardContent>
          </Card>
        )}
        <div ref={quizRef}>{showQuiz && <Quiz courseType="level3" />}</div>
      </div>

      <Footer />
    </div>
  );
};

export default Course;