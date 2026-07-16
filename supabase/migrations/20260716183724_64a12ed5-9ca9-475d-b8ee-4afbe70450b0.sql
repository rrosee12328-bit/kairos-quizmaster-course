DROP POLICY IF EXISTS "Anyone can submit beta feedback" ON public.beta_feedback;

CREATE POLICY "Anyone can submit complete beta feedback"
ON public.beta_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name_role)) BETWEEN 1 AND 200
  AND length(btrim(experience_level)) BETWEEN 1 AND 200
  AND length(btrim(device_browser)) BETWEEN 1 AND 500
  AND length(btrim(testing_time)) BETWEEN 1 AND 200
  AND length(btrim(login_clarity)) BETWEEN 1 AND 2000
  AND length(btrim(layout_rating)) BETWEEN 1 AND 2000
  AND length(btrim(materials_location)) BETWEEN 1 AND 2000
  AND length(btrim(visual_design)) BETWEEN 1 AND 2000
  AND length(btrim(branding)) BETWEEN 1 AND 2000
  AND length(btrim(video_playback)) BETWEEN 1 AND 2000
  AND length(btrim(ai_assistant)) BETWEEN 1 AND 2000
  AND length(btrim(materials_usefulness)) BETWEEN 1 AND 2000
  AND length(btrim(content_engagement)) BETWEEN 1 AND 2000
  AND length(btrim(technical_issues)) BETWEEN 1 AND 2000
  AND length(btrim(test_location)) BETWEEN 1 AND 2000
  AND length(btrim(test_interface)) BETWEEN 1 AND 2000
  AND length(btrim(score_comm)) BETWEEN 1 AND 2000
  AND length(btrim(certificate_delivery)) BETWEEN 1 AND 2000
  AND length(btrim(certificate_download)) BETWEEN 1 AND 2000
  AND length(btrim(accessibility_issues)) BETWEEN 1 AND 2000
  AND length(btrim(mobile_adaptation)) BETWEEN 1 AND 2000
);