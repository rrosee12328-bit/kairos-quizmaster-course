-- Add video completion and quiz tracking to course_progress
ALTER TABLE public.course_progress 
ADD COLUMN IF NOT EXISTS video_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quiz_passed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_quiz boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS section_completed boolean GENERATED ALWAYS AS (
  video_completed AND (NOT has_quiz OR quiz_passed)
) STORED;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course 
ON public.course_progress(user_id, course_type);

CREATE INDEX IF NOT EXISTS idx_course_progress_completion 
ON public.course_progress(user_id, course_type, section_id, section_completed);

-- Add course-level completion tracking
CREATE TABLE IF NOT EXISTS public.course_completions_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_type text NOT NULL,
  last_unlocked_section integer NOT NULL DEFAULT 1,
  course_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, course_type)
);

-- Enable RLS
ALTER TABLE public.course_completions_summary ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_completions_summary
CREATE POLICY "Users can view their own course summary"
ON public.course_completions_summary
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course summary"
ON public.course_completions_summary
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course summary"
ON public.course_completions_summary
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all course summaries"
ON public.course_completions_summary
FOR SELECT
USING (is_admin(auth.uid()));

-- Function to update course completion summary
CREATE OR REPLACE FUNCTION public.update_course_completion_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_completed_section integer;
  total_sections integer;
  completed_count integer;
BEGIN
  -- Get the highest completed section for this user/course
  SELECT COALESCE(MAX(section_id), 0)
  INTO max_completed_section
  FROM public.course_progress
  WHERE user_id = NEW.user_id
    AND course_type = NEW.course_type
    AND section_completed = true;
  
  -- Count total completed sections
  SELECT COUNT(*)
  INTO completed_count
  FROM public.course_progress
  WHERE user_id = NEW.user_id
    AND course_type = NEW.course_type
    AND section_completed = true;
  
  -- Define total sections per course (hardcoded for now)
  total_sections := CASE NEW.course_type
    WHEN 'level2' THEN 9
    WHEN 'level3' THEN 10
    WHEN 'level4' THEN 8
    WHEN 'pepper_spray' THEN 5
    ELSE 10
  END;
  
  -- Upsert course completion summary
  INSERT INTO public.course_completions_summary (
    user_id,
    course_type,
    last_unlocked_section,
    course_completed,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.course_type,
    GREATEST(max_completed_section + 1, 1),
    completed_count >= total_sections,
    now()
  )
  ON CONFLICT (user_id, course_type)
  DO UPDATE SET
    last_unlocked_section = GREATEST(EXCLUDED.last_unlocked_section, course_completions_summary.last_unlocked_section),
    course_completed = EXCLUDED.course_completed,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to update summary on course_progress changes
DROP TRIGGER IF EXISTS update_course_summary_trigger ON public.course_progress;
CREATE TRIGGER update_course_summary_trigger
AFTER INSERT OR UPDATE OF video_completed, quiz_passed ON public.course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_course_completion_summary();