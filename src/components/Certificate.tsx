import { Card, CardContent } from "@/components/ui/card";

interface CertificateProps {
  userName: string;
  registrationNumber: string;
  identificationType: string;
  lastSixDigits: string;
  schoolName: string;
  schoolApprovalNumber: string;
  classroomInstructor: string;
  classroomInstructorApprovalNumber: string;
  firearmInstructor: string;
  firearmInstructorApprovalNumber: string;
  schoolManager: string;
  courseCompletionDate: string;
  firearmQualificationDate: string;
  firearmCategory: string;
  firearmCaliber: string;
}

const Certificate = ({ 
  userName, 
  registrationNumber,
  identificationType,
  lastSixDigits,
  schoolName,
  schoolApprovalNumber,
  classroomInstructor,
  classroomInstructorApprovalNumber,
  firearmInstructor,
  firearmInstructorApprovalNumber,
  schoolManager,
  courseCompletionDate,
  firearmQualificationDate,
  firearmCategory,
  firearmCaliber
}: CertificateProps) => {
  return (
    <Card id="certificate" className="w-full max-w-4xl mx-auto bg-white p-8">
      <CardContent className="pt-8">
        <div className="border-[6px] border-black p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-1">LEVEL THREE</h1>
            <h2 className="text-2xl font-bold text-black">CERTIFICATE OF COMPLETION</h2>
          </div>

          {/* Name and ID Section */}
          <div className="mb-6">
            <div className="bg-blue-100 border-b-2 border-black px-4 py-3 mb-1">
              <p className="text-center text-black font-semibold">{userName || "____________________"}</p>
            </div>
            <p className="text-center text-xs text-black">Name</p>
          </div>

          {/* Registration Number */}
          <div className="mb-6">
            <div className="bg-blue-100 border-b-2 border-black px-4 py-2 mb-1">
              <p className="text-center text-black">{registrationNumber || "____________________"}</p>
            </div>
            <p className="text-center text-xs text-black">(Registration Number)</p>
          </div>

          {/* Identification - Last 6 digits */}
          <div className="mb-6">
            <div className="bg-blue-100 border-b-2 border-black px-4 py-2 mb-1">
              <p className="text-center text-black">{lastSixDigits || "____________________"}</p>
            </div>
            <p className="text-center text-xs text-black">
              ({identificationType === 'drivers_license' ? "Driver's License" : "Social Security"} - Last 6 digits)
            </p>
          </div>

          {/* Certification Text */}
          <div className="mb-8 text-center">
            <p className="text-sm text-black leading-relaxed">
              This certifies that the above-named individual has completed the Basic Security Officer<br />
              Training Course approved by the Private Security Program.
            </p>
          </div>

          {/* Two Column Section */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
            {/* Left Column */}
            <div>
              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{schoolName || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">School Name</p>

              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{classroomInstructor || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">Classroom Instructor</p>

              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{firearmInstructor || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">Firearm Instructor</p>

              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{schoolManager || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">School Manager</p>

              <div className="border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">____________________</p>
              </div>
              <p className="text-xs text-black mb-4">Classroom Instructor Signature</p>

              <div className="border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">____________________</p>
              </div>
              <p className="text-xs text-black mb-4">Firearm Instructor Signature</p>

              <div className="border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">____________________</p>
              </div>
              <p className="text-xs text-black">School Manager Signature</p>
            </div>

            {/* Right Column */}
            <div>
              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{schoolApprovalNumber || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">School Approval Number</p>

              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{classroomInstructorApprovalNumber || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">Classroom Instructor Approval Number</p>

              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{firearmInstructorApprovalNumber || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">Firearm Instructor Approval Number</p>

              <div className="bg-blue-100 border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{courseCompletionDate || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">Course Completion Date</p>

              <div className="border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{firearmQualificationDate || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">Firearm Qualification Date</p>

              <div className="border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{firearmCategory || "____________________"}</p>
              </div>
              <p className="text-xs text-black mb-4">Firearm Category</p>

              <div className="border-b-2 border-black px-3 py-2 mb-1">
                <p className="text-black text-sm">{firearmCaliber || "____________________"}</p>
              </div>
              <p className="text-xs text-black">Firearm Caliber</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-600">PSB-30</p>
            <p className="text-xs text-gray-600">Texas Department of Public Safety – Texas Private Security Board</p>
            <p className="text-xs text-gray-600">Rev. 01/13</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Certificate;
