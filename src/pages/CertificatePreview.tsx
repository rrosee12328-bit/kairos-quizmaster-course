import { useState } from "react";
import Certificate from "@/components/Certificate";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CertificatePreview = () => {
  const [userName, setUserName] = useState("John Doe");
  const [registrationNumber, setRegistrationNumber] = useState("REG123456");
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);

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
