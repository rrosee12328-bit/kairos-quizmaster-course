-- Update enrollment insert policy to allow inserts during signup
DROP POLICY IF EXISTS "Users can create their own enrollment" ON enrollments;

CREATE POLICY "Users can create their own enrollment"
ON enrollments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (auth.jwt() IS NOT NULL AND email = auth.email())
);