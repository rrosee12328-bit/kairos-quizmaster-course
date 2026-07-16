GRANT SELECT, INSERT, UPDATE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.course_progress TO authenticated;
GRANT ALL ON public.course_progress TO service_role;

GRANT SELECT, UPDATE, DELETE ON public.course_completions TO authenticated;
GRANT ALL ON public.course_completions TO service_role;

GRANT SELECT, UPDATE, DELETE ON public.course_completions_summary TO authenticated;
GRANT ALL ON public.course_completions_summary TO service_role;

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;