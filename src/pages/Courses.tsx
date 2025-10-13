import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Award, Users, BookOpen, ArrowRight, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import kairosLogo from "@/assets/kairos-logo.png";
import securityTrainingImage from "@/assets/security-training-courses.jpg";

const Courses = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkAdminStatus(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const courses = [
    {
      id: "level2",
      title: "Level 2 Security Officer Certification",
      subtitle: "Unarmed Security Professional",
      description: "Comprehensive training for unarmed security officers focusing on observation, communication, and conflict resolution without the use of firearms.",
      duration: "6 hours",
      sections: 8,
      level: "Intermediate",
      color: "bg-blue-500",
      features: [
        "Unarmed security protocols",
        "De-escalation techniques", 
        "Observation and reporting",
        "Customer service skills",
        "Emergency response (non-armed)",
        "Legal framework for unarmed officers"
      ],
      route: "/course/level2"
    },
    {
      id: "level3", 
      title: "Level 3 Security Officer Certification (Part 1)",
      subtitle: "Armed Security Professional - Online Training",
      description: "Part 1: Advanced online training for armed security professionals including firearm safety, advanced threat assessment, and armed response procedures. Part 2 in-person training required for full certification.",
      duration: "30 hours",
      sections: 10,
      level: "Advanced",
      color: "bg-red-500",
      features: [
        "Firearm safety and handling",
        "Armed response protocols",
        "Advanced threat assessment",
        "Use of force continuum",
        "Weapons maintenance",
        "Legal responsibilities of armed officers"
      ],
      route: "/course/level3"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Kairos Security Academy</h1>
            </Link>
            <div className="flex items-center gap-2">
              <BackButton />
              <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                  <Link to="/">Home</Link>
                </Button>
              {user ? (
                <>
                  {isAdmin && (
                    <Button variant="ghost" asChild>
                      <Link to="/admin">Admin</Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">Security Officer Certification Courses</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the certification level that matches your career goals. Both courses provide industry-recognized 
            training with comprehensive curriculum and final examinations.
          </p>
        </div>

        {/* Hero Image */}
        <div className="mb-16 rounded-lg overflow-hidden shadow-xl max-w-5xl mx-auto">
          <img 
            src={securityTrainingImage} 
            alt="Security Training Courses" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Course Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${course.color} opacity-10 transform rotate-45 translate-x-16 -translate-y-16`}></div>
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${course.color} text-white`}>
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {course.level}
                      </Badge>
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <CardDescription className="text-lg font-medium text-primary">
                        {course.subtitle}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
                {course.id === "level3" && (
                  <div className="mt-4 text-sm font-semibold text-primary bg-primary/10 p-3 rounded-lg border border-primary/20">
                    ⚠️ Part 2 in-person training required for full armed certification
                  </div>
                )}
              </CardHeader>

              <CardContent className="relative">
                {/* Course Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <div className="font-semibold">{course.sections}</div>
                    <div className="text-xs text-muted-foreground">Sections</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <div className="font-semibold">{course.duration}</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Award className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <div className="font-semibold">Cert</div>
                    <div className="text-xs text-muted-foreground">Included</div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    What You'll Learn
                  </h4>
                  <ul className="space-y-2">
                    {course.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Button asChild className="w-full" size="lg">
                  <Link to={course.route} className="flex items-center gap-2">
                    Start Course
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <Award className="h-6 w-6 text-primary" />
                Industry Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Both certification levels are recognized by industry employers and meet professional standards 
                for security officers. Complete the course materials and pass the final exam to earn your certificate.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Courses;