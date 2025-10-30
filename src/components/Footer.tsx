import { Link } from "react-router-dom";
import kairosLogo from "@/assets/kairos-logo.png";

export const Footer = () => {
  return (
    <footer className="border-t py-12 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 text-center md:text-left">
          <div>
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <img src={kairosLogo} alt="Kairos Security Academy" className="h-8 w-8" />
              <h4 className="font-bold">Kairos Security Academy</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Training security professionals with expertise, innovation, and a passion for excellence.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div><Link to="/courses" className="hover:text-primary transition-colors">Courses</Link></div>
              <div><Link to="/auth" className="hover:text-primary transition-colors">Sign In</Link></div>
              <div><Link to="/admin" className="hover:text-primary transition-colors">Admin</Link></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></div>
              <div><Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <p className="text-sm text-muted-foreground">
              Questions? We're here to help.
            </p>
            <a 
              href="mailto:info@kairossecurityacademy.com" 
              className="text-sm text-primary hover:underline"
            >
              info@kairossecurityacademy.com
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2025 Kairos Security Academy. All Rights Reserved. License #: F28623301
        </div>
      </div>
    </footer>
  );
};
