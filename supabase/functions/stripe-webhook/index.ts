import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
          .eq("email", customerEmail)
          .eq("course_type", courseType);

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
            email: customerEmail,
            first_name: session.customer_details?.name?.split(" ")[0] || "User",
            last_name: session.customer_details?.name?.split(" ").slice(1).join(" ") || "Account",
            phone_number: session.customer_details?.phone || "0000000000",
            identification_type: "ssn",
            last_six_digits: "000000",
            course_type: courseType,
            enrollment_status: "enrolled",
          });

        if (insertError) {
          console.error("[stripe-webhook] Error creating enrollment:", insertError);
          throw insertError;
        }
      }

      console.log("[stripe-webhook] Enrollment processed successfully");
      
      // Send enrollment confirmation email
      try {
        console.log("[stripe-webhook] Sending enrollment confirmation email");
        const emailResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-enrollment-confirmation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: customerEmail,
              firstName: session.customer_details?.name?.split(" ")[0] || "Student",
              lastName: session.customer_details?.name?.split(" ").slice(1).join(" ") || "",
              courseType: courseType,
            }),
          }
        );
        
        if (!emailResponse.ok) {
          console.error("[stripe-webhook] Failed to send confirmation email:", await emailResponse.text());
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
