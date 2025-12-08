import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema for enrollment data
const enrollmentDataSchema = z.object({
  email: z.string().email().max(255),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().regex(/^\d{10,15}$/).optional().or(z.literal("")),
  courseType: z.enum(['level2', 'level3', 'level4', 'pepper-spray']),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("[stripe-webhook] No webhook secret configured");
      throw new Error("Webhook secret not configured");
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log("[stripe-webhook] Event type:", event.type);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[stripe-webhook] Checkout completed:", session.id);

      const customerEmail = session.customer_email || session.customer_details?.email;
      const courseType = session.metadata?.courseType || "level2";
      const userId = session.metadata?.userId !== "guest" ? session.metadata?.userId : null;

      if (!customerEmail) {
        console.error("[stripe-webhook] No customer email found");
        return new Response(JSON.stringify({ error: "No customer email" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Validate enrollment data before processing
      const validatedData = enrollmentDataSchema.safeParse({
        email: customerEmail,
        firstName: session.customer_details?.name?.split(" ")[0] || "User",
        lastName: session.customer_details?.name?.split(" ").slice(1).join(" ") || "Account",
        phone: session.customer_details?.phone || "",
        courseType: courseType,
      });

      if (!validatedData.success) {
        console.error("[stripe-webhook] Validation failed:", validatedData.error);
        return new Response(JSON.stringify({ error: "Invalid enrollment data", details: validatedData.error.issues }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const enrollmentData = validatedData.data;

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabaseClient
        .from("enrollments")
        .select("*")
        .eq("email", customerEmail)
        .eq("course_type", courseType)
        .single();

      if (existingEnrollment) {
        console.log("[stripe-webhook] Enrollment already exists, updating status");
        // Update existing enrollment to enrolled status
        const { error: updateError } = await supabaseClient
          .from("enrollments")
          .update({ 
            enrollment_status: "enrolled",
            user_id: userId || existingEnrollment.user_id 
          })
          .eq("email", enrollmentData.email)
          .eq("course_type", enrollmentData.courseType);

        if (updateError) {
          console.error("[stripe-webhook] Error updating enrollment:", updateError);
        }
      } else {
        console.log("[stripe-webhook] Creating new enrollment");
        // Create new enrollment
        const { error: insertError } = await supabaseClient
          .from("enrollments")
          .insert({
            user_id: userId,
            email: enrollmentData.email,
            first_name: enrollmentData.firstName,
            last_name: enrollmentData.lastName,
            phone_number: enrollmentData.phone || "0000000000",
            identification_type: "ssn",
            last_six_digits: "000000",
            course_type: enrollmentData.courseType,
            enrollment_status: "enrolled",
          });

        if (insertError) {
          console.error("[stripe-webhook] Error creating enrollment:", insertError);
          throw insertError;
        }
      }

      console.log("[stripe-webhook] Enrollment processed successfully");
      
      // Get course price for tracking
      const coursePrices: Record<string, number> = {
        'level2': 55,
        'level3': 1,
        'level4': 200,
        'pepper-spray': 50,
      };
      const coursePrice = coursePrices[enrollmentData.courseType] || 0;
      
      // Track server-side conversion
      try {
        console.log("[stripe-webhook] Tracking purchase conversion");
        await supabaseClient.functions.invoke('track-conversion', {
          body: {
            eventName: 'Purchase',
            eventData: {
              courseType: enrollmentData.courseType,
              coursePrice: coursePrice,
              transactionId: session.id,
              userEmail: enrollmentData.email,
              firstName: enrollmentData.firstName,
              lastName: enrollmentData.lastName,
              phone: enrollmentData.phone,
            },
            isWebhook: true, // Flag to skip auth check
          },
        });
        console.log("[stripe-webhook] Conversion tracked successfully");
      } catch (trackError) {
        console.error("[stripe-webhook] Error tracking conversion:", trackError);
        // Don't fail the webhook if tracking fails
      }
      
      // Send enrollment confirmation email
      try {
        console.log("[stripe-webhook] Sending enrollment confirmation email");
        const emailResponse = await supabaseClient.functions.invoke('send-enrollment-confirmation', {
          body: {
            email: enrollmentData.email,
            firstName: enrollmentData.firstName,
            lastName: enrollmentData.lastName,
            courseType: enrollmentData.courseType,
          },
        });
        
        if (emailResponse.error) {
          console.error("[stripe-webhook] Failed to send confirmation email:", emailResponse.error);
        } else {
          console.log("[stripe-webhook] Confirmation email sent successfully");
        }
      } catch (emailError) {
        console.error("[stripe-webhook] Error sending confirmation email:", emailError);
        // Don't fail the webhook if email fails
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe-webhook] ERROR:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
