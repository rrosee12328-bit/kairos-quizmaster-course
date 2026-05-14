import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  courseType: z.string().optional().default('level2'),
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

// Format ID number (last 4 digits only for Level 2)
function formatIdNumber(digits?: string): string {
  if (!digits) return "";
  const cleanDigits = String(digits).replace(/\D/g, "");
  return cleanDigits.slice(-4);
}

// Split name into parts for Level 2 certificate
function splitName(fullName: string): { lastName: string; firstName: string; middleInitial: string } {
  if (!fullName) return { lastName: "", firstName: "", middleInitial: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0], firstName: "", middleInitial: "" };
  } else if (parts.length === 2) {
    return { lastName: parts[1], firstName: parts[0], middleInitial: "" };
  } else {
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const middleInitial = parts[1]?.charAt(0) || "";
    return { lastName, firstName, middleInitial };
  }
}

async function generateCertificatePDF(
  name: string,
  date: string,
  courseType: string = 'level2',
  lastSixDigits?: string
): Promise<Uint8Array> {
  console.log("Generating certificate PDF", { name, date, courseType, lastSixDigits });

  try {
    // Choose template based on course type
    const templateFileName = courseType === 'pepper-spray' 
      ? 'pepper-spray-certificate-template.pdf' 
      : 'level2-certificate-template.pdf';

    let pdfDoc: any;
    let page: any;
    let pageWidth: number;
    let pageHeight: number;

    try {
      console.log("Downloading PDF template via service role:", templateFileName);
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: templateBlob, error: templateError } = await adminClient.storage
        .from("certificates")
        .download(templateFileName);
      if (templateError || !templateBlob) {
        throw new Error(`Template download failed: ${templateError?.message || "no data"}`);
      }
      const templatePdfBytes = await templateBlob.arrayBuffer();
      console.log("Template PDF loaded, size:", templatePdfBytes.byteLength);
      
      // Load the template PDF
      const templatePdf = await PDFDocument.load(templatePdfBytes);
      
      // Create a new PDF document
      pdfDoc = await PDFDocument.create();
      
      // Copy the first page from the template
      const [templatePage] = await pdfDoc.copyPages(templatePdf, [0]);
      page = pdfDoc.addPage(templatePage);
      
      pageWidth = page.getWidth();
      pageHeight = page.getHeight();
      
      console.log("Template page copied", { pageWidth, pageHeight });
    } catch (templateError) {
      console.error("Error loading template PDF, using fallback:", templateError);
      
      // Fallback: create a blank page (portrait 8.5x11)
      pdfDoc = await PDFDocument.create();
      page = pdfDoc.addPage([612, 792]); // Letter size portrait
      pageWidth = page.getWidth();
      pageHeight = page.getHeight();

      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Helper to position elements by percentage of the page
    // Note: PDF coordinates start from bottom-left, so we invert Y
    const pctX = (percent: number) => (pageWidth * percent) / 100;
    const pctY = (percentFromTop: number) => pageHeight - (pageHeight * percentFromTop) / 100;

    // === Text placement ===
    const isPepperSpray = courseType === 'pepper-spray';
    const textColor = rgb(0, 0, 0); // Black text
    
    if (isPepperSpray) {
      // Pepper Spray Certificate Layout
      // Student Name – centered
      const nameY = pctY(35);
      const nameSize = 24;
      const nameWidth = font.widthOfTextAtSize(name || "Student Name", nameSize);
      page.drawText(name || "Student Name", {
        x: (pageWidth - nameWidth) / 2,
        y: nameY,
        size: nameSize,
        font,
        color: textColor,
      });

      // Date of Completion – lower left area
      const formattedDate = formatDate(date);
      const dateY = pctY(70);

      page.drawText(formattedDate, {
        x: pctX(32),
        y: dateY,
        size: 16,
        font: fontNormal,
        color: textColor,
      });
    } else {
      // Level 2 TX DPS Certificate Layout - Matching the form exactly
      const nameParts = splitName(name);
      const fontSize = 14;
      const smallFontSize = 12;
      
      // Last Name - first column (around 9% from left, 29% from top)
      page.drawText(nameParts.lastName, {
        x: pctX(9),
        y: pctY(29.2),
        size: fontSize,
        font: fontNormal,
        color: textColor,
      });
      
      // First Name - second column (around 44% from left)
      page.drawText(nameParts.firstName, {
        x: pctX(44),
        y: pctY(29.2),
        size: fontSize,
        font: fontNormal,
        color: textColor,
      });
      
      // Middle Initial - third column (around 76% from left)
      if (nameParts.middleInitial) {
        page.drawText(nameParts.middleInitial, {
          x: pctX(76),
          y: pctY(29.2),
          size: fontSize,
          font: fontNormal,
          color: textColor,
        });
      }
      
      // Last 4 digits of ID - end of ID number line (around 77% from left, 32% from top)
      const formattedId = formatIdNumber(lastSixDigits);
      if (formattedId) {
        page.drawText(formattedId, {
          x: pctX(77),
          y: pctY(31.8),
          size: 16,
          font: fontNormal,
          color: textColor,
        });
      }
      
      // Business Name - below "Business Name" header (around 9% left, 41.5% from top)
      page.drawText("Kairos Security", {
        x: pctX(9),
        y: pctY(41.5),
        size: fontSize,
        font: fontNormal,
        color: textColor,
      });
      
      // Business License Number (around 64% left, 41.5% from top)
      page.drawText("F28623301", {
        x: pctX(64),
        y: pctY(41.5),
        size: fontSize,
        font: fontNormal,
        color: textColor,
      });
      
      // Instructor Name - after label (around 22% left, 45.3% from top)
      page.drawText("Stephen Taylor", {
        x: pctX(22),
        y: pctY(45.3),
        size: smallFontSize,
        font: fontNormal,
        color: textColor,
      });
      
      // Business Representative Name - after label (around 36% left, 47.3% from top)
      page.drawText("Stephen Taylor", {
        x: pctX(36),
        y: pctY(47.3),
        size: smallFontSize,
        font: fontNormal,
        color: textColor,
      });
      
      // Course Completion Date - after label (around 43.5% left, 49.5% from top)
      const formattedDate = formatDate(date);
      page.drawText(formattedDate, {
        x: pctX(43.5),
        y: pctY(49.5),
        size: smallFontSize,
        font: fontNormal,
        color: textColor,
      });
      
      // X in the Yes checkbox (around 43% left, 52% from top)
      page.drawText("X", {
        x: pctX(43),
        y: pctY(52),
        size: smallFontSize,
        font,
        color: textColor,
      });
      
      // Instructor Signature - "Stephen Taylor" in cursive-like style (around 35% left, 53% from top)
      // Using italic font for signature appearance
      page.drawText("Stephen Taylor", {
        x: pctX(42),
        y: pctY(53.5),
        size: 16,
        font: fontNormal,
        color: textColor,
      });
      
      // Business Representative Signature (around 35% left, 56% from top)
      page.drawText("Stephen Taylor", {
        x: pctX(42),
        y: pctY(56.5),
        size: 16,
        font: fontNormal,
        color: textColor,
      });
    }

    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated successfully", {
      size: pdfBytes.length,
      pageWidth,
      pageHeight,
    });

    return pdfBytes;
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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

    const { name, email, date, registrationNumber, lastSixDigits, courseType } = validation.data;

    // Generate PDF in background
    const pdfBytes = await generateCertificatePDF(name, date, courseType || 'level2', lastSixDigits);
    
    // Convert PDF to base64 for email attachment
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    const resend = new Resend(RESEND_API_KEY);

    const emailPayload = {
      from: "Kairos Security Academy <info@kairossecurityacademy.com>",
      to: [email],
      subject: courseType === 'pepper-spray' 
        ? "Your Pepper Spray Training Certificate" 
        : "Your Level 2 Security Officer Certificate",
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
              
              <p>You have successfully completed the <strong>${courseType === 'pepper-spray' ? 'Pepper Spray Training Course' : 'Level Two Training Course'}</strong> for Private Security Program.</p>
              
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
