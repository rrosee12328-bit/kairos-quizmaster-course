-- Create course_completions table to track student progress
CREATE TABLE public.course_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_completions
CREATE POLICY "Users can view their own completions"
  ON public.course_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.course_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all completions"
  ON public.course_completions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create certificates table with unique registration numbers
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_id UUID NOT NULL REFERENCES public.course_completions(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  identification_type TEXT NOT NULL,
  last_six_digits TEXT NOT NULL,
  course_type TEXT NOT NULL,
  completion_date DATE NOT NULL,
  firearm_qualification_date DATE,
  firearm_category TEXT,
  firearm_caliber TEXT,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificates
CREATE POLICY "Users can view their own certificates"
  ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates"
  ON public.certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
  ON public.certificates
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create function to generate unique registration numbers
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_reg_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: KTA-L3-YYYYMMDD-XXXXX (e.g., KTA-L3-20250108-12345)
    new_reg_number := 'KTA-L3-' || 
                      to_char(now(), 'YYYYMMDD') || '-' || 
                      lpad(floor(random() * 99999)::text, 5, '0');
    
    -- Check if this number already exists
    SELECT EXISTS(
      SELECT 1 FROM public.certificates WHERE registration_number = new_reg_number
    ) INTO exists_check;
    
    -- Exit loop if unique number found
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_reg_number;
END;
$$;

-- Create indexes for better query performance
CREATE INDEX idx_course_completions_user_id ON public.course_completions(user_id);
CREATE INDEX idx_course_completions_course_type ON public.course_completions(course_type);
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_registration_number ON public.certificates(registration_number);