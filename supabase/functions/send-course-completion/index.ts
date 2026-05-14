// @ts-nocheck
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const courseCompletionSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  studentName: z.string().trim().min(1, "Student name is required").max(100, "Name must be less than 100 characters").regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  courseType: z.enum(["level2", "level3", "level4", "level-4", "pepper-spray"], { errorMap: () => ({ message: "Invalid course type" }) }),
  score: z.number().int().min(0, "Score must be non-negative").max(1000, "Score exceeds maximum"),
  totalQuestions: z.number().int().min(1, "Total questions must be at least 1").max(1000, "Total questions exceeds maximum"),
  percentage: z.number().min(0, "Percentage must be at least 0").max(100, "Percentage must not exceed 100"),
  passed: z.boolean(),
  registrationNumber: z.string().trim().max(50, "Registration number too long").regex(/^[A-Z0-9-]+$/, "Invalid registration number format").nullable().optional(),
  approvalCode: z.string().trim().max(50, "Approval code too long").regex(/^[A-Z0-9-]+$/, "Invalid approval code format").nullable().optional(),
  approvalExpiresAt: z.string().trim().max(100, "Expiration date too long").nullable().optional(),
});

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

    const body = await req.json();
    
    // Validate input
    const validation = courseCompletionSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    } = validation.data;

    console.log('Sending course completion email to:', email);

    const courseTitle = courseType === 'level2' 
      ? 'Level 2 Security Officer Certification' 
      : courseType === 'level3'
      ? 'Level 3 Security Officer Certification (Part 1 - Online)'
      : (courseType === 'level4' || courseType === 'level-4')
      ? 'Level 4 Personal Protection Officer (Part 1 - Online)'
      : 'Pepper Spray Training Certification';
    
    const normalizedCourseType = courseType === 'level-4' ? 'level4' : courseType;

    const subject = passed 
      ? `🎉 Congratulations! You passed ${courseTitle}!`
      : `Course Completion Notification - ${courseTitle}`;

    const TOPS_URL = "https://www.dps.texas.gov/section/private-security/tops";
    const IDENTOGO_URL = "https://www.identogo.com";
    const CALENDLY_URL = "https://calendly.com/kairossecurity/30min";
    const PROFILE_URL = "https://kairossecurityacademy.com/profile";

    const stepCard = (n: number, title: string, body: string, cta?: { label: string; href: string; color?: string }) => `
      <div style="display:flex;gap:12px;margin:0 0 16px 0;">
        <div style="flex:0 0 32px;height:32px;border-radius:9999px;background:#3b82f6;color:#ffffff;font-weight:bold;text-align:center;line-height:32px;">${n}</div>
        <div style="flex:1;">
          <p style="margin:4px 0 6px 0;font-weight:bold;color:#111827;">${title}</p>
          <div style="margin:0;font-size:14px;color:#4b5563;line-height:1.5;">${body}</div>
          ${cta ? `<p style="margin:10px 0 0 0;"><a href="${cta.href}" target="_blank" style="display:inline-block;background:${cta.color || '#3b82f6'};color:#ffffff;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">${cta.label}</a></p>` : ''}
        </div>
      </div>
    `;

    const remindersBlock = `
      <div style="background:#fff3cd;border:2px solid #ffc107;padding:16px;border-radius:8px;margin:20px 0;">
        <p style="margin:0 0 8px 0;color:#856404;font-weight:bold;">⚠️ Important Reminders</p>
        <ul style="margin:0;padding-left:20px;color:#856404;font-size:14px;line-height:1.6;">
          <li>Make sure all information submitted to DPS is accurate.</li>
          <li>Delays in fingerprinting, MMPI evaluations, or document uploads may delay your license approval.</li>
          <li>Keep copies of all certificates and receipts for your records.</li>
          <li>Monitor your TOPS account regularly for status updates and additional instructions from DPS.</li>
        </ul>
      </div>
    `;

    let nextStepsBlock = '';
    if (passed) {
      if (normalizedCourseType === 'level2') {
        nextStepsBlock = `
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
            <h2 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Next Steps — Non-Commissioned Security Officer (Level II)</h2>
            ${stepCard(1, 'Complete your online training course', '✓ Done — you\'ve passed the exam.')}
            ${stepCard(2, 'Download & print your certificate', 'Save a copy for your records and to upload to TOPS.', { label: 'Download Certificate', href: PROFILE_URL, color: '#22c55e' })}
            ${stepCard(3, 'Create a TOPS account', 'Apply for your Non-Commissioned Security Officer License (Level II).', { label: 'Open TOPS', href: TOPS_URL })}
            ${stepCard(4, 'Upload your certificate', 'Attach your Level II training certificate to your TOPS application.')}
            ${stepCard(5, 'Schedule fingerprinting appointment', 'Required by Texas DPS.', { label: 'Schedule at IdentoGO', href: IDENTOGO_URL })}
            ${stepCard(6, 'Wait for DPS approval', 'Once approved, your license status will update in TOPS and your physical license will be mailed to you.')}
            ${remindersBlock}
          </div>
        `;
      } else if (normalizedCourseType === 'level3') {
        nextStepsBlock = `
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
            <h2 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Next Steps — Commissioned Security Officer (Level III Armed)</h2>
            ${stepCard(1, 'Complete your online Level III course', '✓ Done — you\'ve passed Part 1.')}
            ${stepCard(2, 'Schedule your firearm proficiency exam', 'In-person exam with a Kairos Security licensed instructor.', { label: 'Schedule with Kairos', href: CALENDLY_URL })}
            ${stepCard(3, 'Apply through TOPS', 'Create your account and apply for your Commissioned Security Officer License (Level III).', { label: 'Open TOPS', href: TOPS_URL })}
            ${stepCard(4, 'Schedule fingerprinting', 'Required by Texas DPS.', { label: 'Schedule at IdentoGO', href: IDENTOGO_URL })}
            ${stepCard(5, 'Schedule your MMPI psychological evaluation', 'Required by DPS. The psychiatrist is independent — Kairos Security is not affiliated with the evaluating psychiatrist.')}
            ${stepCard(6, 'Attend your firearm proficiency exam', '<p style="margin:0 0 8px 0;">Your instructor will contact you with instructions. Please bring:</p><ul style="margin:0;padding-left:20px;"><li>Your semi-automatic firearm</li><li>50 rounds of ammunition</li><li>Eye protection (recommended)</li><li>Ear protection (recommended)</li></ul>')}
            ${stepCard(7, 'Receive your firearm proficiency certificate', 'Issued by your instructor once you successfully pass.')}
            ${stepCard(8, 'Upload certificate to TOPS', 'Log back into TOPS and upload your firearm proficiency certificate plus any remaining DPS requirements.')}
            ${stepCard(9, 'Wait for DPS approval', 'DPS reviews your application, fingerprints, MMPI evaluation, and firearm proficiency certificate. Your license will be mailed once approved.')}
            ${remindersBlock}
          </div>
        `;
      } else if (normalizedCourseType === 'level4') {
        nextStepsBlock = `
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
            <h2 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Next Steps — Personal Protection Officer (Level IV PPO)</h2>
            <div style="background:#fef2f2;border:2px solid #ef4444;padding:14px;border-radius:8px;margin:0 0 16px 0;">
              <p style="margin:0 0 6px 0;color:#991b1b;font-weight:bold;">⚠️ Prerequisite</p>
              <p style="margin:0;color:#991b1b;font-size:14px;">Before applying for a PPO license, you must already hold an active <strong>Commissioned Security Officer License (Level III)</strong>.</p>
            </div>
            ${stepCard(1, 'Complete your PPO training course', '✓ Done — you\'ve passed Part 1 (Online).')}
            ${stepCard(2, 'Follow the same DPS steps as a Level III officer', 'Apply through TOPS, schedule fingerprinting through IdentoGO, complete any required firearm proficiency, and any DPS-required evaluations or documentation.')}
            <div style="margin:0 0 16px 44px;display:flex;flex-wrap:wrap;gap:8px;">
              <a href="${TOPS_URL}" target="_blank" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:8px 14px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px;">Open TOPS</a>
              <a href="${IDENTOGO_URL}" target="_blank" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:8px 14px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px;">Schedule at IdentoGO</a>
              <a href="${CALENDLY_URL}" target="_blank" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:8px 14px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px;">Schedule with Kairos</a>
            </div>
            ${stepCard(3, 'Upload required documents', 'Upload all required certificates and documents to your TOPS account.')}
            ${stepCard(4, 'Wait for DPS approval', 'Once DPS approves your application, your PPO license status will update in TOPS and your license will be mailed to you.')}
            ${remindersBlock}
          </div>
        `;
      } else if (normalizedCourseType === 'pepper-spray') {
        nextStepsBlock = `
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
            <h2 style="margin:0 0 16px 0;font-size:18px;color:#111827;">Next Steps — Pepper Spray Certification</h2>
            ${stepCard(1, 'Download your certificate', 'Keep a copy on file for employers and your records.', { label: 'Download Certificate', href: PROFILE_URL, color: '#22c55e' })}
            <p style="margin:8px 0 0 0;font-size:13px;color:#6b7280;">Pepper Spray Training is a supplemental certification and is not a Texas DPS license.</p>
          </div>
        `;
      }
    }

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
              
              ${passed && normalizedCourseType === 'level2' && registrationNumber 
                ? `
                  <p><strong>Certificate Registration Number:</strong> ${registrationNumber}</p>
                  <p>Your certificate has been generated and is available in your user profile. You can download it at any time by logging into your account.</p>
                  
                  <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #166534;">🔍 Looking for Security Work?</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #166534;">Join WeFind Guards to be discovered by security companies hiring in your area!</p>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://wefindguards.com" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join WeFind Guards</a>
                    </div>
                  </div>
                `
                : passed && normalizedCourseType === 'pepper-spray' && registrationNumber
                ? `
                  <p><strong>Certificate Registration Number:</strong> ${registrationNumber}</p>
                  <p>Your Pepper Spray Training certificate has been generated and is available in your user profile. You can download it at any time by logging into your account.</p>
                  
                  <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #166534;">🔍 Looking for Security Work?</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #166534;">Join WeFind Guards to be discovered by security companies hiring in your area!</p>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://wefindguards.com" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join WeFind Guards</a>
                    </div>
                  </div>
                `
                : passed && normalizedCourseType === 'level3'
                ? `
                  <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1e40af;">📅 Schedule Your In-Person Training (Part 2)</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #1e40af;">Click the button below to book your Level 3 Part 2 in-person training session in the Houston area with Kairos Security.</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e40af;"><strong>Training is held on Saturdays only.</strong> You can schedule up to one week in advance.</p>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://calendly.com/kairossecurity/30min" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Schedule Saturday Training</a>
                    </div>
                  </div>
                  <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Important: Bring This Email</p>
                    <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">Please be ready to show this confirmation email to the instructor to verify you are scheduled for the class.</p>
                  </div>
                  <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #856404; font-weight: bold;">💰 Important Pricing Information</p>
                    <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">Your online payment covered Part 1 (Online) only. <strong>Part 2 in-person training is priced separately</strong> and will be paid at the time of your appointment.</p>
                  </div>
                  <p><strong>Important:</strong> Level 3 does not provide a certificate for the online portion. You must complete the in-person Level 3 Part 2 training to receive your full Armed Security Officer certification.</p>
                  
                  <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #166534;">🔍 Looking for Security Work?</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #166534;">Join WeFind Guards to be discovered by security companies hiring in your area!</p>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://wefindguards.com" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join WeFind Guards</a>
                    </div>
                  </div>
                `
                : passed && normalizedCourseType === 'level4'
                ? `
                  <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1e40af;">📅 Schedule Your In-Person Training (Part 2)</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #1e40af;">Click the button below to book your Level 4 Part 2 in-person training session in the Houston area with Kairos Security.</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e40af;"><strong>Training is held on Saturdays only.</strong> You can schedule up to one week in advance.</p>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://calendly.com/kairossecurity/30min" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Schedule Saturday Training</a>
                    </div>
                  </div>
                  <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Important: Bring This Email</p>
                    <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">Please be ready to show this confirmation email to the instructor to verify you are scheduled for the class.</p>
                  </div>
                  <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #856404; font-weight: bold;">💰 Important Pricing Information</p>
                    <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">Your online payment covered Part 1 (Online) only. <strong>Part 2 in-person training is priced separately</strong> and will be paid at the time of your appointment.</p>
                  </div>
                  <p><strong>Important:</strong> Level 4 does not provide a certificate for the online portion. You must complete the in-person Level 4 Part 2 training to receive your full Personal Protection Officer certification.</p>
                  
                  <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #166534;">🔍 Looking for Security Work?</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; color: #166534;">Join WeFind Guards to be discovered by security companies hiring in your area!</p>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="https://wefindguards.com" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join WeFind Guards</a>
                    </div>
                  </div>
                `
                : !passed
                ? `
                  <p>Unfortunately, you did not meet the passing requirements for this course. <strong>A score of 70% or higher is required to pass.</strong></p>
                  <p>Don't worry! You can retake the exam to improve your score. We encourage you to review the course materials and try again.</p>
                  <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Important: Exam Attempt Policy</p>
                    <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">You have <strong>3 total attempts</strong> to pass the exam. If you fail all 3 attempts, you will need to re-purchase the course to continue. Please review the course materials thoroughly before your next attempt.</p>
                  </div>
                `
                : ''
              }
              
              <p>Thank you for choosing Kairos Security Academy for your security officer training needs.</p>
              
              <p>Best regards,<br>The Kairos Security Academy Team</p>
              
              ${normalizedCourseType === 'level3' && passed 
                ? `
                  <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #856404; font-weight: bold; font-size: 16px;">⚠️ NEXT STEPS REQUIRED</p>
                    <p style="margin: 10px 0 0 0; color: #856404;">You have completed Part 1 (Online) of the Level 3 Security Officer Certification. To receive your Armed Security Officer certificate, you MUST complete Part 2 in-person training.</p>
                    <p style="margin: 10px 0 0 0; color: #856404; font-weight: bold;">Use the booking button above to schedule your in-person training session.</p>
                  </div>
                `
                : ''
              }
              ${(normalizedCourseType === 'level4') && passed 
                ? `
                  <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #856404; font-weight: bold; font-size: 16px;">⚠️ NEXT STEPS REQUIRED</p>
                    <p style="margin: 10px 0 0 0; color: #856404;">You have completed Part 1 (Online) of the Level 4 Personal Protection Officer Certification. To receive your Personal Protection Officer certificate, you MUST complete Part 2 in-person training.</p>
                    <p style="margin: 10px 0 0 0; color: #856404; font-weight: bold;">Use the booking button above to schedule your in-person training session.</p>
                  </div>
                `
                : ''
              }
              ${nextStepsBlock}
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
        from: "Kairos Security Academy <info@kairossecurityacademy.com>",
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
