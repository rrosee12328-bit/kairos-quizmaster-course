// @ts-nocheck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateEmailRequest {
  name: string;
  email: string;
  certificatePdf: string; // Base64 encoded PDF (no data: prefix)
  date: string;
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

    const { name, email, certificatePdf, date }: CertificateEmailRequest = await req.json();

    if (!email || !certificatePdf) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email or certificatePdf" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kairos Training <onboarding@resend.dev>",
        to: [email],
        subject: "Your Level 3 Security Officer Certificate",
        html: `
          <h1>Congratulations, ${name}!</h1>
          <p>You have successfully completed the Level 3 Security Officer Certification Course.</p>
          <p><strong>Completion Date:</strong> ${date}</p>
          <p>Your certificate is attached to this email.</p>
          <p>— Kairos Training Team</p>
        `,
        attachments: [
          {
            filename: `Level-3-Certificate-${name.replace(/\s+/g, '-')}.pdf`,
            content: certificatePdf,
            content_type: "application/pdf",
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-certificate function:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});