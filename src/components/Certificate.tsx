import certificateTemplate from "@/assets/certificate-template.png";

interface CertificateProps {
  userName?: string;
  registrationNumber?: string;
  courseCompletionDate?: string;
}

const Certificate = ({ userName, registrationNumber, courseCompletionDate }: CertificateProps) => {
  return (
    <div id="certificate" className="w-full max-w-6xl mx-auto bg-white relative">
      <img 
        src={certificateTemplate} 
        alt="Security Training Certificate of Completion" 
        className="w-full h-auto"
      />
      {/* Student Name - positioned at top blank space */}
      <div className="absolute top-[28%] left-0 right-0 text-center">
        <p className="text-3xl font-serif text-foreground">{userName || "Student Name"}</p>
      </div>
      
      {/* Registration Number - positioned on same line as "student pass and receive their certificates" */}
      <div className="absolute top-[52%] left-[50%] translate-x-[-50%]">
        <p className="text-lg font-serif text-foreground">{registrationNumber || "Registration Number"}</p>
      </div>
      
      {/* Date of Completion - positioned at date completion space */}
      <div className="absolute bottom-[18%] left-[25%]">
        <p className="text-lg font-serif text-foreground">{courseCompletionDate || "MM/DD/YYYY"}</p>
      </div>
    </div>
  );
};

export default Certificate;
