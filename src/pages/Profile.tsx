import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import { syncEnrollmentsForCurrentSession } from "@/lib/enrollmentSync";
import { Shield, Award, BookOpen, Download, Settings, CheckCircle, Clock, XCircle, ArrowRight, Copy, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import kairosLogo from "@/assets/kairos-logo.png";

interface Enrollment {
  id: string;
  course_type: string;
  enrollment_status: string;
  created_at: string;
  first_name: string;
  last_name: string;
}

interface Completion {
  id: string;
  course_type: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  attempt_number?: number;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  ip_address?: string;
  user_agent?: string;
}

interface Certificate {
  id: string;
  course_type: string;
  registration_number: string;
  completion_date: string;
  student_name: string;
  completion_id: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewingAsAdmin, setViewingAsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!alive) return;
      
      if (!user) {
        toast.error("Please sign in to view your profile");
        navigate("/auth");
        return;
      }

      setUser(user);

      // Check if user is admin
      const { data: adminCheck } = await supabase.rpc('is_admin', { _user_id: user.id });
      if (!alive) return;
      setIsAdmin(adminCheck || false);

      // Check for userId query parameter (admin viewing student profile)
      const params = new URLSearchParams(window.location.search);
      const targetUserId = params.get('userId');
      
      if (targetUserId && adminCheck) {
        // Admin is viewing another user's profile
        setViewingAsAdmin(true);
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', targetUserId)
          .maybeSingle();
        
        if (!alive) return;
        await fetchUserData(targetUserId, targetProfile?.email || '', alive);
      } else {
        // Viewing own profile
        await syncEnrollmentsForCurrentSession();
        await fetchUserData(user.id, user.email || '', alive);
      }
    };
    
    checkUser();
    
    return () => { alive = false; };
  }, [navigate]);

  const fetchUserData = async (userId: string, userEmail: string, alive = true) => {
    try {
      // Fetch profile, enrollments, completions, certificates, and the latest
      // active Level 3 approval in parallel.
      const [profileResult, enrollmentResult, completionResult, certificateResult, approvalResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('enrollments')
          .select('id, course_type, enrollment_status, created_at, first_name, last_name')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('course_completions')
          .select('id, course_type, score, total_questions, percentage, passed, completed_at, attempt_number, started_at, ended_at, duration_seconds')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false }),
        supabase.from('certificates')
          .select('id, course_type, registration_number, completion_date, student_name, completion_id')
          .eq('user_id', userId)
          .order('issued_at', { ascending: false }),
        supabase.from('level3_approvals')
          .select('approval_code, expires_at, used')
          .eq('user_id', userId)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!alive) return;
      
      const profileData = profileResult.data
        ? { ...profileResult.data, level3_approval_code: approvalResult.data?.approval_code ?? null }
        : null;
      setProfile(profileData);
      setEnrollments(enrollmentResult.data || []);
      setCompletions(completionResult.data || []);
      setCertificates(certificateResult.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
      setLoading(false);
    }
  };

  const getCourseTitle = (courseType: string) => {
    if (courseType === 'level2') return 'Level 2 Security Officer Certification';
    if (courseType === 'level3') return 'Level 3 Security Officer Certification (Part 1)';
    return courseType;
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      'pending': { variant: 'secondary', icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
      'approved': { variant: 'default', icon: CheckCircle, label: 'Enrolled', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
      'enrolled': { variant: 'default', icon: CheckCircle, label: 'Enrolled', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
      'completed': { variant: 'default', icon: Award, label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' },
      'rejected': { variant: 'destructive', icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' }
    };
    
    const config = variants[status] || variants['pending'];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`gap-1.5 px-3 py-1 font-medium border ${config.className}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
    );
  };

  const downloadCertificate = async (cert: Certificate) => {
    try {
      // Navigate directly to the certificate preview with the certificate data
      const url = `/certificate-preview?name=${encodeURIComponent(cert.student_name)}&registration=${encodeURIComponent(cert.registration_number)}&date=${encodeURIComponent(cert.completion_date)}`;
      window.location.href = url;
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error("Failed to download certificate");
    }
  };

  const handleResend = async () => {
    try {
      const email = user?.email?.trim();
      if (!email) {
        toast.error('No email found on your account.');
        return;
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) {
        toast.error(`Could not resend confirmation: ${error.message}`);
        return;
      }
      toast.success('Confirmation email sent. Please check your inbox or spam folder.');
    } catch (e) {
      console.error('Resend confirmation error:', e);
      toast.error('Failed to resend confirmation email.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 h-20 w-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const userName = enrollments.length > 0 && enrollments[0].first_name
    ? enrollments[0].first_name
    : profile?.full_name && profile.full_name !== user?.email 
      ? profile.full_name 
      : 'Student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <CourseHeader isAdmin={isAdmin} isLoggedIn={true} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Admin Viewing Banner */}
        {viewingAsAdmin && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm animate-fade-in">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">Admin View</AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              You are viewing {profile?.full_name || profile?.email}'s profile. This is what they see.
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            <div className="relative group">
              <div className="h-24 w-24 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
                <Shield className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                Welcome back, <span className="text-primary">{userName}</span>
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
              <Link to="/courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
            <Button variant="outline" asChild className="hover:bg-muted/50 transition-colors">
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>

        {user && !user.email_confirmed_at && (
          <Alert className="mb-8 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-sm animate-fade-in">
            <AlertTitle className="text-amber-800 dark:text-amber-200">Email not confirmed</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-amber-700 dark:text-amber-300">
                Please confirm your email to secure your account. You can still access your courses now.
              </span>
              <Button variant="outline" size="sm" onClick={handleResend} className="border-amber-500/50 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0">
                Resend confirmation email
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {[
            { title: 'My Courses', value: new Set([...enrollments.map(e => e.course_type), ...completions.map(c => c.course_type)]).size, icon: BookOpen, color: 'blue' },
            { title: 'Completed', value: completions.filter(c => c.passed).length, icon: CheckCircle, color: 'green' },
            { title: 'Certificates', value: certificates.length, icon: Award, color: 'amber' },
          ].map((stat, i) => (
            <Card key={stat.title} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-transparent`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`h-10 w-10 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Level 3 Approval Code */}
        {profile?.level3_approval_code && (
          <Card className="mb-10 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Shield className="h-5 w-5" />
                Level 3 Part 1 Approval Code
              </CardTitle>
              <CardDescription className="text-blue-600/80 dark:text-blue-400/80">Use this code to schedule your in-person Part 2 training (expires in 24 hours)</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="p-6 bg-white/60 dark:bg-white/5 rounded-2xl border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <div className="text-3xl sm:text-4xl font-bold font-mono text-blue-900 dark:text-blue-100 tracking-[0.2em]">
                    {profile.level3_approval_code}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Save this code and bring it to your in-person training session. This code verifies you've completed Part 1.
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.level3_approval_code);
                      toast.success("Approval code copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Section */}
        <Card className="mb-10 border-0 shadow-xl overflow-hidden animate-fade-in">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              My Certificates
            </CardTitle>
            <CardDescription>Download and view your earned certificates anytime</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Check for missing certificates */}
            {completions.filter(c => c.passed && !certificates.find(cert => cert.completion_id === c.id)).length > 0 && (
              <Alert className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">Missing Certificates Detected</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center gap-3">
                  <span>
                    You have {completions.filter(c => c.passed && !certificates.find(cert => cert.completion_id === c.id)).length} completed course(s) without certificates.
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-500/50 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0"
                    asChild
                  >
                    <Link to="/generate-certificate">
                      Generate Missing Certificates
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((cert, i) => (
                  <div 
                    key={cert.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-muted/30 hover:bg-muted/50 rounded-xl border border-transparent hover:border-primary/20 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex-1 mb-4 sm:mb-0">
                      <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{getCourseTitle(cert.course_type)}</h4>
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground/80">Registration:</span> {cert.registration_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground/80">Issued:</span> {format(new Date(cert.completion_date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadCertificate(cert)}
                      className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No certificates earned yet. Complete a course to earn your first certificate!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browse More Courses */}
        <Card className="mb-10 border-0 shadow-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              Want to Expand Your Skills?
            </CardTitle>
            <CardDescription>Explore more security certification courses</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Button asChild size="lg" className="w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
              <Link to="/courses">
                Browse All Courses
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Combined My Courses Section */}
        <Card className="mb-10 border-0 shadow-xl overflow-hidden animate-fade-in">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              My Courses
            </CardTitle>
            <CardDescription>Track your enrolled courses and exam attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 && completions.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Courses Yet</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Start your security training journey today and earn professional certifications!
                </p>
                <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                  <Link to="/courses">
                    Browse Available Courses
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Get unique course types from enrollments and completions */}
                {(() => {
                  const courseTypes = new Set<string>();
                  enrollments.forEach(e => courseTypes.add(e.course_type));
                  completions.forEach(c => courseTypes.add(c.course_type));
                  
                  return Array.from(courseTypes).map((courseType, courseIndex) => {
                    const enrollment = enrollments.find(e => e.course_type === courseType);
                    const courseCompletions = completions.filter(c => c.course_type === courseType);
                    const latestCompletion = courseCompletions.length > 0 ? courseCompletions[0] : null;
                    const canAccess = enrollment && (enrollment.enrollment_status === 'enrolled' || enrollment.enrollment_status === 'pending') && !latestCompletion?.passed;
                    
                    return (
                      <div 
                        key={courseType} 
                        className="rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${courseIndex * 100}ms` }}
                      >
                        {/* Course Header */}
                        <div 
                          className={`p-6 ${canAccess ? 'cursor-pointer hover:bg-muted/30' : ''} transition-all duration-300`}
                          onClick={() => canAccess && navigate(`/course/${courseType}`)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{getCourseTitle(courseType)}</h4>
                              {enrollment && (
                                <p className="text-sm text-muted-foreground">
                                  Enrolled: {format(new Date(enrollment.created_at), 'MMMM d, yyyy')}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(latestCompletion?.passed ? 'completed' : (enrollment?.enrollment_status || 'completed'))}
                          </div>
                          
                          {latestCompletion && (
                            <div className="mt-4 pt-4 border-t border-dashed">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">Latest Exam Score</span>
                                <span className={`text-sm font-bold ${latestCompletion.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {latestCompletion.percentage}% ({latestCompletion.score}/{latestCompletion.total_questions})
                                </span>
                              </div>
                              <div className="relative">
                                <Progress value={latestCompletion.percentage} className="h-3 bg-muted" />
                                <div 
                                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${latestCompletion.passed ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                                  style={{ width: `${latestCompletion.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {canAccess && (
                            <div className="mt-4 flex items-center justify-center py-3 rounded-xl bg-primary/5 text-sm text-primary font-semibold group">
                              Continue Course
                              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                          )}
                        </div>
                        
                        {/* Attempt History (if any) */}
                        {courseCompletions.length > 0 && (
                          <div className="border-t bg-muted/20 p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-semibold text-muted-foreground">
                                Attempt History ({courseCompletions.length} {courseCompletions.length === 1 ? 'attempt' : 'attempts'})
                              </span>
                            </div>
                            <div className="space-y-3">
                              {courseCompletions.map((completion, idx) => (
                                <div 
                                  key={completion.id} 
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-xl border text-sm gap-3 animate-fade-in"
                                  style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="font-mono text-muted-foreground bg-muted px-2 py-1 rounded">#{completion.attempt_number || idx + 1}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs font-semibold ${completion.passed 
                                        ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" 
                                        : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"}`}
                                    >
                                      {completion.passed ? (
                                        <><CheckCircle className="h-3 w-3 mr-1" /> Pass</>
                                      ) : (
                                        <><XCircle className="h-3 w-3 mr-1" /> Fail</>
                                      )}
                                    </Badge>
                                    <span className="font-bold">{completion.percentage}%</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {format(new Date(completion.completed_at), 'MMM d, yyyy')}
                                    </span>
                                    <span>{format(new Date(completion.completed_at), 'h:mm a')}</span>
                                    {completion.duration_seconds && (
                                      <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                                        {Math.floor(completion.duration_seconds / 60)} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
