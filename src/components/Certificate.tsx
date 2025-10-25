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
    // Handle plain date strings (YYYY-MM-DD) without timezone shift
    const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/;
    let date: Date;
    if (isoDateMatch.test(dateString)) {
      const [y, m, d] = dateString.split('-').map(Number);
      date = new Date(y, (m || 1) - 1, d || 1);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return "MM/DD/YYYY";
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };
  // Format ID number (digits only, last 6)
  const formatIdNumber = () => {
    if (!lastSixDigits) return "";
    const digits = String(lastSixDigits).replace(/\D/g, "");
    return digits.slice(-6);
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
        <p className={`${exportMode ? 'text-[48px]' : 'text-[1.75rem]'} font-semibold text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-32px)' : 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{userName || "Student Name"}</p>
        <p className={`${exportMode ? 'text-[36px]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-32px)' : 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatIdNumber()}</p>
      </div>
      
      {/* Date of Completion */}
      <div className="absolute top-[50.7%] left-[53.4%]">
        <p className={`${exportMode ? 'text-[36px]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ letterSpacing: '0.02em', transform: exportMode ? 'translateY(-26px)' : 'translateY(-14px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatDate(courseCompletionDate)}</p>
      </div>
    </div>
  );
};

export default Certificate;
