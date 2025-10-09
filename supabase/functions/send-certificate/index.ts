// @ts-nocheck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionEmailRequest {
  name: string;
  email: string;
  date: string;
  score: number;
  percentage: number;
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

    const { name, email, date, score, percentage }: CompletionEmailRequest = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email or name" }),
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
        subject: "Level 3 Part 1 Complete - Approved for In-Person Training",
        html: `
          <h1>Congratulations, ${name}!</h1>
          <p>You have successfully completed <strong>Part 1 (Online Portion)</strong> of the Level 3 Security Officer Certification Course.</p>
          <p><strong>Completion Date:</strong> ${date}</p>
          <p><strong>Your Score:</strong> ${score} (${percentage}%)</p>
          <p><strong>Status:</strong> PASSED ✓</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
          <h2 style="color: #2563eb;">Next Steps</h2>
          <p>You are now <strong>approved to proceed to Part 2</strong> - the in-person training portion of the Level 3 certification.</p>
          <p>Our team will contact you shortly with scheduling information for the in-person training session.</p>
          <p style="margin-top: 30px;">— Kairos Security Academy</p>
        `,
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