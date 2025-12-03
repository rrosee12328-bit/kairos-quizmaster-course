-- Fix existing broken progress records where video was clearly watched but not marked complete
-- This applies to all courses, not just level3

UPDATE course_progress 
SET video_completed = true
WHERE video_completed = false 
AND video_watch_time_seconds > 300
AND (has_quiz = false OR has_quiz IS NULL);