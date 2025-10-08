import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Award, BookOpen, Users, ArrowLeft, CheckCircle, XCircle, LogOut } from "lucide-react";
import { format } from "date-fns";
import { toast as sonnerToast } from "sonner";

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to access admin panel",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase.rpc('is_admin', { _user_id: user.id });
    
    if (!adminCheck) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await fetchAllData();
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      sonnerToast.error("Failed to sign out");
    } else {
      sonnerToast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    
    // Fetch certificates
    const { data: certsData, error: certsError } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (certsError) {
      console.error('Error fetching certificates:', certsError);
    } else {
      setCertificates(certsData || []);
    }

    // Fetch completions
    const { data: completionsData, error: completionsError } = await supabase
      .from('course_completions')
      .select('*')
      .order('completed_at', { ascending: false });

    if (completionsError) {
      console.error('Error fetching completions:', completionsError);
    } else {
      setCompletions(completionsData || []);
    }

    // Fetch enrollments
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false });

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
    } else {
      setEnrollments(enrollmentsData || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Course Completions</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completions.filter(c => c.passed).length} passed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {enrollments.filter(e => e.enrollment_status === 'approved').length} approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different data views */}
        <Tabs defaultValue="certificates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="completions">Completions</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>All Certificates</CardTitle>
                <CardDescription>View all issued certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration #</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Course Type</TableHead>
                      <TableHead>Completion Date</TableHead>
                      <TableHead>ID Type</TableHead>
                      <TableHead>Last 6 Digits</TableHead>
                      <TableHead>Issued At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">{cert.registration_number}</TableCell>
                        <TableCell className="font-medium">{cert.student_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cert.course_type}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(cert.completion_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="capitalize">{cert.identification_type?.replace('_', ' ')}</TableCell>
                        <TableCell className="font-mono">{cert.last_six_digits}</TableCell>
                        <TableCell>{format(new Date(cert.issued_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {certificates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No certificates issued yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completions">
            <Card>
              <CardHeader>
                <CardTitle>Course Completions</CardTitle>
                <CardDescription>View all course completion records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Course Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completions.map((completion) => (
                      <TableRow key={completion.id}>
                        <TableCell className="font-mono text-xs">{completion.user_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge variant="outline">{completion.course_type}</Badge>
                        </TableCell>
                        <TableCell>{completion.score}/{completion.total_questions}</TableCell>
                        <TableCell>
                          <span className={completion.percentage >= 75 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                            {completion.percentage}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {completion.passed ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Passed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(completion.completed_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {completions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No completions yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle>Enrollments</CardTitle>
                <CardDescription>View all course enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Course Type</TableHead>
                      <TableHead>ID Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.first_name} {enrollment.last_name}
                        </TableCell>
                        <TableCell>{enrollment.email}</TableCell>
                        <TableCell>{enrollment.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{enrollment.course_type}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{enrollment.identification_type?.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={enrollment.enrollment_status === 'approved' ? 'default' : 'secondary'}
                          >
                            {enrollment.enrollment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(enrollment.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {enrollments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No enrollments yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;