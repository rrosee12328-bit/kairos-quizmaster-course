import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  userId: z.string().uuid().optional(),
});

type SupabaseAdmin = ReturnType<typeof createClient>;

async function getProfileEmail(admin: SupabaseAdmin, userId: string) {
  const { data } = await admin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  return data?.email ?? '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const targetUserId = parsed.data.userId ?? user.id;

    if (targetUserId !== user.id) {
      const { data: isAdmin } = await admin.rpc('is_admin', { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const targetEmail = targetUserId === user.id
      ? user.email ?? await getProfileEmail(admin, targetUserId)
      : await getProfileEmail(admin, targetUserId);

    if (targetEmail) {
      const { data: matchingEnrollments } = await admin
        .from('enrollments')
        .select('id')
        .ilike('email', targetEmail);

      const enrollmentIds = (matchingEnrollments ?? []).map((row: { id: string }) => row.id);
      if (enrollmentIds.length > 0) {
        await admin
          .from('enrollments')
          .update({ user_id: targetUserId, enrollment_status: 'enrolled' })
          .in('id', enrollmentIds);
      }
    }

    const [profileResult, enrollmentResult, completionResult, certificateResult, approvalResult] = await Promise.all([
      admin.from('profiles').select('*').eq('id', targetUserId).maybeSingle(),
      admin.from('enrollments')
        .select('id, course_type, enrollment_status, created_at, first_name, last_name')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false }),
      admin.from('course_completions')
        .select('id, course_type, score, total_questions, percentage, passed, completed_at, attempt_number, started_at, ended_at, duration_seconds')
        .eq('user_id', targetUserId)
        .order('completed_at', { ascending: false }),
      admin.from('certificates')
        .select('id, course_type, registration_number, completion_date, student_name, completion_id')
        .eq('user_id', targetUserId)
        .order('issued_at', { ascending: false }),
      admin.from('level3_approvals')
        .select('approval_code, expires_at, used')
        .eq('user_id', targetUserId)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const blockingError = profileResult.error ?? enrollmentResult.error ?? completionResult.error ?? certificateResult.error;
    if (blockingError) {
      console.error('[get-profile-data] query failed', blockingError);
      return new Response(JSON.stringify({ error: 'Failed to load profile data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      profile: profileResult.data
        ? { ...profileResult.data, level3_approval_code: approvalResult.data?.approval_code ?? null }
        : null,
      enrollments: enrollmentResult.data ?? [],
      completions: completionResult.data ?? [],
      certificates: certificateResult.data ?? [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-profile-data] unexpected error', error);
    return new Response(JSON.stringify({ error: 'Unexpected error loading profile data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});