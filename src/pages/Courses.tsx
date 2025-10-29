import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Award, Users, BookOpen, ArrowRight, LogOut, ShoppingCart, CheckCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  // Check for payment success and refresh enrollments
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const course = searchParams.get('course');
    
    if (paymentStatus === 'success' && course) {
      toast.success(`Payment successful! You now have access to ${course}`);
      
      // Refresh enrollments after a short delay to allow webhook to process
      setTimeout(() => {
        if (user) {
          fetchEnrollments(user.id);
        }
      }, 2000);
    }
  }, [searchParams, user]);

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

  const fetchEnrollments = async (userId: string, showToast = false) => {
    if (showToast) setRefreshing(true);
    
    try {
      // Get user email first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        if (showToast) toast.error('No email found on your account');
        return;
      }

      console.log('Fetching enrollments for:', user.email);

      // Fetch enrollments by user_id OR email
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .or(`user_id.eq.${userId},email.eq.${user.email}`);
      
      if (error) {
        console.error('Error fetching enrollments:', error);
        if (showToast) toast.error('Failed to fetch enrollments');
        return;
      }

      console.log('Found enrollments:', data?.length || 0);

      if (data) {
        // Check if there are enrollments to sync
        const enrollmentsToUpdate = data.filter(e => !e.user_id && e.email === user.email);
        
        if (enrollmentsToUpdate.length > 0) {
          console.log('Syncing enrollments with user account:', enrollmentsToUpdate.length);
          if (showToast) toast.info(`Syncing ${enrollmentsToUpdate.length} course(s) with your account...`);
          
          // Call server-side sync function for secure enrollment sync
          const { data: { session } } = await supabase.auth.getSession();
          const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-enrollment', {
            headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined
          });
          
          if (syncError) {
            console.error('Error syncing enrollments:', syncError);
            if (showToast) toast.error('Failed to sync enrollments');
          } else {
            console.log('Sync result:', syncResult);
            
            // Refresh enrollments after sync
            const { data: updatedData } = await supabase
              .from('enrollments')
              .select('*')
              .or(`user_id.eq.${userId},email.eq.${user.email}`);
            
            if (updatedData) {
              setEnrollments(updatedData);
              if (showToast) toast.success(`Successfully synced ${syncResult?.synced || enrollmentsToUpdate.length} course(s)!`);
            }
          }
        } else {
          setEnrollments(data);
          if (showToast) toast.success('Courses refreshed successfully');
        }
      } else {
        if (showToast) toast.info('No enrollments found');
      }
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

    // Check if already enrolled
    if (enrollments.some(e => e.course_type === courseType && e.enrollment_status === 'enrolled')) {
      toast.info("You already own this course");
      return;
    }

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
      priceId: "price_1SIuwK2Lv7r2i0JX3XIe7Oi0",
      price: "$1.00"
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
      price: "$1.00"
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
      priceId: "price_1SNDgM2Lv7r2i0JXN0Uw4yMH",
      price: "$1.00"
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
      priceId: "price_1SNDip2Lv7r2i0JXkz532nZz",
      price: "$1.00"
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