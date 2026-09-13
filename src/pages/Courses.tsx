import level2Image from "@/assets/level2-security-vehicle.jpg";
import level3Image from "@/assets/level3-security-professional.jpg";
import level4Image from "@/assets/level4-bodyguard.jpg";
import pepperImage from "@/assets/pepper-spray-hero.jpg";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import { trackAddToCart, trackPurchase, getCoursePriceMap } from "@/lib/tracking";
import { ACTIVE_ENROLLMENT_STATUSES, checkUserIsAdmin, fetchMyCourseEntitlements, getCourseAliases } from "@/lib/courseAccess";

interface Enrollment {
  course_type: string;
  enrollment_status?: string;
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
          checkUserIsAdmin(currentUser.id),
          fetchEnrollments(currentUser.id, false, alive),
        ]);
        
        if (!alive) return;
        if (adminResult) {
          setIsAdmin(true);
        }
      }
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserIsAdmin(session.user.id).then((isAdminUser) => {
          if (!alive) return;
          setIsAdmin(isAdminUser);
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

      const data = await fetchMyCourseEntitlements(userId);

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

    const courseAliases = getCourseAliases(courseType);
    if (enrollments.some(e => courseAliases.includes(e.course_type) && (!e.enrollment_status || ACTIVE_ENROLLMENT_STATUSES.includes(e.enrollment_status)))) {
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
    const courseAliases = getCourseAliases(courseId);
    return enrollments.some(e => courseAliases.includes(e.course_type));
  };

  const verifyAdminStatus = async () => {
    if (isAdmin) return true;
    if (!user) return false;

    const isAdminUser = await checkUserIsAdmin(user.id);
    if (isAdminUser) {
      setIsAdmin(true);
      return true;
    }

    return false;
  };

  const handleCourseAccess = async (course: { id: string; route: string }, enrolled: boolean) => {
    if (enrolled) {
      navigate(course.route);
      return;
    }

    const adminVerified = await verifyAdminStatus();
    if (adminVerified) {
      navigate(course.route);
      return;
    }

    navigate(`/checkout/${course.id}`);
  };

  const images: Record<string, string> = { level2: level2Image, level3: level3Image, level4: level4Image, "pepper-spray": pepperImage };
  const titles: Record<string, string> = { level2: "Unarmed security officer", level3: "Armed security officer", level4: "Personal protection officer", "pepper-spray": "Pepper spray training" };
  return (
    <div className="academy-page academy-catalog min-h-screen flex flex-col">
      <CourseHeader isAdmin={isAdmin} isLoggedIn={!!user} />
      <main className="academy-catalog-main">
        <header className="academy-catalog-heading"><p className="academy-kicker">TRAINING THAT MOVES YOU FORWARD</p><h1>Build your skills.<br /><span>Choose your path.</span></h1><p>From your first course to your next professional challenge. Find the training that fits your direction.</p>
          {user && <Button variant="outline" onClick={() => fetchEnrollments(user.id, true)} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh My Courses'}</Button>}
        </header>
        <nav className="academy-course-index" aria-label="Course index">{courses.map(course => <a key={course.id} href={`#path-${course.id}`}>{course.id === 'pepper-spray' ? 'Specialty' : course.id.replace('level', 'Level ')} <ArrowRight size={15} /></a>)}</nav>
        <div className="academy-catalog-list">{courses.map(course => {
          const enrolled = isEnrolled(course.id);
          return <article id={`path-${course.id}`} key={course.id} className="academy-catalog-course">
            <div className="academy-catalog-image"><img src={images[course.id]} alt={titles[course.id]} width="1200" height="800" loading="lazy" /></div>
            <div className="academy-catalog-copy"><div className="academy-course-label"><span>{course.id === 'pepper-spray' ? 'SPECIALTY TRAINING' : course.id.replace('level', 'LEVEL ')}</span>{enrolled && <span className="academy-owned">Purchased</span>}</div><h2>{titles[course.id]}</h2><p>{course.description}</p><div className="academy-hero-facts"><span><Clock size={16} />{course.duration}</span><span><BookOpen size={16} />{course.sections} modules</span></div>{(course.id === 'level3' || course.id === 'level4') && <p className="academy-part-note">Part 1 online theory only. Required in-person training with Kairos in Houston is priced separately.</p>}<div className="academy-course-action"><span>{course.price}<small>{course.id === 'level3' || course.id === 'level4' ? 'Online theory' : 'Course price'}</small></span><Button onClick={() => void handleCourseAccess(course, enrolled)}>{enrolled || isAdmin ? 'Continue training' : 'View course'}<ArrowRight size={17} /></Button></div></div>
          </article>;
        })}</div>
        <section className="academy-catalog-help"><div><h2>Not sure where to start?</h2><p>Explore the training-path guide or ask the academy about your next step.</p></div><Link to="/#training">Find your path <ArrowRight size={17} /></Link></section>
      </main><Footer />
    </div>
  );
};
export default Courses;
