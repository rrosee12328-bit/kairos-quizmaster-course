import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, UserCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import kairosLogo from "@/assets/kairos-logo.png";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={kairosLogo} alt="Kairos Security Academy" className="h-10 w-10" />
            <span className="font-bold text-xl">Kairos Security Academy</span>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: January 2025
            </p>
          </div>

          {/* Introduction */}
          <Card>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-6">
              <p className="lead">
                At Kairos Security Academy, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our online training platform and services.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Information We Collect</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                      <p className="text-muted-foreground">
                        When you enroll in our courses, we collect:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Full name (first and last name)</li>
                        <li>Email address</li>
                        <li>Phone number</li>
                        <li>Physical address (city, state, zip code)</li>
                        <li>Last 6 digits of government-issued ID (for certificate verification)</li>
                        <li>ID type (driver's license, state ID, passport, etc.)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Course Data</h3>
                      <p className="text-muted-foreground">
                        We track your progress through our training programs:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Course enrollment dates and status</li>
                        <li>Video completion progress</li>
                        <li>Quiz and exam scores</li>
                        <li>Certificate issuance records</li>
                        <li>Level 3 approval codes and expiration dates</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
                      <p className="text-muted-foreground">
                        Payment processing is handled securely through Stripe. We do not store your full credit card 
                        information on our servers. Stripe collects and processes payment data according to their 
                        privacy policy.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Technical Data</h3>
                      <p className="text-muted-foreground">
                        We automatically collect certain information about your device and usage:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>IP address and location data</li>
                        <li>Browser type and version</li>
                        <li>Device information</li>
                        <li>Login timestamps and activity logs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Eye className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">How We Use Your Information</h2>
                  
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      We use the information we collect for the following purposes:
                    </p>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Course Delivery & Administration</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Providing access to training courses and materials</li>
                        <li>Tracking course progress and completion</li>
                        <li>Grading exams and issuing certificates</li>
                        <li>Generating Level 3 approval codes for in-person training</li>
                        <li>Sending course completion notifications</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Communication</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Enrollment confirmations and receipts</li>
                        <li>Course updates and important announcements</li>
                        <li>Certificate delivery and download links</li>
                        <li>Responding to support inquiries</li>
                        <li>Administrative notifications to instructors</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Compliance & Legal</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Meeting state licensing requirements for security officer training</li>
                        <li>Maintaining accurate certification records</li>
                        <li>Verifying student identities for certificate issuance</li>
                        <li>Complying with law enforcement requests when legally required</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Platform Improvement</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li>Analyzing usage patterns to improve course content</li>
                        <li>Troubleshooting technical issues</li>
                        <li>Enhancing user experience and platform functionality</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Data Security</h2>
                  
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures to protect your personal information:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li><strong>Encryption:</strong> All data transmitted between your browser and our servers is encrypted using SSL/TLS</li>
                    <li><strong>Secure Storage:</strong> Data is stored in secure, encrypted databases with restricted access</li>
                    <li><strong>Row-Level Security:</strong> Database policies ensure users can only access their own records</li>
                    <li><strong>Payment Security:</strong> Payment processing through PCI-compliant Stripe infrastructure</li>
                    <li><strong>Access Controls:</strong> Administrative access is limited to authorized personnel only</li>
                    <li><strong>Regular Audits:</strong> We conduct security reviews and updates regularly</li>
                  </ul>

                  <p className="text-muted-foreground text-sm">
                    While we implement strong security measures, no system is 100% secure. We cannot guarantee absolute security 
                    but are committed to protecting your data to the best of our ability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <UserCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Data Sharing & Disclosure</h2>
                  
                  <p className="text-muted-foreground">
                    We do not sell, rent, or trade your personal information. We may share your data only in these circumstances:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Service Providers:</strong> We use trusted third-party services for hosting (Supabase), 
                    email delivery (Resend), and payment processing (Stripe). These providers have access only to data 
                    necessary to perform their functions.</li>
                    <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, 
                    or to protect the rights and safety of our users and staff.</li>
                    <li><strong>Licensing Authorities:</strong> We may provide certification records to state licensing 
                    boards upon request to verify security officer training credentials.</li>
                    <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, 
                    your information may be transferred to the new entity.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="text-2xl font-bold">Your Privacy Rights</h2>
                  
                  <p className="text-muted-foreground">
                    You have the following rights regarding your personal information:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Access:</strong> You can view your personal information in your profile at any time</li>
                    <li><strong>Update:</strong> You can update your contact information through your account settings</li>
                    <li><strong>Download:</strong> You can download your certificates and course completion records</li>
                    <li><strong>Delete:</strong> You can request account deletion by contacting support (note: we may retain 
                    certain records for legal and compliance purposes)</li>
                    <li><strong>Opt-Out:</strong> You can unsubscribe from marketing emails, but will still receive 
                    transactional emails related to your courses</li>
                  </ul>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-2">GDPR Compliance (EU Users)</p>
                    <p className="text-sm text-muted-foreground">
                      If you are located in the European Economic Area (EEA), you have additional rights under GDPR, 
                      including the right to data portability, the right to restrict processing, and the right to object 
                      to processing. To exercise these rights, contact us at the information below.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Account Data:</strong> Retained while your account is active and for 7 years after closure</li>
                <li><strong>Certificate Records:</strong> Retained permanently for verification and compliance purposes</li>
                <li><strong>Payment Records:</strong> Retained for 7 years for tax and accounting purposes</li>
                <li><strong>Course Progress:</strong> Retained indefinitely to maintain historical academic records</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Cookies & Tracking</h2>
              <p className="text-muted-foreground">
                We use essential cookies to maintain your login session and remember your preferences. We do not use 
                third-party advertising or tracking cookies. You can disable cookies in your browser settings, but this 
                may affect your ability to use certain features of our platform.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are intended for individuals 18 years of age or older. We do not knowingly collect 
                information from individuals under 18. If we become aware that we have collected data from someone 
                under 18, we will delete that information promptly.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                We will notify you of significant changes by email or by posting a notice on our website. Your continued use 
                of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Kairos Security Academy</strong></p>
                <p>Email: <a href="mailto:info@kairossecurityacademy.com" className="text-primary hover:underline">info@kairossecurityacademy.com</a></p>
                <p className="text-sm">License #: F28623301</p>
              </div>
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

export default PrivacyPolicy;
