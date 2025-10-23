-- Add UPDATE and DELETE policies for certificates table
-- Only admins can modify or delete certificates after issuance
CREATE POLICY "Only admins can update certificates"
ON certificates
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete certificates"
ON certificates
FOR DELETE
USING (is_admin(auth.uid()));

-- Add UPDATE and DELETE policies for course_completions table
-- Only admins can modify or delete completion records to ensure academic integrity
CREATE POLICY "Only admins can update course completions"
ON course_completions
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete course completions"
ON course_completions
FOR DELETE
USING (is_admin(auth.uid()));

-- Add UPDATE and DELETE policies for level3_approvals table
-- Only admins can modify or delete approval codes
CREATE POLICY "Only admins can update level3 approvals"
ON level3_approvals
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete level3 approvals"
ON level3_approvals
FOR DELETE
USING (is_admin(auth.uid()));