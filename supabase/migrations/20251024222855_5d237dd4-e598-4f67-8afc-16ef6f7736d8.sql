-- Add attempt tracking fields to course_completions table
ALTER TABLE public.course_completions
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Update existing records to have started_at and ended_at
UPDATE public.course_completions
SET 
  started_at = COALESCE(started_at, completed_at - INTERVAL '30 minutes'),
  ended_at = COALESCE(ended_at, completed_at)
WHERE started_at IS NULL OR ended_at IS NULL;

-- Calculate duration for existing records
UPDATE public.course_completions
SET duration_seconds = EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
WHERE duration_seconds IS NULL AND started_at IS NOT NULL AND ended_at IS NOT NULL;

-- Create function to auto-increment attempt_number
CREATE OR REPLACE FUNCTION public.set_attempt_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the max attempt number for this user and course, then increment
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO NEW.attempt_number
  FROM public.course_completions
  WHERE user_id = NEW.user_id 
    AND course_type = NEW.course_type;
  
  -- Set started_at if not provided
  IF NEW.started_at IS NULL THEN
    NEW.started_at = NEW.completed_at - INTERVAL '30 minutes';
  END IF;
  
  -- Set ended_at if not provided
  IF NEW.ended_at IS NULL THEN
    NEW.ended_at = NEW.completed_at;
  END IF;
  
  -- Calculate duration if not provided
  IF NEW.duration_seconds IS NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-set attempt number
DROP TRIGGER IF EXISTS set_attempt_number_trigger ON public.course_completions;
CREATE TRIGGER set_attempt_number_trigger
  BEFORE INSERT ON public.course_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_attempt_number();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_course_completions_user_course 
  ON public.course_completions(user_id, course_type, completed_at DESC);

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_course_completions_completed_at 
  ON public.course_completions(completed_at DESC);

COMMENT ON COLUMN public.course_completions.attempt_number IS 'Auto-incremented attempt number per user per course';
COMMENT ON COLUMN public.course_completions.started_at IS 'When the user started the exam/course attempt';
COMMENT ON COLUMN public.course_completions.ended_at IS 'When the user completed the exam/course attempt';
COMMENT ON COLUMN public.course_completions.duration_seconds IS 'Duration of the attempt in seconds';
COMMENT ON COLUMN public.course_completions.ip_address IS 'IP address of the user during attempt (for audit purposes)';
COMMENT ON COLUMN public.course_completions.user_agent IS 'User agent string during attempt (for audit purposes)';