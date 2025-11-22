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
    console.log('[progress-video-complete] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[progress-video-complete] No Authorization header');
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

    const jwt = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError) {
      console.error('[progress-video-complete] Auth error:', userError.message);
    }
    
    if (!user) {
      console.error('[progress-video-complete] No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[progress-video-complete] Authenticated user:', user.id);

    const body = await req.json();
    const course_id = String(body?.course_id || '').trim();
    const section_id = Number(body?.section_id);
    const seconds_watched = Number(body?.seconds_watched || 0);
    const total_duration = Number(body?.total_duration || 0);
    const has_quiz = Boolean(body?.has_quiz);

    if (!course_id || !Number.isFinite(section_id)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[progress-video-complete] Processing:', { 
      userId: user.id, 
      course_id, 
      section_id, 
      has_quiz 
    });

    // Prepare payload for upsert
    const payload: any = {
      user_id: user.id,
      course_type: course_id,
      section_id: section_id,
      video_watch_time_seconds: Math.max(0, Math.floor(seconds_watched)),
      video_completed: total_duration > 0 ? (seconds_watched / total_duration) >= 0.999 : true,
      has_quiz,
      completed_at: new Date().toISOString(),
      video_started_at: new Date().toISOString(),
    };

    // If no quiz, also mark as section_completed
    if (!has_quiz) {
      payload.completed = true;
      payload.section_completed = true;
    }

    // Use native upsert to handle race conditions atomically
    const { error: upsertError } = await supabase
      .from('course_progress')
      .upsert(payload, {
        onConflict: 'user_id,course_type,section_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('[progress-video-complete] Error:', upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[progress-video-complete] Upserted record:', { 
      userId: user.id,
      course_id,
      section_id,
      video_completed: payload.video_completed
    });

    // Return updated status
    const { data: updated } = await supabase
      .from('course_progress')
      .select('video_completed, quiz_passed, section_completed, has_quiz')
      .eq('user_id', user.id)
      .eq('course_type', course_id)
      .eq('section_id', section_id)
      .single();

    return new Response(JSON.stringify({ 
      ok: true, 
      progress: updated 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[progress-video-complete] Exception:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
