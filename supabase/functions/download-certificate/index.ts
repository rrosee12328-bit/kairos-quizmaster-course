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

    // Look up the certificate by registration number
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('registration_number', registrationNumber)
      .single()

    if (error || !certificate) {
      return new Response('Certificate not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Redirect to certificate preview page with auto-download flag
    const appOriginParam = url.searchParams.get('o')
    const appOrigin = appOriginParam || req.headers.get('origin') || 'https://6f154051-1d90-4f63-8797-9c4db01924c2.lovableproject.com'
    const redirectUrl = `${appOrigin}/certificate-preview?name=${encodeURIComponent(certificate.student_name)}&id=${encodeURIComponent(certificate.identification_type)}&lastSix=${encodeURIComponent(certificate.last_six_digits)}&date=${encodeURIComponent(certificate.completion_date)}&download=true`

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
