-- Create table for Level 3 approval codes
CREATE TABLE IF NOT EXISTS public.level3_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  approval_code text NOT NULL UNIQUE,
  completion_id uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.level3_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own approval codes"
  ON public.level3_approvals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own approval codes"
  ON public.level3_approvals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all approval codes"
  ON public.level3_approvals
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Function to generate unique approval code
CREATE OR REPLACE FUNCTION public.generate_level3_approval_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: L3A-YYYYMMDD-XXXXX (e.g., L3A-20250113-12345)
    new_code := 'L3A-' || 
                to_char(now(), 'YYYYMMDD') || '-' || 
                lpad(floor(random() * 99999)::text, 5, '0');
    
    -- Check if this code already exists and is not expired
    SELECT EXISTS(
      SELECT 1 FROM public.level3_approvals 
      WHERE approval_code = new_code 
      AND expires_at > now()
    ) INTO exists_check;
    
    -- Exit loop if unique code found
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_code;
END;
$$;