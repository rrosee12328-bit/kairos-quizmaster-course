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
    
    // Create client with user's auth token
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id)

    // Service client for database operations
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
      .eq('user_id', user.id)
      .eq('passed', true)
      .single();

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

    // Get enrollment data
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('first_name, last_name, last_six_digits, identification_type')
      .eq('user_id', user.id)
      .eq('course_type', completion.course_type)
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: 'Enrollment record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullName = `${enrollment.first_name} ${enrollment.last_name}`;

    // Create certificate
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        completion_id: completionId,
        course_type: completion.course_type,
        student_name: fullName,
        completion_date: new Date(completion.completed_at).toISOString().split('T')[0],
        last_six_digits: enrollment.last_six_digits,
        identification_type: enrollment.identification_type,
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

    // Send certificate email
    try {
      await supabase.functions.invoke('send-certificate', {
        body: {
          name: fullName,
          email: user.email,
          date: certificate.completion_date,
          registrationNumber: certificate.registration_number,
        }
      });
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
