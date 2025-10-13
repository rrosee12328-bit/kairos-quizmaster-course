import { useState } from "react";
import Certificate from "@/components/Certificate";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Printer, Mail } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import "../components/CertificatePrintStyles.css";

const CertificatePreview = () => {
  const { toast } = useToast();
  const [userName, setUserName] = useState("John Doe");
  const [registrationNumber, setRegistrationNumber] = useState("REG123456");
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [email, setEmail] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const downloadCertificate = async () => {
    setIsDownloading(true);
    try {
      const certificateElement = document.getElementById('certificate');
      if (!certificateElement) {
        throw new Error('Certificate element not found');
      }

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8">
      <div className="container mx-auto px-6">
        <div className="mb-6">
          <BackButton fallbackPath="/courses" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">Certificate Preview</h1>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit Certificate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userName">Student Name</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <Label htmlFor="regNumber">Registration Number</Label>
                <Input
                  id="regNumber"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Enter registration number"
                />
              </div>
              <div>
                <Label htmlFor="completionDate">Completion Date</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => {
                  setUserName("TBD");
                  setRegistrationNumber("TBD");
                  setCompletionDate("TBD");
                }}
                variant="outline"
                className="w-full"
              >
                Reset to TBD
              </Button>

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

          <div className="lg:col-span-1">
            <Certificate
              userName={userName}
              registrationNumber={registrationNumber}
              courseCompletionDate={completionDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
