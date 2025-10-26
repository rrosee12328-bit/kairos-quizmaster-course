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

    const url = new URL(req.url);
    const course_id = url.searchParams.get('course_id');

    if (!course_id) {
      return new Response(JSON.stringify({ error: 'course_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[progress-allowed] Fetching for:', { userId: user.id, course_id });

    // Get course summary
    const { data: summary } = await supabase
      .from('course_completions_summary')
      .select('last_unlocked_section, course_completed')
      .eq('user_id', user.id)
      .eq('course_type', course_id)
      .maybeSingle();

    const lastUnlocked = summary?.last_unlocked_section || 1;
    const courseCompleted = summary?.course_completed || false;

    // Get all completed sections
    const { data: completedSections } = await supabase
      .from('course_progress')
      .select('section_id, section_completed, video_completed, quiz_passed, has_quiz')
      .eq('user_id', user.id)
      .eq('course_type', course_id)
      .eq('section_completed', true)
      .order('section_id');

    const completed = completedSections?.map(s => s.section_id) || [];
    
    // Allowed sections: all completed + the next unlocked one
    const allowed = [...completed];
    if (!courseCompleted && !allowed.includes(lastUnlocked)) {
      allowed.push(lastUnlocked);
    }

    console.log('[progress-allowed] Result:', { 
      lastUnlocked, 
      courseCompleted, 
      completed, 
      allowed 
    });

    return new Response(JSON.stringify({
      last_unlocked_section: lastUnlocked,
      course_completed: courseCompleted,
      completed_sections: completed,
      allowed_sections: allowed,
      all_progress: completedSections || []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[progress-allowed] Exception:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
