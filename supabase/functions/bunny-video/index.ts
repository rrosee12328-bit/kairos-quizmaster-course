import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const bunnyRequestSchema = z.object({
  action: z.enum(['getVideo', 'createVideo', 'listVideos', 'getSignedUrl']),
  videoId: z.string().regex(/^[a-zA-Z0-9-]+$/).optional(),
  title: z.string().min(1).max(255).optional(),
  collectionId: z.string().optional(),
  libraryId: z.string().regex(/^\d+$/),
  expiresInHours: z.number().min(1).max(720).optional() // Max 30 days
});

const BUNNY_API_KEY = Deno.env.get('BUNNY_API_KEY');
const DEFAULT_SIGNING_KEY = Deno.env.get('BUNNY_VIDEO_LIBRARY_KEY');

const accountRecoveryEmails: Record<string, string[]> = {
  'rrosee12390@gmail.com': [
    'rrosee12390@gmail.com',
    'rrosee12328@gmail.com',
    'swiftskillnow@gmail.com',
    'rickylrose@yahoo.com',
  ],
};

async function getLinkedUserIds(serviceClient: ReturnType<typeof createClient>, userId: string, email?: string) {
  const normalizedEmail = (email ?? '').trim().toLowerCase();
  const linkedEmails = accountRecoveryEmails[normalizedEmail];

  if (!linkedEmails?.length) {
    return [userId];
  }

  const { data, error } = await serviceClient
    .from('profiles')
    .select('id')
    .in('email', linkedEmails);

  if (error) {
    console.error('[bunny-video] linked profile lookup failed', error);
    return [userId];
  }

  return Array.from(new Set([userId, ...(data ?? []).map((row: { id: string }) => row.id)]));
}

function getSigningKey(libraryId: string): string | null {
  const envName = `BUNNY_SIGNING_KEY_${libraryId}`;
  const key = Deno.env.get(envName);
  return key || DEFAULT_SIGNING_KEY || null;
}

function getApiKey(libraryId: string): string | null {
  const specific = Deno.env.get(`BUNNY_API_KEY_${libraryId}`);
  return specific || BUNNY_API_KEY || null;
}

