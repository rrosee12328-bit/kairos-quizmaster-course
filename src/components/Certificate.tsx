import certificateTemplate from "@/assets/certificate-template.png";

interface CertificateProps {
  userName?: string;
  registrationNumber?: string;
  courseCompletionDate?: string;
}

const Certificate = ({ userName, registrationNumber, courseCompletionDate }: CertificateProps) => {
  // Format date to MM/DD/YYYY
  const formatDate = (dateString?: string) => {
    if (!dateString) return "MM/DD/YYYY";
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  return (
    <div id="certificate" className="w-full max-w-6xl mx-auto bg-white relative">
      <img 
        src={certificateTemplate} 
        alt="Security Training Certificate of Completion" 
        className="w-full h-auto"
      />
      {/* Student Name - positioned on the black line */}
      <div className="absolute top-[32%] left-0 right-0 text-center">
        <p className="text-2xl font-bold text-foreground">{userName || "Student Name"}</p>
      </div>
      
      {/* Registration Number - positioned next to student name */}
      <div className="absolute top-[32.5%] left-[60%]">
        <p className="text-xl font-bold text-foreground">{registrationNumber || "123456"}</p>
      </div>
      
      {/* Date of Completion - positioned at date field */}
      <div className="absolute top-[48.3%] left-[57%]">
        <p className="text-base font-semibold text-foreground">{formatDate(courseCompletionDate)}</p>
      </div>
    </div>
  );
};

export default Certificate;
