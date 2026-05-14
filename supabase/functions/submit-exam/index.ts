// Server-side exam scoring: the only path that creates course_completions,
// certificates, and level3_approvals. Clients never insert these directly.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-side answer keys (mirror src/data/*ExamQuestions.ts ordering).
const ANSWER_KEYS: Record<string, number[]> = {
  level2: [0,1,3,0,0,1,2,2,0,3,0,1,1,3,3,2,0,0,1,2,0,0,3,3,1,3,3,1,2,0,1,2],
  level3: [2,1,2,0,1,1,3,0,0,2,3,0,1,3,2,2,3,1,1,0,3,3,0,1,2,0,1,3,3,1,2,1,0,2,3,0,0,0,2,3,1,0,2,1,3,0,0,2,0,1,3,1,0,2,0,2,1,0,1,2,3,1,2,2,3,1,3],
  'level-4': [1,3,0,2,1,1,3,0,2,0,0,3,3,0,0,3,0,2,0,0,2,1,0,1,3,3,3,0,1,1,0],
  'pepper-spray': [0,3,0,0,0,0,0,2,0,1,3,0,3,3,0,0,0],
};

// course_type aliases used for storage in the DB
const STORAGE_COURSE_TYPE: Record<string, string> = {
  level2: 'level2',
  level3: 'level3',
  'level-4': 'level-4',
  'pepper-spray': 'pepper-spray',
};

const PASSING_PERCENTAGE: Record<string, number> = {
  level2: 70, level3: 70, 'level-4': 70, 'pepper-spray': 70,
};
const MAX_FAILED_ATTEMPTS = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const courseType = String(body?.course_type || '').trim();
    const answers = body?.answers;
    const startedAt = body?.started_at;

    const key = ANSWER_KEYS[courseType];
    if (!key) {
      return new Response(JSON.stringify({ error: 'Invalid course_type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!Array.isArray(answers) || answers.length !== key.length) {
      return new Response(JSON.stringify({ error: 'Invalid answers payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const dbCourseType = STORAGE_COURSE_TYPE[courseType];

    // Enforce attempt cap server-side.
    const { data: completions } = await admin
      .from('course_completions')
      .select('id, passed')
      .eq('user_id', user.id)
      .eq('course_type', dbCourseType);
    const hasPassedBefore = (completions || []).some((c: any) => c.passed);
    const failedAttempts = (completions || []).filter((c: any) => !c.passed).length;
    if (!hasPassedBefore && failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return new Response(JSON.stringify({ error: 'Maximum attempts reached' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If user has already passed, return the existing passing record (idempotent).
    if (hasPassedBefore) {
      const { data: existingPass } = await admin
        .from('course_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_type', dbCourseType)
        .eq('passed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: existingCert } = await admin
        .from('certificates')
        .select('registration_number')
        .eq('completion_id', existingPass?.id || '')
        .maybeSingle();
      return new Response(JSON.stringify({
        score: existingPass?.score, total_questions: existingPass?.total_questions,
        percentage: existingPass?.percentage, passed: true,
        registration_number: existingCert?.registration_number || null,
        already_passed: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Score
    let score = 0;
    for (let i = 0; i < key.length; i++) {
      if (Number(answers[i]) === key[i]) score++;
    }
    const total = key.length;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= (PASSING_PERCENTAGE[courseType] ?? 70);

    const endedAt = new Date().toISOString();
    const startedIso = (typeof startedAt === 'string' && !isNaN(Date.parse(startedAt)))
      ? startedAt : new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const durationSeconds = Math.max(0, Math.floor((Date.parse(endedAt) - Date.parse(startedIso)) / 1000));

    // Pull caller IP / UA from request
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const ua = req.headers.get('user-agent') || null;

    const { data: insertedCompletion, error: completionErr } = await admin
      .from('course_completions')
      .insert({
        user_id: user.id,
        course_type: dbCourseType,
        score, total_questions: total, percentage, passed,
        started_at: startedIso, ended_at: endedAt, duration_seconds: durationSeconds,
        ip_address: ip, user_agent: ua,
      })
      .select()
      .single();

    if (completionErr || !insertedCompletion) {
      console.error('completion insert failed', completionErr);
      return new Response(JSON.stringify({ error: 'Failed to save completion' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let registrationNumber: string | null = null;
    let approvalCode: string | null = null;
    let approvalExpiresAt: string | null = null;

    if (passed) {
      // Look up enrollment for student name + ID details
      const { data: enrollment } = await admin
        .from('enrollments')
        .select('first_name, last_name, last_six_digits, identification_type')
        .eq('user_id', user.id)
        .eq('course_type', dbCourseType)
        .maybeSingle();

      if (courseType === 'level2' || courseType === 'pepper-spray') {
        if (enrollment) {
          const { data: regNumData } = await admin.rpc('generate_registration_number');
          if (regNumData) {
            const { data: cert } = await admin
              .from('certificates')
              .insert({
                user_id: user.id,
                completion_id: insertedCompletion.id,
                course_type: dbCourseType,
                student_name: `${enrollment.first_name} ${enrollment.last_name}`,
                completion_date: insertedCompletion.completed_at.split('T')[0],
                last_six_digits: enrollment.last_six_digits,
                identification_type: enrollment.identification_type,
                registration_number: regNumData,
              })
              .select('registration_number')
              .single();
            registrationNumber = cert?.registration_number ?? null;
          }
        }
      } else if (courseType === 'level3') {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: approvalCodeRpc } = await admin.rpc('generate_level3_approval_code');
        if (approvalCodeRpc) {
          const { data: approval } = await admin
            .from('level3_approvals')
            .insert({
              user_id: user.id,
              completion_id: insertedCompletion.id,
              approval_code: approvalCodeRpc,
              expires_at: expiresAt,
            })
            .select('approval_code, expires_at')
            .single();
          approvalCode = approval?.approval_code ?? null;
          approvalExpiresAt = approval?.expires_at ?? null;
        }
      }
    }

    return new Response(JSON.stringify({
      score, total_questions: total, percentage, passed,
      registration_number: registrationNumber,
      approval_code: approvalCode,
      approval_expires_at: approvalExpiresAt,
      completion_id: insertedCompletion.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('submit-exam error', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});