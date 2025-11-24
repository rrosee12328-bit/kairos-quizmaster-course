import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  try {
    const feedback: BetaFeedbackRequest = await req.json();
    console.log("Received beta feedback submission");

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
        
        <div class="section">
          <h2>Section A: User Profile & Context</h2>
          <table>
            <tr>
              <th>Name/Role</th>
              <td>${feedback.nameRole}</td>
            </tr>
            <tr>
              <th>Experience Level</th>
              <td>${feedback.experienceLevel}</td>
            </tr>
            <tr>
              <th>Device & Browser</th>
              <td>${feedback.deviceBrowser}</td>
            </tr>
            <tr>
              <th>Testing Time</th>
              <td>${feedback.testingTime}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section B: First Impression & Navigation</h2>
          <table>
            <tr>
              <th>Login Clarity</th>
              <td>${feedback.loginClarity}</td>
            </tr>
            <tr>
              <th>Layout Rating</th>
              <td>${feedback.layoutRating}</td>
            </tr>
            <tr>
              <th>Materials Location</th>
              <td>${feedback.materialsLocation}</td>
            </tr>
            <tr>
              <th>Visual Design</th>
              <td>${feedback.visualDesign}</td>
            </tr>
            <tr>
              <th>Branding</th>
              <td>${feedback.branding}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section C: Course Materials & Learning Experience</h2>
          <table>
            <tr>
              <th>Video Playback</th>
              <td>${feedback.videoPlayback}</td>
            </tr>
            <tr>
              <th>AI Assistant</th>
              <td>${feedback.aiAssistant}</td>
            </tr>
            <tr>
              <th>Materials Usefulness</th>
              <td>${feedback.materialsUsefulness}</td>
            </tr>
            <tr>
              <th>Content Engagement</th>
              <td>${feedback.contentEngagement}</td>
            </tr>
            <tr>
              <th>Technical Issues</th>
              <td>${feedback.technicalIssues}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section D: Test & Certificate Functionality</h2>
          <table>
            <tr>
              <th>Test Location</th>
              <td>${feedback.testLocation}</td>
            </tr>
            <tr>
              <th>Test Interface</th>
              <td>${feedback.testInterface}</td>
            </tr>
            <tr>
              <th>Score Communication</th>
              <td>${feedback.scoreComm}</td>
            </tr>
            <tr>
              <th>Certificate Delivery</th>
              <td>${feedback.certificateDelivery}</td>
            </tr>
            <tr>
              <th>Certificate Download</th>
              <td>${feedback.certificateDownload}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Section E: Usability & Accessibility</h2>
          <table>
            <tr>
              <th>Accessibility Issues</th>
              <td>${feedback.accessibilityIssues}</td>
            </tr>
            <tr>
              <th>Mobile Adaptation</th>
              <td>${feedback.mobileAdaptation}</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Kairos Security Academy <onboarding@resend.dev>",
      to: ["info@kairossecurityacademy.com"],
      subject: `Beta Feedback - ${feedback.nameRole}`,
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
