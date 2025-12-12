import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 requests per minute per IP

// In-memory rate limit store (resets on function cold start, which is acceptable for this use case)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  // Check common headers for client IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  // Fallback to a generic identifier if no IP available
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now >= record.resetAt) {
    // Reset or initialize the record
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  record.count++;
  return false;
}

// Clean up old entries periodically (simple garbage collection)
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now >= record.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}

interface BetaFeedbackRequest {
  nameRole: string;
  experienceLevel: string;
  deviceBrowser: string;
  testingTime: string;
  loginClarity: string;
  layoutRating: string;
  materialsLocation: string;
  visualDesign: string;
  branding: string;
  videoPlayback: string;
  aiAssistant: string;
  materialsUsefulness: string;
  contentEngagement: string;
  technicalIssues: string;
  testLocation: string;
  testInterface: string;
  scoreComm: string;
  certificateDelivery: string;
  certificateDownload: string;
  accessibilityIssues: string;
  mobileAdaptation: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Clean up old rate limit entries
  cleanupRateLimitStore();

  // Get client IP and check rate limit
  const clientIp = getClientIp(req);
  
  if (isRateLimited(clientIp)) {
    console.log(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a minute before submitting again." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          ...corsHeaders,
        },
      }
    );
  }

  try {
    const feedback: BetaFeedbackRequest = await req.json();
    console.log("Received beta feedback submission from:", feedback.nameRole, "IP:", clientIp);

    // Basic input validation - ensure required fields are present and not excessively long
    const maxFieldLength = 5000;
    const requiredFields = [
      'nameRole', 'experienceLevel', 'deviceBrowser', 'testingTime',
      'loginClarity', 'layoutRating', 'materialsLocation', 'visualDesign',
      'branding', 'videoPlayback', 'aiAssistant', 'materialsUsefulness',
      'contentEngagement', 'technicalIssues', 'testLocation', 'testInterface',
      'scoreComm', 'certificateDelivery', 'certificateDownload',
      'accessibilityIssues', 'mobileAdaptation'
    ] as const;

    for (const field of requiredFields) {
      const value = feedback[field];
      if (typeof value !== 'string') {
        return new Response(
          JSON.stringify({ error: `Invalid field: ${field}` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      if (value.length > maxFieldLength) {
        return new Response(
          JSON.stringify({ error: `Field ${field} exceeds maximum length` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Save feedback to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from('beta_feedback')
      .insert({
        name_role: feedback.nameRole,
        experience_level: feedback.experienceLevel,
        device_browser: feedback.deviceBrowser,
        testing_time: feedback.testingTime,
        login_clarity: feedback.loginClarity,
        layout_rating: feedback.layoutRating,
        materials_location: feedback.materialsLocation,
        visual_design: feedback.visualDesign,
        branding: feedback.branding,
        video_playback: feedback.videoPlayback,
        ai_assistant: feedback.aiAssistant,
        materials_usefulness: feedback.materialsUsefulness,
        content_engagement: feedback.contentEngagement,
        technical_issues: feedback.technicalIssues,
        test_location: feedback.testLocation,
        test_interface: feedback.testInterface,
        score_comm: feedback.scoreComm,
        certificate_delivery: feedback.certificateDelivery,
        certificate_download: feedback.certificateDownload,
        accessibility_issues: feedback.accessibilityIssues,
        mobile_adaptation: feedback.mobileAdaptation,
      });

    if (dbError) {
      console.error("Error saving feedback to database:", dbError);
    } else {
      console.log("Feedback saved to database successfully");
    }

    // HTML escape function to prevent any XSS in email
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          h1 {
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
          }
          h2 {
            color: #1e40af;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            width: 40%;
          }
          td {
            background-color: #ffffff;
          }
          .section {
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <h1>Beta Testing Feedback Submission</h1>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Client IP:</strong> ${escapeHtml(clientIp)}</p>
        
        <div class="section">
          <h2>Section A: User Profile & Context</h2>
          <table>
            <tr>
              <th>Name/Role</th>
              <td>${escapeHtml(feedback.nameRole)}</td>
            </tr>
            <tr>
              <th>Experience Level</th>
              <td>${escapeHtml(feedback.experienceLevel)}</td>
            </tr>
            <tr>
              <th>Device & Browser</th>
              <td>${escapeHtml(feedback.deviceBrowser)}</td>
            </tr>
            <tr>
              <th>Testing Time</th>
              <td>${escapeHtml(feedback.testingTime)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section B: First Impression & Navigation</h2>
          <table>
            <tr>
              <th>Login Clarity</th>
              <td>${escapeHtml(feedback.loginClarity)}</td>
            </tr>
            <tr>
              <th>Layout Rating</th>
              <td>${escapeHtml(feedback.layoutRating)}</td>
            </tr>
            <tr>
              <th>Materials Location</th>
              <td>${escapeHtml(feedback.materialsLocation)}</td>
            </tr>
            <tr>
              <th>Visual Design</th>
              <td>${escapeHtml(feedback.visualDesign)}</td>
            </tr>
            <tr>
              <th>Branding</th>
              <td>${escapeHtml(feedback.branding)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section C: Course Materials & Learning Experience</h2>
          <table>
            <tr>
              <th>Video Playback</th>
              <td>${escapeHtml(feedback.videoPlayback)}</td>
            </tr>
            <tr>
              <th>AI Assistant</th>
              <td>${escapeHtml(feedback.aiAssistant)}</td>
            </tr>
            <tr>
              <th>Materials Usefulness</th>
              <td>${escapeHtml(feedback.materialsUsefulness)}</td>
            </tr>
            <tr>
              <th>Content Engagement</th>
              <td>${escapeHtml(feedback.contentEngagement)}</td>
            </tr>
            <tr>
              <th>Technical Issues</th>
              <td>${escapeHtml(feedback.technicalIssues)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section D: Test & Certificate Functionality</h2>
          <table>
            <tr>
              <th>Test Location</th>
              <td>${escapeHtml(feedback.testLocation)}</td>
            </tr>
            <tr>
              <th>Test Interface</th>
              <td>${escapeHtml(feedback.testInterface)}</td>
            </tr>
            <tr>
              <th>Score Communication</th>
              <td>${escapeHtml(feedback.scoreComm)}</td>
            </tr>
            <tr>
              <th>Certificate Delivery</th>
              <td>${escapeHtml(feedback.certificateDelivery)}</td>
            </tr>
            <tr>
              <th>Certificate Download</th>
              <td>${escapeHtml(feedback.certificateDownload)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section E: Usability & Accessibility</h2>
          <table>
            <tr>
              <th>Accessibility Issues</th>
              <td>${escapeHtml(feedback.accessibilityIssues)}</td>
            </tr>
            <tr>
              <th>Mobile Adaptation</th>
              <td>${escapeHtml(feedback.mobileAdaptation)}</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Kairos Security Academy <onboarding@resend.dev>",
      to: ["info@kairossecurityacademy.com"],
      subject: `Beta Feedback - ${escapeHtml(feedback.nameRole)}`,
      html: emailHtml,
    });

    console.log("Beta feedback email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending beta feedback email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
