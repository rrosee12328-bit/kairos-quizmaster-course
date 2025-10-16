-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own enrollment" ON public.enrollments;

-- Create a more permissive INSERT policy that handles new signups better
-- Allow inserts when:
-- 1. The user_id matches the authenticated user, OR
-- 2. The user is authenticated (has a valid JWT)
CREATE POLICY "Users can create enrollments"
ON public.enrollments
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) OR
  (auth.uid() IS NOT NULL)
);