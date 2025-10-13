// @ts-nocheck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseCompletionEmailRequest {
  email: string;
  studentName: string;
  courseType: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  registrationNumber?: string;
  approvalCode?: string;
  approvalExpiresAt?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { 
      email, 
      studentName, 
      courseType, 
      score, 
      totalQuestions, 
      percentage, 
      passed,
      registrationNumber,
      approvalCode,
      approvalExpiresAt
    }: CourseCompletionEmailRequest = await req.json();

    console.log('Sending course completion email to:', email);

    if (!email || !studentName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email or studentName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const courseTitle = courseType === 'level2' 
      ? 'Level 2 Security Officer Certification' 
      : 'Level 3 Security Officer Certification (Part 1 - Online)';

    const subject = passed 
      ? `🎉 Congratulations! You passed ${courseTitle}!`
      : `Course Completion Notification - ${courseTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .score-box { background: ${passed ? '#10b981' : '#ef4444'}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .score { font-size: 48px; font-weight: bold; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${passed ? '🎉 Congratulations!' : 'Course Completed'}</h1>
              <p>${courseTitle}</p>
            </div>
            <div class="content">
              <p>Dear ${studentName},</p>
              
              ${passed 
                ? `<p>We are thrilled to inform you that you have <strong>successfully passed</strong> the ${courseTitle} examination with a score of ${percentage}%!</p>`
                : `<p>Thank you for completing the ${courseTitle} examination.</p>`
              }
              
              <div class="score-box">
                <p style="margin: 0; font-size: 18px;">Your Score</p>
                <div class="score">${percentage}%</div>
                <p style="margin: 0;">${score} out of ${totalQuestions} correct</p>
                ${passed ? '<p style="margin-top: 10px; font-size: 14px;">PASSED ✓</p>' : '<p style="margin-top: 10px; font-size: 14px;">Did not meet passing requirements</p>'}
              </div>
              
              ${passed && courseType === 'level2' && registrationNumber 
                ? `
                  <p><strong>Certificate Registration Number:</strong> ${registrationNumber}</p>
                  <p>Your certificate has been generated and is available in your user profile. You can download it at any time by logging into your account.</p>
                `
                : passed && courseType === 'level3' && approvalCode
                ? `
                  <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1e40af;">Your Approval Code</p>
                    <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px;">${approvalCode}</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #1e40af;">Expires: ${approvalExpiresAt}</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #1e40af;">⚠️ This approval code is valid for 24 hours only and grants you access to schedule your in-person Level 3 Part 2 training.</p>
                  </div>
                  <p><strong>Important:</strong> Level 3 does not provide a certificate for the online portion. You must complete the in-person Level 3 Part 2 training to receive your full Armed Security Officer certification.</p>
                `
                : !passed
                ? `
                  <p>Unfortunately, you did not meet the passing requirements for this course. <strong>A score of 75% or higher is required to pass.</strong></p>
                  <p>Don't worry! You can retake the exam to improve your score. We encourage you to review the course materials and try again.</p>
                `
                : ''
              }
              
              <p>Thank you for choosing Kairos Security Academy for your security officer training needs.</p>
              
              <p>Best regards,<br>The Kairos Security Academy Team</p>
              
              ${courseType === 'level3' && passed 
                ? `
                  <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #856404; font-weight: bold; font-size: 16px;">⚠️ NEXT STEPS REQUIRED</p>
                    <p style="margin: 10px 0 0 0; color: #856404;">You have completed Part 1 (Online) of the Level 3 Security Officer Certification. To receive your Armed Security Officer certificate, you MUST complete Part 2 in-person training.</p>
                    <p style="margin: 10px 0 0 0; color: #856404; font-weight: bold;">Use your approval code above to schedule your in-person training session. This code expires in 24 hours.</p>
                  </div>
                `
                : ''
              }
            </div>
            <div class="footer">
              <p>© 2025 Kairos Security Academy. All Rights Reserved. License #: F28623301</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kairos Security Academy <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-course-completion function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
