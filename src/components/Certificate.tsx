import certificateTemplate from "@/assets/certificate-template.png";

interface CertificateProps {
  userName?: string;
  registrationNumber?: string;
  courseCompletionDate?: string;
  idType?: string;
  lastSixDigits?: string;
}

const Certificate = ({ userName, registrationNumber, courseCompletionDate, idType, lastSixDigits }: CertificateProps) => {
  // Format date to MM/DD/YYYY
  const formatDate = (dateString?: string) => {
    if (!dateString) return "MM/DD/YYYY";
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Format ID number
  const formatIdNumber = () => {
    if (!lastSixDigits) return "";
    if (idType === 'SSN' || idType === 'ssn') {
      return `***-**-${lastSixDigits}`;
    }
    return lastSixDigits;
  };

  return (
    <div id="certificate" className="w-full max-w-6xl mx-auto bg-white relative">
      <img 
        src={certificateTemplate} 
        alt="Security Training Certificate of Completion" 
        className="w-full h-auto"
      />
      {/* Student Name and ID Number - on the same line */}
      <div className="absolute top-[32%] left-0 right-0 flex items-center justify-center gap-8">
        <p className="text-2xl font-bold text-foreground">{userName || "Student Name"}</p>
        <p className="text-xl font-semibold text-foreground">{formatIdNumber()}</p>
      </div>
      
      {/* Date of Completion */}
      <div className="absolute top-[48.3%] left-[57%]">
        <p className="text-base font-semibold text-foreground">{formatDate(courseCompletionDate)}</p>
      </div>
    </div>
  );
};

export default Certificate;
