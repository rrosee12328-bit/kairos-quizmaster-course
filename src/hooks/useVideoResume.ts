import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVideoResume = (courseType: string, sectionId: number) => {
  const [savedPosition, setSavedPosition] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedPosition = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('course_progress')
          .select('last_video_position_seconds')
          .eq('user_id', user.id)
          .eq('course_type', courseType)
          .eq('section_id', sectionId)
          .maybeSingle();

        if (error) throw error;

        const position = (data as any)?.last_video_position_seconds || 0;
        
        // Only offer resume if more than 10 seconds in
        if (position > 10) {
          setSavedPosition(position);
          console.log('[useVideoResume] Found saved position:', position);
        }

        setLoading(false);
      } catch (error) {
        console.error('[useVideoResume] Error loading saved position:', error);
        setLoading(false);
      }
    };

    loadSavedPosition();
  }, [courseType, sectionId]);

  return { savedPosition, loading };
};
