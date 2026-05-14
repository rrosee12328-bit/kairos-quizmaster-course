-- 1. Make certificates bucket private (templates are fetched server-side)
UPDATE storage.buckets SET public = false WHERE id = 'certificates';

-- Drop overly permissive storage policies for certificates bucket
DROP POLICY IF EXISTS "Public read access for certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON storage.objects;

-- Admin-only access to certificates bucket templates
CREATE POLICY "Admins can read certificate templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certificates' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload certificate templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificates' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update certificate templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'certificates' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'certificates' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete certificate templates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certificates' AND public.is_admin(auth.uid()));

-- 2. Privilege escalation hardening: explicit restrictive policies on user_roles
-- The existing permissive admin ALL policy already blocks non-admins, but add
-- restrictive policies as defense-in-depth so inserts/updates/deletes are
-- categorically denied for anyone who isn't an admin.
CREATE POLICY "Only admins may insert user roles"
ON public.user_roles AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins may update user roles"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins may delete user roles"
ON public.user_roles AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove "Level 3 Security Officer" table from realtime publication
-- so non-admin authenticated users cannot subscribe to its row changes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'Level 3 Security Officer'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public."Level 3 Security Officer"';
  END IF;
END $$;