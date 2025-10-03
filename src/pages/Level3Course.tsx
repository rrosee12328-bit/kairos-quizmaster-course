import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield } from "lucide-react";
import CourseSection from "@/components/CourseSection";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import VideoPresentationPlaceholder from "@/components/VideoPresentationPlaceholder";
import CourseHeader from "@/components/CourseHeader";

const Course = () => {
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const courseSections = [
    {
      id: 1,
      title: "Introduction",
      description: "Welcome to the Level 3 Security Officer Certification Course",
      duration: "15 minutes",
      videoUrl: "https://www.youtube.com/embed/SungCb3PZXc",
      content: [
        "Course overview and objectives",
        "What to expect from the training",
        "Certification requirements",
        "Getting started"
      ]
    },
    {
      id: 2,
      title: "Introduction to Security Operations",
      description: "Overview of security principles and basic operational procedures",
      duration: "45 minutes",
      videoUrl: "https://www.youtube.com/embed/Sn2CQrMxxg4",
      content: [
        "Understanding the role of a Level 3 Security Officer",
        "Basic security terminology and concepts",
        "Legal responsibilities and authority",
        "Professional conduct and ethics"
      ]
    },
    {
      id: 3,
      title: "Risk Assessment and Management",
      description: "Identifying, analyzing, and mitigating security risks",
      duration: "60 minutes",
      content: [
        "Risk identification techniques",
        "Threat assessment methodologies",
        "Vulnerability analysis",
        "Risk mitigation strategies"
      ]
    },
    {
      id: 4,
      title: "Access Control Systems",
      description: "Managing and monitoring access to secured areas",
      duration: "50 minutes",
      content: [
        "Types of access control systems",
        "Card reader technologies",
        "Biometric systems",
        "Visitor management protocols"
      ]
    },
    {
      id: 5,
      title: "CCTV and Surveillance",
      description: "Operating and monitoring surveillance equipment",
      duration: "55 minutes",
      content: [
        "Camera types and positioning",
        "Monitoring techniques",
        "Recording and storage systems",
        "Privacy considerations"
      ]
    },
    {
      id: 6,
      title: "Emergency Response Procedures",
      description: "Handling various emergency situations effectively",
      duration: "70 minutes",
      content: [
        "Fire emergency procedures",
        "Medical emergency response",
        "Evacuation protocols",
        "Communication during emergencies"
      ]
    },
    {
      id: 7,
      title: "Incident Reporting and Documentation",
      description: "Proper documentation and reporting of security incidents",
      duration: "40 minutes",
      content: [
        "Incident report writing",
        "Evidence collection",
        "Chain of custody procedures",
        "Legal documentation requirements"
      ]
    },
    {
      id: 8,
      title: "Communication and Interpersonal Skills",
      description: "Effective communication in security contexts",
      duration: "45 minutes",
      content: [
        "Professional communication",
        "De-escalation techniques",
        "Customer service in security",
        "Working with law enforcement"
      ]
    },
    {
      id: 9,
      title: "Physical Security Measures",
      description: "Understanding and implementing physical security controls",
      duration: "50 minutes",
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
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId]);
    }
  };

  const totalSections = courseSections.length;
  const progressPercentage = (completedSections.length / totalSections) * 100;
  const allSectionsComplete = completedSections.length === totalSections;

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

        {/* Video Presentation Placeholder */}
        <VideoPresentationPlaceholder />
        
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
        <ProgressTracker 
          completedSections={completedSections} 
          currentSection={Math.max(...completedSections, 0) + 1}
          totalSections={totalSections}
        />

        {/* Course Sections */}
        <div className="space-y-6 mb-8">
          {courseSections.map((section) => {
            const isCompleted = completedSections.includes(section.id);
            const isLocked = section.id > Math.max(...completedSections, 0) + 1;
            
            return (
              <CourseSection
                key={section.id}
                section={{
                  ...section,
                  videoUrl: section.videoUrl || "",
                  completed: isCompleted,
                  locked: isLocked
                }}
                onStartSection={() => handleSectionComplete(section.id)}
              />
            );
          })}
        </div>

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