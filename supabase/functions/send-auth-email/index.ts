import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.kairossecurityacademy.com";

// Supabase Auth Hook payload structure
interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const getEmailContent = (type: string, email: string, confirmationUrl: string, userName: string) => {
  const templates: Record<string, { subject: string; html: string }> = {
    recovery: {
      subject: "Reset Your Password - Kairos Security Academy",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Hello${userName ? `, ${userName}` : ''}!</h2>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                We received a request to reset your password for your Kairos Security Academy account.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Click the button below to create a new password:
              </p>
              
              <!-- Outlook-compatible button -->
              <div style="text-align: center; margin: 30px 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="10%" stroke="f" fillcolor="#1e3a8a">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Reset Password</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${confirmationUrl}" 
                   style="display: inline-block; background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
                <!--<![endif]-->
              </div>
              
              <p style="text-align: center; font-size: 13px; color: #6b7280; margin-top: 15px;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmationUrl}" style="color: #3b82f6; word-break: break-all;">${confirmationUrl}</a>
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>⚠️ Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                This link will expire in 24 hours for security reasons.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Need help? Contact us at <a href="mailto:info@kairossecurityacademy.com" style="color: #3b82f6; text-decoration: none;">info@kairossecurityacademy.com</a>
              </p>
              
              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                This email was sent to ${email} because a password reset was requested for your Kairos Security Academy account.
              </p>
            </div>
          </body>
        </html>
      `,
    },
    signup: {
      subject: "Confirm Your Email - Kairos Security Academy",
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
              <h2 style="color: #1e3a8a; margin-top: 0;">Confirm Your Email</h2>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for signing up! Please confirm your email address to access your courses.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="10%" stroke="f" fillcolor="#1e3a8a">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Confirm Email</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${confirmationUrl}" 
                   style="display: inline-block; background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Confirm Email
                </a>
                <!--<![endif]-->
              </div>
              
              <p style="text-align: center; font-size: 13px; color: #6b7280; margin-top: 15px;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmationUrl}" style="color: #3b82f6; word-break: break-all;">${confirmationUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Need help? Contact us at <a href="mailto:info@kairossecurityacademy.com" style="color: #3b82f6; text-decoration: none;">info@kairossecurityacademy.com</a>
              </p>
            </div>
          </body>
        </html>
      `,
    },
    magiclink: {
      subject: "Your Login Link - Kairos Security Academy",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔗 Magic Login Link</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Hello${userName ? `, ${userName}` : ''}!</h2>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Click the button below to log in to your Kairos Security Academy account:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" 
                   style="display: inline-block; background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  Log In
                </a>
              </div>
              
              <p style="text-align: center; font-size: 13px; color: #6b7280; margin-top: 15px;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${confirmationUrl}" style="color: #3b82f6; word-break: break-all;">${confirmationUrl}</a>
              </p>
            </div>
          </body>
        </html>
      `,
    },
  };

  // Default fallback for unknown email types
  return templates[type] || {
    subject: "Kairos Security Academy - Action Required",
    html: `
      <p>Click the link below:</p>
      <a href="${confirmationUrl}">${confirmationUrl}</a>
    `,
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawPayload = await req.json();
    
    console.log("[send-auth-email] Raw payload received:", JSON.stringify(rawPayload, null, 2));

    // Handle the Supabase Auth Hook payload format
    // The hook sends the payload directly, not wrapped
    let user: { id?: string; email: string; user_metadata?: { full_name?: string } };
    let email_data: { token?: string; token_hash: string; redirect_to?: string; email_action_type: string; site_url?: string };

    // Check if this is the Auth Hook format or our expected format
    if (rawPayload.user && rawPayload.email_data) {
      // Standard Auth Hook format
      user = rawPayload.user;
      email_data = rawPayload.email_data;
    } else if (rawPayload.email && rawPayload.token_hash) {
      // Simplified format - maybe from direct testing
      user = { email: rawPayload.email, user_metadata: { full_name: rawPayload.name } };
      email_data = { 
        token_hash: rawPayload.token_hash, 
        email_action_type: rawPayload.type || 'recovery',
        redirect_to: rawPayload.redirect_to
      };
    } else {
      console.error("[send-auth-email] Invalid payload format:", rawPayload);
      throw new Error("Invalid payload format - expected user and email_data fields");
    }

    const { token_hash, email_action_type } = email_data;
    
    console.log("[send-auth-email] Processing email request:", {
      email: user.email,
      type: email_action_type,
      token_hash: token_hash?.substring(0, 10) + "...",
    });

    // Build the confirmation URL pointing to your site
    // For recovery, redirect to /reset-password page
    // For other types, redirect to /auth
    let targetPath = "/auth";
    if (email_action_type === "recovery") {
      targetPath = "/reset-password";
    }
    
    const confirmationUrl = `${SITE_URL}${targetPath}?token_hash=${token_hash}&type=${email_action_type}`;
    
    const userName = user.user_metadata?.full_name || "";
    const emailContent = getEmailContent(email_action_type, user.email, confirmationUrl, userName);

    console.log("[send-auth-email] Sending email via Resend:", {
      to: user.email,
      subject: emailContent.subject,
      type: email_action_type,
      confirmationUrl: confirmationUrl.substring(0, 80) + "...",
    });

    const emailResponse = await resend.emails.send({
      from: "Kairos Security Academy <info@kairossecurityacademy.com>",
      to: [user.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailResponse.error) {
      console.error("[send-auth-email] Resend error:", emailResponse.error);
      throw new Error(emailResponse.error.message);
    }

    console.log("[send-auth-email] Email sent successfully:", emailResponse.data);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[send-auth-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
