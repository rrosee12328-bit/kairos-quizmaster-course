import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, AlertTriangle } from "lucide-react";
import CourseSection from "@/components/CourseSection";
import ProgressTracker from "@/components/ProgressTracker";
import Quiz from "@/components/Quiz";
import VideoPresentationPlaceholder from "@/components/VideoPresentationPlaceholder";
import CourseHeader from "@/components/CourseHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Level2Course = () => {
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
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
        console.log('Fetched videos:', videos);

        // Map video titles to section IDs
        const videoTitleMap: { [key: string]: number } = {
          'welcome': 1,
          'training objective': 2,
          'security officer basics': 3,
          'applicable rules and state laws': 4,
          'personal communication and conflict resolution': 5,
          'use of force': 6,
          'arrests': 7,
          'verbal and written communication best practices': 8,
          'emergencies and safety hazards': 9
        };

        // Update course sections with video URLs
        setCourseSections(prevSections =>
          prevSections.map(section => {
            const matchingVideo = videos.find((video: any) => 
              videoTitleMap[video.title?.toLowerCase()] === section.id
            );
            
            if (matchingVideo) {
              return {
                ...section,
                videoUrl: `https://iframe.mediadelivery.net/embed/510506/${matchingVideo.guid}`
              };
            }
            return section;
          })
        );

        setVideosLoaded(true);
      } catch (error) {
        console.error('Error fetching videos:', error);
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
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId]);
    }
  };

  const totalSections = courseSections.length;
  const progressPercentage = (completedSections.length / totalSections) * 100;
  const allSectionsComplete = completedSections.length === totalSections;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <CourseHeader isAdmin={isAdmin} showAuthButtons={isAuthenticated} />
      
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
            Comprehensive training program for unarmed security officers covering essential topics from basic security 
            principles to emergency response. Complete all 9 sections and pass the final exam to earn your certification.
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
                  <span className="text-2xl font-bold text-blue-500">9</span>
                  <span className="text-muted-foreground">Sections</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-2xl font-bold text-blue-500">2.5</span>
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