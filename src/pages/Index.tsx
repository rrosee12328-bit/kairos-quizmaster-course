import { useState } from "react";
import CourseHeader from "@/components/CourseHeader";
import CourseSection from "@/components/CourseSection";
import VideoPlayer from "@/components/VideoPlayer";
import Quiz from "@/components/Quiz";
import ProgressTracker from "@/components/ProgressTracker";
import VideoPresentationPlaceholder from "@/components/VideoPresentationPlaceholder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award, Shield } from "lucide-react";

const courseSections = [
  {
    id: 1,
    title: "Introduction to Security Fundamentals",
    description: "Basic principles of security management and risk assessment",
    duration: "45 min",
    videoUrl: "/videos/section1.mp4",
    completed: false,
    locked: false
  },
  {
    id: 2,
    title: "Physical Security Protocols",
    description: "Perimeter security, access control, and surveillance systems",
    duration: "52 min",
    videoUrl: "/videos/section2.mp4",
    completed: false,
    locked: true
  },
  {
    id: 3,
    title: "Cybersecurity Essentials",
    description: "Digital threats, network security, and data protection",
    duration: "48 min",
    videoUrl: "/videos/section3.mp4",
    completed: false,
    locked: true
  },
  {
    id: 4,
    title: "Threat Assessment & Analysis",
    description: "Identifying, evaluating, and responding to security threats",
    duration: "55 min",
    videoUrl: "/videos/section4.mp4",
    completed: false,
    locked: true
  },
  {
    id: 5,
    title: "Emergency Response Procedures",
    description: "Crisis management and emergency evacuation protocols",
    duration: "41 min",
    videoUrl: "/videos/section5.mp4",
    completed: false,
    locked: true
  },
  {
    id: 6,
    title: "Legal & Regulatory Compliance",
    description: "Security laws, regulations, and compliance requirements",
    duration: "39 min",
    videoUrl: "/videos/section6.mp4",
    completed: false,
    locked: true
  },
  {
    id: 7,
    title: "Investigation Techniques",
    description: "Evidence collection, documentation, and case management",
    duration: "47 min",
    videoUrl: "/videos/section7.mp4",
    completed: false,
    locked: true
  },
  {
    id: 8,
    title: "Advanced Security Technologies",
    description: "Modern security systems, AI, and automated monitoring",
    duration: "44 min",
    videoUrl: "/videos/section8.mp4",
    completed: false,
    locked: true
  },
  {
    id: 9,
    title: "Professional Ethics & Communication",
    description: "Ethical standards, reporting procedures, and client relations",
    duration: "38 min",
    videoUrl: "/videos/section9.mp4",
    completed: false,
    locked: true
  }
];

const Index = () => {
  const [sections, setSections] = useState(courseSections);
  const [currentView, setCurrentView] = useState<'overview' | 'video' | 'quiz'>('overview');
  const [currentSection, setCurrentSection] = useState<number | null>(null);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  const handleStartSection = (sectionId: number) => {
    setCurrentSection(sectionId);
    setCurrentView('video');
  };

  const handleCompleteSection = () => {
    if (currentSection && !completedSections.includes(currentSection)) {
      const newCompleted = [...completedSections, currentSection];
      setCompletedSections(newCompleted);
      
      // Unlock next section
      setSections(prev => prev.map(section => {
        if (section.id === currentSection + 1) {
          return { ...section, locked: false };
        }
        if (section.id === currentSection) {
          return { ...section, completed: true };
        }
        return section;
      }));
    }
    setCurrentView('overview');
    setCurrentSection(null);
  };

  const handleNextSection = () => {
    if (currentSection && currentSection < sections.length) {
      handleCompleteSection();
      if (currentSection < sections.length) {
        setTimeout(() => handleStartSection(currentSection + 1), 500);
      }
    }
  };

  const handleStartQuiz = () => {
    setCurrentView('quiz');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setCurrentSection(null);
  };

  const isQuizUnlocked = completedSections.length === sections.length;

  if (currentView === 'video' && currentSection) {
    const section = sections.find(s => s.id === currentSection);
    if (section) {
      return (
        <div className="min-h-screen bg-background">
          <CourseHeader />
          <div className="container mx-auto px-6 py-8">
            <div className="mb-4">
              <Button variant="outline" onClick={handleBackToOverview}>
                ← Back to Course Overview
              </Button>
            </div>
            <VideoPlayer
              section={section}
              onComplete={handleCompleteSection}
              onNext={handleNextSection}
            />
          </div>
        </div>
      );
    }
  }

  if (currentView === 'quiz') {
    return (
      <div className="min-h-screen bg-background">
        <CourseHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="mb-4">
            <Button variant="outline" onClick={handleBackToOverview}>
              ← Back to Course Overview
            </Button>
          </div>
          <Quiz />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CourseHeader />
      
      <div className="container mx-auto px-6 py-8">
        {/* Video Presentation Placeholder */}
        <VideoPresentationPlaceholder />
        
        {/* Course Introduction */}
        <div className="mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Level 3 Security Officer Certification Course
              </CardTitle>
              <CardDescription className="text-base">
                Comprehensive training program designed to prepare security professionals for advanced security operations. 
                Complete all 9 sections and pass the final exam to earn your certification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">9 Training Sections</div>
                    <div className="text-sm text-muted-foreground">7+ hours of content</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">100 Question Exam</div>
                    <div className="text-sm text-muted-foreground">70% pass rate required</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Professional Certification</div>
                    <div className="text-sm text-muted-foreground">Industry recognized</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Sections */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-6">Course Sections</h2>
            {sections.map((section) => (
              <CourseSection
                key={section.id}
                section={section}
                onStartSection={handleStartSection}
              />
            ))}
            
            {/* Final Exam Card */}
            <Card className={`border-l-4 ${isQuizUnlocked ? 'border-l-green-600' : 'border-l-muted'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isQuizUnlocked ? 'bg-green-600/10' : 'bg-muted'
                    }`}>
                      <Award className={`h-5 w-5 ${isQuizUnlocked ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Final Certification Exam</CardTitle>
                      <CardDescription>
                        100 multiple choice questions covering all course material
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isQuizUnlocked 
                      ? "Ready to take your certification exam"
                      : "Complete all sections to unlock the final exam"
                    }
                  </div>
                  <Button
                    onClick={handleStartQuiz}
                    disabled={!isQuizUnlocked}
                    variant={isQuizUnlocked ? "default" : "secondary"}
                  >
                    {isQuizUnlocked ? "Start Exam" : "Locked"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Sidebar */}
          <div className="space-y-6">
            <ProgressTracker
              completedSections={completedSections}
              currentSection={currentSection || 1}
              totalSections={sections.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
