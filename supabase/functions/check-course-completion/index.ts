// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Course total durations in seconds (based on actual video content lengths)
const COURSE_DURATIONS: Record<string, number> = {
  'level2': 60 * 60 * 6, // 6 hours
  'level3': 60 * 60 * 3, // 3 hours (actual video content length)
  'level4': 2400, // ~40 minutes (single video section, actual duration ~2308s)
  'pepper_spray': 60 * 20, // 20 minutes
};

const MAX_FAILED_ATTEMPTS = 3;

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

    // 1. Check if user has enrolled/purchased the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('enrollment_status')
      .eq('user_id', user.id)
      .eq('course_type', course_type)
      .in('enrollment_status', ['enrolled', 'completed'])
      .maybeSingle();

    if (enrollmentError) {
      console.error('[check-course-completion] Enrollment check error:', enrollmentError);
    }

    if (!enrollment) {
      return new Response(JSON.stringify({ 
        error: 'Course not purchased',
        exam_unlocked: false,
        completion_percentage: 0,
        reason: 'You must purchase this course before accessing the exam.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Note: Level 2 prerequisite removed - not our responsibility to enforce
    // Level 3 completion requires scheduling in-person Part 2 training

    // 3. Check exam attempt history
    const { data: completions, error: completionsError } = await supabase
      .from('course_completions')
      .select('id, passed, attempt_number')
      .eq('user_id', user.id)
      .eq('course_type', course_type)
      .order('attempt_number', { ascending: false });

    const hasPassedBefore = completions?.some(c => c.passed) || false;
    const failedAttempts = completions?.filter(c => !c.passed).length || 0;
    const totalAttempts = completions?.length || 0;

    console.log('[check-course-completion] Attempt history:', {
      userId: user.id,
      course_type,
      totalAttempts,
      failedAttempts,
      hasPassedBefore,
      maxFailedAttempts: MAX_FAILED_ATTEMPTS
    });

    // If user has 3+ failed attempts without passing, require re-purchase
    if (failedAttempts >= MAX_FAILED_ATTEMPTS && !hasPassedBefore) {
      return new Response(JSON.stringify({ 
        error: 'Maximum attempts reached',
        exam_unlocked: false,
        completion_percentage: 100,
        failed_attempts: failedAttempts,
        max_attempts: MAX_FAILED_ATTEMPTS,
        reason: `You have used all ${MAX_FAILED_ATTEMPTS} exam attempts. Please re-purchase the course to try again.`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Calculate total watch time from all sections
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
    
    // Unlock exam if: 90% watch time completed OR user has already attempted the exam (and has attempts left)
    const watchTimeUnlocked = completionPercentage >= 90;
    const hasAttemptsRemaining = failedAttempts < MAX_FAILED_ATTEMPTS;
    const previouslyAttempted = totalAttempts > 0;
    
    // Allow exam access if they've watched enough OR they've already taken it before (still have attempts)
    const isUnlocked = watchTimeUnlocked || (previouslyAttempted && hasAttemptsRemaining);

    console.log('[check-course-completion]', {
      userId: user.id,
      course_type,
      hasEnrollment: !!enrollment,
      totalWatchTime,
      expectedDuration,
      completionPercentage: completionPercentage.toFixed(2),
      watchTimeUnlocked,
      previouslyAttempted,
      failedAttempts,
      hasAttemptsRemaining,
      isUnlocked
    });

    let reason = 'Exam unlocked';
    if (!isUnlocked) {
      reason = `Complete ${(90 - completionPercentage).toFixed(1)}% more of the course to unlock the exam.`;
    } else if (previouslyAttempted && !watchTimeUnlocked) {
      const attemptsLeft = MAX_FAILED_ATTEMPTS - failedAttempts;
      reason = `Exam unlocked. You have ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`;
    }

    return new Response(JSON.stringify({
      total_watch_time_seconds: totalWatchTime,
      expected_duration_seconds: expectedDuration,
      completion_percentage: Math.round(completionPercentage * 10) / 10,
      exam_unlocked: isUnlocked,
      has_enrollment: true,
      failed_attempts: failedAttempts,
      max_attempts: MAX_FAILED_ATTEMPTS,
      attempts_remaining: MAX_FAILED_ATTEMPTS - failedAttempts,
      reason
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