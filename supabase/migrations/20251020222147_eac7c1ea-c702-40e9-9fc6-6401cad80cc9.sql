-- Fix enrollments table RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON enrollments;

-- Create secure SELECT policy - only allow users to view their own enrollments
CREATE POLICY "Users can view their own enrollments" 
ON enrollments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create secure INSERT policy - only allow users to create their own enrollments
CREATE POLICY "Users can insert their own enrollments" 
ON enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);