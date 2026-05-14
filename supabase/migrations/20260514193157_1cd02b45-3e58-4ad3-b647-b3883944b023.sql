
-- Remove user-side INSERT permissions on records that must only be created server-side
DROP POLICY IF EXISTS "Users can insert their own completions" ON public.course_completions;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can insert their own course summary" ON public.course_completions_summary;
DROP POLICY IF EXISTS "Users can update their own course summary" ON public.course_completions_summary;
DROP POLICY IF EXISTS "Users can insert their own approval codes" ON public.level3_approvals;
