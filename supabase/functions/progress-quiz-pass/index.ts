// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const course_id = String(body?.course_id || '').trim();
    const section_id = Number(body?.section_id);

    if (!course_id || !Number.isFinite(section_id)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[progress-quiz-pass] Processing:', { 
      userId: user.id, 
      course_id, 
      section_id 
    });

    // Update quiz_passed and mark section as completed
    const { error: updateError } = await supabase
      .from('course_progress')
      .update({
        quiz_passed: true,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('course_type', course_id)
      .eq('section_id', section_id);

    if (updateError) {
      console.error('[progress-quiz-pass] Error:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return updated status
    const { data: updated } = await supabase
      .from('course_progress')
      .select('video_completed, quiz_passed, section_completed, has_quiz')
      .eq('user_id', user.id)
      .eq('course_type', course_id)
      .eq('section_id', section_id)
      .single();

    console.log('[progress-quiz-pass] Quiz passed, section completed:', updated);

    return new Response(JSON.stringify({ 
      ok: true, 
      progress: updated,
      section_completed: updated?.section_completed || false
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[progress-quiz-pass] Exception:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
