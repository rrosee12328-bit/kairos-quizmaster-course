import { Card, CardContent } from "@/components/ui/card";
import signatureImage from "@/assets/stephen-taylor-signature.png";

interface CertificateProps {
  userName?: string;
  registrationNumber?: string;
  courseCompletionDate?: string;
}

const Certificate = ({ 
  userName = "TBD", 
  registrationNumber = "TBD",
  courseCompletionDate = "TBD"
}: CertificateProps) => {
  return (
    <Card id="certificate" className="w-full max-w-4xl mx-auto bg-white p-8">
      <CardContent className="pt-8">
        <div className="border-[8px] border-academy-red p-12 relative">
          {/* Inner border */}
          <div className="border-4 border-academy-red p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-academy-red mb-4">Kairos Security Academy</h1>
              <h2 className="text-2xl font-bold text-black mb-2">Private Security Program</h2>
              <h3 className="text-xl font-bold text-black mb-2">Certificate of Completion</h3>
              <h4 className="text-lg font-bold text-black">Level Two Training Course</h4>
            </div>

            {/* Main Text */}
            <div className="mb-8 text-center">
              <p className="text-base text-black font-semibold mb-6">
                This certificate is issued as proof that
              </p>
            </div>

            {/* Student Name Field */}
            <div className="mb-6">
              <div className="border-b-2 border-black px-4 py-3 min-h-[40px] flex items-center justify-center">
                <p className="text-center text-black font-medium">{userName}</p>
              </div>
              <p className="text-center text-xs text-black mt-1">
                (Please print or type name and Registration Number or social security number (last 6 digits) of student)
              </p>
            </div>

            {/* Certification Statement */}
            <div className="mb-8 text-center">
              <p className="text-sm text-black leading-relaxed">
                has successfully completed the Board approved, PSP Level Two Training Course<br />
                to meet the standards and requirements set forth in Texas Occupations Code,<br />
                Section 1702, Title 10 and Administrative Rules.
              </p>
            </div>

            {/* School Information */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-start">
                  <p className="text-sm text-black font-semibold min-w-[280px]">School or Company Name:</p>
                  <div className="flex-1 border-b-2 border-black px-2 pb-1">
                    <p className="text-sm text-black">Kairos Security</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start">
                  <p className="text-sm text-black font-semibold min-w-[280px]">School Approval or Company License Number:</p>
                  <div className="flex-1 border-b-2 border-black px-2 pb-1">
                    <p className="text-sm text-black">F28623301</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start">
                  <p className="text-sm text-black font-semibold min-w-[280px]">Date of Completion:</p>
                  <div className="flex-1 border-b-2 border-black px-2 pb-1">
                    <p className="text-sm text-black">{courseCompletionDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor & Manager */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-start">
                  <p className="text-sm text-black font-semibold min-w-[280px]">Name of Instructor:</p>
                  <div className="flex-1 border-b-2 border-black px-2 pb-1">
                    <p className="text-sm text-black">Stephen Taylor</p>
                  </div>
                </div>
                <p className="text-xs text-black ml-[280px] mt-1">(Please print or type)</p>
              </div>

              <div>
                <div className="flex items-start">
                  <p className="text-sm text-black font-semibold min-w-[280px]">Name of Qualified Manager:</p>
                  <div className="flex-1 border-b-2 border-black px-2 pb-1">
                    <p className="text-sm text-black">Stephen Taylor</p>
                  </div>
                </div>
                <p className="text-xs text-black ml-[280px] mt-1">(Please print or type)</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="space-y-4 mb-8">
              <div>
                <div className="flex items-start">
                  <p className="text-sm text-black font-semibold min-w-[280px]">Signature of Instructor:</p>
                  <div className="flex-1 border-b-2 border-black px-2 pb-1 min-h-[80px] flex items-end">
                    <img src={signatureImage} alt="Stephen Taylor Signature" className="w-[70%] h-auto object-contain" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start">
                  <p className="text-sm text-black font-semibold min-w-[280px]">Signature of Qualified Manager:</p>
                  <div className="flex-1 border-b-2 border-black px-2 pb-1 min-h-[80px] flex items-end">
                    <img src={signatureImage} alt="Stephen Taylor Signature" className="w-[70%] h-auto object-contain" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-black">
              <p className="text-xs text-black">PSB-36</p>
              <p className="text-xs text-black">Texas Department of Public Safety – Texas Private Security Board</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Certificate;
