import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, FileCheck, Loader2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";

interface Completion {
  id: string;
  course_type: string;
  completed_at: string;
  score: number;
  percentage: number;
  passed: boolean;
}

const GenerateCertificate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    await fetchCompletionsWithoutCertificates(user.id);
  };

  const fetchCompletionsWithoutCertificates = async (userId: string) => {
    try {
      // Get all passing completions
      const { data: allCompletions, error: completionsError } = await supabase
        .from('course_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('passed', true)
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      // Get all certificates
      const { data: certificates } = await supabase
        .from('certificates')
        .select('completion_id')
        .eq('user_id', userId);

      const certificateCompletionIds = new Set(
        certificates?.map(c => c.completion_id) || []
      );

      // Filter completions without certificates
      const missing = allCompletions?.filter(
        c => !certificateCompletionIds.has(c.id)
      ) || [];

      setCompletions(missing);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load completion records');
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (completionId: string) => {
    setGenerating(completionId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-missing-certificate', {
        body: { completionId }
      });

      if (error) throw error;

      toast.success('Certificate generated successfully!');
      
      // Remove from list
      setCompletions(prev => prev.filter(c => c.id !== completionId));
      
      // Redirect to profile after a moment
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast.error(error.message || 'Failed to generate certificate');
    } finally {
      setGenerating(null);
    }
  };

  const getCourseTitle = (courseType: string) => {
    const titles: Record<string, string> = {
      'level2': 'Level 2 Security Officer',
      'level3': 'Level 3 Security Officer',
      'level4': 'Level 4 Personal Protection',
      'pepper_spray': 'Pepper Spray Certification'
    };
    return titles[courseType] || courseType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Shield className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <CourseHeader isLoggedIn={!!user} />

      <main className="flex-1 container mx-auto px-6 py-12">
        {completions.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-6 w-6 text-green-600" />
                All Certificates Generated
              </CardTitle>
              <CardDescription>
                You have certificates for all your passing course completions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/profile')}>
                View My Certificates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Missing Certificates</CardTitle>
                <CardDescription>
                  The following course completions are missing certificates. Click to generate them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completions.map((completion) => (
                  <div
                    key={completion.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">{getCourseTitle(completion.course_type)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Completed: {new Date(completion.completed_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score: {completion.score}/{completion.score} ({completion.percentage}%)
                      </p>
                    </div>
                    <Button
                      onClick={() => handleGenerateCertificate(completion.id)}
                      disabled={generating !== null}
                    >
                      {generating === completion.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Certificate'
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default GenerateCertificate;
