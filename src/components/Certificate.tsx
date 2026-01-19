import level2CertificateTemplate from "@/assets/level2-certificate-template.jpg";
import pepperSprayCertificateTemplate from "@/assets/pepper-spray-certificate-template.jpg";
import instructorSignature from "@/assets/stephen-taylor-signature-transparent.png";

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

  // Format ID number (digits only)
  // - Level 2 TX DPS form asks for last 4
  // - Other certificates in the app use last 6
  const formatIdNumber = (digitsToShow: 4 | 6) => {
    if (!lastSixDigits) return "";
    const digits = String(lastSixDigits).replace(/\D/g, "");
    return digits.slice(-digitsToShow);
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
    <div
      id={certificateId || "certificate"}
      className={`${
        exportMode ? "w-[1275px] h-[1650px]" : "w-full max-w-3xl aspect-[8.5/11]"
      } mx-auto bg-white relative overflow-hidden`}
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <img
        src={templateSrc}
        alt="Texas DPS Level II certificate template"
        className="absolute inset-0 w-full h-full object-fill"
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
          {/* Last Name - below "Last Name" header in first column */}
          <div className="absolute" style={{ 
            top: exportMode ? '30.4%' : '30.4%', 
            left: exportMode ? '9%' : '9%',
            width: exportMode ? '34%' : '34%'
          }}>
            <p className={`${exportMode ? 'text-[22px]' : 'text-[0.85rem]'} font-normal text-foreground leading-none`}>
              {nameParts.lastName}
            </p>
          </div>
          
          {/* First Name - below "First Name" header in second column */}
          <div className="absolute" style={{ 
            top: exportMode ? '30.4%' : '30.4%', 
            left: exportMode ? '44%' : '44%',
            width: exportMode ? '30%' : '30%'
          }}>
            <p className={`${exportMode ? 'text-[22px]' : 'text-[0.85rem]'} font-normal text-foreground leading-none`}>
              {nameParts.firstName}
            </p>
          </div>
          
          {/* Middle Initial - below "Middle Initial" header in third column */}
          <div className="absolute" style={{ 
            top: exportMode ? '30.4%' : '30.4%', 
            left: exportMode ? '76%' : '76%',
            width: exportMode ? '25%' : '25%'
          }}>
            <p className={`${exportMode ? 'text-[22px]' : 'text-[0.85rem]'} font-normal text-foreground leading-none`}>
              {nameParts.middleInitial}
            </p>
          </div>
          
          {/* Last 4 digits - appears at end of the ID number line */}
          <div className="absolute" style={{ 
            top: exportMode ? '33%' : '33%', 
            left: exportMode ? '77%' : '77%'
          }}>
            <p className={`${exportMode ? 'text-[28px]' : 'text-[1rem]'} font-normal text-foreground leading-none`}>
              {formatIdNumber(4) || "1234"}
            </p>
          </div>
          
          {/* Business Name - below "Business Name" header */}
          <div className="absolute" style={{ 
            top: exportMode ? '43.5%' : '43.5%', 
            left: exportMode ? '9%' : '9%',
            width: exportMode ? '55%' : '55%'
          }}>
            <p className={`${exportMode ? 'text-[26px]' : 'text-[0.95rem]'} font-normal text-foreground leading-none`}>
              Kairos Security
            </p>
          </div>
          
          {/* Business License Number (School #) - below header on right */}
          <div className="absolute" style={{ 
            top: exportMode ? '43.5%' : '43.5%', 
            left: exportMode ? '64%' : '64%',
            width: exportMode ? '35%' : '35%'
          }}>
            <p className={`${exportMode ? 'text-[26px]' : 'text-[0.95rem]'} font-normal text-foreground leading-none`}>
              F28623301
            </p>
          </div>
          
          {/* Instructor Name - after "Instructor Name:" label */}
          <div className="absolute" style={{ 
            top: exportMode ? '46.0%' : '46.0%', 
            left: exportMode ? '25%' : '25%'
          }}>
            <p className={`${exportMode ? 'text-[22px]' : 'text-[0.85rem]'} font-normal text-foreground leading-none`}>
              Stephen Taylor
            </p>
          </div>
          
          {/* Business Representative Name - after label */}
          <div className="absolute" style={{ 
            top: exportMode ? '48.0%' : '48.0%', 
            left: exportMode ? '38%' : '38%'
          }}>
            <p className={`${exportMode ? 'text-[22px]' : 'text-[0.85rem]'} font-normal text-foreground leading-none`}>
              Stephen Taylor
            </p>
          </div>
          
          {/* Course Completion Date - after label */}
          <div className="absolute" style={{ 
            top: exportMode ? '50.0%' : '50.0%', 
            left: exportMode ? '30%' : '30%'
          }}>
            <p className={`${exportMode ? 'text-[22px]' : 'text-[0.85rem]'} font-normal text-foreground leading-none`}>
              {formatDate(courseCompletionDate)}
            </p>
          </div>
          
          {/* Online Training checkbox - X in the Yes box */}
          <div className="absolute" style={{ 
            top: exportMode ? '52.5%' : '52.5%', 
            left: exportMode ? '43%' : '43%'
          }}>
            <p className={`${exportMode ? 'text-[22px]' : 'text-[0.85rem]'} font-bold text-foreground leading-none`}>
              X
            </p>
          </div>
          
          {/* Instructor Signature - at the bottom signature line */}
          <div className="absolute" style={{ 
            top: exportMode ? '58%' : '58%', 
            left: exportMode ? '15%' : '15%'
          }}>
            <img 
              src={instructorSignature} 
              alt="Instructor Signature" 
              className={`${exportMode ? 'h-[60px]' : 'h-[30px]'} w-auto object-contain`}
            />
          </div>
        </>
      ) : (
        <>
          {/* Other course types - Original layout */}
          <div className="absolute top-[34%] left-0 right-0 flex items-baseline justify-center gap-12" style={{ letterSpacing: '0.03em' }}>
            <p className={`${exportMode ? 'text-[48px]' : 'text-[1.75rem]'} font-semibold text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-52px)' : 'translateY(-16px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{userName || "Student Name"}</p>
            <p className={`${exportMode ? 'text-[36px]' : 'text-[1.125rem]'} font-normal text-foreground leading-none`} style={{ transform: exportMode ? 'translateY(-68px)' : 'translateY(-20px)', textShadow: exportMode ? '0 0 1px rgba(0,0,0,0.1)' : 'none' }}>{formatIdNumber(6)}</p>
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
