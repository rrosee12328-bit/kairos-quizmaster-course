import certificateTemplate from "@/assets/certificate-template.png";

interface CertificateProps {
  userName?: string;
  registrationNumber?: string;
  courseCompletionDate?: string;
}

const Certificate = ({ userName, registrationNumber, courseCompletionDate }: CertificateProps) => {
  return (
    <div id="certificate" className="w-full max-w-6xl mx-auto bg-white">
      <img 
        src={certificateTemplate} 
        alt="Security Training Certificate of Completion" 
        className="w-full h-auto"
      />
    </div>
  );
};

export default Certificate;
