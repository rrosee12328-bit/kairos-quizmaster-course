import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Certificate from "@/components/Certificate";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Printer, Mail, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CertificatePreview = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userName, setUserName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [idType, setIdType] = useState("");
  const [lastSixDigits, setLastSixDigits] = useState("");
  const [email, setEmail] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificateData();
  }, []);

  const loadCertificateData = async () => {
    try {
      // Check if data is provided via query params (from email link)
      const nameParam = searchParams.get('name');
      const idParam = searchParams.get('id');
      const lastSixParam = searchParams.get('lastSix');
      const dateParam = searchParams.get('date');
      const autoDownload = searchParams.get('download') === 'true';

      // If all required params are present, use them directly (no auth needed)
      if (nameParam && idParam && lastSixParam && dateParam) {
        setUserName(nameParam);
        setIdType(idParam === 'ssn' ? 'SSN' : 'Driver License');
        setLastSixDigits(lastSixParam);
        setCompletionDate(dateParam);
        setRegistrationNumber(''); // Not needed for display
        setLoading(false);

        // Auto-download if requested
        if (autoDownload) {
          setTimeout(() => {
            downloadCertificate();
          }, 500);
        }
        return;
      }

      // Otherwise, require authentication and fetch from database
      const regNum = searchParams.get('registration');
      
      if (!regNum) {
        toast({
          title: "Error",
          description: "Missing certificate information",
          variant: "destructive",
        });
        navigate('/profile');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be signed in to view certificates",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Fetch certificate from database
      const { data: cert, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('registration_number', regNum)
        .eq('user_id', user.id)
        .single();

      if (error || !cert) {
        toast({
          title: "Error",
          description: "Certificate not found or access denied",
          variant: "destructive",
        });
        navigate('/profile');
        return;
      }

      setUserName(cert.student_name);
      setRegistrationNumber(cert.registration_number);
      setCompletionDate(cert.completion_date);
      setIdType(cert.identification_type === 'ssn' ? 'SSN' : 'Driver License');
      setLastSixDigits(cert.last_six_digits);
      setLoading(false);
    } catch (error) {
      console.error('Error loading certificate:', error);
      toast({
        title: "Error",
        description: "Failed to load certificate",
        variant: "destructive",
      });
      navigate('/profile');
    }
  };

  const downloadCertificate = async () => {
    setIsDownloading(true);
    try {
      const exportEl = document.getElementById('certificate-export');
      const displayEl = document.getElementById('certificate-display');
      const fallbackEl = document.getElementById('certificate');
      const certificateElement = exportEl || displayEl || fallbackEl;
      if (!certificateElement) {
        throw new Error('Certificate element not found');
      }

      const canvas = await html2canvas(certificateElement as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;
      const orientation = width > height ? 'landscape' : 'portrait';

      const pdf = new jsPDF({
        orientation: orientation as 'landscape' | 'portrait',
        unit: 'px',
        format: [width, height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`certificate-${userName.replace(/\s+/g, '-')}.pdf`);

      toast({
        title: "Success",
        description: "Certificate downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download certificate",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  const sendCertificateEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-certificate', {
        body: {
          name: userName,
          email: email,
          date: completionDate,
          registrationNumber: registrationNumber,
          appOrigin: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Certificate sent to ${email}`,
      });
      setEmail("");
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: "Error",
        description: "Failed to send certificate email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Shield className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8">
      <div className="container mx-auto px-6">
        <div className="mb-6">
          <BackButton fallbackPath="/profile" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">Official Certificate</h1>

        <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Security Notice:</strong> This certificate is official and verified. All information is locked and cannot be edited to maintain document integrity.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Certificate Details (Read-Only)
              </CardTitle>
              <CardDescription>Official enrollment and completion information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg max-w-[720px]">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Student Name (From Enrollment)</Label>
                  <p className="text-lg lg:text-xl font-semibold leading-snug">{userName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Identification Type</Label>
                  <p className="text-base font-normal leading-snug">{idType}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Last 6 Digits</Label>
                  <p className="text-base font-mono font-normal leading-snug">***-**-{lastSixDigits}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                  <p className="text-base font-mono font-normal leading-snug">{registrationNumber}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Completion Date (Actual)</Label>
                  <p className="text-base font-normal leading-snug">{new Date(completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <h3 className="font-semibold">Certificate Actions</h3>
                
                <Button 
                  onClick={downloadCertificate}
                  disabled={isDownloading}
                  className="w-full"
                  variant="default"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? "Generating PDF..." : "Download as PDF"}
                </Button>

                <Button 
                  onClick={printCertificate}
                  className="w-full"
                  variant="outline"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Certificate
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Certificate</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="recipient@example.com"
                    />
                    <Button 
                      onClick={sendCertificateEmail}
                      disabled={isSending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isSending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-1 relative">
            <div className="w-full" style={{ aspectRatio: '16/9' }}>
              <Certificate
                userName={userName}
                registrationNumber={registrationNumber}
                courseCompletionDate={completionDate}
                idType={idType}
                lastSixDigits={lastSixDigits}
                certificateId="certificate-display"
              />
            </div>
            {/* Hidden export-sized certificate for accurate PDF rendering */}
            <div className="absolute -left-[9999px] top-0">
              <Certificate
                userName={userName}
                registrationNumber={registrationNumber}
                courseCompletionDate={completionDate}
                idType={idType}
                lastSixDigits={lastSixDigits}
                certificateId="certificate-export"
                exportMode
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
