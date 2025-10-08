import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import CourseSection from "@/components/CourseSection";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import VideoPresentationPlaceholder from "@/components/VideoPresentationPlaceholder";
import CourseHeader from "@/components/CourseHeader";
import VideoPlayer from "@/components/VideoPlayer";
import securityHero from "@/assets/security-training-hero.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const Course = () => {
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [inCourseMode, setInCourseMode] = useState(false);

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
      title: "Legal and Regulatory Framework",
      description: "Understanding the legal context of security operations",
      duration: "55 minutes",
      content: [
        "Security legislation",
        "Data protection laws",
        "Use of force regulations",
        "Court procedures and testimony"
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
  const handleStartCourse = () => {
    setInCourseMode(true);
    setCurrentSlide(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const totalSections = courseSections.length;
  const progressPercentage = (completedSections.length / totalSections) * 100;
  const allSectionsComplete = completedSections.length === totalSections;
  const currentSectionId = courseSections[currentSlide]?.id;
  const isCurrentSectionComplete = currentSectionId ? completedSections.includes(currentSectionId) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader />
      
      <div className="container mx-auto px-6 py-8">
        {/* Course Title */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Level 3 Security Officer Certification Course</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive training program designed to prepare security professionals for advanced security operations. 
            Complete all 10 sections and pass the final exam to earn your certification.
          </p>
        </div>

        {/* Hero Image */}
        <div className="mb-8 rounded-lg overflow-hidden shadow-xl">
          <img 
            src={securityHero} 
            alt="Professional security operations center with officers monitoring surveillance systems"
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
                  <span className="text-2xl font-bold text-primary">10</span>
                  <span className="text-muted-foreground">Sections</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-2xl font-bold text-primary">8</span>
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

            <div className="text-center mt-4">
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
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-600">
                <Shield className="h-6 w-6" />
                Ready for Final Exam
              </CardTitle>
              <CardDescription>
                Congratulations! You've completed all course sections. Take the final exam to earn your certification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowQuiz(true)} size="lg" className="w-full">
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

export default Course;