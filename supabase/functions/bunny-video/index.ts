import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUNNY_API_KEY = Deno.env.get('BUNNY_API_KEY');
const DEFAULT_SIGNING_KEY = Deno.env.get('BUNNY_VIDEO_LIBRARY_KEY');

function getSigningKey(libraryId: string): string | null {
  const envName = `BUNNY_SIGNING_KEY_${libraryId}`;
  const key = Deno.env.get(envName);
  return key || DEFAULT_SIGNING_KEY || null;
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
    if (!BUNNY_API_KEY) {
      throw new Error('BUNNY_API_KEY not configured');
    }

    const { action, videoId, title, collectionId, libraryId, expiresInHours } = await req.json();
    
    if (!libraryId) {
      throw new Error('libraryId is required');
    }

    console.log(`Bunny.net request - Action: ${action}, VideoId: ${videoId}`);

    // Get video details
    if (action === 'getVideo' && videoId) {
      const response = await fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
        {
          headers: {
            'AccessKey': BUNNY_API_KEY,
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
            'AccessKey': BUNNY_API_KEY,
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
            'AccessKey': BUNNY_API_KEY,
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
      const signedUrl = await generateSignedUrl(libraryId, videoId, expiresInHours || 24);
      console.log(`Generated signed URL for video ${videoId}, expires in ${expiresInHours || 24} hours`);

      return new Response(JSON.stringify({ signedUrl }), {
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
