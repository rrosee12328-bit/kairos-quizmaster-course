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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
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

    // Fetch enrollments that match the email but don't have a user_id
    const { data: enrollments, error: fetchError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('email', userEmail)
      .is('user_id', null);

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

    console.log(`Found ${enrollments.length} enrollments to sync`);

    // Update enrollments with user_id - using service role for privileged operation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const enrollmentIds = enrollments.map(e => e.id);
    
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({ user_id: userId })
      .in('id', enrollmentIds);

    if (updateError) {
      console.error('Error updating enrollments:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to sync enrollments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully synced ${enrollments.length} enrollments`);

    return new Response(
      JSON.stringify({ 
        message: 'Enrollments synced successfully',
        synced: enrollments.length
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
