-- Allow multiple passing completions per user/course for renewals
ALTER TABLE public.course_completions
DROP CONSTRAINT IF EXISTS unique_passing_completion;