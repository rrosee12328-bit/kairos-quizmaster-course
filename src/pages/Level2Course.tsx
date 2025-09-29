import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, AlertTriangle } from "lucide-react";
import CourseSection from "@/components/CourseSection";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import VideoPresentationPlaceholder from "@/components/VideoPresentationPlaceholder";
import CourseHeader from "@/components/CourseHeader";

const Level2Course = () => {
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const courseSections = [
    {
      id: 1,
      title: "Introduction to Unarmed Security Operations",
      description: "Overview of unarmed security principles and professional responsibilities",
      duration: "40 minutes",
      content: [
        "Understanding the role of an unarmed Security Officer",
        "Professional conduct and appearance standards",
        "Legal limitations and responsibilities",
        "Code of ethics for security professionals"
      ]
    },
    {
      id: 2,
      title: "Observation and Reporting Techniques",
      description: "Developing keen observation skills and effective reporting methods",
      duration: "50 minutes",
      content: [
        "Visual observation techniques",
        "Note-taking and documentation skills", 
        "Incident report writing",
        "Chain of evidence procedures"
      ]
    },
    {
      id: 3,
      title: "Communication and Customer Service",
      description: "Professional communication skills for security environments",
      duration: "45 minutes",
      content: [
        "Effective verbal communication",
        "Active listening techniques",
        "Customer service in security settings",
        "Professional telephone etiquette"
      ]
    },
    {
      id: 4,
      title: "Conflict Resolution and De-escalation",
      description: "Non-violent conflict resolution and de-escalation strategies",
      duration: "60 minutes",
      content: [
        "Understanding conflict dynamics",
        "Verbal de-escalation techniques",
        "Body language and positioning",
        "When to call for backup or law enforcement"
      ]
    },
    {
      id: 5,
      title: "Access Control and Perimeter Security",
      description: "Managing access points and maintaining secure perimeters",
      duration: "45 minutes",
      content: [
        "Access control procedures",
        "Visitor management protocols",
        "Key and card control systems",
        "Patrol techniques and routes"
      ]
    },
    {
      id: 6,
      title: "Emergency Response for Unarmed Officers",
      description: "Appropriate emergency response procedures without weapons",
      duration: "55 minutes",
      content: [
        "Medical emergency response",
        "Fire evacuation procedures",
        "Natural disaster protocols",
        "Bomb threat procedures"
      ]
    },
    {
      id: 7,
      title: "Legal Framework for Unarmed Security",
      description: "Understanding legal powers and limitations of unarmed officers",
      duration: "40 minutes",
      content: [
        "Citizen's arrest powers and limitations",
        "Detention vs. arrest",
        "Search and seizure restrictions",
        "Liability and insurance considerations"
      ]
    },
    {
      id: 8,
      title: "Technology and Security Systems",
      description: "Operating basic security technology and surveillance systems",
      duration: "45 minutes",
      content: [
        "CCTV monitoring basics",
        "Alarm system operation",
        "Radio communication protocols",
        "Basic computer and mobile device usage"
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
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold">Level 2 Security Officer Certification Course</h1>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-medium text-blue-600">Unarmed Security Professional</span>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive training program for unarmed security officers focusing on observation, communication, 
            and conflict resolution. Complete all 8 sections and pass the final exam to earn your certification.
          </p>
        </div>

        {/* Video Presentation Placeholder */}
        <VideoPresentationPlaceholder />
        
        {/* Course Overview */}
        <div className="mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-blue-500" />
                Course Overview - Unarmed Security Officer
              </CardTitle>
              <CardDescription className="text-base">
                This course prepares you for unarmed security positions with emphasis on non-violent conflict resolution and professional service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-2xl font-bold text-blue-500">8</span>
                  <span className="text-muted-foreground">Sections</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-2xl font-bold text-blue-500">6</span>
                  <span className="text-muted-foreground">Hours</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-2xl font-bold text-blue-500">1</span>
                  <span className="text-muted-foreground">Final Exam</span>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">Important Notice</span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Level 2 Security Officers are <strong>NOT authorized to carry firearms</strong>. This certification 
                  focuses on non-violent security methods, observation, and communication skills.
                </p>
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
                  videoUrl: "", // Add placeholder video URL
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
                Congratulations! You've completed all course sections. Take the final exam to earn your Level 2 certification.
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

export default Level2Course;