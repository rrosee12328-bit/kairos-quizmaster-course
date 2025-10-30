// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Course total durations in seconds
const COURSE_DURATIONS: Record<string, number> = {
  'level2': 60 * 60 * 6, // 6 hours
  'level3': 60 * 60 * 6, // 6 hours  
  'level4': 60 * 60 * 15, // 15 hours
  'pepper_spray': 60 * 20, // 20 minutes
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

    const jwt = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const course_type = String(body?.course_type || '').trim();

    if (!course_type) {
      return new Response(JSON.stringify({ error: 'Missing course_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all progress records for this user and course
    const { data: progress, error: progressError } = await supabase
      .from('course_progress')
      .select('video_watch_time_seconds')
      .eq('user_id', user.id)
      .eq('course_type', course_type);

    if (progressError) {
      console.error('[check-course-completion] Error fetching progress:', progressError);
      return new Response(JSON.stringify({ error: progressError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate total watch time
    const totalWatchTime = (progress || []).reduce(
      (sum, record) => sum + (record.video_watch_time_seconds || 0),
      0
    );

    const expectedDuration = COURSE_DURATIONS[course_type] || 0;
    const completionPercentage = expectedDuration > 0 
      ? (totalWatchTime / expectedDuration) * 100 
      : 0;
    
    const isUnlocked = completionPercentage >= 90;

    console.log('[check-course-completion]', {
      userId: user.id,
      course_type,
      totalWatchTime,
      expectedDuration,
      completionPercentage: completionPercentage.toFixed(2),
      isUnlocked
    });

    return new Response(JSON.stringify({
      total_watch_time_seconds: totalWatchTime,
      expected_duration_seconds: expectedDuration,
      completion_percentage: Math.round(completionPercentage * 10) / 10,
      exam_unlocked: isUnlocked
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[check-course-completion] Exception:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});