import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateEmailRequest {
  name: string;
  email: string;
  date: string;
  registrationNumber: string;
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

    const { name, email, date, registrationNumber }: CertificateEmailRequest = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email or name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "Kairos Security Academy <onboarding@resend.dev>",
      to: [email],
      subject: "Your Level 2 Security Officer Certificate",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #1e0505 0%, #4a0000 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .certificate-box {
                background: #f9f9f9;
                border-left: 4px solid #1e0505;
                padding: 20px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 14px;
              }
              .button {
                display: inline-block;
                background: #1e0505;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 4px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎓 Certificate of Completion</h1>
              <p>Kairos Security Academy</p>
            </div>
            
            <div class="content">
              <h2>Congratulations, ${name}!</h2>
              
              <p>You have successfully completed the <strong>Level Two Training Course</strong> for Private Security Program.</p>
              
              <div class="certificate-box">
                <p><strong>Student Name:</strong> ${name}</p>
                <p><strong>Registration Number:</strong> ${registrationNumber}</p>
                <p><strong>Completion Date:</strong> ${date}</p>
                <p><strong>School License Number:</strong> F28623301</p>
              </div>
              
              <p>This certificate verifies that you have met the standards and requirements set forth in Texas Occupations Code, Section 1702, Title 10 and Administrative Rules.</p>
              
              <p>Your certificate has been issued and is now available for download from your student portal.</p>
              
              <div class="footer">
                <p><strong>Kairos Security Academy</strong></p>
                <p>License #: F28623301</p>
                <p>Training security professionals with expertise, innovation, and a passion for excellence.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Certificate email sent successfully:", data);

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
