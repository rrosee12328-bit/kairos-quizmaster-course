// Server-side conversion tracking for Meta Conversions API and Google Enhanced Conversions
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Meta Conversions API Configuration
const META_PIXEL_ID = Deno.env.get("META_PIXEL_ID") || "";
const META_ACCESS_TOKEN = Deno.env.get("META_CONVERSION_API_TOKEN") || "";

// Google Enhanced Conversions Configuration  
const GOOGLE_ADS_ID = Deno.env.get("GOOGLE_ADS_ID") || "";
const GOOGLE_ADS_CONVERSION_ID = Deno.env.get("GOOGLE_ADS_CONVERSION_ID") || "";

interface ConversionEvent {
  eventName: string;
  eventData: {
    courseType: string;
    coursePrice: number;
    transactionId?: string;
    userEmail?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  userAgent?: string;
  ipAddress?: string;
}

async function sendToMetaConversionsAPI(event: ConversionEvent) {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN || META_PIXEL_ID === "YOUR_META_PIXEL_ID") {
    console.log("[Meta Conversions API] Not configured, skipping");
    return null;
  }

  try {
    const eventTime = Math.floor(Date.now() / 1000);
    
    // Build user data for matching
    const userData: any = {};
    if (event.eventData.userEmail) {
      // Meta requires hashed email
      const encoder = new TextEncoder();
      const data = encoder.encode(event.eventData.userEmail.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      userData.em = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (event.eventData.firstName) {
      const encoder = new TextEncoder();
      const data = encoder.encode(event.eventData.firstName.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      userData.fn = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (event.eventData.lastName) {
      const encoder = new TextEncoder();
      const data = encoder.encode(event.eventData.lastName.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      userData.ln = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (event.eventData.phone) {
      const encoder = new TextEncoder();
      const data = encoder.encode(event.eventData.phone.replace(/\D/g, ''));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      userData.ph = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (event.ipAddress) {
      userData.client_ip_address = event.ipAddress;
    }
    if (event.userAgent) {
      userData.client_user_agent = event.userAgent;
    }

    const payload = {
      data: [{
        event_name: event.eventName === 'Purchase' ? 'Kairos_Enrollment_Purchase' : event.eventName,
        event_time: eventTime,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          content_name: event.eventData.courseType,
          content_category: 'Security Training',
          value: event.eventData.coursePrice,
          currency: 'GBP',
          transaction_id: event.eventData.transactionId,
        },
      }],
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log('[Meta Conversions API] Response:', result);
    return result;
  } catch (error) {
    console.error('[Meta Conversions API] Error:', error);
    return null;
  }
}

async function sendToGoogleEnhancedConversions(event: ConversionEvent) {
  if (!GOOGLE_ADS_ID || !GOOGLE_ADS_CONVERSION_ID || GOOGLE_ADS_ID === "AW-XXXXXXXXXX") {
    console.log("[Google Enhanced Conversions] Not configured, skipping");
    return null;
  }

  try {
    // Google Enhanced Conversions requires the Google Ads API
    // This is a simplified implementation - full implementation would require OAuth and API setup
    console.log('[Google Enhanced Conversions] Event would be sent:', {
      conversion_action: GOOGLE_ADS_CONVERSION_ID,
      email: event.eventData.userEmail,
      value: event.eventData.coursePrice,
      currency: 'GBP',
      transaction_id: event.eventData.transactionId,
    });
    
    // For production, implement full Google Ads API integration
    return { status: 'simulated' };
  } catch (error) {
    console.error('[Google Enhanced Conversions] Error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body first to check for webhook flag
    const requestBody = await req.json();

    // Require either a valid user JWT or the service role key (server-to-server from stripe-webhook)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isServiceRole = SERVICE_ROLE_KEY && token === SERVICE_ROLE_KEY;
    if (!isServiceRole) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const { data: claims, error: userError } = await supabaseClient.auth.getClaims(token);
      if (userError || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build event from request body
    const event: ConversionEvent = {
      eventName: requestBody.eventName,
      eventData: requestBody.eventData,
    };
    
    // Get user IP and user agent for better matching
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     undefined;
    
    event.userAgent = userAgent;
    event.ipAddress = ipAddress;

    console.log('[Server-side Tracking] Processing event:', event.eventName);

    // Send to both platforms in parallel
    const [metaResult, googleResult] = await Promise.all([
      sendToMetaConversionsAPI(event),
      sendToGoogleEnhancedConversions(event),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        meta: metaResult,
        google: googleResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Server-side Tracking] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
