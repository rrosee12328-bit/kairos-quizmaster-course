import certificateTemplate from "@/assets/certificate-template.png";
import pepperSprayCertificateTemplate from "@/assets/pepper-spray-certificate-template.jpg";

interface CertificateProps {
  userName?: string;
  registrationNumber?: string;
  courseCompletionDate?: string;
  idType?: string;
  lastSixDigits?: string;
  exportMode?: boolean;
  certificateId?: string;
  courseType?: string;
}

const Certificate = ({ userName, registrationNumber, courseCompletionDate, idType, lastSixDigits, exportMode, certificateId, courseType = 'level2' }: CertificateProps) => {
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

  const templateSrc = courseType === 'pepper-spray' ? pepperSprayCertificateTemplate : certificateTemplate;
  const isPepperSpray = courseType === 'pepper-spray';

  return (
      <div id={certificateId || "certificate"} className={`${exportMode ? "w-[1920px] h-[1080px]" : "w-full max-w-6xl"} mx-auto bg-white relative`}>
      <img 
        src={templateSrc} 
        alt="Security Training Certificate of Completion" 
        className="w-full h-full object-cover"
      />
      {isPepperSpray ? (
        <>
          {/* Pepper Spray Certificate - Name only centered */}
          <div className="absolute top-[35%] left-0 right-0 flex items-center justify-center" style={{ letterSpacing: '0.03em' }}>
            <p className={`${exportMode ? 'text-[48px]' : 'text-[1.75rem]'} font-semibold text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-10px)' : 'translateY(-5px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{userName || "Student Name"}</p>
          </div>
          
          {/* Date of Completion - lower left */}
          <div className="absolute top-[70%] left-[32%]">
            <p className={`${exportMode ? 'text-[32px]' : 'text-[1rem]'} font-normal text-foreground leading-none`} style={{ letterSpacing: '0.02em', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatDate(courseCompletionDate)}</p>
          </div>
        </>
      ) : (
        <>
          {/* Level 2 Certificate - Name and ID Number on same line */}
          <div className="absolute top-[34%] left-0 right-0 flex items-baseline justify-center gap-12" style={{ letterSpacing: '0.03em' }}>
            <p className={`${exportMode ? 'text-[48px]' : 'text-[1.75rem]'} font-semibold text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-52px)' : 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{userName || "Student Name"}</p>
            <p className={`${exportMode ? 'text-[36px]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-52px)' : 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatIdNumber()}</p>
          </div>
          
          {/* Date of Completion */}
          <div className="absolute top-[50.7%] left-[53.4%]">
            <p className={`${exportMode ? 'text-[36px]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ letterSpacing: '0.02em', transform: exportMode ? 'translateY(-46px)' : 'translateY(-14px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatDate(courseCompletionDate)}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Certificate;
