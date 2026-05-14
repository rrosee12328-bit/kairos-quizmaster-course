import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const registrationNumber = url.searchParams.get('registration')

    if (!registrationNumber) {
      return new Response('Missing registration number', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Validate registration number format (do NOT leak whether it exists)
    if (!/^[A-Z0-9-]{1,64}$/.test(registrationNumber)) {
      return new Response('Invalid registration number', {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Redirect to the authenticated certificate preview page.
    // The preview page itself enforces auth + ownership and fetches PII via RLS.
    // We intentionally do NOT include student name or ID digits in the URL.
    const appOriginParam = url.searchParams.get('o')
    const appOrigin = appOriginParam || req.headers.get('origin') || 'https://6f154051-1d90-4f63-8797-9c4db01924c2.lovableproject.com'
    const redirectUrl = `${appOrigin}/certificate-preview?registration=${encodeURIComponent(registrationNumber)}&download=true`

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl
      }
    })
  } catch (error: any) {
    console.error('Error in download-certificate function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})
