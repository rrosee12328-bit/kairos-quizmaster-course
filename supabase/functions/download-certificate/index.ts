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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const url = new URL(req.url)
    const registrationNumber = url.searchParams.get('registration')

    if (!registrationNumber) {
      return new Response('Missing registration number', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Use service role to fetch certificate
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Look up the certificate and verify ownership
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('registration_number', registrationNumber)
      .eq('user_id', user.id)  // Only allow users to download their own certificates
      .single()

    if (error || !certificate) {
      return new Response('Certificate not found or access denied', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Redirect to certificate preview page with pre-filled data
    const redirectUrl = `${url.origin}/certificate-preview?name=${encodeURIComponent(certificate.student_name)}&registration=${encodeURIComponent(certificate.registration_number)}&date=${encodeURIComponent(certificate.completion_date)}`

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
