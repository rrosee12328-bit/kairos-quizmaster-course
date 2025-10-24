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
import { Shield, Award, BookOpen, Download, Settings, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import kairosLogo from "@/assets/kairos-logo.png";

interface Enrollment {
  id: string;
  course_type: string;
  enrollment_status: string;
  created_at: string;
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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in to view your profile");
      navigate("/auth");
      return;
    }

    setUser(user);
    await fetchUserData(user.id, user.email || '');
  };

  const fetchUserData = async (userId: string, userEmail: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      setProfile(profileData);

      // Fetch enrollments by user_id OR email
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .or(`user_id.eq.${userId},email.eq.${userEmail}`)
        .order('created_at', { ascending: false });
      
      // Check if there are enrollments to sync
      if (enrollmentData) {
        const enrollmentsToUpdate = enrollmentData.filter(e => !e.user_id && e.email === userEmail);
        if (enrollmentsToUpdate.length > 0) {
          console.log('Syncing enrollments with user account:', enrollmentsToUpdate.length);
          
          // Call server-side sync function for secure enrollment sync
          const { error: syncError } = await supabase.functions.invoke('sync-enrollment');
          
          if (syncError) {
            console.error('Error syncing enrollments:', syncError);
          } else {
            // Refresh enrollments after sync
            const { data: updatedData } = await supabase
              .from('enrollments')
              .select('*')
              .or(`user_id.eq.${userId},email.eq.${userEmail}`)
              .order('created_at', { ascending: false });
            
            setEnrollments(updatedData || []);
            return;
          }
        }
      }
      
      setEnrollments(enrollmentData || []);

      // Fetch completions
      const { data: completionData } = await supabase
        .from('course_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      setCompletions(completionData || []);

      // Fetch certificates
      const { data: certificateData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });
      
      setCertificates(certificateData || []);

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
      'pending': { variant: 'secondary', icon: Clock, label: 'Pending' },
      'approved': { variant: 'default', icon: CheckCircle, label: 'Enrolled' },
      'completed': { variant: 'default', icon: Award, label: 'Completed' },
      'rejected': { variant: 'destructive', icon: XCircle, label: 'Rejected' }
    };
    
    const config = variants[status] || variants['pending'];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Kairos Security Academy</h1>
            </Link>
            <div className="flex items-center gap-2">
              <BackButton />
              <Button variant="ghost" asChild>
                <Link to="/courses">Courses</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-20 w-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-1">
                {profile?.full_name && profile.full_name !== user?.email 
                  ? profile.full_name 
                  : 'Welcome!'}
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </div>

        {user && !user.email_confirmed_at && (
          <Alert className="mb-6">
            <AlertTitle>Email not confirmed</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span>
                Please confirm your email to secure your account. You can still access your courses now.
              </span>
              <Button variant="outline" size="sm" onClick={handleResend}>
                Resend confirmation email
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completions.filter(c => c.passed).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificates.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Level 3 Approval Code */}
        {profile?.level3_approval_code && (
          <Card className="mb-8 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Shield className="h-5 w-5" />
                Level 3 Part 1 Approval Code
              </CardTitle>
              <CardDescription>Use this code to schedule your in-person Part 2 training (expires in 24 hours)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-500">
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold font-mono text-blue-900 dark:text-blue-100 tracking-wider">
                    {profile.level3_approval_code}
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Save this code and bring it to your in-person training session. This code verifies you've completed Part 1.
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.level3_approval_code);
                      toast.success("Approval code copied to clipboard!");
                    }}
                  >
                    Copy Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Section - Always visible */}
        <Card className="mb-8 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              My Certificates
            </CardTitle>
            <CardDescription>Download and view your earned certificates anytime</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Check for missing certificates */}
            {completions.filter(c => c.passed && !certificates.find(cert => cert.completion_id === c.id)).length > 0 && (
              <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <AlertTitle className="text-amber-800 dark:text-amber-200">Missing Certificates Detected</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  You have {completions.filter(c => c.passed && !certificates.find(cert => cert.completion_id === c.id)).length} completed course(s) without certificates.
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4 border-amber-500 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900"
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
                {certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold">{getCourseTitle(cert.course_type)}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Registration:</span> {cert.registration_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Issued:</span> {format(new Date(cert.completion_date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadCertificate(cert)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No certificates earned yet. Complete a course to earn your first certificate!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course History - Audit Log */}
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              My Course History
            </CardTitle>
            <CardDescription>Complete audit log of all your course attempts for regulatory review</CardDescription>
          </CardHeader>
          <CardContent>
            {completions.length > 0 ? (
              <div className="space-y-3">
                {completions.map((completion, idx) => (
                  <div key={completion.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{getCourseTitle(completion.course_type)}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Attempt #{completion.attempt_number || idx + 1}
                        </p>
                      </div>
                      <Badge variant={completion.passed ? "default" : "secondary"} className={completion.passed ? "bg-green-600" : ""}>
                        {completion.passed ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Passed
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Score</p>
                        <p className="font-semibold">{completion.score}/{completion.total_questions} ({completion.percentage}%)</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Completed</p>
                        <p className="font-medium">{format(new Date(completion.completed_at), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Time</p>
                        <p className="font-medium">{format(new Date(completion.completed_at), 'h:mm a')}</p>
                      </div>
                      {completion.duration_seconds && (
                        <div>
                          <p className="text-muted-foreground text-xs">Duration</p>
                          <p className="font-medium">{Math.floor(completion.duration_seconds / 60)} min</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No course attempts yet. Start a course to begin your learning journey!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browse More Courses */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Want to Expand Your Skills?
            </CardTitle>
            <CardDescription>Explore more security certification courses</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="w-full">
              <Link to="/courses">
                Browse All Courses
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Enrollments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              My Courses
            </CardTitle>
            <CardDescription>Track your enrolled and completed courses</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">You haven't enrolled in any courses yet</p>
                <Button asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment) => {
                  const completion = completions.find(c => c.course_type === enrollment.course_type);
                  const canAccess = enrollment.enrollment_status === 'enrolled' && !completion;
                  
                  return (
                    <div key={enrollment.id} className={`border rounded-lg p-4 ${canAccess ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''} transition-all`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold mb-1">{getCourseTitle(enrollment.course_type)}</h4>
                          <p className="text-sm text-muted-foreground">
                            Enrolled: {format(new Date(enrollment.created_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        {getStatusBadge(completion ? 'completed' : enrollment.enrollment_status)}
                      </div>
                      
                      {completion && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Final Exam Score</span>
                            <span className={`text-sm font-semibold ${completion.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {completion.percentage}% ({completion.score}/{completion.total_questions})
                            </span>
                          </div>
                          <Progress value={completion.percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {format(new Date(completion.completed_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      
                      <Button asChild className="mt-3 w-full" size="lg" variant={canAccess ? "default" : "outline"} disabled={!canAccess}>
                        <Link to={canAccess ? `/course/${enrollment.course_type}` : '#'}>
                          {canAccess ? (
                            <>
                              Continue Course
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          ) : (
                            'Course Completed'
                          )}
                        </Link>
                      </Button>
                    </div>
                  );
                })}
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