async function generateSignedUrl(libraryId: string, videoId: string, expiresInHours: number = 24): Promise<string> {
  const signingKey = getSigningKey(libraryId);
  if (!signingKey) {
    throw new Error(`Signing key not configured. Set BUNNY_SIGNING_KEY_${libraryId} or BUNNY_VIDEO_LIBRARY_KEY`);
  }

  const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
  
  // Embed token auth: SHA256_HEX(token_security_key + video_id + expiration)
  const signatureString = `${signingKey}${videoId}${expiryTimestamp}`;
  
  // Generate SHA256 hash (hex)
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiryTimestamp}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require auth: this function streams paid course content.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = typeof claimsData.claims.email === 'string' ? claimsData.claims.email : undefined;

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const referrer = req.headers.get('referer') || req.headers.get('origin') || 'unknown';
    const device = /Mobile|Android|iPhone/i.test(userAgent) ? 'mobile' : 'desktop';
    
    console.log(`Bunny video request`, {
      device,
      os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'Mac' : userAgent.includes('Linux') ? 'Linux' : 'Unknown',
      ua: userAgent,
      referrer
    });

    // API key is resolved per-library using getApiKey(libraryId)

    const body = await req.json();
    
    // Validate input
    const validationResult = bunnyRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request parameters', 
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, videoId, title, collectionId, libraryId, expiresInHours } = validationResult.data;

    // Authorization: enrollment or admin check.
    // create/get raw video require admin role.
    // listVideos is needed by the student Level 2 course page, so it requires
    // enrollment in the course matching this library, or admin.
    // getSignedUrl requires enrollment in the course matching this library, or admin.
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: adminRole } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'security_admin'])
      .limit(1)
      .maybeSingle();
    const isAdmin = !!adminRole;
    const linkedUserIds = await getLinkedUserIds(serviceClient, userId, userEmail);

    const libraryCourseMap: Record<string, string> = {
      '510506': 'level2',
      '506173': 'level3',
      '512706': 'level4',
      '512130': 'pepper-spray',
    };

    const courseAliases: Record<string, string[]> = {
      level2: ['level2'],
      level3: ['level3'],
      level4: ['level4', 'level-4'],
      'pepper-spray': ['pepper-spray', 'pepper_spray'],
    };

    if (action === 'createVideo' || action === 'getVideo') {
      // Admin-only operations against the Bunny management API.
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: admin only' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (!isAdmin) {
      const courseType = libraryCourseMap[libraryId];
      if (!courseType) {
        return new Response(
          JSON.stringify({ error: 'Unknown course library' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const { data: enrollment } = await serviceClient
        .from('enrollments')
        .select('id, enrollment_status')
        .in('user_id', linkedUserIds)
        .in('course_type', courseAliases[courseType] ?? [courseType])
        .in('enrollment_status', ['enrolled', 'approved', 'completed', 'active', 'paid', 'pending'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: completion } = enrollment ? { data: null } : await serviceClient
        .from('course_completions')
        .select('id')
        .in('user_id', linkedUserIds)
        .in('course_type', courseAliases[courseType] ?? [courseType])
        .limit(1)
        .maybeSingle();
      if (!enrollment && !completion) {
        return new Response(
          JSON.stringify({ error: 'Course not purchased. Please enroll to access videos.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const selectedApiKey = getApiKey(libraryId);
    const requireApiKey = action !== 'getSignedUrl';
    if (requireApiKey && !selectedApiKey) {
      console.error(`No Bunny API key configured for library ${libraryId}. Set BUNNY_API_KEY_${libraryId} or BUNNY_API_KEY`);
      return new Response(
        JSON.stringify({ error: `Bunny API key not configured for library ${libraryId}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`Bunny.net request - Action: ${action}, LibraryId: ${libraryId}, VideoId: ${videoId}, Expires: ${expiresInHours || 24}h`);

    // Get video details
    if (action === 'getVideo' && videoId) {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
        {
          headers: {
            'AccessKey': selectedApiKey as string,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Bunny.net API error (${response.status}):`, errorText);
        throw new Error(`Bunny.net API error: ${response.status} - ${errorText}`);
      }

      const videoData = await response.json();
      console.log('Video data retrieved:', videoData.guid, 'Status:', videoData.status, 'Public:', videoData.isPublic);

      return new Response(JSON.stringify(videoData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a new video
    if (action === 'createVideo' && title) {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos`,
        {
          method: 'POST',
          headers: {
            'AccessKey': selectedApiKey as string,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            collectionId: collectionId || '',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Bunny.net API error: ${response.status}`);
      }

      const videoData = await response.json();
      console.log('Video created:', videoData.guid);

      return new Response(JSON.stringify(videoData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List all videos
    if (action === 'listVideos') {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=100`,
        {
          headers: {
            'AccessKey': selectedApiKey as string,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Bunny.net API error (${response.status}):`, errorText);
        throw new Error(`Bunny.net API error: ${response.status} - ${errorText}`);
      }

      const videosData = await response.json();
      console.log(`Retrieved ${videosData.items?.length || 0} videos`);
      
      // Log video access settings for debugging
      if (videosData.items?.length > 0) {
        console.log('First video access check:', {
          guid: videosData.items[0].guid,
          status: videosData.items[0].status,
          isPublic: videosData.items[0].isPublic,
          hasMP4Fallback: videosData.items[0].hasMP4Fallback
        });
      }

      return new Response(JSON.stringify(videosData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate signed URL for a video
    if (action === 'getSignedUrl' && videoId) {
      console.log(`Generating signed HLS URL`, {
        action: 'getSignedUrl',
        videoId,
        libraryId,
        expiresInHours: expiresInHours || 24,
        device,
        ua: userAgent,
        referrer
      });

      // Determine CDN hostname; prefer library info when available, otherwise fallback
      let cdnHostname = `vz-${libraryId}.b-cdn.net`;
      try {
        if (selectedApiKey) {
          const libraryResponse = await fetch(
            `https://video.bunnycdn.com/library/${libraryId}`,
            {
              headers: {
                'AccessKey': selectedApiKey,
                'Content-Type': 'application/json',
              },
            }
          );
          if (libraryResponse.ok) {
            const libraryData = await libraryResponse.json();
            const libHost =
              libraryData?.videoLibrary?.hostname ||
              libraryData?.hostName ||
              libraryData?.hostname ||
              libraryData?.pullZone?.hostname;
            if (libHost) {
              cdnHostname = libHost;
              console.log('Library CDN info:', { libraryId, cdnHostname, source: 'library' });
            } else {
              console.warn('CDN hostname missing in library data, using fallback', { libraryId, cdnHostname });
            }
          } else {
            const errorText = await libraryResponse.text();
            console.warn(`Library info fetch failed (${libraryResponse.status}), using fallback:`, errorText);
          }
        } else {
          console.warn('No Bunny API key provided; skipping library info fetch and using fallback hostname', { libraryId, cdnHostname });
        }
      } catch (e) {
        console.warn('Error fetching library info, using fallback hostname', { libraryId, cdnHostname, error: (e as Error).message });
      }

      // Get signing key
      const signingKey = getSigningKey(libraryId);
      if (!signingKey) {
        throw new Error(`Signing key not configured. Set BUNNY_SIGNING_KEY_${libraryId} or BUNNY_VIDEO_LIBRARY_KEY`);
      }

      const expiryTimestamp = Math.floor(Date.now() / 1000) + ((expiresInHours || 24) * 3600);
      
      // Generate token for HLS URL
      const signatureString = `${signingKey}${videoId}${expiryTimestamp}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // HLS URL format: https://{cdn-hostname}/{video-guid}/playlist.m3u8?token={hash}&expires={timestamp}
      const hlsUrl = `https://${cdnHostname}/${videoId}/playlist.m3u8?token=${token}&expires=${expiryTimestamp}`;
      
      // Also prepare iframe embed URL as a fallback for clients
      const iframeUrl = await generateSignedUrl(libraryId, videoId, expiresInHours || 24);
      
      console.log(`Generated HLS URL for video ${videoId}`, {
        device,
        cdnHostname,
        expires: new Date(expiryTimestamp * 1000).toISOString()
      });

      return new Response(JSON.stringify({ signedUrl: hlsUrl, iframeUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bunny-video function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
