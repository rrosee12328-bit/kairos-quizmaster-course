import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Auth is optional for guest checkout
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | null = null;
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        userEmail = data.user?.email ?? null;
        userId = data.user?.id ?? null;
      } catch (_) {
        userEmail = null;
        userId = null;
      }
    }

    const { priceId, email, courseType } = await req.json();
    if (!priceId) throw new Error("Price ID is required");

    console.log("[create-checkout] Starting for:", userEmail || "guest", priceId, courseType);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Try to map to an existing Stripe customer when we have email
    let customerId: string | undefined = undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("[create-checkout] Found customer:", customerId);
      }
    }

    const origin = req.headers.get("origin") || "https://";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : (userEmail || (typeof email === 'string' ? email : undefined) || undefined),
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/auth?redirect=/course/${courseType || 'level2'}&payment=success&course=${courseType || 'level2'}`,
      cancel_url: `${origin}/checkout/${courseType || 'level2'}?payment=canceled`,
      metadata: {
        courseType: courseType || 'unknown',
        userId: userId || 'guest'
      }
    });

    console.log("[create-checkout] Session:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-checkout] ERROR:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
