import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, ShieldCheck, CreditCard, Award, AlertTriangle, Scale } from "lucide-react";
import { Footer } from "@/components/Footer";
import CourseHeader from "@/components/CourseHeader";
import { supabase } from "@/integrations/supabase/client";
import kairosLogo from "@/assets/kairos-logo.png";

const TermsOfService = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <CourseHeader isLoggedIn={!!user} />

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: January 2025
            </p>
          </div>

          {/* Introduction */}
          <Card>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-6">
              <p className="lead">
                Welcome to Kairos Security Academy. By accessing or using our online training platform, you agree to be 
                bound by these Terms of Service. Please read these terms carefully before enrolling in any course.
              </p>
            </CardContent>
          </Card>

          {/* Acceptance of Terms */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Scale className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By creating an account, enrolling in courses, or using our services, you agree to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Comply with all applicable federal, state, and local laws</li>
                    <li>Provide accurate and truthful information during enrollment</li>
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Enrollment & Access */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Course Enrollment & Access</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Enrollment Requirements</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>You must be at least 18 years old to enroll in security officer training</li>
                        <li>You must provide accurate personal information, including a valid government-issued ID</li>
                        <li>Some courses may have additional prerequisites or background check requirements</li>
                        <li>Enrollment is subject to approval and we reserve the right to refuse service</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Course Access</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Access to course materials is granted upon successful payment</li>
                        <li>Course access remains active for the duration specified at the time of purchase</li>
                        <li>You may access courses from any device with an internet connection</li>
                        <li>Course content is for personal use only and may not be shared or distributed</li>
                        <li>We reserve the right to revoke access for violations of these terms</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Level 3 Special Requirements</h3>
                      <p className="text-muted-foreground mb-2">
                        Level 3 Armed Security Officer Certification consists of two parts:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li><strong>Part 1 (Online):</strong> Upon passing, you will receive an approval code valid for 24 hours</li>
                        <li><strong>Part 2 (In-Person):</strong> You must complete firearms and tactical training at our facility</li>
                        <li>The approval code expires 24 hours after issuance and cannot be extended</li>
                        <li>Failure to complete Part 2 within the approval period requires retaking Part 1</li>
                        <li>Certificates are only issued upon completion of both parts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Examination & Certification */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Examination & Certification</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Exam Requirements</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>You must complete all course modules before accessing the final exam</li>
                        <li>A passing score of <strong>70% or higher</strong> is required for Level 3 certification</li>
                        <li>A passing score of <strong>75% or higher</strong> is required for Level 2 certification</li>
                        <li>You may retake exams as many times as needed at no additional cost</li>
                        <li>Each exam attempt is independent and does not affect previous scores</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Academic Integrity</h3>
                      <p className="text-muted-foreground mb-2">
                        You agree to complete all coursework and examinations honestly and independently:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Exams must be completed by you personally without assistance</li>
                        <li>Use of unauthorized materials or resources during exams is prohibited</li>
                        <li>Sharing exam questions or answers is strictly forbidden</li>
                        <li>Violations may result in exam invalidation, account suspension, or legal action</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Certificate Issuance</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Certificates are issued upon successful completion of all course requirements</li>
                        <li>Certificates include a unique registration number for verification</li>
                        <li>Digital certificates are emailed and available for download in your profile</li>
                        <li>Certificates cannot be altered or tampered with after issuance</li>
                        <li>We maintain permanent records of all issued certificates</li>
                        <li>Replacement certificates may be requested for a fee</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Certificate Validity</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Certificates are valid according to state licensing requirements</li>
                        <li>You are responsible for renewing certifications as required by law</li>
                        <li>We may revoke certificates for fraud, misrepresentation, or policy violations</li>
                        <li>Kairos Security Academy is licensed under License #: F28623301</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Refunds */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Payment & Refund Policy</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Payment Terms</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>All payments are processed securely through Stripe</li>
                        <li>Course fees must be paid in full before accessing course materials</li>
                        <li>Prices are listed in USD and are subject to change without notice</li>
                        <li>You are responsible for any taxes or fees imposed by your jurisdiction</li>
                        <li>Payment constitutes acceptance of these Terms of Service</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-2 border-amber-500">
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Refund Policy
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        We offer a <strong>7-day money-back guarantee</strong> under the following conditions:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Refund requests must be submitted within 7 days of enrollment</li>
                        <li>You must not have completed more than 25% of the course content</li>
                        <li>You must not have taken the final exam</li>
                        <li>Refunds are not available after certificates have been issued</li>
                        <li>Level 3 approval codes cannot be refunded once generated</li>
                        <li>Processing fees may be deducted from refund amounts</li>
                      </ul>
                      <p className="text-muted-foreground mt-2">
                        To request a refund, contact us at <a href="mailto:info@kairossecurityacademy.com" className="text-primary hover:underline">info@kairossecurityacademy.com</a>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">No Refunds After Completion</h3>
                      <p className="text-muted-foreground">
                        Once you have completed a course, passed the exam, or received a certificate or approval code, 
                        <strong> no refunds will be issued</strong>. This policy ensures the integrity of our certification program.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Intellectual Property Rights</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  All course materials, including videos, documents, quizzes, and website content, are the intellectual 
                  property of Kairos Security Academy and are protected by copyright laws.
                </p>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Restrictions</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>You may not copy, reproduce, distribute, or share course materials</li>
                    <li>You may not record, screenshot, or save course videos</li>
                    <li>You may not use course content for commercial purposes</li>
                    <li>You may not modify or create derivative works from our content</li>
                    <li>Violations may result in legal action and civil penalties</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Permitted Use</h3>
                  <p className="text-muted-foreground">
                    You may access and view course materials for personal educational purposes only. You may download 
                    your certificate for professional use and verification purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Conduct */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">User Conduct & Prohibited Activities</h2>
              <p className="text-muted-foreground">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Providing false or misleading information during enrollment</li>
                <li>Using another person's account or credentials</li>
                <li>Attempting to access restricted areas of the platform</li>
                <li>Interfering with platform security or attempting to breach data protections</li>
                <li>Uploading malware, viruses, or harmful code</li>
                <li>Harassing, threatening, or abusing other users or staff</li>
                <li>Using the platform for any unlawful purpose</li>
                <li>Attempting to reverse-engineer or tamper with platform functionality</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Violations may result in immediate account termination and legal prosecution.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Disclaimers & Limitations of Liability</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Service Availability</h3>
                  <p className="text-muted-foreground">
                    We strive to provide uninterrupted access to our platform, but we do not guarantee 100% uptime. 
                    We are not liable for service interruptions due to maintenance, technical issues, or circumstances 
                    beyond our control.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Employment Disclaimer</h3>
                  <p className="text-muted-foreground">
                    Completion of our courses and receipt of certification does not guarantee employment as a security 
                    officer. Hiring decisions are made solely by employers, and additional requirements may apply based 
                    on jurisdiction and employer policies.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Accuracy of Information</h3>
                  <p className="text-muted-foreground">
                    While we make every effort to ensure course content is accurate and up-to-date, laws and regulations 
                    may change. You are responsible for verifying current legal requirements in your jurisdiction.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
                  <p className="text-muted-foreground">
                    To the fullest extent permitted by law, Kairos Security Academy shall not be liable for any indirect, 
                    incidental, consequential, or punitive damages arising from your use of our services. Our total liability 
                    shall not exceed the amount you paid for the course in question.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Termination */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Account Termination</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2">By You</h3>
                  <p className="text-muted-foreground">
                    You may close your account at any time by contacting support. Account closure does not entitle you 
                    to a refund. Certificate records will be retained permanently for verification purposes.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">By Us</h3>
                  <p className="text-muted-foreground">
                    We reserve the right to suspend or terminate your account at our discretion for violations of these 
                    terms, fraudulent activity, or other misconduct. No refunds will be issued for terminated accounts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Changes to These Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms of Service from time to time. We will notify you of significant changes by 
                email or by posting a notice on our platform. Your continued use of our services after such changes 
                constitutes acceptance of the updated terms.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Governing Law & Dispute Resolution</h2>
              <p className="text-muted-foreground">
                These Terms of Service shall be governed by and construed in accordance with the laws of the state 
                in which Kairos Security Academy operates, without regard to conflict of law principles. Any disputes 
                arising from these terms or your use of our services shall be resolved through binding arbitration in 
                accordance with the rules of the American Arbitration Association.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Kairos Security Academy</strong></p>
                <p>Email: <a href="mailto:info@kairossecurityacademy.com" className="text-primary hover:underline">info@kairossecurityacademy.com</a></p>
                <p className="text-sm">License #: F28623301</p>
              </div>
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <Card className="bg-muted">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Acknowledgment</h2>
              <p className="text-muted-foreground">
                By using Kairos Security Academy, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must 
                not use our services.
              </p>
            </CardContent>
          </Card>

          {/* Back to Top */}
          <div className="text-center pt-8">
            <Link to="/">
              <Button size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
