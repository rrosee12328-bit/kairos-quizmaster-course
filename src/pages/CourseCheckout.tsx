import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, BookOpen, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import kairosLogo from "@/assets/kairos-logo.png";

const CourseCheckout = () => {
  const { courseType } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchEnrollments(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEnrollments(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEnrollments = async (userId: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId);
    
    if (!error && data) {
      setEnrollments(data);
    }
  };

  const courseData: Record<string, any> = {
    level2: {
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
      priceId: "price_1SIuwK2Lv7r2i0JX3XIe7Oi0",
      price: "$1.00",
      originalPrice: "$50.00"
    },
    level3: {
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
      priceId: "price_1SIuap2Lv7r2i0JXWjbkKkWm",
      price: "$125.00"
    },
    level4: {
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
      priceId: "price_1SIuhk2Lv7r2i0JXmknziXJn",
      price: "$200.00"
    },
    "pepper-spray": {
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
      priceId: "price_1SIulC2Lv7r2i0JX6rKjuKRr",
      price: "$50.00"
    }
  };

  const course = courseType ? courseData[courseType] : null;

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button asChild>
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isEnrolled = enrollments.some(
    e => e.course_type === courseType && e.enrollment_status === 'enrolled'
  );

  const handlePurchase = async () => {
    if (isEnrolled && user) {
      toast.info("You already own this course");
      navigate(`/course/${courseType}`);
      return;
    }

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: course.priceId, courseType }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to create checkout session");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Kairos Security Academy</h1>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <div className="flex items-start justify-between mb-3">
                <Badge className={course.color}>{course.level}</Badge>
                {isEnrolled && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                    ✓ Already Purchased
                  </Badge>
                )}
              </div>
              <CardTitle className="text-3xl md:text-4xl mb-2">{course.title}</CardTitle>
              <CardDescription className="text-lg">{course.subtitle}</CardDescription>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
              {/* Course Overview */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Course Overview</h3>
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              </div>

              {/* Course Details */}
              <div className="flex gap-8 py-6 border-y">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{course.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sections</p>
                    <p className="font-semibold">{course.sections} modules</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="font-semibold">{course.level}</p>
                  </div>
                </div>
              </div>

              {/* What You'll Learn */}
              <div>
                <h3 className="text-xl font-semibold mb-4">What You'll Learn</h3>
                <ul className="grid md:grid-cols-2 gap-4">
                  {course.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing and CTA */}
              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {course.originalPrice && (
                      <span className="text-2xl text-muted-foreground line-through">
                        {course.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-primary">{course.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">One-time payment • Lifetime access</p>
                </div>

                {isEnrolled && user ? (
                  <div className="space-y-3">
                    <Button asChild className="w-full" size="lg">
                      <Link to={`/course/${courseType}`}>
                        Access Course Now
                      </Link>
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      You already have access to this course
                    </p>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={handlePurchase}
                      disabled={processingPayment}
                      className="w-full"
                      size="lg"
                    >
                      {processingPayment ? "Processing..." : "Complete Purchase"}
                    </Button>
                    {user && (
                      <p className="text-center text-xs text-muted-foreground">
                        Logged in as {user.email}
                      </p>
                    )}
                  </>
                )}

                <div className="pt-4 border-t border-border/50 space-y-2 text-sm text-center text-muted-foreground">
                  <p>✓ Secure payment via Stripe</p>
                  <p>✓ Create account after purchase</p>
                  <p>✓ Certificate upon completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CourseCheckout;
