// @ts-nocheck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  studentName: string;
  studentEmail: string;
  courseType: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  registrationNumber?: string;
  approvalCode?: string;
  completedAt: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { 
      studentName,
      studentEmail,
      courseType, 
      score, 
      totalQuestions, 
      percentage, 
      passed,
      registrationNumber,
      approvalCode,
      completedAt
    }: AdminNotificationRequest = await req.json();

    console.log('Sending admin notification for:', studentEmail);

    const courseTitle = courseType === 'level2' 
      ? 'Level 2 Security Officer Certification' 
      : 'Level 3 Security Officer Certification (Part 1)';

    const subject = `Student ${passed ? 'PASSED' : 'FAILED'} - ${courseTitle} - ${studentName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${passed ? '#10b981' : '#ef4444'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
            .info-row { padding: 10px; border-bottom: 1px solid #ddd; }
            .info-label { font-weight: bold; display: inline-block; width: 150px; }
            .status { font-size: 24px; font-weight: bold; color: ${passed ? '#10b981' : '#ef4444'}; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Course Completion Notification</h2>
              <p style="margin: 0;">${courseTitle}</p>
            </div>
            <div class="content">
              <div class="status">${passed ? '✓ PASSED' : '✗ FAILED'}</div>
              
              <div class="info-row">
                <span class="info-label">Student Name:</span>
                <span>${studentName}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Student Email:</span>
                <span>${studentEmail}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Course:</span>
                <span>${courseTitle}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Score:</span>
                <span>${score}/${totalQuestions} (${percentage}%)</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span style="color: ${passed ? '#10b981' : '#ef4444'}; font-weight: bold;">${passed ? 'PASSED' : 'FAILED'}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Completed At:</span>
                <span>${new Date(completedAt).toLocaleString()}</span>
              </div>
              
              ${passed && courseType === 'level2' && registrationNumber 
                ? `
                  <div class="info-row">
                    <span class="info-label">Certificate #:</span>
                    <span>${registrationNumber}</span>
                  </div>
                `
                : ''
              }
              
              ${passed && courseType === 'level3' && approvalCode
                ? `
                  <div class="info-row">
                    <span class="info-label">Approval Code:</span>
                    <span style="font-weight: bold; color: #3b82f6;">${approvalCode}</span>
                  </div>
                `
                : ''
              }
            </div>
          </div>
        </body>
      </html>
    `;

    // Send to both admin emails
    const adminEmails = ['staylor@kairossecurity.com', 'trysocialmediahelp@gmail.com'];
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kairos Security Academy <onboarding@resend.dev>",
        to: adminEmails,
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send admin notification");
    }

    console.log("Admin notification sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
