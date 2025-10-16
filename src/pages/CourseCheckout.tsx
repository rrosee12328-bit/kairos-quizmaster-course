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
import level3SecurityImage from "@/assets/level3-security-professional.jpg";
import level2SecurityImage from "@/assets/level2-security-vehicle.jpg";
import level4BodyguardImage from "@/assets/level4-bodyguard.jpg";

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
      originalPrice: "$50.00",
      isLevel2: true
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
      price: "$125.00",
      isLevel3: true
    },
    level4: {
      title: "Level 4: Personal Protection Officer",
      subtitle: "Bodyguard & Executive Protection - Online + In-Person Training",
      description: "15 hour advanced certification for Personal Protection Officers combining online coursework with mandatory in-person training. Learn comprehensive protection planning, threat avoidance, defensive tactics, and coordination with authorities.",
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
      price: "$200.00",
      isLevel4: true
    },
    "pepper-spray": {
      title: "Pepper Spray Training Course",
      subtitle: "For Security Officers in Texas",
      description: "The Pepper Spray Training Course trains the student in the theory and practice of the effective use of pepper spray for a security officer in the State of Texas. Today's security professional faces a large variety of threats and challenges in the security profession. To face these threats effectively, he or she must be both well trained and well equipped. Pepper spray is an important and useful tool for the security officer. This additional tool enables greater flexibility in security detail to maintain order, along with a secure and safe environment.",
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
      priceId: "price_1SIulC2Lv7r2i0JX6rKjuKRr",
      price: "$50.00",
      isPepperSpray: true,
      requirements: [
        "This course is for security guards only",
        "Must be 18 years of age or older to take the course",
        "Students are NOT required to be sprayed",
        "Training pepper spray on dummy targets will be used"
      ],
      gearRequired: [
        "Note taking gear",
        "Clear glasses",
        "Water"
      ],
      gearRecommended: [
        "Drinks and snacks",
        "Laptop or tablet",
        "Check the weather on the day of the course and dress appropriately"
      ]
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
              {/* Level 2 Hero Image */}
              {course.isLevel2 && (
                <div className="rounded-lg overflow-hidden -mt-8 -mx-8 mb-6">
                  <img 
                    src={level2SecurityImage} 
                    alt="Professional Security Officer" 
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Level 3 Hero Image */}
              {course.isLevel3 && (
                <div className="rounded-lg overflow-hidden -mt-8 -mx-8 mb-6">
                  <img 
                    src={level3SecurityImage} 
                    alt="Professional Security Officer" 
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Level 4 Hero Image */}
              {course.isLevel4 && (
                <div className="rounded-lg overflow-hidden -mt-8 -mx-8 mb-6">
                  <img 
                    src={level4BodyguardImage} 
                    alt="Professional bodyguard on duty with visible earpiece" 
                    loading="lazy"
                    className="w-full h-64 object-cover object-left"
                  />
                </div>
              )}

              {/* Level 2 Important Information */}
              {course.isLevel2 && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-4">Texas Level 2 Security Certification</h3>
                    <p className="text-base font-semibold mb-4">
                      This online course will provide you the basic certification (to be submitted and approved by the State) to be able to work legally as an unarmed security officer in the State of Texas.
                    </p>
                    <div className="space-y-2">
                      <p className="font-semibold">What you'll get:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li><strong>PSP-36 Certificate to submit to TOPS</strong></li>
                      </ul>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none dark:prose-invert space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        On September 1, 2017, House Bill 1508 (85th Leg., Reg. Sess.) became effective. This bill placed requirements on entities offering 
                        educational training programs that prepare an individual for an initial occupational license.
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        This includes level III and level IV training schools, as well as guard companies that offer in-house level II training.
                      </p>
                    </div>

                    <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-6">
                      <h4 className="font-bold text-base mb-3">THESE TRAINING PROVIDERS MUST NOTIFY EACH ENROLLEE OF THE FOLLOWING:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• The potential ineligibility of an individual who has been convicted of a criminal offense;</li>
                        <li>• The department's current eligibility guidelines (the board's administrative rules) issued under Occupations Code, Section 53.025;</li>
                        <li>• Any other state or local restriction or guideline used by the department to determine the eligibility of an individual who has been convicted of an offense; and</li>
                        <li>• The right to request a criminal history evaluation under Occupations Code Section 53.102.</li>
                      </ul>
                      
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded">
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">
                          PURSUANT TO HB 1508, IF AN INDIVIDUAL IS DENIED AN OCCUPATIONAL LICENSE BASED ON THEIR CRIMINAL HISTORY AND THE 
                          TRAINING PROVIDER FAILED TO PROVIDE THE INDIVIDUAL THE ABOVE INFORMATION, THE TRAINING PROVIDER WILL BE REQUIRED TO 
                          REFUND THE AMOUNT OF ANY TUITION PAID AND CORRESPONDING APPLICATION AND EXAMINATION FEES.
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                        For purposes of compliance with these requirements it is recommended training schools and other licensees that offer 
                        in house level II training communicate the following text directly to the prospective applicant, whether by email or 
                        other correspondence, or on the application for admission to a course.
                      </p>
                      
                      <p className="text-sm italic text-muted-foreground mt-3 leading-relaxed">
                        "Please be advised under the Private Security Act (Occ. Code Chapter 1702) and Administrative Rule 35.4 (37 Tex. Admin. Code 1), 
                        a criminal conviction may disqualify you from a registration, commission or license under the Act. You may wish to review Rule 35.4's 
                        list of disqualifying offenses and the related periods of ineligibility, available on the department's website at{" "}
                        <a href="http://www.dps.texas.gov/rsd/psb/index.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          http://www.dps.texas.gov/rsd/psb/index.htm
                        </a>{" "}
                        (click on the link to Administrative Code). You also have a right to request from the department a criminal history evaluation 
                        letter under Occupations Code Section 53.102."
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Level 3 Important Information */}
              {course.isLevel3 && (
                <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-6 space-y-4">
                  <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-500">⚠️ IMPORTANT LINKS YOU MUST READ:</h3>
                  <div className="space-y-2">
                    <a 
                      href="https://www.dps.texas.gov/rsd/psb/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline font-semibold"
                    >
                      → TEXAS PRIVATE SECURITY BOARD
                    </a>
                    <a 
                      href="https://tops.portal.texas.gov/psp-self-service/login/auth" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline font-semibold"
                    >
                      → TEXAS ON-LINE PRIVATE SECURITY (TOPS)
                    </a>
                    <a 
                      href="https://www.dps.texas.gov/rsd/psb/News/PSBWebFingerprintingInstr.htm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline font-semibold"
                    >
                      → FINGERPRINTING INSTRUCTIONS
                    </a>
                    <a 
                      href="https://www.dps.texas.gov/rsd/contact/psb.aspx" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline font-semibold"
                    >
                      → SUBMIT DOCUMENTS
                    </a>
                    <a 
                      href="https://www.dps.texas.gov/rsd/psb/military.htm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline font-semibold"
                    >
                      → MILITARY DISCOUNT INFORMATION
                    </a>
                    <a 
                      href="https://www.dps.texas.gov/rsd/psb/News/peace_officer.htm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline font-semibold"
                    >
                      → PEACE OFFICERS
                    </a>
                  </div>
                  <p className="text-sm font-semibold">PSB CUSTOMER SERVICE – 512-424-7293</p>
                </div>
              )}

              {/* Level 4 Important Information */}
              {courseType === 'level4' && (
                <div className="space-y-6">
                  <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400 mb-4">Texas Level 4: Personal Protection Officer</h3>
                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">📍 Training Format: Online + In-Person</p>
                        <p className="text-sm text-muted-foreground">This course combines online learning with mandatory in-person training sessions.</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold mb-2">Prerequisites:</p>
                        <p className="text-sm text-muted-foreground">You must be a <strong>Level III certified officer</strong> to enroll in Level IV training.</p>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="font-semibold text-green-700 dark:text-green-400 mb-2">💰 Career Potential</p>
                        <p className="text-sm text-muted-foreground">Level IV Officers can earn between <strong>$35.00-$85.00 per hour</strong>. Overtime is often available for Officers willing to work extra hours.</p>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Overview:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          PSP does not have a Level I Security Officer. You must be a Level II to be a Level III; you must also be a Level III to be a Level IV. 
                          A Personal Protection Officer (Level IV) is not required to wear a uniform and can carry a Firearm along with a Baton, ECD, and OC if trained.
                        </p>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <p className="font-semibold mb-2">What You'll Learn:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Objectives as determined by the Private Security Program</li>
                          <li>Unarmed Defensive Tactics</li>
                          <li>Baton Training</li>
                          <li>Personal Protection Officer Specifics</li>
                        </ul>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground italic">
                          "Please be advised under the Private Security Act (Occ. Code Chapter 1702) and Administrative Rule 35.4 (37 Tex. Admin. Code 1), 
                          a criminal conviction may disqualify you from a Commission or license under the Act. You may wish to review Rule 35.4's list of 
                          disqualifying offenses and the related periods of ineligibility, available on the department's website at{" "}
                          <a href="http://www.dps.texas.gov/rsd/psb/index.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            www.dps.texas.gov/rsd/psb/index.htm
                          </a>{" "}
                          (click on the link to Administrative Code). You also have a right to request from the department a criminal history evaluation 
                          letter under Occupations Code Section 53.102."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pepper Spray Important Information */}
              {course.isPepperSpray && (
                <div className="space-y-6">
                  <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-orange-700 dark:text-orange-400 mb-4">Pepper Spray Training Course</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      The Pepper Spray Training Course trains the student in the theory and practice of the effective use of pepper spray for a security officer in the State of Texas. Today's security professional faces a large variety of threats and challenges in the security profession. To face these threats effectively, he or she must be both well trained and well equipped. Pepper spray is an important and useful tool for the security officer. This additional tool enables greater flexibility in security detail to maintain order, along with a secure and safe environment.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      This is a 2 hour course that is required by the Texas Department of Public Safety – Private Security Board. Students are not required to be sprayed. We will be using training pepper spray on dummy targets.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold mb-2">Requirements</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {course.requirements?.map((req: string, index: number) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Come prepared to take this course with the following gear:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {course.gearRequired?.map((gear: string, index: number) => (
                            <li key={index}>{gear}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">The following is not required but recommended:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {course.gearRecommended?.map((gear: string, index: number) => (
                            <li key={index}>{gear}</li>
                          ))}
                        </ul>
                        <p className="text-sm font-semibold text-muted-foreground mt-2">
                          Check the weather on the day of the course and dress appropriately.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-orange-500/30">
                        <p className="text-lg font-bold text-center">
                          Cost per student ${course.price.replace('$', '').replace('.00', '')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Overview */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Course Overview</h3>
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              </div>

              {/* Level 2 Detailed Information */}
              {course.isLevel2 && (
                <div className="space-y-6 border-t pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert space-y-6">
                    <div>
                      <h3 className="text-lg font-bold mb-3">ARE YOU LOOKING FOR A NEW CAREER PATH?</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        This course will teach individuals with little or no previous experience the basic principles of the security industry 
                        using the State of Texas required materials.
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <li>✓ This course provides the Level II training and certification as required by the State of Texas.</li>
                        <li>✓ Once complete, you will be provided with the basic certification (to be submitted and approved by the State) 
                        to be able to work legally as an unarmed security officer in the State of Texas.</li>
                      </ul>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm font-bold mb-3">
                        THE LEVEL II TRAINING COURSE AND TEST IS REQUIRED OF <span className="text-primary">ALL</span> NON-COMMISSIONED SECURITY 
                        OFFICERS, COMMISSIONED SECURITY OFFICERS AND PERSONAL PROTECTION OFFICERS.
                      </p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• This training course must be administered by a licensed Level III or Level IV Training School and taught by a 
                        licensed Level III or Level IV Instructor.</li>
                        <li>• Additionally, this training may be administered by a licensed guard company and taught by the qualified manager 
                        or the qualified manager's designee.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-3">CERTAIN PEACE OFFICERS MAY BE EXEMPT PER{" "}
                        <a href="http://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=37&pt=1&ch=35&rl=141" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-primary hover:underline">
                          TAC 35.141(B)
                        </a>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Training includes: Laws and Regulations, Field Notes and Report Writing, Crime Scene, Cover and Concealment, Use of Force, 
                        Conflict Resolution, and Ethics.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">PREREQUISITE</h3>
                      <p className="text-sm text-muted-foreground">There are no prerequisites for this course.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-3">REQUIREMENTS</h3>
                      <p className="text-sm font-semibold mb-2">This course can be taken at your leisure.</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• There is no time limit.</li>
                        <li>• Some students are already familiar with the laws and concepts and some students are not.</li>
                        <li>• This Learning Management System is not timed.</li>
                        <li>• However, there is enough training material found in the following lessons to adequately cover 8-10 hours of in-class training.</li>
                      </ul>
                      
                      <p className="text-sm font-semibold mt-4">
                        The student must pass each lesson exam with a <strong>75%</strong> or better to move to the next lesson.
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li>• <strong>The exams can be reset and the lesson continue to loop until the student makes a passing grade.</strong></li>
                        <li>• <strong>Learning is accomplished as the student successfully completes each lesson and exam.</strong></li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">EQUIPMENT NEEDED</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        To complete this course you are required to have a computer with internet access.
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Broadband Internet connection</li>
                        <li>• Recommended: Google Chrome</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-2">AUDIENCE</h3>
                      <p className="text-sm text-muted-foreground">Non-commissioned security officers in the State of Texas</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Level 3 Detailed Information */}
              {course.isLevel3 && (
                <div className="space-y-6 border-t pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <h3 className="text-lg font-bold mb-3">Eligibility Notice</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Please be advised under the Private Security Act (Occ. Code Chapter 1702) and Administrative Rule 35.4 (37 Tex. Admin. Code 1), 
                      a criminal conviction may disqualify you from a registration, commission or license under the Act. You may wish to review Rule 35.4's 
                      list of disqualifying offenses and the related periods of ineligibility, available on the{" "}
                      <a href="http://www.dps.texas.gov/rsd/psb/index.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        department's website
                      </a>
                      . You also have a right to request from the department a criminal history evaluation letter under Occupations Code Section 53.102.
                    </p>

                    <h3 className="text-lg font-bold mt-6 mb-3">Course Information</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>✓ The Level III Training Course is required for all commissioned security officers and personal protection officers</li>
                      <li>✓ This training course must be taken through a licensed Level III Training School and taught by a licensed Level III Instructor</li>
                      <li>✓ This online course contains 35 hours of training material if presented in a lecture/demonstration presentation</li>
                      <li>✓ Students are responsible for reading the online material, reviewing hyperlinks, and watching attached videos</li>
                      <li>✓ Students must pass lesson quizzes with a 70-75% score</li>
                      <li>✓ Students must pass the course final exam with a 75% or better</li>
                    </ul>

                    <h3 className="text-lg font-bold mt-6 mb-3">LEVEL III (PART 2) - In-Person Training Required</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      After completion of the online training, students are required to complete <strong>Level III (Part 2)</strong>, which consists of 
                      10-15 hours of firearms training/qualification and skills demonstrations.
                    </p>
                    <p className="text-sm font-semibold mb-2">Skills demonstrations include:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Handcuffing</li>
                      <li>OC (Pepper Spray)</li>
                      <li>Expandable Baton</li>
                      <li>Defensive Tactics</li>
                      <li>Firearms</li>
                    </ol>
                    <p className="text-sm text-muted-foreground mt-4">
                      After successful completion of the Theory-based portion, students receive a certificate of completion that can be printed and used as proof 
                      of training. This certificate can be presented to another PSB training provider to complete the Skills portion of training.
                    </p>
                    <p className="text-sm font-semibold text-primary mt-4">
                      Students will receive a Level III certificate of training (PSB-30) after successful completion of both Theory (Part 1) and Skills (Part 2) training.
                    </p>
                  </div>
                </div>
              )}

              {/* Pepper Spray Detailed Information */}
              {course.isPepperSpray && (
                <div className="space-y-6 border-t pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <h3 className="text-lg font-bold mb-4">Pepper Spray Training Course period of instruction, you will learn about:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• History of chemical weapons</li>
                      <li>• Introduction to modern chemical weapons</li>
                      <li>• OC Pepper spray</li>
                      <li>• Understanding OC Spray</li>
                      <li>• First Aid and decontamination</li>
                      <li>• Side effects</li>
                      <li>• Criminal and civil liability</li>
                      <li>• Drills</li>
                    </ul>
                  </div>
                </div>
              )}

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
