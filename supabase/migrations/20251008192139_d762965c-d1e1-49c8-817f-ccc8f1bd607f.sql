-- Fix RLS policy for enrollments to work with signup flow
DROP POLICY IF EXISTS "Users can create their own enrollment" ON enrollments;

CREATE POLICY "Users can create their own enrollment"
ON enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id);