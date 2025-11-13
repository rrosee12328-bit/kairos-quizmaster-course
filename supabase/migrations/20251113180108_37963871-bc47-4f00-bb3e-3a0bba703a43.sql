-- Add last video position tracking to course_progress table
ALTER TABLE public.course_progress 
ADD COLUMN IF NOT EXISTS last_video_position_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for faster resume queries
CREATE INDEX IF NOT EXISTS idx_course_progress_last_updated 
ON public.course_progress(user_id, course_type, last_updated_at DESC);

-- Add comment
COMMENT ON COLUMN public.course_progress.last_video_position_seconds IS 'Last known video playback position in seconds for resume functionality';