
-- Revoke EXECUTE on SECURITY DEFINER helpers from API roles (anon, authenticated, public)
-- These functions are used internally (triggers, RLS helpers, edge functions via service role)
-- and must not be callable through PostgREST.
REVOKE EXECUTE ON FUNCTION public.generate_level3_approval_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_registration_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_section_completed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_attempt_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_course_completion_summary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Allow authenticated users to read their own certificate files in the private 'certificates' bucket.
-- Convention: certificate files are stored under a top-level folder named after the user's id, e.g. "{user_id}/cert.pdf".
CREATE POLICY "Users can read their own certificate files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
