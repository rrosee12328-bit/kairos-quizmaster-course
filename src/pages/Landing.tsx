import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Award, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import kairosLogo from "@/assets/kairos-logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Kairos Security Academy</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/courses">Courses</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/admin">Admin</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-6 text-center bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              EXCELLENCE, PROFESSIONALISM, INTEGRITY
            </h2>
            <div className="flex justify-center mb-8">
              <ChevronDown className="h-8 w-8 text-primary animate-bounce" />
            </div>
          </div>
        </section>

        {/* Main Pitch Section */}
        <section className="py-16 px-6 bg-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-4xl font-bold mb-6">
              LEARN TEXAS LEVEL 2 & LEVEL 3 SECURITY CERTIFICATION
            </h3>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Kairos Security Academy trains security officers for front line duty. We prioritize excellence 
              above and beyond state and federal certification requirements.
            </p>
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/courses">GET CERTIFIED WITH KAIROS SECURITY ACADEMY TODAY &gt;&gt;</Link>
            </Button>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <Card className="overflow-hidden border-2">
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
          </div>
        </section>

        {/* Level 2 Section */}
        <section className="py-16 px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center mb-8">
              <ChevronDown className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-4xl font-bold mb-8 text-center">LEVEL 2</h3>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
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
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center mb-8">
              <ChevronDown className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-4xl font-bold mb-8 text-center">TRY OUR COURSES NOW</h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-12 text-center">
              We want our security guards to flourish professionally. That's why we established Kairos Security Academy 
              to help you advance your career through ongoing training. With Kairos Security Academy you get the training 
              you need to succeed in security roles at malls, office buildings, in personal protection and much more. 
              At every step of the way we will steer you through the process.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                    <h4 className="text-xl font-semibold">Level 2 Course</h4>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Get certified as a professional security guard. Begin your career in security.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/course/level2">Learn More &gt;&gt;</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="h-8 w-8 text-primary" />
                    <h4 className="text-xl font-semibold">Level 3 Course</h4>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    The next step in your security journey, get your armed certification.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/course/level3/checkout">Learn More &gt;&gt;</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-6 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="flex justify-center mb-8">
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-4xl font-bold mb-12 text-center">WHAT OUR STUDENTS SAY</h3>
            
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

        {/* CTA Section */}
        <section className="py-20 px-6 bg-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h3 className="text-4xl font-bold mb-6">Ready to Start Your Security Career?</h3>
            <p className="text-xl text-muted-foreground mb-8">
              Join Kairos Security Academy today and take the first step towards professional excellence.
            </p>
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/courses">Browse Our Courses &gt;&gt;</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
                <h4 className="font-bold">Kairos Security Academy</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Excellence in security training and certification.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><Link to="/courses" className="hover:text-primary transition-colors">Courses</Link></div>
                <div><Link to="/auth" className="hover:text-primary transition-colors">Sign In</Link></div>
                <div><Link to="/admin" className="hover:text-primary transition-colors">Admin</Link></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <p className="text-sm text-muted-foreground">
                Questions? We're here to help.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;