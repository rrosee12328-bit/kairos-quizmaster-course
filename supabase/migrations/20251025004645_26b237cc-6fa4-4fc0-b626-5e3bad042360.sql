-- Add video watch time tracking to course_progress
ALTER TABLE public.course_progress 
ADD COLUMN video_started_at timestamp with time zone,
ADD COLUMN video_watch_time_seconds integer;

COMMENT ON COLUMN public.course_progress.video_started_at IS 'When the student started watching this video section';
COMMENT ON COLUMN public.course_progress.video_watch_time_seconds IS 'Total time spent watching this video in seconds';