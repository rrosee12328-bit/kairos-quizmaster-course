import { Card, CardContent } from "@/components/ui/card";

interface CertificateProps {
  userName: string;
  date: string;
}

const Certificate = ({ userName, date }: CertificateProps) => {
  return (
    <Card id="certificate" className="w-full max-w-4xl mx-auto bg-white text-black p-8">
      <CardContent className="space-y-8 pt-8">
        <div className="text-center border-8 border-double border-primary p-12 space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif font-bold text-primary">
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="w-32 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="space-y-4 py-8">
            <p className="text-lg">This is to certify that</p>
            <p className="text-4xl font-serif font-bold text-primary my-4">
              {userName}
            </p>
            <p className="text-lg">has successfully completed the</p>
            <p className="text-2xl font-semibold text-primary my-2">
              Level 3 Security Officer Certification Course
            </p>
            <p className="text-lg">and passed the final examination</p>
          </div>

          <div className="flex justify-between items-end pt-8">
            <div className="text-left">
              <p className="text-sm text-gray-600">Date of Completion</p>
              <p className="font-semibold border-t-2 border-black pt-1">{date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Authorized Signature</p>
              <p className="font-serif text-2xl border-t-2 border-black pt-1">Kairos Training</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Certificate;
