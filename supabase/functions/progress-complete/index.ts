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
    const seconds_watched = Number(body?.seconds_watched || 0);

    if (!course_id || !Number.isFinite(section_id)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert into course_progress using RLS with the end-user token
    const { data: existing } = await supabase
      .from('course_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_type', course_id)
      .eq('section_id', section_id)
      .maybeSingle();

    const payload: any = {
      video_watch_time_seconds: Math.max(0, Math.floor(seconds_watched)),
      completed: true,
      completed_at: new Date().toISOString(),
    };

    let upsertError = null;

    if (existing?.id) {
      const { error } = await supabase
        .from('course_progress')
        .update(payload)
        .eq('id', existing.id);
      upsertError = error;
    } else {
      const { error } = await supabase
        .from('course_progress')
        .insert({
          user_id: user.id,
          course_type: course_id,
          section_id: section_id,
          video_started_at: new Date().toISOString(),
          ...payload,
        });
      upsertError = error;
    }

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});