import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Play, BookOpen, User, Star, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import kairosLogo from "@/assets/kairos-logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Kairos Security Academy</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={kairosLogo} alt="Kairos Security Academy" className="h-12 w-12" />
            <h1 className="text-5xl font-bold">Professional Security Training</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Master the skills needed to excel in the security industry with our comprehensive certification programs. 
            Join thousands of professionals who have advanced their careers with Kairos Security Academy.
          </p>
        </div>

        {/* Welcome Video */}
        <div className="mb-16">
          <Card className="overflow-hidden max-w-4xl mx-auto">
            <div className="relative aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/4OnhSz9bDzY"
                title="Kairos Security Academy Welcome Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        </div>

        {/* Course Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Browse Courses */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                Browse All Courses
              </CardTitle>
              <CardDescription>
                Explore our comprehensive library of security training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Level 2 Security Officer (Unarmed)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Level 3 Security Officer (Armed)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Advanced Security Management</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Emergency Response Training</span>
                </div>
              </div>
              <Button className="w-full" asChild>
                <Link to="/courses">View All Courses</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Continue Learning */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                Continue Your Learning
              </CardTitle>
              <CardDescription>
                Sign in to access your enrolled courses and track progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary" />
                  <span>Track your progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Earn certificates</span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Access exclusive content</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth">Sign In to Continue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Industry Certified</h3>
            <p className="text-muted-foreground">
              Our programs meet industry standards and are recognized by employers
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Instructors</h3>
            <p className="text-muted-foreground">
              Learn from experienced security professionals with real-world expertise
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Flexible Learning</h3>
            <p className="text-muted-foreground">
              Study at your own pace with 24/7 access to course materials
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;