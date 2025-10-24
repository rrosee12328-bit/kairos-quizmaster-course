-- Add unique constraint to prevent duplicate passing completions
-- This ensures users can only have one passing completion per course
CREATE UNIQUE INDEX unique_passing_completion 
ON public.course_completions (user_id, course_type) 
WHERE passed = true;

-- Add comment explaining the constraint
COMMENT ON INDEX unique_passing_completion IS 'Prevents users from submitting multiple passing completions for the same course, maintaining certificate integrity';