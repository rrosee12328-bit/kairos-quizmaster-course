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

// HTML escape function to prevent XSS in document.write contexts
const escapeHtml = (str: string): string => {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (m) => entities[m] || m);
};

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
  const [courseType, setCourseType] = useState<string>("level2");

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
          setTimeout(async () => {
            await downloadCertificate();
            // Show success message that user can close the window
            toast({
              title: "Download Complete",
              description: "You can now close this window",
            });
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
      setCourseType(cert.course_type || 'level2');
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

      // Ensure fonts and images are fully loaded before rendering
      try {
        // Wait for all fonts to be ready
        // @ts-ignore
        if ((document as any).fonts && (document as any).fonts.ready) {
          await (document as any).fonts.ready;
        }
      } catch {}

      // Wait for images inside the certificate to load
      const imgs = Array.from((certificateElement as HTMLElement).querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) {
            // decode() is more reliable when available
            // @ts-ignore
            return typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve();
          }
          return new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
        })
      );

      // Small extra delay to stabilize layout
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(certificateElement as HTMLElement, {
        scale: 3, // Increased scale for better quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;
      const orientation = width > height ? 'landscape' : 'portrait';

      const pdf = new jsPDF({
        orientation: orientation as 'landscape' | 'portrait',
        unit: 'px',
        format: [width, height],
        compress: true,
      });

      pdf.addImage(imgData, 'PNG', 0, 0, width, height, undefined, 'FAST');
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

  const printCertificate = async () => {
    try {
      const exportEl = document.getElementById('certificate-export');
      const displayEl = document.getElementById('certificate-display');
      const fallbackEl = document.getElementById('certificate');
      const certificateElement = exportEl || displayEl || fallbackEl;
      if (!certificateElement) {
        throw new Error('Certificate element not found');
      }

      // Ensure fonts and images are fully loaded before rendering
      try {
        // @ts-ignore
        if ((document as any).fonts && (document as any).fonts.ready) {
          await (document as any).fonts.ready;
        }
      } catch {}

      const imgs = Array.from((certificateElement as HTMLElement).querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) {
            // @ts-ignore
            return typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve();
          }
          return new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(certificateElement as HTMLElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'Error',
          description: 'Please allow pop-ups to print',
          variant: 'destructive',
        });
        return;
      }

      const safeUserName = escapeHtml(userName);
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Certificate - ${safeUserName}</title>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                @page { margin: 0; size: landscape; }
              }
              * { box-sizing: border-box; }
              html, body { height: 100%; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { max-width: 100vw; height: auto; display: block; }
            </style>
          </head>
          <body>
            <img id="print-image" src="${imgData}" alt="Certificate Preview" />
            <script>
              (function() {
                const img = document.getElementById('print-image');
                function doPrint() {
                  setTimeout(function() {
                    window.print();
                    window.onafterprint = function() { window.close(); };
                  }, 150);
                }
                if (img && 'decode' in img) {
                  // @ts-ignore
                  img.decode().then(doPrint).catch(doPrint);
                } else if (img) {
                  img.onload = doPrint;
                  img.onerror = doPrint;
                } else {
                  doPrint();
                }
              })();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare print preview',
        variant: 'destructive',
      });
    }
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
    console.log('Starting certificate email send...');

    toast({
      title: "Preparing certificate",
      description: "Generating your PDF and sending the email. This may take a few seconds...",
    });
    
    try {
      // Generate PDF for attachment
      console.log('Finding certificate element...');
      const exportEl = document.getElementById('certificate-export');
      if (!exportEl) {
        console.error('Certificate element not found');
        throw new Error('Certificate element not found');
      }

      console.log('Generating PDF from certificate...');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const canvas = await html2canvas(exportEl as HTMLElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      console.log('Canvas generated, creating PDF...');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297;
      const imgHeight = 210;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      console.log('Converting PDF to base64...');
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      console.log('PDF generated, size:', pdfBase64.length, 'chars');
      
      console.log('Calling send-certificate function...');
      const { data, error } = await supabase.functions.invoke('send-certificate', {
        body: {
          name: userName,
          email: email,
          date: completionDate,
          registrationNumber: registrationNumber,
          pdfAttachment: pdfBase64,
        },
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);
      toast({
        title: "Success",
        description: `Certificate sent to ${email}`,
      });
      setEmail("");
    } catch (error: any) {
      console.error('Email send error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send certificate email",
        variant: "destructive",
      });
    } finally {
      console.log('Email send process completed, resetting state');
      setIsSending(false);
    }
  };

  // Show minimal UI when auto-downloading
  const isAutoDownload = searchParams.get('download') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 animate-spin text-primary mx-auto" />
          {isAutoDownload && <p className="text-lg">Preparing your certificate download...</p>}
        </div>
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
                  <p className="text-base font-mono font-normal leading-snug">{lastSixDigits}</p>
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
                courseType={courseType}
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
                courseType={courseType}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
