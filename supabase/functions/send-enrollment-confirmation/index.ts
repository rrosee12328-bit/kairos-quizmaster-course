import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const enrollmentSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name must be less than 50 characters").regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name must be less than 50 characters").regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
  courseType: z.enum(["level2", "level3", "level4", "pepper-spray"], { errorMap: () => ({ message: "Invalid course type" }) }),
});

const getCourseDetails = (courseType: string) => {
  const courses: Record<string, { name: string; description: string }> = {
    level2: {
      name: "Level 2 Security Officer Training",
      description: "Comprehensive training for armed security professionals"
    },
    level3: {
      name: "Level 3 Security Officer Training",
      description: "Advanced security training and certification"
    },
    level4: {
      name: "Level 4 Personal Protection Specialist",
      description: "Elite bodyguard and personal protection training"
    },
    "pepper-spray": {
      name: "Pepper Spray Certification",
      description: "Professional pepper spray training and certification"
    }
  };
  
  return courses[courseType] || { name: "Security Training Course", description: "Professional security training" };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Allow calls from webhook (no auth) or authenticated users
    const authHeader = req.headers.get('Authorization');
    const isWebhookCall = !authHeader;

    const body = await req.json();
    
    // Validate input
    const validation = enrollmentSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, firstName, lastName, courseType } = validation.data;
    
    console.log("[send-enrollment-confirmation] Sending email to:", email, "for course:", courseType);

    const course = getCourseDetails(courseType);
    const fullName = `${firstName} ${lastName}`.trim();

    const emailResponse = await resend.emails.send({
      from: "Kairos Security Academy <info@kairossecurityacademy.com>",
      to: [email],
      subject: `Welcome to ${course.name}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Welcome to Kairos Security Academy</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Congratulations, ${fullName}!</h2>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Your enrollment in <strong>${course.name}</strong> has been confirmed. 
                You now have full access to all course materials!
              </p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #1e3a8a;">📚 Course Details</h3>
                <p style="margin: 10px 0;"><strong>Course:</strong> ${course.name}</p>
                <p style="margin: 10px 0;"><strong>Description:</strong> ${course.description}</p>
              </div>
              
              <h3 style="color: #1e3a8a; margin-top: 30px;">🚀 Next Steps to Access Your Course</h3>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>⚠️ Important:</strong> You must create an account using this email address: <strong>${email}</strong>
                </p>
              </div>
              
              <ol style="padding-left: 20px;">
                <li style="margin-bottom: 12px;">
                  <strong>Create your account</strong> - Click the button below and select <strong>"Sign Up"</strong>
                </li>
                <li style="margin-bottom: 12px;">
                  <strong>Use this exact email:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${email}</code>
                </li>
                <li style="margin-bottom: 12px;">
                  <strong>Create a password</strong> - Choose a secure password for your account
                </li>
                <li style="margin-bottom: 12px;">
                  <strong>Start learning!</strong> - Your course will be automatically available after you sign in
                </li>
              </ol>
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>💡 Why this email?</strong> Your course access is linked to <strong>${email}</strong>. 
                  Using a different email will prevent you from accessing your purchased course.
                </p>
              </div>
              
              <!-- Outlook-compatible button using table -->
              <div style="text-align: center; margin-top: 30px;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.kairossecurityacademy.com/auth" style="height:50px;v-text-anchor:middle;width:280px;" arcsize="10%" stroke="f" fillcolor="#1e3a8a">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Create Account & Access Course</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="https://www.kairossecurityacademy.com/auth" 
                   style="display: inline-block; background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Create Account &amp; Access Course
                </a>
                <!--<![endif]-->
              </div>
              
              <!-- Plain text link fallback for email clients with button issues -->
              <p style="text-align: center; font-size: 13px; color: #6b7280; margin-top: 15px;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="https://www.kairossecurityacademy.com/auth" style="color: #3b82f6; word-break: break-all;">https://www.kairossecurityacademy.com/auth</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Need help? Contact us at <a href="mailto:info@kairossecurityacademy.com" style="color: #3b82f6; text-decoration: none;">info@kairossecurityacademy.com</a>
              </p>
              
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                This email was sent to ${email} because you enrolled in a course at Kairos Security Academy.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("[send-enrollment-confirmation] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[send-enrollment-confirmation] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
