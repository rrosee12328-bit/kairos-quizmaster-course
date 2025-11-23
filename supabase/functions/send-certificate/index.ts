import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const certificateEmailSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  date: z.string().trim().min(1, "Date is required").max(50, "Date must be less than 50 characters"),
  registrationNumber: z.string().trim().min(1, "Registration number is required").max(50, "Registration number must be less than 50 characters"),
  lastSixDigits: z.string().optional(),
});

// Format date to MM/DD/YYYY
function formatDate(dateString: string): string {
  const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/;
  let date: Date;
  
  if (isoDateMatch.test(dateString)) {
    const [y, m, d] = dateString.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) return "MM/DD/YYYY";
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Format ID number (last 6 digits only)
function formatIdNumber(digits?: string): string {
  if (!digits) return "";
  const cleanDigits = String(digits).replace(/\D/g, "");
  return cleanDigits.slice(-6);
}

async function generateCertificatePDF(
  name: string,
  date: string,
  lastSixDigits?: string
): Promise<Uint8Array> {
  console.log("Generating certificate PDF", { name, date, lastSixDigits });

  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page with certificate dimensions (1920x1080 pixels at 72 DPI = 26.67" x 15")
    const page = pdfDoc.addPage([1920, 1080]);
    
    // Fetch the certificate template image from Supabase Storage
    const templateUrl = `https://cpjamwmwzrgqhfnirikz.supabase.co/storage/v1/object/public/certificates/certificate-template.png`;
    
    let templateImageBytes: ArrayBuffer;
    try {
      const templateResponse = await fetch(templateUrl);
      if (!templateResponse.ok) {
        console.error("Failed to fetch template, using fallback");
        // Create a simple background if template fetch fails
        page.drawRectangle({
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          color: rgb(0.95, 0.95, 0.95),
        });
      } else {
        templateImageBytes = await templateResponse.arrayBuffer();
        const templateImage = await pdfDoc.embedPng(templateImageBytes);
        
        page.drawImage(templateImage, {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
        });
      }
    } catch (imgError) {
      console.error("Error loading template image:", imgError);
      // Use fallback background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Student Name and ID Number (at top 34% from bottom = 66% from top)
    // 66% of 1080 = 712.8
    const nameY = 1080 - (1080 * 0.34) - 52; // ~660
    
    // Draw student name (48px font, bold)
    page.drawText(name || "Student Name", {
      x: 650, // Centered-ish for name
      y: nameY,
      size: 48,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Draw ID number (36px font, normal) - to the right of name
    const formattedId = formatIdNumber(lastSixDigits);
    if (formattedId) {
      page.drawText(formattedId, {
        x: 1150, // To the right
        y: nameY,
        size: 36,
        font: fontNormal,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    // Date of Completion (at top 50.7% from bottom = 49.3% from top)
    // 49.3% of 1080 = 532.44
    const dateY = 1080 - (1080 * 0.507) - 46; // ~501
    const formattedDate = formatDate(date);
    
    page.drawText(formattedDate, {
      x: 1025, // 53.4% from left = 1024.9
      y: dateY,
      size: 36,
      font: fontNormal,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated successfully, size:", pdfBytes.length);
    
    return pdfBytes;
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF generation failed: ${errorMessage}`);
  }
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

    const body = await req.json();
    console.log("Received certificate request:", { ...body, email: "***" });
    
    // Validate input
    const validation = certificateEmailSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, date, registrationNumber, lastSixDigits } = validation.data;

    // Generate PDF in background
    const pdfBytes = await generateCertificatePDF(name, date, lastSixDigits);
    
    // Convert PDF to base64 for email attachment
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    const resend = new Resend(RESEND_API_KEY);

    const emailPayload = {
      from: "Kairos Security Academy <info@kairossecurityacademy.com>",
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
              
              <p><strong>Your certificate is attached to this email as a PDF document.</strong></p>
              
              <p style="font-size: 14px; color: #666;">You can also access your certificate anytime by logging into your account and visiting your profile page.</p>
              
              <div class="footer">
                <p><strong>Kairos Security Academy</strong></p>
                <p>License #: F28623301</p>
                <p>Training security professionals with expertise, innovation, and a passion for excellence.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      attachments: [{
        filename: `Certificate-${registrationNumber}.pdf`,
        content: pdfBase64,
      }],
    };

    console.log("Sending email with PDF attachment");
    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Certificate email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, messageId: data?.id }), {
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
