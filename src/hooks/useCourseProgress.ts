import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCourseProgress = (courseType: string, totalSections: number) => {
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [courseType]);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('course_progress')
        .select('section_id, completed')
        .eq('user_id', user.id)
        .eq('course_type', courseType)
        .eq('completed', true);

      if (error) throw error;

      const completed = data?.map(p => p.section_id) || [];
      setCompletedSections(completed);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching course progress:', error);
      setLoading(false);
    }
  };

  const markSectionStart = async (sectionId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already exists
      const { data: existing } = await supabase
        .from('course_progress')
        .select('id, video_started_at')
        .eq('user_id', user.id)
        .eq('course_type', courseType)
        .eq('section_id', sectionId)
        .single();

      if (existing && !existing.video_started_at) {
        // Update with start time
        await supabase
          .from('course_progress')
          .update({
            video_started_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else if (!existing) {
        // Insert new with start time
        await supabase
          .from('course_progress')
          .insert({
            user_id: user.id,
            course_type: courseType,
            section_id: sectionId,
            video_started_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error marking section start:', error);
    }
  };

  const markSectionComplete = async (sectionId: number, watchTimeSeconds?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already exists
      const { data: existing } = await supabase
        .from('course_progress')
        .select('id, video_started_at')
        .eq('user_id', user.id)
        .eq('course_type', courseType)
        .eq('section_id', sectionId)
        .single();

      const updateData: any = {
        completed: true,
        completed_at: new Date().toISOString()
      };

      if (watchTimeSeconds) {
        updateData.video_watch_time_seconds = watchTimeSeconds;
      }

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('course_progress')
          .update(updateData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('course_progress')
          .insert({
            user_id: user.id,
            course_type: courseType,
            section_id: sectionId,
            video_started_at: new Date().toISOString(),
            ...updateData
          });

        if (error) throw error;
      }

      setCompletedSections(prev => 
        prev.includes(sectionId) ? prev : [...prev, sectionId]
      );
    } catch (error) {
      console.error('Error marking section complete:', error);
      toast.error('Failed to save progress');
    }
  };

  const progressPercentage = (completedSections.length / totalSections) * 100;
  const allSectionsComplete = completedSections.length === totalSections;

  return {
    completedSections,
    loading,
    markSectionStart,
    markSectionComplete,
    progressPercentage,
    allSectionsComplete
  };
};
