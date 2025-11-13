import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Award, BookOpen, Users, CheckCircle, XCircle, Download, Filter, Search, ArrowUpDown, Eye, Key, Plus, RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast as sonnerToast } from "sonner";
import kairosLogo from "@/assets/kairos-logo.png";

interface EnhancedCompletion {
  id: string;
  user_id: string;
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
  user_email?: string;
  user_name?: string;
  certificate_id?: string;
  certificate_url?: string;
}

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [completions, setCompletions] = useState<EnhancedCompletion[]>([]);
  const [filteredCompletions, setFilteredCompletions] = useState<EnhancedCompletion[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [approvalCodes, setApprovalCodes] = useState<any[]>([]);
  const [filteredApprovalCodes, setFilteredApprovalCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [attemptFilter, setAttemptFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("completed_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Approval code filter states
  const [codeSearchQuery, setCodeSearchQuery] = useState("");
  const [codeStatusFilter, setCodeStatusFilter] = useState("all");
  
  // Detail drawer state
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  
  // Generate code dialog state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState<any>(null);

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [completions, searchQuery, courseFilter, resultFilter, attemptFilter, sortField, sortOrder]);

  useEffect(() => {
    applyApprovalFilters();
  }, [approvalCodes, codeSearchQuery, codeStatusFilter]);

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

  const fetchAllData = async () => {
    setLoading(true);
    
    // Fetch certificates
    const { data: certsData } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });
    setCertificates(certsData || []);

    // Fetch completions with user data
    const { data: completionsData } = await supabase
      .from('course_completions')
      .select('*')
      .order('completed_at', { ascending: false });

    // Fetch profiles to get user names and emails
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email');

    // Fetch enrollments to get actual student names
    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('user_id, first_name, last_name, email');

    // Enrich completions with user info and certificate data
    const enrichedCompletions = (completionsData || []).map(comp => {
      const profile = profilesData?.find(p => p.id === comp.user_id);
      const cert = certsData?.find(c => c.completion_id === comp.id);
      
      // Try to get name from enrollment first, then profile
      const enrollment = enrollmentsData?.find(e => e.user_id === comp.user_id);
      let displayName = 'Name Not Set';
      
      if (enrollment?.first_name && enrollment?.last_name) {
        displayName = `${enrollment.first_name} ${enrollment.last_name}`;
      } else if (profile?.full_name && !profile.full_name.includes('@')) {
        displayName = profile.full_name;
      }
      
      return {
        ...comp,
        user_email: profile?.email || 'Unknown',
        user_name: displayName,
        certificate_id: cert?.registration_number,
        certificate_url: cert?.id,
      };
    });

    setCompletions(enrichedCompletions);
    setFilteredCompletions(enrichedCompletions);

    // Fetch all enrollments for display
    const { data: allEnrollmentsData } = await supabase
      .from('enrollments')
      .select('*')
      .order('created_at', { ascending: false });
    setEnrollments(allEnrollmentsData || []);

    // Fetch approval codes
    const { data: approvalsData } = await supabase
      .from('level3_approvals')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Enrich approval codes with enrollment and profile names
    const enrichedApprovals = (approvalsData || []).map(approval => {
      const enrollment = enrollmentsData?.find(e => e.user_id === approval.user_id);
      const profile = profilesData?.find(p => p.id === approval.user_id);
      
      let displayName = 'Name Not Set';
      
      if (enrollment?.first_name && enrollment?.last_name) {
        displayName = `${enrollment.first_name} ${enrollment.last_name}`;
      } else if (profile?.full_name && !profile.full_name.includes('@')) {
        displayName = profile.full_name;
      }
      
      return {
        ...approval,
        display_name: displayName,
        email: profile?.email || 'Unknown'
      };
    });
    
    setApprovalCodes(enrichedApprovals);
    setFilteredApprovalCodes(enrichedApprovals);

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...completions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.user_name?.toLowerCase().includes(query) || 
        c.user_email?.toLowerCase().includes(query)
      );
    }

    // Course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter(c => c.course_type === courseFilter);
    }

    // Result filter
    if (resultFilter === "passed") {
      filtered = filtered.filter(c => c.passed);
    } else if (resultFilter === "failed") {
      filtered = filtered.filter(c => !c.passed);
    }

    // Attempt count filter
    if (attemptFilter !== "all") {
      filtered = filtered.filter(c => {
        const attempt = c.attempt_number || 1;
        if (attemptFilter === "1") return attempt === 1;
        if (attemptFilter === "2-3") return attempt >= 2 && attempt <= 3;
        if (attemptFilter === "4+") return attempt >= 4;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof EnhancedCompletion];
      let bVal: any = b[sortField as keyof EnhancedCompletion];
      
      if (sortField === "completed_at" || sortField === "started_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredCompletions(filtered);
  };

  const applyApprovalFilters = () => {
    let filtered = [...approvalCodes];

    // Search filter
    if (codeSearchQuery) {
      const query = codeSearchQuery.toLowerCase();
      filtered = filtered.filter(code => 
        code.approval_code?.toLowerCase().includes(query) ||
        code.display_name?.toLowerCase().includes(query) ||
        code.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (codeStatusFilter !== "all") {
      filtered = filtered.filter(code => {
        const status = getApprovalStatus(code);
        return status === codeStatusFilter;
      });
    }

    setFilteredApprovalCodes(filtered);
  };

  const getApprovalStatus = (approval: any) => {
    if (approval.used) return 'used';
    if (new Date(approval.expires_at) < new Date()) return 'expired';
    return 'active';
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Course",
      "Attempt #",
      "Start Time",
      "End Time",
      "Duration (min)",
      "Score",
      "Result",
      "Completion Date",
      "Certificate ID",
    ];

    const rows = filteredCompletions.map(c => [
      c.user_name,
      c.user_email,
      c.course_type,
      c.attempt_number || 1,
      c.started_at ? format(new Date(c.started_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      c.ended_at ? format(new Date(c.ended_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      c.duration_seconds ? Math.floor(c.duration_seconds / 60) : 'N/A',
      `${c.score}/${c.total_questions} (${c.percentage}%)`,
      c.passed ? 'Pass' : 'Fail',
      format(new Date(c.completed_at), 'yyyy-MM-dd'),
      c.certificate_id || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairos-course-completions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    sonnerToast.success(`Exported ${filteredCompletions.length} records to CSV`);
  };

  const handleGenerateCode = async () => {
    if (!selectedCompletion) return;

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase.rpc('generate_level3_approval_code');
      
      if (error) throw error;

      const newCode = data;

      // Insert the new approval code
      const { error: insertError } = await supabase
        .from('level3_approvals')
        .insert({
          user_id: selectedCompletion.user_id,
          completion_id: selectedCompletion.id,
          approval_code: newCode,
          expires_at: expiresAt.toISOString(),
          used: false,
        });

      if (insertError) throw insertError;

      // Update user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ level3_approval_code: newCode })
        .eq('id', selectedCompletion.user_id);

      if (updateError) throw updateError;

      sonnerToast.success(`Approval code ${newCode} generated successfully`);
      setShowGenerateDialog(false);
      setSelectedCompletion(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Error generating code:', error);
      sonnerToast.error('Failed to generate approval code');
    }
  };

  const handleMarkAsUsed = async (approvalId: string) => {
    try {
      const { error } = await supabase
        .from('level3_approvals')
        .update({ used: true })
        .eq('id', approvalId);

      if (error) throw error;

      sonnerToast.success('Code marked as used');
      fetchAllData();
    } catch (error: any) {
      console.error('Error marking code as used:', error);
      sonnerToast.error('Failed to mark code as used');
    }
  };

  const handleRegenerateCode = async (approval: any) => {
    try {
      // Mark old code as used
      await handleMarkAsUsed(approval.id);

      // Generate new code
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase.rpc('generate_level3_approval_code');
      
      if (error) throw error;

      const newCode = data;

      const { error: insertError } = await supabase
        .from('level3_approvals')
        .insert({
          user_id: approval.user_id,
          completion_id: approval.completion_id,
          approval_code: newCode,
          expires_at: expiresAt.toISOString(),
          used: false,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ level3_approval_code: newCode })
        .eq('id', approval.user_id);

      if (updateError) throw updateError;

      sonnerToast.success(`New code ${newCode} generated`);
      fetchAllData();
    } catch (error: any) {
      console.error('Error regenerating code:', error);
      sonnerToast.error('Failed to regenerate code');
    }
  };

  const openUserDetails = async (userId: string) => {
    setSelectedUser(userId);
    
    // Fetch all data for this user
    const { data: userCompletions } = await supabase
      .from('course_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    const { data: userCerts } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId);

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: userProgress } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: userEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();

    // Construct display name from enrollment or profile
    let displayName = 'Name Not Set';
    if (userEnrollment?.first_name && userEnrollment?.last_name) {
      displayName = `${userEnrollment.first_name} ${userEnrollment.last_name}`;
    } else if (userProfile?.full_name && !userProfile.full_name.includes('@')) {
      displayName = userProfile.full_name;
    }

    setUserDetails({
      profile: { ...userProfile, display_name: displayName },
      completions: userCompletions || [],
      certificates: userCerts || [],
      progress: userProgress || [],
    });
  };

  const getCourseTitle = (courseType: string) => {
    const titles: Record<string, string> = {
      'level2': 'Level 2 Security Officer',
      'level3': 'Level 3 Security Officer (Part 1)',
      'level4': 'Level 4 Bodyguard',
      'pepper_spray': 'Pepper Spray Certification',
    };
    return titles[courseType] || courseType;
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <CourseHeader isAdmin={isAdmin} showAuthButtons={true} />

      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(completions.map(c => c.user_id)).size}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
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
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">L3 Codes</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalCodes.filter(c => getApprovalStatus(c) === 'active').length}</div>
              <p className="text-xs text-muted-foreground mt-1">active codes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="attempts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attempts">Course Attempts</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="approvals">Approval Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="attempts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Course Attempts & Results</CardTitle>
                    <CardDescription>Complete audit log with filtering and export</CardDescription>
                  </div>
                  <Button onClick={exportToCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name/email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="level2">Level 2</SelectItem>
                      <SelectItem value="level3">Level 3</SelectItem>
                      <SelectItem value="level4">Level 4</SelectItem>
                      <SelectItem value="pepper_spray">Pepper Spray</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={resultFilter} onValueChange={setResultFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Results" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Results</SelectItem>
                      <SelectItem value="passed">Passed Only</SelectItem>
                      <SelectItem value="failed">Failed Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={attemptFilter} onValueChange={setAttemptFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Attempts</SelectItem>
                      <SelectItem value="1">1st Attempt</SelectItem>
                      <SelectItem value="2-3">2-3 Attempts</SelectItem>
                      <SelectItem value="4+">4+ Attempts</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-muted-foreground flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    {filteredCompletions.length} of {completions.length}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => toggleSort('user_name')}>
                            Name
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-center">Attempt #</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => toggleSort('completed_at')}>
                            Date
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => toggleSort('score')}>
                            Score
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Certificate</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompletions.map((completion) => (
                        <TableRow key={completion.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{completion.user_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{completion.user_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{completion.course_type}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">#{completion.attempt_number || 1}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(completion.completed_at), 'MMM dd, yyyy')}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(completion.completed_at), 'h:mm a')}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {completion.duration_seconds 
                              ? `${Math.floor(completion.duration_seconds / 60)} min` 
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={completion.percentage >= 70 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                              {completion.percentage}%
                            </span>
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {completion.score}/{completion.total_questions}
                            </span>
                          </TableCell>
                          <TableCell>
                            {completion.passed ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Pass
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Fail
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {completion.certificate_id || '-'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openUserDetails(completion.user_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredCompletions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No results match your filters
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                          <Badge variant={enrollment.enrollment_status === 'enrolled' ? 'default' : 'secondary'}>
                            {enrollment.enrollment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(enrollment.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Level 3 Approval Codes</CardTitle>
                    <CardDescription>Manage Part 1 completion approval codes</CardDescription>
                  </div>
                  <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate Approval Code</DialogTitle>
                        <DialogDescription>
                          Select a Level 3 completion to generate an approval code for
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Select Completion</label>
                          <Select 
                            value={selectedCompletion?.id || ""} 
                            onValueChange={(value) => {
                              const completion = completions.find(c => c.id === value);
                              setSelectedCompletion(completion);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a Level 3 completion..." />
                            </SelectTrigger>
                            <SelectContent>
                              {completions
                                .filter(c => c.course_type === 'level3' && c.passed)
                                .map(completion => (
                                  <SelectItem key={completion.id} value={completion.id}>
                                    {completion.user_name} - {format(new Date(completion.completed_at), 'MMM dd, yyyy')} ({completion.percentage}%)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedCompletion && (
                          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                            <p><span className="text-muted-foreground">Student:</span> {selectedCompletion.user_name}</p>
                            <p><span className="text-muted-foreground">Email:</span> {selectedCompletion.user_email}</p>
                            <p><span className="text-muted-foreground">Score:</span> {selectedCompletion.percentage}%</p>
                            <p><span className="text-muted-foreground">Date:</span> {format(new Date(selectedCompletion.completed_at), 'MMM dd, yyyy')}</p>
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Code will expire in 24 hours
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleGenerateCode} disabled={!selectedCompletion}>
                          Generate Code
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search code, name, or email..."
                      value={codeSearchQuery}
                      onChange={(e) => setCodeSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={codeStatusFilter} onValueChange={setCodeStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Approval Code</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApprovalCodes.map((approval) => {
                        const status = getApprovalStatus(approval);
                        return (
                          <TableRow key={approval.id}>
                            <TableCell className="font-mono font-bold">{approval.approval_code}</TableCell>
                            <TableCell className="font-medium">{approval.display_name || 'Name Not Set'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{approval.email || 'Unknown'}</TableCell>
                            <TableCell>
                              {status === 'active' && (
                                <Badge className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              {status === 'expired' && (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Expired
                                </Badge>
                              )}
                              {status === 'used' && (
                                <Badge variant="outline">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Used
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(approval.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(approval.expires_at), 'MMM dd, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkAsUsed(approval.id)}
                                  >
                                    Mark Used
                                  </Button>
                                )}
                                {(status === 'expired' || status === 'used') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRegenerateCode(approval)}
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Regenerate
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openUserDetails(approval.user_id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {filteredApprovalCodes.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No approval codes found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Detail Drawer */}
      <Sheet open={selectedUser !== null} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Learner Details</SheetTitle>
            <SheetDescription>Complete history and certificates</SheetDescription>
          </SheetHeader>
          
          {userDetails && (
            <div className="mt-6 space-y-6">
              {/* View as User Button */}
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  window.open(`/profile?userId=${selectedUser}`, '_blank');
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Student Profile
              </Button>

              {/* Profile Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Profile Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {userDetails.profile?.display_name || 'Name Not Set'}</p>
                  <p><span className="text-muted-foreground">Email:</span> {userDetails.profile?.email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {userDetails.profile?.phone_number || 'N/A'}</p>
                </div>
              </div>

              {/* Certificates */}
              <div>
                <h3 className="font-semibold mb-3">Certificates ({userDetails.certificates.length})</h3>
                <div className="space-y-2">
                  {userDetails.certificates.map((cert: any) => (
                    <div key={cert.id} className="p-3 border rounded-lg text-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{getCourseTitle(cert.course_type)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {cert.registration_number} • {format(new Date(cert.completion_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigate(`/certificate-preview?name=${encodeURIComponent(cert.student_name)}&id=${encodeURIComponent(cert.identification_type)}&lastSix=${encodeURIComponent(cert.last_six_digits)}&date=${encodeURIComponent(cert.completion_date)}`);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {userDetails.certificates.length === 0 && (
                    <p className="text-sm text-muted-foreground">No certificates yet</p>
                  )}
                </div>
              </div>

              {/* Attempt History */}
              <div>
                <h3 className="font-semibold mb-3">Attempt History ({userDetails.completions.length})</h3>
                <div className="space-y-3">
                  {userDetails.completions.map((comp: any) => (
                    <div key={comp.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{getCourseTitle(comp.course_type)}</p>
                          <p className="text-xs text-muted-foreground">Attempt #{comp.attempt_number || 1}</p>
                        </div>
                        <Badge variant={comp.passed ? "default" : "secondary"} className={comp.passed ? "bg-green-600" : ""}>
                          {comp.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Score:</span> {comp.percentage}%
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span> {format(new Date(comp.completed_at), 'MMM dd, yyyy')}
                        </div>
                        {comp.duration_seconds && (
                          <div>
                            <span className="text-muted-foreground">Duration:</span> {Math.floor(comp.duration_seconds / 60)} min
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Watch Time */}
              {userDetails.progress && userDetails.progress.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Video Watch Time</h3>
                  <div className="space-y-2">
                    {userDetails.progress
                      .filter((p: any) => p.video_watch_time_seconds)
                      .map((p: any) => (
                        <div key={p.id} className="p-3 border rounded-lg text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{getCourseTitle(p.course_type)}</p>
                              <p className="text-xs text-muted-foreground">Section {p.section_id}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">
                                {Math.floor(p.video_watch_time_seconds / 60)} min {p.video_watch_time_seconds % 60} sec
                              </p>
                              {p.video_started_at && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(p.video_started_at), 'MMM dd, h:mm a')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    {userDetails.progress.filter((p: any) => p.video_watch_time_seconds).length === 0 && (
                      <p className="text-sm text-muted-foreground">No video watch time recorded yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Footer />
    </div>
  );
};

export default Admin;