-- Create beta_feedback table to store feedback submissions
CREATE TABLE public.beta_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_role TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  device_browser TEXT NOT NULL,
  testing_time TEXT NOT NULL,
  login_clarity TEXT NOT NULL,
  layout_rating TEXT NOT NULL,
  materials_location TEXT NOT NULL,
  visual_design TEXT NOT NULL,
  branding TEXT NOT NULL,
  video_playback TEXT NOT NULL,
  ai_assistant TEXT NOT NULL,
  materials_usefulness TEXT NOT NULL,
  content_engagement TEXT NOT NULL,
  technical_issues TEXT NOT NULL,
  test_location TEXT NOT NULL,
  test_interface TEXT NOT NULL,
  score_comm TEXT NOT NULL,
  certificate_delivery TEXT NOT NULL,
  certificate_download TEXT NOT NULL,
  accessibility_issues TEXT NOT NULL,
  mobile_adaptation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public form)
CREATE POLICY "Anyone can submit beta feedback"
ON public.beta_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view feedback
CREATE POLICY "Admins can view all beta feedback"
ON public.beta_feedback
FOR SELECT
USING (is_admin(auth.uid()));