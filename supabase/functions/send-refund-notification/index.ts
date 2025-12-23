// @ts-nocheck
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundNotificationRequest {
  email: string;
  customerName: string;
  courseName?: string;
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

    const { email, customerName, courseName }: RefundNotificationRequest = await req.json();
    
    console.log("[send-refund-notification] Sending refund email to:", email, "Name:", customerName);

    const courseText = courseName ? ` for the ${courseName} course` : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin-bottom: 10px;">Kairos Security Academy</h1>
        </div>
        
        <p>Dear ${customerName},</p>
        
        <p>We sincerely apologize for the inconvenience caused by the duplicate charge${courseText} on your account.</p>
        
        <p>We have processed a refund for the duplicate payment. <strong>Please allow 5-10 business days</strong> for the refund to appear in your account, depending on your bank or card issuer.</p>
        
        <p>If you have any questions or concerns, please don't hesitate to contact us at <a href="mailto:info@kairossecurityacademy.com">info@kairossecurityacademy.com</a>.</p>
        
        <p>Thank you for your patience and understanding.</p>
        
        <p style="margin-top: 30px;">
          Warm regards,<br>
          <strong>Kairos Security Academy Team</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Kairos Security Academy<br>
          Professional Security Training
        </p>
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
        subject: "Your Refund Has Been Processed - Kairos Security Academy",
        html: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[send-refund-notification] Resend API error:", data);
      throw new Error(data.message || "Failed to send refund notification");
    }

    console.log("[send-refund-notification] Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-refund-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
