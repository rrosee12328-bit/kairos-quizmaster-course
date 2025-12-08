import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import { trackAddToCart, trackPurchase, getCoursePriceMap } from "@/lib/tracking";

interface Enrollment {
  id: string;
  user_id: string | null;
  email: string;
  course_type: string;
  enrollment_status: string;
}

const Courses = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let alive = true;
    
    const initUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!alive) return;
      
      setUser(currentUser);
      if (currentUser) {
        const [adminResult] = await Promise.all([
          supabase.rpc('is_admin', { _user_id: currentUser.id }),
          fetchEnrollments(currentUser.id, false, alive),
        ]);
        
        if (!alive) return;
        if (!adminResult.error && adminResult.data) {
          setIsAdmin(true);
        }
      }
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.rpc('is_admin', { _user_id: session.user.id }).then(({ data, error }) => {
          if (!alive) return;
          if (!error && data) setIsAdmin(true);
        });
        fetchEnrollments(session.user.id, false, alive);
      } else {
        setIsAdmin(false);
        setEnrollments([]);
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  // Check for payment success and track purchase
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const course = searchParams.get('course');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && course) {
      // Track client-side purchase conversion
      const priceMap = getCoursePriceMap();
      const coursePrice = priceMap[course as keyof typeof priceMap] || 0;
      trackPurchase(course, coursePrice, sessionId || undefined, user?.email || undefined);
      
      toast.success(`Payment successful! You now have access to ${course}`);
      
      // Refresh enrollments after a short delay to allow webhook to process
      setTimeout(() => {
        if (user) {
          fetchEnrollments(user.id);
        }
      }, 2000);
    }
  }, [searchParams, user]);

  const fetchEnrollments = async (userId: string, showToast = false, alive = true) => {
    if (showToast) setRefreshing(true);
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email) {
        if (showToast) toast.error('No email found on your account');
        return;
      }

      // First, attach any legacy enrollments with matching email but no user_id
      await supabase
        .from('enrollments')
        .update({ user_id: userId })
        .eq('email', currentUser.email)
        .is('user_id', null);

      // Now fetch only by user_id (legacy rows are now attached)
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, user_id, email, course_type, enrollment_status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching enrollments:', error);
        if (showToast) toast.error('Failed to fetch enrollments');
        return;
      }

      if (!alive) return;

      setEnrollments(data || []);
      if (showToast) toast.success('Courses refreshed successfully');
    } catch (error) {
      console.error('Error in fetchEnrollments:', error);
      if (showToast) toast.error('An error occurred while fetching enrollments');
    } finally {
      if (showToast) setRefreshing(false);
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

    if (enrollments.some(e => e.course_type === courseType && e.enrollment_status === 'enrolled')) {
      toast.info("You already own this course");
      return;
    }

    const priceMap = getCoursePriceMap();
    const price = priceMap[courseType as keyof typeof priceMap];
    trackAddToCart(courseType, price);

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId,
          courseType 
        }
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
      priceId: "price_1Sb2S62Lv7r2i0JXFsLnHBYT",
      price: "$55.00"
    },
    {
      id: "level3", 
      title: "Level 3 Security Officer Certification (Online Only – Not a Certificate)",
      subtitle: "Armed Security Professional - Online Training",
      description: "This self-paced online course covers the classroom/theory portion of the Texas Level 3 curriculum. ⚠️ Does NOT provide a certificate – in-person training required with Kairos Security in Houston to become certified.",
      duration: "30 hours",
      sections: 10,
      level: "Advanced",
      color: "bg-red-500",
      features: [
        "Texas Level 3 laws & regulations",
        "Use of force training",
        "Safety fundamentals",
        "Armed response protocols",
        "Advanced threat assessment",
        "Online Theory Completion Report (not a DPS certificate)"
      ],
      route: "/course/level3",
      priceId: "price_1Sc8e92Lv7r2i0JXn5yNMSZs",
      price: "$99.00"
    },
    {
      id: "level4",
      title: "Level 4: Personal Protection Officer (Online Only – Not a Certificate)",
      subtitle: "Bodyguard & Executive Protection - Online Training",
      description: "This self-paced online course covers the classroom/theory portion of the Texas Level 4 PPO curriculum. ⚠️ Does NOT provide a certificate – in-person training required with Kairos Security in Houston to become certified.",
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
        "Online Theory Completion Report (not a DPS certificate)"
      ],
      route: "/course/level4",
      priceId: "price_1SIuhk2Lv7r2i0JXmknziXJn",
      price: "$200.00"
    },
    {
      id: "pepper-spray",
      title: "Pepper Spray Training Course",
      subtitle: "For Security Officers in Texas",
      description: "The Pepper Spray Training Course trains the student in the theory and practice of the effective use of pepper spray for a security officer in the State of Texas. This 2 hour course is required by the Texas Department of Public Safety – Private Security Board.",
      duration: "2 hours",
      sections: 1,
      level: "Required",
      color: "bg-orange-500",
      features: [
        "History of chemical weapons",
        "Introduction to modern chemical weapons",
        "OC Pepper spray",
        "Understanding OC Spray",
        "First Aid and decontamination",
        "Side effects",
        "Criminal and civil liability",
        "Drills"
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
      <CourseHeader isAdmin={isAdmin} isLoggedIn={!!user} />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Security Training Courses</h2>
            <p className="text-xl text-muted-foreground">
              Professional certification programs for security officers
            </p>
            {user && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchEnrollments(user.id, true)}
                disabled={refreshing}
                className="mt-4"
              >
                {refreshing ? 'Refreshing...' : 'Refresh My Courses'}
              </Button>
            )}
          </div>

          {/* Course Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {courses.map((course) => {
              const enrolled = isEnrolled(course.id);
              
              return (
                <Card 
                  key={course.id} 
                  className="overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  onClick={() => enrolled ? navigate(course.route) : navigate(`/checkout/${course.id}`)}
                >
                  <CardContent className="p-4 text-center space-y-3">
                    <div className={`w-16 h-16 mx-auto rounded-full ${course.color} flex items-center justify-center`}>
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{course.title}</h3>
                      <p className="text-xs text-muted-foreground">{course.duration}</p>
                    </div>
                    {enrolled ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                        ✓ Owned
                      </Badge>
                    ) : (
                      <p className="text-sm font-bold text-primary">{course.price}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detailed Course Information */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-6">Course Details</h3>
            {courses.map((course) => {
              const enrolled = isEnrolled(course.id);
              
              return (
                <Card key={course.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={course.color}>{course.level}</Badge>
                      {enrolled && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                          ✓ Purchased
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <CardDescription>{course.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{course.sections} sections</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xl font-bold">{course.price}</p>
                      {enrolled ? (
                        <Button asChild size="sm">
                          <Link to={course.route}>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm">
                          <Link to={`/checkout/${course.id}`}>
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
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
