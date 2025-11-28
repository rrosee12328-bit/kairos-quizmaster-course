import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { useTracking } from "./hooks/useTracking";
import { useVersionCheck } from "./hooks/useVersionCheck";
import Landing from "./pages/Landing";
import Courses from "./pages/Courses";
import CourseCheckout from "./pages/CourseCheckout";
import Level2Course from "./pages/Level2Course";
import Level3Course from "./pages/Level3Course";
import Level4Course from "./pages/Level4Course";
import PepperSprayCourse from "./pages/PepperSprayCourse";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import VideoMetadata from "./pages/VideoMetadata";
import Admin from "./pages/Admin";
import CertificatePreview from "./pages/CertificatePreview";
import GenerateCertificate from "./pages/GenerateCertificate";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import BetaFeedback from "./pages/BetaFeedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const TrackingWrapper = () => {
  useTracking();
  useVersionCheck();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TrackingWrapper />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/checkout/:courseType" element={<CourseCheckout />} />
          <Route path="/course/level2" element={<Level2Course />} />
          <Route path="/course/level3" element={<Level3Course />} />
          <Route path="/course/level4" element={<Level4Course />} />
          <Route path="/course/pepper-spray" element={<PepperSprayCourse />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/video-metadata" element={<VideoMetadata />} />
          <Route path="/certificate-preview" element={<CertificatePreview />} />
          <Route path="/generate-certificate" element={<GenerateCertificate />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/beta-feedback" element={<BetaFeedback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
