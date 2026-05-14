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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Cryptographically verify the JWT via Supabase
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const jwt = authHeader.slice(7)
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt)
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const userId = userData.user.id
    const userEmail = userData.user.email

    // Service client for database operations (bypass RLS where needed)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { completionId } = await req.json();

    if (!completionId) {
      return new Response(
        JSON.stringify({ error: 'Completion ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get completion record
    const { data: completion, error: completionError } = await supabase
      .from('course_completions')
      .select('*')
      .eq('id', completionId)
      .eq('user_id', userId)
      .eq('passed', true)
      .maybeSingle();

    if (completionError || !completion) {
      return new Response(
        JSON.stringify({ error: 'Passing completion not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if certificate already exists
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('completion_id', completionId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Certificate already exists for this completion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get most recent enrollment data for this course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('first_name, last_name, last_six_digits, identification_type')
      .eq('user_id', userId)
      .eq('course_type', completion.course_type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no enrollment exists, fall back to profile data
    let fullName: string;
    let lastSixDigits: string | undefined;
    let identificationType: string;

    if (enrollment) {
      fullName = `${enrollment.first_name} ${enrollment.last_name}`.trim();
      lastSixDigits = enrollment.last_six_digits;
      identificationType = enrollment.identification_type;
    } else {
      // Fallback to profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      if (!profile?.full_name) {
        return new Response(
          JSON.stringify({ 
            error: 'No enrollment or profile data found. Please complete enrollment first.' 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      fullName = profile.full_name;
      lastSixDigits = undefined;
      identificationType = 'Unknown';
      console.warn('Using profile fallback for certificate, no enrollment found');
    }

    // Generate registration number via RPC
    const { data: regNum, error: regErr } = await supabase.rpc('generate_registration_number')
    if (regErr || !regNum) {
      // Fallback simple generator
      const d = new Date(completion.completed_at)
      const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
      console.warn('RPC generate_registration_number failed, using fallback:', regErr)
      // Preserve course code hint by mapping
      const courseCode = completion.course_type === 'level3' ? 'L3' : completion.course_type === 'level2' ? 'L2' : 'GEN'
      ;(regNum as any) = `KTA-${courseCode}-${ymd}-${Math.floor(Math.random()*99999).toString().padStart(5,'0')}`
    }

    // Create certificate
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        completion_id: completionId,
        course_type: completion.course_type,
        student_name: fullName,
        completion_date: new Date(completion.completed_at).toISOString().split('T')[0],
        last_six_digits: lastSixDigits || '',
        identification_type: identificationType,
        registration_number: regNum as string,
      })
      .select()
      .single();

    if (certError) {
      console.error('Certificate creation error:', certError);
      return new Response(
        JSON.stringify({ error: 'Failed to create certificate', details: certError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send certificate email (best effort)
    try {
      const emailTo = userEmail || undefined
      if (emailTo) {
        await createClient(supabaseUrl, supabaseAnonKey) // lightweight client to call function with anon
          .functions.invoke('send-certificate', {
            body: {
              name: fullName,
              email: emailTo,
              date: certificate.completion_date,
              registrationNumber: certificate.registration_number,
            }
          });
      }
    } catch (emailError) {
      console.error('Error sending certificate email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificate,
        message: 'Certificate generated successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-missing-certificate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
