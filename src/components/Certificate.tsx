import level2CertificateTemplate from "@/assets/level2-certificate-template.jpg";
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
    if (!dateString) return "";
    // Handle plain date strings (YYYY-MM-DD) without timezone shift
    const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/;
    let date: Date;
    if (isoDateMatch.test(dateString)) {
      const [y, m, d] = dateString.split('-').map(Number);
      date = new Date(y, (m || 1) - 1, d || 1);
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return "";
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Format ID number (digits only, last 4 for Level 2 per TX DPS form)
  const formatIdNumber = () => {
    if (!lastSixDigits) return "";
    const digits = String(lastSixDigits).replace(/\D/g, "");
    return digits.slice(-4); // TX DPS requires last 4 digits
  };

  // Split name into parts for Level 2 certificate
  const splitName = () => {
    if (!userName) return { lastName: "", firstName: "", middleInitial: "" };
    const parts = userName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { lastName: parts[0], firstName: "", middleInitial: "" };
    } else if (parts.length === 2) {
      return { lastName: parts[1], firstName: parts[0], middleInitial: "" };
    } else {
      // First name, middle names, last name
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      const middleInitial = parts[1]?.charAt(0) || "";
      return { lastName, firstName, middleInitial };
    }
  };

  const templateSrc = courseType === 'pepper-spray' ? pepperSprayCertificateTemplate : level2CertificateTemplate;
  const isPepperSpray = courseType === 'pepper-spray';
  const isLevel2 = courseType === 'level2';

  const nameParts = splitName();

  return (
    <div id={certificateId || "certificate"} className={`${exportMode ? "w-[1275px] h-[1650px]" : "w-full max-w-3xl"} mx-auto bg-white relative`} style={{ fontFamily: 'Arial, sans-serif' }}>
      <img 
        src={templateSrc} 
        alt="Security Training Certificate of Completion" 
        className="w-full h-full object-contain"
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
      ) : isLevel2 ? (
        <>
          {/* Level 2 TX DPS Certificate - Student Information fields */}
          {/* Last Name field */}
          <div className="absolute" style={{ 
            top: exportMode ? '36.8%' : '36.8%', 
            left: exportMode ? '7%' : '7%',
            width: exportMode ? '28%' : '28%'
          }}>
            <p className={`${exportMode ? 'text-[24px]' : 'text-[0.9rem]'} font-normal text-foreground leading-none text-center`}>
              {nameParts.lastName}
            </p>
          </div>
          
          {/* First Name field */}
          <div className="absolute" style={{ 
            top: exportMode ? '36.8%' : '36.8%', 
            left: exportMode ? '38%' : '38%',
            width: exportMode ? '28%' : '28%'
          }}>
            <p className={`${exportMode ? 'text-[24px]' : 'text-[0.9rem]'} font-normal text-foreground leading-none text-center`}>
              {nameParts.firstName}
            </p>
          </div>
          
          {/* Middle Initial field */}
          <div className="absolute" style={{ 
            top: exportMode ? '36.8%' : '36.8%', 
            left: exportMode ? '69%' : '69%',
            width: exportMode ? '24%' : '24%'
          }}>
            <p className={`${exportMode ? 'text-[24px]' : 'text-[0.9rem]'} font-normal text-foreground leading-none text-center`}>
              {nameParts.middleInitial}
            </p>
          </div>
          
          {/* Last 4 digits of SSN/DL/ID field */}
          <div className="absolute" style={{ 
            top: exportMode ? '43%' : '43%', 
            left: exportMode ? '7%' : '7%',
            width: exportMode ? '86%' : '86%'
          }}>
            <p className={`${exportMode ? 'text-[20px]' : 'text-[0.8rem]'} font-normal text-foreground leading-none`}>
              {formatIdNumber()}
            </p>
          </div>
          
          {/* Business Name field - Kairos Training Academy LLC */}
          <div className="absolute" style={{ 
            top: exportMode ? '52%' : '52%', 
            left: exportMode ? '7%' : '7%',
            width: exportMode ? '52%' : '52%'
          }}>
            <p className={`${exportMode ? 'text-[20px]' : 'text-[0.75rem]'} font-normal text-foreground leading-none text-center`}>
              Kairos Training Academy LLC
            </p>
          </div>
          
          {/* Business License Number field */}
          <div className="absolute" style={{ 
            top: exportMode ? '52%' : '52%', 
            left: exportMode ? '62%' : '62%',
            width: exportMode ? '31%' : '31%'
          }}>
            <p className={`${exportMode ? 'text-[20px]' : 'text-[0.75rem]'} font-normal text-foreground leading-none text-center`}>
              C18953-01
            </p>
          </div>
          
          {/* Instructor Name field */}
          <div className="absolute" style={{ 
            top: exportMode ? '57.5%' : '57.5%', 
            left: exportMode ? '26%' : '26%',
            width: exportMode ? '50%' : '50%'
          }}>
            <p className={`${exportMode ? 'text-[20px]' : 'text-[0.75rem]'} font-normal text-foreground leading-none`}>
              Stephen Taylor
            </p>
          </div>
          
          {/* Business Representative Name field */}
          <div className="absolute" style={{ 
            top: exportMode ? '61.2%' : '61.2%', 
            left: exportMode ? '44%' : '44%',
            width: exportMode ? '49%' : '49%'
          }}>
            <p className={`${exportMode ? 'text-[20px]' : 'text-[0.75rem]'} font-normal text-foreground leading-none`}>
              Stephen Taylor
            </p>
          </div>
          
          {/* Course Completion Date field */}
          <div className="absolute" style={{ 
            top: exportMode ? '65%' : '65%', 
            left: exportMode ? '36%' : '36%',
            width: exportMode ? '30%' : '30%'
          }}>
            <p className={`${exportMode ? 'text-[20px]' : 'text-[0.75rem]'} font-normal text-foreground leading-none`}>
              {formatDate(courseCompletionDate)}
            </p>
          </div>
          
          {/* Online Training checkbox - Yes is checked */}
          <div className="absolute" style={{ 
            top: exportMode ? '68.7%' : '68.7%', 
            left: exportMode ? '52.5%' : '52.5%'
          }}>
            <p className={`${exportMode ? 'text-[24px]' : 'text-[0.9rem]'} font-bold text-foreground leading-none`}>
              ✓
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Other course types - Original layout */}
          <div className="absolute top-[34%] left-0 right-0 flex items-baseline justify-center gap-12" style={{ letterSpacing: '0.03em' }}>
            <p className={`${exportMode ? 'text-[48px]' : 'text-[1.75rem]'} font-semibold text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-52px)' : 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{userName || "Student Name"}</p>
            <p className={`${exportMode ? 'text-[36px]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-68px)' : 'translateY(-20px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatIdNumber()}</p>
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
