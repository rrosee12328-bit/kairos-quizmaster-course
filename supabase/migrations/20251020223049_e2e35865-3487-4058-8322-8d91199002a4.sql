-- Critical Security Fix: Make user_id required in enrollments table

-- First, we need to handle any existing NULL user_ids
-- Since we can't retroactively assign user_ids, we'll delete any orphaned enrollments
DELETE FROM enrollments WHERE user_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE enrollments ALTER COLUMN user_id SET NOT NULL;

-- Drop and recreate the INSERT policy to be more explicit about authentication
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON enrollments;

CREATE POLICY "Authenticated users can insert their own enrollments"
ON enrollments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);