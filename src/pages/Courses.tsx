import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Award, Users, BookOpen, ArrowRight, LogOut, ShoppingCart, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import kairosLogo from "@/assets/kairos-logo.png";
import securityTrainingImage from "@/assets/security-training-courses.jpg";

const Courses = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkAdminStatus(user.id);
        fetchEnrollments(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        fetchEnrollments(session.user.id);
      } else {
        setIsAdmin(false);
        setEnrollments([]);
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

  const fetchEnrollments = async (userId: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId);
    
    if (!error && data) {
      setEnrollments(data);
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

  const handlePurchase = async (priceId: string, courseType: string) => {
    if (!user) {
      toast.error("Please sign in to purchase courses");
      navigate('/auth');
      return;
    }

    // Check if already enrolled
    if (enrollments.some(e => e.course_type === courseType && e.enrollment_status === 'enrolled')) {
      toast.info("You already own this course");
      return;
    }

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to create checkout session");
    } finally {
      setProcessingPayment(false);
    }
  };

  const courses: Array<{
    id: string;
    title: string;
    subtitle: string;
    description: string;
    duration: string;
    sections: number;
    level: string;
    color: string;
    features: string[];
    route: string;
    priceId?: string;
    price?: string;
  }> = [
    {
      id: "level2",
      title: "Level 2 Security Officer Certification",
      subtitle: "Unarmed Security Professional",
      description: "Comprehensive training for unarmed security officers focusing on observation, communication, and conflict resolution without the use of firearms.",
      duration: "6 hours",
      sections: 9,
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
      route: "/course/level2",
      priceId: "price_1SIuwK2Lv7r2i0JX3XIe7Oi0",
      price: "$1.00 (Test)"
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
      route: "/course/level3",
      priceId: "price_1SIuap2Lv7r2i0JXWjbkKkWm",
      price: "$125.00"
    },
    {
      id: "level4",
      title: "Level 4: Personal Protection Officer",
      subtitle: "Bodyguard & Executive Protection",
      description: "15 hour advanced certification for Personal Protection Officers. Learn comprehensive protection planning, threat avoidance, defensive tactics, and coordination with authorities.",
      duration: "15 hours",
      sections: 1,
      level: "Expert",
      color: "bg-purple-500",
      features: [
        "Comprehensive Protection Planning",
        "Building Client Profiles",
        "Rings of Protection",
        "Force Continuum",
        "Unarmed Defensive Tactics",
        "Use of Force & Deadly Force"
      ],
      route: "/course/level4",
      priceId: "price_1SIuhk2Lv7r2i0JXmknziXJn",
      price: "$200.00"
    },
    {
      id: "pepper-spray",
      title: "Pepper Spray Training",
      subtitle: "Non-Lethal Defense Equipment",
      description: "Essential training on the proper use, safety protocols, and legal considerations of pepper spray for security professionals.",
      duration: "2 hours",
      sections: 1,
      level: "Beginner",
      color: "bg-orange-500",
      features: [
        "Proper handling techniques",
        "Deployment and aim",
        "Safety protocols",
        "Legal use of force considerations",
        "Decontamination procedures",
        "Maintenance and storage"
      ],
      route: "/course/pepper-spray",
      priceId: "price_1SIulC2Lv7r2i0JX6rKjuKRr",
      price: "$50.00"
    }
  ];

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.course_type === courseId && e.enrollment_status === 'enrolled');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Kairos Security Academy</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/">Home</Link>
              </Button>
              {user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/profile">Profile</Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" asChild>
                      <Link to="/admin">Admin</Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Security Training Courses</h2>
            <p className="text-xl text-muted-foreground">
              Professional certification programs for security officers
            </p>
          </div>

          {/* Hero Image */}
          <div className="mb-12 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={securityTrainingImage} 
              alt="Security Training Courses" 
              className="w-full h-[400px] object-cover"
            />
          </div>

          {/* Course Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {courses.map((course) => {
              const enrolled = isEnrolled(course.id);
              
              return (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={course.color}>{course.level}</Badge>
                      {enrolled && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                          ✓ Purchased
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{course.title}</CardTitle>
                    <CardDescription className="text-base">{course.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">{course.description}</p>
                    
                    {/* Course Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{course.sections} sections</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    {/* Learning Objectives */}
                    <div>
                      <h4 className="font-semibold mb-3">What you'll learn:</h4>
                      <ul className="space-y-2">
                        {course.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price and CTA */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-bold">{course.price}</p>
                          <p className="text-xs text-muted-foreground">One-time payment</p>
                        </div>
                      </div>
                      
                      {enrolled ? (
                        <div className="space-y-2">
                          <Button asChild className="w-full" size="lg">
                            <Link to={course.route}>
                              Continue Course
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            You already own this course
                          </p>
                        </div>
                      ) : user ? (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => handlePurchase(course.priceId || '', course.id)}
                          disabled={processingPayment}
                        >
                          {processingPayment ? "Processing..." : "Purchase Course"}
                        </Button>
                      ) : (
                        <Button asChild className="w-full" size="lg">
                          <Link to="/auth">
                            Sign In to Purchase
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;