DO $$
BEGIN
  -- Level 3 Security Officer
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Level 3 Security Officer' AND policyname = 'Security admins can view security officers') THEN
    DROP POLICY "Security admins can view security officers" ON public."Level 3 Security Officer";
  END IF;
  CREATE POLICY "Security admins can view security officers" ON public."Level 3 Security Officer"
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Level 3 Security Officer' AND policyname = 'Security admins can insert security officers') THEN
    DROP POLICY "Security admins can insert security officers" ON public."Level 3 Security Officer";
  END IF;
  CREATE POLICY "Security admins can insert security officers" ON public."Level 3 Security Officer"
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Level 3 Security Officer' AND policyname = 'Security admins can update security officers') THEN
    DROP POLICY "Security admins can update security officers" ON public."Level 3 Security Officer";
  END IF;
  CREATE POLICY "Security admins can update security officers" ON public."Level 3 Security Officer"
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Level 3 Security Officer' AND policyname = 'Security admins can delete security officers') THEN
    DROP POLICY "Security admins can delete security officers" ON public."Level 3 Security Officer";
  END IF;
  CREATE POLICY "Security admins can delete security officers" ON public."Level 3 Security Officer"
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  -- Read-all admin policies on user data tables.
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'beta_feedback' AND policyname = 'Admins can view all beta feedback') THEN
    DROP POLICY "Admins can view all beta feedback" ON public.beta_feedback;
  END IF;
  CREATE POLICY "Admins can view all beta feedback" ON public.beta_feedback
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates' AND policyname = 'Admins can view all certificates') THEN
    DROP POLICY "Admins can view all certificates" ON public.certificates;
  END IF;
  CREATE POLICY "Admins can view all certificates" ON public.certificates
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_completions' AND policyname = 'Admins can view all completions') THEN
    DROP POLICY "Admins can view all completions" ON public.course_completions;
  END IF;
  CREATE POLICY "Admins can view all completions" ON public.course_completions
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_completions_summary' AND policyname = 'Admins can view all course summaries') THEN
    DROP POLICY "Admins can view all course summaries" ON public.course_completions_summary;
  END IF;
  CREATE POLICY "Admins can view all course summaries" ON public.course_completions_summary
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_progress' AND policyname = 'Admins can view all progress') THEN
    DROP POLICY "Admins can view all progress" ON public.course_progress;
  END IF;
  CREATE POLICY "Admins can view all progress" ON public.course_progress
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'enrollments' AND policyname = 'Admins can view all enrollments') THEN
    DROP POLICY "Admins can view all enrollments" ON public.enrollments;
  END IF;
  CREATE POLICY "Admins can view all enrollments" ON public.enrollments
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'level3_approvals' AND policyname = 'Admins can view all approval codes') THEN
    DROP POLICY "Admins can view all approval codes" ON public.level3_approvals;
  END IF;
  CREATE POLICY "Admins can view all approval codes" ON public.level3_approvals
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
    DROP POLICY "Admins can view all profiles" ON public.profiles;
  END IF;
  CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  -- Admin write policies.
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates' AND policyname = 'Only admins can update certificates') THEN
    DROP POLICY "Only admins can update certificates" ON public.certificates;
  END IF;
  CREATE POLICY "Only admins can update certificates" ON public.certificates
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'certificates' AND policyname = 'Only admins can delete certificates') THEN
    DROP POLICY "Only admins can delete certificates" ON public.certificates;
  END IF;
  CREATE POLICY "Only admins can delete certificates" ON public.certificates
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_completions' AND policyname = 'Only admins can update course completions') THEN
    DROP POLICY "Only admins can update course completions" ON public.course_completions;
  END IF;
  CREATE POLICY "Only admins can update course completions" ON public.course_completions
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_completions' AND policyname = 'Only admins can delete course completions') THEN
    DROP POLICY "Only admins can delete course completions" ON public.course_completions;
  END IF;
  CREATE POLICY "Only admins can delete course completions" ON public.course_completions
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'enrollments' AND policyname = 'Admins can update enrollments') THEN
    DROP POLICY "Admins can update enrollments" ON public.enrollments;
  END IF;
  CREATE POLICY "Admins can update enrollments" ON public.enrollments
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'level3_approvals' AND policyname = 'Only admins can update level3 approvals') THEN
    DROP POLICY "Only admins can update level3 approvals" ON public.level3_approvals;
  END IF;
  CREATE POLICY "Only admins can update level3 approvals" ON public.level3_approvals
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'level3_approvals' AND policyname = 'Only admins can delete level3 approvals') THEN
    DROP POLICY "Only admins can delete level3 approvals" ON public.level3_approvals;
  END IF;
  CREATE POLICY "Only admins can delete level3 approvals" ON public.level3_approvals
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::public.app_role, 'security_admin'::public.app_role)));

  -- Avoid SECURITY DEFINER helpers being callable from the browser.
  DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Only admins may insert user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Only admins may update user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Only admins may delete user roles" ON public.user_roles;
END $$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;