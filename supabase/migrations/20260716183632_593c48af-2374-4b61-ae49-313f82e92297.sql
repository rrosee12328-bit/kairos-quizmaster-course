GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress TO authenticated;
GRANT ALL ON public.course_progress TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_completions TO authenticated;
GRANT ALL ON public.course_completions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_completions_summary TO authenticated;
GRANT ALL ON public.course_completions_summary TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.level3_approvals TO authenticated;
GRANT ALL ON public.level3_approvals TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_feedback TO authenticated;
GRANT ALL ON public.beta_feedback TO service_role;

GRANT SELECT ON public."Level 3 Security Officer" TO authenticated;
GRANT ALL ON public."Level 3 Security Officer" TO service_role;