import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user using the provided JWT explicitly
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = user.email;
    const userId = user.id;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing enrollments for user: ${userId}, email: ${userEmail}`);

    // Use service role to bypass RLS for reading enrollments that aren't linked yet
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch enrollments that match the email. Some older purchases/history rows
    // may be unlinked or tied to a previous auth user id for the same email.
    const { data: enrollments, error: fetchError } = await supabaseAdmin
      .from('enrollments')
      .select('id, user_id, course_type')
      .ilike('email', userEmail);

    if (fetchError) {
      console.error('Error fetching enrollments:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch enrollments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No enrollments to sync',
          synced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const enrollmentIds = enrollments.map(e => e.id);
    const previousUserIds = Array.from(
      new Set(
        enrollments
          .map((e) => e.user_id)
          .filter((id): id is string => Boolean(id) && id !== userId)
      )
    );
    
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({ 
        user_id: userId,
        enrollment_status: 'enrolled'
      })
      .in('id', enrollmentIds);

    if (updateError) {
      console.error('Error updating enrollments:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to sync enrollments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Move course history/certificates that were created under an older auth id
    // for this same purchase email so Profile shows courses previously taken.
    if (previousUserIds.length > 0) {
      const tablesToRelink = [
        'course_progress',
        'course_completions',
        'course_completions_summary',
        'certificates',
        'level3_approvals',
      ];

      for (const table of tablesToRelink) {
        const { error: relinkError } = await supabaseAdmin
          .from(table as 'course_progress' | 'course_completions' | 'course_completions_summary' | 'certificates' | 'level3_approvals')
          .update({ user_id: userId })
          .in('user_id', previousUserIds);

        if (relinkError) {
          console.warn(`Could not relink ${table}:`, relinkError);
        }
      }
    }

    console.log(`Successfully synced ${enrollments.length} enrollments and ${previousUserIds.length} previous user ids`);

    return new Response(
      JSON.stringify({ 
        message: 'Enrollments synced successfully',
        synced: enrollments.length,
        relinked_user_ids: previousUserIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-enrollment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
