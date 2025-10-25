import certificateTemplate from "@/assets/certificate-template.png";

interface CertificateProps {
  userName?: string;
  registrationNumber?: string;
  courseCompletionDate?: string;
  idType?: string;
  lastSixDigits?: string;
  exportMode?: boolean;
  certificateId?: string;
}

const Certificate = ({ userName, registrationNumber, courseCompletionDate, idType, lastSixDigits, exportMode, certificateId }: CertificateProps) => {
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
      <div id={certificateId || "certificate"} className={`${exportMode ? "w-[1920px] h-[1080px]" : "w-full max-w-6xl"} mx-auto bg-white relative`}>
      <img 
        src={certificateTemplate} 
        alt="Security Training Certificate of Completion" 
        className="w-full h-full object-cover"
      />
      {/* Student Name and ID Number - on the same line */}
      <div className="absolute top-[34%] left-0 right-0 flex items-baseline justify-center gap-12" style={{ letterSpacing: '0.03em' }}>
        <p className={`${exportMode ? 'text-[26pt]' : 'text-[1.75rem]'} font-semibold text-foreground leading-none`} style={{ transform: 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{userName || "Student Name"}</p>
        <p className={`${exportMode ? 'text-[20pt]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ transform: 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatIdNumber()}</p>
      </div>
      
      {/* Date of Completion */}
      <div className="absolute top-[50.7%] left-[61.8%]">
        <p className={`${exportMode ? 'text-[20pt]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ letterSpacing: '0.02em', transform: 'translateY(-14px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatDate(courseCompletionDate)}</p>
      </div>
    </div>
  );
};

export default Certificate;
