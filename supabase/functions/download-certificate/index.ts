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
    // Extract user from Authorization header via JWT claims
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

    function parseJwt(token: string) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''))
        return JSON.parse(jsonPayload)
      } catch (_) {
        return null
      }
    }

    const claims = jwt ? parseJwt(jwt) : null
    const userId = claims?.sub as string | undefined

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

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

    // Look up the certificate and verify ownership
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('registration_number', registrationNumber)
      .eq('user_id', userId)  // Only allow users to download their own certificates
      .single()

    if (error || !certificate) {
      return new Response('Certificate not found or access denied', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Redirect to certificate preview page with pre-filled data
    const appOrigin = req.headers.get('origin') || url.origin.replace('supabase.co','lovableproject.com')
    const redirectUrl = `${appOrigin}/certificate-preview?name=${encodeURIComponent(certificate.student_name)}&registration=${encodeURIComponent(certificate.registration_number)}&date=${encodeURIComponent(certificate.completion_date)}`

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
