import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Download, ExternalLink, AlertTriangle } from "lucide-react";

type CourseType = "level2" | "level3" | "level4" | "level-4" | "pepper-spray";

const TOPS_URL = "https://www.dps.texas.gov/section/private-security/tops";
const IDENTOGO_URL = "https://www.identogo.com";
const CALENDLY_URL = "https://calendly.com/kairossecurity/30min";

interface Step {
  title: string;
  body?: React.ReactNode;
  cta?: { label: string; href?: string; download?: boolean; external?: boolean };
}

const Steps = ({ steps }: { steps: Step[] }) => {
  const navigate = useNavigate();
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {i + 1}
          </div>
          <div className="flex-1 space-y-2">
            <p className="font-semibold">{s.title}</p>
            {s.body && <div className="text-sm text-muted-foreground">{s.body}</div>}
            {s.cta && (
              <Button
                size="sm"
                variant={s.cta.download ? "default" : "outline"}
                onClick={() => {
                  if (s.cta!.download) navigate(s.cta!.href || "/profile");
                  else if (s.cta!.href) window.open(s.cta!.href, "_blank", "noopener,noreferrer");
                }}
              >
                {s.cta.download ? <Download className="mr-2 h-4 w-4" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                {s.cta.label}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

const Reminders = () => (
  <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4">
    <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4" /> Important Reminders
    </p>
    <ul className="list-disc pl-5 text-sm text-amber-900 dark:text-amber-100 space-y-1">
      <li>Make sure all information submitted to DPS is accurate.</li>
      <li>Delays in fingerprinting, MMPI evaluations, or document uploads may delay your license approval.</li>
      <li>Keep copies of all certificates and receipts for your records.</li>
      <li>Monitor your TOPS account regularly for status updates and additional instructions from DPS.</li>
    </ul>
  </div>
);

const CourseNextSteps = ({ courseType }: { courseType: CourseType }) => {
  const normalized = courseType === "level-4" ? "level4" : courseType;

  let title = "What To Do Next";
  let steps: Step[] = [];
  let prereq: React.ReactNode = null;

  if (normalized === "level2") {
    title = "Next Steps — Non-Commissioned Security Officer (Level II)";
    steps = [
      { title: "Complete your online training course", body: "✓ Done — you've passed the exam." },
      { title: "Download & print your certificate", body: "Save a copy for your records and for upload to TOPS.", cta: { label: "Download Certificate", href: "/profile", download: true } },
      { title: "Create a TOPS account", body: "Apply for your Non-Commissioned Security Officer License (Level II).", cta: { label: "Open TOPS", href: TOPS_URL, external: true } },
      { title: "Upload your certificate", body: "Attach your Level II training certificate to your TOPS application." },
      { title: "Schedule fingerprinting appointment", body: "Required by Texas DPS.", cta: { label: "Schedule at IdentoGO", href: IDENTOGO_URL, external: true } },
      { title: "Wait for DPS approval", body: "Once approved, your license status will update in TOPS and your physical license will be mailed to you." },
    ];
  } else if (normalized === "level3") {
    title = "Next Steps — Commissioned Security Officer (Level III Armed)";
    steps = [
      { title: "Complete your online Level III course", body: "✓ Done — you've passed Part 1." },
      { title: "Schedule your firearm proficiency exam", body: "In-person exam with a Kairos Security licensed instructor.", cta: { label: "Schedule with Kairos", href: CALENDLY_URL, external: true } },
      { title: "Apply through TOPS", body: "Create your account and apply for your Commissioned Security Officer License (Level III).", cta: { label: "Open TOPS", href: TOPS_URL, external: true } },
      { title: "Schedule fingerprinting", body: "Required by Texas DPS.", cta: { label: "Schedule at IdentoGO", href: IDENTOGO_URL, external: true } },
      { title: "Schedule your MMPI psychological evaluation", body: "Required by DPS. The psychiatrist is independent — Kairos Security is not affiliated with the evaluating psychiatrist." },
      {
        title: "Attend your firearm proficiency exam",
        body: (
          <div>
            <p className="mb-2">Your instructor will contact you with instructions. Please bring:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your semi-automatic firearm</li>
              <li>50 rounds of ammunition</li>
              <li>Eye protection (recommended)</li>
              <li>Ear protection (recommended)</li>
            </ul>
          </div>
        ),
      },
      { title: "Receive your firearm proficiency certificate", body: "Issued by your instructor once you successfully pass." },
      { title: "Upload certificate to TOPS", body: "Log back into TOPS and upload your firearm proficiency certificate plus any remaining DPS requirements." },
      { title: "Wait for DPS approval", body: "DPS reviews your application, fingerprints, MMPI evaluation, and firearm proficiency certificate. Your license will be mailed once approved." },
    ];
  } else if (normalized === "level4") {
    title = "Next Steps — Personal Protection Officer (Level IV PPO)";
    prereq = (
      <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 p-4">
        <p className="font-semibold text-red-900 dark:text-red-100 mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Prerequisite
        </p>
        <p className="text-sm text-red-900 dark:text-red-100">
          Before applying for a PPO license, you must already hold an active <strong>Commissioned Security Officer License (Level III)</strong>.
        </p>
      </div>
    );
    steps = [
      { title: "Complete your PPO training course", body: "✓ Done — you've passed Part 1 (Online)." },
      {
        title: "Follow the same DPS steps as a Level III officer",
        body: (
          <div className="space-y-2">
            <p>You will need to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Apply through TOPS</li>
              <li>Schedule fingerprinting through IdentoGO</li>
              <li>Complete any required firearm proficiency</li>
              <li>Complete any DPS-required evaluations or documentation</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => window.open(TOPS_URL, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open TOPS
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(IDENTOGO_URL, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="mr-2 h-4 w-4" /> Schedule at IdentoGO
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(CALENDLY_URL, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="mr-2 h-4 w-4" /> Schedule with Kairos
              </Button>
            </div>
          </div>
        ),
      },
      { title: "Upload required documents", body: "Upload all required certificates and documents to your TOPS account." },
      { title: "Wait for DPS approval", body: "Once DPS approves your application, your PPO license status will update in TOPS and your license will be mailed to you." },
    ];
  } else if (normalized === "pepper-spray") {
    title = "Next Steps — Pepper Spray Certification";
    steps = [
      { title: "Download your certificate", body: "Keep a copy on file for employers and your records.", cta: { label: "Download Certificate", href: "/profile", download: true } },
      { title: "Note", body: "Pepper Spray Training is a supplemental certification and is not a Texas DPS license." },
    ];
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {prereq}
        <Steps steps={steps} />
        {(normalized === "level2" || normalized === "level3" || normalized === "level4") && <Reminders />}
      </CardContent>
    </Card>
  );
};

export default CourseNextSteps;