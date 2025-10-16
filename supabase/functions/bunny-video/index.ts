import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUNNY_API_KEY = Deno.env.get('BUNNY_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BUNNY_API_KEY) {
      throw new Error('BUNNY_API_KEY not configured');
    }

    const { action, videoId, title, collectionId, libraryId } = await req.json();
    
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
