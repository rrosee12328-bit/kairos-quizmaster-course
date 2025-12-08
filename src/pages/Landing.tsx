import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Award, ChevronDown, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import kairosLogo from "@/assets/kairos-logo.png";
import securityOfficerImage from "@/assets/security-officer-hero-16x9.jpg";


const Landing = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <CourseHeader isLoggedIn={!!user} />

      <main>
        {/* Hero with Video Section */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-5xl text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2">
              Training Security Officers for Excellence
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 md:mb-12 max-w-3xl mx-auto px-2">
              At Kairos Security Academy, we combine expertise, innovation, and a passion for excellence to provide 
              security training that not only protects but also empowers.
            </p>
            
            <Card className="overflow-hidden border-2 mb-6 sm:mb-8 -mx-4 sm:mx-0">
              <div className="relative aspect-video bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/4OnhSz9bDzY?modestbranding=1&showinfo=0&rel=0"
                  title="Kairos Security Academy Welcome Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Card>
            
            <Button size="lg" asChild className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8">
              <Link to="/courses">Get Started Today &gt;&gt;</Link>
            </Button>
          </div>
        </section>

        {/* Level 2 Section */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-center px-2">LEVEL 2</h3>
            <div className="space-y-4 sm:space-y-6 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed px-2">
              <p>
                Begin your journey towards security excellence today by becoming a commissioned security officer. 
                This certificate empowers you to work as an unarmed security guard at any venue across the state of Texas.
              </p>
              <p>
                You will learn what the legal duties, rights and responsibilities are of a commissioned security officer 
                in the state of Texas. This includes rules of engagement, the limitations of your powers as a security officer, 
                and what you are expected to do for your clients when you begin work.
              </p>
              <p>
                The Texas Department of Public Safety has extensive requirements for all officers licensed to be on the streets 
                as official security guards. By the end of the course you will be familiar with all of them and be deemed capable 
                of carrying them out.
              </p>
              <p>
                The course is not only theory based but includes all the practical steps necessary to get you licensed and working.
              </p>
            </div>
          </div>
        </section>

        {/* Try Our Courses Section */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-center px-2">START YOUR JOURNEY TODAY</h3>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 md:mb-12 text-center px-2">
              We want our security professionals to flourish. That's why we established Kairos Security Academy - 
              to help you advance your career through comprehensive training that prepares you for real-world challenges. 
              From event security and executive protection to crisis intervention, our training equips you with the skills 
              needed to excel in any security role. Join the Kairos family and elevate your security career.
            </p>
            
            <div className="mb-12 rounded-lg overflow-hidden shadow-lg max-w-4xl mx-auto aspect-video">
              <img 
                src={securityOfficerImage} 
                alt="Professional Security Officer with Kairos logo"
                className="w-full h-full object-cover object-[60%_20%]"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                    <h4 className="text-xl font-semibold">Level 2 Course</h4>
                  </div>
                  <p className="text-muted-foreground">
                    Begin your journey in security excellence. Get certified and join Kairos Security's team of elite professionals.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8 text-primary" />
                    <h4 className="text-xl font-semibold">Level 3 Course (Part 1)</h4>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Elevate your career with Part 1 online training.
                  </p>
                  <p className="text-sm font-semibold text-primary bg-primary/10 p-3 rounded-lg border border-primary/20">
                    ⚠️ Part 2 in-person training required for full armed certification
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <Button size="lg" asChild className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8">
                <Link to="/courses">Get Started Today &gt;&gt;</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center px-2">WHAT OUR STUDENTS SAY</h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4 italic">
                    "I was nervous about starting a career in private security, but Kairos Academy made the transition 
                    smooth and easy. The hands-on training and supportive staff helped me build the confidence I needed 
                    to succeed."
                  </p>
                  <p className="font-semibold">- Blake M. -</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4 italic">
                    "Kairos Academy provided me with all the skills and knowledge I needed to start my career as a 
                    security guard. The instructors were top-notch and made the learning experience enjoyable. 
                    Highly recommend!"
                  </p>
                  <p className="font-semibold">- David S. -</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4 italic">
                    "I was really impressed with the level of training I received at Kairos Academy. From firearm 
                    safety to conflict resolution, the depth of coverage made me feel confident and prepared for my job."
                  </p>
                  <p className="font-semibold">- Kaitlyn M. -</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center px-2">Frequently Asked Questions (FAQs)</h3>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="certification">Certification</TabsTrigger>
                <TabsTrigger value="career">Career</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>What is Kairos Security Academy?</AccordionTrigger>
                    <AccordionContent>
                      Kairos Security Academy is a premier training institution dedicated to preparing security officers for excellence in their field. We combine expertise, innovation, and a passion for excellence to provide security training that not only protects but also empowers.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger>How long does the training take?</AccordionTrigger>
                    <AccordionContent>
                      The Level 2 course typically takes several weeks to complete, depending on your schedule and pace. We offer flexible learning options to accommodate working professionals. Level 3 and Level 4 are two-part courses: Part 1 is completed online, and Part 2 requires in-person training in the Houston area with Kairos Security.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger>What are the prerequisites for enrollment?</AccordionTrigger>
                    <AccordionContent>
                      For our Level 2 course, you must be at least 18 years old and have a clean background check. Additional requirements may apply for Level 3 certification. We'll guide you through all necessary steps during the enrollment process.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              
              <TabsContent value="certification">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="cert-1">
                    <AccordionTrigger>Does the online Level 3 course by itself make me certified?</AccordionTrigger>
                    <AccordionContent>
                      <strong>No.</strong> The online course is theory only. It helps you learn the classroom portion, but it does not give you a Texas Level 3 certificate and does not qualify you for a commissioned officer license by itself.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-2">
                    <AccordionTrigger>Can I use the online course alone to apply with DPS/TOPS?</AccordionTrigger>
                    <AccordionContent>
                      <strong>No.</strong> To apply for your license, DPS/TOPS requires a completed Level 3 certificate from a DPS-approved training school. Kairos only issues that certificate after you complete both the online theory and the in-person firearms/practical training with us.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-3">
                    <AccordionTrigger>What do I get if I only finish the online theory?</AccordionTrigger>
                    <AccordionContent>
                      You'll receive an <strong>Online Theory Completion Report</strong> from Kairos Security Academy for your own records. This is <strong>not a DPS Level 3 certificate</strong> and cannot be submitted to DPS/TOPS for licensing.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-4">
                    <AccordionTrigger>I took an online Level 3 course somewhere else. Can I just do the in-person part with Kairos?</AccordionTrigger>
                    <AccordionContent>
                      <strong>No.</strong> For us to issue a Level 3 certificate in our name, we must provide and verify all required parts of the training. That means your online theory and in-person practical work must both be completed through Kairos Security Academy. We do not issue Level 3 or Level 4 certificates based solely on online training completed with another provider. If you started your training elsewhere, you can either finish with that provider or enroll in the full Kairos Certification Path.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-5">
                    <AccordionTrigger>Can I still benefit from the online-only course if I live far away?</AccordionTrigger>
                    <AccordionContent>
                      Yes. The online theory course is great if you want to learn the material, prepare ahead of time, or decide if a career in security is right for you. But remember, you'll still need to complete in-person training with a DPS-approved school to become fully certified.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-6">
                    <AccordionTrigger>What is included in the Level 3 and Level 4 online course price?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">The online price for Level 3 and Level 4 courses covers <strong>Part 1 (Online Training) only</strong>. This includes all video lessons and the online exam.</p>
                      <p className="mb-2"><strong>Part 2 (In-Person Training) is priced separately</strong> and must be completed in person in the Houston area with Kairos Security. You'll pay for Part 2 at the time of your appointment.</p>
                      <p>After passing the online exam, you'll receive a link to schedule your in-person training via Calendly.</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-7">
                    <AccordionTrigger>Where can I complete Part 2 in-person training for Level 3 and Level 4?</AccordionTrigger>
                    <AccordionContent>
                      Part 2 in-person training for Level 3 (Armed Security Officer) and Level 4 (Personal Protection Officer) is conducted in the <strong>Houston, Texas area</strong> by Kairos Security. After passing your online exam, you'll receive a Calendly link to schedule your appointment.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-8">
                    <AccordionTrigger>Will further certification help me earn more as a security officer?</AccordionTrigger>
                    <AccordionContent>
                      Yes. Certain roles require more advanced certification, especially duties where carrying a firearm or protecting an important person is required. Since these roles need specialist training, they receive higher pay.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-9">
                    <AccordionTrigger>What Does Level 2 Certification Mean for Your Security Career?</AccordionTrigger>
                    <AccordionContent>
                      It means you can be employed as a roving patrol or dedicated security guard anywhere in the state. Without the certificate you are legally barred from performing the functions of a security guard officer. If you carry out shift work without the proper certification, both you and your employer could face legal censure.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-10">
                    <AccordionTrigger>Does Where You Get Your Certification Matter?</AccordionTrigger>
                    <AccordionContent>
                      Yes. Not every security company has the same commitment to rigor as Kairos Security. Some companies are only interested in getting you through the program as quickly as possible to get you certified and on the streets, regardless of whether or not you understand the material. We will make sure you acquire all the skills you need to be an effective security guard.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-11">
                    <AccordionTrigger>Will I be able to keep the certification even if I don't stay to work with Kairos Security?</AccordionTrigger>
                    <AccordionContent>
                      Yes. The certifications offered in our courses are issued by the Texas Department of Public Safety and are valid for any security role in the State of Texas at any company.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="cert-12">
                    <AccordionTrigger>How many times can I take the final exam?</AccordionTrigger>
                    <AccordionContent>
                      You have <strong>3 attempts</strong> to pass the final exam for each course. If you fail the exam 3 times, you will need to re-purchase the course to continue. We recommend thoroughly reviewing the course materials before each attempt to maximize your chances of passing. A score of 70% or higher is required to pass.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              
              <TabsContent value="career">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Will Kairos Security hire me after I qualify?</AccordionTrigger>
                    <AccordionContent>
                      Kairos Security is expanding rapidly and we have positions available for every level of certification we offer. Contact us to ask about opportunities in your area.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Will the skills I learn training as a security guard help me find other work in different fields?</AccordionTrigger>
                    <AccordionContent>
                      Any professional training or qualification you take will teach you many transferable skills. Furthermore it demonstrates to a future employer that you are hard working and committed to completing what you set out to do, traits which are always in demand in any field.
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger>What kind of career advancement opportunities are available?</AccordionTrigger>
                    <AccordionContent>
                      With Kairos Security Academy training, you can advance from entry-level security positions to specialized roles including executive protection, event security, crisis intervention specialist, and security management positions. Our comprehensive training prepares you for career growth in the security industry.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6 bg-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">Elevate Your Security Career Today</h3>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
              Join Kairos Security Academy and discover how we can help secure your future with training 
              that empowers you to protect and serve with excellence.
            </p>
            <Button size="lg" asChild className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8">
              <Link to="/courses">Explore Our Training Programs &gt;&gt;</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;